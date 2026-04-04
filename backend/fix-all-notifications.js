import dotenv from 'dotenv';
import db from './config/database.js';

dotenv.config();

console.log('\n🔧 ========== CORRECTION SYSTÈME NOTIFICATIONS ==========\n');

async function resetInvalidWebPushSubscriptions() {
  console.log('🔄 [1/4] Réinitialisation subscriptions Web Push invalides...\n');
  
  try {
    // Supprimer toutes les subscriptions invalides
    const [result] = await db.query(`
      UPDATE automob_profiles 
      SET web_push_subscription = NULL 
      WHERE web_push_subscription IS NOT NULL
        AND (
          web_push_subscription = '{"endpoint":"https://fcm.googleapis.com/fcm/send/test-endpoint","keys":{"p256dh":"test","auth":"test"}}'
          OR JSON_EXTRACT(web_push_subscription, '$.keys.p256dh') = 'test'
          OR LENGTH(JSON_EXTRACT(web_push_subscription, '$.keys.p256dh')) < 10
        )
    `);
    
    console.log(`✅ ${result.affectedRows} subscriptions invalides supprimées`);
    console.log('   Les automobs devront se reconnecter pour activer Web Push\n');
    
  } catch (error) {
    console.error('❌ Erreur réinitialisation subscriptions:', error.message);
  }
}

async function checkAndFixTables() {
  console.log('📊 [2/4] Vérification structure tables...\n');
  
  try {
    // 1. Table fcm_tokens - device_type
    const [fcmColumns] = await db.query('SHOW COLUMNS FROM fcm_tokens');
    const hasDeviceType = fcmColumns.some(col => col.Field === 'device_type');
    
    if (!hasDeviceType) {
      await db.query(`
        ALTER TABLE fcm_tokens 
        ADD COLUMN device_type VARCHAR(50) DEFAULT 'web' AFTER token
      `);
      console.log('✅ Colonne device_type ajoutée à fcm_tokens');
    } else {
      console.log('✅ fcm_tokens.device_type existe');
    }
    
    // 2. Table automob_profiles - phone_country_code
    const [automobColumns] = await db.query('SHOW COLUMNS FROM automob_profiles');
    const hasPhoneCountryCode = automobColumns.some(col => col.Field === 'phone_country_code');
    
    if (!hasPhoneCountryCode) {
      await db.query(`
        ALTER TABLE automob_profiles 
        ADD COLUMN phone_country_code VARCHAR(10) DEFAULT '+33' AFTER phone
      `);
      console.log('✅ Colonne phone_country_code ajoutée à automob_profiles');
    } else {
      console.log('✅ automob_profiles.phone_country_code existe');
    }
    
    // 3. Mettre à jour les indicatifs existants
    await db.query(`
      UPDATE automob_profiles 
      SET phone_country_code = '+237'
      WHERE phone LIKE '+237%'
    `);
    
    await db.query(`
      UPDATE automob_profiles 
      SET phone_country_code = '+33'
      WHERE phone LIKE '+33%' OR phone LIKE '0%'
    `);
    
    console.log('✅ Indicatifs téléphoniques mis à jour\n');
    
  } catch (error) {
    console.error('❌ Erreur vérification tables:', error.message);
  }
}

async function updatePhoneNumbers() {
  console.log('📱 [3/4] Normalisation numéros de téléphone...\n');
  
  try {
    const [automobs] = await db.query(`
      SELECT user_id, phone, phone_country_code
      FROM automob_profiles
      WHERE phone IS NOT NULL AND phone != ''
    `);
    
    console.log(`📋 ${automobs.length} numéros à vérifier\n`);
    
    for (const automob of automobs) {
      let phone = automob.phone.replace(/\s+/g, '');
      let countryCode = automob.phone_country_code || '+33';
      let updated = false;
      
      // Normaliser le numéro
      if (!phone.startsWith('+')) {
        if (phone.startsWith('0') && phone.length === 10) {
          // Numéro français
          phone = '+33' + phone.substring(1);
          countryCode = '+33';
          updated = true;
        } else if (phone.startsWith('6') && phone.length === 9) {
          // Numéro camerounais sans 0
          phone = '+237' + phone;
          countryCode = '+237';
          updated = true;
        }
      } else {
        // Détecter le pays
        if (phone.startsWith('+33')) {
          countryCode = '+33';
          updated = true;
        } else if (phone.startsWith('+237')) {
          countryCode = '+237';
          updated = true;
        }
      }
      
      if (updated) {
        await db.query(`
          UPDATE automob_profiles 
          SET phone = ?, phone_country_code = ?
          WHERE user_id = ?
        `, [phone, countryCode, automob.user_id]);
        
        console.log(`✅ Automob ${automob.user_id}: ${automob.phone} → ${phone} (${countryCode})`);
      } else {
        console.log(`   Automob ${automob.user_id}: ${phone} (déjà normalisé)`);
      }
    }
    
    console.log('\n✅ Normalisation terminée\n');
    
  } catch (error) {
    console.error('❌ Erreur normalisation numéros:', error.message);
  }
}

async function showFinalState() {
  console.log('📊 [4/4] État final du système...\n');
  
  try {
    const [automobs] = await db.query(`
      SELECT 
        u.id,
        u.email,
        ap.first_name,
        ap.last_name,
        ap.phone,
        ap.phone_country_code,
        ap.sms_notifications,
        ap.web_push_enabled,
        ap.web_push_subscription,
        ap.id_verified
      FROM users u
      JOIN automob_profiles ap ON u.id = ap.user_id
      WHERE u.role = 'automob' AND u.verified = TRUE
      LIMIT 5
    `);
    
    console.log(`📋 ${automobs.length} automobs vérifiés:\n`);
    
    automobs.forEach(automob => {
      console.log(`👤 Automob #${automob.id}: ${automob.first_name || 'Sans nom'} ${automob.last_name || ''}`);
      console.log(`   Email: ${automob.email}`);
      console.log(`   Téléphone: ${automob.phone || 'Non défini'} (${automob.phone_country_code || 'N/A'})`);
      console.log(`   SMS: ${automob.sms_notifications === 1 ? '✅' : '❌'}`);
      console.log(`   Web Push: ${automob.web_push_enabled === 1 ? '✅' : '❌'}`);
      console.log(`   Subscription: ${automob.web_push_subscription ? '⚠️ À réactiver' : '❌ Aucune'}`);
      console.log('');
    });
    
    console.log('✅ Système prêt pour les notifications!\n');
    
  } catch (error) {
    console.error('❌ Erreur affichage état:', error.message);
  }
}

async function main() {
  try {
    await resetInvalidWebPushSubscriptions();
    await checkAndFixTables();
    await updatePhoneNumbers();
    await showFinalState();
    
    console.log('🎉 ========== CORRECTION TERMINÉE ==========\n');
    console.log('📝 Prochaine étape: Relancer le test avec node test-boss-lady.js\n');
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
  } finally {
    await db.end();
    process.exit(0);
  }
}

main();
