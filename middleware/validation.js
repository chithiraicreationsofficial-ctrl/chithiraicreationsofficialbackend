const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

const validateEmailVerification = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    handleValidationErrors
];

const validateOTPVerification = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('otp')
        .isLength({ min: 6, max: 6 })
        .isNumeric()
        .withMessage('OTP must be 6 digits'),
    handleValidationErrors
];

const validateTicketBooking = [
    body('name')
        .notEmpty()
        .trim()
        .withMessage('Name is required'),
    body('phone')
        .isMobilePhone()
        .withMessage('Please provide a valid phone number'),
    body('ticketCount')
        .isInt({ min: 1, max: 10 })
        .withMessage('Ticket count must be between 1 and 10'),
    handleValidationErrors
];

const validateAdminLogin = [
    (req, res, next) => {
        if ((req.body.email && req.body.password) || req.body.twoFACode) {
            return next();
        }
        return res.status(200).json({
            success: false,
            message: 'Email and password are required'
        });
    }
];

module.exports = {
    validateEmailVerification,
    validateOTPVerification,
    validateTicketBooking,
    validateAdminLogin,
    handleValidationErrors
};