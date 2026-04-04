#!/usr/bin/env node

import dotenv from 'dotenv';
import twilio from 'twilio';

dotenv.config();

console.log('🔍 TEST CREDENTIALS TWILIO');

async function testTwilioCredentials() {
    try {
        // Vérifier les variables d'environnement
        console.log('\n📋 VARIABLES D\'ENVIRONNEMENT:');
        console.log(`   TWILIO_ACCOUNT_SID: ${process.env.TWILIO_ACCOUNT_SID || 'MANQUANT'}`);
        console.log(`   TWILIO_AUTH_TOKEN: ${process.env.TWILIO_AUTH_TOKEN ? 'DÉFINI' : 'MANQUANT'}`);
        console.log(`   TWILIO_MESSAGING_SERVICE_SID: ${process.env.TWILIO_MESSAGING_SERVICE_SID || 'MANQUANT'}`);
        console.log(`   TWILIO_PHONE_NUMBER: ${process.env.TWILIO_PHONE_NUMBER || 'MANQUANT'}`);

        if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
            console.log('\n❌ Credentials Twilio manquants');
            return;
        }

        // Initialiser le client Twilio
        console.log('\n🔧 INITIALISATION CLIENT TWILIO:');
        const client = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );

        console.log('✅ Client Twilio créé');

        // Test 1: Récupérer les informations du compte
        console.log('\n📊 TEST 1: INFORMATIONS DU COMPTE:');
        try {
            const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
            console.log(`   Nom du compte: ${account.friendlyName}`);
            console.log(`   Status: ${account.status}`);
            console.log(`   Type: ${account.type}`);
            console.log(`   Date création: ${account.dateCreated}`);
        } catch (error) {
            console.error('❌ Erreur récupération compte:', error.message);
            console.error(`   Code: ${error.code}`);
            console.error(`   Status: ${error.status}`);
            return;
        }

        // Test 2: Vérifier le Messaging Service (si configuré)
        if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
            console.log('\n📱 TEST 2: MESSAGING SERVICE:');
            try {
                const messagingService = await client.messaging.v1.services(process.env.TWILIO_MESSAGING_SERVICE_SID).fetch();
                console.log(`   Nom: ${messagingService.friendlyName}`);
                console.log(`   Status: ${messagingService.status}`);
                console.log(`   Inbound Method: ${messagingService.inboundMethod}`);
            } catch (error) {
                console.error('❌ Erreur Messaging Service:', error.message);
                console.error(`   Code: ${error.code}`);
            }
        }

        // Test 3: Lister les numéros de téléphone disponibles
        console.log('\n📞 TEST 3: NUMÉROS DISPONIBLES:');
        try {
            const phoneNumbers = await client.incomingPhoneNumbers.list({ limit: 5 });
            console.log(`   Nombre de numéros: ${phoneNumbers.length}`);
            phoneNumbers.forEach(number => {
                console.log(`   - ${number.phoneNumber} (${number.friendlyName})`);
            });
        } catch (error) {
            console.error('❌ Erreur liste numéros:', error.message);
        }

        // Test 4: Vérifier les limites du compte
        console.log('\n💰 TEST 4: BALANCE ET LIMITES:');
        try {
            const balance = await client.balance.fetch();
            console.log(`   Balance: ${balance.balance} ${balance.currency}`);
        } catch (error) {
            console.error('❌ Erreur balance:', error.message);
        }

        console.log('\n✅ TESTS CREDENTIALS TERMINÉS');
        console.log('   Les credentials Twilio semblent valides');
        console.log('   Le problème ETIMEDOUT peut être dû à:');
        console.log('   - Restrictions réseau/firewall');
        console.log('   - Compte Twilio en mode trial avec restrictions');
        console.log('   - Numéro de destination non vérifié (mode trial)');

    } catch (error) {
        console.error('\n❌ ERREUR GÉNÉRALE:', error.message);
        console.error(`   Code: ${error.code}`);
        console.error(`   Status: ${error.status}`);
    } finally {
        process.exit(0);
    }
}

testTwilioCredentials();
