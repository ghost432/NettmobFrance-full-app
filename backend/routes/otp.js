import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';
import { generateOTP, sendOTPEmail, sendNotificationEmail } from '../services/emailService.js';
import { createNotification } from '../utils/notificationHelper.js';

const router = express.Router();

/**
 * Envoyer un OTP pour vérification d'email (après inscription)
 */
router.post('/send-verification-otp', async (req, res) => {
  const { email, userId } = req.body;

  if (!email || !userId) {
    return res.status(400).json({ error: 'Email et userId requis' });
  }

  try {
    // Vérifier que l'utilisateur existe
    const [users] = await db.query('SELECT id, email, verified FROM users WHERE id = ? AND email = ?', [userId, email]);
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    if (users[0].verified) {
      return res.status(400).json({ error: 'Email déjà vérifié' });
    }

    // Invalider les anciens OTP
    await db.query(
      'UPDATE otp_codes SET verified = TRUE WHERE user_id = ? AND type = ? AND verified = FALSE',
      [userId, 'verification']
    );

    // Générer un nouveau code OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Enregistrer l'OTP en base
    await db.query(
      'INSERT INTO otp_codes (user_id, email, otp_code, type, expires_at) VALUES (?, ?, ?, ?, ?)',
      [userId, email, otp, 'verification', expiresAt]
    );

    // Envoyer l'email
    await sendOTPEmail(email, otp, 'verification');

    res.json({ 
      message: 'Code de vérification envoyé par email',
      expiresIn: 600 // 10 minutes en secondes
    });
  } catch (error) {
    console.error('Erreur envoi OTP vérification:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du code' });
  }
});

/**
 * Vérifier l'OTP après inscription
 */
