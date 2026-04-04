import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import db from '../config/database.js';
import rateLimit from 'express-rate-limit';
import { authenticateToken } from '../middleware/auth.js';
import mbxGeocoding from '@mapbox/mapbox-sdk/services/geocoding.js';
import { generateOTP, sendOTPEmail } from '../services/emailService.js';
import { sendWelcomeEmail, sendIdentityVerificationRequestEmail } from '../services/welcomeEmails.js';
import { NotificationTemplates, createNotification } from '../utils/notificationHelper.js';

const router = express.Router();
const geocodingClient = mbxGeocoding({ accessToken: process.env.MAPBOX_TOKEN });

// Configuration de multer pour les uploads
const upload = multer({
  dest: 'uploads/documents/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers JPEG, PNG et PDF sont autorisés'));
    }
  }
});

const fetchClientProfileLocal = async (userId) => {
  const [profiles] = await db.query('SELECT * FROM client_profiles WHERE user_id = ?', [userId]);
  if (!profiles.length) {
    return null;
  }

  const profile = profiles[0];
  const [[userRow]] = await db.query('SELECT profile_picture, cover_picture FROM users WHERE id = ?', [userId]);
  profile.profile_picture = profile.profile_picture || userRow?.profile_picture || null;
  profile.cover_picture = profile.cover_picture || userRow?.cover_picture || null;

  if (profile.secteur_id) {
    const [[secteurRow]] = await db.query('SELECT nom FROM secteurs WHERE id = ?', [profile.secteur_id]);
    profile.secteur_name = secteurRow?.nom || null;
  } else {
    profile.secteur_name = null;
  }

  // Parser work_areas si c'est une string JSON
  if (profile.work_areas && typeof profile.work_areas === 'string') {
    try {
      profile.work_areas = JSON.parse(profile.work_areas);
    } catch (e) {
      profile.work_areas = [];
    }
  }

  // Récupérer les compétences sélectionnées (profils recherchés)
  const [competenceRows] = await db.query(
    `SELECT c.id, c.nom
     FROM client_competences cc
     JOIN competences c ON cc.competence_id = c.id
     WHERE cc.client_profile_id = ?
     ORDER BY c.nom ASC`,
    [profile.id]
  );

  profile.competence_ids = competenceRows.map((row) => row.id);
  profile.competences = competenceRows;

  return profile;
};

const fetchAutomobProfileWithRelations = async (userId) => {
  const [profiles] = await db.query('SELECT * FROM automob_profiles WHERE user_id = ?', [userId]);
  if (!profiles.length) {
    return null;
  }

  const profile = profiles[0];
  const profileId = profile.id;

  const [[userRow]] = await db.query(
    'SELECT profile_picture, cover_picture FROM users WHERE id = ?',
    [userId]
  );

  profile.profile_picture = profile.profile_picture || userRow?.profile_picture || null;
  profile.cover_picture = profile.cover_picture || userRow?.cover_picture || null;

  const [competenceRows] = await db.query(
    `SELECT ac.competence_id AS id, c.nom
     FROM automob_competences ac
     JOIN competences c ON ac.competence_id = c.id
     WHERE ac.automob_profile_id = ?
     ORDER BY c.nom ASC`,
    [profileId]
  );

  profile.competence_ids = competenceRows.map((row) => row.id);
  profile.competences = competenceRows;

  // Parser work_areas si c'est une string JSON
  if (profile.work_areas && typeof profile.work_areas === 'string') {
    try {
      profile.work_areas = JSON.parse(profile.work_areas);
    } catch (e) {
      profile.work_areas = [];
    }
  }

  if (profile.secteur_id) {
    const [[secteurRow]] = await db.query('SELECT nom FROM secteurs WHERE id = ?', [profile.secteur_id]);
    profile.secteur_name = secteurRow?.nom || null;
  } else {
    profile.secteur_name = null;
  }

  // Récupérer les disponibilités
  const [availabilityRows] = await db.query(
    `SELECT id, start_date, end_date, created_at
     FROM automob_availabilities
     WHERE automob_profile_id = ?
     ORDER BY start_date ASC`,
    [profileId]
  );
  profile.availabilities = availabilityRows;

  // Récupérer les expériences professionnelles
  const [experienceRows] = await db.query(
    `SELECT id, job_title, company_name, start_date, end_date, is_current, description, created_at
     FROM automob_experiences
     WHERE user_id = ?
     ORDER BY start_date DESC`,
    [userId]
  );
  profile.experiences = experienceRows;

  // Récupérer les documents et habilitations (si la table existe)
  try {
    const [documentRows] = await db.query(
      `SELECT id, name, type, has_expiry, file_path, uploaded_at
       FROM automob_documents
       WHERE user_id = ?
       ORDER BY uploaded_at DESC`,
      [userId]
    );
    profile.documents = documentRows;
  } catch (error) {
    // Si la table n'existe pas encore, on ignore l'erreur
    console.warn('Table automob_documents non trouvée:', error.message);
    profile.documents = [];
  }

  return profile;
};

