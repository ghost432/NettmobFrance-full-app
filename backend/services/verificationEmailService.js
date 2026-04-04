import { sendNotificationEmail } from './emailService.js';
import db from '../config/database.js';

/**
 * Envoie un email à l'utilisateur pour confirmer la soumission
 */
export const sendVerificationSubmittedEmail = async (userEmail, userName, userType) => {
  const title = '📋 Demande de vérification reçue';

  const message = `
    <p style="font-size: 16px;">Bonjour <strong>${userName}</strong>,</p>
    <p style="font-size: 16px;">Votre dossier de vérification d'identité a bien été transmis aux équipes de NettmobFrance.</p>
    
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; border: 1px solid #e2e8f0; margin: 30px 0;">
      <h4 style="margin: 0 0 15px 0; color: #1e293b; font-size: 16px;">Ce qu'il faut savoir :</h4>
      <ul style="margin: 0; padding-left: 20px; line-height: 1.8; color: #475569;">
        <li>Délai moyen de traitement : <strong>24h à 48h</strong> ouvrées.</li>
        <li>Vous serez notifié par email dès que le statut changera.</li>
        <li>Vous pouvez suivre l'avancement sur votre tableau de bord.</li>
      </ul>
    </div>
    
    <p style="font-size: 15px; color: #475569;">Merci pour votre patience, nous mettons tout en œuvre pour valider votre profil dans les meilleurs délais.</p>
  `;

  const actionUrl = userType === 'automob'
    ? `${process.env.FRONTEND_URL}/automob/dashboard`
    : `${process.env.FRONTEND_URL}/client/dashboard`;

  try {
    await sendNotificationEmail(userEmail, title, message, actionUrl);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email soumission:', error);
    return false;
  }
};

/**
 * Envoie un email aux admins pour les informer d'une nouvelle demande
 */
export const sendAdminNotificationEmail = async (userName, userEmail, userType) => {
  try {
    const adminEmails = await getAdminEmails();
    const title = '🔔 Nouvelle vérification requise';
    const typeLabel = userType === 'automob' ? 'Automob' : 'Client';

    const message = `
      <p style="font-size: 16px;">Une nouvelle demande de vérification d'identité vient d'être soumise sur la plateforme.</p>
      
      <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; border: 1px solid #e2e8f0; margin: 30px 0;">
        <div style="margin-bottom: 12px; display: flex; align-items: baseline;">
          <span style="color: #64748b; font-weight: 600; min-width: 100px; font-size: 14px;">Utilisateur :</span>
          <span style="color: #1e293b; font-size: 15px; font-weight: 500; margin-left: 10px;">${userName}</span>
        </div>
        <div style="margin-bottom: 12px; display: flex; align-items: baseline;">
          <span style="color: #64748b; font-weight: 600; min-width: 100px; font-size: 14px;">Type :</span>
          <span style="color: #1e293b; font-size: 14px; background: #eff6ff; color: #2563eb; padding: 4px 12px; border-radius: 99px; margin-left: 10px;">${typeLabel}</span>
        </div>
        <div style="display: flex; align-items: baseline;">
          <span style="color: #64748b; font-weight: 600; min-width: 100px; font-size: 14px;">Email :</span>
          <span style="color: #1e293b; font-size: 15px; font-weight: 500; margin-left: 10px;">${userEmail}</span>
        </div>
      </div>
    `;

    const actionUrl = `${process.env.FRONTEND_URL}/admin/verifications-new`;

    for (const adminEmail of adminEmails) {
      await sendNotificationEmail(adminEmail, title, message, actionUrl).catch(err =>
        console.error(`Erreur envoi email admin verification à ${adminEmail}:`, err)
      );
    }
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email admin notification:', error);
    return false;
  }
};

/**
 * Envoie un email d'approbation
 */
