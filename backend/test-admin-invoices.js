import db from './config/database.js';

async function testAdminInvoices() {
  console.log('🧪 Test: Récupération factures admin\n');
  
  try {
    console.log('📋 Exécution de la requête SQL...');
    const [invoices] = await db.query(`
      SELECT i.*, 
             m.mission_name, m.title as mission_title,
             cp.company_name as client_company,
             ap.first_name as automob_first_name,
             ap.last_name as automob_last_name
      FROM invoices i
      JOIN missions m ON i.mission_id = m.id
      JOIN users u ON i.client_id = u.id
      JOIN client_profiles cp ON u.id = cp.user_id
      LEFT JOIN automob_profiles ap ON i.automob_id = ap.user_id
      ORDER BY i.generated_at DESC
    `);
    
    console.log(`✅ ${invoices.length} factures trouvées\n`);
    
    invoices.forEach((inv, index) => {
      console.log(`Facture ${index + 1}:`);
      console.log(`  ID: ${inv.id}`);
      console.log(`  Client: ${inv.client_company}`);
      console.log(`  Automob: ${inv.automob_first_name} ${inv.automob_last_name}`);
      console.log(`  Mission: ${inv.mission_name || inv.mission_title}`);
      console.log(`  Amount: ${inv.amount}€`);
      console.log(`  Commission: ${inv.commission_amount}€`);
      console.log(`  Status: ${inv.status}`);
      console.log(`  Generated at: ${inv.generated_at}`);
      console.log('');
    });
    
    console.log('✅ Test réussi !');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    console.error('❌ Message:', error.message);
    console.error('❌ Stack:', error.stack);
    throw error;
  } finally {
    await db.end();
  }
}

testAdminInvoices()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
