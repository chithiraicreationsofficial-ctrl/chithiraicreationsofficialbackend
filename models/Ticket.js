
const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // Can be null for admin-created tickets
    },
    email: {
      type: String,
    },
    aadharNumber: {
      type: String,
      default: null
    },
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
     // Separate counts for adults and children
     adultTicketCount: {
      type: Number,
      required: true,
      min: 0,
      max: 50,
      default: 0
    },
    childrenTicketCount: {
      type: Number,
      required: true,
      min: 0,
      max: 30,
      default: 0
    },
    totalTicketCount: {
      type: Number,
      default: function() {
        return (this.adultTicketCount || 0) + (this.childrenTicketCount || 0);
      }
    },
    ticketCount: {
      type: Number,
      min: 1,
      max: 100,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentId: {
      type: String,
      default: null, // Can be null for admin-created tickets
    },
    orderId: {
      type: String,
      default: null, // Can be null for admin-created tickets
    },
    qrCode: {
      type: String,
      default: null, // Will generate for admin tickets
    },
    status: {
      type: String,
      enum: ["booked", "attended", "not_attended", "cancelled"],
      default: "booked",
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    adultsAttended: {
      type: Number,
      default: 0,
      min: 0
    },
    childrenAttended: {
      type: Number,
      default: 0,
      min: 0
    },

    verificationMethod: {
      type: String,
      enum: ["qr_scan", "manual", "admin_created", "bulk"],
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    createdByEmail: {
      type: String,
      default: null,
    },
    paymentMethod: {
      type: String,
      enum: ["online", "cash", "upi"],
      default: "online",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded", "cash"],
      default: "completed",
    },
    adminNotes: {
      type: String,
      default: "",
    },
    // For cash payments handled by admin
    cashCollected: {
      type: Boolean,
      default: false,
    },
    cashCollectionTime: {
      type: Date,
      default: null,
    }
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
ticketSchema.index({ ticketId: 1 });
ticketSchema.index({ email: 1 });
ticketSchema.index({ status: 1 });
ticketSchema.index({ createdAt: 1 });
ticketSchema.index({ createdBy: 1 });
ticketSchema.index({ createdByEmail: 1 });
ticketSchema.index({ paymentMethod: 1 });
ticketSchema.index({ paymentStatus: 1 });


module.exports = mongoose.model("Ticket", ticketSchema);
