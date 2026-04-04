import express from 'express';
import { body, validationResult } from 'express-validator';
import db from '../config/database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { createNotification, createBulkNotifications } from '../utils/notificationHelper.js';
import { sendNotificationEmail } from '../services/emailService.js';
import { sendPushNotification } from '../config/firebase-admin.js';

const router = express.Router();

// Helper: s'assurer que la colonne feedback_given existe dans users
const ensureFeedbackGivenColumn = async () => {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'feedback_given'`
  );
  const exists = rows?.[0]?.cnt > 0;
  if (!exists) {
    await db.query(`ALTER TABLE users ADD COLUMN feedback_given TINYINT(1) DEFAULT 0`);
  }
};

// Route pour soumettre un avis/feedback
router.post('/submit',
  authenticateToken,
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('La note doit être entre 1 et 5'),
    body('feedback').isLength({ min: 1, max: 2000 }).withMessage('Le commentaire est requis (max 2000 caractères)'),
    body('suggestions').optional().isLength({ max: 2000 }).withMessage('Les suggestions ne peuvent pas dépasser 2000 caractères'),
    body('category').optional().isIn(['general', 'performance', 'interface', 'fonctionnalites', 'bugs']).withMessage('Catégorie invalide')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { rating, feedback, suggestions, category } = req.body;
      const userId = req.user.id;

      console.log(`🔍 [Feedback] Soumission d'avis par utilisateur #${userId}`);

      // Récupérer les infos utilisateur pour le contexte
      const [userRows] = await db.query(`
        SELECT u.email, u.role, 
               COALESCE(
                 CASE 
                   WHEN u.role = 'client' THEN cp.company_name
                   WHEN u.role = 'automob' THEN CONCAT(ap.first_name, ' ', ap.last_name)
                   ELSE NULL
                 END,
                 u.email
               ) as display_name
        FROM users u
        LEFT JOIN client_profiles cp ON u.id = cp.user_id AND u.role = 'client'
        LEFT JOIN automob_profiles ap ON u.id = ap.user_id AND u.role = 'automob'
        WHERE u.id = ?
      `, [userId]);

      if (!userRows.length) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      const user = userRows[0];

      // Vérification désactivée pour permettre les tests multiples
      // Pour production : activer la vérification des 24h
      /*
      const [recentFeedback] = await db.query(`
        SELECT id FROM user_feedback 
        WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
      `, [userId]);

      if (recentFeedback.length > 0) {
        return res.status(429).json({ 
          error: 'Vous avez déjà soumis un avis dans les dernières 24 heures. Merci de patienter.' 
        });
      }
      */

      // Insérer le feedback
      const [result] = await db.query(`
        INSERT INTO user_feedback (
          user_id, user_email, user_role, user_display_name, 
          rating, feedback, suggestions, category, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        userId, user.email, user.role, user.display_name,
        rating, feedback, suggestions || null, category || 'general'
      ]);

      console.log(`✅ [Feedback] Avis #${result.insertId} enregistré avec succès`);

      // Marquer que l'utilisateur a donné son avis (pour ne plus afficher le popup)
      try {
        await ensureFeedbackGivenColumn();
        await db.query(`UPDATE users SET feedback_given = 1 WHERE id = ?`, [userId]);
        console.log(`✅ [Feedback] Utilisateur #${userId} marqué comme ayant donné son avis`);
      } catch (e) {
        console.warn('[Feedback] Impossible de marquer feedback_given:', e?.message);
      }

      // Envoyer remerciements à l'utilisateur (notification + email + push web) - de manière non bloquante
      setImmediate(async () => {
        try {
          console.log(`📧 [Feedback] Début envoi remerciements pour user #${userId}`);
          const io = req.app.get('io');
          const thankTitle = '🙏 Merci pour votre avis !';
          const thankMsg = `Nous avons bien reçu votre avis (${rating}/5). Merci d\'aider à améliorer la plateforme.`;

          // 1. Notification socket.io
          if (io) {
            try {
              await createNotification(
                userId,
                thankTitle,
                thankMsg,
                'success',
                'feedback',
                '/dashboard',
                io
              );
              console.log(`✅ [Feedback] Notification socket.io envoyée à user #${userId}`);
            } catch (e) {
              console.error('[Feedback] Erreur notification utilisateur:', e);
            }
          } else {
            console.warn('[Feedback] Socket.io non disponible');
          }

          // 2. Email
          try {
            await sendNotificationEmail(
              user.email,
              thankTitle,
              thankMsg,
              `${process.env.FRONTEND_URL || ''}/dashboard`
            );
            console.log(`✅ [Feedback] Email envoyé à ${user.email}`);
          } catch (e) {
            console.error('[Feedback] Erreur envoi email:', e);
          }

          // 3. Push web (FCM)
          try {
            const [fcmTokens] = await db.query(
              'SELECT token FROM fcm_tokens WHERE user_id = ? AND token IS NOT NULL',
              [userId]
            );
            console.log(`📱 [Feedback] ${fcmTokens.length} token(s) FCM trouvé(s) pour user #${userId}`);
            if (fcmTokens.length > 0) {
              for (const tokenRow of fcmTokens) {
                try {
                  await sendPushNotification(
                    tokenRow.token,
                    {
                      title: thankTitle,
                      body: thankMsg,
                      icon: '/favicon-1.png'
                    },
                    {
                      click_action: '/dashboard',
                      type: 'feedback_thanks'
                    }
                  );
                  console.log(`✅ [Feedback] Push web envoyé pour user #${userId}`);
                } catch (pushErr) {
                  console.error(`[Feedback] Push web échoué:`, pushErr);
                }
              }
            }
          } catch (e) {
            console.error('[Feedback] Erreur push web:', e);
          }
          console.log(`✅ [Feedback] Fin envoi remerciements pour user #${userId}`);
        } catch (e) {
          console.error('[Feedback] Erreur dans les remerciements:', e);
        }
      });

      // Informer les admins (notifications + emails) - de manière non bloquante
      setImmediate(async () => {
        try {
          const io = req.app.get('io');
          const [admins] = await db.query(`SELECT id, email FROM users WHERE role = 'admin' AND email IS NOT NULL`);
          if (admins.length) {
            const adminIds = admins.map(a => a.id);
            const adminTitle = '📝 Nouvel avis utilisateur';
            const userTypeLabel = user.role === 'automob' ? 'Automob' : 'Client';
            const adminMsg = `${user.display_name} (${userTypeLabel}) a donné un avis ${rating}/5\nCatégorie: ${category || 'general'}\nCommentaire: ${feedback}`;

            if (io) {
              try {
                await createBulkNotifications(adminIds, adminTitle, adminMsg, 'info', 'feedback', '/admin/feedback', io);
              } catch (e) {
                console.warn('[Feedback] Impossible de créer les notifications admin:', e?.message);
              }
            }

            for (const a of admins) {
              try {
                await sendNotificationEmail(
                  a.email,
                  adminTitle,
                  adminMsg,
                  `${process.env.FRONTEND_URL || ''}/admin/feedback`
                );
              } catch (e) {
                console.warn(`[Feedback] Email admin échoué (${a.email}):`, e?.message);
              }
            }
          }
        } catch (e) {
          console.warn('[Feedback] Récupération admins échouée:', e?.message);
        }
      });

      res.status(201).json({
        message: 'Merci pour votre avis ! Vos commentaires nous aident à améliorer NettMobFrance.',
        feedbackId: result.insertId
      });

    } catch (error) {
      console.error('❌ [Feedback] Erreur soumission avis:', error);
      res.status(500).json({ error: 'Erreur serveur lors de la soumission de l\'avis' });
    }
  }
);

