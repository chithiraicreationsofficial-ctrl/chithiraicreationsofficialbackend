const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
    if (isConnected) return;
    
    if (!process.env.MONGODB_URI) {
        console.warn('⚠️ MONGODB_URI is not defined in environment variables.');
        return;
    }

    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        isConnected = true;
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('Database connection error:', error.message);
        // Do not call process.exit(1) in serverless environments to prevent FUNCTION_INVOCATION_FAILED
        if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME && process.env.NODE_ENV !== 'production') {
            process.exit(1);
        }
    }
};

module.exports = connectDB;
