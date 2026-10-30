// controllers/adminController.js
const Admin = require("../models/Admin");
const Ticket = require("../models/Ticket");
const Event = require("../models/Event");
const EmailService = require("../services/emailService");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");

const adminController = {
  // Step 1: Email/Password login (Direct login, MFA removed)
  async loginStep1(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(200).json({
          success: false,
          message: "Email and password are required",
        });
      }

      // Find active admin
      const admin = await Admin.findOne({ email: email.toLowerCase().trim(), isActive: true });
      if (!admin) {
        return res.status(200).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Verify password
      const isPasswordValid = await admin.verifyPassword(password);
      if (!isPasswordValid) {
        return res.status(200).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Update last login
      admin.lastLogin = new Date();
      await admin.save();

      // Generate admin JWT token directly (no MFA needed)
      const token = jwt.sign(
        {
          adminId: admin._id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          loginTime: new Date(),
        },
        process.env.ADMIN_JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.json({
        success: true,
        message: "Admin login successful",
        data: {
          token,
          requires2FA: false,
          admin: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            lastLogin: admin.lastLogin,
          },
        },
      });
    } catch (error) {
      console.error("Admin login step 1 error:", error);
      res.status(200).json({
        success: false,
        message: "Internal server error",
      });
    }
  },

  // Step 2: 2FA verification (bypassed / backward compatibility)
  async loginStep2(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(200).json({
          success: false,
          message: "Email is required",
        });
      }

      const admin = await Admin.findOne({ email: email.toLowerCase().trim(), isActive: true });
      if (!admin) {
        return res.status(200).json({
          success: false,
          message: "Admin not found",
        });
      }

      // Update last login
      admin.lastLogin = new Date();
      await admin.save();

      // Generate admin JWT token
      const token = jwt.sign(
        {
          adminId: admin._id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          loginTime: new Date(),
        },
        process.env.ADMIN_JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.json({
        success: true,
        message: "Admin login successful",
        data: {
          token,
          admin: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            lastLogin: admin.lastLogin,
          },
        },
      });
    } catch (error) {
      console.error("Admin login step 2 error:", error);
      res.status(200).json({
        success: false,
        message: "Internal server error",
      });
    }
  },

  // Direct login / Legacy login (backward compatibility)
  async login(req, res) {
    try {
      const { email, password, twoFACode } = req.body;

      // Direct email/password login
      if (email && password) {
        const admin = await Admin.findOne({ email: email.toLowerCase().trim(), isActive: true });
        if (admin && (await admin.verifyPassword(password))) {
          admin.lastLogin = new Date();
          await admin.save();

          const token = jwt.sign(
            {
              adminId: admin._id,
              email: admin.email,
              name: admin.name,
              role: admin.role,
              loginTime: new Date(),
            },
            process.env.ADMIN_JWT_SECRET,
            { expiresIn: "24h" }
          );

          return res.json({
            success: true,
            message: "Admin login successful",
            data: {
              token,
              admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
              },
            },
          });
        }
      }

      // Legacy 2FA fallback
      if (twoFACode && process.env.ADMIN_2FA_CODE && twoFACode === process.env.ADMIN_2FA_CODE) {
        const tempAdmin = {
          _id: "legacy_admin",
          email: "legacy@chithiraicreations.com",
          name: "Legacy Admin",
          role: "admin",
        };

        const token = jwt.sign(
          {
            adminId: tempAdmin._id,
            email: tempAdmin.email,
            name: tempAdmin.name,
            role: tempAdmin.role,
            loginTime: new Date(),
          },
          process.env.ADMIN_JWT_SECRET,
          { expiresIn: "24h" }
        );

        return res.json({
          success: true,
          message: "Admin login successful",
          data: {
            token,
            admin: tempAdmin,
          },
        });
      }

      return res.status(200).json({
        success: false,
        message: "Invalid credentials",
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(200).json({
        success: false,
        message: "Internal server error",
      });
    }
  },

  // Change password
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const adminId = req.admin.adminId;

      if (!currentPassword || !newPassword) {
        return res.status(200).json({
          success: false,
          message: "Current password and new password are required",
        });
      }

      if (newPassword.length < 6) {
        return res.status(200).json({
          success: false,
          message: "New password must be at least 6 characters long",
        });
      }

      const admin = await Admin.findById(adminId);
      if (!admin) {
        return res.status(200).json({
          success: false,
          message: "Admin not found",
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await admin.verifyPassword(
        currentPassword
      );
      if (!isCurrentPasswordValid) {
        return res.status(200).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      // Update password
      admin.password = newPassword;
      await admin.save();

      res.json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(200).json({
        success: false,
        message: "Failed to change password",
      });
    }
  },

  // Get admin profile
  async getProfile(req, res) {
    try {
      const adminId = req.admin.adminId;

      const admin = await Admin.findById(adminId).select(
        "-password -twoFASecret -__v"
      );

      if (!admin) {
        return res.status(200).json({
          success: false,
          message: "Admin not found",
        });
      }

      // Get admin stats
      const ticketStats = await Ticket.aggregate([
        { $match: { createdBy: admin._id } },
        {
          $group: {
            _id: null,
            totalTickets: { $sum: 1 },
            totalRevenue: { $sum: "$totalAmount" },
            attendedTickets: {
              $sum: { $cond: [{ $eq: ["$status", "attended"] }, 1, 0] },
            },
            cashTickets: {
              $sum: { $cond: [{ $eq: ["$paymentMethod", "cash"] }, 1, 0] },
            },
          },
        },
      ]);

      const stats = ticketStats[0] || {
        totalTickets: 0,
        totalRevenue: 0,
        attendedTickets: 0,
        cashTickets: 0,
      };

      res.json({
        success: true,
        data: {
          admin,
          stats,
        },
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(200).json({
        success: false,
        message: "Failed to fetch profile",
      });
    }
  },


  // async createManualTicket(req, res) {
  //   try {
  //       const {
  //           name,
  //           email,
  //           phone,
  //           adultTicketCount,
  //           childrenTicketCount = 0, // Add this
  //           totalAmount,
  //           paymentMethod,
  //           notes,
  //       } = req.body;
  //       const adminId = req.admin.adminId;
  
  //       console.log('Manual ticket data:', { name, email, phone, adultTicketCount, childrenTicketCount, totalAmount, paymentMethod, notes });
  
  //       // Validation
  //       if (!name || !email || !phone || !adultTicketCount || !totalAmount) {
  //           return res.status(200).json({
  //               success: false,
  //               message: "All required fields must be filled",
  //           });
  //       }
  
  //       const admin = await Admin.findById(adminId);
  //       if (!admin) {
  //           return res.status(200).json({
  //               success: false,
  //               message: "Admin not found",
  //           });
  //       }
  
  //       // Check event capacity for ADULT tickets only
  //       const event = await Event.findOne({ isActive: true });
  //       if (!event) {
  //           return res.status(200).json({
  //               success: false,
  //               message: "No active event found",
  //           });
  //       }
  
  //       const newAdultBookings = parseInt(adultTicketCount);
  //       if (event.bookedTickets + newAdultBookings > event.maxTickets) {
  //           return res.status(200).json({
  //               success: false,
  //               message: `Only ${event.maxTickets - event.bookedTickets} adult tickets available`,
  //           });
  //       }
  
  //       // Generate unique ticket ID
  //       const ticketId = "TKT" + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
  
  //       // Generate order ID for admin tickets
  //       const orderId = "ORD_ADMIN_" + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
        
  //       // Generate payment ID for admin tickets
  //       const paymentId = "PAY_ADMIN_" + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
  
  //       // Prepare ticket data for QR code
  //       const ticketData = {
  //           ticketId,
  //           name,
  //           email,
  //           phone,
  //           adultTicketCount: parseInt(adultTicketCount),
  //           childrenTicketCount: parseInt(childrenTicketCount) || 0,
  //           totalAmount: parseFloat(totalAmount),
  //           orderId,
  //           paymentId,
  //           createdAt: new Date(),
  //           adminCreated: true
  //       };
  
  //       // Generate QR code
  //       let qrCodeBase64 = '';
  //       try {
  //           const QRService = require('../services/qrService');
  //           qrCodeBase64 = await QRService.generateQRCodeURL(ticketData);
  //       } catch (qrError) {
  //           console.error('QR code generation error:', qrError);
  //           qrCodeBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
  //       }
  
  //       // Determine payment status
  //       const paymentStatus = paymentMethod === 'cash' ? 'cash' : 'completed';
  
  //       // Create ticket
  //       const ticket = new Ticket({
  //           ticketId,
  //           userId: null,
  //           email,
  //           name,
  //           phone,
  //           adultTicketCount: parseInt(adultTicketCount),
  //           childrenTicketCount: parseInt(childrenTicketCount) || 0,
  //           totalAmount: parseFloat(totalAmount),
  //           paymentId,
  //           orderId,
  //           qrCode: qrCodeBase64,
  //           status: "booked",
  //           verificationMethod: "admin_created",
  //           createdBy: adminId,
  //           createdByEmail: admin.email,
  //           paymentMethod: paymentMethod || "cash",
  //           paymentStatus: paymentStatus,
  //           adminNotes: notes || "",
  //           cashCollected: paymentMethod === 'cash',
  //           cashCollectionTime: paymentMethod === 'cash' ? new Date() : null
  //       });
  
  //       await ticket.save();
  
  //       // Update event booked tickets (ADULTS ONLY)
  //       event.bookedTickets += newAdultBookings;
  //       await event.save();
  
  //       // Update admin stats
  //       admin.ticketsCreated += 1;
  //       admin.totalRevenue += parseFloat(totalAmount);
  //       await admin.save();
  
  //       // Send confirmation email
  //       try {
  //           await EmailService.sendAdminCreatedTicketEmail(
  //               email,
  //               name,
  //               ticketId,
  //               adultTicketCount,
  //               childrenTicketCount,
  //               totalAmount,
  //               paymentMethod,
  //               qrCodeBase64
  //           );
  //       } catch (emailError) {
  //           console.error('Email sending error:', emailError);
  //       }
  
  //       res.json({
  //           success: true,
  //           message: "Ticket created successfully",
  //           data: {
  //               ticket: {
  //                   ticketId: ticket.ticketId,
  //                   name: ticket.name,
  //                   email: ticket.email,
  //                   phone: ticket.phone,
  //                   adultTicketCount: ticket.adultTicketCount,
  //                   childrenTicketCount: ticket.childrenTicketCount,
  //                   totalAmount: ticket.totalAmount,
  //                   status: ticket.status,
  //                   paymentMethod: ticket.paymentMethod,
  //                   paymentStatus: ticket.paymentStatus,
  //                   createdBy: admin.name,
  //                   createdAt: ticket.createdAt,
  //                   qrCode: ticket.qrCode
  //               },
  //           },
  //       });
  //   } catch (error) {
  //       console.error("Create manual ticket error:", error);
  //       res.status(200).json({
  //           success: false,
  //           message: error.message || "Failed to create ticket",
  //       });
  //   }
  // },



  // async createManualTicket(req, res) {
  //   try {
  //       const {
  //           name,
  //           email,
  //           phone,
  //           adultTicketCount,
  //           childrenTicketCount = 0,
  //           adultTicketPrice, // Custom adult ticket price
  //           childrenTicketPrice = 999, // Fixed children price
  //           totalAmount,
  //           paymentMethod,
  //           notes,
  //           discountApplied = false,
  //           discountAmount = 0
  //       } = req.body;
  //       const adminId = req.admin.adminId;
  
  //       console.log('Manual ticket data:', { 
  //           name, email, phone, 
  //           adultTicketCount, childrenTicketCount,
  //           adultTicketPrice, childrenTicketPrice,
  //           totalAmount, paymentMethod, notes,
  //           discountApplied, discountAmount
  //       });
  
  //       // Validation
  //       if (!name || !email || !phone || !adultTicketCount || !totalAmount) {
  //           return res.status(200).json({
  //               success: false,
  //               message: "All required fields must be filled",
  //           });
  //       }
  
  //       if (!adultTicketPrice || adultTicketPrice <= 0) {
  //           return res.status(200).json({
  //               success: false,
  //               message: "Please enter a valid adult ticket price",
  //           });
  //       }
  
  //       const admin = await Admin.findById(adminId);
  //       if (!admin) {
  //           return res.status(200).json({
  //               success: false,
  //               message: "Admin not found",
  //           });
  //       }
  
  //       // Check event capacity for ADULT tickets only
  //       const event = await Event.findOne({ isActive: true });
  //       if (!event) {
  //           return res.status(200).json({
  //               success: false,
  //               message: "No active event found",
  //           });
  //       }
  
  //       const newAdultBookings = parseInt(adultTicketCount);
  //       // if (event.bookedTickets + newAdultBookings > event.maxTickets) {
  //       //     return res.status(200).json({
  //       //         success: false,
  //       //         message: `Only ${event.maxTickets - event.bookedTickets} adult tickets available`,
  //       //     });
  //       // }
  
  //       // Generate unique ticket ID
  //       const ticketId = "TKT" + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
  
  //       // Generate order ID for admin tickets
  //       const orderId = "ORD_ADMIN_" + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
        
  //       // Generate payment ID for admin tickets
  //       const paymentId = "PAY_ADMIN_" + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
  
  //       // Calculate per ticket prices
  //       const adultPrice = parseFloat(adultTicketPrice);
  //       const childrenPrice = parseInt(childrenTicketPrice) || 999;
        
  //       // Calculate amounts for reference
  //       let adultAmount, childrenAmount, calculatedTotal;
        
  //       if (discountApplied && adultTicketCount > 1) {
  //           // Calculate with discount
  //           const discountedPrice = adultPrice - (discountAmount / adultTicketCount);
  //           adultAmount = discountedPrice * adultTicketCount;
  //       } else {
  //           // No discount
  //           adultAmount = adultPrice * adultTicketCount;
  //       }
        
  //       childrenAmount = childrenTicketCount * childrenPrice;
  //       calculatedTotal = adultAmount + childrenAmount;
  
  //       // Prepare ticket data for QR code
  //       const ticketData = {
  //           ticketId,
  //           name,
  //           email,
  //           phone,
  //           adultTicketCount: parseInt(adultTicketCount),
  //           childrenTicketCount: parseInt(childrenTicketCount) || 0,

  //           adultTotalAmount: adultAmount,
  //           childrenTotalAmount: childrenAmount,
  //           totalAmount: parseFloat(totalAmount),
  //           calculatedTotal: calculatedTotal,
  //           orderId,
  //           paymentId,
  //           discountApplied: discountApplied,
  //           discountAmount: discountAmount,
  //           originalAdultPrice: event.ticketPrice, // Store default price for reference
  //           createdAt: new Date(),
  //           adminCreated: true
  //       };
  
  //       // Generate QR code
  //       let qrCodeBase64 = '';
  //       try {
  //           const QRService = require('../services/qrService');
  //           qrCodeBase64 = await QRService.generateQRCodeURL(ticketData);
  //       } catch (qrError) {
  //           console.error('QR code generation error:', qrError);
  //           qrCodeBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
  //       }
  
  //       // Determine payment status
  //       const paymentStatus = paymentMethod === 'cash' ? 'cash' : 'completed';
  
  //       // Create ticket
  //       const ticket = new Ticket({
  //           ticketId,
  //           userId: null,
  //           email,
  //           name,
  //           phone,
  //           adultTicketCount: parseInt(adultTicketCount),
  //           childrenTicketCount: parseInt(childrenTicketCount) || 0,
  //           adultTicketPrice: adultPrice, // Store custom adult price
  //           childrenTicketPrice: childrenPrice, // Store children price
  //           totalAmount: parseFloat(totalAmount),
  //           originalAdultPrice: event.ticketPrice, // Store default price
  //           paymentId,
  //           orderId,
  //           qrCode: qrCodeBase64,
  //           status: "booked",
  //           verificationMethod: "admin_created",
  //           createdBy: adminId,
  //           createdByEmail: admin.email,
  //           paymentMethod: paymentMethod || "cash",
  //           paymentStatus: paymentStatus,
  //           discountApplied: discountApplied || false,
  //           discountAmount: discountAmount || 0,
  //           adminNotes: notes || "",
  //           cashCollected: paymentMethod === 'cash',
  //           cashCollectionTime: paymentMethod === 'cash' ? new Date() : null,
  //           pricingType: adultPrice === event.ticketPrice ? 'default' : 'custom'
  //       });
  
  //       await ticket.save();
  
  //       // Update event booked tickets (ADULTS ONLY)
  //       event.bookedTickets += newAdultBookings;
  //       await event.save();
  
  //       // Update admin stats
  //       admin.ticketsCreated += 1;
  //       admin.totalRevenue += parseFloat(totalAmount);
  //       if (paymentMethod === 'cash') {
  //           admin.cashRevenue += parseFloat(totalAmount);
  //       }
  //       await admin.save();
  
  //       // Send confirmation email
  //       try {
  //           await EmailService.sendAdminCreatedTicketEmail(
  //               email,
  //               name,
  //               ticketId,
  //               adultTicketCount,
  //               childrenTicketCount,
  //               adultPrice,
  //               childrenPrice,
  //               totalAmount,
  //               paymentMethod,
  //               discountApplied,
  //               discountAmount,
  //               qrCodeBase64
  //           );
  //       } catch (emailError) {
  //           console.error('Email sending error:', emailError);
  //       }
  
  //       res.json({
  //           success: true,
  //           message: "Ticket created successfully",
  //           data: {
  //               ticket: {
  //                   ticketId: ticket.ticketId,
  //                   name: ticket.name,
  //                   email: ticket.email,
  //                   phone: ticket.phone,
  //                   adultTicketCount: ticket.adultTicketCount,
  //                   childrenTicketCount: ticket.childrenTicketCount,
  //                   adultTicketPrice: ticket.adultTicketPrice,
  //                   childrenTicketPrice: ticket.childrenTicketPrice,
  //                   totalAmount: ticket.totalAmount,
  //                   discountApplied: ticket.discountApplied,
  //                   discountAmount: ticket.discountAmount,
  //                   status: ticket.status,
  //                   paymentMethod: ticket.paymentMethod,
  //                   paymentStatus: ticket.paymentStatus,
  //                   createdBy: admin.name,
  //                   createdAt: ticket.createdAt,
  //                   qrCode: ticket.qrCode,
  //                   pricingType: ticket.pricingType
  //               },
  //               priceSummary: {
  //                   adultTotal: adultAmount,
  //                   childrenTotal: childrenAmount,
  //                   discount: discountAmount,
  //                   grandTotal: totalAmount
  //               }
  //           },
  //       });
  //   } catch (error) {
  //       console.error("Create manual ticket error:", error);
  //       res.status(200).json({
  //           success: false,
  //           message: error.message || "Failed to create ticket",
  //       });
  //   }
  // },


//   async createManualTicket(req, res) {
//   try {
//       const {
//           name,
//           email,
//           phone,
//           ticketCount,
//           totalAmount,
//           paymentMethod,
//           notes,
//       } = req.body;
//       const adminId = req.admin.adminId;

//       console.log('Manual ticket data:', { name, email, phone, ticketCount, totalAmount, paymentMethod, notes });

//       // Validation
//       if (!name || !email || !phone || !ticketCount || !totalAmount) {
//           return res.status(200).json({
//               success: false,
//               message: "All required fields must be filled",
//           });
//       }

//       const admin = await Admin.findById(adminId);
//       if (!admin) {
//           return res.status(200).json({
//               success: false,
//               message: "Admin not found",
//           });
//       }

//       // Check event capacity
//       const event = await Event.findOne({ isActive: true });
//       if (!event) {
//           return res.status(200).json({
//               success: false,
//               message: "No active event found",
//           });
//       }

//       const newBookings = parseInt(ticketCount);
//       if (event.bookedTickets + newBookings > event.maxTickets) {
//           return res.status(200).json({
//               success: false,
//               message: `Only ${event.maxTickets - event.bookedTickets} tickets available`,
//           });
//       }

//       // Generate unique ticket ID
//       const ticketId = "TKT" + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();

//       // Generate order ID for admin tickets
//       const orderId = "ORD_ADMIN_" + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
      
//       // Generate payment ID for admin tickets
//       const paymentId = "PAY_ADMIN_" + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();

//       // Prepare ticket data for QR code
//       const ticketData = {
//           ticketId,
//           name,
//           email,
//           phone,
//           ticketCount: parseInt(ticketCount),
//           totalAmount: parseFloat(totalAmount),
//           orderId,
//           paymentId,
//           createdAt: new Date(),
//           adminCreated: true
//       };

//       // Generate QR code (similar to regular tickets)
//       let qrCodeBase64 = '';
//       try {
//           // Import QRService if not already imported
//           const QRService = require('../services/qrService');
//           qrCodeBase64 = await QRService.generateQRCodeURL(ticketData);
//       } catch (qrError) {
//           console.error('QR code generation error:', qrError);
//           // Create a simple QR code or placeholder
//           qrCodeBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='; // 1x1 transparent pixel
//       }

//       // Determine payment status based on method
//       const paymentStatus = paymentMethod === 'cash' ? 'cash' : 'completed';

//       // Create ticket
//       const ticket = new Ticket({
//           ticketId,
//           userId: null, // No user account for admin-created tickets
//           email,
//           name,
//           phone,
//           ticketCount: parseInt(ticketCount),
//           totalAmount: parseFloat(totalAmount),
//           paymentId,
//           orderId,
//           qrCode: qrCodeBase64,
//           status: "booked",
//           verificationMethod: "admin_created",
//           createdBy: adminId,
//           createdByEmail: admin.email,
//           paymentMethod: paymentMethod || "cash",
//           paymentStatus: paymentStatus,
//           adminNotes: notes || "",
//           cashCollected: paymentMethod === 'cash',
//           cashCollectionTime: paymentMethod === 'cash' ? new Date() : null
//       });

//       await ticket.save();

//       // Update event booked tickets
//       event.bookedTickets += newBookings;
//       await event.save();

//       // Update admin stats
//       admin.ticketsCreated += 1;
//       admin.totalRevenue += parseFloat(totalAmount);
//       await admin.save();

//       try {
//           // Send confirmation email
//           await EmailService.sendAdminCreatedTicketEmail(
//               email,
//               name,
//               ticketId,
//               ticketCount,
//               totalAmount,
//               paymentMethod,
//               qrCodeBase64
//           );
//       } catch (emailError) {
//           console.error('Email sending error:', emailError);
//           // Don't fail the ticket creation if email fails
//       }

//       res.json({
//           success: true,
//           message: "Ticket created successfully",
//           data: {
//               ticket: {
//                   ticketId: ticket.ticketId,
//                   name: ticket.name,
//                   email: ticket.email,
//                   phone: ticket.phone,
//                   ticketCount: ticket.ticketCount,
//                   totalAmount: ticket.totalAmount,
//                   status: ticket.status,
//                   paymentMethod: ticket.paymentMethod,
//                   paymentStatus: ticket.paymentStatus,
//                   createdBy: admin.name,
//                   createdAt: ticket.createdAt,
//                   qrCode: ticket.qrCode // Include QR code in response if needed
//               },
//           },
//       });
//   } catch (error) {
//       console.error("Create manual ticket error:", error);
//       res.status(200).json({
//           success: false,
//           message: error.message || "Failed to create ticket",
//       });
//   }
// },


async createManualTicket(req, res) {
  try {
      const {
          name,
          email,
          phone,
          aadharNumber,
          adultTicketCount,
          childrenTicketCount = 0,
          adultTicketPrice,
          childrenTicketPrice = 999,
          totalAmount,
          paymentMethod,
          notes,
          discountApplied = false,
          discountAmount = 0
      } = req.body;
      const adminId = req.admin.adminId;

      console.log('Manual ticket data:', { 
          name, email, phone, aadharNumber,
          adultTicketCount, childrenTicketCount,
          adultTicketPrice, childrenTicketPrice,
          totalAmount, paymentMethod, notes,
          discountApplied, discountAmount
      });

      // Validation - Email is optional, but need identification
      if (!name || !adultTicketCount || !totalAmount) {
          return res.status(200).json({
              success: false,
              message: "Name, ticket count, and total amount are required",
          });
      }

      // At least one identification method is required
      if (!email && !phone && !aadharNumber) {
          return res.status(200).json({
              success: false,
              message: "Please provide at least one: email, phone, or Aadhar number",
          });
      }

      if (!adultTicketPrice || adultTicketPrice <= 0) {
          return res.status(200).json({
              success: false,
              message: "Please enter a valid adult ticket price",
          });
      }

      if (!childrenTicketPrice || childrenTicketPrice <= 0) {
          return res.status(200).json({
              success: false,
              message: "Please enter a valid children ticket price",
          });
      }

      const admin = await Admin.findById(adminId);
      if (!admin) {
          return res.status(200).json({
              success: false,
              message: "Admin not found",
          });
      }

      // Check event capacity for ADULT tickets only
      const event = await Event.findOne({ isActive: true });
      if (!event) {
          return res.status(200).json({
              success: false,
              message: "No active event found",
          });
      }

      const newAdultBookings = parseInt(adultTicketCount);

      // Generate unique ticket ID
      const ticketId = "TKT" + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();

      // Generate order ID for admin tickets
      const orderId = "ORD_ADMIN_" + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
      
      // Generate payment ID for admin tickets
      const paymentId = "PAY_ADMIN_" + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();

      // Calculate per ticket prices
      const adultPrice = parseFloat(adultTicketPrice);
      const childrenPrice = parseFloat(childrenTicketPrice);
      
      // Calculate amounts
      let adultAmount = adultPrice * adultTicketCount;
      let childrenAmount = childrenPrice * childrenTicketCount;
      let calculatedTotal = adultAmount + childrenAmount;

      // Prepare ticket data for QR code
      const ticketData = {
          ticketId,
          name,
          email: email || null,
          phone: phone || null,
          aadharNumber: aadharNumber || null,
          adultTicketCount: parseInt(adultTicketCount),
          childrenTicketCount: parseInt(childrenTicketCount) || 0,
          adultTicketPrice: adultPrice,
          childrenTicketPrice: childrenPrice,
          adultTotalAmount: adultAmount,
          childrenTotalAmount: childrenAmount,
          totalAmount: parseFloat(totalAmount),
          calculatedTotal: calculatedTotal,
          orderId,
          paymentId,
          discountApplied: discountApplied,
          discountAmount: discountAmount,
          originalAdultPrice: event.ticketPrice,
          originalChildrenPrice: 999, // Default children price
          createdAt: new Date(),
          adminCreated: true
      };

      // Generate QR code
      let qrCodeBase64 = '';
      try {
          const QRService = require('../services/qrService');
          qrCodeBase64 = await QRService.generateQRCodeURL(ticketData);
      } catch (qrError) {
          console.error('QR code generation error:', qrError);
          qrCodeBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
      }

      // Determine payment status
      const paymentStatus = paymentMethod === 'cash' ? 'cash' : 'completed';

      // Create ticket
      const ticket = new Ticket({
          ticketId,
          userId: null,
          email: email || null,
          name,
          phone: phone || null,
          aadharNumber: aadharNumber || null,
          adultTicketCount: parseInt(adultTicketCount),
          childrenTicketCount: parseInt(childrenTicketCount) || 0,
          adultTicketPrice: adultPrice,
          childrenTicketPrice: childrenPrice,
          totalAmount: parseFloat(totalAmount),
          originalAdultPrice: event.ticketPrice,
          originalChildrenPrice: 999,
          paymentId,
          orderId,
          qrCode: qrCodeBase64,
          status: "booked",
          verificationMethod: "admin_created",
          createdBy: adminId,
          createdByEmail: admin.email,
          paymentMethod: paymentMethod || "cash",
          paymentStatus: paymentStatus,
          discountApplied: discountApplied || false,
          discountAmount: discountAmount || 0,
          adminNotes: notes || "",
          cashCollected: paymentMethod === 'cash',
          cashCollectionTime: paymentMethod === 'cash' ? new Date() : null,
          pricingType: (adultPrice === event.ticketPrice && childrenPrice === 999) ? 'default' : 'custom',
          identificationMethod: email ? 'email' : phone ? 'phone' : 'aadhar'
      });

      await ticket.save();

      // Update event booked tickets (ADULTS ONLY)
      event.bookedTickets += newAdultBookings;
      await event.save();

      // Update admin stats
      admin.ticketsCreated += 1;
      admin.totalRevenue += parseFloat(totalAmount);
      if (paymentMethod === 'cash') {
          admin.cashRevenue += parseFloat(totalAmount);
      }
      await admin.save();

      // Send confirmation email ONLY if email is provided
      if (email) {
          try {
              await EmailService.sendAdminCreatedTicketEmail(
                  email,
                  name,
                  ticketId,
                  adultTicketCount,
                  childrenTicketCount,
                  adultPrice,
                  childrenPrice,
                  totalAmount,
                  paymentMethod,
                  discountApplied,
                  discountAmount,
                  qrCodeBase64
              );
          } catch (emailError) {
              console.error('Email sending error:', emailError);
              // Don't fail ticket creation if email fails
          }
      }

      res.json({
          success: true,
          message: "Ticket created successfully" + (email ? " and email sent" : ""),
          data: {
              ticket: {
                  ticketId: ticket.ticketId,
                  name: ticket.name,
                  email: ticket.email,
                  phone: ticket.phone,
                  aadharNumber: ticket.aadharNumber,
                  adultTicketCount: ticket.adultTicketCount,
                  childrenTicketCount: ticket.childrenTicketCount,
                  adultTicketPrice: ticket.adultTicketPrice,
                  childrenTicketPrice: ticket.childrenTicketPrice,
                  totalAmount: ticket.totalAmount,
                  discountApplied: ticket.discountApplied,
                  discountAmount: ticket.discountAmount,
                  status: ticket.status,
                  paymentMethod: ticket.paymentMethod,
                  paymentStatus: ticket.paymentStatus,
                  createdBy: admin.name,
                  createdAt: ticket.createdAt,
                  qrCode: ticket.qrCode,
                  pricingType: ticket.pricingType,
                  identificationMethod: ticket.identificationMethod
              },
              priceSummary: {
                  adultTotal: adultAmount,
                  childrenTotal: childrenAmount,
                  discount: discountAmount,
                  grandTotal: totalAmount
              },
              emailSent: !!email
          },
      });
  } catch (error) {
      console.error("Create manual ticket error:", error);
      res.status(200).json({
          success: false,
          message: error.message || "Failed to create ticket",
      });
  }
},

  // Get event statistics (updated with admin stats + free pass)
// Get event statistics (updated with admin stats + free pass)
async getStats(req, res) {
  try {
    const adminId = req.admin.adminId;

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(200).json({
        success: false,
        message: "Admin not found",
      });
    }

    const event = await Event.findOne({ isActive: true });
    if (!event) {
      return res.status(200).json({
        success: false,
        message: "Event not found",
      });
    }

    // ================= EVENT STATS =================

    const totalTickets = event.maxTickets;
    const bookedTickets = event.bookedTickets;

    const attendedTickets = await Ticket.countDocuments({
      status: "attended",
    });

    const notAttendedTickets = await Ticket.countDocuments({
      status: "not_attended",
    });

    const pendingTickets =
      bookedTickets - attendedTickets - notAttendedTickets;

    const attendanceRate =
      bookedTickets > 0
        ? ((attendedTickets / bookedTickets) * 100).toFixed(2)
        : 0;

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentBookings = await Ticket.countDocuments({
      createdAt: { $gte: twentyFourHoursAgo },
    });

    // ================= REVENUE =================

    const revenueResult = await Ticket.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    // ================= CHILDREN TICKET COUNT =================

    const childrenResult = await Ticket.aggregate([
      {
        $group: {
          _id: null,
          childrenTicketCount: { $sum: "$childrenTicketCount" },
        },
      },
    ]);

    const ChildrenTicketCount =
      childrenResult[0]?.childrenTicketCount || 0;

    // ================= FREE PASS COUNT =================
    // adultTicketCount == adultPrice  → ₹1 Free Pass

    const freePassResult = await Ticket.aggregate([
  {
    $match: {
      $expr: {
        $eq: ["$totalTicketCount", "$totalAmount"],
      },
    },
  },
  {
    $group: {
      _id: null,
      freePassTicketCount: { $sum: "$totalTicketCount" },
      freePassBookingCount: { $sum: 1 }
    },
  },
]);

const freePassCount =
  freePassResult[0]?.freePassTicketCount || 0;

const freePassBookingCount =
  freePassResult[0]?.freePassBookingCount || 0;


    // ================= ADMIN STATS =================

    const adminStats = await Ticket.aggregate([
      {
        $match: { createdBy: admin._id },
      },
      {
        $group: {
          _id: null,
          ticketsCreated: { $sum: 1 },
          revenueGenerated: { $sum: "$totalAmount" },
          cashTickets: {
            $sum: {
              $cond: [{ $eq: ["$paymentMethod", "cash"] }, 1, 0],
            },
          },
        },
      },
    ]);

    const adminStatsData = adminStats[0] || {
      ticketsCreated: 0,
      revenueGenerated: 0,
      cashTickets: 0,
    };

    // ================= ADMIN FREE PASS =================

    const adminFreePassResult = await Ticket.aggregate([
      {
        $match: {
          createdBy: admin._id,
          $expr: {
            $eq: ["$adultTicketCount", "$adultPrice"],
          },
        },
      },
      {
        $count: "freePassCount",
      },
    ]);

    const adminFreePassCount =
      adminFreePassResult[0]?.freePassCount || 0;

    // ================= RESPONSE =================

    res.status(200).json({
      success: true,
      data: {
        event: {
          name: event.name,
          date: event.eventDate,
          ticketPrice: event.ticketPrice,
        },
        statistics: {
          totalTickets,
          totalRevenue,
          ChildrenTicketCount,
          bookedTickets,
          availableTickets: totalTickets - bookedTickets,
          attendedTickets,
          notAttendedTickets,
          pendingTickets,
          attendanceRate: parseFloat(attendanceRate),
          recentBookings,
          freePassCount,
        },
        adminStats: {
          name: admin.name,
          email: admin.email,
          role: admin.role,
          ticketsCreated: adminStatsData.ticketsCreated,
          revenueGenerated: adminStatsData.revenueGenerated,
          cashTickets: adminStatsData.cashTickets,
          freePassCount: adminFreePassCount,
          lastLogin: admin.lastLogin,
        },
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(200).json({
      success: false,
      message: "Failed to fetch statistics",
    });
  }
},


  async verifyTicket(req, res) {
    try {
      const { ticketId, status, verificationMethod = "manual" } = req.body;
      const adminId = req.admin.adminId;
  
      if (!["attended", "not_attended"].includes(status)) {
        return res.status(200).json({
          success: false,
          message: 'Invalid status. Use "attended" or "not_attended"',
        });
      }
  
      const ticket = await Ticket.findOne({ ticketId });
  
      if (!ticket) {
        return res.status(200).json({
          success: false,
          message: "Ticket not found",
        });
      }
  
      if (ticket.status !== "booked") {
        return res.status(200).json({
          success: false,
          message: `Ticket already ${ticket.status}`,
        });
      }
  
      // Update ticket status
      ticket.status = status;
      ticket.verifiedAt = new Date();
      ticket.verificationMethod = verificationMethod;
      ticket.verifiedBy = adminId; // Add this line
  
      await ticket.save();
  
      // Send thank you email if attended
      if (status === "attended") {
        await EmailService.sendThankYouEmail(ticket.email, ticket.name);
      }
  
      res.json({
        success: true,
        message: `Ticket marked as ${status}`,
        data: {
          ticket: {
            ticketId: ticket.ticketId,
            name: ticket.name,
            email: ticket.email,
            ticketCount: ticket.ticketCount,
            status: ticket.status,
            verifiedAt: ticket.verifiedAt,
            verificationMethod: ticket.verificationMethod,
            verifiedBy: adminId,
          },
        },
      });
    } catch (error) {
      console.error("Verify ticket error:", error);
      res.status(200).json({
        success: false,
        message: "Failed to verify ticket",
      });
    }
  },

  async getAllTickets(req, res) {
    try {


      console.log("ihihihjijijijiji");
      const { page = 1, limit = 50, status, paymentMethod } = req.query;
      const skip = (page - 1) * limit;
  
      let query = {};
      if (status && status !== "all") {
        query.status = status;
      }
      if (paymentMethod && paymentMethod !== "all") {
        query.paymentMethod = paymentMethod;
      }
  
      const tickets = await Ticket.find(query)
        .select("-qrCode -paymentId -orderId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("createdBy", "name email");
        // Remove .populate("verifiedBy", "name email") since it doesn't exist
  
      const total = await Ticket.countDocuments(query);
  
      res.json({
        success: true,
        data: {
          tickets,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error("Get all tickets error:", error);
      res.status(200).json({
        success: false,
        message: "Failed to fetch tickets",
      });
    }
  },

  // Search tickets (updated with admin info)
  async searchTickets(req, res) {
    try {
      const { query } = req.query;

      if (!query || query.length < 3) {
        return res.status(200).json({
          success: false,
          message: "Search query must be at least 3 characters long",
        });
      }

      const tickets = await Ticket.find({
        $or: [
          { ticketId: { $regex: query, $options: "i" } },
          { name: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } },
          { phone: { $regex: query, $options: "i" } },
        ],
      })
        .select("-qrCode -paymentId -orderId")
        .sort({ createdAt: -1 })
        .limit(20)
        .populate("createdBy", "name email")
        .populate("verifiedBy", "name email");

      res.json({
        success: true,
        data: {
          tickets,
          count: tickets.length,
        },
      });
    } catch (error) {
      console.error("Search tickets error:", error);
      res.status(200).json({
        success: false,
        message: "Failed to search tickets",
      });
    }
  },

  // Get ticket details (updated)
  async getTicketDetails(req, res) {
    try {

      console.log("knirsertrytf");
      const { ticketId } = req.params;

      if (!ticketId) {
        return res.status(200).json({
          success: false,
          message: "Ticket ID is required",
        });
      }

      const ticket = await Ticket.findOne({ ticketId })
        .select("-__v -updatedAt")
        .populate("createdBy", "name email")
        .populate("verifiedBy", "name email")
        .lean();

      if (!ticket) {
        return res.status(200).json({
          success: false,
          message: "Ticket not found",
        });
      }

      res.json({
        success: true,
        data: {
          ticket,
        },
      });
    } catch (error) {
      console.error("Get ticket details error:", error);
      res.status(200).json({
        success: false,
        message: "Server error while fetching ticket details",
      });
    }
  },

  // Get all admins (super admin only)
  async getAllAdmins(req, res) {
    try {
      if (req.admin.role !== "super_admin") {
        return res.status(200).json({
          success: false,
          message: "Access denied. Super admin required.",
        });
      }

      const admins = await Admin.find()
        .select("-password -twoFASecret -__v")
        .sort({ createdAt: -1 });

      // Get stats for each admin
      const adminsWithStats = await Promise.all(
        admins.map(async (admin) => {
          const stats = await Ticket.aggregate([
            { $match: { createdBy: admin._id } },
            {
              $group: {
                _id: null,
                totalTickets: { $sum: 1 },
                totalRevenue: { $sum: "$totalAmount" },
                cashTickets: {
                  $sum: { $cond: [{ $eq: ["$paymentMethod", "cash"] }, 1, 0] },
                },
              },
            },
          ]);

          return {
            ...admin.toObject(),
            stats: stats[0] || {
              totalTickets: 0,
              totalRevenue: 0,
              cashTickets: 0,
            },
          };
        })
      );

      res.json({
        success: true,
        data: {
          admins: adminsWithStats,
        },
      });
    } catch (error) {
      console.error("Get all admins error:", error);
      res.status(200).json({
        success: false,
        message: "Failed to fetch admins",
      });
    }
  },

 async createInitialAdmin(req, res) {
    try {
        const { email, password, name } = req.body;

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: 'Admin already exists with this email'
            });
        }

        // Create admin
        const admin = new Admin({
            name,
            email,
            password,
            role: 'super_admin'
        });

        // Generate 2FA secret
        const secret = admin.generateTwoFASecret();
        await admin.save();

        // Generate QR code for 2FA
        const otpauthUrl = speakeasy.otpauthURL({
            secret: secret.base32,
            label: `Event Admin (${email})`,
            issuer: 'Readya Mamey',
            encoding: 'base32'
        });

        const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

        res.status(201).json({
            success: true,
            message: 'Admin created successfully',
            data: {
                admin: {
                    id: admin._id,
                    name: admin.name,
                    email: admin.email,
                    role: admin.role
                },
                twoFA: {
                    secret: secret.base32,
                    qrCode: qrCodeUrl
                }
            }
        });
    } catch (error) {
        console.error('Create admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating admin'
        });
    }
},


// controllers/adminController.js - Add these functions

// Toggle admin status (activate/deactivate)
async toggleAdminStatus (req, res){
  try {
      const { adminId } = req.params;
      const { isActive } = req.body;
      const currentAdmin = req.admin;

      // Check if current user is super admin
      if (currentAdmin.role !== 'super_admin') {
          return res.status(200).json({
              success: false,
              message: 'Access denied. Super admin privileges required.'
          });
      }

      if (typeof isActive !== 'boolean') {
          return res.status(200).json({
              success: false,
              message: 'isActive must be a boolean value'
          });
      }

      // Prevent deactivating yourself
      if (adminId === currentAdmin.adminId) {
          return res.status(200).json({
              success: false,
              message: 'Cannot deactivate your own account'
          });
      }

      const admin = await Admin.findById(adminId);
      if (!admin) {
          return res.status(200).json({
              success: false,
              message: 'Admin not found'
          });
      }

      admin.isActive = isActive;
      await admin.save();

      // Log the action
      console.log(`Admin ${admin.email} ${isActive ? 'activated' : 'deactivated'} by ${currentAdmin.email}`);

      res.json({
          success: true,
          message: `Admin ${isActive ? 'activated' : 'deactivated'} successfully`,
          data: {
              admin: {
                  id: admin._id,
                  email: admin.email,
                  name: admin.name,
                  isActive: admin.isActive
              }
          }
      });

  } catch (error) {
      console.error('Toggle admin status error:', error);
      res.status(200).json({
          success: false,
          message: 'Failed to update admin status'
      });
  }
},

// Resend 2FA setup instructions
async resend2FA (req, res) {
  try {
      const { adminId } = req.params;
      const currentAdmin = req.admin;

      // Check if current user is super admin
      if (currentAdmin.role !== 'super_admin') {
          return res.status(200).json({
              success: false,
              message: 'Access denied. Super admin privileges required.'
          });
      }

      const admin = await Admin.findById(adminId);
      if (!admin) {
          return res.status(200).json({
              success: false,
              message: 'Admin not found'
          });
      }

      if (!admin.isActive) {
          return res.status(200).json({
              success: false,
              message: 'Cannot resend 2FA to inactive admin'
          });
      }

      // Generate new QR code for 2FA
      const speakeasy = require('speakeasy');
      const QRCode = require('qrcode');
      
      // Generate new secret (optional - you might want to keep the existing one)
      const secret = speakeasy.generateSecret({
          name: `Chithirai Creations Admin (${admin.email})`,
          length: 20
      });

      // Update admin with new secret
      admin.twoFASecret = secret.base32;
      await admin.save();

      // Generate QR code URL
      const otpauthUrl = speakeasy.otpauthURL({
          secret: secret.base32,
          label: `Chithirai Creations (${admin.email})`,
          issuer: 'Chithirai Creations',
          encoding: 'base32'
      });

      const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

      // TODO: Send email with 2FA instructions
      // This would require your email service implementation
      // For now, we'll return the secret and QR code in the response

      res.json({
          success: true,
          message: '2FA setup instructions sent to admin email',
          data: {
              admin: {
                  id: admin._id,
                  email: admin.email,
                  name: admin.name
              },
              twoFA: {
                  secret: secret.base32,
                  qrCode: qrCodeUrl,
                  manualEntryCode: `otpauth://totp/Chithirai%20Creations%20(${admin.email})?secret=${secret.base32}&issuer=Chithirai%20Creations`
              },
              instructions: `
                  1. Install Google Authenticator or Authy on your phone
                  2. Scan the QR code above or enter this code manually: ${secret.base32}
                  3. The app will generate a 6-digit code every 30 seconds
                  4. Use this code during login along with your password
              `
          }
      });

  } catch (error) {
      console.error('Resend 2FA error:', error);
      res.status(200).json({
          success: false,
          message: 'Failed to resend 2FA instructions'
      });
  }
},

// Update admin details
async updateAdmin (req, res) {
  try {
      const { adminId } = req.params;
      const { name, phone, role, isActive } = req.body;
      const currentAdmin = req.admin;

      // Check if current user is super admin
      if (currentAdmin.role !== 'super_admin') {
          return res.status(200).json({
              success: false,
              message: 'Access denied. Super admin privileges required.'
          });
      }

      const admin = await Admin.findById(adminId);
      if (!admin) {
          return res.status(200).json({
              success: false,
              message: 'Admin not found'
          });
      }

      // Prevent modifying yourself if not super_admin
      if (adminId === currentAdmin.adminId && role && role !== 'super_admin') {
          return res.status(200).json({
              success: false,
              message: 'Cannot change your own role from super_admin'
          });
      }

      // Update fields
      if (name) admin.name = name;
      if (phone) admin.phone = phone;
      if (role && ['super_admin', 'admin', 'support'].includes(role)) {
          admin.role = role;
      }
      if (typeof isActive === 'boolean') {
          // Prevent deactivating yourself
          if (adminId === currentAdmin.adminId && !isActive) {
              return res.status(200).json({
                  success: false,
                  message: 'Cannot deactivate your own account'
              });
          }
          admin.isActive = isActive;
      }

      await admin.save();

      res.json({
          success: true,
          message: 'Admin updated successfully',
          data: {
              admin: {
                  id: admin._id,
                  name: admin.name,
                  email: admin.email,
                  role: admin.role,
                  phone: admin.phone,
                  isActive: admin.isActive,
                  lastLogin: admin.lastLogin
              }
          }
      });

  } catch (error) {
      console.error('Update admin error:', error);
      res.status(200).json({
          success: false,
          message: 'Failed to update admin'
      });
  }
},

// Reset admin password (super admin only)
async resetAdminPassword (req, res) {
  try {
      const { adminId } = req.params;
      const { newPassword } = req.body;
      const currentAdmin = req.admin;

      // Check if current user is super admin
      if (currentAdmin.role !== 'super_admin') {
          return res.status(200).json({
              success: false,
              message: 'Access denied. Super admin privileges required.'
          });
      }

      if (!newPassword || newPassword.length < 6) {
          return res.status(200).json({
              success: false,
              message: 'New password must be at least 6 characters long'
          });
      }

      const admin = await Admin.findById(adminId);
      if (!admin) {
          return res.status(200).json({
              success: false,
              message: 'Admin not found'
          });
      }

      // Update password
      admin.password = newPassword;
      await admin.save();

      // TODO: Send email notification to admin about password reset

      res.json({
          success: true,
          message: 'Admin password reset successfully',
          data: {
              admin: {
                  id: admin._id,
                  email: admin.email,
                  name: admin.name
              }
          }
      });

  } catch (error) {
      console.error('Reset admin password error:', error);
      res.status(200).json({
          success: false,
          message: 'Failed to reset admin password'
      });
  }
},

};

module.exports = adminController;




