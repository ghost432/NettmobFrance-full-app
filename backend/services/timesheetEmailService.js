import { sendNotificationEmail } from './emailService.js';

/**
 * Envoyer un email au client quand une feuille de temps est soumise
 */
async function sendTimesheetSubmittedEmail(clientEmail, data) {
  const { automobName, missionName, totalHours, overtimeHours, timesheetId } = data;

  const title = '⏳ Nouvelle feuille de temps à valider';

  const message = `
    <p style="font-size: 16px;">Bonjour,</p>
    <p style="font-size: 16px;">L'Automob <strong>${automobName}</strong> a soumis une feuille de temps pour la mission <strong>"${missionName}"</strong>.</p>
    
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; border: 1px solid #e2e8f0; margin: 30px 0;">
      <h4 style="margin: 0 0 15px 0; color: #1e293b; font-size: 16px;">Récapitulatif des heures :</h4>
      <div style="margin-bottom: 12px; display: flex; align-items: baseline;">
        <span style="color: #64748b; font-weight: 600; min-width: 120px; font-size: 14px;">Total d'heures :</span>
        <span style="color: #1e293b; font-size: 18px; font-weight: 700; margin-left: 10px;">${totalHours} h</span>
      </div>
      ${overtimeHours > 0 ? `
        <div style="display: flex; align-items: baseline;">
          <span style="color: #64748b; font-weight: 600; min-width: 120px; font-size: 14px;">Heures supp. :</span>
          <span style="color: #ea580c; font-size: 15px; font-weight: 600; margin-left: 10px;">+${overtimeHours} h</span>
        </div>
      ` : ''}
    </div>
    
    <p style="font-size: 15px; color: #475569;">Veuillez examiner ces éléments et valider la feuille de temps pour permettre le règlement de la prestation.</p>
  `;

  const actionUrl = `${process.env.FRONTEND_URL}/client/timesheet/${timesheetId}`;

  try {
    await sendNotificationEmail(clientEmail, title, message, actionUrl);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email soumission timesheet:', error);
    return false;
  }
}

/**
 * Envoyer un email à l'automob quand sa feuille est approuvée
 */
async function sendTimesheetApprovedEmail(automobEmail, data) {
  const { missionName, totalHours, timesheetId } = data;

  const title = '✅ Feuille de temps approuvée';

  const message = `
    <p style="font-size: 16px;">Bonjour,</p>
    <p style="font-size: 16px;">Bonne nouvelle ! Le client a validé votre dernière feuille de temps pour la mission <strong>"${missionName}"</strong>.</p>
    
    <div style="background-color: #f0fdf4; border-radius: 12px; padding: 25px; border: 1px solid #dcfce7; margin: 30px 0;">
      <div style="text-align: center;">
        <span style="display: inline-block; background: #10b981; color: white; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 10px;">Validé</span>
        <h3 style="margin: 0; color: #166534; font-size: 24px;">${totalHours} h</h3>
        <p style="margin: 5px 0 0 0; color: #15803d; font-size: 14px;">Total d'heures enregistrées</p>
      </div>
    </div>
    
    <p style="font-size: 15px; color: #475569;">Le paiement correspondant a été déclenché et sera prochainement visible sur votre portefeuille.</p>
  `;

  const actionUrl = `${process.env.FRONTEND_URL}/automob/mission/${timesheetId}/timesheets`;

  try {
    await sendNotificationEmail(automobEmail, title, message, actionUrl);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email approbation timesheet:', error);
    return false;
  }
}

/**
 * Envoyer un email à l'automob quand sa feuille est refusée
 */
