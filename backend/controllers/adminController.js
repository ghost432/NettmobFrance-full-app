import db from '../config/database.js';
import { logger } from '../utils/logger.js';

export default {
  // Gestion utilisateurs
  listUsers: async (req, res) => {
    try {
      const query = `
        SELECT 
          u.id,
          u.email,
          u.role,
          u.verified,
          u.id_verified,
          u.created_at,
          u.last_login,
          u.total_session_duration,
          u.profile_picture,
          CASE
            WHEN u.role = 'automob' THEN CONCAT(COALESCE(ap.first_name, ''), ' ', COALESCE(ap.last_name, ''))
            WHEN u.role = 'client' THEN CONCAT(COALESCE(cp.first_name, ''), ' ', COALESCE(cp.last_name, ''))
            ELSE NULL
          END as nom_complet,
          cp.company_name
        FROM users u
        LEFT JOIN automob_profiles ap ON u.id = ap.user_id AND u.role = 'automob'
        LEFT JOIN client_profiles cp ON u.id = cp.user_id AND u.role = 'client'
        ORDER BY u.created_at DESC
      `;
      
      const [users] = await db.query(query);
      
      // Nettoyer les noms vides
      const cleanedUsers = users.map(user => ({
        ...user,
        nom_complet: user.nom_complet?.trim() || 'Sans nom'
      }));
      
      res.json(cleanedUsers);
    } catch (err) {
      logger.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  getUser: async (req, res) => {
    const { id } = req.params;
    try {
      const [users] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
      if (users.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
      res.json(users[0]);
    } catch (err) {
      logger.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  updateUser: async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    try {
      await db.query('UPDATE users SET ? WHERE id = ?', [updates, id]);
      res.json({ success: true });
    } catch (err) {
      logger.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  deleteUser: async (req, res) => {
    const { id } = req.params;
    try {
      await db.query('DELETE FROM users WHERE id = ?', [id]);
      res.json({ success: true });
    } catch (err) {
      logger.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Gestion missions
  listMissions: async (req, res) => {
    try {
      const [missions] = await db.query('SELECT * FROM missions');
      res.json(missions);
    } catch (err) {
      logger.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  getMission: async (req, res) => {
    const { id } = req.params;
    try {
      const [missions] = await db.query('SELECT * FROM missions WHERE id = ?', [id]);
      if (missions.length === 0) return res.status(404).json({ error: 'Mission non trouvée' });
      res.json(missions[0]);
    } catch (err) {
      logger.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  createMission: async (req, res) => {
    try {
      const [result] = await db.query('INSERT INTO missions SET ?', [req.body]);
      res.json({ id: result.insertId, success: true });
    } catch (err) {
      logger.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  updateMission: async (req, res) => {
    const { id } = req.params;
    try {
      await db.query('UPDATE missions SET ? WHERE id = ?', [req.body, id]);
      res.json({ success: true });
    } catch (err) {
      logger.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  deleteMission: async (req, res) => {
    const { id } = req.params;
    try {
      await db.query('DELETE FROM missions WHERE id = ?', [id]);
      res.json({ success: true });
    } catch (err) {
      logger.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Statistiques
  getStats: async (req, res) => {
    try {
      const [[userCount]] = await db.query('SELECT COUNT(*) as count FROM users');
      const [[missionCount]] = await db.query('SELECT COUNT(*) as count FROM missions');
      const [[activeMissionCount]] = await db.query("SELECT COUNT(*) as count FROM missions WHERE status = 'active'");
      
      const stats = {
        users: userCount.count,
        missions: missionCount.count,
        activeMissions: activeMissionCount.count
      };
      res.json(stats);
    } catch (err) {
      logger.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
};
