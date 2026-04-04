#!/usr/bin/env node

import dotenv from 'dotenv';
import db from './config/database.js';
import { MissionNotificationService } from './services/missionNotificationService.js';

dotenv.config();

console.log('🔍 TEST FLUX COMPLET SMS - Simulation notification mission');

async function testSMSFlow() {
    try {
        // 1. Créer une mission de test
        const testMission = {
            id: 999,
            mission_name: 'Test Mission SMS Flow',
            hourly_rate: 25,
            city: 'Paris',
            start_date: new Date(),
            end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // +7 jours
        };

        const testClient = {
            company_name: 'Test Company SMS'
        };

        console.log('📋 Mission de test:', testMission);

        // 2. Récupérer les compétences d'un automob existant
        const [competences] = await db.query(`
            SELECT DISTINCT ac.competence_id 
            FROM automob_competences ac 
            JOIN automob_profiles ap ON ac.automob_profile_id = ap.id
            WHERE ap.phone IS NOT NULL AND ap.phone != '' AND ap.sms_notifications = 1
            LIMIT 1
        `);
        if (competences.length === 0) {
            console.log('❌ Aucune compétence trouvée pour automobs avec SMS');
            return;
        }

        const competencesIds = [competences[0].competence_id];
        console.log('🎯 Compétences utilisées:', competencesIds);

        // 3. Tester la recherche d'automobs éligibles
        console.log('\n🔍 3. RECHERCHE AUTOMOBS ÉLIGIBLES:');
        const eligibleAutomobs = await MissionNotificationService.findEligibleAutomobs(testMission, competencesIds);
        
        console.log(`   Automobs éligibles trouvés: ${eligibleAutomobs.length}`);
        
        if (eligibleAutomobs.length === 0) {
            console.log('⚠️ Aucun automob éligible - test arrêté');
            return;
        }

        // 4. Analyser les données des automobs pour SMS
        console.log('\n📱 4. ANALYSE DONNÉES SMS:');
        eligibleAutomobs.forEach((automob, index) => {
            const name = `${automob.first_name || 'Sans nom'} ${automob.last_name || ''}`.trim();
            console.log(`   Automob ${index + 1}: ${name} (${automob.email})`);
            console.log(`      profile_phone: "${automob.profile_phone}"`);
            console.log(`      phone_country_code: "${automob.phone_country_code}"`);
            console.log(`      sms_notifications: ${automob.sms_notifications}`);
            
            // Vérifier les conditions de filtrage
            const hasPhone = automob.profile_phone && automob.profile_phone.trim() !== '';
            const smsEnabled = automob.sms_notifications === 1;
            const eligible = hasPhone && smsEnabled;
            
            console.log(`      Éligible SMS: ${eligible ? '✅' : '❌'} (phone: ${hasPhone}, sms: ${smsEnabled})`);
            console.log('');
        });

        // 5. Tester l'envoi SMS
        console.log('\n📤 5. TEST ENVOI SMS:');
        const smsResult = await MissionNotificationService.sendSMSNotifications(testMission, testClient, eligibleAutomobs);
        
        console.log(`   Résultat SMS: ${smsResult} SMS envoyés`);

        if (smsResult === 0) {
            console.log('\n🔍 DIAGNOSTIC DÉTAILLÉ:');
            
            // Filtrer manuellement pour voir ce qui se passe
            const phonesToNotify = eligibleAutomobs
                .filter(a => {
                    console.log(`   Filtrage ${a.email}:`);
                    console.log(`      profile_phone: "${a.profile_phone}" (type: ${typeof a.profile_phone})`);
                    console.log(`      profile_phone.trim(): "${a.profile_phone?.trim()}" (length: ${a.profile_phone?.trim()?.length})`);
                    console.log(`      sms_notifications: ${a.sms_notifications} (type: ${typeof a.sms_notifications})`);
                    
                    const hasPhone = a.profile_phone && a.profile_phone.trim() !== '';
                    const smsEnabled = a.sms_notifications === 1;
                    
                    console.log(`      hasPhone: ${hasPhone}`);
                    console.log(`      smsEnabled: ${smsEnabled}`);
                    console.log(`      Résultat filtrage: ${hasPhone && smsEnabled}`);
                    console.log('');
                    
                    return hasPhone && smsEnabled;
                });
            
            console.log(`   Automobs après filtrage: ${phonesToNotify.length}`);
        }

        console.log('\n🎉 TEST TERMINÉ');

    } catch (error) {
        console.error('❌ Erreur lors du test:', error.message);
        console.error('   Stack:', error.stack);
    } finally {
        process.exit(0);
    }
}

testSMSFlow();