router.post('/verify-email-otp', async (req, res) => {
  const { email, userId, otp } = req.body;

  if (!email || !userId || !otp) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }

  try {
    // Récupérer l'OTP le plus récent
    const [otpRecords] = await db.query(
      `SELECT * FROM otp_codes 
       WHERE user_id = ? AND email = ? AND type = ? AND verified = FALSE 
       ORDER BY created_at DESC LIMIT 1`,
      [userId, email, 'verification']
    );

    if (otpRecords.length === 0) {
      return res.status(400).json({ error: 'Code invalide ou expiré' });
    }

    const otpRecord = otpRecords[0];

    // Vérifier l'expiration
    if (new Date() > new Date(otpRecord.expires_at)) {
      return res.status(400).json({ error: 'Code expiré' });
    }

    // Vérifier le nombre de tentatives (max 5)
    if (otpRecord.attempts >= 5) {
      return res.status(400).json({ error: 'Trop de tentatives. Demandez un nouveau code.' });
    }

    // Incrémenter les tentatives
    await db.query('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?', [otpRecord.id]);

    // Vérifier le code
    if (otpRecord.otp_code !== otp) {
      return res.status(400).json({ error: 'Code incorrect' });
    }

    // Marquer l'OTP comme vérifié
    await db.query('UPDATE otp_codes SET verified = TRUE WHERE id = ?', [otpRecord.id]);

    // Marquer l'utilisateur comme vérifié et mettre à jour last_login
    await db.query('UPDATE users SET verified = TRUE, last_login = NOW() WHERE id = ?', [userId]);

    // Créer une session
    await db.query('INSERT INTO user_sessions (user_id, login_at) VALUES (?, NOW())', [userId]);

    // Récupérer les informations utilisateur complètes
    const [users] = await db.query(
      'SELECT id, email, role, verified, last_login, total_session_duration, profile_picture, cover_picture FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const user = users[0];

    // Récupérer le profil selon le rôle
    let profile = null;
    if (user.role === 'automob') {
      const [profiles] = await db.query('SELECT * FROM automob_profiles WHERE user_id = ?', [userId]);
      profile = profiles[0] || null;
    } else if (user.role === 'client') {
      const [profiles] = await db.query('SELECT * FROM client_profiles WHERE user_id = ?', [userId]);
      profile = profiles[0] || null;
    }

    // Générer un token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Notification de bienvenue
    const userName = profile?.first_name || profile?.company_name || user.email.split('@')[0];
    await createNotification(
      userId,
      '🎉 Bienvenue sur NettmobFrance !',
      `Votre email a été vérifié avec succès. Vous pouvez maintenant profiter de toutes les fonctionnalités de la plateforme.`,
      'success',
      'account',
      user.role === 'automob' ? '/automob/dashboard' : '/client/dashboard'
    );

    // Email de bienvenue
    const roleColor = user.role === 'automob' ? '#3A559F' : '#A52450';
    const dashboardUrl = `${process.env.FRONTEND_URL}/${user.role}/dashboard`;
    
    // Construire les étapes selon le rôle
    const nextSteps = user.role === 'automob' 
      ? `<h3 style="color: ${roleColor}; margin-top: 30px;">Prochaines étapes :</h3>
         <ul style="line-height: 1.8; color: #333;">
           <li>📋 Complétez votre profil professionnel</li>
           <li>🎯 Parcourez les missions disponibles</li>
           <li>✅ Vérifiez votre identité pour postuler</li>
           <li>💰 Commencez à gagner de l'argent</li>
         </ul>`
      : `<h3 style="color: ${roleColor}; margin-top: 30px;">Prochaines étapes :</h3>
         <ul style="line-height: 1.8; color: #333;">
           <li>📋 Complétez votre profil entreprise</li>
           <li>📝 Publiez votre première mission</li>
           <li>✅ Vérifiez votre identité</li>
           <li>👥 Trouvez les meilleurs automobs</li>
         </ul>`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: ${roleColor};">🎉 Bienvenue sur NettmobFrance !</h2>
        
        <p>Bonjour ${userName},</p>
        
        <p>Félicitations ! Votre email a été vérifié avec succès.</p>
        
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
          <p style="margin: 0;"><strong>✅ Votre compte est maintenant actif !</strong></p>
          <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">Vous avez accès à toutes les fonctionnalités de la plateforme.</p>
        </div>
        
        ${nextSteps}
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="${dashboardUrl}" style="background-color: ${roleColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Accéder à mon tableau de bord
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Cet email a été envoyé automatiquement par NettmobFrance.
        </p>
      </div>
    `;
    
    await sendNotificationEmail(
      user.email,
      '🎉 Bienvenue sur NettmobFrance',
      html
    );

    res.json({ 
      message: 'Email vérifié avec succès',
      verified: true,
      token,
      user: {
        ...user,
        profile
      }
    });
  } catch (error) {
    console.error('Erreur vérification OTP:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification' });
  }
});

/**
 * Envoyer un OTP pour connexion
 */
router.post('/send-login-otp', async (req, res) => {
  const { email, userId } = req.body;

  if (!email || !userId) {
    return res.status(400).json({ error: 'Email et userId requis' });
  }

  try {
    // Vérifier que l'utilisateur existe et est vérifié
    const [users] = await db.query('SELECT id, email, verified FROM users WHERE id = ? AND email = ?', [userId, email]);
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    if (!users[0].verified) {
      return res.status(403).json({ error: 'Email non vérifié' });
    }

    // Invalider les anciens OTP de connexion
    await db.query(
      'UPDATE otp_codes SET verified = TRUE WHERE user_id = ? AND type = ? AND verified = FALSE',
      [userId, 'login']
    );

    // Générer un nouveau code OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Enregistrer l'OTP en base
    await db.query(
      'INSERT INTO otp_codes (user_id, email, otp_code, type, expires_at) VALUES (?, ?, ?, ?, ?)',
      [userId, email, otp, 'login', expiresAt]
    );

    // Envoyer l'email
    await sendOTPEmail(email, otp, 'login');

    res.json({ 
      message: 'Code de connexion envoyé par email',
      expiresIn: 600 // 10 minutes en secondes
    });
  } catch (error) {
    console.error('Erreur envoi OTP connexion:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du code' });
  }
});

/**
 * Vérifier l'OTP de connexion
 */
router.post('/verify-login-otp', async (req, res) => {
  const { email, userId, otp } = req.body;

  if (!email || !userId || !otp) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }

  try {
    // Récupérer l'OTP le plus récent
    const [otpRecords] = await db.query(
      `SELECT * FROM otp_codes 
       WHERE user_id = ? AND email = ? AND type = ? AND verified = FALSE 
       ORDER BY created_at DESC LIMIT 1`,
      [userId, email, 'login']
    );

    if (otpRecords.length === 0) {
      return res.status(400).json({ error: 'Code invalide ou expiré' });
    }

    const otpRecord = otpRecords[0];

    // Vérifier l'expiration
    if (new Date() > new Date(otpRecord.expires_at)) {
      return res.status(400).json({ error: 'Code expiré' });
    }

    // Vérifier le nombre de tentatives (max 5)
    if (otpRecord.attempts >= 5) {
      return res.status(400).json({ error: 'Trop de tentatives. Demandez un nouveau code.' });
    }

    // Incrémenter les tentatives
    await db.query('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?', [otpRecord.id]);

    // Vérifier le code
    if (otpRecord.otp_code !== otp) {
      return res.status(400).json({ error: 'Code incorrect' });
    }

    // Marquer l'OTP comme vérifié
    await db.query('UPDATE otp_codes SET verified = TRUE WHERE id = ?', [otpRecord.id]);

    res.json({ 
      message: 'Code vérifié avec succès',
      verified: true
    });
  } catch (error) {
    console.error('Erreur vérification OTP connexion:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification' });
  }
});

/**
 * Renvoyer un code OTP
 */
router.post('/resend-otp', async (req, res) => {
  const { email, userId, type } = req.body;

  if (!email || !userId || !type) {
    return res.status(400).json({ error: 'Email, userId et type requis' });
  }

  if (!['verification', 'login'].includes(type)) {
    return res.status(400).json({ error: 'Type invalide' });
  }

  try {
    // Vérifier que l'utilisateur existe
    const [users] = await db.query('SELECT id, email FROM users WHERE id = ? AND email = ?', [userId, email]);
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Invalider les anciens OTP
    await db.query(
      'UPDATE otp_codes SET verified = TRUE WHERE user_id = ? AND type = ? AND verified = FALSE',
      [userId, type]
    );

    // Générer un nouveau code OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Enregistrer l'OTP en base
    await db.query(
      'INSERT INTO otp_codes (user_id, email, otp_code, type, expires_at) VALUES (?, ?, ?, ?, ?)',
      [userId, email, otp, type, expiresAt]
    );

    // Envoyer l'email
    await sendOTPEmail(email, otp, type);

    res.json({ 
      message: 'Nouveau code envoyé par email',
      expiresIn: 600
    });
  } catch (error) {
    console.error('Erreur renvoi OTP:', error);
    res.status(500).json({ error: 'Erreur lors du renvoi du code' });
  }
});

export default router;
