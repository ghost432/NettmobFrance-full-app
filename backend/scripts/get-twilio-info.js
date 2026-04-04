import axios from 'axios';

/**
 * Script pour récupérer les informations du compte Twilio
 * 
 * Note: Twilio n'accepte pas l'authentification par email/mot de passe via l'API.
 * Vous devez vous connecter au dashboard Twilio pour récupérer:
 * - Account SID
 * - Auth Token
 * 
 * Ce script vous guide pour récupérer ces informations.
 */

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║        Récupération des Informations Twilio              ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('⚠️  IMPORTANT: Twilio ne permet pas la connexion par email/mot de passe via l\'API.\n');

console.log('📋 Pour récupérer vos informations Twilio:\n');

console.log('1️⃣  Ouvrez votre navigateur et allez sur:');
console.log('   👉 https://www.twilio.com/login\n');

console.log('2️⃣  Connectez-vous avec:');
console.log('   📧 Email: contact@nettmobfrance.fr');
console.log('   🔑 Mot de passe: [votre mot de passe]\n');

console.log('3️⃣  Sur le Dashboard, vous verrez:');
console.log('   📌 Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxx');
console.log('   📌 Auth Token: [cliquez sur "Show" pour voir]\n');

console.log('4️⃣  Pour voir vos numéros:');
console.log('   👉 Menu: Phone Numbers → Manage → Active numbers\n');

console.log('5️⃣  Pour voir vos services:');
console.log('   👉 Menu: Messaging → Services\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('💡 Une fois que vous avez l\'Account SID et l\'Auth Token:');
console.log('   Lancez: node scripts/list-twilio-resources.js\n');

// Tentative de connexion via l'API de login (non documentée, peut ne pas fonctionner)
async function tryLogin() {
  console.log('🔄 Tentative de connexion via l\'API Twilio...\n');
  
  try {
    // Twilio utilise une API de login séparée pour la console
    const loginUrl = 'https://www.twilio.com/login';
    
    console.log('❌ L\'API Twilio ne supporte pas l\'authentification par email/mot de passe.');
    console.log('   Vous devez utiliser Account SID + Auth Token.\n');
    
    console.log('📖 Documentation Twilio:');
    console.log('   https://www.twilio.com/docs/iam/api-keys\n');
    
    return false;
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return false;
  }
}

// Alternative: Si vous avez déjà l'Account SID et Auth Token
async function listResourcesWithCredentials(accountSid, authToken) {
  console.log('\n🔍 Récupération des ressources Twilio...\n');
  
  try {
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    
    // Récupérer les informations du compte
    const accountResponse = await axios.get(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`,
      {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      }
    );
    
    console.log('✅ Compte Twilio:');
    console.log(`   Nom: ${accountResponse.data.friendly_name}`);
    console.log(`   Status: ${accountResponse.data.status}`);
    console.log(`   Type: ${accountResponse.data.type}\n`);
    
    // Récupérer les numéros de téléphone
    const numbersResponse = await axios.get(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers.json`,
      {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      }
    );
    
    console.log('📱 Numéros de téléphone actifs:');
    if (numbersResponse.data.incoming_phone_numbers.length === 0) {
      console.log('   ⚠️  Aucun numéro trouvé\n');
    } else {
      numbersResponse.data.incoming_phone_numbers.forEach((number, index) => {
        console.log(`\n   ${index + 1}. ${number.phone_number}`);
        console.log(`      SID: ${number.sid}`);
        console.log(`      Nom: ${number.friendly_name}`);
        console.log(`      Capacités: ${Object.keys(number.capabilities).filter(k => number.capabilities[k]).join(', ')}`);
      });
      console.log('');
    }
    
    // Récupérer les services de messagerie
    const servicesResponse = await axios.get(
      `https://messaging.twilio.com/v1/Services`,
      {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      }
    );
    
    console.log('💬 Services de messagerie:');
    if (servicesResponse.data.services.length === 0) {
      console.log('   ⚠️  Aucun service trouvé\n');
    } else {
      servicesResponse.data.services.forEach((service, index) => {
        console.log(`\n   ${index + 1}. ${service.friendly_name}`);
        console.log(`      SID: ${service.sid}`);
        console.log(`      Status: ${service.status}`);
      });
      console.log('');
    }
    
    // Générer la configuration .env
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📝 Configuration à ajouter dans backend/.env:\n');
    console.log(`TWILIO_ACCOUNT_SID=${accountSid}`);
    console.log(`TWILIO_AUTH_TOKEN=${authToken}`);
    
    if (numbersResponse.data.incoming_phone_numbers.length > 0) {
      console.log(`TWILIO_PHONE_NUMBER=${numbersResponse.data.incoming_phone_numbers[0].phone_number}`);
    }
    
    if (servicesResponse.data.services.length > 0) {
      console.log(`TWILIO_MESSAGING_SERVICE_SID=${servicesResponse.data.services[0].sid}`);
    }
    
    console.log('\n');
    
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des ressources:');
    console.error(`   ${error.response?.data?.message || error.message}\n`);
    
    if (error.response?.status === 401) {
      console.log('⚠️  Identifiants invalides. Vérifiez votre Account SID et Auth Token.\n');
    }
    
    return false;
  }
}

// Vérifier si des identifiants sont fournis en arguments
const args = process.argv.slice(2);

if (args.length >= 2) {
  const [accountSid, authToken] = args;
  console.log('🔐 Utilisation des identifiants fournis...\n');
  listResourcesWithCredentials(accountSid, authToken);
} else {
  tryLogin();
  
  console.log('💡 Usage avec identifiants:');
  console.log('   node scripts/get-twilio-info.js <ACCOUNT_SID> <AUTH_TOKEN>\n');
  console.log('   Exemple:');
  console.log('   node scripts/get-twilio-info.js ACxxxxxxxxxxxxxxxx xxxxxxxxxxxxxxxx\n');
}
