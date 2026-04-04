import db from './config/database.js';

async function testAutomobProfileRoute() {
  try {
    console.log('\n=== Test Route /api/automob/profile ===\n');
    
    const userId = 24; // ID de mounchilithierry432@gmail.com
    
    console.log(`Simulation de GET /api/automob/profile pour user_id: ${userId}\n`);
    
    // Simuler exactement ce que fait la route
    
    // 1. Vérifier si le profil existe
    const [existingProfiles] = await db.query(
      'SELECT id FROM automob_profiles WHERE user_id = ?',
      [userId]
    );
    
    console.log(`Étape 1 - Vérification existence profil:`);
    console.log(`   Nombre de profils trouvés: ${existingProfiles.length}`);
    
    if (existingProfiles.length === 0) {
      console.log(`   Action: Création du profil\n`);
      await db.query(
        'INSERT INTO automob_profiles (user_id, created_at, updated_at) VALUES (?, NOW(), NOW())',
        [userId]
      );
    } else {
      console.log(`   Action: Profil existe déjà (ID: ${existingProfiles[0].id})\n`);
    }
    
    // 2. Récupérer le profil
    console.log(`Étape 2 - Récupération du profil:`);
    const [profiles] = await db.query(
      `SELECT first_name, last_name, iban, bic_swift, phone, city, address, profile_picture
       FROM automob_profiles 
       WHERE user_id = ?`,
      [userId]
    );
    
    console.log(`   Nombre de profils retournés: ${profiles.length}\n`);
    
    if (profiles.length > 0) {
      const profile = profiles[0];
      console.log(`✅ Profil retourné:`);
      console.log(`   first_name: "${profile.first_name || 'null'}"`);
      console.log(`   last_name: "${profile.last_name || 'null'}"`);
      console.log(`   iban: "${profile.iban || 'null'}"`);
      console.log(`   bic_swift: "${profile.bic_swift || 'null'}"`);
      console.log(`   phone: "${profile.phone || 'null'}"`);
      console.log(`   city: "${profile.city || 'null'}"`);
      console.log(`   address: "${profile.address || 'null'}"`);
      console.log(`   profile_picture: "${profile.profile_picture || 'null'}"\n`);
      
      // 3. Simuler la réponse JSON
      console.log(`Étape 3 - Réponse JSON simulée:`);
      const response = { profile: profiles[0] };
      console.log(JSON.stringify(response, null, 2));
      console.log('');
      
      // 4. Vérifier les valeurs
      console.log(`\n=== VÉRIFICATION DES VALEURS ===\n`);
      
      const checks = [
        { field: 'first_name', value: profile.first_name, expected: 'Patrice Raoul' },
        { field: 'last_name', value: profile.last_name, expected: 'Geoffroy' },
        { field: 'iban', value: profile.iban, expected: 'FR76 8555 5555 8888 9999 6666 66' },
        { field: 'bic_swift', value: profile.bic_swift, expected: 'BNPAFRPP234' }
      ];
      
      checks.forEach(check => {
        const status = check.value === check.expected ? '✅' : '❌';
        console.log(`${status} ${check.field}:`);
        console.log(`   Attendu: "${check.expected}"`);
        console.log(`   Obtenu:  "${check.value || 'null'}"`);
        
        if (check.value !== check.expected) {
          if (!check.value || check.value === null) {
            console.log(`   ⚠️  PROBLÈME: Valeur NULL ou vide dans la base !`);
          } else {
            console.log(`   ⚠️  PROBLÈME: Valeur différente !`);
          }
        }
        console.log('');
      });
      
    } else {
      console.log(`❌ Aucun profil retourné après récupération`);
    }
    
    console.log(`✅ Test terminé\n`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

testAutomobProfileRoute();
