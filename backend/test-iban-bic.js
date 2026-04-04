import db from './config/database.js';

async function testIBANBIC() {
  try {
    console.log('\n=== Test IBAN et BIC ===\n');
    
    // Récupérer tous les automobs
    const [automobs] = await db.query(`
      SELECT 
        u.id,
        u.email,
        ap.first_name,
        ap.last_name,
        ap.iban,
        ap.bic_swift
      FROM users u
      LEFT JOIN automob_profiles ap ON u.id = ap.user_id
      WHERE u.role = 'automob'
      LIMIT 10
    `);
    
    console.log(`📊 ${automobs.length} automobs trouvés:\n`);
    
    automobs.forEach(automob => {
      console.log(`👤 ${automob.email}`);
      console.log(`   Nom: ${automob.first_name} ${automob.last_name}`);
      console.log(`   IBAN: ${automob.iban || '❌ NULL'}`);
      console.log(`   BIC: ${automob.bic_swift || '❌ NULL'}`);
      console.log('');
    });
    
    // Compter ceux avec IBAN
    const withIBAN = automobs.filter(a => a.iban).length;
    const withBIC = automobs.filter(a => a.bic_swift).length;
    
    console.log(`\n📈 Statistiques:`);
    console.log(`   Avec IBAN: ${withIBAN}/${automobs.length}`);
    console.log(`   Avec BIC: ${withBIC}/${automobs.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

testIBANBIC();
