const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

// Configuration des tokens
const CLIENT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6ImNsaWVudCIsImlhdCI6MTczMTY3NTExMiwiZXhwIjoxNzMxNjc4NzEyfQ.b_ym4v8DHh_PQfQ3gODEa0uKCQdv5MH2P4lQJpQR9Rw';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

async function testApproveTimesheetFlow() {
  console.log('🧪 Test du flux d\'approbation de feuille de temps\n');

  try {
    // Test 1: Approuver une feuille de temps
    console.log('📋 Test 1: Approbation d\'une feuille de temps');
    console.log('─────────────────────────────────────────────');
    
    const timesheetId = 5; // Remplacez par un ID de timesheet valide
    
    try {
      const approveResponse = await api.patch(
        `/timesheets/${timesheetId}/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${CLIENT_TOKEN}` }
        }
      );

      console.log('✅ Approbation réussie!');
      console.log('Réponse:', JSON.stringify(approveResponse.data, null, 2));
      
      if (approveResponse.data.missionCompleted) {
        console.log('🎉 La mission est COMPLÉTÉE - Tous les timesheets sont approuvés!');
        console.log('Le client devrait maintenant voir un dialogue pour:');
        console.log('  - Marquer la mission comme terminée');
        console.log('  - Laisser un avis (optionnel)');
      } else {
        console.log('⏳ Mission pas encore complétée - Il reste des timesheets en attente');
      }
      
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.alreadyApproved) {
        console.log('ℹ️ Cette feuille de temps est déjà approuvée');
      } else {
        console.error('❌ Erreur lors de l\'approbation:');
        console.error('Status:', error.response?.status);
        console.error('Data:', error.response?.data);
      }
    }

    console.log('\n');

    // Test 2: Terminer une mission avec avis
    console.log('📋 Test 2: Terminer mission avec avis');
    console.log('─────────────────────────────────────────────');
    
    const missionId = 1; // Remplacez par un ID de mission valide
    const automobId = 3; // Remplacez par l'ID de l'automob
    
    try {
      const completeResponse = await api.post(
        `/missions/${missionId}/complete-automob`,
        {
          automob_id: automobId,
          rating: 5,
          comment: 'Excellent travail, très professionnel et ponctuel!'
        },
        {
          headers: { Authorization: `Bearer ${CLIENT_TOKEN}` }
        }
      );

      console.log('✅ Mission terminée avec avis!');
      console.log('Réponse:', JSON.stringify(completeResponse.data, null, 2));
      
    } catch (error) {
      console.error('❌ Erreur lors de la finalisation:');
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
    }

    console.log('\n');

    // Test 3: Terminer une mission sans avis
    console.log('📋 Test 3: Terminer mission sans avis');
    console.log('─────────────────────────────────────────────');
    
    try {
      const completeWithoutReviewResponse = await api.post(
        `/missions/${missionId}/complete-automob`,
        {
          automob_id: automobId
          // Pas de rating ni comment
        },
        {
          headers: { Authorization: `Bearer ${CLIENT_TOKEN}` }
        }
      );

      console.log('✅ Mission terminée sans avis!');
      console.log('Réponse:', JSON.stringify(completeWithoutReviewResponse.data, null, 2));
      
    } catch (error) {
      console.error('❌ Erreur lors de la finalisation:');
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Exécuter les tests
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('   TEST FLUX APPROBATION & FINALISATION MISSION   ');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

testApproveTimesheetFlow();
