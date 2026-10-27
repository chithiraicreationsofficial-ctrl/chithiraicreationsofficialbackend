const OTP = require('../models/OTP');
const otpGenerator = require('otp-generator');

class OTPService {
    generateOTP() {
        return otpGenerator.generate(6, {
            digits: true,
            lowerCaseAlphabets: false,
            upperCaseAlphabets: false,
            specialChars: false
        });
    }

    async createOTP(email) {
        // Delete any existing OTP for this email
        await OTP.deleteMany({ email });

        const otp = this.generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        const otpRecord = new OTP({
            email,
            otp,
            expiresAt
        });

        await otpRecord.save();
        return otp;
    }

    async verifyOTP(email, otp) {
        const otpRecord = await OTP.findOne({ email });

        if (!otpRecord) {
            return { success: false, message: 'OTP not found or expired' };
        }

        if (otpRecord.attempts >= otpRecord.maxAttempts) {
            await OTP.deleteOne({ email });
            return { success: false, message: 'Maximum OTP attempts exceeded' };
        }

        if (otpRecord.expiresAt < new Date()) {
            await OTP.deleteOne({ email });
            return { success: false, message: 'OTP has expired' };
        }

        if (otpRecord.otp !== otp) {
            otpRecord.attempts += 1;
            await otpRecord.save();
            return { success: false, message: 'Invalid OTP' };
        }

        // OTP is valid, delete it
        // await OTP.deleteOne({ email });
        return { success: true, message: 'OTP verified successfully' };
    }

    async getRemainingTime(email) {
        const otpRecord = await OTP.findOne({ email });
        if (!otpRecord) return 0;

        const remainingTime = otpRecord.expiresAt - new Date();
        return Math.max(0, Math.floor(remainingTime / 1000)); // Return in seconds
    }
}

module.exports = new OTPService();