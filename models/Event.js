const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        default: "New Year Celebration 2024"
    },
    maxTickets: {
        type: Number,
        required: true,
        default: 500
    },
    bookedTickets: {
        type: Number,
        default: 0
    },
    ticketPrice: {
        type: Number,
        required: true,
        default: 499
    },
    eventDate: {
        type: Date,
        required: true,
        default: new Date('2024-12-31T20:00:00Z')
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Method to check ticket availability
eventSchema.methods.checkAvailability = function (ticketCount) {
    return (this.bookedTickets + ticketCount) <= this.maxTickets;
};

// Method to reserve tickets
eventSchema.methods.reserveTickets = function (ticketCount) {
    if (this.checkAvailability(ticketCount)) {
        this.bookedTickets += ticketCount;
        return true;
    }
    return false;
};

module.exports = mongoose.model('Event', eventSchema);