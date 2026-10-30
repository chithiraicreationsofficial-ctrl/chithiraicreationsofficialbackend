
const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const sponsorshipController = require("../controllers/sponsorshipController");
const { adminAuth } = require("../middleware/auth");
const { validateAdminLogin } = require("../middleware/validation");
const { adminLoginLimiter } = require("../middleware/rateLimit");

// Public routes
router.post("/auth/login", adminLoginLimiter, adminController.loginStep1);
router.post("/auth/login-step1", adminLoginLimiter, adminController.loginStep1);
router.post("/auth/login-step2", adminLoginLimiter, adminController.loginStep2);

// Legacy login (backward compatibility)
router.post(
  "/login",
  adminLoginLimiter,
  validateAdminLogin,
  adminController.login
);

// Protected routes

router.get("/tickets", adminController.getAllTickets);
router.get("/tickets/:ticketId", adminController.getTicketDetails);


router.use(adminAuth);

// Profile & settings
router.get("/profile", adminController.getProfile);
router.post("/change-password", adminController.changePassword);

// Dashboard & tickets
router.get("/stats", adminController.getStats);
router.get("/tickets/search", adminController.searchTickets);
router.post("/tickets/manual", adminController.createManualTicket);
router.post("/verify-ticket", adminController.verifyTicket);

// Admin management (super admin only)
router.get("/admins", adminController.getAllAdmins);
router.post('/management/create', adminController.createInitialAdmin);

router.put('/management/:adminId', adminController.updateAdmin);
router.put('/management/:adminId/status', adminController.toggleAdminStatus);
router.post('/management/:adminId/resend-2fa', adminController.resend2FA);
router.post('/management/:adminId/reset-password', adminController.resetAdminPassword);



// Get all sponsorships


router.get("/sponsorships/", sponsorshipController.getAllSponsorships);

// Get sponsorship by ID
router.get("/sponsorships/:id", sponsorshipController.getSponsorshipById);

// Update sponsorship status
router.put("/sponsorships/:id/status", sponsorshipController.updateSponsorshipStatus);

// Assign sponsorship to admin
router.put("/sponsorships/:id/assign", sponsorshipController.assignSponsorship);

// Schedule follow-up
router.put("/sponsorships/:id/follow-up", sponsorshipController.scheduleFollowUp);

// Add contract details
router.put("/sponsorships/:id/contract", sponsorshipController.addContractDetails);


// Get statistics
router.get("/sponsorships/stats/dashboard", sponsorshipController.getSponsorshipStats);

// Export sponsorships
router.get("/sponsorships/export/csv", sponsorshipController.exportSponsorships);

// Delete sponsorship
router.delete("/sponsorships/:id", sponsorshipController.deleteSponsorship);



module.exports = router;
