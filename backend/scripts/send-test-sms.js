import twilio from 'twilio';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER
} = process.env;

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║              Envoi de SMS de Test - Twilio                ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('📋 Configuration:\n');
console.log(`   De: ${TWILIO_PHONE_NUMBER}`);
console.log(`   À: +237655974875`);
console.log(`   Message: Bonjour\n`);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function sendSMS() {
  try {
    console.log('🔄 Création du client Twilio...\n');
    
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    
    console.log('📱 Envoi du SMS...\n');
    
    const message = await client.messages.create({
      body: 'Bonjour',
      from: TWILIO_PHONE_NUMBER,
      to: '+237655974875'
    });
    
    console.log('✅ SMS envoyé avec succès!\n');
    console.log('📊 Détails du message:');
    console.log(`   • SID: ${message.sid}`);
    console.log(`   • Status: ${message.status}`);
    console.log(`   • De: ${message.from}`);
    console.log(`   • À: ${message.to}`);
    console.log(`   • Message: ${message.body}`);
    console.log(`   • Prix: ${message.price || 'En attente'} ${message.priceUnit || ''}`);
    console.log(`   • Direction: ${message.direction}`);
    console.log(`   • Date d'envoi: ${message.dateCreated}\n`);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ Test réussi! Le SMS a été envoyé.\n');
    
    return true;
    
  } catch (error) {
    console.log('❌ Erreur lors de l\'envoi du SMS\n');
    console.error(`   Code: ${error.code || 'N/A'}`);
    console.error(`   Status: ${error.status || 'N/A'}`);
    console.error(`   Message: ${error.message}\n`);
    
    if (error.code === 20003) {
      console.log('🔍 Erreur d\'authentification:');
      console.log('   • Vérifiez votre Account SID et Auth Token');
      console.log('   • Reconnectez-vous sur https://console.twilio.com\n');
    } else if (error.code === 21211) {
      console.log('🔍 Numéro invalide:');
      console.log('   • Le numéro de destination n\'est pas valide');
      console.log('   • Vérifiez le format: +[code pays][numéro]\n');
    } else if (error.code === 21608) {
      console.log('🔍 Numéro non vérifié:');
      console.log('   • En mode test, vous devez vérifier les numéros de destination');
      console.log('   • Allez sur: https://console.twilio.com/us1/develop/phone-numbers/manage/verified\n');
    } else if (error.code === 21614) {
      console.log('🔍 Numéro source invalide:');
      console.log('   • Le numéro Twilio configuré n\'existe pas ou n\'est pas valide');
      console.log('   • Vérifiez TWILIO_PHONE_NUMBER dans .env\n');
    } else if (error.code === 21606) {
      console.log('🔍 Numéro non capable d\'envoyer des SMS:');
      console.log('   • Le numéro Twilio ne peut pas envoyer de SMS');
      console.log('   • Vérifiez les capacités sur le dashboard\n');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('💡 Pour plus d\'informations:');
    console.log('   https://www.twilio.com/docs/api/errors\n');
    
    return false;
  }
}

sendSMS();
