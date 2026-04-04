import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { notifyNewChatMessage } from '../services/chatNotificationService.js';

const router = express.Router();

// Get or create conversation
router.post('/conversations', authenticateToken, async (req, res) => {
  const { missionId, participantId } = req.body;
  const userId = req.user.id;

  try {
    // Vérifier la mission
    const [missions] = await db.query('SELECT * FROM missions WHERE id = ?', [missionId]);
    if (missions.length === 0) {
      return res.status(404).json({ error: 'Mission non trouvée' });
    }

    const mission = missions[0];
    let clientId, automobId;

    // Déterminer client et automob
    if (mission.client_id === userId) {
      clientId = userId;
      automobId = participantId;
    } else if (mission.assigned_automob_id === userId) {
      automobId = userId;
      clientId = participantId;
    } else {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Chercher ou créer conversation
    let [conversations] = await db.query(
      'SELECT * FROM chat_conversations WHERE mission_id = ? AND client_id = ? AND automob_id = ?',
      [missionId, clientId, automobId]
    );

    if (conversations.length === 0) {
      const [result] = await db.query(
        'INSERT INTO chat_conversations (mission_id, client_id, automob_id) VALUES (?, ?, ?)',
        [missionId, clientId, automobId]
      );
      [conversations] = await db.query('SELECT * FROM chat_conversations WHERE id = ?', [result.insertId]);
    }

    res.json(conversations[0]);
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la conversation' });
  }
});

// Get user conversations
router.get('/conversations', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const [conversations] = await db.query(`
      SELECT cc.*, 
             m.title as mission_title,
             CASE 
               WHEN cc.client_id = ? THEN ap.first_name
               ELSE cp.company_name
             END as participant_name,
             CASE 
               WHEN cc.client_id = ? THEN ap.user_id
               ELSE cp.user_id
             END as participant_id,
             (SELECT COUNT(*) FROM chat_messages cm 
              WHERE cm.conversation_id = cc.id 
              AND cm.sender_id != ? 
              AND cm.read_status = FALSE) as unread_count
      FROM chat_conversations cc
      JOIN missions m ON cc.mission_id = m.id
      LEFT JOIN automob_profiles ap ON cc.automob_id = ap.user_id
      LEFT JOIN client_profiles cp ON cc.client_id = cp.user_id
      WHERE cc.client_id = ? OR cc.automob_id = ?
      ORDER BY cc.last_message_at DESC
    `, [userId, userId, userId, userId, userId]);

    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des conversations' });
  }
});

// Get conversation messages
router.get('/conversations/:id/messages', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Vérifier l'accès
    const [conversations] = await db.query(
      'SELECT * FROM chat_conversations WHERE id = ? AND (client_id = ? OR automob_id = ?)',
      [id, userId, userId]
    );

    if (conversations.length === 0) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Récupérer les messages
    const [messages] = await db.query(`
      SELECT cm.*, 
             CASE 
               WHEN u.role = 'client' THEN cp.company_name
               ELSE CONCAT(ap.first_name, ' ', ap.last_name)
             END as sender_name
      FROM chat_messages cm
      JOIN users u ON cm.sender_id = u.id
      LEFT JOIN automob_profiles ap ON cm.sender_id = ap.user_id
      LEFT JOIN client_profiles cp ON cm.sender_id = cp.user_id
      WHERE cm.conversation_id = ?
      ORDER BY cm.created_at ASC
    `, [id]);

    // Marquer comme lu
    await db.query(
      'UPDATE chat_messages SET read_status = TRUE WHERE conversation_id = ? AND sender_id != ?',
      [id, userId]
    );

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des messages' });
  }
});

// Send message
router.post('/conversations/:id/messages', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;
  const userId = req.user.id;

  try {
    // Vérifier l'accès
    const [conversations] = await db.query(
      'SELECT * FROM chat_conversations WHERE id = ? AND (client_id = ? OR automob_id = ?)',
      [id, userId, userId]
    );

    if (conversations.length === 0) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Insérer le message
    const [result] = await db.query(
      'INSERT INTO chat_messages (conversation_id, sender_id, message) VALUES (?, ?, ?)',
      [id, userId, message]
    );

    // Mettre à jour la conversation
    await db.query(
      'UPDATE chat_conversations SET last_message_at = NOW() WHERE id = ?',
      [id]
    );

    // Récupérer le message complet
    const [newMessage] = await db.query(`
      SELECT cm.*, 
             CASE 
               WHEN u.role = 'client' THEN cp.company_name
               ELSE CONCAT(ap.first_name, ' ', ap.last_name)
             END as sender_name
      FROM chat_messages cm
      JOIN users u ON cm.sender_id = u.id
      LEFT JOIN automob_profiles ap ON cm.sender_id = ap.user_id
      LEFT JOIN client_profiles cp ON cm.sender_id = cp.user_id
      WHERE cm.id = ?
    `, [result.insertId]);

    // Notifier le destinataire
    const io = req.app.get('io');
    setImmediate(() => {
      notifyNewChatMessage(id, userId, message, io);
    });

    res.status(201).json(newMessage[0]);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du message' });
  }
});

// Get unread count
router.get('/unread-count', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const [result] = await db.query(`
      SELECT COUNT(*) as count
      FROM chat_messages cm
      JOIN chat_conversations cc ON cm.conversation_id = cc.id
      WHERE (cc.client_id = ? OR cc.automob_id = ?)
      AND cm.sender_id != ?
      AND cm.read_status = FALSE
    `, [userId, userId, userId]);

    res.json({ count: result[0].count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du compteur' });
  }
});

export default router;
