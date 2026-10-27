const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateEmailVerification, validateOTPVerification } = require('../middleware/validation');
const { otpLimiter } = require('../middleware/rateLimit');

// Send OTP
router.post('/send-otp', otpLimiter, validateEmailVerification, authController.sendOTP);

// Verify OTP
router.post('/verify-otp', validateOTPVerification, authController.verifyOTP);

// Resend OTP
router.post('/resend-otp', otpLimiter, validateEmailVerification, authController.resendOTP);

module.exports = router;