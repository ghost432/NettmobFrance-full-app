import { sendNotificationEmail } from './emailService.js';
import db from '../config/database.js';

/**
 * Récupère les emails de tous les admins
 */
const getAdminEmails = async () => {
    try {
        const [admins] = await db.query(
            'SELECT email FROM users WHERE role = ? AND email IS NOT NULL',
            ['admin']
        );
        return admins.map(admin => admin.email);
    } catch (error) {
        console.error('Erreur récupération emails admin:', error);
        return [];
    }
};

/**
 * Envoie un email aux admins quand un nouveau ticket est créé
 */
export const sendNewTicketAdminEmail = async (ticketId, userName, userEmail, subject, category) => {
    const adminEmails = await getAdminEmails();
    const mailSubject = `🎫 Nouveau ticket support : ${subject}`;

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #4F46E5; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Nouveau Ticket Support</h1>
      </div>
      <div style="padding: 24px;">
        <p>Un nouveau ticket a été ouvert par <strong>${userName}</strong> (${userEmail}).</p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Sujet :</strong> ${subject}</p>
          <p style="margin: 5px 0;"><strong>Catégorie :</strong> ${category}</p>
          <p style="margin: 5px 0;"><strong>Ticket ID :</strong> #${ticketId}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/admin/support/${ticketId}" 
             style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Voir le ticket
          </a>
        </div>
      </div>
    </div>
  `;

    for (const email of adminEmails) {
        await sendNotificationEmail(email, mailSubject, html).catch(err =>
            console.error(`Erreur envoi email nouveau ticket à ${email}:`, err)
        );
    }
};

/**
 * Envoie un email à l'utilisateur quand un admin répond
 */
export const sendTicketReplyEmail = async (userEmail, userName, ticketId, subject) => {
    const mailSubject = `💬 Réponse à votre ticket : ${subject}`;

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #4F46E5; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Nouveau Message Support</h1>
      </div>
      <div style="padding: 24px;">
        <p>Bonjour ${userName},</p>
        <p>Notre équipe de support a répondu à votre ticket : <strong>"${subject}"</strong>.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/support/${ticketId}" 
             style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Voir la réponse
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">Cordialement,<br>L'équipe NettmobFrance</p>
      </div>
    </div>
  `;

    await sendNotificationEmail(userEmail, mailSubject, html).catch(err =>
        console.error(`Erreur envoi email réponse ticket à ${userEmail}:`, err)
    );
};

/**
 * Envoie un email aux admins quand un utilisateur répond
 */
export const sendAdminReplyNotificationEmail = async (ticketId, userName, subject) => {
    const adminEmails = await getAdminEmails();
    const mailSubject = `💬 Utilisateur a répondu au ticket : ${subject}`;

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #4F46E5; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Nouvelle réponse utilisateur</h1>
      </div>
      <div style="padding: 24px;">
        <p>L'utilisateur <strong>${userName}</strong> a répondu au ticket <strong>"${subject}"</strong> (#${ticketId}).</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/admin/support/${ticketId}" 
             style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Voir le ticket
          </a>
        </div>
      </div>
    </div>
  `;

    for (const email of adminEmails) {
        await sendNotificationEmail(email, mailSubject, html).catch(err =>
            console.error(`Erreur envoi email notification réponse admin à ${email}:`, err)
        );
    }
};

/**
 * Envoie un email à l'utilisateur quand le ticket est fermé/résolu
 */
export const sendTicketClosedEmail = async (userEmail, userName, ticketId, subject, status) => {
    const isResolved = status === 'resolved';
    const mailSubject = isResolved ? `✅ Ticket résolu : ${subject}` : `🔒 Ticket fermé : ${subject}`;

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background-color: ${isResolved ? '#10B981' : '#6b7280'}; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">${isResolved ? 'Ticket Résolu' : 'Ticket Fermé'}</h1>
      </div>
      <div style="padding: 24px;">
        <p>Bonjour ${userName},</p>
        <p>Votre ticket <strong>"${subject}"</strong> a été marqué comme <strong>${isResolved ? 'résolu' : 'fermé'}</strong>.</p>
        <p>Si vous avez d'autres questions, n'hésitez pas à ouvrir un nouveau ticket.</p>
        <p style="color: #6b7280; font-size: 14px;">Cordialement,<br>L'équipe NettmobFrance</p>
      </div>
    </div>
  `;

    await sendNotificationEmail(userEmail, mailSubject, html).catch(err =>
        console.error(`Erreur envoi email fermeture ticket à ${userEmail}:`, err)
    );
};
