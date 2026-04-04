import db from '../config/database.js';

export const fetchClientProfile = async (userId) => {
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
