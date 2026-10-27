// controllers/sponsorshipController.js
const Sponsorship = require("../models/Sponsorship");
const Admin = require("../models/Admin");
const Event = require("../models/Event");

// Create new sponsorship inquiry
exports.createSponsorship = async (req, res) => {
  try {
    const {
      contactPerson,
      companyName,
      email,
      phone,
      website,
      interestArea,
      partnershipType,
      budgetRange,
      customBudget,
      packageInterest,
      message,
    } = req.body;

    // Validation
    if (!contactPerson || !companyName || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Required fields: contactPerson, companyName, email, phone",
      });
    }

    // Create sponsorship
    const sponsorship = new Sponsorship({
      contactPerson,
      companyName,
      email,
      phone,
      website,
      interestArea: interestArea || "multiple",
      partnershipType: Array.isArray(partnershipType)
        ? partnershipType
        : [partnershipType],
      budgetRange: budgetRange || "custom",
      customBudget,
      packageInterest: packageInterest || "custom",
      adminNotes: message || "",
      submissionSource: "website",
    });

    await sponsorship.save();

    // TODO: Send confirmation email to sponsor
    // TODO: Send notification email to admin team

    res.status(201).json({
      success: true,
      message: "Sponsorship inquiry submitted successfully",
      data: {
        sponsorship: {
          id: sponsorship._id,
          companyName: sponsorship.companyName,
          contactPerson: sponsorship.contactPerson,
          status: sponsorship.status,
        },
      },
    });
  } catch (error) {
    console.error("Create sponsorship error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while submitting sponsorship inquiry",
    });
  }
};

// Get all sponsorships (admin only)
exports.getAllSponsorships = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      assignedTo,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (assignedTo && assignedTo !== "all") {
      filter.assignedTo = assignedTo;
    }

    if (search && search.trim() !== "") {
      filter.$or = [
        { companyName: { $regex: search, $options: "i" } },
        { contactPerson: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Get sponsorships with pagination
    const [sponsorships, total] = await Promise.all([
      Sponsorship.find(filter)
        .select("-__v")
        .populate("assignedTo", "name email")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Sponsorship.countDocuments(filter),
    ]);

    // Get status counts for filters
    const statusCounts = await Sponsorship.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const statusStats = {
      pending: 0,
      contacted: 0,
      negotiating: 0,
      approved: 0,
      signed: 0,
      paid: 0,
      rejected: 0,
    };

    statusCounts.forEach((stat) => {
      statusStats[stat._id] = stat.count;
    });

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        sponsorships,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        stats: {
          total,
          status: statusStats,
        },
      },
    });
  } catch (error) {
    console.error("Get all sponsorships error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching sponsorships",
    });
  }
};

// Get sponsorship by ID
exports.getSponsorshipById = async (req, res) => {
  try {
    const { id } = req.params;

    const sponsorship = await Sponsorship.findById(id)
      .populate("assignedTo", "name email phone")
      .populate("eventId", "name date")
      .lean();

    if (!sponsorship) {
      return res.status(404).json({
        success: false,
        message: "Sponsorship not found",
      });
    }

    res.json({
      success: true,
      data: {
        sponsorship,
      },
    });
  } catch (error) {
    console.error("Get sponsorship error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching sponsorship",
    });
  }
};

// Update sponsorship status (admin only)
exports.updateSponsorshipStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    const adminId = req.admin.adminId;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const sponsorship = await Sponsorship.findById(id);
    if (!sponsorship) {
      return res.status(404).json({
        success: false,
        message: "Sponsorship not found",
      });
    }

    // Update sponsorship
    sponsorship.status = status;
    sponsorship.assignedTo = adminId;
    sponsorship.lastContactDate = new Date();

    if (note) {
      sponsorship.adminNotes = note;
    }

    await sponsorship.save();

    // TODO: Send email notification to sponsor about status change

    res.json({
      success: true,
      message: `Sponsorship status updated to ${status}`,
      data: {
        sponsorship: {
          id: sponsorship._id,
          status: sponsorship.status,
          lastContactDate: sponsorship.lastContactDate,
        },
      },
    });
  } catch (error) {
    console.error("Update sponsorship error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating sponsorship",
    });
  }
};

