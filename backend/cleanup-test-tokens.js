/**
 * Script pour nettoyer les tokens FCM de test invalides
 * Ces tokens auto-générés ne fonctionnent pas avec Firebase
 */

import db from './config/database.js';

console.log('\n🧹 Nettoyage des tokens FCM de test...\n');

async function cleanupTestTokens() {
  try {
    // 1. Afficher les tokens actuels
    console.log('📋 Tokens actuels:');
    const [allTokens] = await db.query(`
      SELECT 
        ft.id,
        ft.user_id,
        u.email,
        SUBSTRING(ft.token, 1, 40) as token_preview,
        ft.created_at
      FROM fcm_tokens ft
      JOIN users u ON ft.user_id = u.id
      ORDER BY ft.created_at DESC
    `);

    allTokens.forEach(t => {
      const isTestToken = t.token_preview.startsWith('auto_fcm_') || 
                         t.token_preview.startsWith('fK1_test_token');
      console.log(`   ${isTestToken ? '❌' : '✅'} User ${t.user_id} (${t.email}): ${t.token_preview}...`);
    });

    // 2. Compter les tokens de test
    const [testTokens] = await db.query(`
      SELECT COUNT(*) as count 
      FROM fcm_tokens 
      WHERE token LIKE 'auto_fcm_%' OR token LIKE 'fK1_test_token%'
    `);

    const testTokenCount = testTokens[0].count;
    console.log(`\n📊 Tokens de test trouvés: ${testTokenCount}`);

    if (testTokenCount === 0) {
      console.log('✅ Aucun token de test à nettoyer!');
      return;
    }

    // 3. Supprimer les tokens de test
    console.log('\n🗑️  Suppression des tokens de test...');
    const [result] = await db.query(`
      DELETE FROM fcm_tokens 
      WHERE token LIKE 'auto_fcm_%' OR token LIKE 'fK1_test_token%'
    `);

    console.log(`✅ ${result.affectedRows} token(s) de test supprimé(s)`);

    // 4. Afficher les tokens restants
    console.log('\n📋 Tokens valides restants:');
    const [validTokens] = await db.query(`
      SELECT 
        ft.id,
        ft.user_id,
        u.email,
        u.role,
        SUBSTRING(ft.token, 1, 40) as token_preview,
        ft.created_at
      FROM fcm_tokens ft
      JOIN users u ON ft.user_id = u.id
      ORDER BY ft.created_at DESC
    `);

    if (validTokens.length === 0) {
      console.log('   ⚠️  Aucun token valide restant');
      console.log('   💡 Les utilisateurs devront réactiver les notifications dans l\'app');
    } else {
      validTokens.forEach(t => {
        console.log(`   ✅ User ${t.user_id} (${t.email}) | ${t.role} | ${t.token_preview}...`);
      });
    }

    console.log('\n✅ Nettoyage terminé!');
    console.log('\n💡 Les utilisateurs dont les tokens ont été supprimés devront:');
    console.log('   1. Se connecter à l\'application');
    console.log('   2. Autoriser les notifications dans le navigateur');
    console.log('   3. Un nouveau token FCM valide sera créé automatiquement');

  } catch (error) {
    console.error('\n❌ Erreur lors du nettoyage:', error);
  } finally {
    process.exit(0);
  }
}

cleanupTestTokens();
