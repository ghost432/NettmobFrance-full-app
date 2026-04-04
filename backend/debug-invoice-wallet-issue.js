#!/usr/bin/env node

import db from './config/database.js';
import { createAutomobInvoice, createClientInvoice } from './services/invoiceService.js';

async function debugInvoiceWalletIssue() {
  try {
    console.log('🔍 Diagnostic du problème factures/wallet...');
    
    // 1. Vérifier les feuilles de temps approuvées récemment
    console.log('\n📋 Recherche feuilles de temps approuvées récemment...');
    
    const [recentApproved] = await db.query(`
      SELECT ts.*, 
             m.mission_name, m.client_id, m.hourly_rate,
             u.email as automob_email,
             cp.company_name as client_company
      FROM timesheets ts
      JOIN missions m ON ts.mission_id = m.id  
      JOIN users u ON ts.automob_id = u.id
      LEFT JOIN client_profiles cp ON m.client_id = cp.user_id
      WHERE ts.status = 'approuve'
      ORDER BY ts.reviewed_at DESC
      LIMIT 3
    `);
    
    if (recentApproved.length === 0) {
      console.log('❌ Aucune feuille de temps approuvée trouvée');
      return;
    }
    
    for (const timesheet of recentApproved) {
      console.log(`\n📋 Feuille de temps ID ${timesheet.id}:`);
      console.log(`   Mission: ${timesheet.mission_name} (ID: ${timesheet.mission_id})`);
      console.log(`   Automob: ${timesheet.automob_email} (ID: ${timesheet.automob_id})`);
      console.log(`   Client: ${timesheet.client_company} (ID: ${timesheet.client_id})`);
      console.log(`   Total heures: ${timesheet.total_hours}h`);
      console.log(`   Taux horaire: ${timesheet.hourly_rate}€`);
      console.log(`   Approuvé le: ${timesheet.reviewed_at}`);
      
      // Vérifier la condition qui détermine si les factures sont générées
      const [pendingCheck] = await db.query(`
        SELECT COUNT(*) as pending_count
        FROM timesheets 
        WHERE mission_id = ? AND automob_id = ? AND status IN ('brouillon', 'soumis')
      `, [timesheet.mission_id, timesheet.automob_id]);
      
      const hasPendingTimesheets = pendingCheck[0].pending_count > 0;
      console.log(`   Timesheets en attente: ${pendingCheck[0].pending_count}`);
      console.log(`   Génération factures déclenchée: ${!hasPendingTimesheets ? '✅ OUI' : '❌ NON'}`);
      
      // Si les factures devraient être générées, vérifier si elles existent
      if (!hasPendingTimesheets) {
        const [existingInvoices] = await db.query(`
          SELECT id, invoice_number, amount, status, generated_at
          FROM invoices 
          WHERE mission_id = ? AND automob_id = ?
        `, [timesheet.mission_id, timesheet.automob_id]);
        
        console.log(`   Factures existantes: ${existingInvoices.length}`);
        
        if (existingInvoices.length === 0) {
          console.log('   🚨 PROBLÈME: Factures manquantes !');
          
          // Test de génération manuelle
          console.log('   🧪 Test génération facture manuelle...');
          try {
            const [allApprovedTimesheets] = await db.query(
              'SELECT id FROM timesheets WHERE mission_id = ? AND automob_id = ? AND status = "approuve"',
              [timesheet.mission_id, timesheet.automob_id]
            );
            
            const timesheetIds = allApprovedTimesheets.map(ts => ts.id);
            console.log(`   Timesheets à facturer: [${timesheetIds.join(', ')}]`);
            
            // Test création facture automob
            const automobInvoiceId = await createAutomobInvoice(timesheet.mission_id, timesheet.automob_id, timesheetIds);
            console.log(`   ✅ Facture automob créée: ID ${automobInvoiceId}`);
            
            // Test création facture client  
            const clientInvoiceId = await createClientInvoice(timesheet.mission_id, timesheet.automob_id, timesheetIds);
            console.log(`   ✅ Facture client créée: ID ${clientInvoiceId}`);
            
          } catch (testError) {
            console.error('   ❌ ERREUR test génération:', testError.message);
            console.error('   Stack:', testError.stack);
          }
        } else {
          existingInvoices.forEach((invoice, index) => {
            console.log(`   Facture ${index + 1}: ${invoice.invoice_number} - ${invoice.amount}€ (${invoice.status})`);
          });
        }
        
        // Vérifier le wallet de l'automob
        console.log('\n💰 Vérification wallet automob...');
        try {
          const [walletTransactions] = await db.query(`
            SELECT wt.*, wi.invoice_number
            FROM wallet_transactions wt
            LEFT JOIN invoices wi ON wt.invoice_id = wi.id
            WHERE wt.user_id = ? AND wt.type = 'credit'
            ORDER BY wt.created_at DESC
            LIMIT 5
          `, [timesheet.automob_id]);
          
          console.log(`   Transactions crédit récentes: ${walletTransactions.length}`);
          walletTransactions.forEach((transaction, index) => {
            console.log(`   Transaction ${index + 1}: ${transaction.amount}€ - ${transaction.description} (${transaction.created_at})`);
          });
          
          // Solde actuel
          const [walletBalance] = await db.query(`
            SELECT 
              (SELECT COALESCE(SUM(amount), 0) FROM wallet_transactions WHERE user_id = ? AND type = 'credit') -
              (SELECT COALESCE(SUM(amount), 0) FROM wallet_transactions WHERE user_id = ? AND type = 'debit') as balance
          `, [timesheet.automob_id, timesheet.automob_id]);
          
          console.log(`   Solde actuel wallet: ${walletBalance[0].balance}€`);
          
        } catch (walletError) {
          console.error('   ❌ Erreur vérification wallet:', walletError.message);
        }
      }
    }
    
    // 2. Vérifier les tables nécessaires
    console.log('\n📋 Vérification des tables...');
    
    const tablesToCheck = ['invoices', 'invoice_items', 'wallet_transactions', 'mission_automobs'];
    
    for (const table of tablesToCheck) {
      try {
        const [count] = await db.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`   Table ${table}: ${count[0].count} entrées`);
      } catch (tableError) {
        console.error(`   ❌ Erreur table ${table}:`, tableError.message);
      }
    }
    
    console.log('\n✅ DIAGNOSTIC TERMINÉ');
    console.log('📋 Vérifiez les points signalés ci-dessus pour identifier le problème');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
    console.error('Stack:', error.stack);
  } finally {
    console.log('\n📋 Diagnostic terminé');
    process.exit(0);
  }
}

debugInvoiceWalletIssue();
