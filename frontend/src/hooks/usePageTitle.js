import { useEffect } from 'react';

/**
 * Hook personnalisé pour gérer le titre de la page
 * @param {string} title - Le titre de la page (sera suivi de " - NettMobFrance")
 */
export const usePageTitle = (title) => {
  useEffect(() => {
    if (title) {
      document.title = `${title} - NettMobFrance`;
    } else {
      document.title = 'NettMobFrance';
    }

    // Cleanup: restaurer le titre par défaut
    return () => {
      document.title = 'NettMobFrance';
    };
  }, [title]);
};

export default usePageTitle;
