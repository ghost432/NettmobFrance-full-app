import { sendNotificationEmail } from './emailService.js';
import db from '../config/database.js';

/**
 * Envoie un email quand un Automob crée un litige contre un Client
 */
export const sendDisputeCreatedByAutomobEmail = async (disputeId, automobName, clientEmail, missionTitle, disputeTitle) => {
  const title = '⚠️ Nouveau litige ouvert';

  const message = `
    <p style="font-size: 16px;">Bonjour,</p>
    <p style="font-size: 16px;">L'Automob <strong>${automobName}</strong> a ouvert un litige concernant la mission <strong>"${missionTitle}"</strong>.</p>
    
    <div style="background-color: #fffbeb; border-radius: 12px; padding: 25px; border: 1px solid #fef3c7; margin: 30px 0;">
      <h4 style="margin: 0 0 10px 0; color: #92400e; font-size: 16px;">Détails du désaccord :</h4>
      <p style="margin: 0; color: #b45309; font-size: 15px; line-height: 1.6;"><strong>Objet :</strong> ${disputeTitle}</p>
      <p style="margin: 5px 0 0 0; color: #b45309; font-size: 14px;">Référence : #${disputeId}</p>
    </div>
    
    <p style="font-size: 15px; color: #475569;">Nous vous recommandons de consulter les détails du litige et d'apporter vos éléments de réponse dès que possible pour aider à sa résolution.</p>
  `;

  const actionUrl = `${process.env.FRONTEND_URL}/client/disputes/${disputeId}`;

  try {
    await sendNotificationEmail(clientEmail, title, message, actionUrl);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email litige automob→client:', error);
    return false;
  }
};

/**
 * Envoie un email quand un Client crée un litige contre un Automob
 */
export const sendDisputeCreatedByClientEmail = async (disputeId, clientName, automobEmail, missionTitle, disputeTitle) => {
  const title = '⚠️ Signalement de litige';

  const message = `
    <p style="font-size: 16px;">Bonjour,</p>
    <p style="font-size: 16px;">Le client <strong>${clientName}</strong> a ouvert un litige concernant la mission <strong>"${missionTitle}"</strong> à laquelle vous avez participé.</p>
    
    <div style="background-color: #fffbeb; border-radius: 12px; padding: 25px; border: 1px solid #fef3c7; margin: 30px 0;">
      <h4 style="margin: 0 0 10px 0; color: #92400e; font-size: 16px;">Objet du litige :</h4>
      <p style="margin: 0; color: #b45309; font-size: 15px; line-height: 1.6;">${disputeTitle}</p>
      <p style="margin: 5px 0 0 0; color: #b45309; font-size: 14px;">Référence : #${disputeId}</p>
    </div>
    
    <p style="font-size: 15px; color: #475569;">Il est important que vous preniez connaissance du contenu de ce litige et que vous répondiez aux questions de nos modérateurs via votre espace personnel.</p>
  `;

  const actionUrl = `${process.env.FRONTEND_URL}/automob/disputes/${disputeId}`;

  try {
    await sendNotificationEmail(automobEmail, title, message, actionUrl);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email litige client→automob:', error);
    return false;
  }
};

/**
 * Envoie un email aux admins quand un litige est créé
 */
