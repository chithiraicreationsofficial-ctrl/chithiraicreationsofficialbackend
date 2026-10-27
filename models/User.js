const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: {
        type: String
    }
}, {
    timestamps: true
});

// Remove password field - we don't need it for this flow
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.verificationToken;
    return user;
};

module.exports = mongoose.model('User', userSchema);