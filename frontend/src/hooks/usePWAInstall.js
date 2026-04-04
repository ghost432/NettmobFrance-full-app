import { useState, useEffect } from 'react';
import api from '@/lib/api';

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Vérifier si l'app est déjà installée
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return true;
      }
      return false;
    };

    if (checkIfInstalled()) {
      return;
    }

    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      console.log('📱 PWA installable détecté');
      // Empêcher le mini-infobar par défaut de s'afficher sur mobile
      e.preventDefault();
      // Stocker l'événement pour pouvoir l'utiliser plus tard
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Écouter quand l'app est installée
    const handleAppInstalled = async () => {
      console.log('✅ PWA installée avec succès');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      
      // Enregistrer l'installation dans la base de données
      try {
        const platform = navigator.platform || 'Unknown';
        const userAgent = navigator.userAgent || 'Unknown';
        let browser = 'Unknown';
        
        // Détection du navigateur
        if (userAgent.includes('Chrome')) browser = 'Chrome';
        else if (userAgent.includes('Firefox')) browser = 'Firefox';
        else if (userAgent.includes('Safari')) browser = 'Safari';
        else if (userAgent.includes('Edge')) browser = 'Edge';
        else if (userAgent.includes('Opera')) browser = 'Opera';
        
        const response = await api.post('/admin/pwa-install', {
          platform,
          browser,
          user_agent: userAgent
        });
        
        if (response.status === 200) {
          console.log('✅ Installation PWA enregistrée dans la BDD');
        } else {
          console.error('❌ Erreur enregistrement installation PWA:', await response.text());
        }
      } catch (error) {
        console.error('❌ Erreur enregistrement installation PWA:', error);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installPWA = async () => {
    if (!deferredPrompt) {
      console.log('❌ Aucun prompt d\'installation disponible');
      return false;
    }

    // Afficher le prompt d'installation
    deferredPrompt.prompt();
    
    // Attendre que l'utilisateur réponde au prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`👉 Réponse utilisateur: ${outcome}`);
    
    if (outcome === 'accepted') {
      console.log('✅ Utilisateur a accepté l\'installation');
      setDeferredPrompt(null);
      setIsInstallable(false);
      return true;
    } else {
      console.log('❌ Utilisateur a refusé l\'installation');
      return false;
    }
  };

  return {
    isInstallable,
    isInstalled,
    installPWA
  };
};
