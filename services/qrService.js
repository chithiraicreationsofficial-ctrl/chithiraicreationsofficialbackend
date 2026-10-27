// // const QRCode = require('qrcode');
// // const crypto = require('crypto');

// // class QRService {
// //     generateTicketId() {
// //         return `TKT${Date.now()}${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
// //     }

// //     async generateQRCode(ticketData) {
// //         try {
// //             const qrData = {
// //                 ticketId: ticketData.ticketId,
// //                 event: 'New Year Celebration 2024',
// //                 timestamp: ticketData.createdAt,
// //                 securityHash: this.generateSecurityHash(ticketData.ticketId)
// //             };

// //             const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));
// //             return qrCode;
// //         } catch (error) {
// //             throw new Error('QR code generation failed');
// //         }
// //     }

// //     generateSecurityHash(ticketId) {
// //         return crypto
// //             .createHmac('sha256', process.env.JWT_SECRET)
// //             .update(ticketId)
// //             .digest('hex')
// //             .substring(0, 16);
// //     }

// //     verifySecurityHash(ticketId, securityHash) {
// //         const expectedHash = this.generateSecurityHash(ticketId);
// //         return expectedHash === securityHash;
// //     }
// // }

// // module.exports = new QRService();

// const QRCode = require('qrcode');
// const crypto = require('crypto');

// class QRService {
//     generateTicketId() {
//         return `TKT${Date.now()}${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
//     }

//     async generateQRCode(ticketData) {
//         try {
//             const qrData = JSON.stringify({
//                 ticketId: ticketData.ticketId,
//                 event: 'New Year Celebration 2024',
//                 timestamp: ticketData.createdAt,
//                 securityHash: this.generateSecurityHash(ticketData.ticketId)
//             });

//             // Generate QR code as base64 without data URL prefix
//             const qrCodeBuffer = await QRCode.toBuffer(qrData, {
//                 width: 300,
//                 height: 300,
//                 margin: 2,
//                 color: {
//                     dark: '#000000',
//                     light: '#FFFFFF'
//                 }
//             });

//             // Convert to base64
//             const qrCodeBase64 = qrCodeBuffer.toString('base64');

//             return qrCodeBase64;

//         } catch (error) {
//             console.error('QR code generation failed:', error);
//             throw new Error('QR code generation failed');
//         }
//     }

//     generateSecurityHash(ticketId) {
//         return crypto
//             .createHmac('sha256', process.env.JWT_SECRET)
//             .update(ticketId)
//             .digest('hex')
//             .substring(0, 16);
//     }

//     verifySecurityHash(ticketId, securityHash) {
//         const expectedHash = this.generateSecurityHash(ticketId);
//         return expectedHash === securityHash;
//     }

//     // Method to decode QR data
//     decodeQRData(qrDataString) {
//         try {
//             return JSON.parse(qrDataString);
//         } catch (error) {
//             throw new Error('Invalid QR code data');
//         }
//     }
// }

// module.exports = new QRService();


const crypto = require('crypto');

class QRService {
    generateTicketId() {
        return `TKT${Date.now()}${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    }

    generateQRCodeURL(ticketId) {
        // Simple version - just the ticket ID in QR code
        const encodedTicketId = encodeURIComponent(ticketId);


        console.log(ticketId, "ticketId");

        const BASE_URL = 'https://www.chithiraicreations.com';

        const verificationURL = `${BASE_URL}/readyamamaey?ticketId=${ticketId.ticketId}`;

        const qrCodeURL = `https://quickchart.io/qr?text=${verificationURL}&size=280&margin=1&format=png`;

        return qrCodeURL;
    }

    // For verification - you can still add security if needed
    generateSecureQRCodeURL(ticketId) {
        const qrData = JSON.stringify({
            t: ticketId, // short key for ticketId
            e: 'NY2024', // event code
            h: this.generateSecurityHash(ticketId).substring(0, 8) // short hash
        });

        const encodedData = encodeURIComponent(qrData);
        return `https://quickchart.io/qr?text=${encodedData}&size=280&margin=1&format=png`;
    }

    generateSecurityHash(ticketId) {
        return crypto
            .createHmac('sha256', process.env.JWT_SECRET)
            .update(ticketId)
            .digest('hex')
            .substring(0, 16);
    }
}

module.exports = new QRService();