import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Charger les variables d'environnement AVANT les autres imports (hoisting ESM)
dotenv.config();

import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.js';
import missionRoutes from './routes/missions.js';
import chatRoutes from './routes/chat.js';
import secteursRoutes from './routes/secteurs.js';
import competencesRoutes from './routes/competences.js';
import usersRoutes from './routes/users.js';
import availabilitiesRoutes from './routes/availabilities.js';
import otpRoutes from './routes/otp.js';
import verificationRoutes from './routes/verification.js';
import verificationNewRoutes from './routes/verificationNew.js';
import notificationRoutes from './routes/notifications.js';
import documentsRoutes from './routes/documents.js';
import timesheetsRoutes from './routes/timesheets.js';
import invoicesRoutes from './routes/invoices.js';
import walletRoutes from './routes/wallet.js';
import automobRoutes from './routes/automob.js';
import disputesRoutes from './routes/disputes.js';
// import adminWalletRoutes from './routes/admin-wallet.js'; // OBSOLETE - utilise wallet.js à la place
import fcmRoutes from './routes/fcm.js';
import adminRoutes from './routes/admin.js';
import dashboardRoutes from './routes/dashboard.js';
import feedbackRoutes from './routes/feedback.js';
import smsRoutes from './routes/sms.js';
import supportRoutes from './routes/support.js';
import geocodingRoutes from './routes/geocoding.js';
import testSmsRoutes from './routes/test-sms.js';
import contactRoutes from './routes/contact.js';
import blogRoutes from './routes/blog.js';
import tutorielsRoutes from './routes/tutoriels.js';
import devisRoutes from './routes/devisRoutes.js';
import aiAssistantRoutes from './routes/aiAssistant_v2.js';
import db from './config/database.js';
import { initializeFirebase } from './config/firebase-admin.js';
import { startSchedulers } from './services/missionScheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialiser Firebase Admin
console.log(' Initialisation Firebase Admin...');
initializeFirebase();

// Démarrer les tâches planifiées
startSchedulers();

// S'assurer que la table fcm_tokens existe
(async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS fcm_tokens (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL UNIQUE,
        token TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Table fcm_tokens OK');
    await db.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Table contact_messages OK');
    await db.query(`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        type ENUM('auto-entrepreneur', 'enterprise') NOT NULL,
        excerpt TEXT,
        content LONGTEXT,
        image_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Table blog_posts OK');
    // Add columns one by one - try/catch each so duplicate column errors are ignored
    for (const col of [
      'ALTER TABLE blog_posts ADD COLUMN helpful_yes INT DEFAULT 0',
      'ALTER TABLE blog_posts ADD COLUMN helpful_no INT DEFAULT 0',
      'ALTER TABLE blog_posts ADD COLUMN slug VARCHAR(100)',
    ]) {
      try { await db.query(col); } catch (_) { /* column already exists */ }
    }
    // Backfill slugs for posts that have none
    const [noSlug] = await db.query('SELECT id, title FROM blog_posts WHERE slug IS NULL OR slug = ""');
    for (const p of noSlug) {
      const base = p.title.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '').trim()
        .replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 70);
      let slug = base; let c = 1;
      while (true) {
        const [ex] = await db.query('SELECT id FROM blog_posts WHERE slug = ? AND id != ?', [slug, p.id]);
        if (ex.length === 0) break;
        slug = `${base}-${c++}`;
      }
      await db.query('UPDATE blog_posts SET slug = ? WHERE id = ?', [slug, p.id]);
    }
    // Default images for posts without images
    await db.query(`UPDATE blog_posts SET image_url = '/uploads/blog/default-ae.png' WHERE (image_url IS NULL OR image_url = '') AND type = 'auto-entrepreneur'`);
    await db.query(`UPDATE blog_posts SET image_url = '/uploads/blog/default-ent.png' WHERE (image_url IS NULL OR image_url = '') AND type = 'enterprise'`);
    console.log('✅ Blog slugs + images OK');

    // Verification/Creation table tutoriels
    await db.query(`
      CREATE TABLE IF NOT EXISTS tutoriels (
        id INT PRIMARY KEY AUTO_INCREMENT,
        titre VARCHAR(255) NOT NULL,
        video_url VARCHAR(255) NOT NULL,
        type ENUM('auto-entrepreneur', 'enterprise') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Table tutoriels OK');
  } catch (e) {
    console.error('❌ Erreur vérification fcm_tokens:', e.message);
  }
})();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'https://pro.nettmobfrance.fr',
      'https://panel.nettmobfrance.fr',
      'http://localhost:5176',
      'http://localhost:5177',
      'http://192.168.34.56:5176',
      'http://192.168.34.56:5173'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  allowUpgrades: true,
  upgradeTimeout: 10000,
  pingTimeout: 60000,
  pingInterval: 25000,
  cookie: false,
  serveClient: false
});

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'https://pro.nettmobfrance.fr',
    'https://panel.nettmobfrance.fr',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://192.168.34.56:5176',
    'http://192.168.34.56:5173'
  ],
  credentials: true
}));
// Configuration timeout et limites
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rendre le dossier uploads accessible publiquement
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Rediriger la route statique /videos vers /uploads/tutoriels si besoin (ou gérer direct via frontend/public)
app.use('/videos', express.static(path.join(__dirname, '../frontend/public/videos')));

