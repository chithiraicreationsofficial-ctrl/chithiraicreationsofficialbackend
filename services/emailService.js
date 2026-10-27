const nodemailer = require("nodemailer");
require("dotenv").config();

// ---------------------------------------
// CREATE TRANSPORTER (Reusable)
// ---------------------------------------



const transporter = nodemailer.createTransport({
  secure: false,
  port: process.env.EMAILPORT,
  host: process.env.EMAIL_HOST,
  auth: {
    user: process.env.FROM_EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
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
                <title>Contest Verification Token</title>
                <style>
                    body {
                        font-family: 'Poppins', Arial, sans-serif;
                        background-color: #12041c;
                        color: #ffffff;
                        margin: 0;
                        padding: 20px;
                    }
                    .email-wrapper {
                        max-width: 600px;
                        margin: 0 auto;
                        background: linear-gradient(145deg, #240a33 0%, #150520 100%);
                        border: 2px solid #ffd700;
                        border-radius: 20px;
                        overflow: hidden;
                        box-shadow: 0 10px 40px rgba(0,0,0,0.8);
                    }
                    .email-header {
                        background: linear-gradient(135deg, #ff8c00 0%, #e53935 100%);
                        padding: 30px 20px;
                        text-align: center;
                        color: #ffffff;
                    }
                    .email-header h1 {
                        margin: 0;
                        font-size: 24px;
                        letter-spacing: 1px;
                        text-transform: uppercase;
                    }
                    .email-header p {
                        margin: 8px 0 0;
                        font-size: 14px;
                        opacity: 0.95;
                    }
                    .email-body {
                        padding: 30px 25px;
                    }
                    .token-card {
                        background: linear-gradient(135deg, #ffd700 0%, #ff9100 100%);
                        color: #12041c;
                        padding: 20px;
                        border-radius: 14px;
                        text-align: center;
                        margin: 25px 0;
                        box-shadow: 0 8px 25px rgba(255, 145, 0, 0.4);
                    }
                    .token-label {
                        font-size: 12px;
                        font-weight: 800;
                        letter-spacing: 2px;
                        text-transform: uppercase;
                        margin-bottom: 5px;
                    }
                    .token-value {
                        font-size: 32px;
                        font-weight: 900;
                        letter-spacing: 3px;
                    }
                    .details-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 10px;
                        overflow: hidden;
                    }
                    .details-table td {
                        padding: 12px 16px;
                        border-bottom: 1px solid rgba(255, 215, 0, 0.15);
                        font-size: 14px;
                    }
                    .details-table td.label {
                        color: #ffd700;
                        font-weight: 600;
                        width: 40%;
                    }
                    .details-table td.value {
                        color: #ffffff;
                    }
                    .steps-box {
                        background: rgba(255, 215, 0, 0.08);
                        border: 1px dashed #ffd700;
                        border-radius: 12px;
                        padding: 18px 20px;
                        margin: 25px 0;
                    }
                    .steps-box h3 {
                        color: #ffd700;
                        margin-top: 0;
                        font-size: 16px;
                    }
                    .steps-box ol {
                        margin: 0;
                        padding-left: 20px;
                        color: #f0f0f0;
                        font-size: 13px;
                        line-height: 1.8;
                    }
                    .email-footer {
                        text-align: center;
                        padding: 20px;
                        font-size: 12px;
                        color: rgba(255, 255, 255, 0.6);
                        border-top: 1px solid rgba(255, 215, 0, 0.2);
                    }
                </style>
            </head>
            <body>
                <div class="email-wrapper">
                    <div class="email-header">
                        <h1>🪔 Digital Diwali Palagaram Villa</h1>
                        <p>Contest Entry Official Verification Token</p>
                    </div>
                    <div class="email-body">
                        <p style="font-size: 16px; color: #ffffff;">Dear <strong>${participant.name}</strong>,</p>
                        <p style="color: rgba(255,255,255,0.85); line-height: 1.6;">
                            Congratulations! Your payment and contest registration have been <strong>verified and approved</strong> by our team.
                        </p>
                        
                        <div class="token-card">
                            <div class="token-label">Official Contest Token</div>
                            <div class="token-value">${token}</div>
                        </div>

                        <table class="details-table">
                            <tr>
                                <td class="label">Registration ID</td>
                                <td class="value">${participant.registration_id || participant.registrationId}</td>
                            </tr>
                            <tr>
                                <td class="label">Participant Name</td>
                                <td class="value">${participant.name}</td>
                            </tr>
                            <tr>
                                <td class="label">Sweet / Palagaram</td>
                                <td class="value">${participant.sweet_name || participant.sweetName}</td>
                            </tr>
                            <tr>
                                <td class="label">Category</td>
                                <td class="value">${participant.category}</td>
                            </tr>
                            <tr>
                                <td class="label">District</td>
                                <td class="value">${participant.district}, Tamil Nadu</td>
                            </tr>
                        </table>

                        <div class="steps-box">
                            <h3>Next Steps to Participate:</h3>
                            <ol>
                                <li>Make your unique Diwali sweet or snack yourself.</li>
                                <li>Record a <strong>90-sec Reel (you in it)</strong> &amp; click <strong>5 Photos</strong> on mobile in order: <em>Ingredients → Making → SVS Product in use → Dish → Final dish with you</em>.</li>
                                <li><strong>MAIN POINT: SVS Product</strong> (Choose any 1): Option 1: Use SVS product in photo/video, OR Option 2: Mention SVS slogan in description (Photo) or speak in video (Reel).</li>
                                <li><strong>Mention your Token (${token})</strong> in your Instagram caption.</li>
                                <li><strong>COLLAB IS A MUST:</strong> Collab with BOTH accounts: <strong>@chithirai.creations</strong> and <strong>@svsfoods</strong>.</li>
                                <li>Upload between <strong>28 Oct and 09 Nov 2026</strong>.</li>
                            </ol>
                        </div>

                        <p style="text-align: center; color: #ffd700; font-weight: 700; margin-top: 25px;">
                            Prizes Worth ₹1,00,000 + Top 50 Win ₹300 SVS Hampers!
                        </p>
                    </div>
                    <div class="email-footer">
                        © 2026 Chithirai Creations. Title Sponsor: SVS Foods.<br/>
                        For queries: chithiraicreations@gmail.com | WhatsApp: +91 70102 40042
                    </div>
                </div>
            </body>
            </html>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Diwali token email sent to ${participant.email}: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('Send Diwali token email error:', error);
        return false;
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




