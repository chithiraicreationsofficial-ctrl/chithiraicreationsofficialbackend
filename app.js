const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const connectDB = require('./config/database');
const { initPostgres } = require('./config/postgres');

// Route imports
const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const adminRoutes = require('./routes/admin');
const sponsorRoutes = require('./routes/sponsorship');
const diwaliRoutes = require('./routes/diwali');
const paymentRoutes = require('./routes/payments');
const inquiryRoutes = require('./routes/inquiry');

const app = express();

// Initialize Database Connections
connectDB();
initPostgres();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Cross-Origin Resource Sharing (CORS) - Allows local and production domains
const allowedOrigins = [
  'https://www.chithiraicreations.in',
  'https://chithiraicreations.in',
  'https://chithiraicreationsofficialfrontend.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.chithiraicreations.in') ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static uploaded payment screenshots (handles local & serverless /tmp)
const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const uploadStaticDir = isServerless
  ? path.join('/tmp', 'uploads')
  : path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadStaticDir)) {
  try {
    fs.mkdirSync(uploadStaticDir, { recursive: true });
  } catch (e) {}
}

// Serve payment uploads with persistent database fallback (guarantees images survive Vercel serverless cold starts)
app.get('/uploads/payments/:filename', async (req, res) => {
  const { filename } = req.params;

  // 1. Check local filesystem first
  const localFilePath = path.join(uploadStaticDir, 'payments', filename);
  if (fs.existsSync(localFilePath)) {
    return res.sendFile(localFilePath);
  }

  // 2. Fetch persistent binary file from PostgreSQL
  try {
    const { pool } = require('./config/postgres');
    const result = await pool.query(
      'SELECT mime_type, data FROM payment_files WHERE filename = $1 LIMIT 1',
      [filename]
    );

    if (result.rows.length > 0) {
      const { mime_type, data } = result.rows[0];
      res.setHeader('Content-Type', mime_type || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.send(data);
    }
  } catch (pgErr) {
    console.error('Error fetching file from Postgres:', pgErr.message);
  }

  // 3. Fallback to MongoDB
  try {
    const PaymentFile = require('./models/PaymentFile');
    const mongoDoc = await PaymentFile.findOne({ filename });
    if (mongoDoc && mongoDoc.data) {
      res.setHeader('Content-Type', mongoDoc.mimeType || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.send(mongoDoc.data);
    }
  } catch (mErr) {}

  return res.status(404).json({
    success: false,
    message: 'Payment screenshot not found or expired',
  });
});

app.use('/uploads', express.static(uploadStaticDir));

// Root Health Check Route
app.get('/', (req, res) => {
  res.json({
    success: true,
    name: 'Chithirai Creations API',
    status: 'Online',
    domain: 'https://api.chithiraicreations.in',
    frontend: 'https://www.chithiraicreations.in',
    environment: process.env.NODE_ENV || 'production',
    serverless: isServerless,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/sponsorships', sponsorRoutes);
app.use('/api/diwali', diwaliRoutes);
app.use('/api/inquiries', inquiryRoutes);

// Global Error Handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: error.message })
  });
});

// Export app for Vercel Serverless Functions
module.exports = app;

// In local development, start HTTP server on port when run directly
if (require.main === module && !process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📧 Email service: ${process.env.EMAIL_SERVICE || 'configured'}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}
