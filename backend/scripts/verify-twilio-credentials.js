import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN
} = process.env;

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║       Vérification des Identifiants Twilio                ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('📋 Identifiants chargés depuis .env:\n');
console.log(`Account SID: ${TWILIO_ACCOUNT_SID}`);
console.log(`   • Longueur: ${TWILIO_ACCOUNT_SID?.length || 0} caractères`);
console.log(`   • Format: ${TWILIO_ACCOUNT_SID?.startsWith('AC') ? '✅ Commence par AC' : '❌ Devrait commencer par AC'}\n`);

console.log(`Auth Token: ${TWILIO_AUTH_TOKEN}`);
console.log(`   • Longueur: ${TWILIO_AUTH_TOKEN?.length || 0} caractères`);
console.log(`   • Format: ${TWILIO_AUTH_TOKEN?.length === 32 ? '✅ 32 caractères' : '⚠️  Devrait faire 32 caractères'}\n`);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function verifyCredentials() {
  try {
    console.log('🔄 Test de connexion à l\'API Twilio...\n');
    
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
    
    const response = await axios.get(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}.json`,
      {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      }
    );
    
    console.log('✅ Connexion réussie!\n');
    console.log('📊 Informations du compte:');
    console.log(`   • Nom: ${response.data.friendly_name}`);
    console.log(`   • Status: ${response.data.status}`);
    console.log(`   • Type: ${response.data.type}`);
    console.log(`   • Date de création: ${new Date(response.data.date_created).toLocaleDateString('fr-FR')}\n`);
    
    return true;
  } catch (error) {
    console.log('❌ Échec de la connexion\n');
    
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Message: ${error.response.data?.message || error.message}\n`);
      
      if (error.response.status === 401) {
        console.log('🔍 Erreur d\'authentification détectée:\n');
        console.log('Causes possibles:');
        console.log('   1. ❌ Auth Token incorrect ou incomplet');
        console.log('   2. ❌ Account SID incorrect');
        console.log('   3. ❌ Espaces ou caractères invisibles dans les identifiants\n');
        
        console.log('💡 Solutions:');
        console.log('   1. Reconnectez-vous sur https://console.twilio.com');
        console.log('   2. Copiez à nouveau l\'Account SID');
        console.log('   3. Cliquez sur "Show" pour voir l\'Auth Token complet');
        console.log('   4. Copiez l\'Auth Token complet (32 caractères)');
        console.log('   5. Mettez à jour le fichier .env\n');
        
        console.log('📝 Format attendu dans .env:');
        console.log('   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (34 caractères)');
        console.log('   TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (32 caractères)\n');
      }
    } else {
      console.log(`Erreur: ${error.message}\n`);
    }
    
    return false;
  }
}

verifyCredentials().then(success => {
  if (!success) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('⚠️  Vérifiez vos identifiants et réessayez\n');
    process.exit(1);
  } else {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ Identifiants valides! Vous pouvez maintenant utiliser Twilio.\n');
  }
});