export const sendApprovalEmail = async (userEmail, userName, userType) => {
  const title = '🎉 Votre identité est vérifiée';

  const message = `
    <p style="font-size: 18px; color: #1e293b;">Excellente nouvelle <strong>${userName}</strong> !</p>
    <p style="font-size: 16px;">Vos documents ont été validés avec succès par notre équipe de modération.</p>
    
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; padding: 30px; color: white; margin: 30px 0; text-align: center; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);">
      <div style="font-size: 48px; margin-bottom: 15px;">✅</div>
      <h3 style="margin: 0; font-size: 20px;">Compte Officiellement Vérifié</h3>
      <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Toutes les fonctionnalités sont maintenant débloquées.</p>
    </div>
    
    <p style="font-size: 15px; color: #475569;">Un badge de vérification apparaîtra désormais sur votre profil, renforçant ainsi la confiance auprès de la communauté NettmobFrance.</p>
  `;

  const actionUrl = userType === 'automob'
    ? `${process.env.FRONTEND_URL}/automob/dashboard`
    : `${process.env.FRONTEND_URL}/client/dashboard`;

  try {
    await sendNotificationEmail(userEmail, title, message, actionUrl);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email approbation:', error);
    return false;
  }
};

/**
 * Envoie un email de rejet
 */
export const sendRejectionEmail = async (userEmail, userName, reason, userType) => {
  const title = '✉️ Mise à jour de votre dossier';

  const message = `
    <p style="font-size: 16px;">Bonjour <strong>${userName}</strong>,</p>
    <p style="font-size: 16px;">Après examen de votre dossier de vérification, nous ne sommes pas en mesure de le valider en l'état.</p>
    
    <div style="background-color: #fef2f2; border-radius: 12px; padding: 25px; border: 1px solid #fee2e2; margin: 30px 0;">
      <h4 style="margin: 0 0 10px 0; color: #991b1b; font-size: 16px;">Motif du refus :</h4>
      <p style="margin: 0; color: #dc2626; font-size: 15px; line-height: 1.6; font-style: italic;">"${reason}"</p>
    </div>
    
    <p style="font-size: 15px; color: #475569;">Ne vous inquiétez pas, vous pouvez soumettre de nouveaux documents pour corriger ce point et relancer la procédure de vérification.</p>
  `;

  const actionUrl = userType === 'automob'
    ? `${process.env.FRONTEND_URL}/automob/verify-identity`
    : `${process.env.FRONTEND_URL}/client/verify-identity`;

  try {
    await sendNotificationEmail(userEmail, title, message, actionUrl);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email rejet:', error);
    return false;
  }
};

/**
 * Envoie un email de révocation
 */
export const sendRevocationEmail = async (userEmail, userName, userType) => {
  const title = '⚠️ Statut de vérification révoqué';

  const message = `
    <p style="font-size: 16px;">Bonjour <strong>${userName}</strong>,</p>
    <p style="font-size: 16px;">Votre statut de profil vérifié a été révoqué suite à une mise à jour administrative ou un changement dans vos documents.</p>
    
    <div style="background-color: #fffbeb; border-radius: 12px; padding: 25px; border: 1px solid #fef3c7; margin: 30px 0;">
      <p style="margin: 0; color: #92400e; font-size: 15px; line-height: 1.6;">
        Pour garantir la sécurité de la plateforme, certaines fonctionnalités pourraient être limitées jusqu'à ce que nous recevions de nouvelles preuves d'identité valides.
      </p>
    </div>
    
    <p style="font-size: 15px; color: #475569;">Veuillez régulariser votre situation dès que possible en soumettant vos documents à jour.</p>
  `;

  const actionUrl = userType === 'automob'
    ? `${process.env.FRONTEND_URL}/automob/verify-identity`
    : `${process.env.FRONTEND_URL}/client/verify-identity`;

  try {
    await sendNotificationEmail(userEmail, title, message, actionUrl);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email révocation:', error);
    return false;
  }
};

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
