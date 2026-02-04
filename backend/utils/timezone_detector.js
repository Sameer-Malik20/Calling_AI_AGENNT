const moment = require('moment-timezone');
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

// US Area Code to Timezone Mapping
const US_AREA_CODE_TIMEZONES = {
    // Eastern Time Zone (EST/EDT)
    '202': 'America/New_York',
    '212': 'America/New_York',
    '347': 'America/New_York',
    '646': 'America/New_York',
    '917': 'America/New_York',
    '718': 'America/New_York',
    '929': 'America/New_York',
    '516': 'America/New_York',
    '914': 'America/New_York',
    '845': 'America/New_York',
    '315': 'America/New_York',
    '518': 'America/New_York',
    '607': 'America/New_York',
    '716': 'America/New_York',
    '585': 'America/New_York',
    '838': 'America/New_York',
    
    // Central Time Zone (CST/CDT)
    '312': 'America/Chicago',
    '773': 'America/Chicago',
    '630': 'America/Chicago',
    '847': 'America/Chicago',
    '708': 'America/Chicago',
    '224': 'America/Chicago',
    '464': 'America/Chicago',
    '815': 'America/Chicago',
    '779': 'America/Chicago',
    '309': 'America/Chicago',
    '217': 'America/Chicago',
    '618': 'America/Chicago',
    '618': 'America/Chicago',
    '314': 'America/Chicago',
    '636': 'America/Chicago',
    '573': 'America/Chicago',
    '417': 'America/Chicago',
    
    // Mountain Time Zone (MST/MDT)
    '303': 'America/Denver',
    '720': 'America/Denver',
    '983': 'America/Denver',
    '719': 'America/Denver',
    '970': 'America/Denver',
    '208': 'America/Denver',
    '505': 'America/Denver',
    '575': 'America/Denver',
    
    // Pacific Time Zone (PST/PDT)
    '213': 'America/Los_Angeles',
    '310': 'America/Los_Angeles',
    '424': 'America/Los_Angeles',
    '323': 'America/Los_Angeles',
    '442': 'America/Los_Angeles',
    '747': 'America/Los_Angeles',
    '818': 'America/Los_Angeles',
    '626': 'America/Los_Angeles',
    '510': 'America/Los_Angeles',
    '415': 'America/Los_Angeles',
    '650': 'America/Los_Angeles',
    '408': 'America/Los_Angeles',
    '209': 'America/Los_Angeles',
    '925': 'America/Los_Angeles',
    '559': 'America/Los_Angeles',
    '661': 'America/Los_Angeles',
    '707': 'America/Los_Angeles',
    '916': 'America/Los_Angeles',
    '530': 'America/Los_Angeles',
    '369': 'America/Los_Angeles'
};

class TimezoneDetector {
    static getTimezone(phoneNumber) {
        try {
            // Remove any spaces, dashes, or parentheses
            const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
            
            // India detection
            if (cleanNumber.startsWith('+91')) {
                return 'Asia/Kolkata';
            }
            
            // US detection with area code mapping
            if (cleanNumber.startsWith('+1')) {
                // Extract area code (after +1)
                const areaCode = cleanNumber.substring(2, 5);
                
                if (US_AREA_CODE_TIMEZONES[areaCode]) {
                    return US_AREA_CODE_TIMEZONES[areaCode];
                }
                
                // Default to Eastern Time for US numbers not in our mapping
                return 'America/New_York';
            }
            
            // Fallback for other countries or invalid numbers
            return 'Asia/Kolkata';
            
        } catch (error) {
            console.error('[TIMEZONE-DETECTOR-ERROR]', error.message);
            return 'Asia/Kolkata'; // Fallback to IST
        }
    }
    
    static getTimeContext(phoneNumber) {
        const timezone = this.getTimezone(phoneNumber);
        const userLocalTime = moment().tz(timezone);
        const indiaTime = moment().tz('Asia/Kolkata');
        
        // Determine greeting based on user's local time
        const userHour = parseInt(userLocalTime.format('HH'));
        let greeting = 'Hello';
        
        if (userHour >= 5 && userHour < 12) {
            greeting = 'Good Morning';
        } else if (userHour >= 12 && userHour < 17) {
            greeting = 'Good Afternoon';
        } else if (userHour >= 17 && userHour < 21) {
            greeting = 'Good Evening';
        } else {
            greeting = 'Hello'; // For late night/early morning
        }
        
        return {
            timezone,
            userLocalTime: userLocalTime.format('hh:mm A'),
            userDay: userLocalTime.format('dddd'),
            userDate: userLocalTime.format('MMMM Do'),
            greeting,
            indiaTime: indiaTime.format('hh:mm A'),
            indiaDay: indiaTime.format('dddd')
        };
    }
    
    static isValidISTTime(timeStr) {
        try {
            const time = moment(timeStr, ['h:mm A', 'HH:mm'], 'Asia/Kolkata');
            const hour = parseInt(time.format('HH'));
            const day = time.day(); // 0 = Sunday, 6 = Saturday
            
            // Check if Monday-Friday and 9 AM - 9 PM
            return day >= 1 && day <= 5 && hour >= 9 && hour <= 21;
        } catch (error) {
            return false;
        }
    }
    
    static convertToIST(userTimeStr, userTimezone) {
        try {
            const userTime = moment.tz(userTimeStr, ['h:mm A', 'HH:mm'], userTimezone);
            return userTime.tz('Asia/Kolkata');
        } catch (error) {
            console.error('[TIMEZONE-CONVERSION-ERROR]', error.message);
            return null;
        }
    }
}

module.exports = TimezoneDetector;