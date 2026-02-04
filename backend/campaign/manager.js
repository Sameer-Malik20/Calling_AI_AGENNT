const mongoose = require('mongoose');
const CallLog = require('../models/CallLog');

const CampaignSchema = new mongoose.Schema({
    name: { type: String, required: true },
    status: { type: String, default: 'STOPPED' },
    knowledgeFile: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const NumberSchema = new mongoose.Schema({
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
    name: { type: String },
    number: { type: String, required: true },
    email: { type: String },
    status: { type: String, default: 'PENDING' }, // PENDING, COMPLETED, FAILED
    lastCallAt: { type: Date }
});

// Dedicated Appointment Schema for better management
const AppointmentSchema = new mongoose.Schema({
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'PhoneNumber', required: true },
    callLogId: { type: mongoose.Schema.Types.ObjectId, ref: 'CallLog' },
    userTime: { type: String, required: true }, // User's local time (e.g., "10:00 PM PST")
    istTime: { type: Date, required: true }, // IST time as Date object
    timezone: { type: String, required: true }, // User's timezone (e.g., "America/Los_Angeles")
    status: { type: String, default: 'SCHEDULED', enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'FOLLOWUP', 'NEGOTIATION', 'DISCUSSION', 'PROPOSAL_SUBMITTED'] },
    email: { type: String },
    notes: { type: String },
    followUpScheduled: { type: Date },
    isAutoCallback: { type: Boolean, default: false },
    callTriggered: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Campaign = mongoose.model('Campaign', CampaignSchema);
const PhoneNumber = mongoose.model('PhoneNumber', NumberSchema);
const Appointment = mongoose.model('Appointment', AppointmentSchema);

class CampaignManager {
    async createCampaign(name, knowledgeFile, leadData) {
        const campaign = new Campaign({ name, knowledgeFile });
        await campaign.save();

        const numberDocs = leadData.map(lead => ({
            campaignId: campaign._id,
            name: lead.name || 'Unknown',
            number: lead.number.toString().trim(),
            email: lead.email || null,
            status: 'PENDING'
        }));
        await PhoneNumber.insertMany(numberDocs);
        
        return campaign._id;
    }

    async getAllCampaigns() {
        return await Campaign.find().sort({ createdAt: -1 });
    }

    async deleteCampaign(campaignId) {
        await PhoneNumber.deleteMany({ campaignId });
        await Campaign.findByIdAndDelete(campaignId);
    }

    async getCampaignLeads(campaignId) {
        return await PhoneNumber.find({ campaignId });
    }

    async updateLead(leadId, data) {
        return await PhoneNumber.findByIdAndUpdate(leadId, data, { new: true });
    }

    async deleteLead(leadId) {
        return await PhoneNumber.findByIdAndDelete(leadId);
    }

    async getLogs(campaignId = null) {
        let query = {};
        if (campaignId && mongoose.Types.ObjectId.isValid(campaignId)) {
            const leads = await PhoneNumber.find({ campaignId });
            const leadIds = leads.map(l => l._id);
            query = { numberId: { $in: leadIds } };
        }
        return await CallLog.find(query)
            .populate('numberId')
            .sort({ timestamp: -1 });
    }

 // manager.js mein add karein
async getBookedSlots() {
    try {
        // Aaj se aage ke saare booked demos fetch karein with full details
        const futureBookings = await Appointment.find({
            status: 'SCHEDULED',
            istTime: { $gte: new Date() },
            isAutoCallback: { $ne: true } // Never block availability slots with auto-callbacks
        })
        .populate('leadId', 'name number email')
        .populate('callLogId', 'transcript')
        .sort({ istTime: 1 });
        
        // Return detailed appointment info for calendar and conflict checking
        return futureBookings.map(booking => ({
            id: booking._id,
            istTime: booking.istTime,
            userTime: booking.userTime,
            timezone: booking.timezone,
            leadName: booking.leadId?.name || 'Unknown',
            leadNumber: booking.leadId?.number || 'N/A',
            leadEmail: booking.email || booking.leadId?.email,
            status: booking.status,
            callLogId: booking.callLogId,
            notes: booking.notes
        }));
    } catch (err) {
        console.error("Error fetching booked slots:", err);
        return [];
    }
}

async createAppointment(appointmentData) {
    try {
        const appointment = new Appointment(appointmentData);
        await appointment.save();
        return appointment;
    } catch (err) {
        console.error("Error creating appointment:", err);
        throw err;
    }
}

    async getAppointmentsByDateRange(startDate, endDate) {
        try {
            return await Appointment.find({
                istTime: { $gte: startDate, $lte: endDate },
                isAutoCallback: { $ne: true } // Don't show auto-callbacks in main calendar
            })
            .populate('leadId', 'name number email')
        .populate('callLogId', 'transcript')
        .sort({ istTime: 1 });
    } catch (err) {
        console.error("Error fetching appointments by date range:", err);
        return [];
    }
}

async updateAppointment(appointmentId, updateData) {
    try {
        updateData.updatedAt = new Date();
        return await Appointment.findByIdAndUpdate(appointmentId, updateData, { new: true });
    } catch (err) {
        console.error("Error updating appointment:", err);
        throw err;
    }
}

async getLeadEmail(numberId) {
    const lead = await PhoneNumber.findById(numberId);
    return lead ? { email: lead.email || 'not-found@example.com', name: lead.name } : null;
}

    async getStats(campaignId) {
        let targetId = campaignId;
        try {
            if (campaignId === 'latest') {
                const latest = await Campaign.findOne().sort({ createdAt: -1 });
                if (!latest) return { total: 0, completed: 0, failed: 0, pending: 0, duration: 0 };
                targetId = latest._id;
            } else if (typeof targetId === 'string' && mongoose.Types.ObjectId.isValid(targetId)) {
                targetId = new mongoose.Types.ObjectId(targetId);
            }
        } catch (e) {
            console.error("Error resolving campaign ID:", e);
            return { total: 0, completed: 0, failed: 0, pending: 0, duration: 0 };
        }

        try {
            const total = await PhoneNumber.countDocuments({ campaignId: targetId });
            const completed = await PhoneNumber.countDocuments({ campaignId: targetId, status: 'COMPLETED' });
            const failed = await PhoneNumber.countDocuments({ campaignId: targetId, status: 'FAILED' });
            const pending = await PhoneNumber.countDocuments({ campaignId: targetId, status: 'PENDING' });

            // Fetch leads to get their IDs for matching logs
            const leads = await PhoneNumber.find({ campaignId: targetId }, '_id');
            const leadIds = leads.map(l => l._id);

            // Calculate total duration for these leads
            const logs = await CallLog.find({ numberId: { $in: leadIds } });
            const totalDuration = logs.reduce((acc, log) => acc + (Number(log.duration) || 0), 0);

            return { 
                total, 
                completed, 
                failed, 
                pending, 
                duration: totalDuration,
                name: (await Campaign.findById(targetId))?.name 
            };
        } catch (err) {
            console.error("Error in getStats:", err);
            return { total: 0, completed: 0, failed: 0, pending: 0, duration: 0 };
        }
    }

    async getPendingNumbers(campaignId) {
        return await PhoneNumber.find({ campaignId, status: 'PENDING' });
    }

    async updateNumberStatus(numberId, status) {
        await PhoneNumber.findByIdAndUpdate(numberId, { status, lastCallAt: new Date() });
    }

    async saveCallLog(numberId, logData) {
        const log = new CallLog({ numberId, ...logData });
        await log.save();
        return log;
    }
}

module.exports = {
    campaignManager: new CampaignManager(),
    Campaign,
    PhoneNumber,
    Appointment
};
