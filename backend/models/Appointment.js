const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
    user_time: {
        type: String,
        required: true
    },
    ist_time: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone_number: {
        type: String,
        required: true
    },
    customer_name: String,
    timezone: {
        type: String,
        required: true
    },
    call_id: {
        type: String,
        required: true,
        unique: true
    },
    transcript: {
        type: String,
        required: true
    },
    summary: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED'],
        default: 'SCHEDULED'
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    appointment_date: {
        type: Date,
        required: true
    },
    numberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PhoneNumber'
    },
    campaignId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campaign'
    }
});

// Create index for efficient querying by date
AppointmentSchema.index({ appointment_date: 1 });
AppointmentSchema.index({ email: 1 });
AppointmentSchema.index({ call_id: 1 });

module.exports = mongoose.model('Appointment', AppointmentSchema);