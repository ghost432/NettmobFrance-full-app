/* Service Worker pour les Web Push Notifications */
/* VAPID Configuration - NettmobFrance */

// Clé publique VAPID (doit correspondre au backend)
const VAPID_PUBLIC_KEY = 'BKNAHqov_9DETgh_h87mZgWBGwrjlZZipaZYjKm9TGZEoQ6mKqGP0D9yjOwRQqVckSDKPmRJ4J37FG01SZrMUjE';

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installation avec VAPID configuré');
  console.log('[Service Worker] VAPID Key:', VAPID_PUBLIC_KEY.substring(0, 20) + '...');
  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activation');
  event.waitUntil(clients.claim());
});

// Réception d'une notification push
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push reçu - Mission notification', event);
  
  let data = {
    title: '🎯 Nouvelle Mission',
    message: 'Une mission dans votre zone vient d\'être publiée',
    action_url: '/automob/missions',
    icon: '/icons/mission-notification.png',
    badge: '/badge-72x72.png',
    type: 'mission'
  };

  if (event.data) {
    try {
      const rawData = event.data.json();
      console.log('[Service Worker] Données push reçues (RAW):', rawData);
      console.log('[Service Worker] Type de données:', typeof rawData);
      
      // 🔥 SUPPORT MULTIPLE FORMATS : Web Push direct et Firebase
      const notification = rawData.notification || rawData;
      const payloadData = rawData.data || rawData;
      
      console.log('[Service Worker] Notification extraite:', notification);
      console.log('[Service Worker] Data extraite:', payloadData);
      
      // Extraction avec fallbacks multiples
      const title = notification.title || payloadData.title || rawData.title || '🎯 NettmobFrance';
      const body = notification.body || payloadData.message || payloadData.body || rawData.body || 'Nouvelle notification';
      const clickAction = notification.click_action || payloadData.click_action || payloadData.action_url || rawData.action_url || '/';
      const type = payloadData.type || rawData.type || 'general';
      const missionId = payloadData.mission_id || rawData.mission_id || null;
      
      data = {
        title: title,
        message: body,
        action_url: clickAction,
        icon: notification.icon || rawData.icon || '/favicon-1.png',
        badge: notification.badge || rawData.badge || '/badge-72x72.png',
        type: type,
        mission_id: missionId,
        mission_name: payloadData.mission_name || rawData.mission_name,
        client_name: payloadData.client_name || rawData.client_name,
        hourly_rate: payloadData.hourly_rate || rawData.hourly_rate,
        city: payloadData.city || rawData.city
      };

      // Log détaillé pour debugging
      console.log('[Service Worker] ✅ Notification formatée avec succès:', data);
      
    } catch (e) {
      console.error('[Service Worker] ❌ Erreur parsing push data:', e);
      console.log('[Service Worker] Données brutes event.data:', event.data);
      console.log('[Service Worker] Tentative de lecture text()...');
      
      try {
        const textData = event.data.text();
        console.log('[Service Worker] Données en text():', textData);
      } catch (textError) {
        console.error('[Service Worker] Impossible de lire en text():', textError);
      }
    }
  } else {
    console.log('[Service Worker] ⚠️ Aucune donnée dans event.data');
  }

  // Déterminer si c'est une mission
  const isMission = data.type === 'mission' || data.type === 'new_mission' || data.mission_id;

  // Construire un message enrichi pour les missions
  let displayMessage = data.message;
  if (isMission && data.mission_name) {
    displayMessage = `Mission: ${data.mission_name}`;
    if (data.hourly_rate) displayMessage += ` - ${data.hourly_rate}€/h`;
    if (data.city) displayMessage += ` à ${data.city}`;
    if (data.client_name) displayMessage += ` par ${data.client_name}`;
  }

  const options = {
    body: displayMessage,
    icon: data.icon || '/favicon-1.png',
    badge: data.badge || '/badge-72x72.png',
    vibrate: [200, 100, 200], // Vibration plus forte pour les missions
    data: {
      url: data.action_url || '/',
      dateOfArrival: Date.now(),
      type: data.type,
      mission_id: data.mission_id
    },
    actions: isMission ? [
      {
        action: 'view_mission',
        title: '👀 Voir Mission',
        icon: '/icons/view.png'
      },
      {
        action: 'mark_interested',
        title: '✋ Intéressé',
        icon: '/icons/hand.png'
      },
      {
        action: 'close',
        title: 'Fermer',
        icon: '/icons/close.png'
      }
    ] : [
      {
        action: 'open',
        title: 'Ouvrir',
        icon: '/check.png'
      },
      {
        action: 'close',
        title: 'Fermer',
        icon: '/close.png'
      }
    ],
    tag: isMission ? `mission-${data.mission_id}` : 'nettmob-notification',
    requireInteraction: isMission, // Force interaction pour les missions
    renotify: true,
    silent: false
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Clic sur une notification
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification cliquée', {
    action: event.action,
    type: event.notification.data?.type,
    mission_id: event.notification.data?.mission_id,
    url: event.notification.data?.url
  });
  
  event.notification.close();

  // Gestion des actions spécifiques aux missions
  const notifType = event.notification.data?.type;
  const isMissionNotif = notifType === 'mission' || notifType === 'new_mission' || event.notification.data?.mission_id;
  
  if (isMissionNotif) {
    if (event.action === 'close') {
      console.log('[Service Worker] Mission notification fermée');
      return;
    }
    
    if (event.action === 'mark_interested') {
      console.log('[Service Worker] Marquage intérêt mission:', event.notification.data.mission_id);
      // Envoyer un message au client principal pour marquer l'intérêt
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'mark_mission_interest',
            mission_id: event.notification.data.mission_id,
            mission_title: event.notification.data.mission_title
          });
        });
      });
      
      // Ouvrir quand même la mission pour confirmation
      const missionUrl = new URL(`/automob/missions/${event.notification.data.mission_id}`, self.location.origin).href;
      console.log('[Service Worker] Ouverture mission pour intérêt:', missionUrl);
      
      event.waitUntil(
        clients.openWindow(missionUrl)
      );
      return;
    }
  }

  if (event.action === 'close') {
    console.log('[Service Worker] Action: Fermeture');
    return;
  }

  const urlToOpen = new URL(event.notification.data?.url || '/', self.location.origin).href;
  console.log('[Service Worker] URL à ouvrir:', urlToOpen);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        console.log('[Service Worker] Fenêtres ouvertes:', windowClients.length);
        
        // Chercher si une fenêtre est déjà ouverte sur la même origine
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          const clientUrl = new URL(client.url);
          const targetUrl = new URL(urlToOpen);
          
          // Si même origine, naviguer et focus
          if (clientUrl.origin === targetUrl.origin && 'focus' in client) {
            console.log('[Service Worker] Focus sur fenêtre existante');
            return client.focus().then(() => {
              // Naviguer vers l'URL cible si différente
              if (client.url !== urlToOpen) {
                return client.navigate(urlToOpen);
              }
            });
          }
        }
        
        // Sinon, ouvrir une nouvelle fenêtre
        if (clients.openWindow) {
          console.log('[Service Worker] Ouverture nouvelle fenêtre');
          return clients.openWindow(urlToOpen);
        }
      })
      .catch((error) => {
        console.error('[Service Worker] Erreur lors du clic:', error);
      })
  );
});

// Fermeture d'une notification
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification fermée', event);
});

// Gestion des messages du client
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message reçu:', event.data);
  
  // Répondre immédiatement pour éviter l'erreur "message channel closed"
  if (event.ports && event.ports[0]) {
    event.ports[0].postMessage({ received: true });
  }
  
  // Traiter le message
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
