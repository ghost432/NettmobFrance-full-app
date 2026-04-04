import db from '../config/database.js';
import { createNotification } from '../utils/notificationHelper.js';
import { sendNotificationEmail } from './emailService.js';

/**
 * Service pour gérer les notifications de chat
 */
export const notifyNewChatMessage = async (conversationId, senderId, messageText, io = null) => {
  try {
    // 1. Récupérer les détails de la conversation et du destinataire
    const [conversations] = await db.query(
      `SELECT cc.*, m.title as mission_title 
       FROM chat_conversations cc
       JOIN missions m ON cc.mission_id = m.id
       WHERE cc.id = ?`,
      [conversationId]
    );

    if (conversations.length === 0) return;

    const conversation = conversations[0];
    const recipientId = conversation.client_id === senderId ? conversation.automob_id : conversation.client_id;

    // 2. Récupérer le nom de l'expéditeur et les infos du destinataire
    const [senderRows] = await db.query(
      `SELECT u.role, 
              CASE 
                WHEN u.role = 'client' THEN cp.company_name
                ELSE CONCAT(ap.first_name, ' ', ap.last_name)
              END as name
       FROM users u
       LEFT JOIN client_profiles cp ON u.id = cp.user_id
       LEFT JOIN automob_profiles ap ON u.id = ap.user_id
       WHERE u.id = ?`,
      [senderId]
    );

    const [recipientRows] = await db.query(
      `SELECT email FROM users WHERE id = ?`,
      [recipientId]
    );

    if (senderRows.length === 0 || recipientRows.length === 0) return;

    const senderName = senderRows[0].name;
    const recipientEmail = recipientRows[0].email;
    const missionTitle = conversation.mission_title;

    // 3. Créer la notification in-app (qui gère aussi le Web Push et FCM via setImmediate)
    const title = `💬 Nouveau message - ${missionTitle}`;
    const notificationMessage = `${senderName} vous a envoyé un message concernant la mission "${missionTitle}".`;
    const actionUrl = `/chat?conversationId=${conversationId}`;

    await createNotification(
      recipientId,
      title,
      notificationMessage,
      'info',
      'message',
      actionUrl,
      io
    );

    const emailTitle = `💬 Nouveau message de ${senderName}`;
    const emailMessage = `
          <p style="font-size: 16px;">Bonjour,</p>
          <p style="font-size: 16px;">Vous avez reçu un nouveau message concernant la mission <strong>"${missionTitle}"</strong>.</p>
          
          <div style="background-color: #f3f4f6; border-radius: 12px; padding: 25px; border-left: 4px solid #3b82f6; margin: 30px 0;">
            <p style="margin: 0 0 10px 0; color: #64748b; font-size: 13px; text-transform: uppercase; font-weight: 600;">Message de ${senderName} :</p>
            <p style="margin: 0; color: #1e293b; font-size: 15px; line-height: 1.6; font-style: italic;">
              "${messageText.length > 150 ? messageText.substring(0, 150) + '...' : messageText}"
            </p>
          </div>
        `;

    // On utilise setImmediate pour ne pas bloquer l'envoi du message
    setImmediate(async () => {
      try {
        await sendNotificationEmail(
          recipientEmail,
          emailTitle,
          emailMessage,
          `${process.env.FRONTEND_URL}${actionUrl}`
        );
        console.log(`✅ Email de notification de message envoyé à ${recipientEmail}`);
      } catch (error) {
        console.error('❌ Erreur envoi email notification message:', error);
      }
    });

  } catch (error) {
    console.error('❌ Erreur dans chatNotificationService:', error);
  }
};

export default {
  notifyNewChatMessage
};
