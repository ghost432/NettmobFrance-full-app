import express from 'express';
import { body, validationResult } from 'express-validator';
import db from '../config/database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import mbxGeocoding from '@mapbox/mapbox-sdk/services/geocoding.js';
import {
  sendApplicationConfirmationEmail,
  sendNewApplicationEmail,
  sendApplicationAcceptedEmail,
  sendApplicationRejectedEmail,
  sendMissionStartedEmail,
  sendNewMissionEmail
} from '../services/missionEmailService.js';
import { createNotification, createBulkNotifications } from '../utils/notificationHelper.js';
import { sendNotificationEmail } from '../services/emailService.js';
import {
  notifyNewMission,
  notifyNewApplication,
  notifyApplicationAccepted,
  notifyApplicationRejected,
  sendFCMNotificationToMultipleUsers
} from '../services/fcmNotificationService.js';
import { sendBulkSMS } from '../services/twilioService.js';
import webpush from 'web-push';
import MissionNotificationService from '../services/missionNotificationService.js';
import {
  createAutomobInvoice,
  createClientInvoice,
  createAdminSummaryInvoice
} from '../services/invoiceService.js';

const router = express.Router();
const geocodingClient = mbxGeocoding({ accessToken: process.env.MAPBOX_TOKEN });

// Get all missions (admin only)
router.get('/all', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const [missions] = await db.query(`
      SELECT m.*, 
             cp.company_name as client_company,
             CONCAT(cp.first_name, ' ', cp.last_name) as client_name,
             u.email as client_email,
             (SELECT COUNT(*) FROM mission_applications WHERE mission_id = m.id) as applications_count
      FROM missions m
      LEFT JOIN client_profiles cp ON m.client_id = cp.user_id
      LEFT JOIN users u ON m.client_id = u.id
      ORDER BY m.created_at DESC
    `);
    res.json(missions);
  } catch (error) {
    console.error('Get all missions error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des missions' });
  }
});

// Get all applications for a mission (admin only)
router.get('/:id/applications/all', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const [applications] = await db.query(`
      SELECT 
        ma.*,
        ap.first_name as automob_first_name,
        ap.last_name as automob_last_name,
        CONCAT(ap.first_name, ' ', ap.last_name) as automob_name,
        ap.profile_picture as automob_avatar,
        ap.experience as automob_experience
      FROM mission_applications ma
      JOIN automob_profiles ap ON ma.automob_id = ap.user_id
      WHERE ma.mission_id = ?
      ORDER BY ma.created_at DESC
    `, [req.params.id]);

    res.json(applications);
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Create mission as admin
router.post('/admin', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const {
    client_id,
    mission_name,
    description,
    secteur_id,
    competences_ids,
    start_date,
    end_date,
    start_time,
    end_time,
    hourly_rate,
    nb_automobs,
    address,
    city,
    postal_code,
    work_time
  } = req.body;

  try {
    const [result] = await db.query(
      `INSERT INTO missions (
        client_id, mission_name, description, secteur_id, start_date, end_date,
        start_time, end_time, hourly_rate, nb_automobs, address, city, postal_code,
        work_time, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ouvert')`,
      [
        client_id, mission_name, description, secteur_id, start_date, end_date,
        start_time, end_time, hourly_rate, nb_automobs, address, city, postal_code,
        work_time
      ]
    );

    const missionId = result.insertId;

    // Ajouter les compétences
    if (competences_ids && competences_ids.length > 0) {
      for (const competence_id of competences_ids) {
        await db.query(
          'INSERT INTO mission_competences (mission_id, competence_id) VALUES (?, ?)',
          [missionId, competence_id]
        );
      }
    }

    res.status(201).json({
      message: 'Mission créée avec succès',
      missionId
    });
  } catch (error) {
    console.error('Create mission error:', error);
    res.status(500).json({
      error: 'Erreur lors de la création de la mission',
      details: error.message
    });
  }
});

// Get summary of all client missions and applications (client only)
router.get('/client/summary', authenticateToken, authorizeRoles('client'), async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM missions WHERE client_id = ?) as total_missions,
        (SELECT COUNT(*) FROM mission_applications ma JOIN missions m ON ma.mission_id = m.id WHERE m.client_id = ? AND ma.status = 'en_attente') as pending_applications
    `, [req.user.id, req.user.id]);
    
    res.json(stats[0]);
  } catch (error) {
    console.error('Erreur récupération résumé client:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get pending applications count for client sidebar (client only)
router.get('/client/pending-applications-count', authenticateToken, authorizeRoles('client'), async (req, res) => {
  try {
    const [result] = await db.query(`
      SELECT COUNT(*) as count 
      FROM mission_applications ma 
      JOIN missions m ON ma.mission_id = m.id 
      WHERE m.client_id = ? AND ma.status = 'en_attente'
    `, [req.user.id]);
    
    res.json({ count: result[0].count });
  } catch (error) {
    console.error('Erreur récupération nombre candidatures en attente:', error);
    res.status(500).json({ error: 'Erreur serveur', count: 0 });
  }
});

// Get all missions
router.get('/', authenticateToken, async (req, res) => {
  const { city, status } = req.query;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    let query = `
      SELECT m.*, 
             cp.company_name as client_company,
             u.email as client_email,
             (SELECT COUNT(*) FROM mission_applications WHERE mission_id = m.id) as applications_count
      FROM missions m
      LEFT JOIN client_profiles cp ON m.client_id = cp.user_id
      LEFT JOIN users u ON m.client_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (userRole === 'automob') {
      if (city) {
        query += ' AND m.city = ?';
        params.push(city);
      }
      // Afficher les missions ouvertes ET en cours (pour missions multi-automobs)
      query += ' AND m.status IN ("ouvert", "en_cours")';
    } else if (userRole === 'client') {
      query += ' AND m.client_id = ?';
      params.push(userId);
    }

    if (status) {
      query += ' AND m.status = ?';
      params.push(status);
    }

    query += ' ORDER BY m.created_at DESC';

    const [missions] = await db.query(query, params);

    // Si l'utilisateur est un automob, ajouter le statut de candidature pour chaque mission
    if (userRole === 'automob') {
      const missionsWithStatus = await Promise.all(missions.map(async (mission) => {
        const [application] = await db.query(`
          SELECT id, status, created_at
          FROM mission_applications
          WHERE mission_id = ? AND automob_id = ?
        `, [mission.id, userId]);

        // Vérifier le nombre d'automobs acceptés pour les missions en cours
        const [acceptedCount] = await db.query(`
          SELECT COUNT(*) as count
          FROM mission_applications
          WHERE mission_id = ? AND status = 'accepte'
        `, [mission.id]);

        const automobsNeeded = mission.automobs_needed || 1;
        const accepted = acceptedCount[0].count;

        return {
          ...mission,
          user_application: application.length > 0 ? application[0] : null,
          accepted_count: accepted,
          places_remaining: automobsNeeded - accepted
        };
      }));

      // Filtrer les missions en_cours qui ont atteint leur quota
      const availableMissions = missionsWithStatus.filter(mission => {
        if (mission.status === 'en_cours') {
          return mission.places_remaining > 0;
        }
        return true;
      });

      res.json(availableMissions);
    } else {
      res.json(missions);
    }
  } catch (error) {
    console.error('Get missions error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des missions' });
  }
});

