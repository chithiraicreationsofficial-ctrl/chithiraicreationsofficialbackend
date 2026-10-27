const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { auth, adminAuth } = require('../middleware/auth');
const { validateTicketBooking } = require('../middleware/validation');
const { bookingLimiter } = require('../middleware/rateLimit');

// Protected routes (require user authentication)
router.use(auth);

// Verify payment after Razorpay success
router.post('/verify', bookingLimiter, validateTicketBooking, paymentController.verifyPayment);

// Get payment status
router.get('/status/:orderId', paymentController.getPaymentStatus);

// Handle payment failure
router.post('/failure', bookingLimiter, paymentController.handlePaymentFailure);

// Admin only routes
router.use(adminAuth);

// Refund payment
router.post('/refund', paymentController.refundPayment);

// Get all payments (admin)
router.get('/all', paymentController.getAllPayments);

module.exports = router;