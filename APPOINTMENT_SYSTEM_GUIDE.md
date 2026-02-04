# Global Demo Booking System - Implementation Guide

## Overview
SusaLabs Calling Agent ab ek complete global demo booking system ke saath integrated hai jo user ke local timezone aur India (IST) business hours (9 AM - 9 PM IST, Mon-Fri) ko intelligently handle karta hai.

---

## 🎯 Key Features Implemented

### 1. **Timezone Intelligence & AI Logic**

#### Automatic Timezone Detection
- **Library Used**: `google-libphonenumber` + `moment-timezone`
- **Detection Method**: Country code aur area code se exact timezone detect hota hai
  - Example: `+1-212-XXX-XXXX` → `America/New_York` (EST/EDT)
  - Example: `+91-XXX-XXX-XXXX` → `Asia/Kolkata` (IST)

#### Smart Greeting System
- Call start hote hi user ke local time ke basis par greeting:
  - 5 AM - 12 PM: "Good Morning"
  - 12 PM - 5 PM: "Good Afternoon"
  - 5 PM - 9 PM: "Good Evening"
  - 9 PM - 5 AM: "Hello"

#### Conflict Checking (Train Ticket Logic)
- **Real-time Availability**: Database se already booked slots fetch hote hain
- **15-minute Window**: Agar user ka requested time kisi booked slot ke 15 minutes ke andar hai, toh AI alternative slots suggest karta hai
- **Example**:
  ```
  User: "Can we do 2 PM tomorrow?"
  AI: "I'm sorry, that slot just got reserved. I have 3 PM or 4:30 PM available. Which works?"
  ```

#### Automatic Time Conversion
- User apne local time mein bolta hai (e.g., "10 PM PST")
- AI internally IST mein convert karta hai
- Check karta hai ki converted time 9 AM - 9 PM IST (Mon-Fri) ke andar hai ya nahi
- Agar bahar hai, toh politely alternative suggest karta hai

#### Booking Tag Generation
- Demo fix hone par AI ye tag generate karta hai:
  ```json
  [BOOK_DEMO: {
    "user_time": "10:00 PM PST",
    "ist_time": "2023-12-25T10:30:00.000Z",
    "timezone": "America/Los_Angeles"
  }]
  ```

---

### 2. **Backend & Database Architecture**

#### New Appointment Schema
```javascript
{
  leadId: ObjectId,           // Reference to PhoneNumber
  callLogId: ObjectId,        // Reference to CallLog
  userTime: String,           // "10:00 PM PST"
  istTime: Date,              // ISO Date object
  timezone: String,           // "America/Los_Angeles"
  status: String,             // SCHEDULED | COMPLETED | CANCELLED | RESCHEDULED
  email: String,
  notes: String,
  followUpScheduled: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/appointments/availability` | GET | Booked slots list (for AI conflict checking) |
| `/api/appointments` | GET | Date range ke basis par appointments (calendar view) |
| `/api/appointments/:id` | GET | Single appointment details with call logs |
| `/api/appointments` | POST | Manual appointment booking |
| `/api/appointments/:id` | PUT | Update appointment (reschedule/cancel/complete) |
| `/api/appointments/:id/follow-up` | POST | Schedule follow-up email |

#### Manager Methods
```javascript
// Get all future booked slots with details
await campaignManager.getBookedSlots()

// Create new appointment
await campaignManager.createAppointment(appointmentData)

// Get appointments by date range
await campaignManager.getAppointmentsByDateRange(startDate, endDate)

// Update appointment
await campaignManager.updateAppointment(appointmentId, updateData)
```

---

### 3. **Email Automation System**

#### Professional HTML Email Template
- **Design**: Modern, responsive, professional
- **Includes**:
  - User's local time
  - IST time
  - Timezone information
  - "What to Expect" section
  - "Add to Calendar" button

#### Calendar Invite (iCal Format)
- Automatically attached to confirmation email
- Compatible with:
  - Google Calendar
  - Outlook
  - Apple Calendar
  - Any iCal-compatible client