// Get all applications for client's missions (client only) - Must be before /:id route
router.get('/applications', authenticateToken, authorizeRoles('client'), async (req, res) => {
  const userId = req.user.id;
  try {
    const [applications] = await db.query(`
      SELECT 
        ma.*,
        m.mission_name,
        m.title,
        m.city as mission_city,
        m.start_date as mission_start_date,
        m.end_date as mission_end_date,
        m.hourly_rate as mission_hourly_rate,
        ap.first_name as automob_first_name,
        ap.last_name as automob_last_name,
        CONCAT(ap.first_name, ' ', ap.last_name) as automob_name,
        ap.profile_picture as automob_avatar,
        ap.experience as automob_experience
      FROM mission_applications ma
      JOIN missions m ON ma.mission_id = m.id
      JOIN automob_profiles ap ON ma.automob_id = ap.user_id
      WHERE m.client_id = ?
      ORDER BY ma.created_at DESC
    `, [userId]);

    res.json(applications);
  } catch (error) {
    console.error('Get client applications error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get my applications (automob only) - Must be before /:id route
router.get('/my-applications', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const [applications] = await db.query(`
      SELECT 
        ma.*,
        m.mission_name,
        m.title,
        m.city as mission_city,
        m.start_date as mission_start_date,
        m.end_date as mission_end_date,
        m.hourly_rate as mission_hourly_rate,
        cp.company_name as client_name
      FROM mission_applications ma
      JOIN missions m ON ma.mission_id = m.id
      LEFT JOIN client_profiles cp ON m.client_id = cp.user_id
      WHERE ma.automob_id = ?
      ORDER BY ma.created_at DESC
    `, [userId]);

    res.json(applications);
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get all applications received (admin only) - Must be before /:id route
router.get('/applications/received', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const [applications] = await db.query(`
      SELECT 
        ma.id,
        ma.mission_id,
        ma.automob_id,
        ma.status,
        ma.message,
        ma.created_at,
        m.mission_name,
        m.city as mission_city,
        m.start_date as mission_start_date,
        m.end_date as mission_end_date,
        m.hourly_rate as mission_hourly_rate,
        ap.first_name,
        ap.last_name,
        CONCAT(ap.first_name, ' ', ap.last_name) as automob_name,
        ap.phone,
        ap.hourly_rate,
        ap.experience,
        u.email
      FROM mission_applications ma
      JOIN missions m ON ma.mission_id = m.id
      JOIN automob_profiles ap ON ma.automob_id = ap.user_id
      JOIN users u ON ma.automob_id = u.id
      ORDER BY ma.created_at DESC
    `);

    res.json({ applications });
  } catch (error) {
    console.error('Get all applications error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get single mission
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const [missions] = await db.query(`
      SELECT m.*, 
             cp.company_name as client_company,
             CONCAT(cp.first_name, ' ', cp.last_name) as representative_name,
             cp.phone as client_phone,
             u.email as client_email,
             s.nom as secteur_name
      FROM missions m
      LEFT JOIN client_profiles cp ON m.client_id = cp.user_id
      LEFT JOIN users u ON m.client_id = u.id
      LEFT JOIN secteurs s ON m.secteur_id = s.id
      WHERE m.id = ?
    `, [id]);

    if (missions.length === 0) {
      return res.status(404).json({ error: 'Mission non trouvée' });
    }

    // Récupérer les compétences de la mission
    const [competences] = await db.query(`
      SELECT c.nom
      FROM mission_competences mc
      JOIN competences c ON mc.competence_id = c.id
      WHERE mc.mission_id = ?
    `, [id]);
    missions[0].competences = competences.map(c => c.nom);

    // Si l'utilisateur est un automob, vérifier s'il a déjà postulé
    if (req.user.role === 'automob') {
      const [userApplication] = await db.query(`
        SELECT id, status, created_at
        FROM mission_applications
        WHERE mission_id = ? AND automob_id = ?
      `, [id, req.user.id]);

      if (userApplication.length > 0) {
        missions[0].user_application = userApplication[0];
      }
    }

    if (req.user.role === 'client' || req.user.role === 'admin') {
      const [applications] = await db.query(`
        SELECT ma.*, 
               ap.first_name as automob_first_name, 
               ap.last_name as automob_last_name, 
               ap.phone, 
               ap.hourly_rate, 
               ap.experience,
               ap.profile_picture as automob_avatar,
               CONCAT(ap.first_name, ' ', ap.last_name) as automob_name,
               u.email
        FROM mission_applications ma
        LEFT JOIN automob_profiles ap ON ma.automob_id = ap.user_id
        LEFT JOIN users u ON ma.automob_id = u.id
        WHERE ma.mission_id = ?
        ORDER BY ma.created_at DESC
      `, [id]);
      missions[0].applications = applications;
    }

    res.json(missions[0]);
  } catch (error) {
    console.error('Get mission error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la mission' });
  }
});

// Create mission (client only) avec géolocalisation
router.post('/',
  authenticateToken,
  authorizeRoles('client'),
  [
    body('mission_name').notEmpty(),
    body('work_time').notEmpty(),
    body('description').notEmpty(),
    body('address').notEmpty(),
    body('secteur_id').notEmpty(),
    body('competences_ids').isArray({ min: 1 }),
    body('hourly_rate').notEmpty(),
    body('max_hours').isInt({ min: 1 }),
    body('nb_automobs').isInt({ min: 1 }),
    body('start_date').notEmpty(),
    body('end_date').notEmpty(),
    body('start_time').notEmpty(),
    body('end_time').notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      mission_name,
      work_time,
      secteur_id,
      competences_ids,
      billing_frequency,
      max_hours,
      hourly_rate,
      location_type,
      address,
      description,
      nb_automobs,
      start_date,
      end_date,
      start_time,
      end_time
    } = req.body;
    const clientId = req.user.id;

    try {
      // Vérifier si le client a un profil vérifié
      const [[userProfile]] = await db.query(
        'SELECT id_verified FROM users WHERE id = ?',
        [clientId]
      );

      if (!userProfile || !userProfile.id_verified) {
        return res.status(403).json({
          error: 'Profil non vérifié',
          message: 'Vous devez compléter et faire vérifier votre profil avant de publier une mission. Veuillez compléter votre profil et soumettre vos documents d\'identité.'
        });
      }

      // Récupérer le nom du client pour les notifications
      const [clientProfile] = await db.query(
        'SELECT company_name FROM client_profiles WHERE user_id = ?',
        [clientId]
      );
      // 🔧 VALIDATION EXPERT - Éviter undefined dans missions
      const clientCompanyName = (clientProfile[0]?.company_name) || 'Un client';

      // Récupérer le nom du secteur pour les notifications
      const [secteurInfo] = await db.query(
        'SELECT nom FROM secteurs WHERE id = ?',
        [secteur_id]
      );
      const secteurName = (secteurInfo[0]?.nom) || `Secteur ${secteur_id}`;

      // ⚠️ Warning si paramètres undefined détectés
      if (!clientProfile[0]?.company_name || !secteurInfo[0]?.nom || !mission_name) {
        console.warn('🚨 [MISSION] Nouvelle mission avec paramètres undefined:', {
          originalCompanyName: clientProfile[0]?.company_name,
          originalSecteurName: secteurInfo[0]?.nom,
          originalMissionName: mission_name,
          clientId,
          secteur_id,
          fallbackApplied: true
        });
      }

      // Géocodage avec fallback pour la ville
      let latitude = null, longitude = null, city = null;
      try {
        const geoResponse = await geocodingClient.forwardGeocode({
          query: `${address}, France`,
          limit: 1
        }).send();

        if (geoResponse.body.features.length > 0) {
          [longitude, latitude] = geoResponse.body.features[0].center;

          // Extraire la ville depuis le contexte (plusieurs méthodes)
          const feature = geoResponse.body.features[0];

          // Méthode 1: Contexte place
          const placeContext = feature.context?.find(c => c.id.startsWith('place'));
          if (placeContext) {
            city = placeContext.text;
          }

          // Méthode 2: Si pas trouvé, utiliser locality
          if (!city) {
            const localityContext = feature.context?.find(c => c.id.startsWith('locality'));
            if (localityContext) {
              city = localityContext.text;
            }
          }

          // Méthode 3: Extraire de l'adresse complète
          if (!city && feature.place_name) {
            const addressParts = feature.place_name.split(',').map(p => p.trim());
            // Prendre la première partie qui ne contient pas de chiffres (probablement la ville)
            for (const part of addressParts) {
              if (!/\d/.test(part) && part.length > 2) {
                city = part;
                break;
              }
            }
          }

          console.log('🗺️ Géocodage réussi:', {
            address,
            latitude,
            longitude,
            city,
            fullResponse: feature
          });
        }
      } catch (geoError) {
        console.error('Geocoding error:', geoError);
      }

      // FALLBACK CRITIQUE: Si aucune ville trouvée, extraire de l'adresse
      if (!city && address) {
        // Essayer d'extraire la ville de l'adresse manuellement
        const addressParts = address.split(',').map(p => p.trim());

        console.log('🔍 Extraction ville depuis adresse:', { address, addressParts });

        // Méthode 1: Chercher un pattern "CODE_POSTAL VILLE"
        for (const part of addressParts) {
          // Pattern: "13006 Marseille" ou "75001 Paris"
          const match = part.match(/^\d{5}\s+(.+)$/);
          if (match && match[1]) {
            city = match[1].trim();
            console.log('✅ Ville extraite via code postal:', city);
            break;
          }
        }

        // Méthode 2: Si pas trouvé, chercher un mot sans chiffre (sauf mots clés)
        if (!city) {
          const excludedWords = ['rue', 'avenue', 'boulevard', 'av', 'bd', 'france', 'entrée', 'etage', 'bâtiment'];

          for (const part of addressParts) {
            const lowerPart = part.toLowerCase();
            const hasNumber = /\d/.test(part);
            const isExcluded = excludedWords.some(word => lowerPart.includes(word));

            if (!hasNumber && !isExcluded && part.length > 2) {
              city = part.trim();
              console.log('✅ Ville extraite via mots clés:', city);
              break;
            }
          }
        }

        // Méthode 3: Prendre l'avant-dernière partie (avant "France")
        if (!city && addressParts.length >= 2) {
          const potentialCity = addressParts[addressParts.length - 2];
          // Nettoyer le code postal si présent
          const cleanedCity = potentialCity.replace(/^\d{5}\s*/, '').trim();
          if (cleanedCity && cleanedCity.length > 2) {
            city = cleanedCity;
            console.log('✅ Ville extraite via position (avant-dernière):', city);
          }
        }

        // Si toujours aucune ville, utiliser "France" par défaut
        if (!city) {
          city = 'France';
          console.warn('⚠️ Impossible d\'extraire la ville, utilisation de "France"');
        }

        console.log('🚨 FALLBACK VILLE:', {
          originalAddress: address,
          extractedCity: city
        });
      }

      // Valeurs par défaut
      const finalWorkTime = work_time || 'jour';
      const finalBillingFrequency = billing_frequency || 'jour';
      const finalLocationType = location_type || 'sur_site';
      const finalNbAutomobs = nb_automobs || 1;
      const finalMaxHours = max_hours || 8;

      // Calculer le budget (tarif horaire × heures max)
      // Le budget sera calculé après le total_hours plus bas pour plus de précision
      // const budget = parseFloat(hourly_rate) * parseInt(finalMaxHours);

      console.log('Création mission avec les données:', {
        clientId,
        mission_name,
        finalWorkTime,
        secteur_id,
        finalBillingFrequency,
        finalMaxHours,
        hourly_rate,
        finalLocationType,
        address,
        city
      });

      // Calculer la durée en jours
      let daysDiff = 1;
      if (start_date && end_date) {
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      }

      // Calculer total_hours en fonction de la fréquence de facturation
      let totalHours = parseFloat(finalMaxHours);
      
      if (finalBillingFrequency === 'jour') {
        // Si c'est par jour, on multiplie par le nombre de jours
        totalHours = parseFloat(finalMaxHours) * daysDiff;
      } else if (finalBillingFrequency === 'semaine') {
        // Si c'est par semaine, on calcule le nombre de semaines (même partielles)
        const weeks = daysDiff / 7;
        totalHours = parseFloat(finalMaxHours) * weeks;
      } else if (finalBillingFrequency === 'mois') {
        // Si c'est par mois, on calcule le nombre de mois (approximatif 30 jours)
        const months = daysDiff / 30;
        totalHours = parseFloat(finalMaxHours) * months;
      }

      // Calculer le budget final basé sur le total des heures
      const budget = parseFloat(hourly_rate) * totalHours;

      // Construire dynamiquement l'INSERT selon les colonnes existantes
      const [columnsInfo] = await db.query('SHOW COLUMNS FROM missions');
      const colSet = new Set(columnsInfo.map(c => c.Field));

      const insertCols = [];
      const insertVals = [];

      // Colonnes minimales
      // VALIDATION CRITIQUE: S'assurer que toutes les valeurs sont saines
      const safeCity = city || 'France'; // Ne jamais laisser NULL
      const safeDescription = (description && typeof description === 'string' && description.length < 5000)
        ? description.substring(0, 2000) // Limiter à 2000 caractères
        : 'Description non fournie';

      if (colSet.has('client_id')) { insertCols.push('client_id'); insertVals.push(clientId); }
      if (colSet.has('mission_name')) { insertCols.push('mission_name'); insertVals.push(mission_name); }
      if (colSet.has('title')) { insertCols.push('title'); insertVals.push(mission_name); }
      if (colSet.has('work_time')) { insertCols.push('work_time'); insertVals.push(finalWorkTime); }
      if (colSet.has('secteur_id')) { insertCols.push('secteur_id'); insertVals.push(secteur_id); }
      if (colSet.has('billing_frequency')) { insertCols.push('billing_frequency'); insertVals.push(finalBillingFrequency); }
      if (colSet.has('max_hours')) { insertCols.push('max_hours'); insertVals.push(finalMaxHours); }
      if (colSet.has('hourly_rate')) { insertCols.push('hourly_rate'); insertVals.push(hourly_rate); }
      if (colSet.has('location_type')) { insertCols.push('location_type'); insertVals.push(finalLocationType); }
      if (colSet.has('address')) { insertCols.push('address'); insertVals.push(address); }
      if (colSet.has('city')) { insertCols.push('city'); insertVals.push(safeCity); }
      if (colSet.has('latitude')) { insertCols.push('latitude'); insertVals.push(latitude); }
      if (colSet.has('longitude')) { insertCols.push('longitude'); insertVals.push(longitude); }
      if (colSet.has('description')) { insertCols.push('description'); insertVals.push(safeDescription); }

      // Gestion du nombre d'automobs
      if (colSet.has('automobs_needed')) {
        insertCols.push('automobs_needed');
        insertVals.push(finalNbAutomobs);
      } else if (colSet.has('nb_automobs')) {
        insertCols.push('nb_automobs');
        insertVals.push(finalNbAutomobs);
      }

      if (colSet.has('start_date')) { insertCols.push('start_date'); insertVals.push(start_date); }
      if (colSet.has('end_date')) { insertCols.push('end_date'); insertVals.push(end_date); }
      if (colSet.has('start_time')) { insertCols.push('start_time'); insertVals.push(start_time); }
      if (colSet.has('end_time')) { insertCols.push('end_time'); insertVals.push(end_time); }

      // Budget requis dans le schéma de base
      if (colSet.has('budget')) {
        const safeBudget = Number.isFinite(budget) ? budget : 0;
        insertCols.push('budget'); insertVals.push(safeBudget);
      }
      if (colSet.has('total_hours')) { insertCols.push('total_hours'); insertVals.push(totalHours); }
      if (colSet.has('status')) { insertCols.push('status'); insertVals.push('ouvert'); }

      const placeholders = insertCols.map(() => '?').join(', ');
      const sql = `INSERT INTO missions (${insertCols.join(', ')}) VALUES (${placeholders})`;

      // 🚨 DEBUG CRITIQUE: Valider avant insertion
      console.log('🔍 VALIDATION PRE-INSERTION:', {
        sql: sql.substring(0, 200) + '...',
        valuesCount: insertVals.length,
        cityValue: safeCity,
        descriptionLength: safeDescription.length,
        mission_name,
        clientId
      });

      // Vérifier qu'aucune valeur critique n'est NULL
      const nullIndexes = insertVals.map((val, index) => val === null ? index : -1).filter(i => i >= 0);
      if (nullIndexes.length > 0) {
        console.error('🚨 VALEURS NULL DÉTECTÉES:', nullIndexes.map(i => ({
          column: insertCols[i],
          value: insertVals[i]
        })));
      }

      const [result] = await db.query(sql, insertVals);

      const missionId = result.insertId;

      // Ajouter les compétences requises (si la table existe)
      try {
        const [[tbl]] = await db.query(
          `SELECT COUNT(*) as cnt FROM information_schema.tables 
           WHERE table_schema = DATABASE() AND table_name = 'mission_competences'`
        );
        if (tbl && tbl.cnt > 0) {
          for (const competence_id of competences_ids) {
            await db.query(
              'INSERT INTO mission_competences (mission_id, competence_id) VALUES (?, ?)',
              [missionId, competence_id]
            );
          }
        } else {
          console.warn('Table mission_competences absente, insertion des compétences ignorée');
        }
      } catch (mcErr) {
        console.error('Erreur lors de l\'insertion des compétences (ignorée):', mcErr.message);
      }

      // ✨ OPTIMISATION: Répondre immédiatement, puis envoyer les notifications en arrière-plan
      console.log(`✨ Mission créée avec succès: ${missionId}`);

      // Répondre immédiatement au client pour éviter le timeout
      res.status(201).json({
        message: 'Mission créée avec succès',
        mission: {
          id: missionId,
          mission_name,
          status: 'ouvert'
        },
        coordinates: { latitude, longitude },
        automobs_found: 0, // Sera mis à jour en arrière-plan
        automobs_notified: 0 // Sera mis à jour en arrière-plan
      });

      // 🚀 NOUVEAU SYSTÈME EXPERT - Publication unifiée des notifications
      setImmediate(async () => {
        try {
          console.log(`🔄 [EXPERT] Début du traitement unifié des notifications pour mission ${missionId}`);

          // Préparer les données de la mission pour le service expert
          const missionData = {
            id: missionId,
            mission_name,
            hourly_rate,
            city: safeCity,
            secteur_id,
            description: safeDescription,
            start_date,
            end_date,
            client_id: clientId
          };

          const clientData = {
            id: clientId,
            company_name: clientCompanyName
          };

          const io = req.app?.get('io');

          // 📢 UTILISER LE SERVICE EXPERT UNIFIÉ
          const notificationResults = await MissionNotificationService.publishMissionNotifications(
            missionData,
            clientData,
            competences_ids,
            io
          );

          // 📊 Notifier le client du succès
          await MissionNotificationService.notifyClientOfPublication(
            clientId,
            missionData,
            notificationResults,
            io
          );

          console.log(`📊 [EXPERT] Résumé final de publication:`);
          console.log(`   - ${notificationResults.eligible_automobs} automobs éligibles`);
          console.log(`   - ${notificationResults.notifications_sent} notifications in-app`);
          console.log(`   - ${notificationResults.web_push_sent} Web Push`);
          console.log(`   - ${notificationResults.fcm_sent} FCM mobile`);
          console.log(`   - ${notificationResults.emails_sent} emails`);
          console.log(`   - ${notificationResults.sms_sent} SMS`);

          // Email de confirmation détaillé au client
          const [clientUser] = await db.query('SELECT email FROM users WHERE id = ?', [clientId]);
          if (clientUser.length > 0) {
            const html = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #A52450;">✅ Mission publiée avec succès !</h2>
                
                <p>Bonjour ${clientCompanyName},</p>
                
                <p>Votre mission a été publiée avec succès sur NettmobFrance.</p>
                
                <div style="background-color: #FFF5F8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #A52450;">
                  <h3 style="margin-top: 0; color: #A52450;">${mission_name}</h3>
                  <p style="margin: 5px 0;"><strong>📍 Lieu:</strong> ${safeCity || address}</p>
                  <p style="margin: 5px 0;"><strong>📅 Période:</strong> ${new Date(start_date).toLocaleDateString('fr-FR')} au ${new Date(end_date).toLocaleDateString('fr-FR')}</p>
                  <p style="margin: 5px 0;"><strong>💰 Tarif:</strong> ${hourly_rate}€/h</p>
                  <p style="margin: 5px 0;"><strong>⏰ Heures max:</strong> ${finalMaxHours}h</p>
                  <p style="margin: 5px 0;"><strong>👥 Automobs requis:</strong> ${finalNbAutomobs}</p>
                </div>
                
                <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
                  <p style="margin: 0;"><strong>🎯 ${notificationResults.eligible_automobs} automobs qualifiés</strong> ont été notifiés de votre mission.</p>
                  <p style="margin: 5px 0; font-size: 14px;">
                    📲 ${notificationResults.web_push_sent} Web Push • 🔥 ${notificationResults.fcm_sent} FCM • 📧 ${notificationResults.emails_sent} emails • 📱 ${notificationResults.sms_sent} SMS
                  </p>
                  <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">Vous recevrez une notification dès qu'un automob postulera.</p>
                </div>
                
                <div style="margin: 30px 0;">
                  <a href="${process.env.FRONTEND_URL}/client/missions" 
                     style="background-color: #A52450; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Voir mes missions
                  </a>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                  Cet email a été envoyé automatiquement par NettmobFrance.
                </p>
              </div>
            `;

            await sendNotificationEmail(
              clientUser[0].email,
              '✅ Mission publiée avec succès',
              html
            );
          }

          console.log(`🎉 [EXPERT] Traitement unifié des notifications terminé pour mission ${missionId}`);
        } catch (asyncError) {
          console.error(`❌ [EXPERT] Erreur traitement notifications pour mission ${missionId}:`, asyncError);
        }
      });
    } catch (error) {
      console.error('Create mission error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        sqlMessage: error.sqlMessage,
        sql: error.sql
      });
      res.status(500).json({
        error: 'Erreur lors de la création de la mission',
        details: error.message,
        code: error.code
      });
    }
  }
);

// Re-notify automobs for existing missions based on strict criteria (admin only)
router.post('/re-notify', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { mission_id, since_days, limit } = req.body || {};
  const days = Number.isFinite(parseInt(since_days)) ? parseInt(since_days) : 30;
  const maxMissions = Number.isFinite(parseInt(limit)) ? parseInt(limit) : 50;
  const io = req.app?.get('io');

  try {
    let missions = [];
    if (mission_id) {
      const [rows] = await db.query('SELECT * FROM missions WHERE id = ?', [mission_id]);
      missions = rows;
    } else {
      const [rows] = await db.query(
        `SELECT * FROM missions 
         WHERE status = 'ouvert' 
           AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
         ORDER BY created_at DESC
         LIMIT ?`,
        [days, maxMissions]
      );
      missions = rows;
    }

    if (missions.length === 0) {
      return res.json({ message: 'Aucune mission à traiter', processed: 0, details: [] });
    }

    const summary = [];
    let totalEligible = 0;
    let totalNotifs = 0;
    let totalFCM = 0;
    let totalEmails = 0;

    for (const m of missions) {
      const missionId = m.id;
      const secteurId = m.secteur_id;
      const missionCity = m.city;
      const missionStart = m.start_date;
      const missionEnd = m.end_date;
      const missionTitle = m.mission_name || m.title || 'Mission';

      // Skip if no city or dates (strict requirements)
      if (!missionCity || !missionStart || !missionEnd || !secteurId) {
        summary.push({ missionId, skipped: true, reason: 'Ville/dates/secteur manquants' });
        continue;
      }

      // Compétences requises
      let competences_ids = [];
      try {
        const [rows] = await db.query('SELECT competence_id FROM mission_competences WHERE mission_id = ?', [missionId]);
        competences_ids = rows.map(r => r.competence_id);
      } catch (e) {
        // If table missing, skip
        summary.push({ missionId, skipped: true, reason: 'Table mission_competences absente' });
        continue;
      }
      if (competences_ids.length === 0) {
        summary.push({ missionId, skipped: true, reason: 'Aucune compétence liée' });
        continue;
      }

      // Client company name for FCM body
      const [clientProfile] = await db.query('SELECT company_name FROM client_profiles WHERE user_id = ?', [m.client_id]);
      const clientCompanyName = (clientProfile[0]?.company_name) || 'Un client';

      // ⚠️ Warning si paramètres undefined détectés pour re-notify
      if (!clientProfile[0]?.company_name || !m.mission_name) {
        console.warn('🚨 [MISSION RE-NOTIFY] Paramètres undefined détectés:', {
          originalCompanyName: clientProfile[0]?.company_name,
          originalMissionName: m.mission_name,
          missionId: id,
          clientId: m.client_id,
          fallbackApplied: true
        });
      }

      // Automobs matching competences (flexible sector matching)
      const [automobs] = await db.query(`
        SELECT DISTINCT u.id, u.email, ap.first_name, ap.last_name, ap.city, ap.work_areas, 
               ap.availability_start_date, ap.availability_end_date, ap.id_verified, ap.secteur_id,
               ap.web_push_enabled, ap.web_push_subscription, ap.id AS automob_profile_id
        FROM users u
        JOIN automob_profiles ap ON u.id = ap.user_id
        JOIN automob_competences ac ON ap.id = ac.automob_profile_id
        WHERE u.role = 'automob' AND u.verified = TRUE 
          AND ac.competence_id IN (${competences_ids.map(() => '?').join(',')})
          AND ap.id_verified = 1
      `, competences_ids);

      // Load detailed availabilities if present
      let availabilityMap = new Map();
      try {
        const [[tblAvail]] = await db.query(`
          SELECT COUNT(*) as cnt FROM information_schema.tables 
          WHERE table_schema = DATABASE() AND table_name = 'automob_availabilities'`);
        if (tblAvail && tblAvail.cnt > 0 && automobs.length > 0) {
          const [availCols] = await db.query('SHOW COLUMNS FROM automob_availabilities');
          const hasUserId = availCols.some(c => c.Field === 'user_id');
          const hasProfileId = availCols.some(c => c.Field === 'automob_profile_id');

          if (hasUserId) {
            const ids = automobs.map(a => a.id);
            const placeholders = ids.map(() => '?').join(',');
            const [rows] = await db.query(
              `SELECT user_id AS key_id, start_date, end_date FROM automob_availabilities WHERE user_id IN (${placeholders})`,
              ids
            );
            for (const r of rows) {
              if (!availabilityMap.has(r.key_id)) availabilityMap.set(r.key_id, []);
              availabilityMap.get(r.key_id).push({ start: new Date(r.start_date), end: new Date(r.end_date) });
            }
          } else if (hasProfileId) {
            const profileToUser = new Map();
            for (const a of automobs) {
              if (a.automob_profile_id) profileToUser.set(a.automob_profile_id, a.id);
            }
            const profileIds = automobs.map(a => a.automob_profile_id).filter(Boolean);
            if (profileIds.length > 0) {
              const placeholders = profileIds.map(() => '?').join(',');
              const [rows] = await db.query(
                `SELECT automob_profile_id AS key_id, start_date, end_date FROM automob_availabilities WHERE automob_profile_id IN (${placeholders})`,
                profileIds
              );
              for (const r of rows) {
                const userId = profileToUser.get(r.key_id);
                if (!userId) continue;
                if (!availabilityMap.has(userId)) availabilityMap.set(userId, []);
                availabilityMap.get(userId).push({ start: new Date(r.start_date), end: new Date(r.end_date) });
              }
            }
          }
        }
      } catch (e) {
        console.error('[re-notify] Erreur chargement disponibilités (ignorée):', e.message);
      }

      // Filter by city and full availability cover
      const city = missionCity;
      const start_date = missionStart;
      const end_date = missionEnd;
      const eligibleAutomobs = automobs.filter(automob => {
        let cityMatch = false;
        if (city) {
          // Si ville = "France" (fallback), accepter tous les automobs
          if (city.toLowerCase() === 'france') {
            console.log(`   ℹ️ [re-notify] Ville "France" détectée pour mission ${missionId} → notification nationale`);
            cityMatch = true;
          } else {
            // Ville du profil (adresse)
            if (automob.city && automob.city.toLowerCase() === city.toLowerCase()) {
              cityMatch = true;
            }

            // Villes de travail (work_areas)
            if (!cityMatch && automob.work_areas) {
              try {
                let workAreas;

                // Gérer les 3 formats possibles : Array déjà parsé, JSON string, ou CSV string
                if (Array.isArray(automob.work_areas)) {
                  // Déjà un array (cas où MySQL retourne directement l'array)
                  workAreas = automob.work_areas;
                } else if (typeof automob.work_areas === 'string') {
                  // C'est une string, déterminer si JSON ou CSV
                  if (automob.work_areas.startsWith('[')) {
                    workAreas = JSON.parse(automob.work_areas);
                  } else {
                    workAreas = automob.work_areas.split(',').map(s => s.trim());
                  }
                } else {
                  workAreas = [];
                }

                if (Array.isArray(workAreas)) {
                  cityMatch = workAreas.some(area =>
                    area && typeof area === 'string' && area.toLowerCase() === city.toLowerCase()
                  );
                }
              } catch (e) {
                console.error('Erreur parsing work_areas pour filtrage:', e);
              }
            }
          }
        } else {
          cityMatch = true; // Pas de ville spécifiée = tous éligibles
        }

        // Vérifier disponibilité
        let availabilityMatch = false;
        if (start_date && end_date) {
          const missionStartDate = new Date(start_date);
          const missionEndDate = new Date(end_date);

          if (automob.availability_start_date && automob.availability_end_date) {
            const availStart = new Date(automob.availability_start_date);
            const availEnd = new Date(automob.availability_end_date);
            availabilityMatch = missionStartDate >= availStart && missionEndDate <= availEnd;
          } else {
            // Pas de disponibilité définie = disponible par défaut
            availabilityMatch = true;
          }
        } else {
          // Pas de dates de mission = tous disponibles
          availabilityMatch = true;
        }

        return cityMatch && availabilityMatch;
      });

      const eligibleIds = eligibleAutomobs.map(a => a.id);
      totalEligible += eligibleIds.length;

      // Initialize counters for this mission
      let sentNotifs = 0;
      let sentFCM = 0;
      let sentEmails = 0;

      // Deduplicate: skip users who already have a notification for this mission
      let newIds = eligibleIds;
      if (eligibleIds.length > 0) {
        const actionUrl = `/automob/missions/${missionId}`;
        const placeholders = eligibleIds.map(() => '?').join(',');
        const [existing] = await db.query(
          `SELECT DISTINCT user_id FROM notifications WHERE action_url = ? AND category = 'mission' AND user_id IN (${placeholders})`,
          [actionUrl, ...eligibleIds]
        );
        const alreadySet = new Set(existing.map(r => r.user_id));
        newIds = eligibleIds.filter(id => !alreadySet.has(id));

        // Mission data for email
        const missionData = {
          id: missionId,
          mission_name: missionTitle,
          hourly_rate: m.hourly_rate,
          city: missionCity,
          secteur_id: secteurId,
          description: m.description,
          start_date: missionStart
        };

        // Send notifications and emails to new automobs only
        if (newIds.length > 0) {
          console.log(`   ℹ️ [re-notify] Envoi notifications à ${newIds.length} nouveaux automobs...`);

          // 1. Create in-app notifications
          try {
            const notificationData = newIds.map(user_id => [
              user_id,
              '🆕 Nouvelle mission disponible !',
              `Mission "${missionTitle}" disponible à ${missionCity} (${m.hourly_rate}€/h)`,
              'mission',
              `/automob/missions/${missionId}`,
              new Date()
            ]);

            await db.query(
              `INSERT INTO notifications (user_id, title, message, category, action_url, created_at) VALUES ?`,
              [notificationData]
            );

            sentNotifs = newIds.length;
            console.log(`   ✅ [re-notify] ${sentNotifs} notifications internes créées`);
          } catch (e) {
            console.error('[re-notify] Erreur notifications internes:', e.message);
          }

          // 2. Send FCM push notifications
          try {
            const fcmAutomobs = eligibleAutomobs.filter(a =>
              newIds.includes(a.id) &&
              a.web_push_enabled &&
              a.web_push_subscription
            );

            if (fcmAutomobs.length > 0) {
              const fcmTitle = '🆕 Nouvelle mission disponible !';
              const fcmBody = `Mission "${missionTitle}" à ${missionCity} - ${m.hourly_rate}€/h par ${clientCompanyName}`;

              const fcmPromises = fcmAutomobs.map(async (automob) => {
                try {
                  let subscription = JSON.parse(automob.web_push_subscription);
                  await webpush.sendNotification(subscription, JSON.stringify({
                    title: fcmTitle,
                    body: fcmBody,
                    icon: '/badge-72x72.png',
                    badge: '/badge-72x72.png',
                    data: { action_url: `/automob/missions/${missionId}` }
                  }));
                  return true;
                } catch (e) {
                  console.error(`[re-notify] FCM error ${automob.email}:`, e.message);
                  return false;
                }
              });

              const fcmResults = await Promise.all(fcmPromises);
              sentFCM = fcmResults.filter(Boolean).length;
              console.log(`   ✅ [re-notify] ${sentFCM}/${fcmAutomobs.length} FCM envoyés`);
            }
          } catch (e) {
            console.error('[re-notify] Erreur FCM:', e.message);
          }

          // 3. Send emails
          const newAutomobs = eligibleAutomobs.filter(a => newIds.includes(a.id));
          for (const automob of newAutomobs) {
            try {
              const fullName = `${automob.first_name} ${automob.last_name || ''}`.trim();
              const emailSent = await sendNewMissionEmail(automob.email, fullName, missionData);
              if (emailSent) sentEmails++;
            } catch (e) {
              console.error(`[re-notify] Erreur email ${automob.email}:`, e.message);
            }
          }

          console.log(`   📊 [re-notify] Résumé mission ${missionId}: ${sentNotifs} notifs, ${sentFCM} FCM, ${sentEmails} emails`);
        } else {
          console.log(`   ℹ️ [re-notify] Mission ${missionId}: tous les automobs éligibles déjà notifiés`);
        }
      }

      totalNotifs += sentNotifs;
      totalFCM += sentFCM;
      totalEmails += sentEmails;

      summary.push({ missionId, eligible: eligibleIds.length, notified: sentNotifs, fcm: sentFCM, emails: sentEmails });
    }

    res.json({ processed: missions.length, totalEligible, totalNotifs, totalFCM, totalEmails, details: summary });
  } catch (error) {
    console.error('❌ Re-notify error:', error);
    res.status(500).json({ error: 'Erreur lors du ré-envoi des notifications', details: error.message });
  }
});

// Update mission (client only)
router.put('/:id',
  authenticateToken,
  authorizeRoles('client'),
  async (req, res) => {
    const { id } = req.params;
    const {
      mission_name,
      description,
      start_date,
      end_date,
      start_time,
      end_time,
      hourly_rate,
      nb_automobs,
      address,
      city,
      postal_code,
      status
    } = req.body;

    try {
      // Vérifier que la mission appartient au client
      const [missions] = await db.query(
        'SELECT * FROM missions WHERE id = ? AND client_id = ?',
        [id, req.user.id]
      );

      if (missions.length === 0) {
        return res.status(404).json({ error: 'Mission non trouvée ou accès non autorisé' });
      }

      const mission = missions[0];

      // Si on marque la mission comme terminée
      if (status === 'termine' && mission.status !== 'termine') {
        // Mettre à jour le statut de la mission
        await db.query('UPDATE missions SET status = ? WHERE id = ?', ['termine', id]);

        // Marquer tous les automobs de cette mission comme terminés
        await db.query(
          'UPDATE mission_automobs SET status = "termine", completed_at = NOW() WHERE mission_id = ?',
          [id]
        );

        // Récupérer tous les automobs de cette mission
        const [automobs] = await db.query(`
          SELECT ma.automob_id, u.email, ap.first_name, ap.last_name
          FROM mission_automobs ma
          JOIN users u ON ma.automob_id = u.id
          LEFT JOIN automob_profiles ap ON ma.automob_id = ap.user_id
          WHERE ma.mission_id = ?
        `, [id]);

        // Notifier tous les automobs
        for (const automob of automobs) {
          const automobName = (automob.first_name && automob.last_name)
            ? `${automob.first_name} ${automob.last_name}`
            : automob.email || 'Automob';

          await createNotification(
            automob.automob_id,
            '🎉 Mission terminée !',
            `La mission "${mission.mission_name}" a été marquée comme terminée par le client.`,
            'success',
            'mission',
            '/automob/my-missions'
          );

          // Email automob
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #3A559F;">🎉 Mission terminée !</h2>
              
              <p>Bonjour ${automobName},</p>
              
              <p>Félicitations ! Le client a marqué la mission comme terminée.</p>
              
              <div style="background-color: #F0FDF4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
                <h3 style="margin-top: 0; color: #16a34a;">${mission.mission_name}</h3>
                <p style="margin: 5px 0;">Cette mission est maintenant complétée.</p>
              </div>
              
              <div style="margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/automob/my-missions" 
                   style="background-color: #3A559F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Voir mes missions
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                Cet email a été envoyé automatiquement par NettmobFrance.
              </p>
            </div>
          `;

          await sendNotificationEmail(
            automob.email,
            '🎉 Mission terminée',
            html
          );
        }

        return res.json({ message: 'Mission marquée comme terminée pour tous les automobs' });
      }

      // Sinon, mise à jour normale
      await db.query(
        `UPDATE missions SET 
          mission_name = ?,
          description = ?,
          start_date = ?,
          end_date = ?,
          start_time = ?,
          end_time = ?,
          hourly_rate = ?,
          nb_automobs = ?,
          address = ?,
          city = ?,
          postal_code = ?
        WHERE id = ?`,
        [
          mission_name,
          description,
          start_date,
          end_date,
          start_time,
          end_time,
          hourly_rate,
          nb_automobs,
          address,
          city,
          postal_code,
          id
        ]
      );

      res.json({ message: 'Mission mise à jour avec succès' });
    } catch (error) {
      console.error('Update mission error:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour de la mission' });
    }
  }
);

// Delete mission (client only)
router.delete('/:id',
  authenticateToken,
  authorizeRoles('client'),
  async (req, res) => {
    const { id } = req.params;

    try {
      // Vérifier que la mission appartient au client
      const [missions] = await db.query(
        'SELECT * FROM missions WHERE id = ? AND client_id = ?',
        [id, req.user.id]
      );

      if (missions.length === 0) {
        return res.status(404).json({ error: 'Mission non trouvée ou accès non autorisé' });
      }

      // Supprimer la mission (cascade supprimera les candidatures)
      await db.query('DELETE FROM missions WHERE id = ?', [id]);

      res.json({ message: 'Mission supprimée avec succès' });
    } catch (error) {
      console.error('Delete mission error:', error);
      res.status(500).json({ error: 'Erreur lors de la suppression de la mission' });
    }
  }
);

// Apply to mission (automob only)
router.post('/:id/apply',
  authenticateToken,
  authorizeRoles('automob'),
  async (req, res) => {
    const { id } = req.params;
    const { message } = req.body;
    const automobId = req.user.id;

    try {
      // Vérifier si le profil de l'automob est vérifié
      const [automobProfile] = await db.query(
        'SELECT id_verified FROM automob_profiles WHERE user_id = ?',
        [automobId]
      );

      if (automobProfile.length === 0 || !automobProfile[0].id_verified) {
        return res.status(403).json({
          error: 'Profil non vérifié',
          message: 'Vous devez vérifier votre profil avant de postuler à une mission',
          requiresVerification: true,
          verificationUrl: '/automob/verify-identity'
        });
      }

      const [missions] = await db.query('SELECT * FROM missions WHERE id = ? AND status IN ("ouvert", "en_cours")', [id]);
      if (missions.length === 0) {
        return res.status(404).json({ error: 'Mission non disponible' });
      }

      // Vérifier s'il y a une candidature existante non refusée
      const [existing] = await db.query(
        'SELECT id, status FROM mission_applications WHERE mission_id = ? AND automob_id = ? AND status != "refuse"',
        [id, automobId]
      );
      if (existing.length > 0) {
        return res.status(400).json({
          error: 'Vous avez déjà postulé à cette mission',
          existingStatus: existing[0].status
        });
      }

      // Supprimer les anciennes candidatures refusées pour permettre une nouvelle candidature
      await db.query(
        'DELETE FROM mission_applications WHERE mission_id = ? AND automob_id = ? AND status = "refuse"',
        [id, automobId]
      );

      // Vérifier le nombre de candidatures
      const mission = missions[0];
      const automobsNeeded = mission.automobs_needed || 1;
      const maxApplications = mission.max_applications || (automobsNeeded + Math.ceil(automobsNeeded * 0.2));

      const [applicationCount] = await db.query(
        'SELECT COUNT(*) as count FROM mission_applications WHERE mission_id = ?',
        [id]
      );

      if (applicationCount[0].count >= maxApplications) {
        return res.status(400).json({
          error: `Cette mission a atteint le nombre maximum de candidatures (${maxApplications})`
        });
      }

      await db.query(
        'INSERT INTO mission_applications (mission_id, automob_id, message) VALUES (?, ?, ?)',
        [id, automobId, message]
      );

      const missionTitle = mission.mission_name || mission.title || 'une mission';

      // Récupérer les infos de l'automob et du client
      const [automobInfo] = await db.query(
        'SELECT u.email, ap.first_name, ap.last_name FROM users u LEFT JOIN automob_profiles ap ON u.id = ap.user_id WHERE u.id = ?',
        [automobId]
      );

      const [clientInfo] = await db.query(
        'SELECT u.email, cp.first_name, cp.last_name, cp.company_name FROM users u LEFT JOIN client_profiles cp ON u.id = cp.user_id WHERE u.id = ?',
        [mission.client_id]
      );

      const automobName = automobInfo[0] ? `${automobInfo[0].first_name} ${automobInfo[0].last_name}` : 'Automob';
      const clientName = clientInfo[0] ? (clientInfo[0].company_name || `${clientInfo[0].first_name} ${clientInfo[0].last_name}`) : 'Client';

      // Notification au Client
      const io = req.app.get('io');
      await createNotification(
        mission.client_id,
        'Nouvelle candidature',
        `${automobName} a postulé pour "${missionTitle}"`,
        'info',
        'mission',
        `/client/missions/${id}`,
        io
      );

      // FCM push notification au client
      try {
        await notifyNewApplication(mission.client_id, automobName, missionTitle, id);
      } catch (fcmError) {
        console.error('❌ Erreur FCM notification nouvelle candidature:', fcmError.message);
      }

      // Notification à l'Automob (confirmation)
      await createNotification(
        automobId,
        'Candidature envoyée',
        `Votre candidature pour "${missionTitle}" a été envoyée avec succès.`,
        'info',
        'mission',
        `/automob/my-applications`,
        io
      );

      // Emails
      if (automobInfo[0]?.email) {
        sendApplicationConfirmationEmail(automobInfo[0].email, automobName, missionTitle, id).catch(err =>
          console.error('Erreur email confirmation:', err)
        );
      }

      if (clientInfo[0]?.email) {
        sendNewApplicationEmail(clientInfo[0].email, clientName, automobName, missionTitle, id).catch(err =>
          console.error('Erreur email nouvelle candidature:', err)
        );
      }

      res.status(201).json({ message: 'Candidature envoyée', success: true });
    } catch (error) {
      console.error('Apply error detailed stack:', error.stack || error);
      res.status(500).json({ error: 'Erreur lors de la candidature', details: error.message, stack: error.stack });
    }
  }
);

// Accept/Reject application (client and admin)
router.patch('/:missionId/applications/:applicationId',
  authenticateToken,
  authorizeRoles('client', 'admin'),
  async (req, res) => {
    try {
      const { missionId, applicationId } = req.params;
      const { status } = req.body;

      console.log('� [APPLICATION_UPDATE] Début:', { missionId, applicationId, status, userId: req.user.id });

      if (!['accepte', 'refuse'].includes(status)) {
        console.error('❌ Statut invalide:', status);
        return res.status(400).json({ error: 'Statut invalide' });
      }

      try {
        const [applications] = await db.query(`
        SELECT ma.*, m.client_id, 
               COALESCE(m.mission_name, m.title) as mission_title,
               m.mission_name, m.title, m.status as mission_status,
               m.nb_automobs as automobs_needed
        FROM mission_applications ma
        JOIN missions m ON ma.mission_id = m.id
        WHERE ma.id = ? AND ma.mission_id = ?
      `, [applicationId, missionId]);

        console.log('📊 [APPLICATION_UPDATE] Applications trouvées:', applications.length);

        if (applications.length === 0) {
          return res.status(404).json({ error: 'Candidature non trouvée' });
        }

        const application = applications[0];

        // Admin peut tout modifier, client seulement ses propres missions
        if (req.user.role !== 'admin' && application.client_id !== req.user.id) {
          return res.status(403).json({ error: 'Accès refusé' });
        }

        // Récupérer les infos complètes AVANT de modifier
        const [missionInfo] = await db.query(
          'SELECT m.*, cp.company_name, cp.first_name as client_first_name, cp.last_name as client_last_name FROM missions m LEFT JOIN client_profiles cp ON m.client_id = cp.user_id WHERE m.id = ?',
          [missionId]
        );

        const [automobInfo] = await db.query(
          'SELECT u.email, ap.first_name, ap.last_name FROM users u LEFT JOIN automob_profiles ap ON u.id = ap.user_id WHERE u.id = ?',
          [application.automob_id]
        );

        const [clientEmail] = await db.query('SELECT email FROM users WHERE id = ?', [application.client_id]);

        console.log('📬 [APPLICATION_UPDATE] Infos récupérées:', {
          missionFound: !!missionInfo[0],
          automobFound: !!automobInfo[0],
          clientEmailFound: !!clientEmail[0]
        });

        const missionTitle = missionInfo[0]?.mission_name || missionInfo[0]?.title || 'la mission';
        const automobName = automobInfo[0] ? `${automobInfo[0].first_name} ${automobInfo[0].last_name}` : 'Auto-mob';
        const clientName = missionInfo[0]?.company_name || `${missionInfo[0]?.client_first_name} ${missionInfo[0]?.client_last_name}` || 'Client';

        // Vérifier le quota pour les acceptations
        let acceptedCountBefore = 0;
        const mission = missionInfo[0];
        const automobsNeeded = application.automobs_needed || mission.nb_automobs || mission.automobs_needed || 1;

        if (status === 'accepte') {
          // Vérifier le nombre d'automobs déjà acceptés AVANT de modifier
          const [acceptedCount] = await db.query(
            'SELECT COUNT(*) as count FROM mission_applications WHERE mission_id = ? AND status = "accepte"',
            [missionId]
          );

          acceptedCountBefore = acceptedCount[0].count;

          // Vérifier si on peut encore accepter
          if (acceptedCountBefore >= automobsNeeded) {
            return res.status(400).json({
              error: `Nombre maximum d'automobs atteint (${automobsNeeded})`
            });
          }
        }

        // Mettre à jour le statut de la candidature
        await db.query('UPDATE mission_applications SET status = ? WHERE id = ?', [status, applicationId]);

        if (status === 'accepte') {

          // Ajouter l'automob à la table mission_automobs avec statut en_cours
          await db.query(
            'INSERT INTO mission_automobs (mission_id, automob_id, status, created_at) VALUES (?, ?, "en_cours", NOW()) ON DUPLICATE KEY UPDATE status = "en_cours"',
            [missionId, application.automob_id]
          );
          console.log('✅ [APPLICATION_UPDATE] mission_automobs mis à jour');

          // Mettre la mission en cours dès qu'un automob est accepté
          await db.query(
            'UPDATE missions SET status = "en_cours" WHERE id = ? AND status != "en_cours"',
            [missionId]
          );

          // Si c'est la première acceptation, définir l'automob assigné
          if (acceptedCountBefore === 0) {
            await db.query(
              'UPDATE missions SET assigned_automob_id = ? WHERE id = ?',
              [application.automob_id, missionId]
            );
          }

          // Refuser les candidatures en trop si on atteint le maximum
          const newAcceptedCount = acceptedCountBefore + 1;
          if (newAcceptedCount >= automobsNeeded) {
            console.log(`🚫 [MISSION_FULL] La mission ${missionId} est complète (${newAcceptedCount}/${automobsNeeded}). Refus automatique des autres candidatures.`);

            // 1. Récupérer les informations des candidats en attente AVANT de les refuser
            const [pendingApplications] = await db.query(
              `SELECT ma.automob_id, u.email, ap.first_name, ap.last_name 
               FROM mission_applications ma
               JOIN users u ON ma.automob_id = u.id
               JOIN automob_profiles ap ON ma.automob_id = ap.user_id
               WHERE ma.mission_id = ? AND ma.status = "en_attente"`,
              [missionId]
            );

            // 2. Mettre à jour le statut en base
            await db.query(
              'UPDATE mission_applications SET status = "refuse" WHERE mission_id = ? AND status = "en_attente"',
              [missionId]
            );

            // 3. Notifier chaque candidat refusé automatiquement
            if (pendingApplications.length > 0) {
              console.log(`📣 Notification de ${pendingApplications.length} candidats refusés automatiquement`);
              
              for (const pending of pendingApplications) {
                const pendingName = `${pending.first_name} ${pending.last_name || ''}`.trim();
                
                // Notification in-app
                createNotification(
                  pending.automob_id,
                  '✉️ Mission complète',
                  `La mission "${missionTitle}" a atteint son quota de participants. Votre candidature n'a pas pu être retenue cette fois-ci.`,
                  'info',
                  'mission',
                  '/automob/missions',
                  io
                ).catch(err => console.error(`❌ Erreur notification in-app refus auto (${pending.automob_id}):`, err.message));

                // FCM Push
                notifyApplicationRejected(pending.automob_id, missionTitle, missionId)
                  .catch(err => console.error(`❌ Erreur FCM refus auto (${pending.automob_id}):`, err.message));

                // Email
                if (pending.email) {
                  sendApplicationRejectedEmail(pending.email, pendingName, missionTitle)
                    .then(() => console.log(`✅ Email refus auto envoyé à: ${pending.email}`))
                    .catch(err => console.error(`❌ Erreur email refus auto (${pending.email}):`, err.message));
                }
              }
            }
          }

          // Notification à l'Automob accepté
          const io = req.app.get('io');
          console.log('🔔 Création notification acceptation pour Automob:', application.automob_id);
          await createNotification(
            application.automob_id,
            '🎉 Candidature acceptée',
            `Votre candidature pour "${missionTitle}" a été acceptée ! La mission est maintenant en cours.`,
            'success',
            'mission',
            `/automob/missions/${missionId}`,
            io
          );

          // FCM push notification pour l'automob accepté
          try {
            await notifyApplicationAccepted(application.automob_id, missionTitle, missionId);
          } catch (fcmError) {
            console.error('❌ Erreur FCM notification acceptation:', fcmError.message);
          }

          // Notification au Client
          console.log('🔔 Création notification mission en cours pour Client:', application.client_id);
          await createNotification(
            application.client_id,
            'Mission en cours',
            `La mission "${missionTitle}" est maintenant en cours avec ${automobName}.`,
            'success',
            'mission',
            `/client/missions/${missionId}`,
            io
          );

          // Email à l'automob
          if (automobInfo[0]?.email) {
            console.log('📧 Envoi email acceptation à:', automobInfo[0].email);
            sendApplicationAcceptedEmail(automobInfo[0].email, automobName, missionTitle, missionId)
              .then(() => console.log('✅ Email acceptation envoyé à:', automobInfo[0].email))
              .catch(err => console.error('❌ Erreur email acceptation:', err.message));
          } else {
            console.warn('⚠️ Pas d\'email pour l\'automob:', application.automob_id);
          }

          // Email au client
          if (clientEmail[0]?.email) {
            console.log('📧 Envoi email mission en cours à:', clientEmail[0].email);
            sendMissionStartedEmail(clientEmail[0].email, clientName, missionTitle, automobName)
              .then(() => console.log('✅ Email mission en cours envoyé à:', clientEmail[0].email))
              .catch(err => console.error('❌ Erreur email mission en cours:', err.message));
          } else {
            console.warn('⚠️ Pas d\'email pour le client:', application.client_id);
          }
        } else {
          // Notification de refus à l'Automob
          const io = req.app.get('io');
          console.log('🔔 Création notification refus pour Automob:', application.automob_id);
          await createNotification(
            application.automob_id,
            'Candidature refusée',
            `Votre candidature pour "${missionTitle}" n'a pas été retenue.`,
            'error',
            'mission',
            `/automob/my-applications`,
            io
          );

          // FCM push notification pour l'automob refusé
          try {
            await notifyApplicationRejected(application.automob_id, missionTitle, missionId);
          } catch (fcmError) {
            console.error('❌ Erreur FCM notification refus:', fcmError.message);
          }

          // Email de refus
          if (automobInfo[0]?.email) {
            console.log('📧 Envoi email refus à:', automobInfo[0].email);
            sendApplicationRejectedEmail(automobInfo[0].email, automobName, missionTitle)
              .then(() => console.log('✅ Email refus envoyé à:', automobInfo[0].email))
              .catch(err => console.error('❌ Erreur email refus:', err.message));
          } else {
            console.warn('⚠️ Pas d\'email pour l\'automob:', application.automob_id);
          }
        }

        console.log('✅ [APPLICATION_UPDATE] Succès');
        res.json({ message: `Candidature ${status === 'accepte' ? 'acceptée' : 'refusée'}`, success: true });
      } catch (innerError) {
        console.error('❌ [APPLICATION_UPDATE] Erreur SQL/Interne:', innerError);
        throw innerError; // Sera rattrapé par le catch extérieur
      }
    } catch (error) {
      console.error('❌ [APPLICATION_UPDATE] Erreur fatale:', error);
      res.status(500).json({
        error: 'Erreur lors du traitement de la candidature',
        details: error.message,
        code: error.code || 'UNKNOWN_ERROR'
      });
    }
  }
);



// Get applications for a mission (client only)
router.get('/:id/applications', authenticateToken, authorizeRoles('client'), async (req, res) => {
  try {
    const [applications] = await db.query(`
      SELECT 
        ma.*,
        ap.first_name as automob_first_name,
        ap.last_name as automob_last_name,
        CONCAT(ap.first_name, ' ', ap.last_name) as automob_name,
        ap.profile_picture as automob_avatar,
        ap.experience as automob_experience
      FROM mission_applications ma
      JOIN missions m ON ma.mission_id = m.id
      JOIN automob_profiles ap ON ma.automob_id = ap.user_id
      WHERE ma.mission_id = ? AND m.client_id = ?
      ORDER BY ma.created_at DESC
    `, [req.params.id, req.user.id]);

    res.json(applications);
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get automob status on a mission (client only) - DOIT ÊTRE AVANT /:id/automobs
router.get('/:id/automobs/:automobId/status',
  authenticateToken,
  authorizeRoles('client'),
  async (req, res) => {
    const { id: missionId, automobId } = req.params;

    try {
      // Vérifier que la mission appartient au client
      const [missions] = await db.query(
        'SELECT * FROM missions WHERE id = ? AND client_id = ?',
        [missionId, req.user.id]
      );

      if (missions.length === 0) {
        return res.status(404).json({ error: 'Mission non trouvée' });
      }

      // Récupérer le statut de l'automob sur cette mission
      const [missionAutomobs] = await db.query(
        'SELECT status, completed_at FROM mission_automobs WHERE mission_id = ? AND automob_id = ?',
        [missionId, automobId]
      );

      // Vérifier s'il y a un avis
      const [reviews] = await db.query(
        'SELECT id FROM automob_reviews WHERE mission_id = ? AND automob_id = ? AND client_id = ?',
        [missionId, automobId, req.user.id]
      );

      if (missionAutomobs.length === 0) {
        // Pas encore dans mission_automobs, donc en_cours par défaut
        return res.json({
          status: 'en_cours',
          completed_at: null,
          hasReview: false
        });
      }

      res.json({
        status: missionAutomobs[0].status,
        completed_at: missionAutomobs[0].completed_at,
        hasReview: reviews.length > 0
      });
    } catch (error) {
      console.error('Get automob status error:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// Get assigned automobs for a mission with their timesheets
router.get('/:id/automobs', authenticateToken, async (req, res) => {
  try {
    const [automobs] = await db.query(`
      SELECT 
        mau.*,
        ap.first_name,
        ap.last_name,
        CONCAT(ap.first_name, ' ', ap.last_name) as automob_name,
        ap.profile_picture,
        ap.phone,
        ap.experience,
        u.email,
        ma.status as application_status,
        ma.created_at as applied_at,
        (SELECT COUNT(*) FROM timesheets WHERE mission_id = ? AND automob_id = mau.automob_id) as timesheet_count,
        (SELECT COUNT(*) FROM timesheets WHERE mission_id = ? AND automob_id = mau.automob_id AND status = 'soumis') as pending_timesheets,
        (SELECT COUNT(*) FROM timesheets WHERE mission_id = ? AND automob_id = mau.automob_id AND status = 'approuve') as approved_timesheets,
        (SELECT SUM(total_hours) FROM timesheets WHERE mission_id = ? AND automob_id = mau.automob_id AND status = 'approuve') as total_approved_hours
      FROM mission_automobs mau
      JOIN automob_profiles ap ON mau.automob_id = ap.user_id
      JOIN users u ON mau.automob_id = u.id
      LEFT JOIN mission_applications ma ON ma.mission_id = mau.mission_id AND ma.automob_id = mau.automob_id
      WHERE mau.mission_id = ? AND mau.status = 'actif'
      ORDER BY mau.assigned_at ASC
    `, [req.params.id, req.params.id, req.params.id, req.params.id, req.params.id]);

    res.json(automobs);
  } catch (error) {
    console.error('Get mission automobs error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get nearby missions (avec géolocalisation)
router.get('/nearby/:lat/:lng', authenticateToken, authorizeRoles('automob'), async (req, res) => {
  const { lat, lng } = req.params;
  const radius = req.query.radius || 50; // km

  try {
    const [missions] = await db.query(`
      SELECT m.*, 
             cp.company_name as client_company,
             (6371 * acos(cos(radians(?)) * cos(radians(m.latitude)) * cos(radians(m.longitude) - radians(?)) + sin(radians(?)) * sin(radians(m.latitude)))) AS distance
      FROM missions m
      LEFT JOIN client_profiles cp ON m.client_id = cp.user_id
      WHERE m.status = 'ouvert'
      AND m.latitude IS NOT NULL
      AND m.longitude IS NOT NULL
      HAVING distance < ?
      ORDER BY distance ASC
    `, [lat, lng, lat, radius]);

    res.json(missions);
  } catch (error) {
    console.error('Get nearby missions error:', error);
    res.status(500).json({ error: 'Erreur' });
  }
});

// Complete mission for an automob (client only)
router.post('/:id/complete-automob',
  authenticateToken,
  authorizeRoles('client'),
  async (req, res) => {
    const { id: missionId } = req.params;
    const { automob_id, rating, comment } = req.body;

    try {
      // Vérifier que la mission appartient au client
      const [missions] = await db.query(
        'SELECT * FROM missions WHERE id = ? AND client_id = ?',
        [missionId, req.user.id]
      );

      if (missions.length === 0) {
        return res.status(404).json({ error: 'Mission non trouvée' });
      }

      // Marquer la mission comme terminée pour cet automob
      await db.query(
        'UPDATE mission_automobs SET status = "termine", completed_at = NOW() WHERE mission_id = ? AND automob_id = ?',
        [missionId, automob_id]
      );

      // 🔄 SYNCHRONISATION : Vérifier s'il reste des automobs en cours pour cette mission
      const [remainingAutomobs] = await db.query(
        'SELECT COUNT(*) as count FROM mission_automobs WHERE mission_id = ? AND status = "en_cours"',
        [missionId]
      );

      if (remainingAutomobs[0].count === 0) {
        // S'il n'y a plus d'automobs en cours, marquer la mission comme terminée globalement
        await db.query(
          'UPDATE missions SET status = "termine" WHERE id = ?',
          [missionId]
        );
        console.log(`✅ [SYNC] Mission ${missionId} marquée comme terminée globalement car tous les automobs ont fini.`);
      }

      // Si un avis est fourni, l'enregistrer
      if (rating && comment) {
        await db.query(
          `INSERT INTO automob_reviews (automob_id, client_id, mission_id, rating, comment, created_at)
           VALUES (?, ?, ?, ?, ?, NOW())`,
          [automob_id, req.user.id, missionId, rating, comment]
        );
      }

      // 💰 GÉNÉRATION AUTOMATIQUE DES FACTURES ET RECHARGEMENT WALLET
      console.log(`📦 Début génération factures pour mission ${missionId}, automob ${automob_id}`);

      try {
        // Récupérer tous les timesheets approuvés pour cette mission et cet automob
        const [approvedTimesheets] = await db.query(
          'SELECT id FROM timesheets WHERE mission_id = ? AND automob_id = ? AND status = "approuve"',
          [missionId, automob_id]
        );

        if (approvedTimesheets.length > 0) {
          const timesheetIds = approvedTimesheets.map(ts => ts.id);
          console.log(`✅ ${approvedTimesheets.length} timesheets approuvés trouvés:`, timesheetIds);

          // 1. Générer la facture AUTOMOB (crédite automatiquement le wallet)
          console.log('📄 Génération facture automob...');
          const automobInvoiceId = await createAutomobInvoice(missionId, automob_id, timesheetIds);
          console.log(`✅ Facture automob générée: ID ${automobInvoiceId} - Wallet automatiquement crédité`);

          // 2. Générer la facture CLIENT
          console.log('📄 Génération facture client...');
          const clientInvoiceId = await createClientInvoice(missionId, automob_id, timesheetIds);
          console.log(`✅ Facture client générée: ID ${clientInvoiceId}`);

          // 3. Générer la facture récapitulative ADMIN
          console.log('📄 Génération facture admin...');
          const adminInvoiceId = await createAdminSummaryInvoice(missionId);
          console.log(`✅ Facture admin générée: ID ${adminInvoiceId}`);

          console.log(`🎉 Toutes les factures générées avec succès et wallet rechargé !`);
        } else {
          console.warn(`⚠️ Aucun timesheet approuvé trouvé pour mission ${missionId}, automob ${automob_id}`);
        }
      } catch (invoiceError) {
        // Ne pas bloquer la finalisation si la génération de facture échoue
        console.error('❌ Erreur génération factures:', invoiceError);
        // Continuer quand même avec les notifications
      }

      // Récupérer les infos pour les notifications
      const [automobInfo] = await db.query(
        'SELECT first_name, last_name FROM automob_profiles WHERE user_id = ?',
        [automob_id]
      );
      const [automobEmail] = await db.query('SELECT email FROM users WHERE id = ?', [automob_id]);
      const mission = missions[0];

      const automobName = (automobInfo[0]?.first_name && automobInfo[0]?.last_name)
        ? `${automobInfo[0].first_name} ${automobInfo[0].last_name}`
        : automobEmail[0]?.email || 'Automob';

      // Notification pour la mission terminée
      await createNotification(
        automob_id,
        '🎉 Mission terminée !',
        `Félicitations ! Le client a marqué la mission "${mission.mission_name}" comme terminée.`,
        'success',
        'mission',
        `/automob/my-missions`
      );

      // Notification supplémentaire si un avis a été laissé
      if (rating && comment) {
        await createNotification(
          automob_id,
          '⭐ Nouvel avis reçu !',
          `Le client vous a laissé un avis ${rating}/5 étoiles pour la mission "${mission.mission_name}"`,
          'success',
          'mission',
          `/automob/reviews`
        );
      }

      // Email à l'automob
      if (automobEmail.length > 0) {
        const emailService = await import('../services/emailService.js');
        const subject = `🎉 Mission terminée - ${mission.mission_name}`;
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #334155;">
            <h2 style="color: #16a34a; margin-top: 0;">🎉 Mission terminée avec succès !</h2>
            
            <p>Bonjour <strong>${automobName}</strong>,</p>
            
            <p>Excellente nouvelle ! Le client a marqué la mission <strong>"${mission.mission_name}"</strong> comme terminée sur NettmobFrance.</p>
            
            ${rating ? `
              <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #fef3c7; border-left: 5px solid #f59e0b;">
                <h3 style="color: #f59e0b; margin: 0 0 10px 0; font-size: 18px;">⭐ Avis Client Reçu</h3>
                <p style="margin: 5px 0; font-size: 16px;"><strong>Note:</strong> ${rating}/5 ⭐⭐⭐⭐⭐</p>
                ${comment ? `
                  <p style="margin: 15px 0 5px 0; font-weight: bold; color: #475569;">Commentaire :</p>
                  <p style="margin: 5px 0; padding: 15px; background: white; border-radius: 6px; font-style: italic; border: 1px solid #e2e8f0; color: #64748b;">
                    "${comment}"
                  </p>
                ` : ''}
              </div>
              <p style="color: #1e293b; font-weight: 600;">🎯 Cet avis est maintenant visible sur votre profil public !</p>
            ` : ''}
            
            <p style="margin-top: 20px;">Vous pouvez consulter vos factures et demander un retrait depuis votre wallet dès maintenant.</p>
            
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
              <tr>
                ${rating ? `
                <td style="padding-right: 15px;">
                  <a href="${process.env.FRONTEND_URL}/automob/reviews" 
                     style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; border: 1px solid #d97706;">
                    ⭐ Voir mes avis
                  </a>
                </td>
                ` : ''}
                <td>
                  <a href="${process.env.FRONTEND_URL}/automob/wallet" 
                     style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; border: 1px solid #15803d;">
                    💰 Voir mon wallet
                  </a>
                </td>
              </tr>
            </table>
            
            <div style="height: 1px; background-color: #e2e8f0; margin: 40px 0 20px 0;"></div>
            
            <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">
              Cet email a été envoyé automatiquement par le système NettmobFrance.<br>
              Merci de ne pas répondre directement à ce message.
            </p>
          </div>
        `;

        try {
          await emailService.sendNotificationEmail(automobEmail[0].email, subject, html);
        } catch (emailError) {
          console.error('Erreur envoi email:', emailError);
        }
      }

      res.json({
        message: 'Mission marquée comme terminée',
        reviewSaved: !!(rating && comment)
      });
    } catch (error) {
      console.error('Complete mission error:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// Force notifications for a mission (called by verification service)
router.post('/:id/force-notifications', authenticateToken, async (req, res) => {
  const { id: missionId } = req.params;
  const {
    send_to_offline = true,
    notification_type = 'new_mission',
    force_all = true,
    include_push = true,
    include_email = true,
    priority = 'high',
    retry_failed = true
  } = req.body;

  try {
    console.log(`🔔 FORCE NOTIFICATIONS pour mission ${missionId}:`, {
      send_to_offline,
      notification_type,
      force_all,
      include_push,
      include_email,
      priority,
      retry_failed
    });

    // Récupérer les détails de la mission
    const [missions] = await db.query(`
      SELECT m.*, 
             cp.company_name as client_company,
             u.email as client_email,
             s.nom as secteur_name
      FROM missions m
      LEFT JOIN client_profiles cp ON m.client_id = cp.user_id
      LEFT JOIN users u ON m.client_id = u.id
      LEFT JOIN secteurs s ON m.secteur_id = s.id
      WHERE m.id = ?
    `, [missionId]);

    if (missions.length === 0) {
      console.error(`❌ Mission ${missionId} non trouvée`);
      return res.status(404).json({ error: 'Mission non trouvée' });
    }

    const mission = missions[0];
    console.log(`✅ Mission trouvée: ${mission.mission_name} (Client: ${mission.client_email})`);

    // Récupérer les compétences requises
    let competences_ids = [];
    try {
      const [competencesRows] = await db.query(
        'SELECT competence_id FROM mission_competences WHERE mission_id = ?',
        [missionId]
      );
      competences_ids = competencesRows.map(r => r.competence_id);
    } catch (compErr) {
      console.warn('⚠️ Erreur récupération compétences (ignorée):', compErr.message);
    }

    if (competences_ids.length === 0) {
      console.warn(`⚠️ Aucune compétence trouvée pour mission ${missionId}`);
      return res.json({
        message: 'Mission trouvée mais aucune compétence associée - notifications non envoyées',
        automobs_notified: 0,
        details: { mission_found: true, competences_found: false }
      });
    }

    // Récupérer les automobs éligibles
    const [automobs] = await db.query(`
      SELECT DISTINCT u.id, u.email, 
             ap.first_name, ap.last_name, ap.phone as profile_phone, ap.phone_country_code,
             ap.city, ap.work_areas, 
             ap.availability_start_date, ap.availability_end_date, ap.id_verified, ap.secteur_id,
             ap.web_push_enabled, ap.web_push_subscription
      FROM users u
      JOIN automob_profiles ap ON u.id = ap.user_id
      JOIN automob_competences ac ON ap.id = ac.automob_profile_id
      WHERE u.role = 'automob' AND u.verified = TRUE 
      AND ac.competence_id IN (${competences_ids.map(() => '?').join(',')})
      AND ap.id_verified = 1
    `, competences_ids);

    console.log(`📋 ${automobs.length} automobs potentiels trouvés`);

    // Filtrer par ville si spécifiée
    let eligibleAutomobs = automobs;
    if (mission.city) {
      eligibleAutomobs = automobs.filter(automob => {
        // Ville du profil
        if (automob.city && automob.city.toLowerCase() === mission.city.toLowerCase()) {
          return true;
        }

        // Zones de travail
        if (automob.work_areas) {
          try {
            let workAreas;

            // Gérer les 3 formats possibles : Array déjà parsé, JSON string, ou CSV string
            if (Array.isArray(automob.work_areas)) {
              // Déjà un array (cas où MySQL retourne directement l'array)
              workAreas = automob.work_areas;
            } else if (typeof automob.work_areas === 'string') {
              // C'est une string, déterminer si JSON ou CSV
              if (automob.work_areas.startsWith('[')) {
                // Format JSON string : '["Paris", "Lyon"]'
                workAreas = JSON.parse(automob.work_areas);
              } else {
                // Format CSV string : "Paris,Lille,Lyon"
                workAreas = automob.work_areas.split(',').map(s => s.trim());
              }
            } else {
              workAreas = [];
            }

            if (Array.isArray(workAreas)) {
              return workAreas.some(area =>
                area && typeof area === 'string' && area.toLowerCase() === mission.city.toLowerCase()
              );
            }
          } catch (e) {
            console.error('Erreur parsing work_areas:', e);
          }
        }

        return false;
      });
    }

    console.log(`🎯 ${eligibleAutomobs.length} automobs éligibles après filtrage ville`);

    if (eligibleAutomobs.length === 0) {
      return res.json({
        message: 'Aucun automob éligible trouvé',
        automobs_notified: 0,
        details: { mission_found: true, competences_found: true, eligible_automobs: 0 }
      });
    }

    // Envoyer les notifications
    const io = req.app?.get('io');
    let notificationsSent = 0;

    if (include_push && eligibleAutomobs.length > 0) {
      const eligibleIds = eligibleAutomobs.map(a => a.id);
      const clientName = mission.client_company || mission.client_email || 'Un client';
      const secteurName = mission.secteur_name || 'Secteur inconnu';

      try {
        await createBulkNotifications(
          eligibleIds,
          '🎯 Nouvelle Mission Disponible',
          `${clientName} a publié "${mission.mission_name}" - ${mission.hourly_rate}€/h à ${mission.city}. Secteur: ${secteurName}. Cliquez pour voir les détails et postuler !`,
          'info',
          'mission',
          `/automob/missions/${missionId}`,
          io
        );
        notificationsSent = eligibleIds.length;
        console.log(`📲 ${notificationsSent} notifications envoyées avec succès`);
      } catch (notifError) {
        console.error('❌ Erreur envoi notifications:', notifError);
      }
    }

    // Envoi des notifications push web et SMS
    let webPushSent = 0;
    let smsSent = 0;
    let emailsSent = 0;

    // 1. Notifications push web (même si automobs déconnectés)
    if (include_push) {
      try {
        const webPushAutomobs = eligibleAutomobs.filter(a =>
          a.web_push_enabled && a.web_push_subscription
        );

        if (webPushAutomobs.length > 0) {
          const pushTitle = '🎯 Nouvelle Mission Disponible';
          const pushBody = `Mission "${mission.mission_name}" à ${mission.city} - ${mission.hourly_rate}€/h par ${mission.client_company || 'Un client'}`;

          const webPushPromises = webPushAutomobs.map(async (automob) => {
            try {
              let subscription = JSON.parse(automob.web_push_subscription);
              await webpush.sendNotification(subscription, JSON.stringify({
                title: pushTitle,
                body: pushBody,
                icon: '/badge-72x72.png',
                badge: '/badge-72x72.png',
                data: { action_url: `/automob/missions/${missionId}` }
              }));
              return true;
            } catch (e) {
              console.error(`[FORCE-NOTIF] Web Push error ${automob.email}:`, e.message);
              return false;
            }
          });

          const webPushResults = await Promise.all(webPushPromises);
          webPushSent = webPushResults.filter(Boolean).length;
          console.log(`🔔 [FORCE-NOTIF] Web Push: ${webPushSent}/${webPushAutomobs.length} envoyés`);
        }
      } catch (e) {
        console.error('❌ [FORCE-NOTIF] Erreur Web Push:', e.message);
      }
    }

    // 2. Envoi SMS 
    try {
      const phonesToNotify = eligibleAutomobs
        .filter(a => a.profile_phone && a.profile_phone.trim() !== '')
        .map(a => {
          let phone = a.profile_phone.replace(/\s+/g, '');
          const countryCode = a.phone_country_code || '+33';

          if (!phone.startsWith('+')) {
            if (phone.startsWith('0') && countryCode === '+33') {
              phone = '+33' + phone.substring(1);
            } else {
              phone = countryCode + phone;
            }
          }

          return {
            phone: phone,
            name: `${a.first_name} ${a.last_name || ''}`.trim()
          };
        });

      if (phonesToNotify.length > 0) {
        const smsMessage = `🎯 Nouvelle mission NettmobFrance !
${mission.mission_name}
💰 ${mission.hourly_rate}€/h
📍 ${mission.city || 'France'}
🏢 Secteur: ${mission.secteur_name}
Voir: ${process.env.FRONTEND_URL || 'https://pro.nettmobfrance.fr'}/automob/missions/${missionId}`;

        const phoneNumbers = phonesToNotify.map(p => p.phone);
        const smsResult = await sendBulkSMS(phoneNumbers, smsMessage);
        smsSent = smsResult.success || 0;
        console.log(`📱 [FORCE-NOTIF] SMS: ${smsSent}/${smsResult.total} envoyés`);
      }
    } catch (smsError) {
      console.error('❌ [FORCE-NOTIF] Erreur SMS:', smsError.message);
    }

    // 3. Notifications FCM (Firebase)
    try {
      if (eligibleAutomobs.length > 0) {
        const eligibleIds = eligibleAutomobs.map(a => a.id);
        const fcmResult = await sendFCMNotificationToMultipleUsers(
          eligibleIds,
          {
            title: '🎯 Nouvelle Mission Disponible',
            body: `Mission "${mission.mission_name}" à ${mission.city} - ${mission.hourly_rate}€/h`
          },
          {
            mission_id: missionId.toString(),
            action_url: `/automob/missions/${missionId}`,
            category: 'mission'
          }
        );
        console.log(`🔥 [FORCE-NOTIF] FCM: ${fcmResult.successful}/${fcmResult.total} envoyés`);
      }
    } catch (e) {
      console.error('❌ [FORCE-NOTIF] Erreur FCM:', e.message);
    }

    // 4. Envoi emails si demandé
    if (include_email) {
      try {
        const missionData = {
          id: missionId,
          mission_name: mission.mission_name,
          hourly_rate: mission.hourly_rate,
          city: mission.city,
          secteur_id: mission.secteur_id,
          description: mission.description,
          start_date: mission.start_date
        };

        const emailPromises = eligibleAutomobs.map(async (automob) => {
          try {
            const fullName = `${automob.first_name} ${automob.last_name || ''}`.trim();
            const emailSent = await sendNewMissionEmail(automob.email, fullName, missionData);
            if (emailSent) {
              console.log(`✅ [FORCE-NOTIF] Email envoyé à ${fullName}`);
              return 1;
            }
            return 0;
          } catch (emailError) {
            console.error(`❌ [FORCE-NOTIF] Erreur email pour ${automob.email}:`, emailError.message);
            return 0;
          }
        });

        const emailResults = await Promise.all(emailPromises);
        emailsSent = emailResults.reduce((sum, val) => sum + val, 0);
        console.log(`📧 [FORCE-NOTIF] Emails: ${emailsSent}/${eligibleAutomobs.length} envoyés`);
      } catch (e) {
        console.error('❌ [FORCE-NOTIF] Erreur emails:', e.message);
      }
    }

    res.json({
      message: 'Notifications forcées envoyées avec succès',
      automobs_notified: notificationsSent,
      web_push_sent: webPushSent,
      sms_sent: smsSent,
      emails_sent: emailsSent,
      details: {
        mission_found: true,
        mission_name: mission.mission_name,
        client_email: mission.client_email,
        competences_found: competences_ids.length > 0,
        eligible_automobs: eligibleAutomobs.length,
        notifications_sent: notificationsSent,
        web_push_sent: webPushSent,
        sms_sent: smsSent,
        emails_sent: emailsSent
      }
    });

  } catch (error) {
    console.error(`❌ Erreur force notifications mission ${missionId}:`, error);
    res.status(500).json({
      error: 'Erreur lors de l\'envoi forcé des notifications',
      details: error.message
    });
  }
});

export default router;
