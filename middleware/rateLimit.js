const rateLimit = require('express-rate-limit');

// OTP rate limiter
const otpLimiter = rateLimit({
    windowMs: 2 * 60 * 1000, // 2 minutes
    max: 3, // Maximum 3 OTP requests per windowMs
    message: {
        success: false,
        message: 'Too many OTP requests. Please try again after 2 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Ticket booking limiter
const bookingLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Maximum 5 bookings per windowMs
    message: {
        success: false,
        message: 'Too many booking attempts. Please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Admin login limiter
const adminLoginLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // Maximum 5 login attempts
    message: {
        success: false,
        message: 'Too many login attempts. Please try again after 5 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    otpLimiter,
    bookingLimiter,
    adminLoginLimiter
};