import db from './config/database.js';

async function testClientInvoices() {
  console.log('🧪 Test: Récupération factures client\n');
  
  try {
    const clientId = 26;
    
    console.log('📋 Exécution de la requête...');
    const [invoices] = await db.query(`
      SELECT i.*, 
             m.mission_name, m.title as mission_title,
             ap.first_name as automob_first_name,
             ap.last_name as automob_last_name
      FROM invoices i
      JOIN missions m ON i.mission_id = m.id
      LEFT JOIN automob_profiles ap ON i.automob_id = ap.user_id
      WHERE i.client_id = ?
      ORDER BY i.generated_at DESC
    `, [clientId]);
    
    console.log(`✅ ${invoices.length} factures trouvées\n`);
    
    invoices.forEach((inv, index) => {
      console.log(`Facture ${index + 1}:`);
      console.log(`  ID: ${inv.id}`);
      console.log(`  Mission: ${inv.mission_name || inv.mission_title}`);
      console.log(`  Automob: ${inv.automob_first_name} ${inv.automob_last_name}`);
      console.log(`  Amount: ${inv.amount}`);
      console.log(`  Commission: ${inv.commission_amount}`);
      console.log(`  Total hours: ${inv.total_hours}`);
      console.log(`  Status: ${inv.status}`);
      console.log(`  Generated at: ${inv.generated_at}`);
      console.log('');
    });
    
    console.log('✅ Test réussi !');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await db.end();
  }
}

testClientInvoices()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
