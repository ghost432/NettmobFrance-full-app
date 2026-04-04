import { useEffect, useState, useCallback } from 'react';
import { requestNotificationPermission, setupMessageListener } from '@/config/firebase';
import api from '@/lib/api';

/**
 * Hook Expert pour Notifications Persistantes (comme Facebook)
 * Gère les notifications même quand l'application ou le navigateur est fermé
 */
export function useExpertNotifications() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState('default');

  // ============= INITIALISATION EXPERT =============
  useEffect(() => {
    console.log('🚀 [EXPERT] Initialisation notifications persistantes...');
    initializeExpertNotifications();
  }, []);

  const initializeExpertNotifications = async () => {
    try {
      setIsLoading(true);

      // 1. Vérifier le support des notifications
      if (!('Notification' in window)) {
        console.warn('⚠️ [EXPERT] Notifications non supportées par ce navigateur');
        setIsLoading(false);
        return;
      }

      // 2. Vérifier le support des Service Workers
      if (!('serviceWorker' in navigator)) {
        console.warn('⚠️ [EXPERT] Service Workers non supportés');
        setIsLoading(false);
        return;
      }

      // 3. Vérifier le statut actuel des permissions
      const currentPermission = Notification.permission;
      setPermissionStatus(currentPermission);
      console.log(`🔍 [EXPERT] Permission actuelle: ${currentPermission}`);

      // 4. Si déjà autorisé, configurer immédiatement
      if (currentPermission === 'granted') {
        await setupPersistentNotifications();
        setIsEnabled(true);
      }

      // 5. Enregistrer le Service Worker si pas encore fait
      await registerServiceWorker();

      // 6. Écouter les messages du Service Worker
      setupServiceWorkerListener();

      setIsLoading(false);
      console.log('✅ [EXPERT] Initialisation terminée');

    } catch (error) {
      console.error('❌ [EXPERT] Erreur initialisation:', error);
      setIsLoading(false);
    }
  };

  // ============= ENREGISTREMENT SERVICE WORKER =============
  const registerServiceWorker = async () => {
    try {
      if ('serviceWorker' in navigator) {
        // Vérifier si déjà enregistré
        const registration = await navigator.serviceWorker.getRegistration('/');

        if (registration) {
          console.log('✅ [EXPERT] Service Worker déjà enregistré');
          return registration;
        }

        // Enregistrer le Service Worker
        const newRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/', // Scope global pour capturer toutes les notifications
          updateViaCache: 'none' // Force les mises à jour
        });

        console.log('✅ [EXPERT] Service Worker enregistré:', newRegistration.scope);

        // Attendre qu'il soit actif
        if (newRegistration.installing) {
          await new Promise(resolve => {
            newRegistration.installing.addEventListener('statechange', () => {
              if (newRegistration.installing.state === 'activated') {
                resolve();
              }
            });
          });
        }

        return newRegistration;
      }
    } catch (error) {
      console.error('❌ [EXPERT] Erreur enregistrement Service Worker:', error);
      throw error;
    }
  };

  // ============= CONFIGURATION NOTIFICATIONS PERSISTANTES =============
  const setupPersistentNotifications = async () => {
    try {
      console.log('🔧 [EXPERT] Configuration notifications persistantes...');

      // 1. Demander token FCM pour notifications serveur
      const token = await requestNotificationPermission();

      if (token) {
        console.log('🎫 [EXPERT] Token FCM obtenu:', token.substring(0, 20) + '...');

        // 1.5 Sauvegarder le token sur le backend (uniquement si utilisateur authentifié)
        try {
          const authToken = localStorage.getItem('token');
          if (authToken) {
            await api.post('/fcm/fcm-token', { fcmToken: token });
            console.log('✅ [EXPERT] Token FCM sauvegardé sur le serveur');
            localStorage.setItem('fcmTokenSaved', 'true');
          } else {
            console.log('ℹ️ [EXPERT] Token FCM non sauvegardé sur le serveur (utilisateur non connecté)');
          }
        } catch (apiError) {
          console.error('❌ [EXPERT] Erreur sauvegarde token serveur:', apiError);
          // Ne pas bloquer le reste du flux
        }

        // 2. Configurer l'écoute des messages en foreground
        const unsubscribe = setupMessageListener((payload) => {
          console.log('📬 [EXPERT] Message foreground reçu:', payload);

          // Si l'app est ouverte, afficher notification locale simple (sans actions)
          if (Notification.permission === 'granted') {
            new Notification(payload.notification?.title || '🎯 NettmobFrance', {
              body: payload.notification?.body || 'Nouvelle notification',
              icon: '/favicon-1.png',
              badge: '/favicon-1.png',
              tag: 'nettmob-foreground',
              requireInteraction: false // Pas d'actions supportées ici
            });
          }
        });

        // 3. Nettoyer à la destruction du composant
        return unsubscribe;

      } else {
        console.warn('⚠️ [EXPERT] Impossible d\'obtenir le token FCM');
      }

    } catch (error) {
      console.error('❌ [EXPERT] Erreur configuration persistante:', error);
    }
  };

  // ============= ÉCOUTE MESSAGES SERVICE WORKER =============
  const setupServiceWorkerListener = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('📨 [EXPERT] Message du Service Worker:', event.data);

        const { type, url, notificationData } = event.data || {};

        if (type === 'NOTIFICATION_CLICK') {
          // Le Service Worker nous demande de naviguer
          console.log('🎯 [EXPERT] Navigation demandée vers:', url);

          // Utiliser React Router pour naviguer (si disponible)
          if (window.location.pathname !== url) {
            window.history.pushState({}, '', url);
            window.dispatchEvent(new PopStateEvent('popstate'));
          }
        }
      });

      console.log('👂 [EXPERT] Écoute messages Service Worker configurée');
    }
  };

  // ============= DEMANDE PERMISSION UTILISATEUR =============
  const requestPermission = useCallback(async () => {
    try {
      console.log('🙋 [EXPERT] Demande permission utilisateur...');

      if (!('Notification' in window)) {
        throw new Error('Notifications non supportées');
      }

      // Demander la permission
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      console.log(`📋 [EXPERT] Permission: ${permission}`);

      if (permission === 'granted') {
        await setupPersistentNotifications();
        setIsEnabled(true);

        // Notification de confirmation simple (sans actions)
        new Notification('🎉 Notifications Activées !', {
          body: 'Vous recevrez maintenant les notifications même quand l\'app est fermée',
          icon: '/favicon-1.png',
          tag: 'activation-success'
        });

        return true;
      } else {
        console.warn('⚠️ [EXPERT] Permission refusée par utilisateur');
        return false;
      }

    } catch (error) {
      console.error('❌ [EXPERT] Erreur demande permission:', error);
      return false;
    }
  }, []);

  // ============= TEST NOTIFICATION =============
  const sendTestNotification = useCallback(async () => {
    if (Notification.permission === 'granted') {
      try {
        // Essayer d'utiliser le Service Worker pour les actions avancées
        const registration = await navigator.serviceWorker.getRegistration();

        if (registration && registration.active) {
          // Via Service Worker (supporte les actions)
          await registration.showNotification('🧪 Test Notification Expert', {
            body: 'Ceci est un test de notification persistante avec Service Worker. Elle apparaîtra même si vous fermez l\'application !',
            icon: '/favicon-1.png',
            badge: '/favicon-1.png',
            tag: 'test-notification-sw',
            requireInteraction: true,
            actions: [
              { action: 'test-ok', title: '✅ OK' },
              { action: 'test-close', title: '❌ Fermer' }
            ],
            data: {
              type: 'test',
              url: '/',
              timestamp: Date.now()
            }
          });
          console.log('🧪 [EXPERT] Notification de test envoyée via Service Worker');
        } else {
          // Fallback: notification simple sans actions
          new Notification('🧪 Test Notification Expert', {
            body: 'Ceci est un test de notification simple. Les actions avancées nécessitent le Service Worker.',
            icon: '/favicon-1.png',
            badge: '/favicon-1.png',
            tag: 'test-notification-simple'
          });
          console.log('🧪 [EXPERT] Notification de test envoyée (simple, pas de Service Worker)');
        }

        return true;
      } catch (error) {
        console.error('❌ [EXPERT] Erreur test notification:', error);

        // Fallback ultime: notification basique
        try {
          new Notification('🧪 Test Notification', {
            body: 'Test de notification basique.',
            icon: '/favicon-1.png'
          });
          return true;
        } catch (fallbackError) {
          console.error('❌ [EXPERT] Erreur notification basique:', fallbackError);
          return false;
        }
      }
    }
    return false;
  }, []);

  // ============= VÉRIFICATION STATUT =============
  const checkStatus = useCallback(() => {
    const hasPermission = Notification.permission === 'granted';
    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasNotificationAPI = 'Notification' in window;

    return {
      hasPermission,
      hasServiceWorker,
      hasNotificationAPI,
      isFullyEnabled: hasPermission && hasServiceWorker && hasNotificationAPI,
      permissionStatus: Notification.permission
    };
  }, []);

  return {
    // États
    isEnabled,
    isLoading,
    permissionStatus,

    // Actions
    requestPermission,
    sendTestNotification,
    checkStatus,

    // Utilitaires
    isSupported: 'Notification' in window && 'serviceWorker' in navigator
  };
}
