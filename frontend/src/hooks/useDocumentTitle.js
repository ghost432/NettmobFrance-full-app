import { useEffect } from 'react';

/**
 * Hook pour définir le titre de la page
 * @param {string} title - Le titre de la page (sans "NettmobFrance")
 */
export const useDocumentTitle = (title) => {
  useEffect(() => {
    if (title) {
      document.title = `${title} - NettmobFrance`;
    } else {
      document.title = 'NettmobFrance';
    }
    
    // Cleanup: restaurer le titre par défaut lors du démontage
    return () => {
      document.title = 'NettmobFrance';
    };
  }, [title]);
};
