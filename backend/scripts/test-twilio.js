import twilio from 'twilio';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║          Test de Configuration Twilio                     ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Vérifier les variables d'environnement
const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_MESSAGING_SERVICE_SID,
  TWILIO_PHONE_NUMBER
} = process.env;

console.log('📋 Configuration chargée:\n');
console.log(`   Account SID: ${TWILIO_ACCOUNT_SID ? '✅ ' + TWILIO_ACCOUNT_SID : '❌ Manquant'}`);
console.log(`   Auth Token: ${TWILIO_AUTH_TOKEN ? '✅ ' + TWILIO_AUTH_TOKEN.substring(0, 8) + '...' : '❌ Manquant'}`);
console.log(`   Service SID: ${TWILIO_MESSAGING_SERVICE_SID ? '✅ ' + TWILIO_MESSAGING_SERVICE_SID : '⚠️  Optionnel'}`);
console.log(`   Phone Number: ${TWILIO_PHONE_NUMBER ? '✅ ' + TWILIO_PHONE_NUMBER : '❌ Manquant'}\n`);

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
  console.log('❌ Configuration incomplète. Vérifiez votre fichier .env\n');
  process.exit(1);
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function testTwilio() {
  try {
    // Créer le client Twilio
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    console.log('🔄 Test 1: Connexion au compte Twilio...\n');
    
    // Récupérer les informations du compte
    const account = await client.api.accounts(TWILIO_ACCOUNT_SID).fetch();
    console.log('✅ Connexion réussie!');
    console.log(`   Nom du compte: ${account.friendlyName}`);
    console.log(`   Status: ${account.status}`);
    console.log(`   Type: ${account.type}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Test 2: Vérifier le numéro de téléphone
    console.log('🔄 Test 2: Vérification du numéro de téléphone...\n');
    
    const numbers = await client.incomingPhoneNumbers.list();
    console.log(`✅ ${numbers.length} numéro(s) trouvé(s):\n`);
    
    numbers.forEach((number, index) => {
      console.log(`   ${index + 1}. ${number.phoneNumber}`);
      console.log(`      • SID: ${number.sid}`);
      console.log(`      • Nom: ${number.friendlyName}`);
      console.log(`      • Capacités: ${Object.keys(number.capabilities).filter(k => number.capabilities[k]).join(', ')}`);
      
      if (number.phoneNumber === TWILIO_PHONE_NUMBER) {
        console.log(`      • ✅ Correspond au numéro configuré`);
      }
      console.log('');
    });

    // Vérifier si le numéro configuré existe
    const configuredNumber = numbers.find(n => n.phoneNumber === TWILIO_PHONE_NUMBER);
    if (!configuredNumber) {
      console.log(`   ⚠️  Le numéro configuré (${TWILIO_PHONE_NUMBER}) n'a pas été trouvé dans votre compte`);
      console.log(`   💡 Utilisez l'un des numéros ci-dessus dans votre .env\n`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Test 3: Vérifier le service de messagerie
    if (TWILIO_MESSAGING_SERVICE_SID) {
      console.log('🔄 Test 3: Vérification du service de messagerie...\n');
      
      try {
        const service = await client.messaging.v1.services(TWILIO_MESSAGING_SERVICE_SID).fetch();
        console.log('✅ Service de messagerie trouvé:');
        console.log(`   Nom: ${service.friendlyName}`);
        console.log(`   SID: ${service.sid}`);
        console.log(`   Status: ${service.status}\n`);
      } catch (error) {
        console.log('❌ Service de messagerie non trouvé');
        console.log(`   Le SID ${TWILIO_MESSAGING_SERVICE_SID} n'existe pas\n`);
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    // Test 4: Vérifier le solde
    console.log('🔄 Test 4: Vérification du solde du compte...\n');
    
    try {
      const balance = await client.balance.fetch();
      console.log('✅ Solde du compte:');
      console.log(`   Devise: ${balance.currency}`);
      console.log(`   Montant: ${balance.balance} ${balance.currency}\n`);
      
      if (parseFloat(balance.balance) < 1) {
        console.log('   ⚠️  Solde faible. Rechargez votre compte sur https://console.twilio.com\n');
      }
    } catch (error) {
      console.log('⚠️  Impossible de récupérer le solde\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Test 5: Test d'envoi de SMS (optionnel)
    console.log('🔄 Test 5: Capacité d\'envoi de SMS...\n');
    
    if (configuredNumber && configuredNumber.capabilities.sms) {
      console.log('✅ Votre numéro peut envoyer des SMS');
      console.log('   Pour tester l\'envoi, utilisez la fonction sendTestSMS() ci-dessous\n');
    } else {
      console.log('⚠️  Votre numéro ne peut pas envoyer de SMS');
      console.log('   Vérifiez les capacités de votre numéro sur le dashboard Twilio\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Résumé
    console.log('✅ Configuration Twilio validée!\n');
    console.log('📝 Résumé:');
    console.log(`   • Compte: ${account.friendlyName} (${account.status})`);
    console.log(`   • Numéros disponibles: ${numbers.length}`);
    console.log(`   • Service de messagerie: ${TWILIO_MESSAGING_SERVICE_SID ? '✅ Configuré' : '⚠️  Non configuré'}`);
    console.log(`   • Capacité SMS: ${configuredNumber?.capabilities.sms ? '✅ Oui' : '❌ Non'}\n`);

    console.log('💡 Prochaines étapes:');
    console.log('   1. Intégrer Twilio dans votre application');
    console.log('   2. Créer un service SMS pour l\'authentification');
    console.log('   3. Configurer les webhooks pour recevoir les SMS\n');

    return true;

  } catch (error) {
    console.error('❌ Erreur lors du test Twilio:\n');
    console.error(`   ${error.message}\n`);
    
    if (error.status === 401 || error.code === 20003) {
      console.log('⚠️  Identifiants invalides. Vérifiez:');
      console.log('   • Account SID (doit commencer par AC)');
      console.log('   • Auth Token (32 caractères)\n');
    }
    
    return false;
  }
}

// Fonction pour envoyer un SMS de test (à décommenter pour tester)
async function sendTestSMS(toNumber) {
  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  
  try {
    console.log(`📱 Envoi d'un SMS de test à ${toNumber}...\n`);
    
    const message = await client.messages.create({
      body: '🧪 Test SMS de NettmobFrance - Votre configuration Twilio fonctionne correctement!',
      from: TWILIO_PHONE_NUMBER,
      to: toNumber
    });
    
    console.log('✅ SMS envoyé avec succès!');
    console.log(`   SID: ${message.sid}`);
    console.log(`   Status: ${message.status}\n`);
    
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi du SMS:');
    console.error(`   ${error.message}\n`);
    return false;
  }
}

// Exécuter le test
testTwilio().then(success => {
  if (success) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎉 Tous les tests sont passés!\n');
    
    // Demander si on veut envoyer un SMS de test
    console.log('💡 Pour envoyer un SMS de test, décommentez la ligne ci-dessous:');
    console.log('   // sendTestSMS("+33XXXXXXXXX");\n');
  } else {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('❌ Certains tests ont échoué\n');
    process.exit(1);
  }
});

// Décommentez pour tester l'envoi d'un SMS (remplacez par votre numéro)
// sendTestSMS("+33612345678");
