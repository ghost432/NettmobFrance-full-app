import express from 'express';
const router = express.Router();
import adminController from '../controllers/adminController.js';
import { authenticateToken, authorizeRoles, adminRequired } from '../middleware/auth.js';
import db from '../config/database.js';

// Routes pour la gestion des utilisateurs
router.get('/users', adminRequired, adminController.listUsers);
router.get('/users/:id', adminRequired, adminController.getUser);
router.put('/users/:id', adminRequired, adminController.updateUser);
router.delete('/users/:id', adminRequired, adminController.deleteUser);

// Routes pour la gestion des missions
router.get('/missions', adminRequired, adminController.listMissions);

// Missions archivées (status = 'termine') — doit être avant /missions/:id
router.get('/missions/archived', adminRequired, async (req, res) => {
  try {
    const [missions] = await db.query(`
      SELECT m.id, m.mission_name AS title, m.status, m.updated_at AS archived_at,
             cp.company_name
      FROM missions m
      LEFT JOIN client_profiles cp ON m.client_id = cp.user_id
      WHERE m.status = 'termine'
      ORDER BY m.updated_at DESC
    `);
    res.json({
      missions: missions.map(m => ({
        ...m,
        client: { company_name: m.company_name }
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/missions/:id', adminRequired, adminController.getMission);
router.post('/missions', adminRequired, adminController.createMission);
router.put('/missions/:id', adminRequired, adminController.updateMission);
router.delete('/missions/:id', adminRequired, adminController.deleteMission);

// Gestion des types de mission
router.get('/mission-types', adminRequired, async (req, res) => {
  try {
    const [types] = await db.query('SELECT * FROM mission_types');
    res.json({ types });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/mission-types', adminRequired, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Nom requis' });
  
  try {
    const [result] = await db.query(
      'INSERT INTO mission_types (name) VALUES (?)', 
      [name]
    );
    res.json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/mission-types/:id', adminRequired, async (req, res) => {
  try {
    await db.query('DELETE FROM mission_types WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Routes pour les statistiques
router.get('/stats', adminRequired, adminController.getStats);

// ============================================
// MISSION SETTINGS - Paramètres de mission
// ============================================

// BILLING FREQUENCIES
router.get('/mission-settings/billing-frequencies', authenticateToken, authorizeRoles('admin', 'staff_delegate', 'client'), async (req, res) => {
  try {
    const [frequencies] = await db.query(
      'SELECT * FROM billing_frequencies WHERE active = 1 ORDER BY id ASC'
    );
    res.json({ frequencies });
  } catch (error) {
    console.error('❌ Erreur récupération fréquences:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/mission-settings/billing-frequencies', adminRequired, async (req, res) => {
  try {
    const { value, label } = req.body;
    if (!value || !label) {
      return res.status(400).json({ error: 'Valeur et libellé requis' });
    }

    const [existing] = await db.query(
      'SELECT id FROM billing_frequencies WHERE value = ?',
      [value]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Cette valeur existe déjà' });
    }

    const [result] = await db.query(
      'INSERT INTO billing_frequencies (value, label) VALUES (?, ?)',
      [value, label]
    );

    res.status(201).json({
      message: 'Fréquence créée avec succès',
      id: result.insertId
    });
  } catch (error) {
    console.error('❌ Erreur création fréquence:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/mission-settings/billing-frequencies/:id', adminRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const { value, label } = req.body;

    if (!value || !label) {
      return res.status(400).json({ error: 'Valeur et libellé requis' });
    }

    const [existing] = await db.query(
      'SELECT id FROM billing_frequencies WHERE value = ? AND id != ?',
      [value, id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Cette valeur existe déjà' });
    }

    await db.query(
      'UPDATE billing_frequencies SET value = ?, label = ? WHERE id = ?',
      [value, label, id]
    );

    res.json({ message: 'Fréquence modifiée avec succès' });
  } catch (error) {
    console.error('❌ Erreur modification fréquence:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/mission-settings/billing-frequencies/:id', adminRequired, async (req, res) => {
  try {
    const { id } = req.params;

    const [missions] = await db.query(
      'SELECT COUNT(*) as count FROM missions WHERE billing_frequency = (SELECT value FROM billing_frequencies WHERE id = ?)',
      [id]
    );

    if (missions[0].count > 0) {
      return res.status(400).json({ 
        error: `Cette fréquence est utilisée par ${missions[0].count} mission(s). Impossible de la supprimer.` 
      });
    }

    await db.query('DELETE FROM billing_frequencies WHERE id = ?', [id]);
    res.json({ message: 'Fréquence supprimée avec succès' });
  } catch (error) {
    console.error('❌ Erreur suppression fréquence:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// LOCATION TYPES
router.get('/mission-settings/location-types', authenticateToken, authorizeRoles('admin', 'staff_delegate', 'client'), async (req, res) => {
  try {
    const [locationTypes] = await db.query(
      'SELECT * FROM location_types WHERE active = 1 ORDER BY id ASC'
    );
    res.json({ locationTypes });
  } catch (error) {
    console.error('❌ Erreur récupération types de lieux:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/mission-settings/location-types', adminRequired, async (req, res) => {
  try {
    const { value, label } = req.body;

    if (!value || !label) {
      return res.status(400).json({ error: 'Valeur et libellé requis' });
    }

    const [existing] = await db.query(
      'SELECT id FROM location_types WHERE value = ?',
      [value]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Cette valeur existe déjà' });
    }

    const [result] = await db.query(
      'INSERT INTO location_types (value, label) VALUES (?, ?)',
      [value, label]
    );

    res.status(201).json({
      message: 'Type de lieu créé avec succès',
      id: result.insertId
    });
  } catch (error) {
    console.error('❌ Erreur création type de lieu:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/mission-settings/location-types/:id', adminRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const { value, label } = req.body;

    if (!value || !label) {
      return res.status(400).json({ error: 'Valeur et libellé requis' });
    }

    const [existing] = await db.query(
      'SELECT id FROM location_types WHERE value = ? AND id != ?',
      [value, id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Cette valeur existe déjà' });
    }

    await db.query(
      'UPDATE location_types SET value = ?, label = ? WHERE id = ?',
      [value, label, id]
    );

    res.json({ message: 'Type de lieu modifié avec succès' });
  } catch (error) {
    console.error('❌ Erreur modification type de lieu:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/mission-settings/location-types/:id', adminRequired, async (req, res) => {
  try {
    const { id } = req.params;

    const [missions] = await db.query(
      'SELECT COUNT(*) as count FROM missions WHERE location_type = (SELECT value FROM location_types WHERE id = ?)',
      [id]
    );

    if (missions[0].count > 0) {
      return res.status(400).json({ 
        error: `Ce type de lieu est utilisé par ${missions[0].count} mission(s). Impossible de le supprimer.` 
      });
    }

    await db.query('DELETE FROM location_types WHERE id = ?', [id]);
    res.json({ message: 'Type de lieu supprimé avec succès' });
  } catch (error) {
    console.error('❌ Erreur suppression type de lieu:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// HOURLY RATES
router.get('/mission-settings/hourly-rates', authenticateToken, authorizeRoles('admin', 'staff_delegate', 'client'), async (req, res) => {
  try {
    const { work_time } = req.query;
    
    let query = 'SELECT * FROM hourly_rates WHERE active = 1';
    const params = [];
    
    // Filtrer par work_time si spécifié
    if (work_time && ['jour', 'nuit'].includes(work_time)) {
      query += ' AND (work_time = ? OR work_time = "both")';
      params.push(work_time);
    }
    
    query += ' ORDER BY rate ASC';
    
    const [rates] = await db.query(query, params);
    res.json({ rates });
  } catch (error) {
    console.error('❌ Erreur récupération tarifs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/mission-settings/hourly-rates', adminRequired, async (req, res) => {
  try {
    const { rate, label, description, work_time } = req.body;

    if (!rate || !label) {
      return res.status(400).json({ error: 'Tarif et libellé requis' });
    }

    const [result] = await db.query(
      'INSERT INTO hourly_rates (rate, work_time, label, description) VALUES (?, ?, ?, ?)',
      [rate, work_time || 'both', label, description || null]
    );

    res.status(201).json({
      message: 'Tarif créé avec succès',
      id: result.insertId
    });
  } catch (error) {
    console.error('❌ Erreur création tarif:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/mission-settings/hourly-rates/:id', adminRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const { rate, label, description, work_time } = req.body;

    if (!rate || !label) {
      return res.status(400).json({ error: 'Tarif et libellé requis' });
    }

    await db.query(
      'UPDATE hourly_rates SET rate = ?, work_time = ?, label = ?, description = ? WHERE id = ?',
      [rate, work_time || 'both', label, description || null, id]
    );

    res.json({ message: 'Tarif modifié avec succès' });
  } catch (error) {
    console.error('❌ Erreur modification tarif:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/mission-settings/hourly-rates/:id', adminRequired, async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('DELETE FROM hourly_rates WHERE id = ?', [id]);
    res.json({ message: 'Tarif supprimé avec succès' });
  } catch (error) {
    console.error('❌ Erreur suppression tarif:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * Récupérer les paramètres système (ADMIN uniquement)
 */
router.get('/system-settings', adminRequired, async (req, res) => {
  try {
    // Récupérer tous les paramètres
    const [settings] = await db.query('SELECT setting_key, setting_value, setting_type FROM system_settings');
    
    // Initialiser avec valeurs par défaut si table vide
    if (settings.length === 0) {
      const defaults = [
        { key: 'maintenance_mode', value: 'false', type: 'boolean' },
        { key: 'signup_enabled', value: 'true', type: 'boolean' },
        { key: 'default_hourly_rate', value: '15', type: 'number' },
        { key: 'app_name', value: 'NettMobFrance', type: 'string' }
      ];
      
      for (const def of defaults) {
        await db.query(
          'INSERT IGNORE INTO system_settings (setting_key, setting_value, setting_type) VALUES (?, ?, ?)',
          [def.key, def.value, def.type]
        );
      }
      
      // Récupérer à nouveau après insertion
      const [newSettings] = await db.query('SELECT setting_key, setting_value, setting_type FROM system_settings');
      settings.push(...newSettings);
    }
    
    // Convertir en objet avec types appropriés
    const settingsObj = {};
    settings.forEach(s => {
      if (s.setting_type === 'boolean') {
        settingsObj[s.setting_key] = s.setting_value === 'true';
      } else if (s.setting_type === 'number') {
        settingsObj[s.setting_key] = parseFloat(s.setting_value);
      } else {
        settingsObj[s.setting_key] = s.setting_value;
      }
    });
    
    res.json({ settings: settingsObj });
  } catch (error) {
    console.error('❌ Erreur récupération paramètres système:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * Mettre à jour les paramètres système (ADMIN uniquement)
 */
router.put('/system-settings', adminRequired, async (req, res) => {
  try {
    const settings = req.body;
    
    // Mise à jour de chaque paramètre
    for (const [key, value] of Object.entries(settings)) {
      let settingValue = value;
      let settingType = 'string';
      
      if (typeof value === 'boolean') {
        settingValue = value ? 'true' : 'false';
        settingType = 'boolean';
      } else if (typeof value === 'number') {
        settingValue = value.toString();
        settingType = 'number';
      }
      
      await db.query(
        `INSERT INTO system_settings (setting_key, setting_value, setting_type) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE setting_value = ?, setting_type = ?`,
        [key, settingValue, settingType, settingValue, settingType]
      );
    }
    
    console.log('✅ Paramètres système mis à jour');
    
    res.json({ message: 'Paramètres mis à jour avec succès' });
  } catch (error) {
    console.error('❌ Erreur mise à jour paramètres système:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * Récupérer les logs d'activité (ADMIN uniquement)
 */
router.get('/activity-logs', adminRequired, async (req, res) => {
  try {
    const { page = 1, limit = 50, action, userId } = req.query;
    const offset = (page - 1) * limit;

    // Construire la requête pour récupérer les activités récentes
    // On agrège plusieurs tables pour avoir un historique complet
    let logsQuery = `
      SELECT 
        'mission_created' as action,
        m.id as entity_id,
        m.client_id as user_id,
        CONCAT(cp.first_name, ' ', cp.last_name) as user_name,
        'client' as user_role,
        m.mission_name as description,
        m.created_at as timestamp
      FROM missions m
      LEFT JOIN client_profiles cp ON m.client_id = cp.user_id
      WHERE m.created_at IS NOT NULL
      
      UNION ALL
      
      SELECT 
        'user_registered' as action,
        u.id as entity_id,
        u.id as user_id,
        COALESCE(
          CONCAT(ap.first_name, ' ', ap.last_name),
          CONCAT(cp.first_name, ' ', cp.last_name),
          u.email
        ) as user_name,
        u.role as user_role,
        CONCAT('Inscription utilisateur: ', u.email) as description,
        u.created_at as timestamp
      FROM users u
      LEFT JOIN automob_profiles ap ON u.id = ap.user_id
      LEFT JOIN client_profiles cp ON u.id = cp.user_id
      WHERE u.created_at IS NOT NULL
      
      UNION ALL
      
      SELECT 
        'application_submitted' as action,
        ma.id as entity_id,
        ma.automob_id as user_id,
        CONCAT(ap.first_name, ' ', ap.last_name) as user_name,
        'automob' as user_role,
        CONCAT('Candidature pour: ', m.mission_name) as description,
        ma.created_at as timestamp
      FROM mission_applications ma
      LEFT JOIN automob_profiles ap ON ma.automob_id = ap.user_id
      LEFT JOIN missions m ON ma.mission_id = m.id
      WHERE ma.created_at IS NOT NULL
      
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `;

    const [logs] = await db.query(logsQuery, [parseInt(limit), offset]);

    // Compter le total pour la pagination
    const countQuery = `
      SELECT COUNT(*) as total FROM (
        SELECT id FROM missions
        UNION ALL
        SELECT id FROM users
        UNION ALL
        SELECT id FROM mission_applications
      ) as all_logs
    `;
    
    const [countResult] = await db.query(countQuery);
    const total = countResult[0].total;

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Erreur récupération logs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour enregistrer une installation PWA
router.post('/pwa-install', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    // Détecter la plateforme et le navigateur
    const platform = userAgent.includes('Android') ? 'Android' :
                    userAgent.includes('iPhone') || userAgent.includes('iPad') ? 'iOS' :
                    userAgent.includes('Windows') ? 'Windows' :
                    userAgent.includes('Mac') ? 'MacOS' :
                    userAgent.includes('Linux') ? 'Linux' : 'Unknown';
    
    const browser = userAgent.includes('Chrome') ? 'Chrome' :
                   userAgent.includes('Firefox') ? 'Firefox' :
                   userAgent.includes('Safari') ? 'Safari' :
                   userAgent.includes('Edge') ? 'Edge' : 'Unknown';

    // Vérifier si l'utilisateur a déjà installé le PWA
    const [existing] = await db.query(
      'SELECT id FROM pwa_installations WHERE user_id = ?',
      [userId]
    );

    if (existing.length > 0) {
      return res.json({ message: 'PWA déjà enregistré pour cet utilisateur' });
    }

    // Enregistrer l'installation
    await db.query(
      'INSERT INTO pwa_installations (user_id, ip_address, user_agent, platform, browser) VALUES (?, ?, ?, ?, ?)',
      [userId, ipAddress, userAgent, platform, browser]
    );

    res.json({ message: 'Installation PWA enregistrée avec succès' });
  } catch (error) {
    console.error('❌ Erreur enregistrement PWA:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour récupérer les statistiques PWA
router.get('/pwa-stats', adminRequired, async (req, res) => {
  try {
    // Nombre total d'installations
    const [totalResult] = await db.query(
      'SELECT COUNT(*) as total FROM pwa_installations'
    );
    const total = totalResult[0].total;

    // Installations par plateforme
    const [byPlatform] = await db.query(`
      SELECT platform, COUNT(*) as count 
      FROM pwa_installations 
      GROUP BY platform 
      ORDER BY count DESC
    `);

    // Installations par navigateur
    const [byBrowser] = await db.query(`
      SELECT browser, COUNT(*) as count 
      FROM pwa_installations 
      GROUP BY browser 
      ORDER BY count DESC
    `);

    // Installations récentes avec détails utilisateur
    const [recentInstalls] = await db.query(`
      SELECT 
        p.id,
        p.user_id,
        u.email,
        u.role,
        p.ip_address,
        p.platform,
        p.browser,
        p.installed_at,
        COALESCE(
          CONCAT(ap.first_name, ' ', ap.last_name),
          CONCAT(cp.first_name, ' ', cp.last_name),
          u.email
        ) as user_name
      FROM pwa_installations p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN automob_profiles ap ON u.id = ap.user_id AND u.role = 'automob'
      LEFT JOIN client_profiles cp ON u.id = cp.user_id AND u.role = 'client'
      ORDER BY p.installed_at DESC
      LIMIT 50
    `);

    // Installations par jour (7 derniers jours)
    const [byDay] = await db.query(`
      SELECT 
        DATE(installed_at) as date,
        COUNT(*) as count
      FROM pwa_installations
      WHERE installed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(installed_at)
      ORDER BY date DESC
    `);

    res.json({
      total,
      byPlatform,
      byBrowser,
      recentInstalls,
      byDay
    });
  } catch (error) {
    console.error('❌ Erreur récupération stats PWA:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============= GESTION DES SOUS-RÔLES ADMIN =============

const VALID_ADMIN_ROLES = ['super_admin', 'moderateur', 'comptable', 'support'];

// Liste tous les admins avec leur sous-rôle
router.get('/sub-roles', adminRequired, async (req, res) => {
  try {
    const [admins] = await db.query(`
      SELECT id, email, admin_role, created_at
      FROM users
      WHERE role = 'admin'
      ORDER BY created_at ASC
    `);
    res.json(admins);
  } catch (error) {
    console.error('❌ Erreur liste sous-rôles:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modifier le sous-rôle d'un admin
router.put('/sub-roles/:userId', adminRequired, async (req, res) => {
  try {
    const { userId } = req.params;
    const { admin_role } = req.body;

    if (!VALID_ADMIN_ROLES.includes(admin_role)) {
      return res.status(400).json({ error: 'Sous-rôle invalide. Valeurs: ' + VALID_ADMIN_ROLES.join(', ') });
    }

    // Empêcher de dégrader son propre compte
    if (parseInt(userId) === req.user.id && admin_role !== 'super_admin') {
      return res.status(403).json({ error: 'Vous ne pouvez pas modifier votre propre sous-rôle' });
    }

    const [result] = await db.query(
      'UPDATE users SET admin_role = ? WHERE id = ? AND role = ?',
      [admin_role, userId, 'admin']
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Admin introuvable' });
    }

    res.json({ message: 'Sous-rôle mis à jour', admin_role });
  } catch (error) {
    console.error('❌ Erreur mise à jour sous-rôle:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
