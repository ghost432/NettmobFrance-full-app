import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

// Configuration du transporteur SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_PORT == '465', // true pour 465, false pour autres ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2'
  },
  requireTLS: true,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  pool: true, // Utiliser un pool de connexions pour une meilleure stabilité
  maxConnections: 5,
  dkim: (process.env.DKIM_PRIVATE_KEY || process.env.DKIM_PRIVATE_KEY_PATH) ? {
    domainName: process.env.DKIM_DOMAIN || 'nettmobfrance.fr',
    keySelector: process.env.DKIM_SELECTOR || 'default',
    privateKey: process.env.DKIM_PRIVATE_KEY ||
      (process.env.DKIM_PRIVATE_KEY_PATH ? fs.readFileSync(process.env.DKIM_PRIVATE_KEY_PATH, 'utf8') : ''),
    headerFieldNames: 'from:to:subject:date',
    skipFields: 'message-id:received:content-type',
    cacheDir: './.dkim-cache' // Cache des signatures DKIM
  } : undefined
});

// Vérifier la configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Erreur configuration email:', error.message);
    console.log('ℹ️  Vérifiez vos credentials SMTP dans le fichier .env');
    console.log('ℹ️  Pour IONOS, assurez-vous que l\'accès SMTP est activé dans votre compte');
  } else {
    console.log('✅ Serveur email prêt et opérationnel');
  }
});

/**
 * Génère un code OTP à 6 chiffres
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Envoie un email avec le code OTP
 */
export const sendOTPEmail = async (email, otp, type = 'verification') => {
  const subjects = {
    verification: 'Vérification de votre compte NettmobFrance',
    login: 'Code de connexion NettmobFrance'
  };

  const logo = `
    <div style="text-align: center; margin: 20px 0;">
      <img src="cid:favicon" width="50" height="50" alt="NettmobFrance" style="border-radius: 12px; margin-bottom: 12px; background: white; padding: 5px; border: 1px solid #e2e8f0;">
      <div style="font-size: 24px; font-weight: 800; color: #2563eb; letter-spacing: -0.02em;">
        Nettmob<span style="color: #1d4ed8;">France</span>
      </div>
      <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%); margin: 15px auto; border-radius: 2px;"></div>
    </div>
  `;

  const footer = `
    <div style="text-align: center; padding: 30px 20px; color: #94a3b8; font-size: 12px; border-top: 1px solid #f1f5f9; margin-top: 40px;">
      <p style="margin: 5px 0;">Cordialement,</p>
      <p style="margin: 5px 0; font-weight: 700; color: #2563eb;">L'équipe NettmobFrance</p>
      <div style="margin-top: 20px;">
        <p style="margin: 5px 0;">© ${new Date().getFullYear()} NettmobFrance. Tous droits réservés.</p>
        <p style="margin: 5px 0; font-size: 11px;">Ceci est un message automatique, merci de ne pas y répondre.</p>
      </div>
    </div>
  `;

  const messages = {
    verification: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #f1f5f9;">
          ${logo}
          <h2 style="color: #1e293b; text-align: center; margin-top: 30px; font-size: 22px;">Vérification de votre compte</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.6; text-align: center;">
            Bienvenue sur NettmobFrance ! Pour activer votre compte, veuillez utiliser le code de vérification ci-dessous :
          </p>
          <div style="background-color: #f1f5f9; padding: 30px; border-radius: 12px; text-align: center; margin: 35px auto; border: 2px dashed #cbd5e1; max-width: 380px;">
            <div style="font-size: 36px; font-weight: 800; color: #2563eb; letter-spacing: 12px; margin-left: 12px;">${otp}</div>
          </div>
          <p style="color: #64748b; font-size: 14px; text-align: center;">
            Ce code est valable pendant <strong style="color: #2563eb;">10 minutes</strong>.
          </p>
          ${footer}
        </div>
      </div>
    `,
    login: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #f1f5f9;">
          ${logo}
          <h2 style="color: #1e293b; text-align: center; margin-top: 30px; font-size: 22px;">Code de connexion</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.6; text-align: center;">
            Vous avez demandé à vous connecter à votre compte. Utilisez le code ci-dessous pour continuer :
          </p>
          <div style="background-color: #f1f5f9; padding: 30px; border-radius: 12px; text-align: center; margin: 35px auto; border: 2px dashed #cbd5e1; max-width: 380px;">
            <div style="font-size: 36px; font-weight: 800; color: #2563eb; letter-spacing: 12px; margin-left: 12px;">${otp}</div>
          </div>
          <p style="color: #64748b; font-size: 14px; text-align: center;">
            Ce code est valable pendant <strong style="color: #2563eb;">10 minutes</strong>.
          </p>
          ${footer}
        </div>
      </div>
    `
  };

  const messageId = `<${Date.now()}.${Math.random().toString(36).substring(2)}.${type}@nettmobfrance.fr>`;

  const mailOptions = {
    from: `"NettmobFrance" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subjects[type] || subjects.verification,
    html: messages[type] || messages.verification,
    messageId: messageId,
    attachments: [
      {
        filename: 'favicon.png',
        path: 'https://www.nettmobfrance.fr/favicon-1.png',
        cid: 'favicon'
      }
    ],
    headers: {
      'Message-ID': messageId,
      'X-Entity-Ref-ID': `OTP-${Date.now()}`,
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      'Importance': 'high',
      'X-Mailer': 'NettmobFrance Platform v1.0',
      'X-Auto-Response-Suppress': 'OOF, AutoReply',
      'Reply-To': process.env.EMAIL_USER,
      'Return-Path': process.env.EMAIL_USER,
      'List-Unsubscribe': `<mailto:${process.env.EMAIL_USER}?subject=unsubscribe>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      'Feedback-ID': `${type}:nettmobfrance:otp`,
      'X-SES-CONFIGURATION-SET': 'nettmobfrance-transactional',
      'Precedence': 'bulk',
      'X-Report-Abuse': `Signaler un abus: abuse@nettmobfrance.fr`
    }
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email OTP envoyé à ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    throw error;
  }
};

