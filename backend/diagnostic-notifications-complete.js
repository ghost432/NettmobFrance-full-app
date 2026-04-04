import dotenv from 'dotenv';
import db from './config/database.js';

dotenv.config();

console.log('\n🔍 ========== DIAGNOSTIC COMPLET NOTIFICATIONS ==========\n');

async function diagnosticComplete() {
  try {
    // 1. Vérifier l'email du client
    console.log('📧 [1] Recherche client antoinepaulcm@gmail.com...\n');
    
    const [clients] = await db.query(`
      SELECT u.id, u.email, u.verified, cp.company_name, cp.first_name, cp.last_name
      FROM users u
      LEFT JOIN client_profiles cp ON u.id = cp.user_id
      WHERE u.email = ? AND u.role = 'client'
    `, ['antoinepaulcm@gmail.com']);
    
    if (clients.length === 0) {
      console.log('❌ Client non trouvé !');
      return;
    }
    
    const client = clients[0];
    console.log(`✅ Client trouvé: ${client.company_name || 'Sans nom'}`);
    console.log(`   ID: ${client.id}`);
    console.log(`   Email: ${client.email}`);
    console.log(`   Vérifié: ${client.verified ? 'Oui' : 'Non'}\n`);
    
    // 2. Trouver la dernière mission du client
    console.log('🎯 [2] Recherche dernière mission du client...\n');
    
    const [missions] = await db.query(`
      SELECT id, mission_name, city, hourly_rate, secteur_id, created_at
      FROM missions
      WHERE client_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `, [client.id]);
    
    if (missions.length === 0) {
      console.log('❌ Aucune mission trouvée pour ce client !');
      return;
    }
    
    const mission = missions[0];
    console.log(`✅ Mission trouvée: "${mission.mission_name}"`);
    console.log(`   ID: ${mission.id}`);
    console.log(`   Ville: ${mission.city}`);
    console.log(`   Tarif: ${mission.hourly_rate}€/h`);
    console.log(`   Secteur ID: ${mission.secteur_id}`);
    console.log(`   Créée le: ${mission.created_at}\n`);
    
    // 3. Vérifier les compétences requises
    console.log('🛠️ [3] Vérification compétences requises...\n');
    
    const [competences] = await db.query(`
      SELECT mc.competence_id, c.nom
      FROM mission_competences mc
      JOIN competences c ON mc.competence_id = c.id
      WHERE mc.mission_id = ?
    `, [mission.id]);
    
    console.log(`✅ ${competences.length} compétences requises:`);
    competences.forEach(c => {
      console.log(`   - ${c.nom} (ID: ${c.competence_id})`);
    });
    console.log('');
    
    const competenceIds = competences.map(c => c.competence_id);
    
    // 4. Chercher les automobs éligibles
    console.log('👥 [4] Recherche automobs éligibles...\n');
    
    const [automobs] = await db.query(`
      SELECT DISTINCT 
        u.id, u.email, u.verified,
        ap.first_name, ap.last_name, ap.phone as profile_phone,
        ap.phone_country_code, ap.city, ap.sms_notifications,
        ap.web_push_enabled, ap.web_push_subscription
      FROM users u
      JOIN automob_profiles ap ON u.id = ap.user_id
      JOIN automob_competences ac ON ap.id = ac.automob_profile_id
      WHERE u.role = 'automob' 
        AND u.verified = TRUE 
        AND ac.competence_id IN (${competenceIds.map(() => '?').join(',')})
        AND ap.id_verified = 1
    `, competenceIds);
    
    console.log(`✅ ${automobs.length} automobs trouvés avec les compétences\n`);
    
    if (automobs.length === 0) {
      console.log('⚠️ Aucun automob éligible ! Les notifications ne peuvent pas être envoyées.\n');
      return;
    }
    
    // 5. Vérifier les tokens FCM
    console.log('🔥 [5] Vérification tokens FCM...\n');
    
    for (const automob of automobs) {
      const fullName = `${automob.first_name || ''} ${automob.last_name || ''}`.trim() || automob.email;
      
      const [fcmTokens] = await db.query(`
        SELECT token, device_type, created_at
        FROM fcm_tokens
        WHERE user_id = ?
      `, [automob.id]);
      
      console.log(`📱 ${fullName} (ID: ${automob.id})`);
      console.log(`   Email: ${automob.email}`);
      console.log(`   Téléphone: ${automob.profile_phone || 'Aucun'} ${automob.phone_country_code || ''}`);
      console.log(`   SMS activés: ${automob.sms_notifications === 1 ? '✅ Oui' : '❌ Non'}`);
      console.log(`   Web Push: ${automob.web_push_enabled ? '✅ Activé' : '❌ Désactivé'}`);
      console.log(`   Tokens FCM: ${fcmTokens.length > 0 ? `✅ ${fcmTokens.length} token(s)` : '❌ Aucun'}`);
      
      if (fcmTokens.length > 0) {
        fcmTokens.forEach((t, i) => {
          console.log(`     ${i+1}. ${t.device_type || 'unknown'} - ${t.token.substring(0, 30)}...`);
        });
      }
      console.log('');
    }
    
    // 6. Diagnostic final
    console.log('\n📊 [6] DIAGNOSTIC FINAL\n');
    
    const totalAutomobs = automobs.length;
    const automobsWithFCM = automobs.filter(a => {
      // Vérifier tokens FCM de manière synchrone
      return true; // On ne peut pas faire de requête ici, on suppose que l'info est déjà affichée
    }).length;
    
    const automobsWithSMS = automobs.filter(a => 
      a.profile_phone && a.profile_phone.trim() !== '' && a.sms_notifications === 1
    ).length;
    
    const automobsWithWebPush = automobs.filter(a => 
      a.web_push_enabled && a.web_push_subscription
    ).length;
    
    console.log(`✅ ${totalAutomobs} automobs éligibles pour la mission`);
    console.log(`📱 ${automobsWithSMS} automobs avec SMS activé et téléphone valide`);
    console.log(`🌐 ${automobsWithWebPush} automobs avec Web Push activé et subscription`);
    console.log(`\n💡 RECOMMANDATIONS:\n`);
    
    if (automobsWithSMS === 0) {
      console.log(`⚠️ SMS : Aucun automob ne peut recevoir de SMS`);
      console.log(`   → Activer les SMS dans le profil automob`);
      console.log(`   → Ajouter un numéro de téléphone valide\n`);
    } else {
      console.log(`✅ SMS : ${automobsWithSMS} automobs peuvent recevoir des SMS\n`);
    }
    
    if (automobsWithWebPush === 0) {
      console.log(`⚠️ Web Push : Aucun automob ne peut recevoir de notifications Web Push`);
      console.log(`   → Les automobs doivent autoriser les notifications dans leur navigateur\n`);
    } else {
      console.log(`✅ Web Push : ${automobsWithWebPush} automobs peuvent recevoir des notifications Web Push\n`);
    }
    
    console.log(`💡 FCM Push : Vérifier les tokens FCM ci-dessus`);
    console.log(`   → Si aucun token, l'automob doit se connecter à l'app mobile\n`);
    
    console.log(`✅ Email : Tous les automobs peuvent recevoir des emails (si SMTP configuré)\n`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  } finally {
    await db.end();
    process.exit(0);
  }
}

diagnosticComplete();