#### Team Notification
- Jab bhi demo book hota hai, team ko automatically email jaata hai with:
  - Lead details (name, email, phone)
  - Scheduled time (both user's local time aur IST)
  - Timezone information

#### Email Service Configuration
```javascript
// .env file mein add karein
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
TEAM_EMAIL=team@susalabs.com
```

---

### 4. **Frontend: Appointments Dashboard**

#### Interactive Calendar View
- **Monthly Calendar**: Train/Movie booking style
- **Blue Highlighted Dates**: Jis date par booking hai
- **Click to View**: Date par click karne par appointment details modal khulta hai

#### Appointment Details Modal
**Displays**:
- Lead Information (Name, Phone, Email)
- Scheduled Time (User's local time + IST)
- Timezone
- Call Transcript (if available)
- Notes
- Status Badge (SCHEDULED/COMPLETED/CANCELLED)

**Actions**:
- Schedule Follow-up
- Mark as Complete
- Cancel Appointment

#### Follow-up Feature
- Team member custom message likh sakta hai
- Date/Time select kar sakta hai
- Email automatically send hota hai lead ko

#### Navigation
- Sidebar mein "Appointments" link added
- Calendar icon ke saath
- Route: `/appointments`

---

## 🚀 Usage Guide

### For AI Agent (Automatic Booking)

1. **Call Flow**:
   ```
   User: "Can we schedule a demo?"
   AI: "Absolutely! What time works best for you?"
   User: "How about 10 PM tomorrow?"
   AI: [Checks timezone, converts to IST, checks availability]
   AI: "Perfect! I've scheduled your demo for 10 PM your time (11:30 AM IST). You'll receive a confirmation email shortly."
   ```

2. **Backend Process**:
   - AI generates `[BOOK_DEMO]` tag
   - FreeSWITCH handler detects tag on call hangup
   - Creates CallLog entry
   - Creates Appointment record
   - Sends confirmation email with calendar invite
   - Notifies team

### For Manual Booking (Frontend)

1. Navigate to **Appointments** page
2. Click on any date
3. Click "Schedule New" (if implemented)
4. Fill in:
   - Lead selection
   - Date & Time
   - Timezone
   - Notes
5. Click "Create Appointment"

### For Follow-up

1. Open appointment details
2. Click "Schedule Follow-up"
3. Enter:
   - Follow-up date/time
   - Custom message
4. Click "Send Follow-up Email"

---

## 📊 Database Queries

### Get Today's Appointments
```javascript
const today = new Date();
today.setHours(0, 0, 0, 0);
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

const appointments = await Appointment.find({
  istTime: { $gte: today, $lt: tomorrow },
  status: 'SCHEDULED'
}).populate('leadId');
```

### Get Upcoming Appointments (Next 7 Days)
```javascript
const startDate = new Date();
const endDate = new Date();
endDate.setDate(endDate.getDate() + 7);

const appointments = await campaignManager.getAppointmentsByDateRange(startDate, endDate);
```

### Check Slot Availability
```javascript
const bookedSlots = await campaignManager.getBookedSlots();
// Returns array of objects with istTime, userTime, timezone, leadName, etc.
```

---

## 🔧 Configuration

### Environment Variables (.env)
```bash
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
TEAM_EMAIL=team@susalabs.com

# MongoDB
MONGODB_URI=mongodb://localhost:27017/calling_agent

# FreeSWITCH
FS_HOST=127.0.0.1
FS_PASSWORD=ClueCon

# LLM
LLM_ENDPOINT=http://localhost:11434/v1/chat/completions
```

### Gmail App Password Setup
1. Go to Google Account Settings
2. Security → 2-Step Verification
3. App Passwords
4. Generate new password
5. Copy and paste in `.env` as `EMAIL_PASS`

---

## 🎨 Frontend Customization

### Calendar Colors
```css
/* Booked Date */
bg-blue-50 border-blue-500

/* Today */
ring-2 ring-blue-600

/* Selected Date */
shadow-lg scale-105
```

### Status Badge Colors
- **SCHEDULED**: Blue (`bg-blue-100 text-blue-600`)
- **COMPLETED**: Green (`bg-green-100 text-green-600`)
- **CANCELLED**: Red (`bg-red-100 text-red-600`)
- **RESCHEDULED**: Amber (`bg-amber-100 text-amber-600`)

---

## 🧪 Testing

### Test Timezone Detection
```javascript
const TimezoneDetector = require('./backend/utils/timezone_detector');

console.log(TimezoneDetector.getTimezone('+1-212-555-0100')); // America/New_York
console.log(TimezoneDetector.getTimezone('+91-9876543210')); // Asia/Kolkata
```

### Test Email Sending
```javascript
const { sendDemoConfirmationEmail } = require('./backend/utils/email_templates');

await sendDemoConfirmationEmail(
  'test@example.com',
  'John Doe',
  '10:00 PM PST',
  new Date('2024-01-15T10:30:00Z'),
  'America/Los_Angeles'
);
```

### Test Appointment Creation
```javascript
const appointment = await campaignManager.createAppointment({
  leadId: '507f1f77bcf86cd799439011',
  userTime: '10:00 PM PST',
  istTime: new Date('2024-01-15T10:30:00Z'),
  timezone: 'America/Los_Angeles',
  email: 'test@example.com',
  notes: 'Test appointment'
});
```

---

## 📈 Future Enhancements

1. **SMS Reminders**: 15 minutes before demo
2. **Automatic Rescheduling**: If team member cancels
3. **Video Call Integration**: Zoom/Google Meet link generation
4. **Analytics Dashboard**: Booking rate, no-show rate, conversion rate
5. **Multi-language Support**: Email templates in different languages
6. **Recurring Appointments**: Weekly/Monthly demos

---

## 🐛 Troubleshooting

### Email Not Sending
- Check `EMAIL_USER` and `EMAIL_PASS` in `.env`
- Verify Gmail App Password is correct
- Check if "Less secure app access" is enabled (if not using App Password)

### Timezone Not Detecting
- Ensure phone number has `+` prefix
- Check if `google-libphonenumber` is installed: `npm install google-libphonenumber`
- Verify `moment-timezone` is installed: `npm install moment-timezone`

### Calendar Not Loading
- Check browser console for errors
- Verify API endpoint `/api/appointments` is accessible
- Check MongoDB connection

### Appointment Not Creating
- Check MongoDB connection
- Verify `Appointment` model is exported from `manager.js`
- Check backend logs for errors

---

## 📞 Support

For any issues or questions:
- **Email**: support@susalabs.com
- **Documentation**: Check `INSTALLATION.md` and `README.md`
- **Logs**: Check `call_reports.log` for call-related issues

---

## ✅ Checklist

- [x] Timezone detection implemented
- [x] AI conflict checking logic added
- [x] Appointment database schema created
- [x] API endpoints for appointments
- [x] Professional email templates with calendar invites
- [x] Team notification system
- [x] Frontend calendar view
- [x] Appointment details modal
- [x] Follow-up scheduling feature
- [x] Sidebar navigation updated
- [x] Email service configured

---

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Author**: SusaLabs Development Team