async function sendTimesheetRejectedEmail(automobEmail, data) {
  const { missionName, totalHours, rejectionReason, timesheetId } = data;

  const title = '❌ Mise à jour requise sur votre feuille de temps';

  const message = `
    <p style="font-size: 16px;">Bonjour,</p>
    <p style="font-size: 16px;">Votre feuille de temps pour la mission <strong>"${missionName}"</strong> (${totalHours}h) n'a pas été validée par le client.</p>
    
    <div style="background-color: #fef2f2; border-radius: 12px; padding: 25px; border: 1px solid #fee2e2; margin: 30px 0;">
      <h4 style="margin: 0 0 10px 0; color: #991b1b; font-size: 16px;">Motif du refus :</h4>
      <p style="margin: 0; color: #dc2626; font-size: 15px; line-height: 1.6; font-style: italic;">"${rejectionReason}"</p>
    </div>
    
    <p style="font-size: 15px; color: #475569;">Nous vous invitons à apporter les corrections nécessaires et à soumettre à nouveau vos heures pour validation.</p>
  `;

  const actionUrl = `${process.env.FRONTEND_URL}/automob/timesheet/${timesheetId}`;

  try {
    await sendNotificationEmail(automobEmail, title, message, actionUrl);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email rejet timesheet:', error);
    return false;
  }
}

/**
 * Envoyer un email à l'automob pour confirmer l'envoi
 */
async function sendTimesheetSubmissionConfirmationEmail(automobEmail, data) {
  const { missionName, totalHours, overtimeHours } = data;

  const title = '📤 Feuille de temps envoyée avec succès';

  const message = `
    <p style="font-size: 16px;">Bonjour,</p>
    <p style="font-size: 16px;">Votre feuille de temps pour la mission <strong>"${missionName}"</strong> a bien été transmise au client.</p>
    
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; border: 1px solid #e2e8f0; margin: 30px 0;">
      <div style="margin-bottom: 12px; display: flex; align-items: baseline;">
        <span style="color: #64748b; font-weight: 600; min-width: 120px; font-size: 14px;">Heures normales :</span>
        <span style="color: #1e293b; font-size: 16px; font-weight: 600; margin-left: 10px;">${totalHours} h</span>
      </div>
      ${overtimeHours > 0 ? `
        <div style="display: flex; align-items: baseline;">
          <span style="color: #64748b; font-weight: 600; min-width: 120px; font-size: 14px;">Heures supp. :</span>
          <span style="color: #ea580c; font-size: 15px; font-weight: 600; margin-left: 10px;">+${overtimeHours} h</span>
        </div>
      ` : ''}
    </div>
    
    <p style="font-size: 15px; color: #475569;">Vous recevrez une notification par email dès que le client aura examiné votre demande.</p>
  `;

  const actionUrl = `${process.env.FRONTEND_URL}/automob/dashboard`;

  try {
    await sendNotificationEmail(automobEmail, title, message, actionUrl);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email confirmation timesheet:', error);
    return false;
  }
}

/**
 * Envoyer un email à l'automob avec le montant gagné
 */
async function sendTimesheetApprovedWithAmountEmail(automobEmail, data) {
  const { missionName, totalHours, amount, timesheetId } = data;

  const title = '💰 Gagnez crédités sur votre compte';

  const message = `
    <p style="font-size: 18px; color: #1e293b;">Bravo !</p>
    <p style="font-size: 16px;">Le client a validé votre feuille de temps pour la mission <strong>"${missionName}"</strong> (${totalHours}h).</p>
    
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; padding: 30px; color: white; margin: 30px 0; text-align: center; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);">
      <div style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9; margin-bottom: 5px;">Montant crédité</div>
      <h3 style="margin: 0; font-size: 32px; font-weight: 800;">${amount.toFixed(2)}€</h3>
      <p style="margin: 10px 0 0 0; font-size: 13px; opacity: 0.8;">Ajouté instantanément à votre portefeuille virtuel</p>
    </div>
    
    <p style="font-size: 15px; color: #475569;">Vous pouvez consulter votre solde et demander un virement vers votre compte bancaire à tout moment depuis votre espace.</p>
  `;

  const actionUrl = `${process.env.FRONTEND_URL}/automob/wallet`;

  try {
    await sendNotificationEmail(automobEmail, title, message, actionUrl);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email montant timesheet:', error);
    return false;
  }
}

export {
  sendTimesheetSubmittedEmail,
  sendTimesheetApprovedEmail,
  sendTimesheetRejectedEmail,
  sendTimesheetSubmissionConfirmationEmail,
  sendTimesheetApprovedWithAmountEmail
};


