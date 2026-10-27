const crypto = require('crypto');
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const User = require('../models/User');
const QRService = require('../services/qrService');
const EmailService = require('../services/emailService');

const paymentController = {
    // Verify Razorpay payment
    async verifyPayment(req, res) {
        try {
            const {
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
                name,
                phone,
                ticketCount,
                childrenTicketCount = 0 // Add this
            } = req.body;

            const userId = req.user._id;

            // Verify payment signature
            const generatedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(razorpay_order_id + "|" + razorpay_payment_id)
                .digest('hex');

            if (generatedSignature !== razorpay_signature) {
                return res.status(400).json({
                    success: false,
                    message: 'Payment verification failed - Invalid signature'
                });
            }

            const event = await Event.findOne({ isActive: true });

            if (!event) {
                return res.status(404).json({
                    success: false,
                    message: 'Event not found'
                });
            }

            // Check if payment already processed
            const existingTicket = await Ticket.findOne({ paymentId: razorpay_payment_id });
            if (existingTicket) {
                return res.status(400).json({
                    success: false,
                    message: 'Payment already processed'
                });
            }

            // Check ticket availability
            if (!event.checkAvailability(ticketCount)) {
                // Refund payment if tickets not available
                // You can implement refund logic here
                return res.status(400).json({
                    success: false,
                    message: 'Not enough tickets available. Payment will be refunded.'
                });
            }

            // Reserve tickets
            event.reserveTickets(ticketCount);
            await event.save();

            // Update user details
            const user = await User.findById(userId);
            user.name = name;
            user.phone = phone;
            await user.save();

          
            let adultAmount;
            const DISCOUNT_PER_TICKET = 300;
            
            if (ticketCount <= 1) {
                adultAmount = event.ticketPrice * ticketCount;
            } else {
                const discountedPricePerTicket = event.ticketPrice - DISCOUNT_PER_TICKET;
                adultAmount = discountedPricePerTicket * ticketCount;
            }
            
            const childrenAmount = childrenTicketCount * 999;
            const totalAmount = adultAmount + childrenAmount;

            // Generate ticket
            const ticketId = QRService.generateTicketId();

            
            const ticketData = {
                ticketId,
                userId: user._id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                adultTicketCount: ticketCount,
                childrenTicketCount: childrenTicketCount,
                totalAmount,
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id,
                createdAt: new Date()
            };


            // Generate QR code
            const qrCode = await QRService.generateQRCodeURL(ticketData);

            // Create ticket record
            const ticket = new Ticket({
                ...ticketData,
                qrCode
            });

            await ticket.save();

            // Send ticket email
            await EmailService.sendTicket(user.email, ticketData, qrCode);

            res.json({
                success: true,
                message: 'Payment verified and tickets booked successfully',
                data: {
                    ticket: {
                        id: ticket._id,
                        ticketId: ticket.ticketId,
                        name: ticket.name,
                        email: ticket.email,
                        adultTicketCount: ticket.adultTicketCount,
                        childrenTicketCount: ticket.childrenTicketCount,
                        totalAmount: ticket.totalAmount,
                        qrCode: ticket.qrCode,
                        status: ticket.status,
                        createdAt: ticket.createdAt
                    },
                    payment: {
                        paymentId: razorpay_payment_id,
                        orderId: razorpay_order_id,
                        amount: totalAmount,
                        currency: 'INR'
                    }
                }
            });

        } catch (error) {
            console.error('Payment verification error:', error);
            res.status(500).json({
                success: false,
                message: 'Payment verification failed'
            });
        }
    },

    // Get payment status
    async getPaymentStatus(req, res) {
        try {
            const { orderId } = req.params;

            const ticket = await Ticket.findOne({ orderId })
                .select('ticketId status totalAmount ticketCount createdAt');

            if (!ticket) {
                return res.status(404).json({
                    success: false,
                    message: 'Payment not found'
                });
            }

            res.json({
                success: true,
                data: {
                    payment: {
                        orderId,
                        status: ticket.status === 'booked' ? 'success' : 'failed',
                        amount: ticket.totalAmount,
                        ticketCount: ticket.ticketCount,
                        ticketId: ticket.ticketId,
                        createdAt: ticket.createdAt
                    }
                }
            });

        } catch (error) {
            console.error('Get payment status error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch payment status'
            });
        }
    },

    // Handle payment failure
    async handlePaymentFailure(req, res) {
        try {
            const { orderId, reason } = req.body;

            // Log the failure for analytics
            console.log(`Payment failed for order ${orderId}: ${reason}`);

            // You can implement additional logic here like:
            // - Send failure email to user
            // - Update analytics
            // - Trigger retry mechanism

            res.json({
                success: true,
                message: 'Payment failure logged',
                data: {
                    orderId,
                    reason,
                    timestamp: new Date()
                }
            });

        } catch (error) {
            console.error('Payment failure handling error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process payment failure'
            });
        }
    },

    // Refund payment (admin only)
    async refundPayment(req, res) {
        try {
            const { ticketId, reason } = req.body;

            const ticket = await Ticket.findOne({ ticketId });

            if (!ticket) {
                return res.status(404).json({
                    success: false,
                    message: 'Ticket not found'
                });
            }

            if (ticket.status === 'cancelled') {
                return res.status(400).json({
                    success: false,
                    message: 'Ticket already cancelled'
                });
            }

         
            ticket.status = 'cancelled';
            await ticket.save();

            // Update event booked tickets count
            const event = await Event.findOne({ isActive: true });
            event.bookedTickets -= ticket.ticketCount;
            await event.save();

            // Send cancellation email
            await EmailService.sendCancellationEmail(ticket.email, ticket, reason);

            res.json({
                success: true,
                message: 'Payment refund processed successfully',
                data: {
                    ticketId: ticket.ticketId,
                    refundAmount: ticket.totalAmount,
                    status: 'cancelled'
                }
            });

        } catch (error) {
            console.error('Refund payment error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process refund'
            });
        }
    },

    // Get all payments (admin only)
    async getAllPayments(req, res) {
        try {
            const { page = 1, limit = 50, status } = req.query;
            const skip = (page - 1) * limit;

            let query = {};
            if (status && status !== 'all') {
                query.status = status;
            }

            const payments = await Ticket.find(query)
                .select('ticketId name email ticketCount totalAmount paymentId orderId status createdAt verifiedAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit));

            const total = await Ticket.countDocuments(query);
            const totalRevenue = await Ticket.aggregate([
                { $match: { status: 'booked' } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]);

            res.json({
                success: true,
                data: {
                    payments,
                    summary: {
                        totalRevenue: totalRevenue[0]?.total || 0,
                        totalBookings: total,
                        successfulPayments: await Ticket.countDocuments({ status: 'booked' }),
                        cancelledPayments: await Ticket.countDocuments({ status: 'cancelled' })
                    },
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            });

        } catch (error) {
            console.error('Get all payments error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch payments'
            });
        }
    }
};

module.exports = paymentController;