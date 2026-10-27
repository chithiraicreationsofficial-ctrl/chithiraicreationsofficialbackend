const Razorpay = require('razorpay');

let razorpay = null;

try {
    const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_RiDrTcK7D32wp3';
    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'Q7yD37AhMkcpBPMcxtqxHwbb';
    razorpay = new Razorpay({
        key_id,
        key_secret
    });
} catch (error) {
    console.warn('⚠️ Razorpay initialization warning:', error.message);
}

module.exports = razorpay;
