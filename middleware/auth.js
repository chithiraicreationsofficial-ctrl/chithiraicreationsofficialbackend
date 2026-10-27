// const jwt = require('jsonwebtoken');
// const User = require('../models/User');

// const auth = async (req, res, next) => {
//     try {
//         const token = req.header('Authorization')?.replace('Bearer ', '');

//         if (!token) {
//             return res.status(401).json({
//                 success: false,
//                 message: 'Access denied. No token provided.'
//             });
//         }

//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         const user = await User.findById(decoded.userId).select('-verificationToken');

//         if (!user) {
//             return res.status(401).json({
//                 success: false,
//                 message: 'Token is invalid - user not found'
//             });
//         }

//         if (!user.isEmailVerified) {
//             return res.status(401).json({
//                 success: false,
//                 message: 'Email not verified'
//             });
//         }

//         console.log(user);

//         req.user = user;
//         next();
//     } catch (error) {
//         res.status(401).json({
//             success: false,
//             message: 'Token is invalid'
//         });
//     }
// };

// const adminAuth = async (req, res, next) => {
//     try {
//         const token = req.header('Authorization')?.replace('Bearer ', '');

//         if (!token) {
//             return res.status(401).json({
//                 success: false,
//                 message: 'Access denied. No admin token provided.'
//             });
//         }

//         const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);

//         if (decoded.role !== 'admin') {
//             return res.status(403).json({
//                 success: false,
//                 message: 'Access denied. Admin privileges required.'
//             });
//         }

//         req.admin = decoded;
//         next();
//     } catch (error) {
//         res.status(401).json({
//             success: false,
//             message: 'Admin token is invalid'
//         });
//     }
// };

// module.exports = { auth, adminAuth };
// middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Admin = require("../models/Admin"); // Add this line

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select(
      "-verificationToken"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Token is invalid - user not found",
      });
    }

    if (!user.isEmailVerified) {
      return res.status(401).json({
        success: false,
        message: "Email not verified",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Token is invalid",
    });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(200).json({
        success: false,
        message: "Access denied. No admin token provided.",
      });
    }

    let decoded;

    // Try to decode with ADMIN_JWT_SECRET first
    try {
      decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    } catch (error) {
      // Fallback to JWT_SECRET for legacy tokens
      decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if it's a legacy admin token
      if (decoded.role !== "admin") {
        return res.status(200).json({
          success: false,
          message: "Access denied. Admin privileges required.",
        });
      }

      // For legacy admin tokens, set admin object without DB check
      req.admin = {
        adminId: "legacy_admin",
        email: "legacy@chithiraicreations.com",
        name: "Legacy Admin",
        role: "admin",
      };
      return next();
    }

    // Check for legacy admin token format
    if (decoded.role === "admin" && !decoded.adminId) {
      // This is the old admin token format
      req.admin = {
        adminId: "legacy_admin",
        email: "legacy@chithiraicreations.com",
        name: "Legacy Admin",
        role: "admin",
      };
      return next();
    }

    // New admin token format with adminId
    if (decoded.adminId === "legacy_admin") {
      req.admin = decoded;
      return next();
    }

    // For new admin tokens, check if admin exists and is active
    const admin = await Admin.findOne({
      _id: decoded.adminId,
      email: decoded.email,
      isActive: true,
    });

    if (!admin) {
      return res.status(200).json({
        success: false,
        message: "Admin account not found or inactive",
      });
    }

    // Add admin info from database to request
    req.admin = {
      ...decoded,
      adminId: admin._id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    };

    next();
  } catch (error) {
    console.error("Admin auth error:", error);

    // Handle specific JWT errors
    if (error.name === "TokenExpiredError") {
      return res.status(200).json({
        success: false,
        message: "Token expired. Please login again.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(200).json({
        success: false,
        message: "Invalid admin token",
      });
    }

    return res.status(200).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

// Optional: Combined auth that works for both users and admins
const anyAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(200).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // Try admin auth first
    try {
      const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);

      // If it's an admin token, set admin context
      if (decoded.role === "admin" || decoded.adminId) {
        // Simplified admin check for anyAuth
        req.admin = decoded;
        req.user = null;
        req.isAdmin = true;
        return next();
      }
    } catch (adminError) {
      // Not an admin token, continue to user auth
    }

    // Try user auth
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select(
        "-verificationToken"
      );

      if (!user) {
        throw new Error("User not found");
      }

      if (!user.isEmailVerified) {
        return res.status(200).json({
          success: false,
          message: "Email not verified",
        });
      }

      req.user = user;
      req.admin = null;
      req.isAdmin = false;
      next();
    } catch (userError) {
      throw new Error("Invalid token");
    }
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

module.exports = { auth, adminAuth, anyAuth };
