#!/usr/bin/env node

import axios from 'axios';

async function testPatchApplication() {
  try {
    console.log('🧪 Test PATCH application endpoint...');
    
    // Simuler une requête PATCH comme le fait le frontend
    // On aura besoin d'un token d'authentification
    
    // D'abord on essaie de faire un GET pour voir s'il y a d'autres erreurs
    console.log('📡 Test GET /api/missions/9/applications/6');
    
    // Tester juste l'URL pour voir si le serveur est accessible
    try {
      const response = await axios.get('http://localhost:5000/api/missions/9/applications/6', {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ GET Response:', response.status, response.data);
    } catch (getError) {
      console.log('❌ GET Error:', getError.response?.status, getError.response?.data);
      console.log('❌ GET Error message:', getError.message);
    }
    
    // Maintenant test du PATCH sans authentification
    console.log('\n📡 Test PATCH /api/missions/9/applications/6 (sans auth)');
    try {
      const response = await axios.patch('http://localhost:5000/api/missions/9/applications/6', {
        status: 'accepte'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ PATCH Response:', response.status, response.data);
    } catch (patchError) {
      console.log('❌ PATCH Error status:', patchError.response?.status);
      console.log('❌ PATCH Error data:', patchError.response?.data);
      console.log('❌ PATCH Error message:', patchError.message);
      
      // Si c'est une erreur 401 (pas authentifié) c'est normal
      if (patchError.response?.status === 401) {
        console.log('⚠️ Erreur 401 normale - endpoint protégé par authentification');
      } else if (patchError.response?.status === 500) {
        console.log('🚨 ERREUR 500 - Problème serveur détecté !');
        console.log('Stack trace:', patchError.response?.data?.stack);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

testPatchApplication();
