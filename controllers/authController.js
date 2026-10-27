const User = require('../models/User');
const OTPService = require('../services/otpService');
const EmailService = require('../services/emailService');
const jwt = require('jsonwebtoken');

const authController = {
    // Send OTP to email
    async sendOTP(req, res) {
        try {
            const { email } = req.body;

            // Check if user already exists and is verified
            const existingUser = await User.findOne({ email });
        


            const otp = await OTPService.createOTP(email);
            const emailSent = await EmailService.sendOTP(email, otp);

            if (!emailSent) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to send OTP email'
                });
            }

            const remainingTime = await OTPService.getRemainingTime(email);

            res.json({
                success: true,
                message: 'OTP sent successfully',
                data: {
                    expiresIn: remainingTime
                }
            });

        } catch (error) {
            console.error('Send OTP error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // Verify OTP
    async verifyOTP(req, res) {
        try {
            const { email, otp, phone, name } = req.body;

            const verificationResult = await OTPService.verifyOTP(email, otp);

            if (!verificationResult.success) {
                return res.status(400).json({
                    success: false,
                    message: verificationResult.message
                });
            }

            // Find or create user
            let user = await User.findOne({ email });

            if (!user) {
                // Create new user with email only (other details will be added during booking)
                user = new User({
                    email,
                    phone,
                    isEmailVerified: true
                });
            } else {
                user.isEmailVerified = true;
            }

            await user.save();

            // Generate JWT token (1 hour expiry)
            const token = jwt.sign(
                {
                    userId: user._id,
                    email: user.email
                },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            res.json({
                success: true,
                message: 'Email verified successfully',
                data: {
                    token,
                    user: {
                        id: user._id,
                        email: user.email,
                        isEmailVerified: user.isEmailVerified
                    }
                }
            });

        } catch (error) {
            console.error('Verify OTP error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // Resend OTP
    async resendOTP(req, res) {
        try {
            const { email } = req.body;

            const otp = await OTPService.createOTP(email);
            const emailSent = await EmailService.sendOTP(email, otp);

            if (!emailSent) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to resend OTP email'
                });
            }

            const remainingTime = await OTPService.getRemainingTime(email);

            res.json({
                success: true,
                message: 'OTP resent successfully',
                data: {
                    expiresIn: remainingTime
                }
            });

        } catch (error) {
            console.error('Resend OTP error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
};

module.exports = authController;