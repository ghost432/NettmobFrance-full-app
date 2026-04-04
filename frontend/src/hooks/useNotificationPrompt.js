import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

/**
 * Hook pour détecter si l'utilisateur doit être invité à activer les notifications
 * Détecte les changements d'appareil/navigateur
 */
export const useNotificationPrompt = () => {
  const { user } = useAuth();
  const [shouldPrompt, setShouldPrompt] = useState(false);

  useEffect(() => {
    if (!user) {
      setShouldPrompt(false);
      return;
    }

    // Vérifier si les notifications sont supportées
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.log('🔕 Notifications non supportées sur cet appareil');
      setShouldPrompt(false);
      return;
    }

    // Attendre 2 secondes après la connexion avant de vérifier
    const timer = setTimeout(() => {
      checkNotificationStatus();
    }, 2000);

    const checkNotificationStatus = async () => {
      try {
        // Générer un identifiant unique pour cet appareil/navigateur
        const deviceId = await generateDeviceId();
        
        // Récupérer l'ID de l'appareil précédemment enregistré
        const savedDeviceId = localStorage.getItem('deviceId');
        const notificationPromptDismissed = localStorage.getItem('notificationPromptDismissed');
        
        // Nouveau appareil/navigateur détecté
        const isNewDevice = !savedDeviceId || savedDeviceId !== deviceId;
        
        // Vérifier l'état des permissions de notification
        const permission = Notification.permission;
        
        // Vérifier si l'utilisateur a déjà refusé explicitement les notifications
        const userHasDisabledNotifications = user?.profile?.web_push_enabled === false;
        
        console.log('🔍 Vérification notifications:', {
          isNewDevice,
          permission,
          userHasDisabledNotifications,
          promptDismissed: notificationPromptDismissed
        });
        
        // Afficher le prompt si:
        // 1. C'est un nouvel appareil/navigateur
        // 2. Les notifications ne sont pas accordées
        // 3. L'utilisateur n'a pas explicitement désactivé les notifications
        // 4. Le prompt n'a pas été refusé récemment (moins de 7 jours)
        if (isNewDevice && permission !== 'granted' && !userHasDisabledNotifications) {
          // Vérifier si le prompt a été refusé récemment
          if (notificationPromptDismissed) {
            const dismissedDate = new Date(notificationPromptDismissed);
            const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
            
            if (daysSinceDismissed < 7) {
              console.log('⏳ Prompt refusé il y a moins de 7 jours');
              setShouldPrompt(false);
              return;
            }
          }
          
          // Enregistrer le nouvel appareil
          localStorage.setItem('deviceId', deviceId);
          setShouldPrompt(true);
        } else {
          setShouldPrompt(false);
          
          // Si les permissions sont accordées, enregistrer l'appareil
          if (permission === 'granted' && isNewDevice) {
            localStorage.setItem('deviceId', deviceId);
          }
        }
      } catch (error) {
        console.error('❌ Erreur vérification notifications:', error);
        setShouldPrompt(false);
      }
    };

    return () => clearTimeout(timer);
  }, [user]);

  return shouldPrompt;
};

/**
 * Génère un identifiant unique pour l'appareil/navigateur actuel
 */
const generateDeviceId = async () => {
  const components = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset(),
    screen.width,
    screen.height,
    screen.colorDepth
  ];

  const fingerprint = components.join('|');
  
  // Créer un hash simple du fingerprint
  const hash = await simpleHash(fingerprint);
  return hash;
};

/**
 * Crée un hash simple d'une chaîne
 */
const simpleHash = async (str) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

/**
 * Marque le prompt comme refusé
 */
export const dismissNotificationPrompt = () => {
  localStorage.setItem('notificationPromptDismissed', new Date().toISOString());
};

/**
 * Réinitialise le statut du prompt (pour permettre de le réafficher)
 */
export const resetNotificationPrompt = () => {
  localStorage.removeItem('notificationPromptDismissed');
};
