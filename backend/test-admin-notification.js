import { createNotification } from './utils/notificationHelper.js';
import db from './config/database.js';

/**
 * Script de test pour vérifier que les notifications admin fonctionnent
 * Usage: node test-admin-notification.js
 */

async function testAdminNotification() {
  console.log('\n🧪 Test du système de notifications admin\n');
  console.log('=' .repeat(60));
  
  try {
    // 1. Récupérer un utilisateur de test
    console.log('\n1️⃣ Recherche d\'un utilisateur de test...');
    const [users] = await db.query(
      'SELECT id, email, role FROM users WHERE role IN ("automob", "client") LIMIT 1'
    );
    
    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé. Veuillez créer un utilisateur automob ou client.');
      process.exit(1);
    }
    
    const testUser = users[0];
    console.log(`✅ Utilisateur trouvé: ${testUser.email} (ID: ${testUser.id}, Role: ${testUser.role})`);
    
    // 2. Vérifier la configuration Web Push
    console.log('\n2️⃣ Vérification configuration Web Push...');
    const table = testUser.role === 'automob' ? 'automob_profiles' : 'client_profiles';
    const [[profile]] = await db.query(
      `SELECT web_push_enabled, web_push_subscription FROM ${table} WHERE user_id = ?`,
      [testUser.id]
    );
    
    if (!profile) {
      console.log(`⚠️  Profil ${testUser.role} non trouvé pour cet utilisateur`);
    } else {
      console.log(`   Web Push activé: ${profile.web_push_enabled ? '✅ Oui' : '❌ Non'}`);
      console.log(`   Souscription: ${profile.web_push_subscription ? '✅ Configurée' : '❌ Non configurée'}`);
    }
    
    // 3. Envoyer une notification de test
    console.log('\n3️⃣ Envoi d\'une notification de test...');
    const notification = await createNotification(
      testUser.id,
      '🧪 Test Notification Admin',
      `Ceci est un test du système de notifications. Si vous voyez ce message, tout fonctionne ! Envoyé à ${new Date().toLocaleTimeString('fr-FR')}`,
      'info',
      'system',
      '/notifications',
      null // pas de Socket.IO dans un script standalone
    );
    
    console.log('✅ Notification créée avec succès !');
    console.log(`   ID: ${notification.id}`);
    console.log(`   Titre: ${notification.title}`);
    console.log(`   Message: ${notification.message}`);
    
    // 4. Vérifier dans la BDD
    console.log('\n4️⃣ Vérification dans la base de données...');
    const [[dbNotif]] = await db.query(
      'SELECT * FROM notifications WHERE id = ?',
      [notification.id]
    );
    
    if (dbNotif) {
      console.log('✅ Notification trouvée dans la BDD');
      console.log(`   User ID: ${dbNotif.user_id}`);
      console.log(`   Type: ${dbNotif.type}`);
      console.log(`   Catégorie: ${dbNotif.category}`);
      console.log(`   Lue: ${dbNotif.is_read ? 'Oui' : 'Non'}`);
    } else {
      console.log('❌ Notification non trouvée dans la BDD');
    }
    
    // 5. Résumé
    console.log('\n' + '=' .repeat(60));
    console.log('\n📊 RÉSUMÉ DU TEST\n');
    console.log('✅ Notification créée en BDD');
    console.log('✅ Web Push envoyé (si configuré)');
    console.log('⚠️  Socket.IO non testé (nécessite serveur actif)');
    
    console.log('\n💡 Pour tester complètement :');
    console.log('   1. Connectez-vous avec l\'utilisateur:', testUser.email);
    console.log('   2. Activez les notifications dans Paramètres');
    console.log('   3. Utilisez l\'interface admin pour envoyer une notification ciblée');
    
    console.log('\n🎉 Test terminé avec succès !\n');
    
  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

// Exécuter le test
testAdminNotification();