/**
 * Envoie un email de notification de statut de vérification d'identité
 */
export const sendVerificationStatusEmail = async (email, status, reason = null) => {
  const logo = `
    <div style="text-align: center; margin: 20px 0;">
      <img src="cid:favicon" width="50" height="50" alt="NettmobFrance" style="border-radius: 12px; margin-bottom: 12px; background: white; padding: 5px; border: 1px solid #e2e8f0;">
      <div style="font-size: 24px; font-weight: 800; color: #2563eb; letter-spacing: -0.02em;">
        Nettmob<span style="color: #1d4ed8;">France</span>
      </div>
      <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%); margin: 15px auto; border-radius: 2px;"></div>
    </div>
  `;

  const footer = `
    <div style="text-align: center; padding: 30px 20px; color: #94a3b8; font-size: 12px; border-top: 1px solid #f1f5f9; margin-top: 40px;">
      <p style="margin: 5px 0;">Cordialement,</p>
      <p style="margin: 5px 0; font-weight: 700; color: #2563eb;">L'équipe NettmobFrance</p>
      <p style="margin: 20px 0 5px 0; font-size: 11px;">
        © ${new Date().getFullYear()} NettmobFrance. Tous droits réservés.
      </p>
    </div>
  `;

  let subject, message;

  if (status === 'approved') {
    subject = '✅ Vérification d\'identité approuvée - NettmobFrance';
    message = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #f1f5f9;">
          ${logo}
          <div style="text-align: center; padding: 30px 20px; background-color: #10b981; border-radius: 12px; margin: 30px 0;">
            <h2 style="color: white; margin: 0; font-size: 24px;">✅ Identité Vérifiée !</h2>
          </div>
          <p style="color: #475569; font-size: 16px; line-height: 1.6; text-align: center;">
            Félicitations ! Votre identité a été vérifiée avec succès.
          </p>
          <p style="color: #475569; font-size: 16px; line-height: 1.6; text-align: center;">
            Vous pouvez maintenant profiter de toutes les fonctionnalités de la plateforme NettmobFrance.
          </p>
          <div style="text-align: center; margin: 40px 0;">
            <a href="${process.env.FRONTEND_URL}" style="display: inline-block; padding: 16px 36px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(37,99,235,0.2);">
              Accéder à mon compte
            </a>
          </div>
          ${footer}
        </div>
      </div>
    `;
  } else if (status === 'rejected') {
    subject = '❌ Vérification d\'identité refusée - NettmobFrance';
    message = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #f1f5f9;">
          ${logo}
          <div style="text-align: center; padding: 30px 20px; background-color: #ef4444; border-radius: 12px; margin: 30px 0;">
            <h2 style="color: white; margin: 0; font-size: 24px;">❌ Vérification Refusée</h2>
          </div>
          <p style="color: #475569; font-size: 16px; line-height: 1.6; text-align: center;">
            Malheureusement, votre demande de vérification d'identité n'a pas pu être validée.
          </p>
          <div style="background-color: #fff1f2; padding: 25px; border-left: 5px solid #ef4444; margin: 25px 0; border-radius: 8px;">
            <p style="margin: 0; color: #991b1b; font-size: 14px;"><strong>Raison du rejet :</strong></p>
            <p style="margin: 10px 0 0 0; color: #b91c1c; font-size: 15px; font-style: italic;">"${reason || 'Non spécifiée'}"</p>
          </div>
          <p style="color: #475569; font-size: 16px; line-height: 1.6; text-align: center;">
            Vous pouvez soumettre une nouvelle demande avec un document valide.
          </p>
          <div style="text-align: center; margin: 40px 0;">
            <a href="${process.env.FRONTEND_URL}" style="display: inline-block; padding: 16px 36px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px;">
              Soumettre une nouvelle demande
            </a>
          </div>
          ${footer}
        </div>
      </div>
    `;
  }

  const messageId = `<${Date.now()}.${Math.random().toString(36).substring(2)}.verif@nettmobfrance.fr>`;

  const mailOptions = {
    from: `"NettmobFrance" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html: message,
    messageId: messageId,
    attachments: [
      {
        filename: 'favicon.png',
        path: 'https://www.nettmobfrance.fr/favicon-1.png',
        cid: 'favicon'
      }
    ],
    headers: {
      'Message-ID': messageId,
      'X-Entity-Ref-ID': `VERIF-${status}-${Date.now()}`,
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      'Importance': 'high',
      'X-Mailer': 'NettmobFrance Platform v1.0',
      'X-Auto-Response-Suppress': 'OOF, AutoReply',
      'Reply-To': process.env.EMAIL_USER,
      'Return-Path': process.env.EMAIL_USER,
      'List-Unsubscribe': `<mailto:${process.env.EMAIL_USER}?subject=unsubscribe>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      'Feedback-ID': `verification_status:nettmobfrance:${status}`,
      'X-SES-CONFIGURATION-SET': 'nettmobfrance-transactional',
      'Precedence': 'bulk',
      'X-Report-Abuse': `Signaler un abus: abuse@nettmobfrance.fr`
    }
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de vérification (${status}) envoyé à ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email vérification:', error);
    throw error;
  }
};

