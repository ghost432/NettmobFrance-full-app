import express from 'express';
import db from '../config/database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

const columnExists = async (table, column) => {
  const [rows] = await db.query(
    'SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    [table, column]
  );
  return rows[0].cnt > 0;
};

const tableExists = async (table) => {
  const [rows] = await db.query(
    'SELECT COUNT(*) AS cnt FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
    [table]
  );
  return rows[0].cnt > 0;
};

// Route pour récupérer toutes les statistiques du dashboard admin
router.get('/admin/stats', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    console.log('🔍 [Dashboard] Récupération des statistiques admin...');

    const hasUserIdVerified = await columnExists('users', 'id_verified');
    const hasMissionHourlyRate = await columnExists('missions', 'hourly_rate');
    const hasMissionName = await columnExists('missions', 'mission_name');
    const hasTimesheets = await tableExists('timesheets');
    const hasReviewsReviewerType = await columnExists('reviews', 'reviewer_type');
    const hasReviewsReviewedId = await columnExists('reviews', 'reviewed_id');
    const notifHasIsRead = await columnExists('notifications', 'is_read');
    const notifHasReadStatus = await columnExists('notifications', 'read_status');

    // 1. Statistiques des utilisateurs
    const userStatsQuery = `
      SELECT 
        role,
        COUNT(*) as count,
        SUM(CASE WHEN verified = 1 THEN 1 ELSE 0 END) as verified_count
        ${hasUserIdVerified ? ', SUM(CASE WHEN id_verified = 1 THEN 1 ELSE 0 END) as id_verified_count' : ', 0 as id_verified_count'}
      FROM users 
      GROUP BY role
    `;
    const [userStats] = await db.query(userStatsQuery);

    // 2. Statistiques des missions
    const [missionStats] = await db.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM missions 
      GROUP BY status
    `);

    // 3. Statistiques des candidatures
    const [applicationStats] = await db.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM mission_applications 
      GROUP BY status
    `);

    // 4. Répartition par villes (inscriptions)
    const [cityStats] = await db.query(`
      SELECT 
        u.role,
        COALESCE(ap.city, cp.city) as city,
        COUNT(*) as count
      FROM users u
      LEFT JOIN automob_profiles ap ON u.id = ap.user_id AND u.role = 'automob'
      LEFT JOIN client_profiles cp ON u.id = cp.user_id AND u.role = 'client'
      WHERE COALESCE(ap.city, cp.city) IS NOT NULL
      GROUP BY u.role, COALESCE(ap.city, cp.city)
      ORDER BY count DESC
      LIMIT 20
    `);

    // 5. Tendance d'inscription par mois (6 derniers mois)
    const [inscriptionTrends] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        role,
        COUNT(*) as count
      FROM users 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m'), role
      ORDER BY month ASC
    `);

    // 6. Gains des clients (dépenses) - 6 derniers mois
    let clientSpending = [];
    if (hasTimesheets) {
      const [rows] = await db.query(`
        SELECT 
          DATE_FORMAT(t.period_start, '%Y-%m') as month,
          SUM(t.total_hours * ${hasMissionHourlyRate ? 'COALESCE(m.hourly_rate, 25)' : '25'}) as total_spent
        FROM timesheets t
        JOIN missions m ON t.mission_id = m.id
        WHERE t.status = 'approuve' 
          AND t.period_start >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(t.period_start, '%Y-%m')
        ORDER BY month ASC
      `);
      clientSpending = rows;
    }

    // 7. Gains des automobs - 6 derniers mois
    let automobEarnings = [];
    if (hasTimesheets) {
      const [rows] = await db.query(`
        SELECT 
          DATE_FORMAT(t.period_start, '%Y-%m') as month,
          SUM(t.total_hours * ${hasMissionHourlyRate ? 'COALESCE(m.hourly_rate, 25)' : '25'}) as total_earned
        FROM timesheets t
        JOIN missions m ON t.mission_id = m.id
        WHERE t.status = 'approuve'
          AND t.period_start >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(t.period_start, '%Y-%m')
        ORDER BY month ASC
      `);
      automobEarnings = rows;
    }

    // 8. Top 10 automobs du mois (par nombre de missions)
    const topAutomobsQuery = `
      SELECT 
        u.id,
        u.email,
        ap.first_name,
        ap.last_name,
        ap.city,
        COUNT(DISTINCT a.mission_id) as missions_count,
        ${hasTimesheets ? `COALESCE(SUM(t.total_hours * ${hasMissionHourlyRate ? 'COALESCE(m2.hourly_rate, 25)' : '25'}), 0)` : '0'} as total_earned,
        COALESCE(AVG(r.rating), 0) as avg_rating
      FROM users u
      JOIN automob_profiles ap ON u.id = ap.user_id
      JOIN mission_applications a ON u.id = a.automob_id
      ${hasTimesheets ? "LEFT JOIN timesheets t ON a.mission_id = t.mission_id AND t.automob_id = u.id AND t.status = 'approuve'" : ''}
      ${hasTimesheets ? 'LEFT JOIN missions m2 ON t.mission_id = m2.id' : ''}
      LEFT JOIN reviews r ON ${ (hasReviewsReviewedId && hasReviewsReviewerType) ? "u.id = r.reviewed_id AND r.reviewer_type = 'client'" : 'r.automob_id = u.id' }
      WHERE u.role = 'automob' 
        AND a.status IN ('accepted','accepte')
        AND a.created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
      GROUP BY u.id, u.email, ap.first_name, ap.last_name, ap.city
      ORDER BY missions_count DESC, total_earned DESC
      LIMIT 10
    `;
    const [topAutomobs] = await db.query(topAutomobsQuery);

    // 9. Top 10 clients du mois (par dépenses)
    const topClientsQuery = `
      SELECT 
        u.id,
        u.email,
        cp.company_name,
        cp.city,
        COUNT(DISTINCT m.id) as missions_posted,
        ${hasTimesheets ? `COALESCE(SUM(t.total_hours * ${hasMissionHourlyRate ? 'COALESCE(m.hourly_rate, 25)' : '25'}), 0)` : '0'} as total_spent,
        COALESCE(AVG(r.rating), 0) as avg_rating
      FROM users u
      JOIN client_profiles cp ON u.id = cp.user_id
      JOIN missions m ON u.id = m.client_id
      ${hasTimesheets ? "LEFT JOIN timesheets t ON m.id = t.mission_id AND t.status = 'approuve'" : ''}
      LEFT JOIN reviews r ON ${ (hasReviewsReviewedId && hasReviewsReviewerType) ? "u.id = r.reviewed_id AND r.reviewer_type = 'automob'" : 'r.client_id = u.id' }
      WHERE u.role = 'client'
        AND m.created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
      GROUP BY u.id, u.email, cp.company_name, cp.city
      ORDER BY total_spent DESC, missions_posted DESC
      LIMIT 10
    `;
    const [topClients] = await db.query(topClientsQuery);

    // 10. Dernières actions admin (logs système)
    const recentActionsParts = [];
    if (hasUserIdVerified) {
      recentActionsParts.push(`
      SELECT 
        'user_verification' as action_type,
        CONCAT('Vérification utilisateur #', u.id) as description,
        u.updated_at as created_at,
        'system' as admin_name
      FROM users u 
      WHERE u.id_verified = 1 
        AND u.updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`);
    }
    recentActionsParts.push(`
      SELECT 
        'mission_created' as action_type,
        CONCAT('Nouvelle mission: ', ${hasMissionName ? 'm.mission_name' : 'm.title'}) as description,
        m.created_at,
        'system' as admin_name
      FROM missions m
      WHERE m.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`);
    const recentActionsQuery = `${recentActionsParts.join('\n      UNION ALL\n      ')}\n      ORDER BY created_at DESC\n      LIMIT 20`;
    const [recentActions] = await db.query(recentActionsQuery);

    // 11. Notifications récentes
    const recentNotificationsQuery = `
      SELECT 
        COUNT(CASE WHEN ${notifHasIsRead ? 'n.is_read' : (notifHasReadStatus ? 'n.read_status' : '0')} = 0 THEN 1 END) as unread_count,
        COUNT(*) as total_count
      FROM notifications n
      WHERE n.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `;
    const [recentNotifications] = await db.query(recentNotificationsQuery);

    // Formatage des données pour le frontend
    const stats = {
      users: {
        total: userStats.reduce((sum, stat) => sum + stat.count, 0),
        byRole: userStats.reduce((acc, stat) => {
          acc[stat.role] = {
            count: stat.count,
            verified: stat.verified_count,
            id_verified: stat.id_verified_count
          };
          return acc;
        }, {})
      },
      missions: {
        total: missionStats.reduce((sum, stat) => sum + stat.count, 0),
        byStatus: missionStats.reduce((acc, stat) => {
          acc[stat.status] = stat.count;
          return acc;
        }, {})
      },
      applications: {
        total: applicationStats.reduce((sum, stat) => sum + stat.count, 0),
        byStatus: applicationStats.reduce((acc, stat) => {
          acc[stat.status] = stat.count;
          return acc;
        }, {})
      },
      cityDistribution: cityStats,
      inscriptionTrends: inscriptionTrends,
      clientSpending: clientSpending,
      automobEarnings: automobEarnings,
      topAutomobs: topAutomobs,
      topClients: topClients,
      recentActions: recentActions,
      notifications: recentNotifications[0] || { unread_count: 0, total_count: 0 }
    };

    console.log('✅ [Dashboard] Statistiques récupérées avec succès');
    res.json(stats);

  } catch (error) {
    console.error('❌ [Dashboard] Erreur récupération statistiques:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des statistiques' });
  }
});

export default router;
