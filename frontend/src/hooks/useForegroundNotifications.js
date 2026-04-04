import { useEffect } from 'react';
import { setupMessageListener } from '@/config/firebase';

/**
 * Hook pour configurer l'écoute des notifications en premier plan
 * S'active automatiquement si l'utilisateur a accordé la permission
 */
export function useForegroundNotifications() {
  useEffect(() => {
    // Vérifier si les notifications sont supportées et autorisées
    if (!('Notification' in window)) {
      console.log('⚠️ Les notifications ne sont pas supportées');
      return;
    }

    if (Notification.permission !== 'granted') {
      console.log('⚠️ Permission notifications non accordée:', Notification.permission);
      return;
    }

    console.log('🎧 Configuration de l\'écoute des notifications en premier plan...');
    
    // Configurer l'écoute des messages
    const unsubscribe = setupMessageListener((payload) => {
      console.log('📬 [Foreground] Message reçu:', payload);
      
      // Afficher une notification locale
      const notificationTitle = payload.notification?.title || 'NettMobFrance';
      const notificationOptions = {
        body: payload.notification?.body || 'Vous avez une nouvelle notification',
        icon: payload.notification?.icon || '/favicon-1.png',
        badge: '/favicon-1.png',
        tag: payload.data?.tag || 'notification-' + Date.now(),
        data: payload.data,
        requireInteraction: false,
        vibrate: [200, 100, 200],
        timestamp: Date.now()
      };

      console.log('🔔 Affichage notification foreground:', notificationTitle);
      
      try {
        const notification = new Notification(notificationTitle, notificationOptions);
        
        // Gérer le clic sur la notification
        notification.onclick = (event) => {
          event.preventDefault();
          const targetUrl = payload.data?.click_action || payload.data?.url || '/';
          window.focus();
          window.location.href = targetUrl;
          notification.close();
        };
      } catch (error) {
        console.error('❌ Erreur affichage notification:', error);
      }
    });
    
    console.log('✅ Écoute notifications foreground activée');

    // Cleanup : désabonner quand le composant est démonté
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
        console.log('🔇 Écoute notifications foreground désactivée');
      }
    };
  }, []); // Se lance une seule fois au montage du composant
}

export default useForegroundNotifications;
