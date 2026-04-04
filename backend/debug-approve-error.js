#!/usr/bin/env node

import axios from 'axios';
import db from './config/database.js';

async function debugApproveError() {
  try {
    console.log('🔍 Débogage erreur approbation feuille de temps ID: 5');
    
    // 1. Vérifier si la feuille de temps existe
    console.log('\n📋 Vérification existence feuille de temps ID 5:');
    const [timesheets] = await db.query(`
      SELECT ts.*, m.client_id, m.id as mission_id, m.mission_name, 
             m.total_hours as mission_total_hours,
             u.email as client_email, cp.company_name
      FROM timesheets ts
      JOIN missions m ON ts.mission_id = m.id
      JOIN users u ON m.client_id = u.id
      LEFT JOIN client_profiles cp ON u.id = cp.user_id
      WHERE ts.id = ?
    `, [5]);
    
    if (timesheets.length === 0) {
      console.log('❌ Feuille de temps ID 5 non trouvée');
      return;
    }
    
    const timesheet = timesheets[0];
    console.log('✅ Feuille de temps trouvée:');
    console.log(`   ID: ${timesheet.id}`);
    console.log(`   Status: ${timesheet.status}`);
    console.log(`   Mission: ${timesheet.mission_name} (ID: ${timesheet.mission_id})`);
    console.log(`   Automob ID: ${timesheet.automob_id}`);
    console.log(`   Client ID: ${timesheet.client_id}`);
    console.log(`   Total heures: ${timesheet.total_hours}h`);
    
    // 2. Vérifier les conditions de la route approve
    console.log('\n📋 Vérification des conditions d\'approbation:');
    
    if (timesheet.status !== 'soumis') {
      console.log(`❌ Status incorrect: ${timesheet.status} (attendu: 'soumis')`);
      console.log('   → Cela expliquerait le 404');
      return;
    } else {
      console.log('✅ Status correct: soumis');
    }
    
    // 3. Simulation de la logique d'approbation
    console.log('\n📋 Simulation logique d\'approbation:');
    
    try {
      // Vérifier les timesheets en attente pour cet automob sur cette mission
      const [pendingCheck] = await db.query(`
        SELECT COUNT(*) as pending_count
        FROM timesheets 
        WHERE mission_id = ? AND automob_id = ? AND status IN ('brouillon', 'soumis')
      `, [timesheet.mission_id, timesheet.automob_id]);
      
      const hasPendingTimesheets = pendingCheck[0].pending_count > 0;
      console.log(`   Timesheets en attente: ${pendingCheck[0].pending_count}`);
      console.log(`   Mission sera terminée: ${!hasPendingTimesheets ? 'OUI' : 'NON'}`);
      
      // 4. Test des fonctions de facturation (potentielle cause d'erreur)
      if (!hasPendingTimesheets) {
        console.log('\n📋 Test logique de facturation (cause potentielle d\'erreur 500):');
        
        // Vérifier si les modules d'invoice sont importés correctement
        try {
          const invoiceService = await import('./services/invoiceService.js');
          console.log('✅ Service invoiceService importé correctement');
          console.log(`   createAutomobInvoice: ${typeof invoiceService.createAutomobInvoice}`);
          console.log(`   createClientInvoice: ${typeof invoiceService.createClientInvoice}`);
        } catch (importError) {
          console.log('❌ Erreur import invoiceService:', importError.message);
        }
        
        // Vérifier la table mission_automobs
        const [missionAutomobs] = await db.query(
          'SELECT id FROM mission_automobs WHERE mission_id = ? AND automob_id = ?',
          [timesheet.mission_id, timesheet.automob_id]
        );
        console.log(`   mission_automobs existe: ${missionAutomobs.length > 0 ? 'OUI' : 'NON'}`);
        
        // Vérifier les tables de factures
        console.log('\n📋 Vérification tables factures:');
        try {
          const [invoiceCols] = await db.query('SHOW TABLES LIKE "invoices%"');
          console.log('   Tables invoices:', invoiceCols.map(t => Object.values(t)[0]));
        } catch (tableError) {
          console.log('❌ Erreur vérification tables:', tableError.message);
        }
      }
      
      console.log('\n✅ Simulation logique réussie - Pas d\'erreur détectée');
      
    } catch (simulationError) {
      console.error('❌ ERREUR dans la simulation:', simulationError);
      console.error('   Message:', simulationError.message);
      console.error('   Code:', simulationError.code);
      console.log('💡 Cette erreur pourrait expliquer le 500');
    }
    
    // 5. Test de requête directe vers l'API (si possible)
    console.log('\n📋 Status final:');
    console.log(`   Timesheet ID 5 existe: ✅`);
    console.log(`   Status: ${timesheet.status}`);
    console.log(`   Problème probable: ${timesheet.status !== 'soumis' ? '404 - Status incorrect' : 'Erreur dans logique facturation (500)'}`);
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
    console.error('Stack:', error.stack);
  } finally {
    console.log('\n📋 Débogage terminé');
    process.exit(0);
  }
}

debugApproveError();