// Route pour récupérer tous les avis (admin uniquement)
router.get('/all',
  authenticateToken,
  authorizeRoles('admin'),
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
      const category = req.query.category;
      const rating = req.query.rating;

      console.log(`🔍 [Feedback] Admin récupère les avis - Page ${page}`);

      let baseQuery = `
        SELECT f.*, 
               DATE_FORMAT(f.created_at, '%d/%m/%Y %H:%i') as formatted_date
        FROM user_feedback f
      `;

      let whereConditions = [];
      let queryParams = [];

      if (category && category !== 'all') {
        whereConditions.push('f.category = ?');
        queryParams.push(category);
      }

      if (rating && rating !== 'all') {
        whereConditions.push('f.rating = ?');
        queryParams.push(parseInt(rating));
      }

      if (whereConditions.length > 0) {
        baseQuery += ' WHERE ' + whereConditions.join(' AND ');
      }

      // Requête pour les données paginées
      const dataQuery = baseQuery + ` 
        ORDER BY f.created_at DESC 
        LIMIT ? OFFSET ?
      `;
      queryParams.push(limit, offset);

      const [feedbacks] = await db.query(dataQuery, queryParams);

      // Requête pour le total (sans pagination)
      const countQuery = `
        SELECT COUNT(*) as total FROM user_feedback f
        ${whereConditions.length > 0 ? ' WHERE ' + whereConditions.join(' AND ') : ''}
      `;
      const [countResult] = await db.query(countQuery, queryParams.slice(0, -2)); // Enlever limit et offset
      const total = countResult[0].total;

      // Statistiques générales
      const [stats] = await db.query(`
        SELECT 
          COUNT(*) as total_feedback,
          AVG(rating) as average_rating,
          COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive_feedback,
          COUNT(CASE WHEN rating <= 2 THEN 1 END) as negative_feedback,
          COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as recent_feedback
        FROM user_feedback
      `);

      console.log(`✅ [Feedback] ${feedbacks.length} avis récupérés sur ${total} total`);

      res.json({
        feedbacks,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        stats: stats[0] || {
          total_feedback: 0,
          average_rating: 0,
          positive_feedback: 0,
          negative_feedback: 0,
          recent_feedback: 0
        }
      });

    } catch (error) {
      console.error('❌ [Feedback] Erreur récupération avis:', error);
      res.status(500).json({ error: 'Erreur serveur lors de la récupération des avis' });
    }
  }
);

