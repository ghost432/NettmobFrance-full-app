import db from '../config/database.js';
import {
  createAutomobInvoice,
  createClientInvoice,
  createAdminSummaryInvoice
} from '../services/invoiceService.js';

/**
 * Script de réconciliation des factures
 * Vérifie les missions terminées et génère les factures manquantes
 */

async function reconcileInvoices() {
  console.log('🔍 RÉCONCILIATION DES FACTURES\n');
  console.log('═'.repeat(70));
  
  try {
    // 1. Trouver toutes les missions terminées
    console.log('\n📋 Étape 1: Recherche des missions terminées...');
    const [completedMissions] = await db.query(`
      SELECT DISTINCT
        ma.mission_id,
        ma.automob_id,
        ma.completed_at,
        m.mission_name,
        m.client_id,
        CONCAT(ap.first_name, ' ', ap.last_name) as automob_name
      FROM mission_automobs ma
      JOIN missions m ON ma.mission_id = m.id
      JOIN automob_profiles ap ON ma.automob_id = ap.user_id
      WHERE ma.status = 'termine'
      ORDER BY ma.completed_at DESC
    `);

    console.log(`✅ ${completedMissions.length} missions terminées trouvées\n`);

    if (completedMissions.length === 0) {
      console.log('ℹ️  Aucune mission terminée à traiter');
      return;
    }

    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // 2. Pour chaque mission terminée
    for (const mission of completedMissions) {
      console.log('─'.repeat(70));
      console.log(`\n🎯 Mission ID: ${mission.mission_id} - "${mission.mission_name}"`);
      console.log(`   Automob: ${mission.automob_name} (ID: ${mission.automob_id})`);
      console.log(`   Terminée le: ${new Date(mission.completed_at).toLocaleString('fr-FR')}`);

      try {
        // Vérifier si la facture automob existe déjà
        const [existingInvoices] = await db.query(
          'SELECT id FROM invoices WHERE mission_id = ? AND automob_id = ?',
          [mission.mission_id, mission.automob_id]
        );

        if (existingInvoices.length > 0) {
          console.log(`   ⏭️  Facture automob déjà existante (ID: ${existingInvoices[0].id}) - Ignoré`);
          skippedCount++;
          continue;
        }

        // Récupérer les timesheets approuvés
        const [approvedTimesheets] = await db.query(
          'SELECT id FROM timesheets WHERE mission_id = ? AND automob_id = ? AND status = "approuve"',
          [mission.mission_id, mission.automob_id]
        );

        if (approvedTimesheets.length === 0) {
          console.log('   ⚠️  Aucun timesheet approuvé trouvé - Ignoré');
          skippedCount++;
          continue;
        }

        const timesheetIds = approvedTimesheets.map(ts => ts.id);
        console.log(`   ✅ ${approvedTimesheets.length} timesheets approuvés trouvés: [${timesheetIds.join(', ')}]`);

        // Générer les factures
        console.log('\n   📄 Génération des factures...');

        // 1. Facture AUTOMOB (crédite automatiquement le wallet)
        console.log('   📝 Génération facture automob...');
        const automobInvoiceId = await createAutomobInvoice(
          mission.mission_id,
          mission.automob_id,
          timesheetIds
        );
        console.log(`   ✅ Facture automob créée: ID ${automobInvoiceId} - Wallet crédité`);

        // 2. Facture CLIENT
        console.log('   📝 Génération facture client...');
        const clientInvoiceId = await createClientInvoice(
          mission.mission_id,
          mission.automob_id,
          timesheetIds
        );
        console.log(`   ✅ Facture client créée: ID ${clientInvoiceId}`);

        // 3. Vérifier si facture admin existe déjà pour cette mission
        const [existingAdminInvoice] = await db.query(
          'SELECT id FROM admin_invoice_summary WHERE mission_id = ?',
          [mission.mission_id]
        );

        if (existingAdminInvoice.length === 0) {
          console.log('   📝 Génération facture admin...');
          const adminInvoiceId = await createAdminSummaryInvoice(mission.mission_id);
          console.log(`   ✅ Facture admin créée: ID ${adminInvoiceId}`);
        } else {
          console.log(`   ℹ️  Facture admin déjà existante (ID: ${existingAdminInvoice[0].id})`);
        }

        console.log('   🎉 Toutes les factures générées avec succès !');
        processedCount++;

      } catch (error) {
        console.error(`   ❌ Erreur pour mission ${mission.mission_id}:`, error.message);
        errorCount++;
      }
    }

    // Résumé final
    console.log('\n' + '═'.repeat(70));
    console.log('\n📊 RÉSUMÉ DE LA RÉCONCILIATION\n');
    console.log(`Total missions terminées: ${completedMissions.length}`);
    console.log(`✅ Factures générées: ${processedCount}`);
    console.log(`⏭️  Déjà existantes: ${skippedCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    console.log('\n✅ Réconciliation terminée !');

  } catch (error) {
    console.error('\n❌ Erreur fatale:', error);
    throw error;
  } finally {
    // Fermer la connexion à la base de données
    await db.end();
  }
}

// Exécuter le script
console.log('🚀 Démarrage du script de réconciliation...\n');
reconcileInvoices()
  .then(() => {
    console.log('\n✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script terminé avec des erreurs:', error);
    process.exit(1);
  });
