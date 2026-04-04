import db from './config/database.js';

// Script pour réinitialiser le flag feedback_given d'un utilisateur
// Usage: node reset-feedback.js <user_id>

const userId = process.argv[2];

if (!userId) {
  console.error('❌ Usage: node reset-feedback.js <user_id>');
  process.exit(1);
}

try {
  await db.query('UPDATE users SET feedback_given = 0 WHERE id = ?', [userId]);
  console.log(`✅ Flag feedback_given réinitialisé pour l'utilisateur #${userId}`);
  
  const [rows] = await db.query('SELECT id, email, role, feedback_given FROM users WHERE id = ?', [userId]);
  if (rows.length > 0) {
    console.log('📊 État actuel:', rows[0]);
  }
  
  process.exit(0);
} catch (error) {
  console.error('❌ Erreur:', error);
  process.exit(1);
}