/**
 * Envoie un email générique (utilisé par d'autres services)
 */
export const sendEmail = async (to, subject, html) => {
  const messageId = `<${Date.now()}.${Math.random().toString(36).substring(2)}.generic@nettmobfrance.fr>`;

  const mailOptions = {
    from: `"NettmobFrance" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    messageId: messageId,
    attachments: [
      {
        filename: 'favicon.png',
        path: 'https://www.nettmobfrance.fr/favicon-1.png',
        cid: 'favicon'
      }
    ],
    headers: {
      'Message-ID': messageId,
      'X-Entity-Ref-ID': `EMAIL-${Date.now()}`,
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      'Importance': 'high',
      'X-Mailer': 'NettmobFrance Platform v1.0',
      'X-Auto-Response-Suppress': 'OOF, AutoReply',
      'Reply-To': process.env.EMAIL_USER,
      'Return-Path': process.env.EMAIL_USER,
      'List-Unsubscribe': `<mailto:${process.env.EMAIL_USER}?subject=unsubscribe>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      'Feedback-ID': `notification:nettmobfrance:generic`,
      'X-SES-CONFIGURATION-SET': 'nettmobfrance-transactional',
      'Precedence': 'bulk',
      'X-Report-Abuse': `Signaler un abus: abuse@nettmobfrance.fr`
    }
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email envoyé à ${to}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    throw error;
  }
};

/**
 * Envoie un email de notification générique
 */
