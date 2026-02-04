const nodemailer = require('nodemailer');

// Email transporter configuration
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// Generate iCal format for calendar invite
const generateICalEvent = (name, email, userTime, istTime, timezone) => {
    const startDate = new Date(istTime);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration
    
    const formatDate = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SusaLabs//Demo Booking//EN
BEGIN:VEVENT
UID:${Date.now()}@susalabs.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:SusaLabs Product Demo - ${name}
DESCRIPTION:Your scheduled demo with SusaLabs team.\\n\\nYour Local Time: ${userTime}\\nIST: ${startDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
LOCATION:Online (Link will be sent separately)
ORGANIZER;CN=SusaLabs Team:mailto:support@susalabs.com
ATTENDEE;CN=${name};RSVP=TRUE:mailto:${email}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
};

// Confirmation Email Template
const getConfirmationEmailHTML = (name, userTime, istTime, timezone) => {
    const istFormatted = new Date(istTime).toLocaleString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Demo Confirmation - SusaLabs</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 16px 16px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">
                                ✓ Demo Confirmed!
                            </h1>
                            <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 600;">
                                SusaLabs Product Demonstration
                            </p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 20px; color: #1e293b; font-size: 16px; line-height: 1.6;">
                                Hi <strong>${name}</strong>,
                            </p>
                            
                            <p style="margin: 0 0 30px; color: #475569; font-size: 15px; line-height: 1.6;">
                                Great news! Your demo session with our team has been successfully scheduled. We're excited to show you how SusaLabs can transform your business operations.
                            </p>

                            <!-- Time Details Card -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f1f5f9; border-radius: 12px; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 24px;">
                                        <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                                            📅 Scheduled Time
                                        </h2>
                                        
                                        <div style="margin-bottom: 12px;">
                                            <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                                                Your Local Time
                                            </p>
                                            <p style="margin: 4px 0 0; color: #2563eb; font-size: 18px; font-weight: 700;">
                                                ${userTime}
                                            </p>
                                            <p style="margin: 2px 0 0; color: #64748b; font-size: 12px;">
                                                Timezone: ${timezone}
                                            </p>
                                        </div>

                                        <div style="border-top: 1px solid #cbd5e1; padding-top: 12px; margin-top: 12px;">
                                            <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                                                India Standard Time (IST)
                                            </p>
                                            <p style="margin: 4px 0 0; color: #475569; font-size: 14px; font-weight: 600;">
                                                ${istFormatted}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <!-- What to Expect -->
                            <h3 style="margin: 0 0 16px; color: #1e293b; font-size: 16px; font-weight: 700;">
                                What to Expect
                            </h3>
                            <ul style="margin: 0 0 30px; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.8;">
                                <li>Live product walkthrough tailored to your needs</li>
                                <li>Q&A session with our technical experts</li>
                                <li>Discussion on implementation and pricing</li>
                                <li>Next steps and timeline planning</li>
                            </ul>

                            <!-- CTA Button -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                                <tr>
                                    <td align="center">
                                        <a href="https://susalabs.com/demo-prep" style="display: inline-block; padding: 16px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                                            Add to Calendar
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Footer Note -->
                            <div style="border-top: 1px solid #e2e8f0; padding-top: 24px;">
                                <p style="margin: 0 0 12px; color: #64748b; font-size: 13px; line-height: 1.6;">
                                    <strong>Need to reschedule?</strong> Simply reply to this email or call us at +91-XXX-XXX-XXXX.
                                </p>
                                <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.6;">
                                    We'll send you the meeting link 15 minutes before the scheduled time.
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f8fafc; border-radius: 0 0 16px 16px; text-align: center;">
                            <p style="margin: 0 0 8px; color: #1e293b; font-size: 16px; font-weight: 700;">
                                Best regards,
                            </p>
                            <p style="margin: 0 0 16px; color: #2563eb; font-size: 18px; font-weight: 800;">
                                Sam & The SusaLabs Team
                            </p>
                            <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                                © ${new Date().getFullYear()} SusaLabs. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
};

// Send Confirmation Email with Calendar Invite
const sendDemoConfirmationEmail = async (email, name, userTime, istTime, timezone) => {
    try {
        const transporter = createTransporter();
        
        const icalEvent = generateICalEvent(name, email, userTime, istTime, timezone);
        
        const mailOptions = {
            from: '"SusaLabs Team" <support@susalabs.com>',
            to: email,
            subject: `✓ Demo Confirmed: ${userTime} - SusaLabs`,
            html: getConfirmationEmailHTML(name, userTime, istTime, timezone),
            icalEvent: {
                filename: 'susalabs-demo.ics',
                method: 'REQUEST',
                content: icalEvent
            }
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log('[EMAIL-SENT] Confirmation email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('[EMAIL-ERROR]', error);
        throw error;
    }
};

// Team Notification Email
const sendTeamNotificationEmail = async (appointmentDetails) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: '"SusaLabs AI Agent" <support@susalabs.com>',
            to: process.env.TEAM_EMAIL || 'team@susalabs.com',
            subject: `🎯 New Demo Booked: ${appointmentDetails.leadName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2563eb;">New Demo Appointment</h2>
                    <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Lead Name:</strong> ${appointmentDetails.leadName}</p>
                        <p><strong>Email:</strong> ${appointmentDetails.email}</p>
                        <p><strong>Phone:</strong> ${appointmentDetails.phone}</p>
                        <p><strong>Scheduled Time (IST):</strong> ${new Date(appointmentDetails.istTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
                        <p><strong>User's Local Time:</strong> ${appointmentDetails.userTime} (${appointmentDetails.timezone})</p>
                    </div>
                    <p style="color: #64748b; font-size: 14px;">This appointment was automatically booked by the AI calling agent.</p>
                </div>
            `
        };
        
        await transporter.sendMail(mailOptions);
        console.log('[TEAM-NOTIFICATION] Team notified of new booking');
    } catch (error) {
        console.error('[TEAM-NOTIFICATION-ERROR]', error);
    }
};

module.exports = {
    sendDemoConfirmationEmail,
    sendTeamNotificationEmail,
    createTransporter
};
