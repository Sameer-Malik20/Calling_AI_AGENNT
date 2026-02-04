const mongoose = require('mongoose');

const CallLogSchema = new mongoose.Schema({
    call_id: {
        type: String,
        required: true,
        unique: true
    },
    phone_number: {
        type: String,
        required: true
    },
    timezone: {
        type: String,
        required: true
    },
    transcript: {
        type: String,
        required: true
    },
    report: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    numberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PhoneNumber'
    },
    campaignId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campaign'
    },
    customer_name: String,
    outcome: {
        type: String,
        enum: ['COMPLETED', 'FAILED', 'BOOKED', 'BOOKING_REJECTED', 'DEMO_BOOKED'],
        default: 'COMPLETED'
    },
    callType: {
        type: String,
        enum: ['CAMPAIGN', 'FOLLOW_UP'],
        default: 'CAMPAIGN'
    }
});

module.exports = mongoose.model('CallLog', CallLogSchema);