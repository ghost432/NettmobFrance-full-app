import db from './config/database.js';

const checkStatus = async () => {
  try {
    console.log('📊 Vérification du statut des demandes...\n');
    
    const [stats] = await db.query(`
      SELECT status, COUNT(*) as count 
      FROM identity_verifications_new 
      GROUP BY status
    `);
    
    console.log('Statut des vérifications:');
    if (stats.length === 0) {
      console.log('  Aucune demande trouvée');
    } else {
      stats.forEach(s => {
        const emoji = s.status === 'pending' ? '⏳' : s.status === 'approved' ? '✅' : '❌';
        console.log(`  ${emoji} ${s.status}: ${s.count}`);
      });
    }
    
    console.log('\n📋 Dernières demandes:');
    const [recent] = await db.query(`
      SELECT v.id, v.user_type, v.status, v.submitted_at,
             COALESCE(v.first_name, v.manager_first_name) as first_name,
             COALESCE(v.last_name, v.manager_last_name) as last_name
      FROM identity_verifications_new v
      ORDER BY v.submitted_at DESC
      LIMIT 5
    `);
    
    if (recent.length === 0) {
      console.log('  Aucune demande récente');
    } else {
      recent.forEach(r => {
        const emoji = r.status === 'pending' ? '⏳' : r.status === 'approved' ? '✅' : '❌';
        console.log(`  ${emoji} #${r.id} - ${r.first_name} ${r.last_name} (${r.user_type}) - ${new Date(r.submitted_at).toLocaleString('fr-FR')}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

checkStatus();
