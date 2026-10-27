const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const User = require('../models/User');
const QRService = require('../services/qrService');
const EmailService = require('../services/emailService');
const razorpay = require('../config/razorpay');


const ticketController = {
    // Check ticket availability
    async checkAvailability(req, res) {
        try {
            const event = await Event.findOne({ isActive: true });

            if (!event) {
                return res.status(404).json({
                    success: false,
                    message: 'Event not found'
                });
            }

            res.json({
                success: true,
                data: {
                    totalTickets: event.maxTickets,
                    bookedTickets: event.bookedTickets,
                    availableTickets: event.maxTickets - event.bookedTickets,
                    ticketPrice: event.ticketPrice
                }
            });

        } catch (error) {
            console.error('Check availability error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },



    async createOrder(req, res) {
        try {
           const { ticketCount, adultTickets, childrenTickets = 0 } = req.body;
            const event = await Event.findOne({ isActive: true });
    
    
            if (!event) {
                return res.status(404).json({
                    success: false,
                    message: 'Event not found'
                });
            }
    
            // Check ticket availability
            if (!event.checkAvailability(adultTickets)) {
                return res.status(400).json({
                    success: false,
                    message: 'Not enough tickets available'
                });
            }
    
            
               // Calculate amount for adults and children separately
               let adultAmount;
               const DISCOUNT_PER_TICKET = 300; // ₹300 discount per adult ticket for 2+ tickets
            
               if (adultTickets <= 1) {
                // No discount for single ticket
                adultAmount = event.ticketPrice * adultTickets;
            } else {
                // Apply ₹300 discount per ticket for 2 or more tickets
                const discountedPricePerTicket = event.ticketPrice - DISCOUNT_PER_TICKET;
                adultAmount = discountedPricePerTicket * adultTickets;
            }
            
            // Children tickets (unlimited, always ₹999)
            const childrenAmount = childrenTickets * 999;
            const totalAmount = adultAmount + childrenAmount;
    
            const options = {
                amount: totalAmount * 100, // amount in paise
                currency: "INR",
                receipt: `receipt_${Date.now()}`,
                notes: {
                    adultTicketCount: adultTickets,
                    childrenTicketCount: childrenTickets || 0,
                    event: "Readyah Maamey 2026",
                    originalPrice: event.ticketPrice,
                    discountedPrice: adultTickets > 1 ? (event.ticketPrice - DISCOUNT_PER_TICKET) : event.ticketPrice,
                    totalDiscount: adultTickets > 1 ? DISCOUNT_PER_TICKET * adultTickets : 0,
                    discountApplied: adultTickets > 1,
                    childrenTicketPrice: 999
                }
            };
    
            const order = await razorpay.orders.create(options);
        
            res.json({
                success: true,
                data: {
                    orderId: order.id,
                    amount: order.amount,
                    currency: order.currency,
                    adultTicketCount: adultTickets,
                    childrenTicketCount: childrenTickets || 0,
                    originalPrice: event.ticketPrice,
                    discountedPrice: adultTickets > 1 ? (event.ticketPrice - DISCOUNT_PER_TICKET) : event.ticketPrice,
                    totalAmount: totalAmount,
                    discountApplied: adultTickets > 1,
                    discountAmount: adultTickets > 1 ? DISCOUNT_PER_TICKET * adultTickets : 0
                }
            });
    
        } catch (error) {
            console.error('Create order error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create order'
            });
        }
    },

    // Book tickets after successful payment
    async bookTickets(req, res) {
        try {
            const { name, phone, ticketCount, childrenTicketCount = 0, paymentId, orderId } = req.body;            
            const userId = req.user._id;

            const event = await Event.findOne({ isActive: true });

            if (!event) {
                return res.status(404).json({
                    success: false,
                    message: 'Event not found'
                });
            }

            // Check availability again (race condition protection)
            if (!event.checkAvailability(ticketCount)) {
                return res.status(400).json({
                    success: false,
                    message: 'Not enough tickets available'
                });
            }

            // Check if paymentId already used (prevent duplicate bookings)
            const existingTicket = await Ticket.findOne({ paymentId });
            if (existingTicket) {
                return res.status(400).json({
                    success: false,
                    message: 'Payment already processed'
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

           // Calculate amounts
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
            paymentId,
            orderId,
            createdAt: new Date()
        };



          // Generate QR code
          const qrCodeBase64 = await QRService.generateQRCodeURL(ticketData);

          // Create ticket record
          const ticket = new Ticket({
              ...ticketData,
              qrCode: qrCodeBase64
          });

          await ticket.save();

            // Send ticket email with QR code as attachment
            const emailSent = await EmailService.sendTicket(user.email, ticketData, qrCodeBase64);

            if (!emailSent) {
                console.error('Failed to send ticket email to:', user.email);
                // Don't throw error, just log it
            }



            res.json({
                success: true,
                message: 'Tickets booked successfully',
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
                    }
                }
            });

        } catch (error) {
            console.error('Book tickets error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to book tickets'
            });
        }
    },

    // Get user tickets
    async getUserTickets(req, res) {
        try {
            const userId = req.user._id;

            const tickets = await Ticket.find({ userId })
                .select('-qrCode -paymentId -orderId')
                .sort({ createdAt: -1 });

            res.json({
                success: true,
                data: {
                    tickets
                }
            });

        } catch (error) {
            console.error('Get user tickets error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch tickets'
            });
        }
    },

    // Get ticket by ID (for QR verification)
    async getTicketById(req, res) {
        try {
            const { ticketId } = req.params;

            const ticket = await Ticket.findOne({ ticketId })
                .populate('userId', 'name email phone');

            if (!ticket) {
                return res.status(404).json({
                    success: false,
                    message: 'Ticket not found'
                });
            }

            // Return minimal info for security
            res.json({
                success: true,
                data: {
                    ticket: {
                        ticketId: ticket.ticketId,
                        name: ticket.name,
                        ticketCount: ticket.ticketCount,
                        status: ticket.status,
                        verifiedAt: ticket.verifiedAt
                    }
                }
            });

        } catch (error) {
            console.error('Get ticket error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch ticket'
            });
        }
    },


    async getTicketDetails(req, res) {
        try {
            const { ticketId } = req.params;

            if (!ticketId) {
                return res.status(400).json({
                    success: false,
                    message: 'Ticket ID is required'
                });
            }

            const ticket = await Ticket.findOne({ ticketId })
                .select('-__v -updatedAt')
                .lean();

            if (!ticket) {
                return res.status(404).json({
                    success: false,
                    message: 'Ticket not found'
                });
            }

            res.json({
                success: true,
                data: {
                    ticket
                }
            });
        } catch (error) {
            console.error('Get ticket details error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching ticket details'
            });
        }
    }
};

module.exports = ticketController;