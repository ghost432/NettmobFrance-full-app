import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendOTPEmail } from './services/emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

async function test() {
    try {
        console.log('Sending test OTP email...');
        await sendOTPEmail('mounchilithierry432@gmail.com', '123456', 'verification');
        console.log('Test OTP email sent successfully to mounchilithierry432@gmail.com.');
    } catch (error) {
        console.error('Error sending test OTP email:', error);
    } finally {
        process.exit(0);
    }
}

test();
