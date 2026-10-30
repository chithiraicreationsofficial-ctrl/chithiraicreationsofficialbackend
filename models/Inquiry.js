const mongoose = require("mongoose");

const inquirySchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["INQUIRY", "PROCESS", "REGISTERED", "COMPLETED"],
      default: "INQUIRY",
      index: true,
    },
    callCount: {
      type: Number,
      default: 1,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    source: {
      type: String,
      default: "Direct Call",
    },
    lastCalledAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Inquiry", inquirySchema);