// Assign sponsorship to admin
exports.assignSponsorship = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId } = req.body;

    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: "Admin ID is required",
      });
    }

    // Check if admin exists
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    const sponsorship = await Sponsorship.findById(id);
    if (!sponsorship) {
      return res.status(404).json({
        success: false,
        message: "Sponsorship not found",
      });
    }

    sponsorship.assignedTo = adminId;
    sponsorship.lastContactDate = new Date();
    await sponsorship.save();

    res.json({
      success: true,
      message: `Sponsorship assigned to ${admin.name}`,
      data: {
        sponsorship: {
          id: sponsorship._id,
          assignedTo: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
          },
        },
      },
    });
  } catch (error) {
    console.error("Assign sponsorship error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while assigning sponsorship",
    });
  }
};

// Schedule follow-up
exports.scheduleFollowUp = async (req, res) => {
  try {
    const { id } = req.params;
    const { followUpDate } = req.body;

    if (!followUpDate) {
      return res.status(400).json({
        success: false,
        message: "Follow-up date is required",
      });
    }

    const sponsorship = await Sponsorship.findById(id);
    if (!sponsorship) {
      return res.status(404).json({
        success: false,
        message: "Sponsorship not found",
      });
    }

    sponsorship.nextFollowUp = new Date(followUpDate);
    await sponsorship.save();

    // TODO: Schedule email reminder for admin

    res.json({
      success: true,
      message: "Follow-up scheduled successfully",
      data: {
        sponsorship: {
          id: sponsorship._id,
          nextFollowUp: sponsorship.nextFollowUp,
        },
      },
    });
  } catch (error) {
    console.error("Schedule follow-up error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while scheduling follow-up",
    });
  }
};

// Add contract details
exports.addContractDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { contractAmount, contractSignedAt, paymentAmount, benefits } =
      req.body;

    const sponsorship = await Sponsorship.findById(id);
    if (!sponsorship) {
      return res.status(404).json({
        success: false,
        message: "Sponsorship not found",
      });
    }

    // Update contract details
    if (contractAmount) {
      sponsorship.contractAmount = parseFloat(contractAmount);
    }

    if (contractSignedAt) {
      sponsorship.contractSignedAt = new Date(contractSignedAt);
      sponsorship.status = "signed";
    }

    if (paymentAmount) {
      sponsorship.paymentAmount = parseFloat(paymentAmount);
      sponsorship.paymentStatus =
        paymentAmount >= (sponsorship.contractAmount || 0)
          ? "completed"
          : "partial";
    }

    if (benefits && Array.isArray(benefits)) {
      sponsorship.benefitsAgreed = benefits.map((benefit) => ({
        name: benefit.name,
        description: benefit.description,
        delivered: benefit.delivered || false,
        deliveryDate: benefit.delivered ? new Date() : null,
      }));
    }

    await sponsorship.save();

    res.json({
      success: true,
      message: "Contract details updated successfully",
      data: {
        sponsorship: {
          id: sponsorship._id,
          contractAmount: sponsorship.contractAmount,
          contractSignedAt: sponsorship.contractSignedAt,
          paymentStatus: sponsorship.paymentStatus,
        },
      },
    });
  } catch (error) {
    console.error("Add contract details error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating contract details",
    });
  }
};

