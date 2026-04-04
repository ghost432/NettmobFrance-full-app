import { createNotification } from '../utils/notificationHelper.js';
import db from '../config/database.js';

async function sendTestNotifications() {
  console.log('🚀 Envoi de notifications de test à Thierry Ninja (User ID: 14)');
  console.log('================================================================\n');

  try {
    // Vérifier que Thierry a activé les Web Push
    const [[profile]] = await db.query(
      'SELECT web_push_enabled, LENGTH(web_push_subscription) as sub_length FROM automob_profiles WHERE user_id = 14'
    );

    console.log('📱 Statut Web Push de Thierry:');
    console.log(`   - Activé: ${profile.web_push_enabled ? '✅ OUI' : '❌ NON'}`);
    console.log(`   - Subscription: ${profile.sub_length ? `✅ OUI (${profile.sub_length} caractères)` : '❌ NON'}`);
    console.log('');

    if (!profile.web_push_enabled || !profile.sub_length) {
      console.log('⚠️  Web Push non configuré pour Thierry');
      console.log('   Veuillez activer les notifications dans le frontend');
      process.exit(1);
    }

    // Notification 1: Mission CORRESPOND
    console.log('📧 Envoi notification 1: Mission CORRESPOND');
    const notif1 = await createNotification(
      14,
      '🎯 Nouvelle mission disponible',
      '✅ TEST - Mission CORRESPOND à Thierry - 25.00€/h à Paris',
      'info',
      'mission',
      '/automob/missions'
    );
    console.log(`   ✅ Notification créée (ID: ${notif1.id})`);
    console.log('   🔔 Web Push envoyé\n');

    // Attendre 2 secondes
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Notification 2: Mission NE CORRESPOND PAS
    console.log('📧 Envoi notification 2: Mission NE CORRESPOND PAS');
    const notif2 = await createNotification(
      14,
      '❌ Mission non correspondante',
      '❌ TEST - Mission NE CORRESPOND PAS à Thierry - Cette mission ne correspond pas à vos critères (Secteur, Ville, Compétences, Disponibilité)',
      'warning',
      'mission',
      '/automob/profile'
    );
    console.log(`   ✅ Notification créée (ID: ${notif2.id})`);
    console.log('   🔔 Web Push envoyé\n');

    console.log('================================================================');
    console.log('✅ TEST TERMINÉ AVEC SUCCÈS');
    console.log('================================================================\n');
    console.log('📊 Résumé:');
    console.log('   - 2 notifications créées');
    console.log('   - 2 Web Push envoyés');
    console.log('   - Destinataire: Thierry Ninja (mounchilithierry432@gmail.com)');
    console.log('');
    console.log('🔍 Vérifications:');
    console.log('   1. Vérifier que Thierry a reçu 2 Web Push sur son navigateur');
    console.log('   2. Se connecter en tant que Thierry sur le frontend');
    console.log('   3. Cliquer sur la cloche pour voir les notifications');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

sendTestNotifications();
