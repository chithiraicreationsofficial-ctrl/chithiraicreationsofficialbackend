const mongoose = require("mongoose");

const diwaliRegistrationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
      min: 4,
    },
    gender: {
      type: String,
      required: true,
      enum: ["Female", "Male", "Other", "Prefer not to say"],
    },
    state: {
      type: String,
      default: "Tamil Nadu",
    },
    district: {
      type: String,
      required: true,
      trim: true,
    },
    instagramProfile: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    sweetName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["Reel Category", "Photo Category"],
    },
    ingredients: {
      type: String,
      trim: true,
    },
    conditionsAccepted: {
      type: Boolean,
      default: true,
    },
    registrationId: {
      type: String,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

diwaliRegistrationSchema.pre("save", function (next) {
  if (!this.registrationId) {
    this.registrationId = "DDPV-" + Date.now().toString(36).toUpperCase() + "-" + Math.floor(Math.random() * 900 + 100);
  }
  next();
});

module.exports = mongoose.model("DiwaliRegistration", diwaliRegistrationSchema);
