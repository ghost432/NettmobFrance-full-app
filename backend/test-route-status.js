import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Test de la route status
async function testRouteStatus() {
  try {
    console.log('🧪 Test de la route /missions/:id/automobs/:automobId/status\n');
    
    // 1. Connexion en tant que client
    console.log('1. Connexion en tant que client...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'client@example.com', // Remplacez par un vrai email client
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Connexion réussie\n');
    
    // 2. Test de la route status
    console.log('2. Test GET /missions/10/automobs/24/status...');
    const statusResponse = await axios.get(
      `${API_URL}/missions/10/automobs/24/status`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    console.log('✅ Réponse reçue:');
    console.log(JSON.stringify(statusResponse.data, null, 2));
    console.log('\n🎉 Test réussi!');
    
  } catch (error) {
    console.error('❌ Erreur:', error.response?.status || error.message);
    console.error('Détails:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.error('\n⚠️  Erreur 404 - La route n\'est pas trouvée');
      console.error('Vérifiez que le serveur a été redémarré après les modifications');
    }
  }
}

testRouteStatus();
