import { useEffect } from 'react';
import api from '@/lib/api';

/**
 * Hook pour gérer le badge PWA affichant le nombre de notifications non lues
 */
export const useBadgeManager = () => {

  // Fonction pour mettre à jour le badge
  const updateBadge = async () => {
    try {
      // Vérifier si l'API Badge est supportée
      if (!('setAppBadge' in navigator)) {
        console.log('📛 Badge API non supportée par ce navigateur');
        return;
      }

      // Récupérer le nombre de notifications non lues seulement si on est connecté
      const token = localStorage.getItem('token');
      if (!token) {
        if ('clearAppBadge' in navigator) await navigator.clearAppBadge();
        return;
      }

      const response = await api.get('/notifications/unread-count');
      const count = response.data?.count || 0;

      // Mettre à jour le badge
      if (count > 0) {
        await navigator.setAppBadge(count);
        console.log(`📛 Badge mis à jour: ${count} notification(s) non lue(s)`);
      } else {
        await navigator.clearAppBadge();
        console.log('📛 Badge effacé: aucune notification non lue');
      }
    } catch (error) {
      console.error('Erreur mise à jour badge:', error);
      // En cas d'erreur, effacer le badge
      try {
        if ('clearAppBadge' in navigator) {
          await navigator.clearAppBadge();
        }
      } catch (e) {
        // Ignorer les erreurs de clearBadge
      }
    }
  };

  // Fonction pour effacer le badge
  const clearBadge = async () => {
    try {
      if ('clearAppBadge' in navigator) {
        await navigator.clearAppBadge();
        console.log('📛 Badge effacé manuellement');
      }
    } catch (error) {
      console.error('Erreur effacement badge:', error);
    }
  };

  // Mettre à jour le badge au montage du composant
  useEffect(() => {
    updateBadge();

    // Mettre à jour le badge toutes les 30 secondes
    const interval = setInterval(updateBadge, 30000);

    // Mettre à jour le badge quand la fenêtre gagne le focus
    const handleFocus = () => {
      updateBadge();
    };

    window.addEventListener('focus', handleFocus);

    // Mettre à jour le badge quand l'utilisateur devient visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateBadge();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Écouter les messages du service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'UPDATE_BADGE') {
          updateBadge();
        }
      });
    }

    // Nettoyage
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return {
    updateBadge,
    clearBadge
  };
};

export default useBadgeManager;