// Check email availability
router.post('/check-email', async (req, res) => {
  const { email } = req.body;

  try {
    const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    res.json({ available: existingUsers.length === 0 });
  } catch (error) {
    console.error('Erreur vérification email:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Register
router.post('/register',
  upload.single('idDocument'),
  [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('role').isIn(['automob', 'client'])
  ],
  async (req, res) => {
    console.log('📝 Début inscription - Body reçu:', Object.keys(req.body));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('❌ Erreurs de validation:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      email, password, role, firstName, lastName, phone, city, address,
      siret, experience, secteurId, competences,
      companyName, profilsRecherches,
      webPushEnabled, emailNotifications, privacyAccepted, mandateAccepted
    } = req.body;

    console.log('👤 Données inscription:', { email, role, firstName, lastName, address, companyName });

    // Validation spécifique selon le rôle
    if (role === 'client' && !companyName) {
      console.error('❌ Nom d\'entreprise manquant pour client');
      return res.status(400).json({ error: 'Le nom de l\'entreprise est obligatoire' });
    }

    if (role === 'automob' && (!firstName || !lastName)) {
      console.error('❌ Prénom/Nom manquant pour automob');
      return res.status(400).json({ error: 'Le prénom et le nom sont obligatoires' });
    }

    try {
      console.log('🔍 Vérification email existant...');
      const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
      if (existingUsers.length > 0) {
        return res.status(400).json({ error: 'Email déjà utilisé' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const [result] = await db.query(
        'INSERT INTO users (email, password, role, verified) VALUES (?, ?, ?, ?)',
        [email, hashedPassword, role, false]
      );

      const userId = result.insertId;
      console.log('✅ Utilisateur créé avec ID:', userId);

      // Envoyer l'OTP avec gestion d'erreur non-bloquante
      console.log('📧 Envoi OTP de vérification...');
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      let emailSent = false;

      await db.query(
        'INSERT INTO otp_codes (user_id, email, otp_code, type, expires_at) VALUES (?, ?, ?, ?, ?)',
        [userId, email, otp, 'verification', expiresAt]
      );

      // Try to send email but don't block registration if it fails
      try {
        await sendOTPEmail(email, otp, 'verification');
        console.log('✅ OTP envoyé avec succès');
        emailSent = true;
      } catch (emailError) {
        console.error('⚠️ Erreur envoi email OTP (non-bloquant):', emailError.message);
        console.log('ℹ️ L\'inscription continue sans email - L\'utilisateur peut se connecter');
      }

      // Répondre au client - inscription réussie
      res.status(201).json({
        message: emailSent
          ? 'Inscription réussie. Un code de vérification a été envoyé par email.'
          : 'Inscription réussie, mais l\'envoi du code a échoué. Veuillez contacter le support.',
        userId,
        email,
        requiresVerification: true, // Toujours demander la vérification
        emailSent
      });

      // Continuer les opérations en arrière-plan (géocodage, emails, notifications)
      console.log('🔄 Traitement en arrière-plan...');

      // Géocodage de l'adresse et extraction de la ville
      console.log('🗺️ Démarrage géocodage pour:', address);
      let latitude = null, longitude = null, extractedCity = null;
      const addressToGeocode = address || city;
      if (addressToGeocode) {
        try {
          const geoResponse = await geocodingClient.forwardGeocode({
            query: `${addressToGeocode}, France`,
            limit: 1
          }).send();

          if (geoResponse.body.features.length > 0) {
            const feature = geoResponse.body.features[0];
            [longitude, latitude] = feature.center;

            // Extraire la ville depuis le contexte Mapbox
            if (feature.context) {
              const placeContext = feature.context.find(c => c.id.startsWith('place.'));
              if (placeContext) {
                extractedCity = placeContext.text;
              }
            }
            // Si pas de contexte, essayer d'extraire depuis place_name
            if (!extractedCity && feature.place_name) {
              const parts = feature.place_name.split(',');
              if (parts.length >= 2) {
                // Prendre l'avant-dernière partie (généralement la ville)
                extractedCity = parts[parts.length - 2].trim();
              }
            }
          }
        } catch (geoError) {
          console.error('Geocoding error:', geoError);
        }
      }

      // Utiliser la ville extraite ou celle fournie
      const finalCity = extractedCity || city || null;
      console.log('📍 Résultat géocodage:', { latitude, longitude, finalCity });

      const phoneCountryCode = phone?.substring(0, 3) || '+33';
      const idDocumentPath = req.file ? req.file.path : null;

      if (role === 'automob') {
        console.log('👨‍💼 Création profil automob...');
        const [profileResult] = await db.query(
          `INSERT INTO automob_profiles (
            user_id, siret, first_name, last_name, phone, phone_country_code, experience, secteur_id,
            address, city, latitude, longitude, profile_picture, cover_picture, id_document_path,
            web_push_enabled, email_notifications, privacy_policy_accepted, billing_mandate_accepted
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [userId, siret, firstName, lastName, phone, phoneCountryCode, experience, secteurId || null,
            address, finalCity, latitude, longitude, null, null, idDocumentPath,
            webPushEnabled === 'true' || webPushEnabled === true ? 1 : 0,
            emailNotifications === 'true' || emailNotifications === true ? 1 : 0,
            privacyAccepted || false, mandateAccepted || false]
        );

        console.log('✅ Profil automob créé avec ID:', profileResult.insertId);

        // Insérer les compétences
        if (competences) {
          console.log('🎯 Insertion compétences:', competences);
          const competenceIds = typeof competences === 'string' ? JSON.parse(competences) : competences;
          if (Array.isArray(competenceIds) && competenceIds.length > 0) {
            const values = competenceIds.map(compId => [profileResult.insertId, compId]);
            await db.query(
              'INSERT INTO automob_competences (automob_profile_id, competence_id) VALUES ?',
              [values]
            );
            console.log('✅ Compétences insérées');
          }
        }
      } else if (role === 'client') {
        console.log('🏢 Création profil client...');
        const [profileResult] = await db.query(
          `INSERT INTO client_profiles (
            user_id, company_name, first_name, last_name, phone, phone_country_code, address, city,
            latitude, longitude, siret, secteur_id, representative_id_path,
            profile_picture, cover_picture, web_push_enabled, email_notifications, privacy_policy_accepted, billing_mandate_accepted
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [userId, companyName, firstName, lastName, phone, phoneCountryCode, address, finalCity,
            latitude, longitude, siret, secteurId || null, idDocumentPath,
            null, null,
            webPushEnabled === 'true' || webPushEnabled === true ? 1 : 0,
            emailNotifications === 'true' || emailNotifications === true ? 1 : 0,
            privacyAccepted || false, mandateAccepted || false]
        );

        console.log('✅ Profil client créé avec ID:', profileResult.insertId);

        // Insérer les profils recherchés
        if (profilsRecherches) {
          console.log('🎯 Insertion profils recherchés:', profilsRecherches);
          const profilIds = typeof profilsRecherches === 'string' ? JSON.parse(profilsRecherches) : profilsRecherches;
          if (Array.isArray(profilIds) && profilIds.length > 0) {
            const values = profilIds.map(compId => [profileResult.insertId, compId]);
            await db.query(
              'INSERT INTO client_profils_recherches (client_profile_id, competence_id) VALUES ?',
              [values]
            );
            console.log('✅ Profils recherchés insérés');
          }
        }
      }

      // Envoyer email de bienvenue
      console.log('📧 Envoi email de bienvenue...');
      try {
        await sendWelcomeEmail(email, firstName, role);
        console.log('✅ Email de bienvenue envoyé');
      } catch (emailError) {
        console.error('Erreur envoi email bienvenue:', emailError);
      }

      // Envoyer email demande vérification identité
      console.log('📧 Envoi email vérification identité...');
      try {
        await sendIdentityVerificationRequestEmail(email, firstName, role);
        console.log('✅ Email vérification identité envoyé');
      } catch (emailError) {
        console.error('Erreur envoi email vérification:', emailError);
      }

      // Créer notifications (Socket.IO + Web Push)
      console.log('🔔 Création notifications...');
      try {
        const io = req.app.get('io');

        // Notification de bienvenue (Socket.IO uniquement, pas de Web Push car pas encore de souscription)
        await NotificationTemplates.welcome(userId, role, io);
        console.log('✅ Notification bienvenue créée');

        // NOTE: La notification push de bienvenue sera envoyée après l'enregistrement 
        // de la souscription push (dans /users/push-subscription)
        if (webPushEnabled === 'true' || webPushEnabled === true) {
          console.log('ℹ️ Notification push de bienvenue sera envoyée après souscription');
        }

        // Notification demande vérification identité
        await NotificationTemplates.identityVerificationRequest(userId, role, io);
        console.log('✅ Notification vérification identité créée');
      } catch (notifError) {
        console.error('Erreur création notifications:', notifError);
      }

      // Notifier les admins de la nouvelle inscription
      try {
        console.log('🔔 Notification admins nouvelle inscription...');

        // Récupérer tous les admins
        const [admins] = await db.query(
          'SELECT id, email FROM users WHERE role = "admin"'
        );

        for (const admin of admins) {
          // Créer une notification in-app pour l'admin
          await createNotification(
            admin.id,
            '👤 Nouvelle inscription',
            `${role === 'automob' ? 'Automob' : 'Client'}: ${firstName || companyName} (${email})`,
            role === 'automob' ? '/admin/users' : '/admin/users',
            'info',
            io
          );

          // Envoyer un email à l'admin
          const { sendEmail } = await import('../services/emailService.js');
          const emailSubject = `Nouvelle inscription: ${role === 'automob' ? 'Automob' : 'Client'}`;
          const emailContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>Nouvelle inscription</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc;">
              <div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="background: #2563eb; padding: 30px 20px; text-align: center;">
                  <div style="font-size: 28px; font-weight: bold; color: white;">NettmobFrance Admin</div>
                  <h1 style="color: white; margin: 20px 0 0 0;">👤 Nouvelle inscription</h1>
                </div>
                <div style="padding: 40px 30px;">
                  <p style="color: #374151; line-height: 1.6; margin: 20px 0;">
                    Un nouvel utilisateur vient de s'inscrire sur la plateforme.
                  </p>
                  <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Type:</strong> ${role === 'automob' ? 'Automob' : 'Client'}</p>
                    <p style="margin: 5px 0;"><strong>Nom:</strong> ${firstName && lastName ? `${firstName} ${lastName}` : companyName || 'N/A'}</p>
                    <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                    <p style="margin: 5px 0;"><strong>Téléphone:</strong> ${phone || 'N/A'}</p>
                    <p style="margin: 5px 0;"><strong>Ville:</strong> ${finalCity || 'N/A'}</p>
                    ${role === 'automob' ? `<p style="margin: 5px 0;"><strong>SIRET:</strong> ${siret || 'N/A'}</p>` : ''}
                  </div>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://panel.nettmobfrance.fr/admin/users" 
                       style="display: inline-block; background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px;">
                      Voir l'utilisateur
                    </a>
                  </div>
                </div>
                <div style="background: #f8fafc; padding: 20px; text-align: center;">
                  <p style="margin: 0; color: #6b7280; font-size: 12px;">© ${new Date().getFullYear()} NettmobFrance</p>
                </div>
              </div>
            </body>
            </html>
          `;

          await sendEmail(admin.email, emailSubject, emailContent);
        }

        console.log(`✅ ${admins.length} admin(s) notifié(s)`);
      } catch (adminNotifError) {
        console.error('❌ Erreur notification admins:', adminNotifError);
      }

      console.log('✅ Traitement en arrière-plan terminé pour userId:', userId);
    } catch (error) {
      console.error('❌ ERREUR INSCRIPTION DÉTAILLÉE ❌');
      console.error('='.repeat(50));
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);

      // Erreur SQL spécifique
      if (error.code) {
        console.error('Code SQL:', error.code);
        console.error('SQL State:', error.sqlState);
        console.error('SQL Message:', error.sqlMessage);
        console.error('Errno:', error.errno);
      }

      // Informations sur l'état
      console.error('Email:', email);
      console.error('Role:', role);
      console.error('='.repeat(50));

      // Si l'erreur survient AVANT la création de l'utilisateur
      // On peut encore envoyer une réponse d'erreur
      if (!res.headersSent) {
        // Si l'utilisateur a été créé mais qu'une erreur est survenue après
        if (userId) {
          return res.status(201).json({
            message: 'Inscription réussie mais certaines opérations ont échoué. Vous pouvez continuer.',
            userId,
            email,
            requiresVerification: true,
            warning: 'Certaines notifications n\'ont pas pu être envoyées'
          });
        }

        return res.status(500).json({
          error: 'Erreur lors de l\'inscription',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      } else {
        // L'erreur est survenue en arrière-plan après avoir répondu
        console.error('⚠️ Erreur en arrière-plan (réponse déjà envoyée)');
        // L'utilisateur a déjà reçu une réponse positive, donc il peut continuer
      }
    }
  }
);

// Login
router.post('/login',
  [
    body('email').isEmail(),
    body('password').notEmpty()
  ],
  async (req, res) => {
    console.log('🔐 Tentative de connexion:', req.body.email);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('❌ Erreurs de validation login:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      console.log('📊 Recherche utilisateur:', email);
      const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

      if (users.length === 0) {
        console.log('❌ Utilisateur non trouvé pour:', email);
        return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
      }

      const user = users[0];
      console.log('✅ Utilisateur trouvé - ID:', user.id, 'Role:', user.role, 'Vérifié:', user.verified);

      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('🔐 Validation mot de passe:', isPasswordValid ? '✅ Correct' : '❌ Incorrect');

      if (!isPasswordValid) {
        console.log('❌ Mot de passe incorrect pour:', email);
        return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
      }

      if (!user.verified) {
        return res.status(403).json({
          error: 'Compte en attente de vérification',
          requiresVerification: true,
          userId: user.id,
          email: user.email
        });
      }

      // Vérifier si OTP est nécessaire (désactivé pour les admins)
      const needsOTP = () => {
        // Les admins ne nécessitent jamais d'OTP
        if (user.role === 'admin') {
          return false;
        }

        // Première connexion (last_login est NULL)
        if (!user.last_login) {
          return true;
        }

        // Vérifier si la dernière connexion date de plus de 4 jours
        const lastLoginDate = new Date(user.last_login);
        const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);

        if (lastLoginDate < fourDaysAgo) {
          return true;
        }

        return false;
      };

      console.log('🔐 Vérification OTP nécessaire:', needsOTP(), '(Role:', user.role, ')');

      // Si OTP est nécessaire, l'envoyer
      if (needsOTP()) {
        try {
          // Invalider les anciens OTP de connexion
          await db.query(
            'UPDATE otp_codes SET verified = TRUE WHERE user_id = ? AND type = ? AND verified = FALSE',
            [user.id, 'login']
          );

          const otp = generateOTP();
          const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

          await db.query(
            'INSERT INTO otp_codes (user_id, email, otp_code, type, expires_at) VALUES (?, ?, ?, ?, ?)',
            [user.id, email, otp, 'login', expiresAt]
          );

          await sendOTPEmail(email, otp, 'login');

          return res.json({
            message: 'Code de vérification envoyé par email',
            requiresOTP: true,
            userId: user.id,
            email: user.email
          });
        } catch (otpError) {
          console.error('Erreur envoi OTP login:', otpError);
          return res.status(500).json({ error: 'Erreur lors de l\'envoi du code' });
        }
      }

      // Connexion directe sans OTP (connexion récente)
      // Gérer les sessions
      const [openSessions] = await db.query(
        'SELECT id, login_at FROM user_sessions WHERE user_id = ? AND logout_at IS NULL ORDER BY login_at DESC LIMIT 1',
        [user.id]
      );

      if (openSessions.length) {
        const openSession = openSessions[0];
        const loginAt = new Date(openSession.login_at);
        const durationSeconds = Math.max(0, Math.floor((Date.now() - loginAt.getTime()) / 1000));
        await db.query('UPDATE user_sessions SET logout_at = NOW(), duration_seconds = ? WHERE id = ?', [durationSeconds, openSession.id]);
        await db.query('UPDATE users SET total_session_duration = total_session_duration + ? WHERE id = ?', [durationSeconds, user.id]);
      }

      await db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
      await db.query('INSERT INTO user_sessions (user_id, login_at) VALUES (?, NOW())', [user.id]);

      const [userRows] = await db.query(
        'SELECT id, email, role, verified, id_verified, last_login, total_session_duration, profile_picture, cover_picture FROM users WHERE id = ?',
        [user.id]
      );
      const enrichedUser = userRows[0];

      let profile = null;
      if (user.role === 'automob') {
        profile = await fetchAutomobProfileWithRelations(user.id);
      } else if (user.role === 'client') {
        profile = await fetchClientProfileLocal(user.id);
      }

      if (profile) {
      profile.profile_picture = profile.profile_picture || enrichedUser.profile_picture || null;
      profile.cover_picture = profile.cover_picture || enrichedUser.cover_picture || null;
      // Fallback: if profile doesn't have id_verified, use users.id_verified
      if (profile.id_verified === undefined || profile.id_verified === null) {
        profile.id_verified = enrichedUser.id_verified;
      }
    }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      console.log('✅ Connexion réussie pour:', email);
      res.json({
        token,
        user: {
          ...enrichedUser,
          profile
        }
      });
    } catch (error) {
      console.error('❌ ERREUR LOGIN DÉTAILLÉE ❌');
      console.error('='.repeat(50));
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
      if (error.code) {
        console.error('Code SQL:', error.code);
        console.error('SQL Message:', error.sqlMessage);
      }
      console.error('='.repeat(50));
      res.status(500).json({ error: 'Erreur lors de la connexion' });
    }
  }
);

// Login avec OTP vérifié
router.post('/login-verify', async (req, res) => {
  const { userId, email } = req.body;

  if (!userId || !email) {
    return res.status(400).json({ error: 'userId et email requis' });
  }

  try {
    // Vérifier que l'utilisateur existe et a un OTP de connexion validé
    const [users] = await db.query('SELECT * FROM users WHERE id = ? AND email = ?', [userId, email]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const user = users[0];

    // Gérer les sessions
    const [openSessions] = await db.query(
      'SELECT id, login_at FROM user_sessions WHERE user_id = ? AND logout_at IS NULL ORDER BY login_at DESC LIMIT 1',
      [user.id]
    );

    if (openSessions.length) {
      const openSession = openSessions[0];
      const loginAt = new Date(openSession.login_at);
      const durationSeconds = Math.max(0, Math.floor((Date.now() - loginAt.getTime()) / 1000));
      await db.query('UPDATE user_sessions SET logout_at = NOW(), duration_seconds = ? WHERE id = ?', [durationSeconds, openSession.id]);
      await db.query('UPDATE users SET total_session_duration = total_session_duration + ? WHERE id = ?', [durationSeconds, user.id]);
    }

    await db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
    await db.query('INSERT INTO user_sessions (user_id, login_at) VALUES (?, NOW())', [user.id]);

    const [userRows] = await db.query(
      'SELECT id, email, role, verified, id_verified, last_login, total_session_duration, profile_picture, cover_picture FROM users WHERE id = ?',
      [user.id]
    );
    const enrichedUser = userRows[0];

    let profile = null;
    if (user.role === 'automob') {
      profile = await fetchAutomobProfileWithRelations(user.id);
    } else if (user.role === 'client') {
      profile = await fetchClientProfileLocal(user.id);
    }

    if (profile) {
      profile.profile_picture = profile.profile_picture || enrichedUser.profile_picture || null;
      profile.cover_picture = profile.cover_picture || enrichedUser.cover_picture || null;
      // Fallback: if profile doesn't have id_verified, use users.id_verified
      if (profile.id_verified === undefined || profile.id_verified === null) {
        profile.id_verified = enrichedUser.id_verified;
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        ...enrichedUser,
        profile
      }
    });
  } catch (error) {
    console.error('Login verify error:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token requis' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [users] = await db.query('SELECT id, email, role, verified, id_verified, last_login, total_session_duration, profile_picture, cover_picture FROM users WHERE id = ?', [decoded.id]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const user = users[0];
    let profile = null;

    if (user.role === 'automob') {
      profile = await fetchAutomobProfileWithRelations(user.id);
    } else if (user.role === 'client') {
      profile = await fetchClientProfileLocal(user.id);
    }

    if (profile) {
      profile.profile_picture = profile.profile_picture || user.profile_picture || null;
      profile.cover_picture = profile.cover_picture || user.cover_picture || null;
      // Fallback: if profile doesn't have id_verified, use users.id_verified
      if (profile.id_verified === undefined || profile.id_verified === null) {
        profile.id_verified = user.id_verified;
      }
    }

    res.json({ user, profile });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(401).json({ error: 'Token invalide' });
  }
});

router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const [openSessions] = await db.query(
      'SELECT id, login_at FROM user_sessions WHERE user_id = ? AND logout_at IS NULL ORDER BY login_at DESC LIMIT 1',
      [userId]
    );

    if (!openSessions.length) {
      return res.json({ message: 'Aucune session active' });
    }

    const session = openSessions[0];
    const loginAt = new Date(session.login_at);
    const durationSeconds = Math.max(0, Math.floor((Date.now() - loginAt.getTime()) / 1000));

    await db.query(
      'UPDATE user_sessions SET logout_at = NOW(), duration_seconds = ? WHERE id = ?',
      [durationSeconds, session.id]
    );

    await db.query(
      'UPDATE users SET total_session_duration = total_session_duration + ? WHERE id = ?',
      [durationSeconds, userId]
    );

    return res.json({ message: 'Session clôturée', duration_seconds: durationSeconds });
  } catch (error) {
    console.error('Erreur lors du logout:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
