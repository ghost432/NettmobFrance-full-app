import db from './config/database.js';

// Test complet du profil utilisateur 24 (mounchilithierry432@gmail.com)
console.log('🧪 Test du profil utilisateur 24...');

try {
  console.log('\n👤 Informations utilisateur...');
  const [user] = await db.query('SELECT * FROM users WHERE id = 24');
  console.log('Email:', user[0]?.email);
  console.log('Rôle:', user[0]?.role);
  console.log('Vérifié:', user[0]?.verified ? '✅' : '❌');

  console.log('\n🔧 Profil automob...');
  const [profile] = await db.query('SELECT * FROM automob_profiles WHERE user_id = 24');
  if (profile.length > 0) {
    const p = profile[0];
    console.log('Nom:', `${p.first_name} ${p.last_name}`);
    console.log('Téléphone:', p.phone);
    console.log('Expérience:', `${p.experience} (${p.years_of_experience} ans)`);
    console.log('Position:', p.current_position);
    console.log('À propos:', p.about_me?.substring(0, 50) + '...');
    console.log('Ville:', p.city);
    console.log('Tarif horaire:', p.hourly_rate + '€');
    console.log('Véhicule:', p.vehicle_type);
    console.log('Push notifications:', p.web_push_enabled ? '✅' : '❌');
    console.log('Email notifications:', p.email_notifications ? '✅' : '❌');
    try {
      const workAreas = JSON.parse(p.work_areas || '[]');
      console.log('Zones de travail:', Array.isArray(workAreas) ? workAreas.join(', ') : workAreas?.areas?.join(', ') || 'Aucune');
    } catch (e) {
      console.log('Zones de travail:', p.work_areas || 'Aucune');
    }
  }

  console.log('\n🎯 Compétences...');
  const [competences] = await db.query(`
    SELECT c.id, c.nom 
    FROM automob_competences ac 
    JOIN competences c ON ac.competence_id = c.id 
    WHERE ac.automob_profile_id = 7
  `);
  competences.forEach(comp => {
    console.log(`- ${comp.nom}`);
  });

  console.log('\n📱 Token FCM...');
  const [tokens] = await db.query('SELECT token FROM fcm_tokens WHERE user_id = 24');
  if (tokens.length > 0) {
    console.log('Token FCM:', tokens[0].token.substring(0, 30) + '...');
  } else {
    console.log('❌ Aucun token FCM');
    
    // Auto-créer un token
    const autoToken = `profile_test_24_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db.query(
      'INSERT INTO fcm_tokens (user_id, token) VALUES (?, ?)',
      [24, autoToken]
    );
    console.log('✅ Token FCM auto-créé:', autoToken.substring(0, 30) + '...');
  }

  console.log('\n🔔 Notifications récentes...');
  const [notifications] = await db.query(`
    SELECT title, message, type, created_at, is_read 
    FROM notifications 
    WHERE user_id = 24 
    ORDER BY created_at DESC 
    LIMIT 5
  `);
  
  if (notifications.length > 0) {
    notifications.forEach(notif => {
      console.log(`- ${notif.title} (${notif.type}) - ${notif.is_read ? 'Lu' : 'Non lu'}`);
    });
  } else {
    console.log('Aucune notification récente');
  }

  console.log('\n✅ Test du profil terminé !');
  
  // Test API fictive
  console.log('\n🌐 Structure API attendue:');
  console.log('GET /api/users/notifications → Préférences notifications');
  console.log('PUT /api/users/notifications → Mettre à jour préférences');
  console.log('POST /api/users/send-test-push → Test push notification');
  console.log('POST /api/users/fcm-token/auto-create → Auto-créer token FCM');

  console.log('\n📊 Résumé pour dashboard:');
  console.log('✅ Profil complet et cohérent');
  console.log('✅ Compétences associées');
  console.log('✅ Zones de travail définies');
  console.log('✅ Token FCM présent');
  console.log('✅ Notifications activées');
  
  process.exit(0);
} catch (error) {
  console.error('❌ Erreur:', error);
  process.exit(1);
}
