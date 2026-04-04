import db from './config/database.js';

async function restoreAutomobWalletInfo() {
  try {
    console.log('\n=== Restauration Informations Wallet Automob ===\n');
    
    const email = 'mounchilithierry432@gmail.com';
    
    // 1. Récupérer l'utilisateur
    const [users] = await db.query(
      'SELECT id, email, role FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      console.log(`❌ Utilisateur ${email} non trouvé`);
      process.exit(1);
    }
    
    const user = users[0];
    console.log(`✅ Utilisateur trouvé:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Rôle: ${user.role}\n`);
    
    if (user.role !== 'automob') {
      console.log(`❌ L'utilisateur n'est pas un automob`);
      process.exit(1);
    }
    
    // 2. Vérifier le profil automob
    const [profiles] = await db.query(
      `SELECT 
        id,
        user_id,
        first_name,
        last_name,
        iban,
        bic_swift,
        phone,
        city,
        address
      FROM automob_profiles
      WHERE user_id = ?`,
      [user.id]
    );
    
    if (profiles.length === 0) {
      console.log(`❌ Profil automob non trouvé pour user_id ${user.id}`);
      console.log(`ℹ️  Création du profil...`);
      
      await db.query(
        'INSERT INTO automob_profiles (user_id, created_at, updated_at) VALUES (?, NOW(), NOW())',
        [user.id]
      );
      
      console.log(`✅ Profil créé\n`);
      
      // Récupérer le profil nouvellement créé
      const [newProfiles] = await db.query(
        'SELECT * FROM automob_profiles WHERE user_id = ?',
        [user.id]
      );
      profiles.push(newProfiles[0]);
    }
    
    const profile = profiles[0];
    console.log(`✅ Profil automob trouvé:`);
    console.log(`   ID: ${profile.id}`);
    console.log(`   Nom: ${profile.first_name || 'NON RENSEIGNÉ'} ${profile.last_name || ''}`);
    console.log(`   IBAN: ${profile.iban || 'NON RENSEIGNÉ'}`);
    console.log(`   BIC: ${profile.bic_swift || 'NON RENSEIGNÉ'}`);
    console.log(`   Téléphone: ${profile.phone || 'NON RENSEIGNÉ'}`);
    console.log(`   Ville: ${profile.city || 'NON RENSEIGNÉ'}\n`);
    
    // 3. Vérifier le wallet
    const [wallets] = await db.query(
      'SELECT id, automob_id, balance, total_earned, total_withdrawn FROM wallets WHERE automob_id = ?',
      [user.id]
    );
    
    if (wallets.length === 0) {
      console.log(`ℹ️  Wallet non trouvé, création...`);
      await db.query(
        'INSERT INTO wallets (automob_id, balance, total_earned, total_withdrawn, created_at, updated_at) VALUES (?, 0.00, 0.00, 0.00, NOW(), NOW())',
        [user.id]
      );
      console.log(`✅ Wallet créé\n`);
    } else {
      console.log(`✅ Wallet trouvé:`);
      console.log(`   ID: ${wallets[0].id}`);
      console.log(`   Solde: ${wallets[0].balance} €`);
      console.log(`   Total gagné: ${wallets[0].total_earned} €`);
      console.log(`   Total retiré: ${wallets[0].total_withdrawn} €\n`);
    }
    
    // 4. Vérifier les demandes de retrait
    const [withdrawals] = await db.query(
      `SELECT 
        id,
        amount,
        status,
        bank_details,
        payment_method,
        requested_at,
        reviewed_at,
        completed_at
      FROM withdrawal_requests
      WHERE automob_id = ?
      ORDER BY requested_at DESC`,
      [user.id]
    );
    
    console.log(`📋 Demandes de retrait: ${withdrawals.length}`);
    
    if (withdrawals.length > 0) {
      withdrawals.forEach((withdrawal, index) => {
        console.log(`\n   Retrait #${index + 1}:`);
        console.log(`   - ID: ${withdrawal.id}`);
        console.log(`   - Montant: ${withdrawal.amount} €`);
        console.log(`   - Statut: ${withdrawal.status}`);
        console.log(`   - Méthode: ${withdrawal.payment_method}`);
        console.log(`   - Date demande: ${withdrawal.requested_at}`);
        if (withdrawal.reviewed_at) {
          console.log(`   - Date revue: ${withdrawal.reviewed_at}`);
        }
        if (withdrawal.completed_at) {
          console.log(`   - Date complétée: ${withdrawal.completed_at}`);
        }
        
        if (withdrawal.bank_details) {
          try {
            const bankDetails = JSON.parse(withdrawal.bank_details);
            console.log(`   - Titulaire: ${bankDetails.accountHolderName || 'N/A'}`);
            console.log(`   - IBAN: ${bankDetails.iban || 'N/A'}`);
            console.log(`   - BIC: ${bankDetails.bic || 'N/A'}`);
          } catch (e) {
            console.log(`   - Détails bancaires: ${withdrawal.bank_details}`);
          }
        }
      });
    }
    
    // 5. Résumé et recommandations
    console.log(`\n\n=== RÉSUMÉ ===\n`);
    
    const hasName = profile.first_name && profile.last_name;
    const hasIBAN = profile.iban && profile.iban.trim() !== '';
    const hasBIC = profile.bic_swift && profile.bic_swift.trim() !== '';
    
    console.log(`✅ Statut du profil:`);
    console.log(`   ${hasName ? '✅' : '❌'} Nom et prénom`);
    console.log(`   ${hasIBAN ? '✅' : '❌'} IBAN`);
    console.log(`   ${hasBIC ? '✅' : '❌'} BIC/SWIFT\n`);
    
    if (!hasName || !hasIBAN || !hasBIC) {
      console.log(`⚠️  INFORMATIONS MANQUANTES:\n`);
      
      if (!hasName) {
        console.log(`   ❌ Nom et prénom non renseignés`);
        console.log(`      → L'automob doit remplir son profil sur /automob/profile\n`);
      }
      
      if (!hasIBAN) {
        console.log(`   ❌ IBAN non renseigné`);
        console.log(`      → L'automob doit remplir son IBAN sur /automob/profile\n`);
      }
      
      if (!hasBIC) {
        console.log(`   ❌ BIC/SWIFT non renseigné`);
        console.log(`      → L'automob doit remplir son BIC sur /automob/profile\n`);
      }
      
      console.log(`📝 INSTRUCTIONS POUR L'AUTOMOB:`);
      console.log(`   1. Se connecter sur https://votre-site.com`);
      console.log(`   2. Aller sur Mon Profil (/automob/profile)`);
      console.log(`   3. Remplir les informations personnelles:`);
      if (!hasName) console.log(`      - Prénom et Nom`);
      if (!hasIBAN) console.log(`      - IBAN`);
      if (!hasBIC) console.log(`      - BIC/SWIFT`);
      console.log(`   4. Cliquer sur "Enregistrer"`);
      console.log(`   5. Retourner sur Mon Wallet (/automob/wallet)`);
      console.log(`   6. Cliquer sur "Actualiser" dans la section Informations bancaires\n`);
    } else {
      console.log(`✅ PROFIL COMPLET`);
      console.log(`   Toutes les informations bancaires sont présentes.`);
      console.log(`   L'automob peut faire des demandes de retrait.\n`);
    }
    
    // 6. Test de la route API
    console.log(`\n=== TEST DE LA ROUTE API ===\n`);
    console.log(`📍 Route: GET /api/automob/profile`);
    console.log(`   Cette route doit retourner:`);
    console.log(`   {`);
    console.log(`     "profile": {`);
    console.log(`       "first_name": "${profile.first_name || 'null'}",`);
    console.log(`       "last_name": "${profile.last_name || 'null'}",`);
    console.log(`       "iban": "${profile.iban || 'null'}",`);
    console.log(`       "bic_swift": "${profile.bic_swift || 'null'}",`);
    console.log(`       ...`);
    console.log(`     }`);
    console.log(`   }\n`);
    
    console.log(`✅ Script terminé avec succès\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

restoreAutomobWalletInfo();