// Timeout global de 30 secondes pour éviter les blocages
app.use((req, res, next) => {
  const timeout = req.path.startsWith('/api/ai') ? 120000 : 30000;
  req.setTimeout(timeout, () => {
    console.log('⏰ Timeout requête:', req.method, req.path);
    if (!res.headersSent) {
      res.status(408).json({ error: 'Timeout de requête' });
    }
  });
  next();
});

app.use('/uploads', express.static('uploads'));
app.use('/api/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/secteurs', secteursRoutes);
app.use('/api/competences', competencesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/availabilities', availabilitiesRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/verification-new', verificationNewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/timesheets', timesheetsRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/automob', automobRoutes);
app.use('/api/disputes', disputesRoutes);
// app.use('/api/admin', adminWalletRoutes); // OBSOLETE - utilise wallet.js à la place
app.use('/api/fcm', fcmRoutes);  // Changé de /api/users vers /api/fcm pour éviter le conflit
app.use('/api/admin', adminRoutes); // Ajout du middleware admin
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/sms', smsRoutes); // Routes SMS Twilio
app.use('/api/support', supportRoutes); // Routes système d'assistance
app.use('/api', geocodingRoutes); // Routes geocoding Google Maps
app.use('/api/admin', testSmsRoutes); // Routes test SMS (admin uniquement)
app.use('/api/contact', contactRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/tutoriels', tutorielsRoutes);
app.use('/api/devis-entreprise', devisRoutes);
app.use('/api/ai', aiAssistantRoutes);

// Rendre io accessible dans les routes
app.set('io', io);

// Route racine
app.get('/', (req, res) => {
  res.json({
    message: 'API NettMobFrance',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      api: '/api',
      test: '/api/test-connection'
    }
  });
});

// Route de santé basique
app.get('/health', (req, res) => res.json({ status: 'OK' }));



// Route de test complète : Backend + Base de données
app.get('/api/test-connection', async (req, res) => {
  console.log(' Test de connexion reçu');

  try {
    // Test connexion base de données
    console.log(' Test connexion base de données...');
    const [result] = await db.query('SELECT 1 + 1 AS test, NOW() as time, DATABASE() as dbname');

    // Test lecture d'une table
    console.log(' Test lecture table users...');
    const [users] = await db.query('SELECT COUNT(*) as count FROM users');

    console.log(' Test lecture table secteurs...');
    const [secteurs] = await db.query('SELECT COUNT(*) as count FROM secteurs');

    console.log(' Test lecture table competences...');
    const [competences] = await db.query('SELECT COUNT(*) as count FROM competences');

    console.log(' Tous les tests réussis !');

    res.json({
      success: true,
      message: 'Backend et base de données fonctionnent correctement',
      database: {
        connected: true,
        name: result[0].dbname,
        serverTime: result[0].time,
        testQuery: result[0].test === 2 ? 'OK' : 'FAILED'
      },
      tables: {
        users: users[0].count,
        secteurs: secteurs[0].count,
        competences: competences[0].count
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        port: PORT
      }
    });
  } catch (error) {
    console.error(' Erreur test connexion:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur de connexion',
      details: error.message,
      code: error.code
    });
  }
});

const userSockets = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (userId) => {
    userSockets.set(userId, socket.id);
    socket.join(`user_${userId}`);
    console.log(` User ${userId} joined room user_${userId}`);
  });

  socket.on('send_message', (data) => {
    const { conversationId, receiverId, message } = data;
    if (userSockets.has(receiverId)) {
      io.to(`user_${receiverId}`).emit('new_message', { conversationId, message });
    }
  });

  socket.on('disconnect', () => {
    for (let [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Serveur backend démarré sur http://0.0.0.0:${PORT}`);
  console.log(` Network access: http://192.168.34.56:${PORT}`);
});

export { io };
