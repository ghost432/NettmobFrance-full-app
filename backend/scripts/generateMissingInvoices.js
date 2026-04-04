import db from '../config/database.js';
import { createAutomobInvoice, createClientInvoice } from '../services/invoiceService.js';

async function generateMissingInvoices() {
  try {
    console.log('🔍 Recherche des timesheets approuvés sans factures...');

    // Récupérer tous les timesheets approuvés groupés par mission et automob
    const [timesheets] = await db.query(`
      SELECT 
        t.mission_id,
        t.automob_id,
        GROUP_CONCAT(t.id) as timesheet_ids,
        COUNT(*) as timesheet_count,
        SUM(t.total_hours) as total_hours
      FROM timesheets t
      WHERE t.status = 'approuve'
      GROUP BY t.mission_id, t.automob_id
    `);

    console.log(`📋 Trouvé ${timesheets.length} groupes de timesheets approuvés`);

    for (const group of timesheets) {
      const { mission_id, automob_id, timesheet_ids, timesheet_count, total_hours } = group;
      
      // Vérifier si des factures existent déjà pour cette mission/automob
      const [existingInvoices] = await db.query(
        'SELECT COUNT(*) as count FROM invoices WHERE mission_id = ? AND automob_id = ?',
        [mission_id, automob_id]
      );

      if (existingInvoices[0].count > 0) {
        console.log(`⏭️  Factures déjà existantes pour mission ${mission_id}, automob ${automob_id}`);
        continue;
      }

      console.log(`\n📄 Génération factures pour mission ${mission_id}, automob ${automob_id}`);
      console.log(`   - ${timesheet_count} timesheets`);
      console.log(`   - ${total_hours}h au total`);

      try {
        // Créer ou mettre à jour mission_automobs
        const [missionAutomobs] = await db.query(
          'SELECT id FROM mission_automobs WHERE mission_id = ? AND automob_id = ?',
          [mission_id, automob_id]
        );

        if (missionAutomobs.length === 0) {
          console.log(`   📝 Création mission_automobs...`);
          await db.query(
            'INSERT INTO mission_automobs (mission_id, automob_id, status, created_at) VALUES (?, ?, "termine", NOW())',
            [mission_id, automob_id]
          );
        } else {
          console.log(`   📝 Mise à jour mission_automobs...`);
          await db.query(
            'UPDATE mission_automobs SET status = "termine", completed_at = NOW() WHERE mission_id = ? AND automob_id = ?',
            [mission_id, automob_id]
          );
        }

        // Convertir les IDs en tableau
        const timesheetIdsArray = timesheet_ids.split(',').map(id => parseInt(id));

        // Créer la facture automob
        console.log(`   💰 Création facture automob...`);
        const automobInvoiceId = await createAutomobInvoice(mission_id, automob_id, timesheetIdsArray);
        console.log(`   ✅ Facture automob créée: ${automobInvoiceId}`);

        // Créer la facture client
        console.log(`   💰 Création facture client...`);
        const clientInvoiceId = await createClientInvoice(mission_id, automob_id, timesheetIdsArray);
        console.log(`   ✅ Facture client créée: ${clientInvoiceId}`);

      } catch (error) {
        console.error(`   ❌ Erreur génération factures:`, error.message);
      }
    }

    console.log('\n✅ Génération des factures terminée !');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

generateMissingInvoices();
