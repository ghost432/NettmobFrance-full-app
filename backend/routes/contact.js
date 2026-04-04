import express from 'express';
import db from '../config/database.js';
import { authenticateToken, adminRequired } from '../middleware/auth.js';
import { sendFCMNotificationToMultipleUsers } from '../services/fcmNotificationService.js';
import { sendNotificationEmail } from '../services/emailService.js';

const router = express.Router();

/**
 * POST /api/contact
 * Public endpoint to submit a contact form
 */
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ error: 'Tous les champs sont obligatoires' });
        }

        const [result] = await db.query(
            'INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)',
            [name, email, phone || null, subject, message]
        );

        // Notifier tous les administrateurs
        try {
            const [admins] = await db.query("SELECT id, email FROM users WHERE role = 'admin'");
            const adminIds = admins.map(a => a.id);
            const adminEmails = admins.map(a => a.email);

            if (adminIds.length > 0) {
                // Notification Push
                await sendFCMNotificationToMultipleUsers(
                    adminIds,
                    {
                        title: '📬 Nouveau Message de Contact',
                        body: `De: ${name}\nSujet: ${subject}`,
                        icon: '/favicon-1.png'
                    },
                    {
                        type: 'contact_message',
                        click_action: '/admin/contact'
                    }
                );

                // Notification Email
                const emailTitle = '📬 Nouveau Message de Contact - NettmobFrance';
                const emailBody = `
                    <p>Vous avez reçu un nouveau message via le formulaire de contact.</p>
                    <p><strong>De :</strong> ${name} (${email})</p>
                    ${phone ? `<p><strong>Téléphone :</strong> ${phone}</p>` : ''}
                    <p><strong>Sujet :</strong> ${subject}</p>
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 10px; border-left: 4px solid #2563eb;">
                        ${message}
                    </div>
                `;

                for (const adminEmail of adminEmails) {
                    await sendNotificationEmail(adminEmail, emailTitle, emailBody, `${process.env.FRONTEND_URL}/admin/contact`);
                }
            }
        } catch (notifError) {
            console.error('Erreur notifications contact messages:', notifError);
        }

        res.status(201).json({
            success: true,
            message: 'Votre message a été envoyé avec succès',
            id: result.insertId
        });
    } catch (error) {
        console.error('Erreur submission contact:', error);
        res.status(500).json({ error: 'Une erreur est survenue lors de l\'envoi du message' });
    }
});

/**
 * GET /api/contact/admin
 * Admin endpoint to list all contact messages
 */
router.get('/admin', authenticateToken, adminRequired, async (req, res) => {
    try {
        const [messages] = await db.query(
            'SELECT * FROM contact_messages ORDER BY created_at DESC'
        );
        res.json({ messages });
    } catch (error) {
        console.error('Erreur récupération contact messages:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * GET /api/contact/admin/unread-count
 * Get count of unread contact messages
 */
router.get('/admin/unread-count', authenticateToken, adminRequired, async (req, res) => {
    try {
        const [result] = await db.query(
            'SELECT COUNT(*) as count FROM contact_messages WHERE is_read = 0'
        );
        res.json({ count: result[0].count });
    } catch (error) {
        console.error('Erreur unread count contact:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * PATCH /api/contact/admin/:id/read
 * Mark a message as read
 */
router.patch('/admin/:id/read', authenticateToken, adminRequired, async (req, res) => {
    try {
        const { id } = req.params;
        const { is_read } = req.body;

        await db.query(
            'UPDATE contact_messages SET is_read = ? WHERE id = ?',
            [is_read ? 1 : 0, id]
        );

        res.json({ success: true, message: 'Statut du message mis à jour' });
    } catch (error) {
        console.error('Erreur update contact message:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * DELETE /api/contact/admin/:id
 * Delete a contact message
 */
router.delete('/admin/:id', authenticateToken, adminRequired, async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM contact_messages WHERE id = ?', [id]);
        res.json({ success: true, message: 'Message supprimé' });
    } catch (error) {
        console.error('Erreur suppression contact message:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default router;
