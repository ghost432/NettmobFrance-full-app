import express from 'express';
import db from '../config/database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Get automob profile with banking info
router.get('/profile', authenticateToken, authorizeRoles('automob'), async (req, res) => {
  try {
    // Vérifier si le profil existe, sinon le créer
    const [existingProfiles] = await db.query(
      'SELECT id FROM automob_profiles WHERE user_id = ?',
      [req.user.id]
    );

    if (existingProfiles.length === 0) {
      // Créer le profil automatiquement
      await db.query(
        'INSERT INTO automob_profiles (user_id, created_at, updated_at) VALUES (?, NOW(), NOW())',
        [req.user.id]
      );
    }

    // Récupérer le profil
    const [profiles] = await db.query(
      `SELECT first_name, last_name, iban, bic_swift, phone, city, address, profile_picture
       FROM automob_profiles 
       WHERE user_id = ?`,
      [req.user.id]
    );

    res.json({ profile: profiles[0] });
  } catch (error) {
    console.error('Get automob profile error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get automob's reviews
router.get('/my-reviews', authenticateToken, authorizeRoles('automob'), async (req, res) => {
  try {
    // Récupérer tous les avis
    const [reviews] = await db.query(`
      SELECT 
        ar.*,
        cp.company_name as client_company,
        cp.profile_picture as client_avatar,
        m.mission_name
      FROM automob_reviews ar
      JOIN client_profiles cp ON ar.client_id = cp.user_id
      JOIN missions m ON ar.mission_id = m.id
      WHERE ar.automob_id = ?
      ORDER BY ar.created_at DESC
    `, [req.user.id]);

    // Calculer les statistiques
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    // Distribution des notes
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      ratingDistribution[review.rating]++;
    });

    res.json({
      reviews,
      stats: {
        totalReviews,
        averageRating,
        ratingDistribution
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get automob's rating summary (for profile display)
router.get('/rating-summary', authenticateToken, authorizeRoles('automob'), async (req, res) => {
  try {
    const [result] = await db.query(`
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating
      FROM automob_reviews
      WHERE automob_id = ?
    `, [req.user.id]);

    res.json(result[0] || { total_reviews: 0, average_rating: 0 });
  } catch (error) {
    console.error('Get rating summary error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get public rating for an automob (accessible by anyone)
router.get('/:automob_id/public-rating', async (req, res) => {
  try {
    const [result] = await db.query(`
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating
      FROM automob_reviews
      WHERE automob_id = ?
    `, [req.params.automob_id]);

    const [reviews] = await db.query(`
      SELECT 
        ar.rating,
        ar.comment,
        ar.created_at,
        cp.company_name as client_company,
        m.mission_name
      FROM automob_reviews ar
      JOIN client_profiles cp ON ar.client_id = cp.user_id
      JOIN missions m ON ar.mission_id = m.id
      WHERE ar.automob_id = ?
      ORDER BY ar.created_at DESC
      LIMIT 10
    `, [req.params.automob_id]);

    res.json({
      ...result[0],
      recent_reviews: reviews
    });
  } catch (error) {
    console.error('Get public rating error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get automob's completed missions with reviews
router.get('/completed-missions', authenticateToken, authorizeRoles('automob'), async (req, res) => {
  try {
    // Récupérer toutes les missions terminées pour cet automob
    const [missions] = await db.query(`
      SELECT 
        m.id,
        m.mission_name,
        m.start_date,
        m.end_date,
        m.city,
        m.hourly_rate,
        ma.status as mission_status,
        ma.completed_at,
        cp.company_name as client_name,
        cp.profile_picture as client_avatar,
        ar.id as review_id,
        ar.rating as review_rating,
        ar.comment as review_comment,
        ar.created_at as review_created_at
      FROM mission_automobs ma
      JOIN missions m ON ma.mission_id = m.id
      JOIN client_profiles cp ON m.client_id = cp.user_id
      LEFT JOIN automob_reviews ar ON ar.mission_id = m.id AND ar.automob_id = ma.automob_id
      WHERE ma.automob_id = ? AND ma.status = 'termine'
      ORDER BY ma.completed_at DESC
    `, [req.user.id]);

    // Formater les données pour le frontend
    const formattedMissions = missions.map(mission => ({
      id: mission.id,
      mission_name: mission.mission_name,
      start_date: mission.start_date,
      end_date: mission.end_date,
      city: mission.city,
      hourly_rate: mission.hourly_rate,
      mission_status: mission.mission_status,
      completed_at: mission.completed_at,
      client_name: mission.client_name,
      client_avatar: mission.client_avatar,
      review: mission.review_id ? {
        id: mission.review_id,
        rating: mission.review_rating,
        comment: mission.review_comment,
        created_at: mission.review_created_at
      } : null
    }));

    res.json(formattedMissions);
  } catch (error) {
    console.error('Get completed missions error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
