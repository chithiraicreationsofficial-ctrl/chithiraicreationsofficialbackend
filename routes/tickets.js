const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { auth } = require('../middleware/auth');
const { validateTicketBooking } = require('../middleware/validation');
const { bookingLimiter } = require('../middleware/rateLimit');

// Public routes
router.get('/availability', ticketController.checkAvailability);
router.get('/ticket/:ticketId', ticketController.getTicketById);

// Protected routes
router.use(auth);

router.post('/create-order', bookingLimiter, ticketController.createOrder);
router.post('/book', bookingLimiter, validateTicketBooking, ticketController.bookTickets);
router.get('/my-tickets', ticketController.getUserTickets);

module.exports = router;