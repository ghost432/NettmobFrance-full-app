import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

/**
 * Test de la génération automatique des factures
 * lors de la finalisation d'une mission
 */
async function testInvoiceGeneration() {
  console.log('🧪 TEST: Génération Automatique des Factures\n');
  console.log('═'.repeat(60));
  
  try {
    // 1. Connexion en tant que client
    console.log('\n📝 Étape 1: Connexion client...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'antoinepaulcm@gmail.com', // Remplacez par votre email client de test
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    const clientId = loginResponse.data.user.id;
    console.log(`✅ Connecté: Client ID ${clientId}`);
    
    // 2. Récupérer une mission avec automobs
    console.log('\n📝 Étape 2: Récupération des missions...');
    const missionsResponse = await axios.get(`${API_URL}/missions/my-missions/client`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const activeMissions = missionsResponse.data.filter(m => m.status === 'en_cours');
    
    if (activeMissions.length === 0) {
      console.log('⚠️  Aucune mission en cours trouvée');
      return;
    }
    
    const missionId = activeMissions[0].id;
    console.log(`✅ Mission trouvée: ID ${missionId} - "${activeMissions[0].mission_name}"`);
    
    // 3. Récupérer les automobs de la mission
    console.log('\n📝 Étape 3: Récupération des automobs...');
    const automobsResponse = await axios.get(
      `${API_URL}/missions/${missionId}/automobs-for-completion`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    const automobs = automobsResponse.data;
    
    if (automobs.length === 0) {
      console.log('⚠️  Aucun automob assigné à cette mission');
      return;
    }
    
    const automob = automobs[0];
    console.log(`✅ Automob trouvé: ID ${automob.automob_id} - "${automob.automob_first_name} ${automob.automob_last_name}"`);
    
    // 4. Vérifier les timesheets approuvés
    console.log('\n📝 Étape 4: Vérification des timesheets approuvés...');
    // Note: Cette requête nécessiterait un endpoint dédié ou une query directe
    console.log('ℹ️  Pour le test complet, assurez-vous d\'avoir des timesheets approuvés');
    
    // 5. Récupérer les factures AVANT finalisation
    console.log('\n📝 Étape 5: État des factures AVANT finalisation...');
    try {
      const invoicesBeforeResponse = await axios.get(`${API_URL}/invoices/automob/my-invoices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`📊 Factures automob actuelles: ${invoicesBeforeResponse.data.length}`);
    } catch (error) {
      console.log('ℹ️  Impossible de récupérer les factures (pas automob)');
    }
    
    // 6. SIMULATION: Finaliser la mission
    console.log('\n📝 Étape 6: SIMULATION de finalisation de mission...');
    console.log('⚠️  ATTENTION: Ceci va réellement terminer la mission et générer les factures !');
    console.log('ℹ️  Pour tester, décommentez le code ci-dessous\n');
    
    /*
    console.log('🚀 Envoi de la requête de finalisation...');
    const completionResponse = await axios.post(
      `${API_URL}/missions/${missionId}/complete-automob`,
      {
        automob_id: automob.automob_id,
        rating: 5,
        comment: 'Test de génération de factures - Excellent travail !'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('✅ Réponse:', completionResponse.data);
    
    // 7. Vérifier les factures APRÈS finalisation
    console.log('\n📝 Étape 7: Vérification des factures générées...');
    
    // Attendre un peu pour que les factures soient générées
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const invoicesAfterResponse = await axios.get(`${API_URL}/invoices/automob/my-invoices`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`📊 Factures automob après: ${invoicesAfterResponse.data.length}`);
    console.log('Nouvelles factures:');
    invoicesAfterResponse.data.slice(0, 3).forEach(invoice => {
      console.log(`  - ID: ${invoice.id}, Montant: ${invoice.amount}€, Mission: ${invoice.mission_name}`);
    });
    
    // 8. Vérifier le wallet
    console.log('\n📝 Étape 8: Vérification du wallet...');
    const walletResponse = await axios.get(`${API_URL}/wallet/balance`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`💰 Nouveau solde wallet: ${walletResponse.data.balance}€`);
    */
    
    console.log('\n═'.repeat(60));
    console.log('✅ Test de simulation terminé avec succès');
    console.log('\n📋 RÉSUMÉ DU PROCESSUS:');
    console.log('1. Client se connecte');
    console.log('2. Client sélectionne une mission en cours');
    console.log('3. Client clique "Terminer mission" pour un automob');
    console.log('4. 📦 GÉNÉRATION AUTOMATIQUE:');
    console.log('   a) Facture AUTOMOB créée');
    console.log('   b) Facture CLIENT créée');
    console.log('   c) Facture ADMIN créée');
    console.log('   d) 💰 Wallet AUTOMOB rechargé');
    console.log('5. Notifications envoyées à toutes les parties');
    console.log('\n💡 Pour tester réellement, décommentez le code dans test-invoice-generation.js');
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.error('🔐 Erreur d\'authentification - Vérifiez les identifiants');
    } else if (error.response?.status === 404) {
      console.error('📭 Ressource non trouvée - Vérifiez les IDs');
    }
  }
}

// Lancer le test
testInvoiceGeneration();
