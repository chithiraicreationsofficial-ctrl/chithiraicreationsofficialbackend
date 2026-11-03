const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
    if (isConnected && mongoose.connection.readyState === 1) return;
    
    const uri = process.env.MONGODB_URI || "mongodb+srv://raheswarandev:Rahes54321@clusterdino.pxbhsml.mongodb.net/chithiraicreation";

    try {
        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
        });
        isConnected = true;
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.warn('MongoDB connection error (continuing with PostgreSQL):', error.message);
        // Do not crash the server in local or serverless environments when PostgreSQL is available
    }
};

module.exports = connectDB;
