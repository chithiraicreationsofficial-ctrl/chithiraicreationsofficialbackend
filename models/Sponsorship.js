// models/Sponsorship.js
const mongoose = require("mongoose");

const sponsorshipSchema = new mongoose.Schema(
  {
    // Sponsor Information
    contactPerson: {
      type: String,
      required: true,
      trim: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },

    // Sponsorship Details
    interestArea: {
      type: String,
      enum: [
        "brand_visibility",
        "networking",
        "csr",
        "product_promotion",
        "recruitment",
        "multiple",
      ],
      required: true,
    },

    partnershipType: {
      type: [String], // Multiple types possible
      enum: [
        "hospitality",
        "medical",
        "fitness",
        "food",
        "tv",
        "event",
        "radio",
        "venue",
        "branding",
        "merchandise",
        "beverage",
        "technology",
      ],
      required: true,
    },

    budgetRange: {
      type: String,
      enum: ["50k-100k", "100k-250k", "250k-500k", "500k-1M", "1M+", "custom"],
      required: true,
    },

    customBudget: {
      type: Number,
      min: 0,
    },

    packageInterest: {
      type: String,
      enum: ["title", "platinum", "gold", "silver", "custom"],
      default: "custom",
    },

    // Status Tracking
    status: {
      type: String,
      enum: [
        "pending",
        "contacted",
        "negotiating",
        "approved",
        "rejected",
        "signed",
        "paid",
      ],
      default: "pending",
    },

    adminNotes: {
      type: String,
      trim: true,
    },

    lastContactDate: {
      type: Date,
    },

    nextFollowUp: {
      type: Date,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },

    // Contract Details
    contractAmount: {
      type: Number,
      min: 0,
    },

    contractSignedAt: {
      type: Date,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "partial", "completed", "overdue"],
      default: "pending",
    },

    paymentAmount: {
      type: Number,
      default: 0,
    },

    benefitsAgreed: [
      {
        name: String,
        description: String,
        delivered: {
          type: Boolean,
          default: false,
        },
        deliveryDate: Date,
      },
    ],

    logoSubmitted: {
      type: Boolean,
      default: false,
    },

    logoFile: {
      type: String, // URL to uploaded logo
    },

    // Metadata
    submissionSource: {
      type: String,
      enum: ["website", "direct", "referral", "admin"],
      default: "website",
    },

    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
sponsorshipSchema.index({ status: 1 });
sponsorshipSchema.index({ assignedTo: 1 });
sponsorshipSchema.index({
  companyName: "text",
  contactPerson: "text",
  email: "text",
});
sponsorshipSchema.index({ createdAt: -1 });

// Virtual for formatted budget
sponsorshipSchema.virtual("formattedBudget").get(function () {
  if (this.customBudget) {
    return `₹${this.customBudget.toLocaleString("en-IN")}`;
  }

  const ranges = {
    "50k-100k": "₹50,000 - ₹1,00,000",
    "100k-250k": "₹1,00,000 - ₹2,50,000",
    "250k-500k": "₹2,50,000 - ₹5,00,000",
    "500k-1M": "₹5,00,000 - ₹10,00,000",
    "1M+": "₹10,00,000+",
    custom: "Custom Budget",
  };
  return ranges[this.budgetRange] || this.budgetRange;
});

// Virtual for formatted partnership types
sponsorshipSchema.virtual("formattedPartnershipTypes").get(function () {
  const typesMap = {
    hospitality: "Hospitality Partner",
    medical: "Medical Partner",
    fitness: "Fitness Partner",
    food: "Food Partner",
    tv: "TV Partner",
    event: "Event Partner",
    radio: "Radio Partner",
    venue: "Venue Partner",
    branding: "Branding Partner",
    merchandise: "Merchandise Partner",
    beverage: "Beverage Partner",
    technology: "Technology Partner",
  };

  return this.partnershipType.map((type) => typesMap[type] || type);
});

// Methods
sponsorshipSchema.methods.updateStatus = async function (newStatus, adminId) {
  this.status = newStatus;
  this.assignedTo = adminId;
  this.lastContactDate = new Date();
  await this.save();
};

sponsorshipSchema.methods.addNote = async function (note, adminId) {
  this.adminNotes = note;
  this.assignedTo = adminId;
  this.lastContactDate = new Date();
  await this.save();
};

sponsorshipSchema.methods.scheduleFollowUp = async function (date) {
  this.nextFollowUp = date;
  await this.save();
};

module.exports = mongoose.model("Sponsorship", sponsorshipSchema);
