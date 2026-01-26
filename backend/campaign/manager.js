const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema({
    name: { type: String, required: true },
    status: { type: String, default: 'STOPPED' },
    knowledgeFile: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const NumberSchema = new mongoose.Schema({
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
    number: { type: String, required: true },
    status: { type: String, default: 'PENDING' }, // PENDING, COMPLETED, FAILED
    lastCallAt: { type: Date }
});

const CallLogSchema = new mongoose.Schema({
    numberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Number' },
    transcript: String,
    summary: String,
    duration: Number,
    outcome: String,
    createdAt: { type: Date, default: Date.now }
});

const Campaign = mongoose.model('Campaign', CampaignSchema);
const PhoneNumber = mongoose.model('PhoneNumber', NumberSchema);
const CallLog = mongoose.model('CallLog', CallLogSchema);

class CampaignManager {
    async createCampaign(name, knowledgeFile, numbers) {
        const campaign = new Campaign({ name, knowledgeFile });
        await campaign.save();

        const numberDocs = numbers.map(num => ({
            campaignId: campaign._id,
            number: num.trim(),
            status: 'PENDING'
        }));
        await PhoneNumber.insertMany(numberDocs);
        
        return campaign._id;
    }

    async getStats(campaignId) {
        const total = await PhoneNumber.countDocuments({ campaignId });
        const completed = await PhoneNumber.countDocuments({ campaignId, status: 'COMPLETED' });
        const failed = await PhoneNumber.countDocuments({ campaignId, status: 'FAILED' });
        const pending = await PhoneNumber.countDocuments({ campaignId, status: 'PENDING' });

        return { total, completed, failed, pending };
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
    }
}

module.exports = new CampaignManager();
