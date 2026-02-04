const mongoose = require('mongoose');
require('dotenv').config();
const CallLog = require('./models/CallLog');

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const logs = await CallLog.find({}).sort({timestamp: -1}).limit(10);
    console.log('--- LATEST 10 LOGS ---');
    logs.forEach(l => {
        console.log(`ID: ${l._id} | Type: ${l.callType} | Number: ${l.phone_number}`);
    });
    process.exit(0);
}

check().catch(err => {
    console.error(err);
    process.exit(1);
});
