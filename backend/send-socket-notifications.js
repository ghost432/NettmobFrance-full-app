// Script pour envoyer les notifications socket.io via l'API du serveur existant
import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api';

console.log('📡 Envoi notifications socket.io via API backend...');

try {
  // Simuler un admin login pour obtenir un token
  console.log('🔐 Connexion admin...');

  const loginResponse = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@nettmobfrance.fr',
      password: 'admin123'
    })
  });

  if (!loginResponse.ok) {
    throw new Error(`Login failed: ${loginResponse.status}`);
  }

  const loginData = await loginResponse.json();
  const adminToken = loginData.token;
  console.log('✅ Admin connecté');

  // Envoyer notifications via l'API feedback
  console.log('📧 Envoi notifications aux users 25 et 26...');

  const notificationResponse = await fetch(`${API_URL}/feedback/send-thanks-to-all`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  });

  if (!notificationResponse.ok) {
    throw new Error(`Notification API failed: ${notificationResponse.status}`);
  }

  const notificationData = await notificationResponse.json();
  console.log('✅ Résultat:', notificationData.message);
  console.log('📊 Stats:', notificationData.stats);

  console.log('\n🎉 Notifications envoyées via le serveur backend !');

} catch (error) {
  console.error('❌ Erreur:', error.message);

  // Plan B: Notification directe via curl
  console.log('\n📡 Plan B: Test avec curl...');

  const curlCommand = `curl -X POST ${API_URL}/feedback/send-thanks-to-all -H "Content-Type: application/json" -H "Authorization: Bearer ADMIN_TOKEN_HERE"`;
  console.log('💡 Commande pour test manuel:', curlCommand);
}
