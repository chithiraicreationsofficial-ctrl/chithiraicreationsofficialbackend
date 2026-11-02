const mongoose = require("mongoose");

const paymentFileSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    mimeType: {
      type: String,
      default: "image/jpeg",
    },
    data: {
      type: Buffer,
      required: true,
    },
    size: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PaymentFile", paymentFileSchema);
