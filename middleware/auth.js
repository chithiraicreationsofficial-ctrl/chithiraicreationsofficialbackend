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
const Admin = require("../models/Admin");
const { pool } = require("../config/postgres");

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || "your_admin_jwt_secret_key_here";

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
      decoded = jwt.verify(token, ADMIN_JWT_SECRET);
    } catch (error) {
      // Fallback to JWT_SECRET for legacy tokens
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || "your_super_secure_jwt_secret_here");
      } catch (err) {
        return res.status(200).json({
          success: false,
          message: "Admin token is invalid or expired",
        });
      }

      // Check if it's a legacy admin token
      if (decoded.role !== "admin" && decoded.role !== "super_admin") {
        return res.status(200).json({
          success: false,
          message: "Access denied. Admin privileges required.",
        });
      }

      // For legacy admin tokens, set admin object without DB check
      req.admin = {
        adminId: "legacy_admin",
        email: decoded.email || "admin1@chithiraicreations.com",
        name: decoded.name || "Admin",
        role: decoded.role || "admin",
      };
      return next();
    }

    // Check for legacy admin token format
    if (decoded.role === "admin" && !decoded.adminId) {
      req.admin = {
        adminId: "legacy_admin",
        email: decoded.email || "admin1@chithiraicreations.com",
        name: decoded.name || "Admin",
        role: "admin",
      };
      return next();
    }

    // Direct bypass for legacy_admin marker
    if (decoded.adminId === "legacy_admin") {
      req.admin = decoded;
      return next();
    }

    // 1. Check PostgreSQL first (Instant & High Reliability)
    if (decoded.adminId && decoded.adminId.toString().startsWith("pg_")) {
      const pgId = Number(decoded.adminId.replace("pg_", ""));
      try {
        const pgRes = await pool.query(
          "SELECT id, name, email, role FROM admins WHERE id = $1 AND is_active = true",
          [pgId]
        );
        if (pgRes.rows.length > 0) {
          req.admin = {
            ...decoded,
            adminId: `pg_${pgRes.rows[0].id}`,
            email: pgRes.rows[0].email,
            name: pgRes.rows[0].name,
            role: pgRes.rows[0].role,
          };
          return next();
        }
      } catch (pgErr) {}
    }

    if (decoded.email) {
      try {
        const pgRes = await pool.query(
          "SELECT id, name, email, role FROM admins WHERE LOWER(email) = LOWER($1) AND is_active = true",
          [decoded.email]
        );
        if (pgRes.rows.length > 0) {
          req.admin = {
            ...decoded,
            adminId: `pg_${pgRes.rows[0].id}`,
            email: pgRes.rows[0].email,
            name: pgRes.rows[0].name,
            role: pgRes.rows[0].role,
          };
          return next();
        }
      } catch (pgErr) {}
    }

    // 2. Fallback to MongoDB
    let admin = null;
    try {
      admin = await Admin.findOne({
        _id: decoded.adminId,
        email: decoded.email,
        isActive: true,
      }).maxTimeMS(4000);
    } catch (mErr) {}

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
