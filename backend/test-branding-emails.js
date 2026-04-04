import { sendOTPEmail, sendVerificationStatusEmail, sendNotificationEmail, sendMissionReminderEmail, sendTimesheetReminderEmail } from './services/emailService.js';
import dotenv from 'dotenv';
dotenv.config();

const testEmail = 'mounchilithierry432@gmail.com';

async function runTests() {
    console.log('🚀 Starting email tests...');

    try {
        // 1. Test OTP Email
        console.log('Sending OTP email...');
        await sendOTPEmail(testEmail, '123456', 'verification');

        // 2. Test Verification Status
        console.log('Sending Verification Status email...');
        await sendVerificationStatusEmail(testEmail, 'approved');

        // 3. Test Notification Email (Modern Header)
        console.log('Sending Notification email...');
        await sendNotificationEmail(testEmail, 'Test Branding', 'Ceci est un test de la nouvelle charte graphique avec le favicon.');

        // 4. Test Mission Reminder
        console.log('Sending Mission Reminder email...');
        await sendMissionReminderEmail(testEmail, 'Thierry', {
            mission_name: 'Mission Test Branding',
            start_date: new Date(),
            address: '123 Rue du Test',
            city: 'Paris',
            client_name: 'Client Test',
            hourly_rate: 25
        });

        console.log('✅ All test emails sent successfully!');
    } catch (error) {
        console.error('❌ Error during email tests:', error);
    }
}

runTests();
