import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { createNotification } from '../utils/notificationHelper.js';
import {
  sendNewTicketAdminEmail,
  sendTicketReplyEmail,
  sendAdminReplyNotificationEmail,
  sendTicketClosedEmail
} from '../services/supportEmailService.js';

const router = express.Router();

/**
 * GET /api/support/tickets
 * Récupérer les tickets de l'utilisateur connecté
 */
router.get('/tickets', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    let query = `
      SELECT 
        t.id,
        t.subject,
        t.status,
        t.priority,
        t.category,
        t.last_message_at,
        t.created_at,
        t.updated_at,
        t.resolved_at,
        COUNT(DISTINCT m.id) as message_count,
        SUM(CASE WHEN m.is_read = 0 AND m.is_admin = 1 AND m.sender_id != ? THEN 1 ELSE 0 END) as unread_count,
        (SELECT message FROM support_messages WHERE ticket_id = t.id ORDER BY created_at DESC LIMIT 1) as last_message
      FROM support_tickets t
      LEFT JOIN support_messages m ON t.id = m.ticket_id
      WHERE t.user_id = ?
    `;

    const params = [userId, userId];

    if (status) {
      query += ` AND t.status = ?`;
      params.push(status);
    }

    query += ` GROUP BY t.id ORDER BY t.last_message_at DESC, t.created_at DESC`;

    const [tickets] = await db.query(query, params);

    res.json({ tickets });
  } catch (error) {
    console.error('Erreur récupération tickets:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/support/admin/tickets
 * Récupérer tous les tickets (admin uniquement)
 */
router.get('/admin/tickets', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const { status, assigned } = req.query;

    let query = `
      SELECT 
        t.id,
        t.user_id,
        t.subject,
        t.status,
        t.priority,
        t.category,
        t.assigned_admin_id,
        t.last_message_at,
        t.created_at,
        t.updated_at,
        t.resolved_at,
        u.email as user_email,
        COALESCE(
          CONCAT(ap.first_name, ' ', ap.last_name),
          CONCAT(cp.first_name, ' ', cp.last_name),
          u.email
        ) as user_name,
        u.role as user_role,
        COUNT(DISTINCT m.id) as message_count,
        SUM(CASE WHEN m.is_read = 0 AND m.is_admin = 0 THEN 1 ELSE 0 END) as unread_count,
        (SELECT message FROM support_messages WHERE ticket_id = t.id ORDER BY created_at DESC LIMIT 1) as last_message
      FROM support_tickets t
      INNER JOIN users u ON t.user_id = u.id
      LEFT JOIN automob_profiles ap ON u.id = ap.user_id AND u.role = 'automob'
      LEFT JOIN client_profiles cp ON u.id = cp.user_id AND u.role = 'client'
      LEFT JOIN support_messages m ON t.id = m.ticket_id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      query += ` AND t.status = ?`;
      params.push(status);
    }

    if (assigned === 'me') {
      query += ` AND t.assigned_admin_id = ?`;
      params.push(req.user.id);
    } else if (assigned === 'unassigned') {
      query += ` AND t.assigned_admin_id IS NULL`;
    }

    query += ` GROUP BY t.id ORDER BY t.priority DESC, t.last_message_at DESC, t.created_at DESC`;

    const [tickets] = await db.query(query, params);

    res.json({ tickets });
  } catch (error) {
    console.error('Erreur récupération tickets admin:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/support/tickets
 * Créer un nouveau ticket
 */
router.post('/tickets', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { subject, message, category, priority } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ error: 'Sujet et message requis' });
    }

    // Créer le ticket
    const [ticketResult] = await db.query(
      `INSERT INTO support_tickets (user_id, subject, category, priority) VALUES (?, ?, ?, ?)`,
      [userId, subject, category || 'other', priority || 'normal']
    );

    const ticketId = ticketResult.insertId;

    // Créer le premier message
    await db.query(
      `INSERT INTO support_messages (ticket_id, sender_id, message, is_admin) VALUES (?, ?, ?, 0)`,
      [ticketId, userId, message]
    );

    // Notifier les admins
    const io = req.app.get('io');
    if (io) {
      io.emit('new_support_ticket', {
        ticketId,
        userId,
        subject,
        message
      });
    }

    // Récupérer les informations de l'utilisateur pour la notification
    const [[userInfo]] = await db.query(
      `SELECT u.email, u.role,
              COALESCE(
                CONCAT(ap.first_name, ' ', ap.last_name),
                CONCAT(cp.first_name, ' ', cp.last_name),
                u.email
              ) as full_name
       FROM users u
       LEFT JOIN automob_profiles ap ON u.id = ap.user_id AND u.role = 'automob'
       LEFT JOIN client_profiles cp ON u.id = cp.user_id AND u.role = 'client'
       WHERE u.id = ?`,
      [userId]
    );

    // 🔧 VALIDATION EXPERT - Éviter undefined dans création ticket
    const userName = (userInfo && userInfo.full_name) ? userInfo.full_name : 'Un utilisateur';
    const validSubject = subject || 'un nouveau ticket';

    // ⚠️ Warning si paramètres undefined détectés
    if (!userInfo?.full_name || !subject) {
      console.warn('🚨 [SUPPORT] Création ticket avec paramètres undefined:', {
        originalUserName: userInfo?.full_name,
        originalSubject: subject,
        userId,
        ticketId,
        fallbackApplied: true
      });
    }

    // Notifier tous les admins
    const [[adminIds]] = await db.query(
      `SELECT GROUP_CONCAT(id) as ids FROM users WHERE role = 'admin'`
    );

    if (adminIds && adminIds.ids) {
      const ids = adminIds.ids.split(',').map(id => parseInt(id));
      for (const adminId of ids) {
        try {
          await createNotification(
            adminId,
            '💬 Nouveau ticket support',
            `${userName} a créé un ticket: ${validSubject}`,
            'info',
            'support',
            `/admin/support/${ticketId}`,
            io
          );
        } catch (e) {
          console.error('Erreur notification admin:', e);
        }
      }
    }

    res.json({
      success: true,
      ticketId,
      message: 'Ticket créé avec succès'
    });
  } catch (error) {
    console.error('Erreur création ticket:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/support/tickets/:ticketId
 * Récupérer les détails d'un ticket
 */
router.get('/tickets/:ticketId', authenticateToken, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    // Vérifier l'accès au ticket
    const [[ticket]] = await db.query(
      `SELECT t.*, 
              u.email as user_email,
              COALESCE(
                CONCAT(ap.first_name, ' ', ap.last_name),
                CONCAT(cp.first_name, ' ', cp.last_name),
                u.email
              ) as user_name,
              u.role as user_role
       FROM support_tickets t
       INNER JOIN users u ON t.user_id = u.id
       LEFT JOIN automob_profiles ap ON u.id = ap.user_id AND u.role = 'automob'
       LEFT JOIN client_profiles cp ON u.id = cp.user_id AND u.role = 'client'
       WHERE t.id = ?`,
      [ticketId]
    );

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket non trouvé' });
    }

    // Vérifier les permissions
    if (!isAdmin && ticket.user_id !== userId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Récupérer les messages
    const [messages] = await db.query(
      `SELECT 
        m.id,
        m.message,
        m.is_admin,
        m.is_read,
        m.created_at,
        m.sender_id,
        u.email as sender_email,
        COALESCE(
          CONCAT(ap.first_name, ' ', ap.last_name),
          CONCAT(cp.first_name, ' ', cp.last_name),
          u.email
        ) as sender_name
       FROM support_messages m
       INNER JOIN users u ON m.sender_id = u.id
       LEFT JOIN automob_profiles ap ON u.id = ap.user_id AND u.role = 'automob'
       LEFT JOIN client_profiles cp ON u.id = cp.user_id AND u.role = 'client'
       WHERE m.ticket_id = ?
       ORDER BY m.created_at ASC`,
      [ticketId]
    );

    // Marquer les messages comme lus
    if (isAdmin) {
      await db.query(
        `UPDATE support_messages SET is_read = 1 WHERE ticket_id = ? AND is_admin = 0 AND is_read = 0`,
        [ticketId]
      );
    } else {
      await db.query(
        `UPDATE support_messages SET is_read = 1 WHERE ticket_id = ? AND is_admin = 1 AND is_read = 0`,
        [ticketId]
      );
    }

    res.json({ ticket, messages });
  } catch (error) {
    console.error('Erreur récupération ticket:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/support/tickets/:ticketId/messages
 * Envoyer un message dans un ticket
 */
router.post('/tickets/:ticketId/messages', authenticateToken, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message requis' });
    }

    // Vérifier l'accès au ticket
    const [[ticket]] = await db.query(
      `SELECT * FROM support_tickets WHERE id = ?`,
      [ticketId]
    );

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket non trouvé' });
    }

    if (!isAdmin && ticket.user_id !== userId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Créer le message
    const [result] = await db.query(
      `INSERT INTO support_messages (ticket_id, sender_id, message, is_admin) VALUES (?, ?, ?, ?)`,
      [ticketId, userId, message, isAdmin ? 1 : 0]
    );

    const messageId = result.insertId;

    // Si le ticket était résolu, le rouvrir
    if (ticket.status === 'resolved' || ticket.status === 'closed') {
      await db.query(
        `UPDATE support_tickets SET status = 'open' WHERE id = ?`,
        [ticketId]
      );
    }

    const io = req.app.get('io');
    if (io) {
      if (isAdmin) {
        // Notifier l'utilisateur (admin répond)
        io.to(`user_${ticket.user_id}`).emit('new_support_message', {
          ticketId,
          messageId,
          message,
          isAdmin: true
        });

        // Récupérer les infos utilisateur pour l'email
        const [[userInfo]] = await db.query(
          `SELECT u.email, u.role,
                  COALESCE(
                    CONCAT(ap.first_name, ' ', ap.last_name),
                    CONCAT(cp.first_name, ' ', cp.last_name),
                    u.email
                  ) as full_name
           FROM users u
           LEFT JOIN automob_profiles ap ON u.id = ap.user_id AND u.role = 'automob'
           LEFT JOIN client_profiles cp ON u.id = cp.user_id AND u.role = 'client'
           WHERE u.id = ?`,
          [ticket.user_id]
        );

        if (userInfo && userInfo.email) {
          const userName = userInfo.full_name || 'Utilisateur';

          // Créer notification
          await createNotification(
            ticket.user_id,
            '💬 Nouvelle réponse support',
            `Un admin a répondu à votre ticket: ${ticket.subject || 'votre ticket'}`,
            'info',
            'support',
            `/${userInfo.role}/support/${ticketId}`,
            io
          );

          // Envoyer email utilisateur
          try {
            await sendTicketReplyEmail(userInfo.email, userName, ticketId, ticket.subject || 'votre ticket');
          } catch (e) {
            console.error('Erreur envoi email réponse support:', e);
          }
        }
      } else {
        // Notifier tous les admins (utilisateur envoie message)
        io.emit('new_support_message', {
          ticketId,
          messageId,
          message,
          isAdmin: false,
          userId: ticket.user_id
        });

        // Récupérer le nom de l'utilisateur pour les notifications admins
        const [[userInfo]] = await db.query(
          `SELECT u.email, u.role,
                  COALESCE(
                    CONCAT(ap.first_name, ' ', ap.last_name),
                    CONCAT(cp.first_name, ' ', cp.last_name),
                    u.email
                  ) as full_name
           FROM users u
           LEFT JOIN automob_profiles ap ON u.id = ap.user_id AND u.role = 'automob'
           LEFT JOIN client_profiles cp ON u.id = cp.user_id AND u.role = 'client'
           WHERE u.id = ?`,
          [ticket.user_id]
        );

        const userName = (userInfo && userInfo.full_name) ? userInfo.full_name : 'Un utilisateur';
        const validSubject = ticket.subject || 'un ticket support';

        // Notifier chaque admin individuellement
        const [[adminIds]] = await db.query(
          `SELECT GROUP_CONCAT(id) as ids FROM users WHERE role = 'admin'`
        );

        if (adminIds && adminIds.ids) {
          const ids = adminIds.ids.split(',').map(id => parseInt(id));
          for (const adminId of ids) {
            try {
              await createNotification(
                adminId,
                '💬 Nouveau message support',
                `${userName} a répondu au ticket: ${validSubject}`,
                'info',
                'support',
                `/admin/support/${ticketId}`,
                io
              );
            } catch (e) {
              console.error('Erreur notification admin:', e);
            }
          }
        }

        // Envoyer email admin (user replied)
        try {
          await sendAdminReplyNotificationEmail(ticketId, userName, ticket.subject);
        } catch (e) {
          console.error('Erreur envoi email admin réponse:', e);
        }
      }
    }

    res.json({
      success: true,
      messageId,
      message: 'Message envoyé'
    });
  } catch (error) {
    console.error('Erreur envoi message:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PATCH /api/support/tickets/:ticketId/status
 * Mettre à jour le statut d'un ticket
 */
router.patch('/tickets/:ticketId/status', authenticateToken, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;
    const isAdmin = req.user.role === 'admin';

    if (!['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    const [[ticket]] = await db.query(
      `SELECT * FROM support_tickets WHERE id = ?`,
      [ticketId]
    );

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket non trouvé' });
    }

    // Seul l'admin ou le propriétaire peut changer le statut
    if (!isAdmin && ticket.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const updates = ['status = ?'];
    const params = [status];

    if (status === 'resolved') {
      updates.push('resolved_at = NOW()');
    }

    await db.query(
      `UPDATE support_tickets SET ${updates.join(', ')} WHERE id = ?`,
      [...params, ticketId]
    );

    // Notifier l'autre partie
    const io = req.app.get('io');
    if (io && isAdmin) {
      await createNotification(
        ticket.user_id,
        '📋 Statut ticket mis à jour',
        `Votre ticket "${ticket.subject}" est maintenant: ${status}`,
        'info',
        'support',
        `/${req.user.role}/support/${ticketId}`,
        io
      );
    }

    // Envoyer email de fermeture (si résolu ou fermé par admin)
    if (isAdmin && (status === 'resolved' || status === 'closed')) {
      // Récupérer les infos utilisateur
      const [[userInfo]] = await db.query(
        `SELECT u.email, 
                COALESCE(
                  CONCAT(ap.first_name, ' ', ap.last_name),
                  CONCAT(cp.first_name, ' ', cp.last_name),
                  u.email
                ) as full_name
         FROM users u
         LEFT JOIN automob_profiles ap ON u.id = ap.user_id AND u.role = 'automob'
         LEFT JOIN client_profiles cp ON u.id = cp.user_id AND u.role = 'client'
         WHERE u.id = ?`,
        [ticket.user_id]
      );

      if (userInfo && userInfo.email) {
        try {
          await sendTicketClosedEmail(userInfo.email, userInfo.full_name || 'Utilisateur', ticketId, ticket.subject, status);
        } catch (e) {
          console.error('Erreur envoi email fermeture ticket:', e);
        }
      }
    }

    res.json({ success: true, message: 'Statut mis à jour' });
  } catch (error) {
    console.error('Erreur mise à jour statut:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PATCH /api/support/tickets/:ticketId/assign
 * Assigner un ticket à un admin (admin uniquement)
 */
router.patch('/tickets/:ticketId/assign', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const { ticketId } = req.params;
    const { adminId } = req.body;

    await db.query(
      `UPDATE support_tickets SET assigned_admin_id = ? WHERE id = ?`,
      [adminId || null, ticketId]
    );

    res.json({ success: true, message: 'Ticket assigné' });
  } catch (error) {
    console.error('Erreur assignation ticket:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/support/stats
 * Statistiques support (admin uniquement)
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const [[stats]] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed,
        SUM(CASE WHEN assigned_admin_id IS NULL AND status NOT IN ('resolved', 'closed') THEN 1 ELSE 0 END) as unassigned
      FROM support_tickets
    `);

    res.json({ stats: stats || {} });
  } catch (error) {
    console.error('Erreur récupération stats:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/support/unread-count
 * Récupérer le nombre de messages support non lus
 */
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    let query, params;

    if (isAdmin) {
      // Pour les admins : compter les messages non lus des utilisateurs
      query = `
        SELECT COUNT(DISTINCT m.id) as unread_count
        FROM support_messages m
        INNER JOIN support_tickets t ON m.ticket_id = t.id
        WHERE m.is_admin = 0 AND m.is_read = 0
      `;
      params = [];
    } else {
      // Pour les utilisateurs : compter les messages admin non lus
      query = `
        SELECT COUNT(DISTINCT m.id) as unread_count
        FROM support_messages m
        INNER JOIN support_tickets t ON m.ticket_id = t.id
        WHERE t.user_id = ? AND m.is_admin = 1 AND m.is_read = 0
      `;
      params = [userId];
    }

    const [[result]] = await db.query(query, params);

    res.json({ unread_count: result.unread_count || 0 });
  } catch (error) {
    console.error('Erreur récupération messages non lus:', error);
    res.status(500).json({ error: 'Erreur serveur', unread_count: 0 });
  }
});

export default router;
