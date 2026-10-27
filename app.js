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

const app = express();

// Initialize Database Connections
connectDB();
initPostgres();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Cross-Origin Resource Sharing (CORS) - Allows local and Vercel domains
app.use(cors({
  origin: true, // Reflect request origin
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

app.use('/uploads', express.static(uploadStaticDir));

// Root Health Check Route
app.get('/', (req, res) => {
  res.json({
    success: true,
    name: 'Chithirai Creations API',
    status: 'Online',
    environment: process.env.NODE_ENV || 'development',
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
