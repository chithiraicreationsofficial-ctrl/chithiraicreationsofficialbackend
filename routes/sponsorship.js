// routes/sponsorshipRoutes.js
const express = require("express");
const router = express.Router();
const sponsorshipController = require("../controllers/sponsorshipController");
const { adminAuth } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");

// Configure multer for logo upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/sponsor-logos/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|svg/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed"));
  },
});

// Public route - Submit sponsorship inquiry
router.post("/submit", sponsorshipController.createSponsorship);

// Protected routes (admin only)
router.use(adminAuth);


module.exports = router;
