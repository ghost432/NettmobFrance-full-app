import db from './config/database.js';

// Test de l'API de statut des notifications pour l'utilisateur 24
console.log('🧪 Test de l\'API de statut des notifications');

const userId = 24;

try {
  console.log(`\n📊 Vérification pour l'utilisateur ${userId}...`);
  
  // 1. Vérifier les tokens FCM
  const [tokens] = await db.query(
    'SELECT id, token FROM fcm_tokens WHERE user_id = ?',
    [userId]
  );
  
  console.log(`📱 Tokens FCM: ${tokens.length}`);
  if (tokens.length > 0) {
    console.log(`   - Token: ${tokens[0].token.substring(0, 30)}...`);
  }
  
  // 2. Vérifier les préférences automob
  const [preferences] = await db.query(
    'SELECT web_push_enabled, email_notifications FROM automob_profiles WHERE user_id = ?',
    [userId]
  );
  
  if (preferences.length > 0) {
    console.log(`🔔 Préférences notifications:`);
    console.log(`   - Web Push: ${preferences[0].web_push_enabled ? '✅ Activé' : '❌ Désactivé'}`);
    console.log(`   - Email: ${preferences[0].email_notifications ? '✅ Activé' : '❌ Désactivé'}`);
  } else {
    console.log('❌ Aucune préférence trouvée');
  }
  
  // 3. Simuler la réponse API
  const apiResponse = {
    hasToken: tokens.length > 0,
    webPushEnabled: preferences.length > 0 ? Boolean(preferences[0].web_push_enabled) : false,
    emailNotifications: preferences.length > 0 ? Boolean(preferences[0].email_notifications) : false,
    role: 'automob'
  };
  
  console.log('\n🌐 Réponse API simulée:');
  console.log(JSON.stringify(apiResponse, null, 2));
  
  // 4. Tester la logique d'affichage
  const shouldShow = !apiResponse.hasToken || !apiResponse.webPushEnabled;
  
  console.log('\n🤔 Logique d\'affichage de la carte:');
  console.log(`   - hasToken: ${apiResponse.hasToken}`);
  console.log(`   - webPushEnabled: ${apiResponse.webPushEnabled}`);
  console.log(`   - shouldShow: ${shouldShow}`);
  console.log(`   - Formule: !hasToken (${!apiResponse.hasToken}) || !webPushEnabled (${!apiResponse.webPushEnabled}) = ${shouldShow}`);
  
  if (shouldShow) {
    console.log('\n🔔 La carte DOIT s\'afficher');
    if (!apiResponse.hasToken) {
      console.log('   Raison: Pas de token FCM');
    }
    if (!apiResponse.webPushEnabled) {
      console.log('   Raison: Notifications push désactivées');
    }
  } else {
    console.log('\n✅ La carte NE DOIT PAS s\'afficher (tout est configuré)');
  }
  
  // 5. Vérifier s'il y a un problème de conversion
  console.log('\n🔍 Vérification des types:');
  console.log(`   - preferences[0].web_push_enabled type: ${typeof preferences[0]?.web_push_enabled}`);
  console.log(`   - preferences[0].web_push_enabled value: ${preferences[0]?.web_push_enabled}`);
  console.log(`   - Boolean() conversion: ${Boolean(preferences[0]?.web_push_enabled)}`);
  
  process.exit(0);
} catch (error) {
  console.error('❌ Erreur:', error);
  process.exit(1);
}
