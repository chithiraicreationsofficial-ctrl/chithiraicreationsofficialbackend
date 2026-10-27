const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
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

connectDB();
initPostgres();

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors(corsPath));

app.use(cors())

app.get('/', function (req, res, next) {
  res.json({msg: 'This is CORS-enabled for all origins!'})
})


var corsPath = {
    origin: function (origin, callback) {
        try {
            if (origin !== "undefined") {
                if ([
                    'http://localhost:62393',
                    'http://localhost:4200',
                    'http://localhost:4200/',
                    'http://localhost:3033',
                    'http://localhost:5000',
                    'http://localhost:3000',
                    'http://localhost:3001',
                    'http://localhost:3001/',
                    'http://localhost:3002',
                    'https://chithirai-creation-front.vercel.app/',
                    'https://chithirai-creation-front.vercel.app',
                    'https://www.chithiraicreations.com/',
                    'https://www.chithiraicreations.com',
                    undefined

                ].indexOf(origin) > -1) {
                    callback(null, true);
                } else {
                    callback(new Error("Not allowed by CORS"));
                }
            } else {
                console.log("error", 'Corss Error');
            }
        } catch (error) {
            console.log(error, "cors Error");
        }
    },
};


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded payment screenshots
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/sponsorships', sponsorRoutes);
app.use('/api/diwali', diwaliRoutes);


app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

app.use((error, req, res, next) => {
    console.error('Global error handler:', error);

    res.status(500).json({
        success: false,
        message: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📧 Email service: ${process.env.EMAIL_SERVICE}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});