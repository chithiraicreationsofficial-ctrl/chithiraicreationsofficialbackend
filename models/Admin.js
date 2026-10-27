// models/Admin.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const speakeasy = require("speakeasy");

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    twoFASecret: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["super_admin", "admin", "support"],
      default: "admin",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    ticketsCreated: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    phone: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Generate 2FA secret
adminSchema.methods.generateTwoFASecret = function () {
  const secret = speakeasy.generateSecret({
    name: `Chithirai Creations Admin (${this.email})`,
  });
  this.twoFASecret = secret.base32;
  return secret;
};

// Verify password
adminSchema.methods.verifyPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Verify 2FA token
adminSchema.methods.verifyTwoFA = function (token) {
  return speakeasy.totp.verify({
    secret: this.twoFASecret,
    encoding: "base32",
    token: token,
    window: 1,
  });
};

module.exports = mongoose.model("Admin", adminSchema);
