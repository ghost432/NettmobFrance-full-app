import { sendNotificationEmail } from './emailService.js';

/**
 * Helper pour générer un message stylisé pour les emails de mission
 * Design Premium avec typographie raffinée et espacement optimal
 */
const generateMissionEmailMessage = (title, details, additionalText = '') => {
  return `
    <div style="margin-bottom: 30px;">
      <h3 style="color: #0f172a; margin-bottom: 18px; font-size: 18px; font-weight: 700; border-left: 4px solid #2563eb; padding-left: 12px; line-height: 1.2;">
        ${title}
      </h3>
      <div style="background-color: #f8fafc; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">
        ${details.map((detail, index) => `
          <div style="margin-bottom: ${index === details.length - 1 ? '0' : '14px'}; display: flex; align-items: baseline;">
            <span style="color: #64748b; font-weight: 600; min-width: 110px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.025em;">${detail.label}</span>
            <span style="color: #1e293b; font-size: 15px; font-weight: 600; margin-left: 15px; line-height: 1.4;">${detail.value}</span>
          </div>
        `).join('')}
      </div>
    </div>
    ${additionalText ? `
      <div style="background-color: #f1f5f9; border-radius: 12px; padding: 18px; color: #475569; font-size: 14px; line-height: 1.6; font-style: italic; border-left: 4px solid #cbd5e1;">
        ${additionalText}
      </div>
    ` : ''}
  `;
};

/**
 * Envoie un email aux automobs quand une nouvelle mission est publiée
 */
