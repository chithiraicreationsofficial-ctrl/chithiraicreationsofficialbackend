const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { pool } = require("../config/postgres");
const { sendDiwaliVerificationToken } = require("../services/emailService");
const { adminAuth } = require("../middleware/auth");

// Ensure payment screenshots directory exists
const uploadDir = path.join(__dirname, "../uploads/payments");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `payment-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|heic/;
  const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
  const mime = file.mimetype.toLowerCase();

  if (allowedTypes.test(ext) || mime.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (JPG, PNG, WEBP) are allowed for payment screenshots"));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter,
});

// ========================================================
// 1. POST /api/diwali/register
// Public Registration with Duplicate Check & Screenshot Upload
// ========================================================
router.post("/register", upload.single("paymentScreenshot"), async (req, res) => {
  try {
    const {
      name,
      age,
      gender,
      state = "Tamil Nadu",
      district,
      instagramProfile,
      phone,
      email,
      sweetName,
      category = "Reel Category",
      ingredients,
      conditionsAccepted,
    } = req.body;

    // 1. Validate Required Fields
    if (!name || !age || !gender || !district || !instagramProfile || !phone || !email || !sweetName) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields (Name, Age, Gender, District, Instagram, Phone, Email, Sweet Name).",
      });
    }

    if (Number(age) < 4) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({
        success: false,
        message: "Minimum age required to participate is 4 years+.",
      });
    }

    if (!conditionsAccepted || conditionsAccepted === "false") {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({
        success: false,
        message: "You must accept all contest terms & conditions to register.",
      });
    }

    // 2. Validate Payment Screenshot Upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Payment screenshot is required! Please upload proof of your ₹249 entry fee payment.",
      });
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit mobile number.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    // 3. Duplicate Checks in PostgreSQL
    // Check if phone number already registered
    const existingPhone = await pool.query(
      "SELECT id, phone, name FROM diwali_registrations WHERE phone = $1",
      [cleanPhone]
    );
    if (existingPhone.rows.length > 0) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({
        success: false,
        message: `This phone number (${cleanPhone}) is already registered for this contest. Duplicate registration is not allowed.`,
      });
    }

    // Check if email already registered
    const existingEmail = await pool.query(
      "SELECT id, email, name FROM diwali_registrations WHERE LOWER(email) = LOWER($1)",
      [cleanEmail]
    );
    if (existingEmail.rows.length > 0) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({
        success: false,
        message: `This email address (${cleanEmail}) is already registered for this contest. Duplicate registration is not allowed.`,
      });
    }

    // 4. Generate Registration ID
    const registrationId =
      "DDPV-" + Date.now().toString(36).toUpperCase() + "-" + Math.floor(Math.random() * 900 + 100);

    const paymentScreenshotUrl = `/uploads/payments/${req.file.filename}`;

    // 5. Insert into PostgreSQL Database
    const insertQuery = `
      INSERT INTO diwali_registrations (
        registration_id, name, age, gender, state, district,
        phone, email, instagram_profile, sweet_name, category,
        ingredients, payment_screenshot, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'PENDING')
      RETURNING *
    `;

    const values = [
      registrationId,
      name.trim(),
      Number(age),
      gender,
      state || "Tamil Nadu",
      district.trim(),
      cleanPhone,
      cleanEmail,
      instagramProfile.trim(),
      sweetName.trim(),
      category,
      ingredients ? ingredients.trim() : "",
      paymentScreenshotUrl,
    ];

    const result = await pool.query(insertQuery, values);
    const newRecord = result.rows[0];

    res.status(201).json({
      success: true,
      message: "Registration submitted successfully! Your payment screenshot has been uploaded. Our admin team will verify it and email your official token.",
      data: {
        registrationId: newRecord.registration_id,
        name: newRecord.name,
        category: newRecord.category,
        sweetName: newRecord.sweet_name,
        district: newRecord.district,
        status: newRecord.status,
        paymentScreenshot: newRecord.payment_screenshot,
      },
    });
  } catch (error) {
    if (req.file) fs.unlink(req.file.path, () => {});
    console.error("Diwali registration error:", error);

    // Handle unique constraint violation from postgres
    if (error.code === "23505") {
      if (error.detail && error.detail.includes("phone")) {
        return res.status(400).json({
          success: false,
          message: "This mobile number is already registered for this contest.",
        });
      }
      if (error.detail && error.detail.includes("email")) {
        return res.status(400).json({
          success: false,
          message: "This email address is already registered for this contest.",
        });
      }
    }

    res.status(500).json({
      success: false,
      message: "Server error during registration. Please try again.",
      error: error.message,
    });
  }
});

// ========================================================
// 2. GET /api/diwali/registrations
// Fetch All Registrations with Search & Filter
// ========================================================
router.get("/registrations", async (req, res) => {
  try {
    const { status, category, search } = req.query;

    let query = "SELECT * FROM diwali_registrations";
    const conditions = [];
    const values = [];

    if (status && status !== "ALL") {
      values.push(status);
      conditions.push(`status = $${values.length}`);
    }

    if (category && category !== "ALL") {
      values.push(category);
      conditions.push(`category = $${values.length}`);
    }

    if (search && search.trim()) {
      values.push(`%${search.trim().toLowerCase()}%`);
      conditions.push(`(
        LOWER(name) LIKE $${values.length} OR
        phone LIKE $${values.length} OR
        LOWER(email) LIKE $${values.length} OR
        LOWER(district) LIKE $${values.length} OR
        LOWER(sweet_name) LIKE $${values.length} OR
        LOWER(COALESCE(token, '')) LIKE $${values.length} OR
        LOWER(registration_id) LIKE $${values.length}
      )`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, values);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Fetch registrations error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch registrations",
      error: error.message,
    });
  }
});

// ========================================================
// 3. GET /api/diwali/stats
// Quick Stats for Admin Panel
// ========================================================
router.get("/stats", async (req, res) => {
  try {
    const totalRes = await pool.query("SELECT COUNT(*) FROM diwali_registrations");
    const verifiedRes = await pool.query("SELECT COUNT(*) FROM diwali_registrations WHERE status = 'VERIFIED'");
    const pendingRes = await pool.query("SELECT COUNT(*) FROM diwali_registrations WHERE status = 'PENDING'");
    const reelRes = await pool.query("SELECT COUNT(*) FROM diwali_registrations WHERE category = 'Reel Category'");
    const photoRes = await pool.query("SELECT COUNT(*) FROM diwali_registrations WHERE category = 'Photo Category'");

    const total = parseInt(totalRes.rows[0].count, 10);
    const verified = parseInt(verifiedRes.rows[0].count, 10);
    const pending = parseInt(pendingRes.rows[0].count, 10);

    res.json({
      success: true,
      data: {
        totalRegistrations: total,
        verifiedRegistrations: verified,
        pendingRegistrations: pending,
        reelCategoryCount: parseInt(reelRes.rows[0].count, 10),
        photoCategoryCount: parseInt(photoRes.rows[0].count, 10),
        totalFeeCollected: total * 249,
      },
    });
  } catch (error) {
    console.error("Fetch diwali stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch contest stats",
    });
  }
});

// ========================================================
// 4. POST /api/diwali/verify/:id
// Admin Verifies Participant, Assigns DDPVREG01 Token, and Sends Email
// ========================================================
router.post("/verify/:id", async (req, res) => {
  try {
    const regId = req.params.id;

    // Check if participant exists
    const checkRes = await pool.query("SELECT * FROM diwali_registrations WHERE id = $1", [regId]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    const participant = checkRes.rows[0];

    let token = participant.token;

    // If token does not exist yet, generate sequential DDPVREG01, DDPVREG02...
    if (!token) {
      const countRes = await pool.query("SELECT COUNT(*) FROM diwali_registrations WHERE token IS NOT NULL");
      const nextNumber = parseInt(countRes.rows[0].count, 10) + 1;
      token = `DDPVREG${String(nextNumber).padStart(2, "0")}`;
    }

    const verifiedBy = req.body.verifiedBy || "Chithirai Creations Admin";

    // Update row in PostgreSQL
    const updateRes = await pool.query(
      `
      UPDATE diwali_registrations
      SET status = 'VERIFIED',
          token = $1,
          verified_at = CURRENT_TIMESTAMP,
          verified_by = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `,
      [token, verifiedBy, regId]
    );

    const updatedParticipant = updateRes.rows[0];

    // Send the official verification token email via nodemailer
    const emailSent = await sendDiwaliVerificationToken(updatedParticipant, token);

    res.json({
      success: true,
      message: `Participant verified successfully! Official Token ${token} generated and emailed to ${updatedParticipant.email}.`,
      token: token,
      emailSent: emailSent,
      data: updatedParticipant,
    });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify registration",
      error: error.message,
    });
  }
});

// ========================================================
// 5. POST /api/diwali/resend-token/:id
// Resend Token Email
// ========================================================
router.post("/resend-token/:id", async (req, res) => {
  try {
    const regId = req.params.id;
    const checkRes = await pool.query("SELECT * FROM diwali_registrations WHERE id = $1", [regId]);

    if (checkRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    const participant = checkRes.rows[0];

    if (!participant.token) {
      return res.status(400).json({
        success: false,
        message: "This participant has not been verified yet. Click Verify first.",
      });
    }

    const emailSent = await sendDiwaliVerificationToken(participant, participant.token);

    res.json({
      success: true,
      message: `Token email resent successfully to ${participant.email}!`,
      emailSent: emailSent,
    });
  } catch (error) {
    console.error("Resend token error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend token email",
      error: error.message,
    });
  }
});

module.exports = router;
