import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/**
 * Hook pour configurer les push notifications en arrière-plan
 * S'exécute automatiquement sur le dashboard si l'utilisateur a accepté les notifications
 * Écoute aussi les messages du service worker pour la navigation
 */
export const usePushNotifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const setupPushNotifications = async () => {
      // Vérifier si les push notifications sont en attente de configuration
      const pending = localStorage.getItem('pushNotificationsPending');
      
      if (!pending || pending !== 'true') {
        return;
      }

      // Vérifier que la permission est accordée
      if (!('Notification' in window) || Notification.permission !== 'granted') {
        localStorage.removeItem('pushNotificationsPending');
        return;
      }

      console.log('🔔 Configuration des push notifications en arrière-plan...');

      try {
        // Importer dynamiquement le service FCM
        const { enablePushNotifications } = await import('@/services/fcmService');
        
        // Activer les push notifications
        await enablePushNotifications();
        
        console.log('✅ Push notifications configurées avec succès');
        
        // Retirer le flag
        localStorage.removeItem('pushNotificationsPending');
        
      } catch (error) {
        console.warn('⚠️ Impossible de configurer les push notifications:', error.message);
        // Ne pas bloquer l'utilisateur, juste logger l'erreur
        // Les notifications natives fonctionnent toujours
        localStorage.removeItem('pushNotificationsPending');
      }
    };

    // Attendre 3 secondes après le chargement du dashboard
    const timer = setTimeout(() => {
      if (user) {
        setupPushNotifications();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [user]);

  // Écouter les messages du service worker (notifications cliquées hors de l'app)
  useEffect(() => {
    if (!navigator.serviceWorker) return;

    const handleServiceWorkerMessage = (event) => {
      console.log('📨 Message reçu du Service Worker:', event.data);
      
      if (event.data?.type === 'NOTIFICATION_CLICK' && event.data?.url) {
        console.log('🔗 Navigation vers:', event.data.url);
        navigate(event.data.url);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, [navigate]);
};

export default usePushNotifications;
