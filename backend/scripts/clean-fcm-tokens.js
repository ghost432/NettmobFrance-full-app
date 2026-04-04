import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function cleanInvalidTokens() {
    console.log('🧹 Starting FCM Token Cleanup...\n');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        // 1. Find all FCM tokens
        const [allTokens] = await connection.query('SELECT * FROM fcm_tokens');
        console.log(`📊 Total FCM tokens found: ${allTokens.length}\n`);

        // 2. Identify test/invalid tokens
        const testTokens = allTokens.filter(t =>
            t.token.startsWith('test_') ||
            t.token.startsWith('auto_') ||
            t.token.length < 50 // Real FCM tokens are very long
        );

        console.log(`🔍 Found ${testTokens.length} test/invalid tokens:\n`);
        testTokens.forEach(t => {
            console.log(`   - User ${t.user_id}: ${t.token.substring(0, 50)}...`);
        });

        if (testTokens.length === 0) {
            console.log('\n✅ No invalid tokens found. Database is clean!');
            return;
        }

        // 3. Delete test tokens
        console.log('\n🗑️  Deleting invalid tokens...');
        const testTokenIds = testTokens.map(t => t.id);
        const [result] = await connection.query(
            `DELETE FROM fcm_tokens WHERE id IN (${testTokenIds.join(',')})`
        );

        console.log(`✅ Deleted ${result.affectedRows} invalid tokens\n`);

        // 4. Show remaining valid tokens
        const [validTokens] = await connection.query('SELECT * FROM fcm_tokens');
        console.log(`📊 Remaining valid tokens: ${validTokens.length}\n`);

        if (validTokens.length > 0) {
            console.log('Valid tokens:');
            validTokens.forEach(t => {
                console.log(`   ✓ User ${t.user_id}: ${t.token.substring(0, 50)}... (${t.token.length} chars)`);
            });
        }

        console.log('\n✅ Cleanup complete!');
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    } finally {
        await connection.end();
    }
}

cleanInvalidTokens();
