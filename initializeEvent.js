
const mongoose = require('mongoose');
const Event = require('./models/Event');
require('dotenv').config();

const initializeEvent = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Check if event already exists
    const existingEvent = await Event.findOne({ isActive: true });
    
    if (!existingEvent) {
      const event = new Event({
        name: "New Year Celebration 2024",
        maxTickets: 300,
        bookedTickets: 0,
        ticketPrice: 2299,
        eventDate: new Date('2024-12-31T20:00:00Z'),
        isActive: true
      });
      
      await event.save();
      console.log('🎉 New Year Event initialized successfully!');
      console.log(`🎫 Total tickets: ${ event.maxTickets } `);
      console.log(`💰 Ticket price: ₹${ event.ticketPrice } `);
    } else {
      console.log('✅ Event already exists:', existingEvent.name);
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error initializing event:', error);
    process.exit(1);
  }
};

initializeEvent();