import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'nettmobfrance',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000
});

// Test de connexion avec retry
let retries = 3;
const testConnection = async () => {
  while (retries > 0) {
    try {
      const connection = await pool.getConnection();
      console.log('✅ Database connected successfully');
      connection.release();
      return;
    } catch (err) {
      retries--;
      console.error(`❌ Database connection failed (${3 - retries}/3):`, err.message);
      if (retries > 0) {
        console.log('🔄 Retry in 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  console.error('❌ Could not connect to database after 3 attempts');
};

testConnection();

export default pool;