export const sendNotificationEmail = async (email, title, message, actionUrl = null) => {
  const isHtml = (str) => /<[a-z][\s\S]*>/i.test(str);

  const formattedMessage = isHtml(message)
    ? message
    : message.split('\n').filter(line => line.trim() !== '').map(line => `<p style="margin-bottom: 12px;">${line}</p>`).join('');

  const htmlMessage = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #334155;">
      <div style="max-width: 600px; margin: 40px auto; padding: 0 20px;">
        <div style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);">
          <!-- Header/Logo -->
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px 20px; text-align: center;">
            <img src="cid:favicon" width="50" height="50" alt="NettmobFrance" style="border-radius: 12px; margin-bottom: 12px; background: white; padding: 5px;">
            <div style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
              Nettmob<span style="color: #60a5fa;">France</span>
            </div>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #1e293b; font-size: 24px; font-weight: 700; margin: 0 0 25px 0; text-align: center; line-height: 1.3;">
              ${title}
            </h2>
            
            <div style="color: #475569; font-size: 16px; line-height: 1.7; margin-bottom: 30px;">
              ${formattedMessage}
            </div>

            ${actionUrl ? `
              <div style="text-align: center; margin: 40px 0;">
                <a href="${actionUrl}" style="display: inline-block; padding: 16px 36px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; transition: background-color 0.2s; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 2px 4px -1px rgba(37, 99, 235, 0.1);">
                  Ouvrir dans la plateforme
                </a>
              </div>
            ` : ''}

            <!-- Divider -->
            <div style="height: 1px; background-color: #e2e8f0; margin: 40px 0 25px 0;"></div>

            <!-- Footer -->
            <div style="text-align: center;">
              <p style="margin: 0; color: #64748b; font-size: 14px; font-weight: 500;">L'équipe NettmobFrance</p>
              <div style="margin-top: 20px;">
                <p style="margin: 5px 0; color: #94a3b8; font-size: 12px;">
                  © ${new Date().getFullYear()} NettmobFrance. Tous droits réservés.
                </p>
                <p style="margin: 5px 0; color: #94a3b8; font-size: 11px;">
                  Ceci est un message automatique, merci de ne pas y répondre directement.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Bottom Links -->
        <div style="text-align: center; margin-top: 25px; padding-bottom: 20px;">
          <a href="${process.env.FRONTEND_URL}/support" style="color: #64748b; font-size: 13px; text-decoration: underline; margin: 0 10px;">Aide & Support</a>
          <span style="color: #cbd5e1;">•</span>
          <a href="${process.env.FRONTEND_URL}/legal" style="color: #64748b; font-size: 13px; text-decoration: underline; margin: 0 10px;">Mentions Légales</a>
        </div>
      </div>
    </body>
    </html>
  `;

  const messageId = `<${Date.now()}.${Math.random().toString(36).substring(2)}.notif@nettmobfrance.fr>`;

  const mailOptions = {
    from: `"NettmobFrance" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `${title} - NettmobFrance`,
    html: htmlMessage,
    messageId: messageId,
    attachments: [
      {
        filename: 'favicon.png',
        path: 'https://www.nettmobfrance.fr/favicon-1.png',
        cid: 'favicon'
      }
    ],
    headers: {
      'Message-ID': messageId,
      'X-Entity-Ref-ID': `NOTIF-${Date.now()}`,
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      'Importance': 'high',
      'X-Mailer': 'NettmobFrance Platform v1.0',
      'X-Auto-Response-Suppress': 'OOF, AutoReply',
      'Reply-To': process.env.EMAIL_USER,
      'Return-Path': process.env.EMAIL_USER,
      'List-Unsubscribe': `<mailto:${process.env.EMAIL_USER}?subject=unsubscribe>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      'Feedback-ID': `notification:nettmobfrance:alert`,
      'X-SES-CONFIGURATION-SET': 'nettmobfrance-transactional',
      'Precedence': 'bulk',
      'X-Report-Abuse': `Signaler un abus: abuse@nettmobfrance.fr`
    }
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de notification envoyé à ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email notification:', error);
    throw error;
  }
};

/**
 * Envoie un email de rappel 24h avant le début d'une mission
 */
export const sendMissionReminderEmail = async (email, automobName, missionDetails) => {
  const { mission_name, title, start_date, address, city, client_name, hourly_rate } = missionDetails;

  const logo = `
    <div style="text-align: center; margin: 20px 0;">
      <img src="cid:favicon" width="50" height="50" alt="NettmobFrance" style="border-radius: 12px; margin-bottom: 12px; background: white; padding: 5px; border: 1px solid #e2e8f0;">
      <div style="font-size: 24px; font-weight: 800; color: #2563eb; letter-spacing: -0.02em;">
        Nettmob<span style="color: #1d4ed8;">France</span>
      </div>
      <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%); margin: 15px auto; border-radius: 2px;"></div>
    </div>
  `;

  const footer = `
    <div style="text-align: center; padding: 30px 20px; color: #94a3b8; font-size: 12px; border-top: 1px solid #f1f5f9; margin-top: 40px;">
      <p style="margin: 5px 0;">Cordialement,</p>
      <p style="margin: 5px 0; font-weight: 700; color: #2563eb;">L'équipe NettmobFrance</p>
      <p style="margin: 20px 0 5px 0; font-size: 11px;">
        © ${new Date().getFullYear()} NettmobFrance. Tous droits réservés.
      </p>
    </div>
  `;

  const formattedDate = new Date(start_date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
      <div style="background-color: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #f1f5f9;">
        ${logo}
        <div style="text-align: center; padding: 25px 20px; background-color: #3A559F; border-radius: 12px; margin: 30px 0;">
          <h2 style="color: white; margin: 0; font-size: 22px;">⏰ Rappel : Mission imminente !</h2>
        </div>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          Bonjour <strong>${automobName}</strong>,
        </p>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          Ceci est un petit rappel pour votre mission qui commence <strong>très bientôt</strong>.
        </p>
        
        <div style="background-color: #f1f5f9; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 5px solid #3A559F;">
          <h3 style="margin: 0 0 15px 0; color: #3A559F; font-size: 18px;">📋 Détails de la mission</h3>
          <p style="margin: 8px 0; color: #1e293b; font-size: 15px;"><strong>Mission :</strong> ${mission_name || title}</p>
          <p style="margin: 8px 0; color: #1e293b; font-size: 15px;"><strong>📅 Date :</strong> ${formattedDate}</p>
          <p style="margin: 8px 0; color: #1e293b; font-size: 15px;"><strong>📍 Lieu :</strong> ${address}, ${city}</p>
          <p style="margin: 8px 0; color: #1e293b; font-size: 15px;"><strong>👤 Client :</strong> ${client_name}</p>
          <p style="margin: 8px 0; color: #1e293b; font-size: 15px;"><strong>💰 Taux horaire :</strong> ${hourly_rate}€/h</p>
        </div>
        
        <div style="background-color: #fffbdf; padding: 15px; border-radius: 10px; margin: 20px 0; border: 1px solid #fde68a;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>⚠️ Important :</strong> Présentez-vous en mentionnant que vous venez de la part de <strong>NettmobFrance</strong>.
          </p>
        </div>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${process.env.FRONTEND_URL}/automob/missions" 
             style="background-color: #3A559F; color: white; padding: 16px 36px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: bold; font-size: 16px;">
            Voir ma mission
          </a>
        </div>
        
        ${footer}
      </div>
    </div>
  `;

  const messageId = `<${Date.now()}.${Math.random().toString(36).substring(2)}.mission@nettmobfrance.fr>`;

  const mailOptions = {
    from: `"NettmobFrance" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '⏰ Rappel : Votre mission commence bientôt - NettmobFrance',
    html,
    messageId: messageId,
    attachments: [
      {
        filename: 'favicon.png',
        path: 'https://www.nettmobfrance.fr/favicon-1.png',
        cid: 'favicon'
      }
    ],
    headers: {
      'Message-ID': messageId,
      'X-Entity-Ref-ID': `MISSION-REMINDER-${Date.now()}`,
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      'Importance': 'high',
      'X-Mailer': 'NettmobFrance Platform v1.0',
      'X-Auto-Response-Suppress': 'OOF, AutoReply',
      'Reply-To': process.env.EMAIL_USER,
      'Return-Path': process.env.EMAIL_USER,
      'List-Unsubscribe': `<mailto:${process.env.EMAIL_USER}?subject=unsubscribe>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      'Feedback-ID': `mission_reminder:nettmobfrance:alert`,
      'X-SES-CONFIGURATION-SET': 'nettmobfrance-transactional',
      'Precedence': 'bulk',
      'X-Report-Abuse': `Signaler un abus: abuse@nettmobfrance.fr`
    }
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de rappel mission envoyé à ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email rappel mission:', error);
    throw error;
  }
};

