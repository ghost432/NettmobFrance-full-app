import db from './config/database.js';

async function checkSchema() {
    try {
        console.log('--- mission_applications ---');
        const [colsApp] = await db.query('SHOW COLUMNS FROM mission_applications');
        console.table(colsApp);

        console.log('--- missions ---');
        const [colsMiss] = await db.query('SHOW COLUMNS FROM missions');
        console.table(colsMiss);

        console.log('--- mission_automobs ---');
        const [colsMA] = await db.query('SHOW COLUMNS FROM mission_automobs');
        console.table(colsMA);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
