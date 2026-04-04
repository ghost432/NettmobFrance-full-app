#!/usr/bin/env node

import dotenv from 'dotenv';
import { sendSMS, sendBulkSMS, checkTwilioConfig } from './services/twilioService.js';
import db from './config/database.js';

dotenv.config();

console.log('🧪 TEST SERVICE SMS TWILIO - Test complet');

async function testSMSService() {
    try {
        // 1. Vérifier la configuration Twilio
        console.log('\n📋 1. VÉRIFICATION CONFIGURATION TWILIO:');
        const config = checkTwilioConfig();
        console.log('   Configuration:', config);
        
        if (!config.configured) {
            console.log('❌ Twilio non configuré - arrêt du test');
            return;
        }

        // 2. Récupérer un automob de test
        console.log('\n📱 2. RECHERCHE AUTOMOB POUR TEST:');
        const [automobs] = await db.query(`
            SELECT 
                ap.id, 
                ap.first_name, 
                ap.last_name, 
                ap.phone as profile_phone, 
                ap.phone_country_code, 
                ap.sms_notifications,
                u.email
            FROM automob_profiles ap
            JOIN users u ON ap.user_id = u.id
            WHERE ap.phone IS NOT NULL 
            AND ap.phone != ''
            AND ap.sms_notifications = 1
            LIMIT 1
        `);

        if (automobs.length === 0) {
            console.log('⚠️ Aucun automob éligible pour SMS trouvé');
            return;
        }

        const automob = automobs[0];
        const name = `${automob.first_name || 'Sans nom'} ${automob.last_name || ''}`.trim();
        console.log(`   Automob sélectionné: ${name} (${automob.email})`);
        console.log(`   Téléphone: ${automob.profile_phone}`);
        console.log(`   Code pays: ${automob.phone_country_code}`);

        // 3. Test d'envoi SMS unitaire
        console.log('\n📤 3. TEST ENVOI SMS UNITAIRE:');
        const testMessage = `🧪 Test SMS NettmobFrance
Ceci est un message de test pour vérifier le fonctionnement des SMS.
Heure: ${new Date().toLocaleString('fr-FR')}`;

        console.log('   Message:');
        console.log('   ─────────────────────────────');
        console.log(testMessage);
        console.log('   ─────────────────────────────');

        const smsResult = await sendSMS(
            automob.profile_phone, 
            testMessage, 
            automob.phone_country_code
        );

        console.log('   Résultat:', smsResult);

        if (smsResult.success) {
            console.log('   ✅ SMS UNITAIRE ENVOYÉ AVEC SUCCÈS !');
        } else {
            console.log('   ❌ Échec envoi SMS unitaire:', smsResult.error);
        }

        // 4. Test d'envoi SMS groupé
        console.log('\n📤 4. TEST ENVOI SMS GROUPÉ:');
        const phoneNumbers = [automob.profile_phone];
        const bulkMessage = `🎯 Test SMS groupé NettmobFrance
Message de test pour l'envoi groupé.
Heure: ${new Date().toLocaleString('fr-FR')}`;

        const bulkResult = await sendBulkSMS(phoneNumbers, bulkMessage);
        console.log('   Résultat groupé:', bulkResult);

        if (bulkResult.success > 0) {
            console.log('   ✅ SMS GROUPÉ ENVOYÉ AVEC SUCCÈS !');
        } else {
            console.log('   ❌ Échec envoi SMS groupé');
        }

        // 5. Test du format de notification de mission
        console.log('\n🎯 5. TEST FORMAT NOTIFICATION MISSION:');
        const missionMessage = `🎯 Nouvelle mission NettmobFrance !
Test Mission SMS
💰 25€/h
📍 Paris
🏢 Test Company
Voir: https://pro.nettmobfrance.fr/automob/missions/999`;

        console.log('   Message mission:');
        console.log('   ─────────────────────────────');
        console.log(missionMessage);
        console.log('   ─────────────────────────────');
        console.log(`   Longueur: ${missionMessage.length} caractères`);

        const missionResult = await sendSMS(
            automob.profile_phone, 
            missionMessage, 
            automob.phone_country_code
        );

        if (missionResult.success) {
            console.log('   ✅ SMS MISSION ENVOYÉ AVEC SUCCÈS !');
        } else {
            console.log('   ❌ Échec envoi SMS mission:', missionResult.error);
        }

        console.log('\n🎉 TESTS TERMINÉS');
        console.log('   Vérifiez votre téléphone pour les SMS reçus');

    } catch (error) {
        console.error('❌ Erreur lors des tests SMS:', error.message);
        console.error('   Stack:', error.stack);
    } finally {
        process.exit(0);
    }
}

testSMSService();
