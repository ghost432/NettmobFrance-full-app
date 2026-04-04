import db from '../config/database.js';

/**
 * Script de vérification des missions terminées
 * Affiche un état détaillé sans modifier les données
 */

async function checkCompletedMissions() {
  console.log('🔍 VÉRIFICATION DES MISSIONS TERMINÉES\n');
  console.log('═'.repeat(70));
  
  try {
    // 1. Statistiques globales
    console.log('\n📊 STATISTIQUES GLOBALES\n');

    const [stats] = await db.query(`
      SELECT
        COUNT(DISTINCT ma.mission_id) as total_missions_terminees,
        COUNT(DISTINCT ma.automob_id) as total_automobs_termines,
        COUNT(DISTINCT i.id) as total_factures_automob
      FROM mission_automobs ma
      LEFT JOIN invoices i ON ma.mission_id = i.mission_id AND ma.automob_id = i.automob_id
      WHERE ma.status = 'termine'
    `);

    console.log(`Missions terminées: ${stats[0].total_missions_terminees}`);
    console.log(`Automobs avec missions terminées: ${stats[0].total_automobs_termines}`);
    console.log(`Factures automob générées: ${stats[0].total_factures_automob}`);
    
    const missing = stats[0].total_missions_terminees - stats[0].total_factures_automob;
    if (missing > 0) {
      console.log(`⚠️  Factures manquantes: ${missing}`);
    } else {
      console.log(`✅ Toutes les missions ont leurs factures`);
    }

    // 2. Missions terminées sans factures
    console.log('\n\n⚠️  MISSIONS TERMINÉES SANS FACTURES\n');
    console.log('─'.repeat(70));

    const [missionsWithoutInvoices] = await db.query(`
      SELECT
        ma.mission_id,
        ma.automob_id,
        ma.completed_at,
        m.mission_name,
        m.hourly_rate,
        CONCAT(ap.first_name, ' ', ap.last_name) as automob_name,
        CONCAT(cp.company_name) as client_name,
        (SELECT COUNT(*) FROM timesheets 
         WHERE mission_id = ma.mission_id 
         AND automob_id = ma.automob_id 
         AND status = 'approuve') as timesheets_approuves,
        (SELECT SUM(total_hours) FROM timesheets 
         WHERE mission_id = ma.mission_id 
         AND automob_id = ma.automob_id 
         AND status = 'approuve') as total_heures
      FROM mission_automobs ma
      JOIN missions m ON ma.mission_id = m.id
      JOIN automob_profiles ap ON ma.automob_id = ap.user_id
      JOIN client_profiles cp ON m.client_id = cp.user_id
      LEFT JOIN invoices i ON ma.mission_id = i.mission_id AND ma.automob_id = i.automob_id
      WHERE ma.status = 'termine'
        AND i.id IS NULL
      ORDER BY ma.completed_at DESC
    `);

    if (missionsWithoutInvoices.length === 0) {
      console.log('✅ Aucune mission terminée sans facture - Tout est à jour !');
    } else {
      console.log(`🔴 ${missionsWithoutInvoices.length} missions terminées SANS factures trouvées:\n`);

      missionsWithoutInvoices.forEach((mission, index) => {
        console.log(`${index + 1}. Mission ID: ${mission.mission_id} - "${mission.mission_name}"`);
        console.log(`   Automob: ${mission.automob_name} (ID: ${mission.automob_id})`);
        console.log(`   Client: ${mission.client_name}`);
        console.log(`   Terminée: ${new Date(mission.completed_at).toLocaleString('fr-FR')}`);
        console.log(`   Taux horaire: ${mission.hourly_rate}€/h`);
        console.log(`   Timesheets approuvés: ${mission.timesheets_approuves || 0}`);
        console.log(`   Total heures: ${mission.total_heures || 0}h`);
        
        if (mission.timesheets_approuves > 0) {
          const montantEstime = (mission.total_heures || 0) * (mission.hourly_rate || 0);
          console.log(`   💰 Montant estimé: ${montantEstime.toFixed(2)}€`);
          console.log(`   ✅ Prêt pour génération de facture`);
        } else {
          console.log(`   ⚠️  AUCUN timesheet approuvé - Facture impossible`);
        }
        console.log('');
      });

      // Calculer le montant total manquant
      const totalMontantManquant = missionsWithoutInvoices.reduce((sum, m) => {
        if (m.timesheets_approuves > 0) {
          return sum + ((m.total_heures || 0) * (m.hourly_rate || 0));
        }
        return sum;
      }, 0);

      console.log('─'.repeat(70));
      console.log(`💰 MONTANT TOTAL À GÉNÉRER: ${totalMontantManquant.toFixed(2)}€\n`);
    }

    // 3. Missions avec factures (vérification)
    console.log('\n✅ MISSIONS AVEC FACTURES (Dernières 10)\n');
    console.log('─'.repeat(70));

    const [missionsWithInvoices] = await db.query(`
      SELECT
        ma.mission_id,
        ma.automob_id,
        ma.completed_at,
        m.mission_name,
        CONCAT(ap.first_name, ' ', ap.last_name) as automob_name,
        i.id as invoice_id,
        i.amount as invoice_amount,
        i.generated_at
      FROM mission_automobs ma
      JOIN missions m ON ma.mission_id = m.id
      JOIN automob_profiles ap ON ma.automob_id = ap.user_id
      JOIN invoices i ON ma.mission_id = i.mission_id AND ma.automob_id = i.automob_id
      WHERE ma.status = 'termine'
      ORDER BY i.generated_at DESC
      LIMIT 10
    `);

    if (missionsWithInvoices.length > 0) {
      missionsWithInvoices.forEach((mission, index) => {
        console.log(`${index + 1}. Mission: "${mission.mission_name}"`);
        console.log(`   Automob: ${mission.automob_name}`);
        console.log(`   Facture ID: ${mission.invoice_id} - Montant: ${mission.invoice_amount}€`);
        console.log(`   Générée: ${new Date(mission.generated_at).toLocaleString('fr-FR')}`);
        console.log('');
      });
    }

    // 4. État des wallets
    console.log('\n💰 ÉTAT DES WALLETS AUTOMOBS (Top 10 soldes)\n');
    console.log('─'.repeat(70));

    const [wallets] = await db.query(`
      SELECT
        w.user_id,
        CONCAT(ap.first_name, ' ', ap.last_name) as automob_name,
        w.balance,
        (SELECT COUNT(*) FROM wallet_transactions wt 
         WHERE wt.wallet_id = w.id) as total_transactions,
        (SELECT SUM(amount) FROM wallet_transactions wt 
         WHERE wt.wallet_id = w.id AND wt.type = 'credit') as total_credits,
        (SELECT SUM(amount) FROM wallet_transactions wt 
         WHERE wt.wallet_id = w.id AND wt.type = 'debit') as total_debits
      FROM wallets w
      JOIN automob_profiles ap ON w.user_id = ap.user_id
      ORDER BY w.balance DESC
      LIMIT 10
    `);

    wallets.forEach((wallet, index) => {
      console.log(`${index + 1}. ${wallet.automob_name} (ID: ${wallet.user_id})`);
      console.log(`   Solde: ${wallet.balance}€`);
      console.log(`   Transactions: ${wallet.total_transactions || 0}`);
      console.log(`   Crédits: ${wallet.total_credits || 0}€`);
      console.log(`   Débits: ${wallet.total_debits || 0}€`);
      console.log('');
    });

    // Résumé des actions recommandées
    console.log('\n' + '═'.repeat(70));
    console.log('\n📋 RECOMMANDATIONS\n');

    if (missionsWithoutInvoices.length > 0) {
      const readyForInvoicing = missionsWithoutInvoices.filter(m => m.timesheets_approuves > 0);
      
      if (readyForInvoicing.length > 0) {
        console.log(`🟢 ${readyForInvoicing.length} missions prêtes pour génération de factures`);
        console.log('   → Exécutez: node scripts/reconcile-invoices.js');
      }
      
      const notReady = missionsWithoutInvoices.filter(m => m.timesheets_approuves === 0);
      if (notReady.length > 0) {
        console.log(`🔴 ${notReady.length} missions sans timesheets approuvés`);
        console.log('   → Approuvez d\'abord les timesheets avant de générer les factures');
      }
    } else {
      console.log('✅ Toutes les missions terminées ont leurs factures');
      console.log('   → Aucune action nécessaire');
    }

    console.log('\n✅ Vérification terminée !');

  } catch (error) {
    console.error('\n❌ Erreur:', error);
    throw error;
  } finally {
    await db.end();
  }
}

// Exécuter le script
console.log('🚀 Démarrage de la vérification...\n');
checkCompletedMissions()
  .then(() => {
    console.log('\n✅ Vérification terminée avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Vérification terminée avec des erreurs:', error);
    process.exit(1);
  });