// Route pour marquer un avis comme lu (admin)
router.patch('/:id/mark-read',
  authenticateToken,
  authorizeRoles('admin'),
  async (req, res) => {
    try {
      const feedbackId = req.params.id;

      await db.query(`
        UPDATE user_feedback SET is_read = 1, read_at = NOW() WHERE id = ?
      `, [feedbackId]);

      console.log(`✅ [Feedback] Avis #${feedbackId} marqué comme lu`);
      res.json({ message: 'Avis marqué comme lu' });

    } catch (error) {
      console.error('❌ [Feedback] Erreur marquage lu:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// Route pour vérifier si l'utilisateur doit voir le popup
router.get('/should-show-popup', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Ne pas afficher pour les admins
    if (userRole === 'admin') {
      return res.json({ shouldShow: false });
    }

    // Vérifier si l'utilisateur a déjà donné son avis
    const [userRows] = await db.query(`
      SELECT feedback_given FROM users WHERE id = ?
    `, [userId]);

    const shouldShow = userRows.length > 0 && !userRows[0].feedback_given;

    res.json({ shouldShow });

  } catch (error) {
    console.error('❌ [Feedback] Erreur vérification popup:', error);
    // Fallback: afficher le popup pour tous les non-admins si la vérification BD échoue
    res.json({ shouldShow: (req.user?.role !== 'admin') });
  }
});

// Route pour envoyer un message de remerciement à tous les utilisateurs ayant déjà soumis un avis (admin uniquement)
router.post('/send-thanks-to-all',
  authenticateToken,
  authorizeRoles('admin'),
  async (req, res) => {
    try {
      console.log('🔍 [Feedback] Envoi des remerciements à tous les utilisateurs ayant donné un avis');

      // Récupérer tous les utilisateurs qui ont soumis un avis
      const [feedbackUsers] = await db.query(`
        SELECT DISTINCT 
          u.id, 
          u.email, 
          u.role,
          COALESCE(
            CASE 
              WHEN u.role = 'client' THEN cp.company_name
              WHEN u.role = 'automob' THEN CONCAT(ap.first_name, ' ', ap.last_name)
              ELSE NULL
            END,
            u.email
          ) as display_name
        FROM users u
        INNER JOIN user_feedback uf ON u.id = uf.user_id
        LEFT JOIN client_profiles cp ON u.id = cp.user_id AND u.role = 'client'
        LEFT JOIN automob_profiles ap ON u.id = ap.user_id AND u.role = 'automob'
        WHERE u.email IS NOT NULL
      `);

      if (feedbackUsers.length === 0) {
        return res.json({
          message: 'Aucun utilisateur trouvé avec des avis soumis',
          sent: 0
        });
      }

      const thankTitle = '🙏 Merci pour votre contribution !';
      const thankMsg = 'Votre avis nous a été précieux pour améliorer NettMobFrance. Merci de votre confiance et de votre engagement !';

      let emailsSent = 0;
      let notificationsSent = 0;
      let pushSent = 0;

      const io = req.app.get('io');

      // Envoyer à chaque utilisateur
      for (const user of feedbackUsers) {
        // 1. Notification socket.io
        if (io) {
          try {
            await createNotification(
              user.id,
              thankTitle,
              thankMsg,
              'success',
              'feedback',
              '/dashboard',
              io
            );
            notificationsSent++;
          } catch (e) {
            console.warn(`[Feedback] Notification échouée pour user #${user.id}:`, e?.message);
          }
        }

        // 2. Email
        try {
          await sendNotificationEmail(
            user.email,
            thankTitle,
            thankMsg,
            `${process.env.FRONTEND_URL || ''}/dashboard`
          );
          emailsSent++;
        } catch (e) {
          console.warn(`[Feedback] Email échoué pour ${user.email}:`, e?.message);
        }

        // 3. Push web (FCM)
        try {
          const [fcmTokens] = await db.query(
            'SELECT token FROM fcm_tokens WHERE user_id = ? AND token IS NOT NULL',
            [user.id]
          );
          if (fcmTokens.length > 0) {
            for (const tokenRow of fcmTokens) {
              try {
                await sendPushNotification(
                  tokenRow.token,
                  {
                    title: thankTitle,
                    body: thankMsg,
                    icon: '/favicon-1.png'
                  },
                  {
                    click_action: '/dashboard',
                    type: 'feedback_thanks_all'
                  }
                );
                pushSent++;
              } catch (pushErr) {
                console.warn(`[Feedback] Push web échoué pour user #${user.id}:`, pushErr?.message);
              }
            }
          }
        } catch (e) {
          console.warn(`[Feedback] Push web query échoué pour user #${user.id}:`, e?.message);
        }
      }

      console.log(`✅ [Feedback] Remerciements envoyés: ${emailsSent} emails, ${notificationsSent} notifications, ${pushSent} push web`);

      res.json({
        message: `Remerciements envoyés avec succès à ${feedbackUsers.length} utilisateurs`,
        stats: {
          totalUsers: feedbackUsers.length,
          emailsSent,
          notificationsSent,
          pushSent
        }
      });

    } catch (error) {
      console.error('❌ [Feedback] Erreur envoi remerciements globaux:', error);
      res.status(500).json({ error: 'Erreur serveur lors de l\'envoi des remerciements' });
    }
  }
);

export default router;
