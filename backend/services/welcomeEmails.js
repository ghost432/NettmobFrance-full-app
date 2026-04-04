import { sendNotificationEmail } from './emailService.js';

/**
 * Envoie un email de bienvenue après l'inscription
 */
export const sendWelcomeEmail = async (email, firstName, role) => {
  const roleLabel = role === 'automob' ? 'Automob (Auto-entrepreneur)' : 'Client';
  const title = '🎉 Bienvenue chez NettmobFrance !';

  const message = `
    <p style="font-size: 18px; color: #1e293b;">Bonjour <strong>${firstName}</strong>,</p>
    <p style="font-size: 16px;">Nous sommes ravis de vous accueillir au sein de notre communauté en tant que <strong>${roleLabel}</strong>.</p>
    
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; border: 1px solid #e2e8f0; margin: 30px 0;">
      <h4 style="margin: 0 0 15px 0; color: #1e293b; font-size: 16px;">Pour commencer votre aventure :</h4>
      <ul style="margin: 0; padding-left: 20px; line-height: 2; color: #475569;">
        <li>🚀 <strong>Complétez votre profil</strong> pour attirer les meilleures opportunités</li>
        <li>🆔 <strong>Vérifiez votre identité</strong> pour sécuriser votre compte</li>
        <li>🎯 <strong>${role === 'automob' ? 'Explorez les missions' : 'Publiez votre premier besoin'}</strong> dès maintenant</li>
      </ul>
    </div>
    
    <p style="font-size: 15px; color: #475569;">Votre identifiant de connexion est votre adresse email : <strong>${email}</strong>.</p>
  `;

  const actionUrl = `${process.env.FRONTEND_URL}/login`;

  try {
    await sendNotificationEmail(email, title, message, actionUrl);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email bienvenue:', error);
    return false;
  }
};

/**
 * Demande de vérification d'identité
 */
export const sendIdentityVerificationRequestEmail = async (email, firstName, role) => {
  const roleLabel = role === 'automob' ? 'votre profil Automob' : 'votre compte Entreprise';
  const title = '🆔 Vérification d\'identité requise';

  const message = `
    <p style="font-size: 16px;">Bonjour <strong>${firstName}</strong>,</p>
    <p style="font-size: 16px;">Pour garantir la sécurité et la confiance sur NettmobFrance, nous devons procéder à la vérification de ${roleLabel}.</p>
    
    <div style="background-color: #fffbeb; border-radius: 12px; padding: 25px; border: 1px solid #fef3c7; margin: 30px 0;">
      <p style="margin: 0; color: #92400e; font-size: 15px; line-height: 1.6;">
        <strong>⚠️ Étape primordiale :</strong> Tant que votre identité n'est pas validée, l'accès à certaines fonctionnalités (paiements, candidatures, etc.) restera limité.
      </p>
    </div>
    
    <h4 style="color: #1e293b; font-size: 16px;">Documents acceptés :</h4>
    <p style="color: #475569; font-size: 15px;">Carte d'identité nationale, Passeport ou Permis de conduire en cours de validité.</p>
  `;

  const actionUrl = `${process.env.FRONTEND_URL}/${role}/verify-identity`;

  try {
    await sendNotificationEmail(email, title, message, actionUrl);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email demande vérification:', error);
    return false;
  }
};
