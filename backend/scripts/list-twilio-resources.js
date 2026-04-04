import twilio from 'twilio';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Liste des Ressources Twilio - NettmobFrance          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('📋 Pour récupérer vos identifiants Twilio:\n');
  console.log('1. Allez sur: https://console.twilio.com');
  console.log('2. Connectez-vous avec: contact@nettmobfrance.fr');
  console.log('3. Sur le dashboard, copiez:\n');
  console.log('   • Account SID (commence par AC...)');
  console.log('   • Auth Token (cliquez sur "Show")\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Demander l'Account SID
    const accountSid = await question('🔑 Entrez votre Account SID: ');
    
    if (!accountSid || !accountSid.startsWith('AC')) {
      console.log('\n❌ Account SID invalide (doit commencer par AC)\n');
      rl.close();
      return;
    }

    // Demander l'Auth Token
    const authToken = await question('🔐 Entrez votre Auth Token: ');
    
    if (!authToken || authToken.length < 20) {
      console.log('\n❌ Auth Token invalide\n');
      rl.close();
      return;
    }

    console.log('\n🔄 Connexion à Twilio...\n');

    // Créer le client Twilio
    const client = twilio(accountSid, authToken);

    // Récupérer les informations du compte
    console.log('📊 Informations du compte:\n');
    const account = await client.api.accounts(accountSid).fetch();
    console.log(`   ✅ Nom: ${account.friendlyName}`);
    console.log(`   ✅ Status: ${account.status}`);
    console.log(`   ✅ Type: ${account.type}\n`);

    // Récupérer les numéros de téléphone
    console.log('📱 Numéros de téléphone actifs:\n');
    const numbers = await client.incomingPhoneNumbers.list();
    
    if (numbers.length === 0) {
      console.log('   ⚠️  Aucun numéro trouvé');
      console.log('   💡 Achetez un numéro sur: https://console.twilio.com/us1/develop/phone-numbers/manage/search\n');
    } else {
      numbers.forEach((number, index) => {
        console.log(`   ${index + 1}. ${number.phoneNumber}`);
        console.log(`      • SID: ${number.sid}`);
        console.log(`      • Nom: ${number.friendlyName}`);
        console.log(`      • Capacités: ${Object.keys(number.capabilities).filter(k => number.capabilities[k]).join(', ')}`);
        console.log('');
      });
    }

    // Récupérer les services de messagerie
    console.log('💬 Services de messagerie:\n');
    try {
      const services = await client.messaging.v1.services.list();
      
      if (services.length === 0) {
        console.log('   ⚠️  Aucun service de messagerie trouvé');
        console.log('   💡 Créez un service sur: https://console.twilio.com/us1/develop/sms/services\n');
      } else {
        services.forEach((service, index) => {
          console.log(`   ${index + 1}. ${service.friendlyName}`);
          console.log(`      • SID: ${service.sid}`);
          console.log(`      • Status: ${service.status}`);
          console.log('');
        });
      }
    } catch (error) {
      console.log('   ⚠️  Impossible de récupérer les services de messagerie\n');
    }

    // Récupérer les API Keys
    console.log('🔑 API Keys:\n');
    try {
      const keys = await client.keys.list({ limit: 5 });
      
      if (keys.length === 0) {
        console.log('   ⚠️  Aucune API Key trouvée\n');
      } else {
        keys.forEach((key, index) => {
          console.log(`   ${index + 1}. ${key.friendlyName}`);
          console.log(`      • SID: ${key.sid}`);
          console.log('');
        });
      }
    } catch (error) {
      console.log('   ⚠️  Impossible de récupérer les API Keys\n');
    }

    // Générer la configuration
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📝 Configuration à ajouter dans backend/.env:\n');
    console.log('# Twilio Configuration');
    console.log(`TWILIO_ACCOUNT_SID=${accountSid}`);
    console.log(`TWILIO_AUTH_TOKEN=${authToken}`);
    
    if (numbers.length > 0) {
      console.log(`TWILIO_PHONE_NUMBER=${numbers[0].phoneNumber}`);
    } else {
      console.log('# TWILIO_PHONE_NUMBER=+33XXXXXXXXX  # À acheter sur Twilio');
    }
    
    try {
      const services = await client.messaging.v1.services.list();
      if (services.length > 0) {
        console.log(`TWILIO_MESSAGING_SERVICE_SID=${services[0].sid}`);
      }
    } catch (error) {
      // Ignore
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('✅ Récupération terminée!\n');
    
    // Demander si on doit sauvegarder dans .env
    const save = await question('💾 Voulez-vous sauvegarder ces informations dans .env? (o/n): ');
    
    if (save.toLowerCase() === 'o' || save.toLowerCase() === 'oui') {
      const fs = await import('fs');
      const path = await import('path');
      
      const envPath = path.join(process.cwd(), '.env');
      let envContent = '';
      
      try {
        envContent = fs.readFileSync(envPath, 'utf8');
      } catch (error) {
        console.log('⚠️  Fichier .env non trouvé, création...');
      }
      
      // Ajouter ou mettre à jour les variables Twilio
      const twilioConfig = `\n# Twilio Configuration\nTWILIO_ACCOUNT_SID=${accountSid}\nTWILIO_AUTH_TOKEN=${authToken}\n`;
      
      if (numbers.length > 0) {
        twilioConfig += `TWILIO_PHONE_NUMBER=${numbers[0].phoneNumber}\n`;
      }
      
      // Supprimer les anciennes variables Twilio si elles existent
      envContent = envContent.replace(/# Twilio Configuration[\s\S]*?(?=\n#|\n\n|$)/g, '');
      envContent = envContent.replace(/TWILIO_[A-Z_]+=.*/g, '');
      
      // Ajouter les nouvelles variables
      envContent += twilioConfig;
      
      fs.writeFileSync(envPath, envContent.trim() + '\n');
      console.log('\n✅ Configuration sauvegardée dans .env\n');
    }

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    
    if (error.status === 401 || error.code === 20003) {
      console.log('\n⚠️  Identifiants invalides. Vérifiez votre Account SID et Auth Token.');
      console.log('   Connectez-vous sur https://console.twilio.com pour les récupérer.\n');
    } else {
      console.error('   Détails:', error);
    }
  } finally {
    rl.close();
  }
}

main();
