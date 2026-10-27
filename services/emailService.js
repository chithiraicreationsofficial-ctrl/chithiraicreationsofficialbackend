const nodemailer = require("nodemailer");
require("dotenv").config();

// ---------------------------------------
// CREATE TRANSPORTER (Reusable)
// ---------------------------------------



const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "mail.smtp2go.com",
  port: Number(process.env.EMAILPORT) || 2525,
  secure: false,
  auth: {
    user: process.env.FROM_EMAIL || "sales@blocksentinels.com",
    pass: process.env.EMAIL_PASSWORD || "fabS7Hu5flfI5om3",
  },
  pool: true,
  maxConnections: 3,
  maxMessages: 100,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

// ---------------------------------------
// SEND OTP EMAIL
// ---------------------------------------
const sendOTP = async (email, otp) => {

  console.log(process.env.EMAILPORT, process.env.EMAIL_HOST, process.env.FROM_EMAIL, process.env.EMAIL_PASSWORD, email, otp);


  const mailOptions = {
    from: {
      name: process.env.FROM_AME,
      address: process.env.FROM_EMAIL,
    },
    to: email,
    subject: "Email Verification OTP",
    html: `
   <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification OTP</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Poppins', Arial, sans-serif;
        }
        
        body {
            background-color: #f5f5f5;
            color: #333;
            line-height: 1.6;
            padding: 20px 0;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            padding: 25px 30px;
            text-align: center;
            color: white;
        }
        
        .logo {
            max-width: 180px;
            margin: 0 auto 15px;
            display: block;
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 5px;
            text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
        }
        
        .header p {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .presented-by {
            background-color: #f8f9fa;
            padding: 10px;
            text-align: center;
            font-size: 14px;
            color: #666;
            border-bottom: 1px solid #eaeaea;
        }
        
        .content {
            padding: 30px;
        }
        
        .otp-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            margin-bottom: 25px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }
        
        .otp-title {
            font-size: 24px;
            margin-bottom: 20px;
            font-weight: 600;
        }
        
        .otp-code {
            font-size: 42px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #fff;
            background: rgba(255, 255, 255, 0.15);
            padding: 15px 30px;
            border-radius: 10px;
            margin: 20px 0;
            display: block;
            border: 2px dashed rgba(255, 255, 255, 0.5);
            text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
        }
        
        .instructions {
            background: #fff3cd;
            padding: 20px;
            border-radius: 10px;
            border: 1px solid #ffeaa7;
            margin-bottom: 25px;
        }
        
        .instructions h4 {
            color: #856404;
            margin-bottom: 15px;
            font-size: 18px;
            display: flex;
            align-items: center;
        }
        
        .instructions h4:before {
            content: "🔐";
            margin-right: 10px;
        }
        
        .instructions ul {
            color: #856404;
            padding-left: 20px;
        }
        
        .instructions li {
            margin-bottom: 8px;
        }
        
        .footer {
            text-align: center;
            padding: 20px;
            background-color: #f8f9fa;
            border-top: 1px solid #eaeaea;
            color: #666;
            font-size: 14px;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            color: white;
            padding: 12px 30px;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 600;
            margin: 20px 0;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(0, 0, 0, 0.25);
        }
        
        .timer {
            display: inline-block;
            background: rgba(255, 255, 255, 0.9);
            color: #e91e63;
            padding: 8px 15px;
            border-radius: 50px;
            font-weight: 600;
            margin-top: 10px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        
        @media (max-width: 480px) {
            .email-container {
                border-radius: 0;
            }
            
            .content {
                padding: 20px;
            }
            
            .otp-code {
                font-size: 32px;
                letter-spacing: 5px;
                padding: 12px 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <img src="https://res.cloudinary.com/dlcgqwmin/image/upload/v1763730196/logo_header_yaeedm.png" alt="Chithirai Creations Logo" class="logo">
            <h1>ComSymp</h1>
        </div>
        
       
        
        <div class="content">
            <h2 style="color: #333; text-align: center; margin-bottom: 20px;">🎉 Email Verification 🎉</h2>
            
            <div class="otp-section">
                <h3 class="otp-title">Your Verification Code</h3>
                <p>Please use the following OTP to verify your email address:</p>
                
                <div class="otp-code">
                    ${otp}
                </div>
                
                <div class="timer">
                    ⏳ Valid for 10 minutes
                </div>
            </div>
            
            <div class="instructions">
                <h4>Important Instructions:</h4>
                <ul>
                    <li>Enter this OTP on the verification page to complete your registration</li>
                    <li>Do not share this OTP with anyone</li>
                    <li>This OTP will expire in 10 minutes for security reasons</li>
                    <li>If you didn't request this OTP, please ignore this email</li>
                </ul>
            </div>
            
            <p style="text-align: center; color: #666; margin-top: 20px;">
                Need help? Contact our support team at <a href="mailto:chithiraicreationsofficial@gmail.com
" style="color: #ee5a24;">123@gmail.com</a>
            </p>
        </div>
        
    </div>
</body>
</html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (err) {
    console.error("OTP Email Failed:", err);
    return false;
  }
};

// ---------------------------------------
// SEND TICKET EMAIL
// ---------------------------------------
const sendTicket = async (email, ticketData, qrCode) => {


  console.log(email, ticketData, qrCode);
  const mailOptions = {
    from: {
      name: process.env.FROM_AME,
      address: process.env.FROM_EMAIL,
    },
    to: email,
    subject: "🎉 ComSymp - 2026 Ticket is Here!",
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ComSymp</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Poppins', Arial, sans-serif;
        }
        
        body {
            background-color: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            padding: 25px 30px;
            text-align: center;
            color: white;
        }
        
        .logo {
            max-width: 180px;
            margin: 0 auto 15px;
            display: block;
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 5px;
            text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
        }
        
        .header p {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .presented-by {
            background-color: #f8f9fa;
            padding: 10px;
            text-align: center;
            font-size: 14px;
            color: #666;
            border-bottom: 1px solid #eaeaea;
        }
        
        .content {
            padding: 30px;
        }
        
        .ticket-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            margin-bottom: 25px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }
        
        .ticket-title {
            font-size: 24px;
            margin-bottom: 20px;
            font-weight: 600;
        }
        
        .ticket-details {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        
        .ticket-item {
            flex: 0 0 48%;
            margin-bottom: 15px;
            text-align: left;
        }
        
        .ticket-label {
            font-weight: 500;
            font-size: 14px;
            opacity: 0.9;
        }
        
        .ticket-value {
            font-weight: 600;
            font-size: 16px;
        }
        
        .qr-section {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 10px;
        }
        
        .qr-code {
            max-width: 200px;
            border: 2px solid #333;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .instructions {
            background: #fff3cd;
            padding: 20px;
            border-radius: 10px;
            border: 1px solid #ffeaa7;
            margin-bottom: 25px;
        }
        
        .instructions h4 {
            color: #856404;
            margin-bottom: 15px;
            font-size: 18px;
            display: flex;
            align-items: center;
        }
        
        .instructions h4:before {
            content: "📋";
            margin-right: 10px;
        }
        
        .instructions ul {
            color: #856404;
            padding-left: 20px;
        }
        
        .instructions li {
            margin-bottom: 8px;
        }
        
        .footer {
            text-align: center;
            padding: 20px;
            background-color: #f8f9fa;
            border-top: 1px solid #eaeaea;
            color: #666;
            font-size: 14px;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            color: white;
            padding: 12px 30px;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 600;
            text-align: center;
            display: block;
            width: 240px;
            margin: 20px auto;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(0, 0, 0, 0.25);
        }
        
        @media (max-width: 480px) {
            .email-container {
                border-radius: 0;
            }
            
            .content {
                padding: 20px;
            }
            
            .ticket-item {
                flex: 0 0 100%;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <img src="https://res.cloudinary.com/dlcgqwmin/image/upload/v1763730196/logo_header_yaeedm.png" alt="Chithirai Creations Logo" class="logo">
            <h1>ComSymp</h1>
        </div>
        
      
        
        <div class="content">
            <h2 style="color: #333; text-align: center; margin-bottom: 20px;">🎊 Welcome to New Year Celebration! 🎊</h2>
            
            <div class="ticket-section">
                <h3 class="ticket-title">Your Digital Ticket</h3>

                <!-- Ticket Details -->
                <div class="ticket-details">
                    <div class="ticket-item">
                        <div class="ticket-label">Ticket ID</div>
                        <div class="ticket-value">${ticketData.ticketId}</div>
                    </div>
                </div>

                <div class="ticket-details">
                     <div class="ticket-item">
                        <div class="ticket-label">Name</div>
                        <div class="ticket-value">${ticketData.name}</div>
                    </div>
                </div>

                 <div class="ticket-details">
                    <div class="ticket-item">
                        <div class="ticket-label"> Tickets</div>
                        <div class="ticket-value">${ticketData.adultTicketCount}</div>
                    </div>
                </div>

                

                <div class="ticket-details">
                    <div class="ticket-item">
                        <div class="ticket-label">Total Amount</div>
                        <div class="ticket-value">₹${ticketData.totalAmount}</div>
                    </div>
                </div>

                <!-- ⭐ Added Event Details Below -->
                <div class="ticket-details">
                    <div class="ticket-item">
                        <div class="ticket-label">Event Date</div>
                        <div class="ticket-value">31 December 2025</div>
                    </div>
               
                </div>

                  <div class="ticket-details">
                    <div class="ticket-item">
                        <div class="ticket-label">Event Time</div>
                        <div class="ticket-value">7:00 PM – 1:00 AM</div>
                    </div>
                </div>


                <div class="ticket-details">
                    <div class="ticket-item" style="flex: 0 0 100%;">
                        <div class="ticket-label">Venue</div>
                        <div class="ticket-value">The Party Park - Madurai</div>
                    </div>
                </div>
                <!-- ⭐ End Event Details -->

            </div>
            
            <div class="qr-section">
                <img src="${qrCode}" alt="QR Code" class="qr-code" />
                <p style="margin-top: 15px; font-weight: 500;">Scan this QR code at the entrance</p>
            </div>
            
            <div class="instructions">
                <h4>Important Instructions:</h4>
                <ul>
                    <li>Keep this QR code safe and secure</li>
                    <li>Show this QR code at the entrance for verification</li>
                    <li>Each QR code is valid for ${ticketData.ticketCount} person(s)</li>
                    <li>Don't share this QR code with anyone</li>
                    <li>Arrive 30 minutes before the event starts</li>
                </ul>
            </div>
            
          
        </div>
        
      
    </div>
</body>
</html>

`

,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (err) {
    console.error("Ticket Email Failed:", err);
    return false;
  }
};

// ---------------------------------------
// SEND CANCELLATION EMAIL
// ---------------------------------------
const sendCancellationEmail = async (email, ticketData, reason) => {
  const mailOptions = {
    from: process.env.FROM_EMAIL,
    to: email,
    subject: "❌ Booking Cancelled - New Year Celebration",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; text-align: center;">Booking Cancellation</h2>
        <div style="background: #ffe6e6; padding: 20px; border-radius: 10px; border: 1px solid #ffcccc;">
          <h3 style="color: #d63031;">Your booking has been cancelled</h3>
          <p><strong>Ticket ID:</strong> ${ticketData.ticketId}</p>
          <p><strong>Name:</strong> ${ticketData.name}</p>
          <p><strong>Tickets:</strong> ${ticketData.ticketCount}</p>
          <p><strong>Amount Refunded:</strong> ₹${ticketData.totalAmount}</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p><strong>Cancellation Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 20px;">
          <p><strong>Refund Information:</strong></p>
          <p>The refund amount of ₹${ticketData.totalAmount
      } will be processed within 5-7 business days.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (err) {
    console.error("Cancellation Email Failed:", err);
    return false;
  }
};

// ---------------------------------------
// SEND THANK YOU EMAIL
// ---------------------------------------
const sendThankYouEmail = async (email, userName) => {
  const mailOptions = {
    from: process.env.FROM_EMAIL,
    to: email,
    subject: "🎉 Thank You for Attending New Year Celebration!",
    html: `
      <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thank You for Attending !</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Poppins', Arial, sans-serif;
        }
        
        body {
            background-color: #f5f5f5;
            color: #333;
            line-height: 1.6;
            padding: 20px 0;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            padding: 25px 30px;
            text-align: center;
            color: white;
        }
        
        .logo {
            max-width: 180px;
            margin: 0 auto 15px;
            display: block;
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 5px;
            text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
        }
        
        .header p {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .presented-by {
            background-color: #f8f9fa;
            padding: 10px;
            text-align: center;
            font-size: 14px;
            color: #666;
            border-bottom: 1px solid #eaeaea;
        }
        
        .content {
            padding: 30px;
        }
        
        .thankyou-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            margin-bottom: 25px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }
        
        .thankyou-title {
            font-size: 24px;
            margin-bottom: 20px;
            font-weight: 600;
        }
        
        .emoji-celebration {
            font-size: 60px;
            margin: 20px 0;
            animation: bounce 2s infinite;
        }
        
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        
        .user-name {
            font-size: 22px;
            font-weight: 600;
            color: #fff;
            margin: 15px 0;
            text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
        }
        
        .message-section {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 10px;
            margin-bottom: 25px;
            border-left: 4px solid #ee5a24;
        }
        
        .message-section p {
            margin-bottom: 15px;
            color: #555;
        }
        
        .highlight {
            color: #ee5a24;
            font-weight: 600;
        }
        
        .gallery-preview {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background: #fff3cd;
            border-radius: 10px;
            border: 1px solid #ffeaa7;
        }
        
        .gallery-preview h4 {
            color: #856404;
            margin-bottom: 15px;
            font-size: 18px;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            color: white;
            padding: 12px 30px;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 600;
            margin: 15px 0;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(0, 0, 0, 0.25);
        }
        
        .social-section {
            text-align: center;
            margin: 25px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
        }
        
        .social-icons {
            margin: 15px 0;
        }
        
        .social-icons a {
            display: inline-block;
            margin: 0 10px;
            font-size: 20px;
            color: #ee5a24;
            transition: transform 0.3s ease;
        }
        
        .social-icons a:hover {
            transform: scale(1.2);
        }
        
        .footer {
            text-align: center;
            padding: 20px;
            background-color: #f8f9fa;
            border-top: 1px solid #eaeaea;
            color: #666;
            font-size: 14px;
        }
        
        @media (max-width: 480px) {
            .email-container {
                border-radius: 0;
            }
            
            .content {
                padding: 20px;
            }
            
            .emoji-celebration {
                font-size: 50px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <img src="https://res.cloudinary.com/dlcgqwmin/image/upload/v1763730196/logo_header_yaeedm.png" alt="Chithirai Creations Logo" class="logo">
            <h1>ComSymp</h1>
        </div>
        
      
        
        <div class="content">
            <div class="thankyou-section">
                <h3 class="thankyou-title">Thank You for Celebrating with Us! 🎊</h3>
                <div class="user-name">Dear ${userName},</div>
                <div class="emoji-celebration">
                    🎉🎆✨
                </div>
                <p>We hope you had an unforgettable experience at our New Year Celebration!</p>
            </div>
            
            <div class="message-section">
                <p>Your presence made our event even more special and memorable. We're truly grateful that you chose to ring in the new year with us.</p>
                
                <p>The energy, laughter, and joy you brought to the celebration created magical moments that we'll cherish forever.</p>
                
                <p class="highlight">Wishing you a year filled with happiness, success, and wonderful adventures!</p>
            </div>
            
           
            
            <div class="social-section">
                <h4>Share Your Experience</h4>
                <p>Tag us in your photos and use our hashtag:</p>
                <p class="highlight">#ReadyaMamey2025 #ChithiraiCreations</p>
                
                
            </div>
            
            <p style="text-align: center; color: #666; margin-top: 20px;">
                We look forward to celebrating more special moments with you!
            </p>
            
           
        </div>
        
        <div class="footer">
            <p>© 2025 Chithirai Creations. All rights reserved.</p>
            <p>Contact us: chithiraicreationsofficial@gmail.com | +91 8148586978</p>
            <p style="margin-top: 10px; font-size: 12px; color: #999;">
                You received this email because you attended our New Year Celebration 2025 event.
            </p>
        </div>
    </div>
</body>
</html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (err) {
    console.error("Thank You Email Failed:", err);
    return false;
  }
};


// services/emailService.js - Add this function
const sendAdminCreatedTicketEmail = async (

    email, 
    name, 
    ticketId, 
    adultTickets, 
    childrenTickets,
    adultPrice,
    childrenPrice,
    totalAmount,
    paymentMethod,
    discountApplied,
    discountAmount,
    qrCodeBase64
) => {
    try {
        const mailOptions = {
            from: {
                name: process.env.FROM_AME,
                address: process.env.FROM_EMAIL,
              },
            to: email,
            subject: '🎟️ Your Ticket for New Year Celebration (Admin Entry)',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                        .ticket-info { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border: 2px dashed #ddd; }
                        .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
                        .info-label { font-weight: bold; color: #666; }
                        .info-value { color: #333; }
                        .qr-container { text-align: center; margin: 30px 0; }
                        .qr-code { max-width: 200px; border: 2px solid #333; border-radius: 10px; }
                        .payment-note { background: #fff3cd; padding: 15px; border-radius: 10px; border: 1px solid #ffeaa7; color: #856404; }
                        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>🎉 Welcome to New Year Celebration 2025! 🎉</h2>
                            <p>Your ticket has been created by our event team</p>
                        </div>
                        
                        <div class="content">
                            <h3>Dear ${name},</h3>
                            <p>Your ticket for the New Year Celebration has been successfully created!</p>
                            
                            <div class="ticket-info">
                                <div class="info-row">
                                    <span class="info-label">Ticket ID:</span>
                                    <span class="info-value"><strong>${ticketId}</strong></span>
                                </div>
                                <div class="info-row">
                                    <span class="info-label">Adult Tickets:</span>
                                    <span class="info-value">
                                    ${adultTickets} × ₹${adultPrice} = ₹${adultTickets * adultPrice}
                                    </span>
                                </div>

                                 ${childrenTickets > 0 ? `
                                    <div class="info-row">
                                    <span class="info-label">Children Tickets:</span>
                                    <span class="info-value">
                                    ${childrenTickets} × ₹${childrenPrice} = ₹${childrenTickets * childrenPrice}
                                    </span>
                                </div>
                                    ` : ''}
                                <div class="info-row">
                                    <span class="info-label">Total Amount:</span>
                                    <span class="info-value">₹${totalAmount}</span>
                                </div>
                                <div class="info-row">
                                    <span class="info-label">Payment Method:</span>
                                    <span class="info-value">${paymentMethod === 'cash' ? '💵 Cash Payment' : '📱 UPI Payment'}</span>
                                </div>
                                <div class="info-row">
                                    <span class="info-label">Status:</span>
                                    <span class="info-value" style="color: #28a745; font-weight: bold;">✅ Confirmed</span>
                                </div>
                            </div>
                            
                            <div class="qr-container">
                                <h4>Your Entry QR Code</h4>
                                <img src="${qrCodeBase64}" alt="QR Code" class="qr-code" />
                                <p><em>Show this QR code at the entrance for verification</em></p>
                            </div>
                            
                            ${paymentMethod === 'cash' ? `
                                <div class="payment-note">
                                    <h4>💵 Cash Payment Note</h4>
                                    <p>Your ticket was created with cash payment. Please keep the payment receipt safe.</p>
                                </div>
                            ` : ''}
                            
                            <div style="background: #d4edda; padding: 15px; border-radius: 10px; border: 1px solid #c3e6cb; color: #155724; margin: 20px 0;">
                                <h4>📋 Important Instructions:</h4>
                                <ul>
                                    <li>Keep this QR code safe and secure</li>
                                    <li>Show this QR code at the entrance for verification</li>
                                    <li>Each QR code is valid for ${Number(adultTickets) + Number(childrenTickets)} person(s)</li>
                                    <li>Arrive 30 minutes before the event starts</li>
                                    <li>Don't share this QR code with anyone</li>
                                </ul>
                            </div>
                            
                            <div class="footer">
                                <p>For any queries, contact: chithiraicreationsofficial@gmail.com</p>
                                <p>© 2025 Chithirai Creations. All rights reserved.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `,
            attachments: qrCodeBase64 ? [{
                filename: 'ticket-qr.png',
                content: qrCodeBase64.split('base64,')[1],
                encoding: 'base64',
                contentType: 'image/png'
            }] : []
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Send admin ticket email error:', error);
        return false;
    }
}

// ---------------------------------------
// SEND DIWALI CONTEST VERIFICATION TOKEN
// ---------------------------------------
const sendDiwaliVerificationToken = async (participant, token) => {
    try {
        const mailOptions = {
            from: {
                name: process.env.FROM_AME || "Chithirai Creations",
                address: process.env.FROM_EMAIL || "sales@blocksentinels.com",
            },
            to: participant.email,
            subject: `🪔 Official Contest Token: ${token} - Digital Diwali Palagaram Villa 2026`,
            html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta name="color-scheme" content="light dark">
                <meta name="supported-color-schemes" content="light dark">
                <title>Contest Verification Token</title>
                <style>
                    :root {
                        color-scheme: light dark;
                        supported-color-schemes: light dark;
                    }
                    body {
                        font-family: Arial, Helvetica, sans-serif;
                        background-color: #0d0214;
                        color: #ffffff;
                        margin: 0;
                        padding: 20px;
                        -webkit-font-smoothing: antialiased;
                    }
                    .email-wrapper {
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #1c062a;
                        border: 2px solid #ffd700;
                        border-radius: 18px;
                        overflow: hidden;
                        box-shadow: 0 10px 40px rgba(0,0,0,0.8);
                    }
                    .email-header {
                        background: linear-gradient(135deg, #ff8c00 0%, #e53935 100%);
                        background-color: #ff8c00;
                        padding: 30px 20px;
                        text-align: center;
                    }
                    .email-body {
                        padding: 28px 22px;
                        background-color: #1c062a;
                    }
                    .token-card {
                        background: linear-gradient(135deg, #ffd700 0%, #ff9100 100%);
                        background-color: #ff9100;
                        color: #12041c !important;
                        padding: 22px 18px;
                        border-radius: 14px;
                        text-align: center;
                        margin: 24px 0;
                        box-shadow: 0 8px 25px rgba(255, 145, 0, 0.45);
                    }
                    .details-table {
                        width: 100%;
                        border-collapse: separate;
                        border-spacing: 0;
                        margin: 22px 0;
                        background-color: #2b0e3f;
                        border: 1px solid #ffd700;
                        border-radius: 12px;
                        overflow: hidden;
                    }
                    .steps-box {
                        background-color: #2b1300;
                        border: 2px dashed #ff9800;
                        border-radius: 12px;
                        padding: 20px;
                        margin: 25px 0;
                    }
                    @media (prefers-color-scheme: dark) {
                        body { background-color: #0d0214 !important; }
                        .email-wrapper { background-color: #1c062a !important; }
                        .dark-text-white { color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; }
                        .dark-text-gold { color: #ffd700 !important; -webkit-text-fill-color: #ffd700 !important; }
                        .dark-table-bg { background-color: #2b0e3f !important; }
                    }
                    [data-ogsc] .dark-text-white { color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; }
                    [data-ogsc] .dark-text-gold { color: #ffd700 !important; -webkit-text-fill-color: #ffd700 !important; }
                </style>
            </head>
            <body style="margin: 0; padding: 20px; background-color: #0d0214; font-family: Arial, Helvetica, sans-serif;" bgcolor="#0d0214">
                <div class="email-wrapper" style="max-width: 600px; margin: 0 auto; background-color: #1c062a; border: 2px solid #ffd700; border-radius: 18px; overflow: hidden;" bgcolor="#1c062a">
                    <!-- Top Header -->
                    <div class="email-header" style="background: linear-gradient(135deg, #ff8c00 0%, #e53935 100%); background-color: #ff8c00; padding: 28px 20px; text-align: center;" bgcolor="#ff8c00">
                        <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px; color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; text-transform: uppercase; font-weight: 800;">
                            <span style="color: #ffffff !important; -webkit-text-fill-color: #ffffff !important;">🪔 Digital Diwali Palagaram Villa</span>
                        </h1>
                        <p style="margin: 8px 0 0; font-size: 14px; color: #fff8e7 !important; -webkit-text-fill-color: #fff8e7 !important; font-weight: 600;">
                            <span style="color: #fff8e7 !important; -webkit-text-fill-color: #fff8e7 !important;">Contest Entry Official Verification Token</span>
                        </p>
                    </div>

                    <!-- Email Main Body -->
                    <div class="email-body" style="padding: 28px 22px; background-color: #1c062a;" bgcolor="#1c062a">
                        <p style="margin: 0 0 10px 0; font-size: 16px; color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; font-weight: 600;">
                            <span style="color: #ffffff !important; -webkit-text-fill-color: #ffffff !important;">Dear <strong style="color: #ffd700 !important; -webkit-text-fill-color: #ffd700 !important;">${participant.name}</strong>,</span>
                        </p>
                        <p style="margin: 0 0 22px 0; font-size: 14px; line-height: 1.6; color: #f0e6ff !important; -webkit-text-fill-color: #f0e6ff !important;">
                            <span style="color: #f0e6ff !important; -webkit-text-fill-color: #f0e6ff !important;">Congratulations! Your payment and contest registration have been <strong style="color: #ffd700 !important; -webkit-text-fill-color: #ffd700 !important;">verified and approved</strong> by our team.</span>
                        </p>
                        
                        <!-- Big Official Token Card -->
                        <div class="token-card" style="background: linear-gradient(135deg, #ffd700 0%, #ff9100 100%); background-color: #ff9100; color: #12041c !important; -webkit-text-fill-color: #12041c !important; padding: 22px 18px; border-radius: 14px; text-align: center; margin: 24px 0; border: 1px solid #ffd700;" bgcolor="#ff9100">
                            <div style="font-size: 13px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px; color: #200830 !important; -webkit-text-fill-color: #200830 !important;">
                                <span style="color: #200830 !important; -webkit-text-fill-color: #200830 !important;">Official Contest Token</span>
                            </div>
                            <div style="font-size: 38px; font-weight: 900; letter-spacing: 4px; color: #12041c !important; -webkit-text-fill-color: #12041c !important; font-family: 'Courier New', Courier, monospace;">
                                <span style="color: #12041c !important; -webkit-text-fill-color: #12041c !important;">${token}</span>
                            </div>
                        </div>

                        <!-- Full User Details Table (100% Dark-Mode Proof Inline Colors) -->
                        <table class="details-table dark-table-bg" style="width: 100%; border-collapse: separate; border-spacing: 0; margin: 22px 0; background-color: #2b0e3f; border: 1px solid #ffd700; border-radius: 12px; overflow: hidden;" bgcolor="#2b0e3f">
                            <tr>
                                <td style="padding: 12px 16px; border-bottom: 1px solid #4a1f6a; font-size: 13px; color: #ffd700 !important; -webkit-text-fill-color: #ffd700 !important; font-weight: 700; width: 40%; vertical-align: top; background-color: #2b0e3f;" bgcolor="#2b0e3f">
                                    <span style="color: #ffd700 !important; -webkit-text-fill-color: #ffd700 !important;">Participant Name</span>
                                </td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid #4a1f6a; font-size: 14px; color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; font-weight: 700; vertical-align: top; background-color: #2b0e3f;" bgcolor="#2b0e3f">
                                    <span style="color: #ffffff !important; -webkit-text-fill-color: #ffffff !important;">${participant.name}</span>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 12px 16px; border-bottom: 1px solid #4a1f6a; font-size: 13px; color: #ffd700 !important; -webkit-text-fill-color: #ffd700 !important; font-weight: 700; vertical-align: top; background-color: #2b0e3f;" bgcolor="#2b0e3f">
                                    <span style="color: #ffd700 !important; -webkit-text-fill-color: #ffd700 !important;">Gender &amp; Age</span>
                                </td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid #4a1f6a; font-size: 14px; color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; font-weight: 600; vertical-align: top; background-color: #2b0e3f;" bgcolor="#2b0e3f">
                                    <span style="color: #ffffff !important; -webkit-text-fill-color: #ffffff !important;">${participant.gender || "—"} • ${participant.age} Years</span>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 12px 16px; border-bottom: 1px solid #4a1f6a; font-size: 13px; color: #ffd700 !important; -webkit-text-fill-color: #ffd700 !important; font-weight: 700; vertical-align: top; background-color: #2b0e3f;" bgcolor="#2b0e3f">
                                    <span style="color: #ffd700 !important; -webkit-text-fill-color: #ffd700 !important;">Mobile Number</span>
                                </td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid #4a1f6a; font-size: 14px; color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; font-weight: 600; vertical-align: top; background-color: #2b0e3f;" bgcolor="#2b0e3f">
                                    <span style="color: #ffffff !important; -webkit-text-fill-color: #ffffff !important;">${participant.phone}</span>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 12px 16px; border-bottom: 1px solid #4a1f6a; font-size: 13px; color: #ffd700 !important; -webkit-text-fill-color: #ffd700 !important; font-weight: 700; vertical-align: top; background-color: #2b0e3f;" bgcolor="#2b0e3f">
                                    <span style="color: #ffd700 !important; -webkit-text-fill-color: #ffd700 !important;">Email Address</span>
                                </td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid #4a1f6a; font-size: 14px; color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; font-weight: 600; vertical-align: top; background-color: #2b0e3f;" bgcolor="#2b0e3f">
                                    <span style="color: #ffffff !important; -webkit-text-fill-color: #ffffff !important;">${participant.email}</span>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 12px 16px; border-bottom: 1px solid #4a1f6a; font-size: 13px; color: #ffd700 !important; -webkit-text-fill-color: #ffd700 !important; font-weight: 700; vertical-align: top; background-color: #2b0e3f;" bgcolor="#2b0e3f">
                                    <span style="color: #ffd700 !important; -webkit-text-fill-color: #ffd700 !important;">District &amp; State</span>
                                </td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid #4a1f6a; font-size: 14px; color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; font-weight: 600; vertical-align: top; background-color: #2b0e3f;" bgcolor="#2b0e3f">
                                    <span style="color: #ffffff !important; -webkit-text-fill-color: #ffffff !important;">${participant.district}, ${participant.state || "Tamil Nadu"}</span>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 12px 16px; border-bottom: 1px solid #4a1f6a; font-size: 13px; color: #ffd700 !important; -webkit-text-fill-color: #ffd700 !important; font-weight: 700; vertical-align: top; background-color: #2b0e3f;" bgcolor="#2b0e3f">
                                    <span style="color: #ffd700 !important; -webkit-text-fill-color: #ffd700 !important;">Instagram Profile</span>
                                </td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid #4a1f6a; font-size: 14px; color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; font-weight: 600; vertical-align: top; background-color: #2b0e3f;" bgcolor="#2b0e3f">
                                    <span style="color: #ffffff !important; -webkit-text-fill-color: #ffffff !important;">${participant.instagram_profile || participant.instagramProfile || "—"}</span>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 12px 16px; border-bottom: 1px solid #4a1f6a; font-size: 13px; color: #ffd700 !important; -webkit-text-fill-color: #ffd700 !important; font-weight: 700; vertical-align: top; background-color: #2b0e3f;" bgcolor="#2b0e3f">
                                    <span style="color: #ffd700 !important; -webkit-text-fill-color: #ffd700 !important;">Sweet / Palagaram</span>
                                </td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid #4a1f6a; font-size: 14px; color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; font-weight: 700; vertical-align: top; background-color: #2b0e3f;" bgcolor="#2b0e3f">
                                    <span style="color: #ffffff !important; -webkit-text-fill-color: #ffffff !important;">${participant.sweet_name || participant.sweetName}</span>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 12px 16px; border-bottom: 1px solid #4a1f6a; font-size: 13px; color: #ffd700 !important; -webkit-text-fill-color: #ffd700 !important; font-weight: 700; vertical-align: top; background-color: #2b0e3f;" bgcolor="#2b0e3f">
                                    <span style="color: #ffd700 !important; -webkit-text-fill-color: #ffd700 !important;">Contest Category</span>
                                </td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid #4a1f6a; font-size: 14px; color: #ffd700 !important; -webkit-text-fill-color: #ffd700 !important; font-weight: 800; vertical-align: top; background-color: #2b0e3f;" bgcolor="#2b0e3f">
                                    <span style="color: #ffd700 !important; -webkit-text-fill-color: #ffd700 !important;">${participant.category}</span>
                                </td>
                            </tr>
                            ${participant.ingredients ? `
                            <tr>
                                <td style="padding: 12px 16px; font-size: 13px; color: #ffd700 !important; -webkit-text-fill-color: #ffd700 !important; font-weight: 700; vertical-align: top; background-color: #2b0e3f;" bgcolor="#2b0e3f">
                                    <span style="color: #ffd700 !important; -webkit-text-fill-color: #ffd700 !important;">Ingredients / Recipe</span>
                                </td>
                                <td style="padding: 12px 16px; font-size: 13px; line-height: 1.5; color: #f0e6ff !important; -webkit-text-fill-color: #f0e6ff !important; vertical-align: top; background-color: #2b0e3f;" bgcolor="#2b0e3f">
                                    <span style="color: #f0e6ff !important; -webkit-text-fill-color: #f0e6ff !important;">${participant.ingredients}</span>
                                </td>
                            </tr>
                            ` : ""}
                        </table>

                        <!-- Next Steps Box -->
                        <div class="steps-box" style="background-color: #2b1300; border: 2px dashed #ff9800; border-radius: 12px; padding: 20px; margin: 25px 0;" bgcolor="#2b1300">
                            <h3 style="color: #ffd700 !important; -webkit-text-fill-color: #ffd700 !important; margin: 0 0 12px 0; font-size: 16px; font-weight: 800;">
                                <span style="color: #ffd700 !important; -webkit-text-fill-color: #ffd700 !important;">Next Steps to Participate:</span>
                            </h3>
                            <ol style="margin: 0; padding-left: 20px; color: #ffffff !important;">
                                <li style="color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; margin-bottom: 8px; font-size: 13px; line-height: 1.6;">
                                    <span style="color: #ffffff !important; -webkit-text-fill-color: #ffffff !important;">Make your unique Diwali sweet or snack yourself.</span>
                                </li>
                                <li style="color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; margin-bottom: 8px; font-size: 13px; line-height: 1.6;">
                                    <span style="color: #ffffff !important; -webkit-text-fill-color: #ffffff !important;">Record a <strong>90-sec Reel (you in it)</strong> &amp; click <strong>5 Photos</strong> on mobile in order: <em>Ingredients → Making → SVS Product in use → Dish → Final dish with you</em>.</span>
                                </li>
                                <li style="color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; margin-bottom: 8px; font-size: 13px; line-height: 1.6;">
                                    <span style="color: #ffffff !important; -webkit-text-fill-color: #ffffff !important;"><strong>MAIN POINT: SVS Product</strong> (Choose any 1): Option 1: Use SVS product in photo/video, OR Option 2: Mention SVS slogan in description (Photo) or speak in video (Reel).</span>
                                </li>
                                <li style="color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; margin-bottom: 8px; font-size: 13px; line-height: 1.6;">
                                    <span style="color: #ffffff !important; -webkit-text-fill-color: #ffffff !important;"><strong>Mention your Official Token (${token})</strong> in your Instagram caption.</span>
                                </li>
                                <li style="color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; margin-bottom: 8px; font-size: 13px; line-height: 1.6;">
                                    <span style="color: #ffffff !important; -webkit-text-fill-color: #ffffff !important;"><strong>COLLAB IS A MUST:</strong> Collab with BOTH accounts: <strong>@chithirai.creations</strong> and <strong>@svsfoods</strong>.</span>
                                </li>
                                <li style="color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; margin-bottom: 8px; font-size: 13px; line-height: 1.6;">
                                    <span style="color: #ffffff !important; -webkit-text-fill-color: #ffffff !important;">Upload between <strong>28 Oct and 09 Nov 2026</strong>.</span>
                                </li>
                            </ol>
                        </div>

                        <p style="text-align: center; color: #ffd700 !important; -webkit-text-fill-color: #ffd700 !important; font-weight: 800; margin-top: 25px; font-size: 14px;">
                            <span style="color: #ffd700 !important; -webkit-text-fill-color: #ffd700 !important;">🏆 Prizes Worth ₹1,00,000 + Top 50 Win ₹300 SVS Hampers!</span>
                        </p>
                    </div>

                    <!-- Email Footer -->
                    <div class="email-footer" style="text-align: center; padding: 18px; font-size: 12px; color: #d8b4fe !important; -webkit-text-fill-color: #d8b4fe !important; border-top: 1px solid rgba(255, 215, 0, 0.2); background-color: #14031f;" bgcolor="#14031f">
                        <span style="color: #d8b4fe !important; -webkit-text-fill-color: #d8b4fe !important;">
                            © 2026 Chithirai Creations. Title Sponsor: SVS Foods.<br/>
                            For queries: chithiraicreations@gmail.com | WhatsApp: +91 70102 40042
                        </span>
                    </div>
                </div>
            </body>
            </html>
            `,
        };

        try {
            const info = await transporter.sendMail(mailOptions);
            console.log(`✅ Diwali token email sent to ${participant.email}: ${info.messageId}`);
            return { success: true, messageId: info.messageId };
        } catch (firstErr) {
            console.warn(`⚠️ First attempt to email ${participant.email} failed: ${firstErr.message}. Retrying immediately...`);
            try {
                const retryInfo = await transporter.sendMail(mailOptions);
                console.log(`✅ Diwali token email sent on retry to ${participant.email}: ${retryInfo.messageId}`);
                return { success: true, messageId: retryInfo.messageId };
            } catch (retryErr) {
                console.error(`❌ Retry failed to email ${participant.email}:`, retryErr.message);
                return { success: false, error: retryErr.message };
            }
        }
    } catch (error) {
        console.error('Send Diwali token email error:', error.message);
        return { success: false, error: error.message };
    }
};

module.exports = {
  sendOTP,
  sendTicket,
  sendCancellationEmail,
  sendThankYouEmail,
  sendAdminCreatedTicketEmail,
  sendDiwaliVerificationToken,
  transporter,
};