// Upload logo
exports.uploadLogo = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Logo file is required",
      });
    }

    const sponsorship = await Sponsorship.findById(id);
    if (!sponsorship) {
      return res.status(404).json({
        success: false,
        message: "Sponsorship not found",
      });
    }

    // Save logo URL (in real app, upload to cloud storage)
    sponsorship.logoFile = `/uploads/sponsor-logos/${req.file.filename}`;
    sponsorship.logoSubmitted = true;
    await sponsorship.save();

    res.json({
      success: true,
      message: "Logo uploaded successfully",
      data: {
        sponsorship: {
          id: sponsorship._id,
          logoFile: sponsorship.logoFile,
          logoSubmitted: sponsorship.logoSubmitted,
        },
      },
    });
  } catch (error) {
    console.error("Upload logo error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while uploading logo",
    });
  }
};

// Get sponsorship statistics
exports.getSponsorshipStats = async (req, res) => {
  try {
    const stats = await Sponsorship.aggregate([
      {
        $group: {
          _id: null,
          totalInquiries: { $sum: 1 },
          totalRevenue: { $sum: { $ifNull: ["$contractAmount", 0] } },
          totalReceived: { $sum: { $ifNull: ["$paymentAmount", 0] } },
          pendingCount: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          contactedCount: {
            $sum: { $cond: [{ $eq: ["$status", "contacted"] }, 1, 0] },
          },
          negotiatingCount: {
            $sum: { $cond: [{ $eq: ["$status", "negotiating"] }, 1, 0] },
          },
          signedCount: {
            $sum: { $cond: [{ $eq: ["$status", "signed"] }, 1, 0] },
          },
          paidCount: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] } },
        },
      },
    ]);

    const result = stats[0] || {
      totalInquiries: 0,
      totalRevenue: 0,
      totalReceived: 0,
      pendingCount: 0,
      contactedCount: 0,
      negotiatingCount: 0,
      signedCount: 0,
      paidCount: 0,
    };

    // Get monthly trend
    const monthlyTrend = await Sponsorship.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
          revenue: { $sum: { $ifNull: ["$contractAmount", 0] } },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 6 },
    ]);

    // Get partnership type distribution
    const typeDistribution = await Sponsorship.aggregate([
      { $unwind: "$partnershipType" },
      {
        $group: {
          _id: "$partnershipType",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      data: {
        stats: result,
        trends: {
          monthly: monthlyTrend,
          types: typeDistribution,
        },
      },
    });
  } catch (error) {
    console.error("Get sponsorship stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching sponsorship statistics",
    });
  }
};

// Export sponsorships to CSV
exports.exportSponsorships = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;

    const filter = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const sponsorships = await Sponsorship.find(filter)
      .select(
        "companyName contactPerson email phone budgetRange status contractAmount paymentAmount createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    // Convert to CSV format
    const csvData = sponsorships.map((sponsor) => ({
      "Company Name": sponsor.companyName,
      "Contact Person": sponsor.contactPerson,
      Email: sponsor.email,
      Phone: sponsor.phone,
      "Budget Range": sponsor.formattedBudget,
      Status: sponsor.status,
      "Contract Amount": sponsor.contractAmount || 0,
      "Payment Received": sponsor.paymentAmount || 0,
      "Submission Date": new Date(sponsor.createdAt).toLocaleDateString(),
    }));

    res.json({
      success: true,
      data: {
        sponsorships: csvData,
        count: sponsorships.length,
      },
    });
  } catch (error) {
    console.error("Export sponsorships error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while exporting sponsorships",
    });
  }
};

// Delete sponsorship (admin only)
exports.deleteSponsorship = async (req, res) => {
  try {
    const { id } = req.params;

    const sponsorship = await Sponsorship.findById(id);
    if (!sponsorship) {
      return res.status(404).json({
        success: false,
        message: "Sponsorship not found",
      });
    }

    // Only delete if not signed/paid
    if (["signed", "paid"].includes(sponsorship.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete signed or paid sponsorships",
      });
    }

    await sponsorship.remove();

    res.json({
      success: true,
      message: "Sponsorship deleted successfully",
    });
  } catch (error) {
    console.error("Delete sponsorship error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting sponsorship",
    });
  }
};