export const sendNewMissionEmail = async (email, automobName, missionData) => {
  const { id, mission_name, hourly_rate, city, secteur_id, description, start_date } = missionData;

  const title = '🎯 Nouvelle mission disponible';
  const details = [
    { label: 'Mission', value: mission_name },
    { label: 'Tarif', value: `${hourly_rate}€ / heure` },
    { label: 'Lieu', value: city },
    { label: 'Début', value: new Date(start_date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }
  ];

  const message = `
    <p style="font-size: 16px;">Bonjour <strong>${automobName}</strong>,</p>
    <p style="font-size: 16px;">Une nouvelle opportunité vient d'être publiée sur NettmobFrance et correspond à votre expertise.</p>
    ${generateMissionEmailMessage('Détails de l\'offre', details)}
    <div style="margin-top: 20px; padding: 15px; background-color: #eff6ff; border-left: 4px solid #2563eb; border-radius: 4px;">
      <p style="margin: 0; color: #1e40af; font-size: 14px; font-style: italic;">"${description.length > 150 ? description.substring(0, 150) + '...' : description}"</p>
    </div>
    <p style="margin-top: 25px; font-size: 15px; color: #475569;">Ne manquez pas cette mission ! Consultez tous les détails et postulez dès maintenant.</p>
  `;

  const actionUrl = `${process.env.FRONTEND_URL}/automob/missions/${id}`;

  try {
    await sendNotificationEmail(email, title, message, actionUrl);
    return true;
  } catch (error) {
    console.error('Erreur envoi email nouvelle mission:', error);
    return false;
  }
};

/**
 * Envoie un email à l'automob après qu'il ait postulé
 */
export const sendApplicationConfirmationEmail = async (email, automobName, missionName, missionId) => {
  const title = '✅ Candidature confirmée';

  const message = `
    <div style="font-size: 16px; color: #1e293b; margin-bottom: 25px;">
      Bonjour <strong>${automobName}</strong>,
    </div>
    <div style="font-size: 16px; color: #334155; line-height: 1.6; margin-bottom: 30px;">
      Bonne nouvelle ! Votre candidature pour la mission <span style="color: #2563eb; font-weight: 700;">"${missionName}"</span> a bien été transmise au client.
    </div>
    
    <div style="background-color: #f0fdf4; border-radius: 16px; padding: 24px; border: 1px solid #dcfce7; margin: 30px 0; display: flex; align-items: flex-start;">
      <div style="margin-right: 15px; font-size: 24px;">ℹ️</div>
      <div style="color: #166534; font-size: 15px; line-height: 1.6; font-weight: 500;">
        Le client va maintenant étudier votre profil avec attention. Vous recevrez une notification immédiate dès qu'une décision sera prise.
      </div>
    </div>
    
    <p style="font-size: 15px; color: #64748b; font-style: italic;">
      Conseil : Gardez un œil sur votre tableau de bord pour suivre l'évolution de vos missions en temps réel.
    </p>
  `;

  const actionUrl = `${process.env.FRONTEND_URL}/automob/my-applications`;

  try {
    await sendNotificationEmail(email, title, message, actionUrl);
    return true;
  } catch (error) {
    console.error('Erreur envoi email confirmation candidature:', error);
    return false;
  }
};

/**
 * Envoie un email au client quand il reçoit une nouvelle candidature
 */
export const sendNewApplicationEmail = async (email, clientName, automobName, missionName, missionId, applicationId) => {
  const title = '🔔 Nouvelle candidature reçue';

  const message = `
    <div style="font-size: 16px; color: #1e293b; margin-bottom: 25px;">
      Bonjour <strong>${clientName}</strong>,
    </div>
    <div style="font-size: 16px; color: #334155; line-height: 1.6; margin-bottom: 30px;">
      Un nouvel Automob est intéressé par votre mission <span style="color: #2563eb; font-weight: 700;">"${missionName}"</span>.
    </div>
    
    <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 16px; padding: 30px; border: 1px solid #e2e8f0; margin: 30px 0; text-align: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
      <div style="width: 60px; height: 60px; background-color: #2563eb; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px auto; font-size: 24px; font-weight: bold;">
        ${automobName.charAt(0).toUpperCase()}
      </div>
      <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700;">Candidat passionné</p>
      <p style="margin: 8px 0 0 0; color: #0f172a; font-size: 22px; font-weight: 800;">${automobName}</p>
    </div>
    
    <p style="font-size: 15px; color: #475569; text-align: center;">Ne faites pas attendre ce talent ! Consultez son profil complet et ses références dès maintenant.</p>
  `;

  const actionUrl = `${process.env.FRONTEND_URL}/client/applications`;

  try {
    await sendNotificationEmail(email, title, message, actionUrl);
    return true;
  } catch (error) {
    console.error('Erreur envoi email nouvelle candidature:', error);
    return false;
  }
};

/**
 * Envoie un email à l'automob quand sa candidature est acceptée
 */
export const sendApplicationAcceptedEmail = async (email, automobName, missionName, missionId) => {
  const title = '🎉 Félicitations ! Candidature acceptée';

  const message = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="font-size: 48px; margin-bottom: 10px;">🏆</div>
      <h2 style="color: #0f172a; font-size: 24px; font-weight: 800; margin: 0;">Excellent choix, ${automobName} !</h2>
    </div>

    <p style="font-size: 16px; color: #334155; line-height: 1.6; text-align: center;">
      Votre candidature pour la mission <span style="color: #2563eb; font-weight: 700;">"${missionName}"</span> a été <strong>validée avec enthousiasme</strong> par le client.
    </p>
    
    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 20px; padding: 30px; color: white; margin: 35px 0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);">
      <h4 style="margin: 0 0 20px 0; font-size: 18px; color: #60a5fa; text-transform: uppercase; letter-spacing: 0.05em;">📋 Feuille de route</h4>
      <div style="display: grid; gap: 15px;">
        <div style="display: flex; align-items: center;">
          <div style="width: 24px; height: 24px; background: #2563eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 12px; font-weight: bold;">1</div>
          <span style="font-size: 15px;">Vérifiez les derniers détails logistiques</span>
        </div>
        <div style="display: flex; align-items: center;">
          <div style="width: 24px; height: 24px; background: #2563eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 12px; font-weight: bold;">2</div>
          <span style="font-size: 15px;">Préparez votre matériel d'intervention</span>
        </div>
        <div style="display: flex; align-items: center;">
          <div style="width: 24px; height: 24px; background: #2563eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 12px; font-weight: bold;">3</div>
          <span style="font-size: 15px;">Pointez vos heures via l'application</span>
        </div>
      </div>
    </div>
    
    <p style="font-size: 15px; color: #64748b; text-align: center;">C'est le moment de briller ! Nous vous souhaitons une excellente mission.</p>
  `;

  const actionUrl = `${process.env.FRONTEND_URL}/automob/my-missions`;

  try {
    await sendNotificationEmail(email, title, message, actionUrl);
    return true;
  } catch (error) {
    console.error('Erreur envoi email candidature acceptée:', error);
    return false;
  }
};

/**
 * Envoie un email à l'automob quand sa candidature est refusée
 */
export const sendApplicationRejectedEmail = async (email, automobName, missionName) => {
  const title = '✉️ Mise à jour de votre candidature';

  const message = `
    <div style="font-size: 16px; color: #1e293b; margin-bottom: 25px;">
      Bonjour <strong>${automobName}</strong>,
    </div>
    <div style="font-size: 16px; color: #334155; line-height: 1.6; margin-bottom: 30px;">
      Nous tenions à vous informer que le client a pris une décision concernant la mission <span style="font-weight: 700;">"${missionName}"</span>.
    </div>
    
    <p style="font-size: 16px; color: #475569;">Bien que votre profil soit de qualité, il n'a pas été retenu pour cette mission précise.</p>
    
    <div style="background-color: #fffaf5; border-radius: 16px; padding: 25px; border: 1px solid #ffedd5; margin: 30px 0; border-left: 5px solid #f97316;">
      <h4 style="margin: 0 0 10px 0; color: #9a3412; font-size: 16px;">💡 Ne vous découragez pas !</h4>
      <p style="margin: 0; color: #c2410c; font-size: 15px; line-height: 1.6;">
        De nouvelles missions sont publiées <strong>chaque heure</strong> sur NettmobFrance. Votre profil reste visible par de nombreux autres clients à la recherche de vos compétences.
      </p>
    </div>
    
    <p style="font-size: 15px; color: #64748b; text-align: center;">Continuez à explorer les opportunités et postulez sans attendre !</p>
  `;

  const actionUrl = `${process.env.FRONTEND_URL}/automob/missions`;

  try {
    await sendNotificationEmail(email, title, message, actionUrl);
    return true;
  } catch (error) {
    console.error('Erreur envoi email candidature refusée:', error);
    return false;
  }
};

/**
 * Envoie un email au client quand la mission passe en cours
 */
export const sendMissionStartedEmail = async (email, clientName, missionName, automobName) => {
  const title = '🚀 Votre mission est lancée';

  const message = `
    <div style="font-size: 16px; color: #1e293b; margin-bottom: 25px;">
      Bonjour <strong>${clientName}</strong>,
    </div>
    <div style="font-size: 16px; color: #334155; line-height: 1.6; margin-bottom: 30px;">
      C'est officiel ! Votre mission <span style="color: #2563eb; font-weight: 700;">"${missionName}"</span> vient de passer en statut <strong>en cours</strong>.
    </div>
    
    <div style="background-color: #f8fafc; border-radius: 20px; padding: 30px; border: 1px solid #e2e8f0; margin: 30px 0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03);">
      <div style="display: flex; align-items: center; margin-bottom: 15px;">
        <div style="width: 8px; height: 8px; background-color: #10b981; border-radius: 50%; margin-right: 10px;"></div>
        <span style="color: #64748b; font-size: 13px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Expert en mission</span>
      </div>
      <p style="margin: 0; color: #0f172a; font-size: 20px; font-weight: 800;">${automobName}</p>
    </div>
    
    <div style="background-color: #eff6ff; border-radius: 12px; padding: 20px; border-left: 4px solid #2563eb; color: #1e40af; font-size: 15px; line-height: 1.6;">
      Vous pouvez désormais suivre l'avancement, valider les feuilles de temps et communiquer avec l'intervenant directement depuis votre espace client.
    </div>
  `;

  const actionUrl = `${process.env.FRONTEND_URL}/client/missions`;

  try {
    await sendNotificationEmail(email, title, message, actionUrl);
    return true;
  } catch (error) {
    console.error('Erreur envoi email mission en cours:', error);
    return false;
  }
};

export default {
  sendNewMissionEmail,
  sendApplicationConfirmationEmail,
  sendNewApplicationEmail,
  sendApplicationAcceptedEmail,
  sendApplicationRejectedEmail,
  sendMissionStartedEmail
};