export const sendDisputeCreatedToAdminsEmail = async (disputeId, creatorRole, creatorName, againstRole, missionTitle, disputeTitle) => {
  const title = '🚨 Action Requise : Nouveau Litige';

  const message = `
    <p style="font-size: 16px;">Un nouveau litige vient d'être initié sur la plateforme et nécessite un arbitrage.</p>
    
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; border: 1px solid #e2e8f0; margin: 30px 0;">
      <div style="margin-bottom: 12px; display: flex; align-items: baseline;">
        <span style="color: #64748b; font-weight: 600; min-width: 120px; font-size: 14px;">Litige :</span>
        <span style="color: #1e293b; font-size: 15px; font-weight: 500; margin-left: 10px;">#${disputeId} - ${disputeTitle}</span>
      </div>
      <div style="margin-bottom: 12px; display: flex; align-items: baseline;">
        <span style="color: #64748b; font-weight: 600; min-width: 120px; font-size: 14px;">Initié par :</span>
        <span style="color: #1e293b; font-size: 14px; background: #eff6ff; color: #2563eb; padding: 2px 10px; border-radius: 4px; margin-left: 10px;">${creatorName} (${creatorRole})</span>
      </div>
      <div style="display: flex; align-items: baseline;">
        <span style="color: #64748b; font-weight: 600; min-width: 120px; font-size: 14px;">Mission :</span>
        <span style="color: #1e293b; font-size: 15px; font-weight: 500; margin-left: 10px;">${missionTitle}</span>
      </div>
    </div>
  `;

  const actionUrl = `${process.env.FRONTEND_URL}/admin/disputes/${disputeId}`;

  try {
    const [admins] = await db.query('SELECT email FROM users WHERE role = "admin"');
    const adminEmails = admins.map(admin => admin.email);

    for (const adminEmail of adminEmails) {
      await sendNotificationEmail(adminEmail, title, message, actionUrl).catch(err =>
        console.error(`Erreur envoi email litige admin à ${adminEmail}:`, err)
      );
    }
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email admins:', error);
    return false;
  }
};

/**
 * Envoie un email quand un admin prend une décision sur un litige
 */
export const sendDisputeResolvedEmail = async (userEmail, userName, disputeId, missionTitle, decision, adminNotes, compensationAmount = 0, isWinner = false) => {
  const decisionLabels = {
    automob_wins: 'Décision en faveur de l\'Automob',
    client_wins: 'Décision en faveur du Client',
    partial: 'Arbitrage partiel',
    rejected: 'Litige rejeté'
  };

  const decisionLabel = decisionLabels[decision] || decision;
  const outcomeColor = isWinner ? '#10b981' : '#64748b';
  const title = isWinner ? '✅ Résolution favorable du litige' : '⚖️ Décision rendue sur le litige';

  const message = `
    <p style="font-size: 16px;">Bonjour <strong>${userName}</strong>,</p>
    <p style="font-size: 16px;">L'arbitrage concernant le litige <strong>#${disputeId}</strong> (${missionTitle}) a été rendu par nos services.</p>
    
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; border: 1px solid #e2e8f0; margin: 30px 0;">
      <h4 style="margin: 0 0 15px 0; color: #1e293b; font-size: 16px;">Conclusion de l'arbitrage :</h4>
      <p style="margin: 0; padding: 12px; background: white; border-radius: 6px; border-left: 4px solid ${outcomeColor}; color: #334155; font-weight: 600;">
        ${decisionLabel}
      </p>
      
      ${adminNotes ? `
        <div style="margin-top: 20px;">
          <p style="margin: 0; color: #64748b; font-size: 13px; text-transform: uppercase;">Commentaires de l'arbitre :</p>
          <p style="margin: 5px 0 0 0; color: #475569; font-size: 15px; line-height: 1.6; font-style: italic;">"${adminNotes}"</p>
        </div>
      ` : ''}
      
      ${compensationAmount > 0 ? `
        <div style="margin-top: 25px; padding: 15px; background: #f0fdf4; border-radius: 8px; text-align: center;">
          <p style="margin: 0; color: #166534; font-size: 14px;">Règlement financier associé :</p>
          <p style="margin: 5px 0 0 0; color: #15803d; font-size: 24px; font-weight: bold;">+${compensationAmount.toFixed(2)}€</p>
          <p style="margin: 5px 0 0 0; color: #15803d; font-size: 12px;">Transféré sur votre portefeuille virtuel</p>
        </div>
      ` : ''}
    </div>
    
    <p style="font-size: 14px; color: #94a3b8; text-align: center; margin-top: 20px;">
      Cette décision est définitive et clôture officiellement ce litige au regard de nos conditions d'utilisation.
    </p>
  `;

  const dashboardPath = userName.toLowerCase().includes('client') ? 'client' : 'automob';
  const actionUrl = `${process.env.FRONTEND_URL}/${dashboardPath}/disputes/${disputeId}`;

  try {
    await sendNotificationEmail(userEmail, title, message, actionUrl);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email résolution:', error);
    return false;
  }
};
