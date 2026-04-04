
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Config setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const API_URL = 'http://127.0.0.1:5000/api';

async function runVerification() {
    console.log('🚀 Starting Verification Script...');

    // 1. Connect to DB
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });
    console.log('✅ DB Connected');

    try {
        // 2. Get Users (Admin & Client)
        const [admins] = await connection.query('SELECT * FROM users WHERE role = "admin" LIMIT 1');
        const [clients] = await connection.query('SELECT * FROM users WHERE role = "client" LIMIT 1');
        const [automobs] = await connection.query('SELECT * FROM users WHERE role = "automob" LIMIT 1');

        if (!admins.length || !clients.length) {
            console.error('❌ Missing required users (Admin or Client) in DB.');
            process.exit(1);
        }

        const admin = admins[0];
        const client = clients[0];
        const automob = automobs[0]; // Optional check

        console.log(`👤 Admin found: ${admin.email}`);
        console.log(`👤 Client found: ${client.email}`);

        // 3. Generate Tokens
        const adminToken = jwt.sign({ id: admin.id, email: admin.email, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const clientToken = jwt.sign({ id: client.id, email: client.email, role: 'client' }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // 4. Test Admin Broadcast
        console.log('\n🔔 Testing Admin Broadcast...');
        try {
            const res = await axios.post(`${API_URL}/fcm/send-to-all`, {
                title: '🔔 Test Admin Broadcast',
                body: 'Ceci est une notification de test envoyée par le script de vérification.',
                targetRole: 'all'
            }, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            console.log('✅ Admin Broadcast API Call Success:', res.data);
        } catch (err) {
            console.error('❌ Admin Broadcast Failed:', err.response?.data || err.message);
        }

        // 5. Test Mission Creation
        console.log('\n🚀 Testing Mission Creation (Trigger Notification)...');
        try {
            // Need a valid secteur_id and competences
            const [secteurs] = await connection.query('SELECT id FROM secteurs LIMIT 1');
            const [competences] = await connection.query('SELECT id FROM competences LIMIT 2');

            const missionData = {
                mission_name: 'Mission Test Verification',
                work_time: 'jour',
                description: 'Mission de test pour vérifier les notifications',
                address: '10 Rue de Paris',
                city: 'Paris', // Ensure city match logic works
                postal_code: '75001',
                secteur_id: secteurs[0]?.id || 1,
                competences_ids: competences.map(c => c.id),
                hourly_rate: 25,
                max_hours: 4,
                nb_automobs: 1,
                start_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow YYYY-MM-DD
                end_date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
                start_time: '09:00',
                end_time: '13:00'
            };

            const res = await axios.post(`${API_URL}/missions`, missionData, {
                headers: { Authorization: `Bearer ${clientToken}` }
            });
            console.log('✅ Mission Creation API Call Success:', res.data);
            console.log(`   Mission ID: ${res.data.missionId}`);
        } catch (err) {
            console.error('❌ Mission Creation Failed:', err.response?.data || err.message);
        }

    } catch (err) {
        console.error('❌ Script Error:', err);
    } finally {
        await connection.end();
        console.log('\n🏁 Verification Completed');
    }
}

runVerification();