/**
 * Envoie un email de rappel quotidien pour pointer les heures
 */
export const sendTimesheetReminderEmail = async (email, automobName, missionDetails) => {
  const { mission_name, title, end_date, client_name } = missionDetails;

  const logo = `
    <div style="text-align: center; margin: 20px 0;">
      <img src="cid:favicon" width="50" height="50" alt="NettmobFrance" style="border-radius: 12px; margin-bottom: 12px; background: white; padding: 5px; border: 1px solid #e2e8f0;">
      <div style="font-size: 24px; font-weight: 800; color: #2563eb; letter-spacing: -0.02em;">
        Nettmob<span style="color: #1d4ed8;">France</span>
      </div>
      <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%); margin: 15px auto; border-radius: 2px;"></div>
    </div>
  `;

  const footer = `
    <div style="text-align: center; padding: 30px 20px; color: #94a3b8; font-size: 12px; border-top: 1px solid #f1f5f9; margin-top: 40px;">
      <p style="margin: 5px 0;">Cordialement,</p>
      <p style="margin: 5px 0; font-weight: 700; color: #2563eb;">L'équipe NettmobFrance</p>
      <p style="margin: 20px 0 5px 0; font-size: 11px;">
        © ${new Date().getFullYear()} NettmobFrance. Tous droits réservés.
      </p>
    </div>
  `;

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
      <div style="background-color: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #f1f5f9;">
        ${logo}
        <div style="text-align: center; padding: 25px 20px; background-color: #10b981; border-radius: 12px; margin: 30px 0;">
          <h2 style="color: white; margin: 0; font-size: 22px;">⏱️ N'oubliez pas vos heures !</h2>
        </div>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          Bonjour <strong>${automobName}</strong>,
        </p>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          Un petit rappel pour <strong>pointer vos heures de travail</strong> pour votre mission en cours.
        </p>
        
        <div style="background-color: #f1f5f9; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 5px solid #10b981;">
          <h3 style="margin: 0 0 15px 0; color: #10b981; font-size: 18px;">📋 Mission en cours</h3>
          <p style="margin: 8px 0; color: #1e293b; font-size: 15px;"><strong>Mission :</strong> ${mission_name || title}</p>
          <p style="margin: 8px 0; color: #1e293b; font-size: 15px;"><strong>👤 Client :</strong> ${client_name}</p>
          <p style="margin: 8px 0; color: #1e293b; font-size: 15px;"><strong>📅 Fin prévue :</strong> ${new Date(end_date).toLocaleDateString('fr-FR')}</p>
        </div>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${process.env.FRONTEND_URL}/automob/missions" 
             style="background-color: #10b981; color: white; padding: 16px 36px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: bold; font-size: 16px;">
            Pointer mes heures
          </a>
        </div>
        
        ${footer}
      </div>
    </div>
  `;

  const messageId = `<${Date.now()}.${Math.random().toString(36).substring(2)}.timesheet@nettmobfrance.fr>`;

  const mailOptions = {
    from: `"NettmobFrance" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '⏱️ Rappel : Pointez vos heures de travail - NettmobFrance',
    html,
    messageId: messageId,
    attachments: [
      {
        filename: 'favicon.png',
        path: 'https://www.nettmobfrance.fr/favicon-1.png',
        cid: 'favicon'
      }
    ],
    headers: {
      'Message-ID': messageId,
      'X-Entity-Ref-ID': `TIMESHEET-REMINDER-${Date.now()}`,
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      'Importance': 'high',
      'X-Mailer': 'NettmobFrance Platform v1.0',
      'X-Auto-Response-Suppress': 'OOF, AutoReply',
      'Reply-To': process.env.EMAIL_USER,
      'Return-Path': process.env.EMAIL_USER,
      'List-Unsubscribe': `<mailto:${process.env.EMAIL_USER}?subject=unsubscribe>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      'Feedback-ID': `timesheet_reminder:nettmobfrance:reminder`,
      'X-SES-CONFIGURATION-SET': 'nettmobfrance-transactional',
      'Precedence': 'bulk',
      'X-Report-Abuse': `Signaler un abus: abuse@nettmobfrance.fr`
    }
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de rappel pointage envoyé à ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email rappel pointage:', error);
    throw error;
  }
};

export default {
  generateOTP,
  sendOTPEmail,
  sendVerificationStatusEmail,
  sendNotificationEmail,
  sendMissionReminderEmail,
  sendTimesheetReminderEmail
};
