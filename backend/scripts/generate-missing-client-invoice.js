import db from '../config/database.js';
import { createClientInvoice } from '../services/invoiceService.js';

async function generateMissing() {
  const missionId = 48;
  const automobId = 27;

  try {
    console.log(`Bypass check: Fetching timesheets for mission ${missionId}...`);
    const [timesheets] = await db.query('SELECT id FROM timesheets WHERE mission_id = ? AND automob_id = ? AND status = "approuve"', [missionId, automobId]);
    
    if (timesheets.length === 0) {
      console.log('No approved timesheets found.');
      process.exit(0);
    }
    
    const timesheetIds = timesheets.map(ts => ts.id);
    console.log(`Found timesheet IDs: ${timesheetIds.join(', ')}`);
    console.log(`Generating client invoice for mission ${missionId}...`);

    const clientInvoiceId = await createClientInvoice(missionId, automobId, timesheetIds);
    console.log(`Success! Client invoice created with ID: ${clientInvoiceId}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

generateMissing();
