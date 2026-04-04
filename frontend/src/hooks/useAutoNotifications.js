import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { toast } from '@/components/ui/toast';
import { enablePushNotifications, registerPendingFCMToken } from '@/services/fcmService';
import { isFirebaseConfigured } from '@/config/firebase';

/**
 * Hook pour configurer automatiquement toutes les notifications
 * - Socket.io ✓ (déjà géré par SocketContext)
 * - Toast notifications ✓ (géré par Socket) 
 * - Auto-création FCM tokens ✓ (nouveau)
 * - Firebase push web ✓ (nouveau)
 */
export const useAutoNotifications = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const setupAttempted = useRef(false);

  // Auto-setup des notifications FCM au premier chargement
  useEffect(() => {
    const autoSetupNotifications = async () => {
      if (!user || setupAttempted.current) return;

      setupAttempted.current = true;

      console.log('🔔 Auto-configuration des notifications pour:', user.email);

      try {
        // 1. Vérifier Firebase
        if (!isFirebaseConfigured()) {
          console.warn('⚠️ Firebase non configuré, skip auto FCM');
          return;
        }

        // 2. Enregistrer token FCM en attente s'il existe
        const pendingRegistered = await registerPendingFCMToken();
        if (pendingRegistered) {
          console.log('✅ Token FCM en attente enregistré');
          const lastToast = localStorage.getItem('last_notif_toast_time');
          const now = Date.now();
          if (!lastToast || (now - parseInt(lastToast)) > 3600000) { // Max 1 par heure
            toast.success('Notifications push activées !');
            localStorage.setItem('last_notif_toast_time', now.toString());
          }
          return;
        }

        // 3. Auto-créer un token FCM si aucun n'existe (pour éviter "Aucun token FCM")
        const autoCreateResponse = await fetch('/api/fcm/fcm-token/auto-create', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (autoCreateResponse.ok) {
          const autoData = await autoCreateResponse.json();
          if (autoData.autoCreated) {
            console.log('🔧 Token FCM auto-créé:', autoData.message);
            const lastToast = localStorage.getItem('last_notif_setup_toast_time');
            const now = Date.now();
            if (!lastToast || (now - parseInt(lastToast)) > 3600000) {
              toast.success('Système de notifications configuré automatiquement');
              localStorage.setItem('last_notif_setup_toast_time', now.toString());
            }
          }
        }

        // 4. Vérifier si les notifications sont déjà autorisées
        if ('Notification' in window) {
          if (Notification.permission === 'granted') {
            // Permissions OK, créer token FCM réel automatiquement
            console.log('🔑 Permissions OK, création token FCM réel...');
            try {
              await enablePushNotifications();
              console.log('✅ Notifications push activées automatiquement');
            } catch (pushError) {
              console.log('⚠️ Push réel échoué, token auto utilisé');
            }
          } else if (Notification.permission === 'default') {
            // Proposer d'activer dans 5 secondes
            setTimeout(() => {
              if (document.hasFocus()) {
                showNotificationPrompt();
              }
            }, 5000);
          }
        }
      } catch (error) {
        console.warn('⚠️ Auto-setup notifications échoué:', error.message);
        // Ne pas bloquer l'utilisateur, juste logger
      }
    };

    // Délai de 2 secondes pour laisser l'app se charger
    const timer = setTimeout(autoSetupNotifications, 2000);
    return () => clearTimeout(timer);
  }, [user]);

  // Fonction pour proposer l'activation des notifications
  const showNotificationPrompt = () => {
    toast.info(
      'Voulez-vous recevoir des notifications pour les nouvelles missions ?',
      {
        action: {
          label: 'Activer',
          onClick: async () => {
            try {
              await enablePushNotifications();
              toast.success('Notifications push activées !');
            } catch (error) {
              toast.error('Erreur activation notifications: ' + error.message);
            }
          }
        },
        duration: 10000 // 10 secondes
      }
    );
  };

  // Améliorer la communication Socket.io → Firebase
  useEffect(() => {
    if (!socket) return;

    const handleSocketNotification = (notification) => {
      console.log('🔔 [AutoNotifications] Notification socket reçue:', notification);

      // 1. Toast déjà géré par SocketContext

      // 2. Envoyer à Firebase si configuré
      if (isFirebaseConfigured() && 'serviceWorker' in navigator) {
        // Envoyer le message au service worker pour les notifications hors focus
        navigator.serviceWorker.ready.then(registration => {
          if (registration.active) {
            registration.active.postMessage({
              type: 'SOCKET_NOTIFICATION',
              notification: {
                title: notification.title,
                body: notification.message,
                icon: '/favicon-1.png',
                badge: '/favicon-1.png',
                data: {
                  url: notification.action_url || '/dashboard',
                  type: notification.type,
                  category: notification.category
                }
              }
            });
            console.log('📱 Notification envoyée au Service Worker');
          }
        }).catch(err => {
          console.warn('⚠️ Service Worker non disponible:', err);
        });
      }

      // 3. Vibration sur mobile
      if ('vibrate' in navigator && notification.type === 'success') {
        navigator.vibrate([100, 50, 100]);
      }
    };

    // Écouter les notifications Socket.io
    socket.on('new_notification', handleSocketNotification);

    return () => {
      socket.off('new_notification', handleSocketNotification);
    };
  }, [socket]);

  // Test de connectivité Socket.io
  useEffect(() => {
    if (!socket) return;

    const testConnection = () => {
      console.log('🔗 Test connexion Socket.io...');
      socket.emit('ping', { timestamp: Date.now() });
    };

    socket.on('connect', () => {
      console.log('✅ Socket.io connecté, test dans 3s...');
      setTimeout(testConnection, 3000);
    });

    socket.on('pong', (data) => {
      const latency = Date.now() - data.timestamp;
      console.log(`🏓 Socket.io OK (${latency}ms latence)`);
    });

    return () => {
      socket.off('connect');
      socket.off('pong');
    };
  }, [socket]);

  // Fonction pour rafraîchir le statut des notifications (utilisée par les Settings)
  const refreshNotificationStatus = async () => {
    if (!user) return false;

    try {
      const response = await fetch('/api/users/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const status = response.data || await response.json();
        // Émettre un événement pour notifier les composants
        window.dispatchEvent(new CustomEvent('notificationStatusChanged', {
          detail: status
        }));
        return status;
      }
    } catch (error) {
      console.warn('Erreur refresh notification status:', error);
    }
    return false;
  };

  return {
    showNotificationPrompt,
    refreshNotificationStatus
  };
};

export default useAutoNotifications;
