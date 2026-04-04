// Service Worker simplifié pour Firebase Cloud Messaging
console.log('🔧 Service Worker Firebase chargé');

// Importer les scripts Firebase
try {
  importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');
  console.log('✅ Scripts Firebase importés');
} catch (error) {
  console.error('❌ Erreur import scripts Firebase:', error);
}

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDSwL0wNQuS6KwWCPO-ufVjC_NObFTMHis",
  authDomain: "nettmobfrance-92e4a.firebaseapp.com",
  projectId: "nettmobfrance-92e4a",
  storageBucket: "nettmobfrance-92e4a.appspot.com",
  messagingSenderId: "1074853867939",
  appId: "1:1074853867939:web:35ab84f541ea15a0fcaa16"
};

// Initialiser Firebase
try {
  if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase initialisé dans le Service Worker');
    
    // Récupérer l'instance de messaging
    const messaging = firebase.messaging();
    console.log('✅ Firebase Messaging initialisé');
    
    // Gérer les messages en arrière-plan
    messaging.onBackgroundMessage((payload) => {
      console.log('📬 Message reçu en arrière-plan:', payload);
      
      const notificationTitle = payload.notification?.title || 'NettMobFrance';
      const notificationOptions = {
        body: payload.notification?.body || 'Nouvelle notification',
        icon: '/logo-192x192.png',
        badge: '/logo-192x192.png',
        tag: payload.data?.tag || 'notification'
      };
      
      return self.registration.showNotification(notificationTitle, notificationOptions);
    });
  } else {
    console.error('❌ Firebase non disponible');
  }
} catch (error) {
  console.error('❌ Erreur initialisation Firebase:', error);
}

// Gérer le clic sur la notification
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notification cliquée');
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

console.log('✅ Service Worker Firebase prêt');
