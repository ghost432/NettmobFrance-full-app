import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from '../components/ui/toast';

/**
 * Hook pour gérer les toasts automatiques lors de la navigation et des événements
 */
export const useToastEvents = () => {
  const location = useLocation();

  useEffect(() => {
    // Toast lors de l'arrivée sur certaines pages
    const pathMessages = {
      '/automob/dashboard': 'Bienvenue sur votre dashboard',
      '/client/dashboard': 'Bienvenue sur votre dashboard',
      '/admin/dashboard': 'Bienvenue sur l\'administration',
    };

    // Afficher le message uniquement lors du premier chargement
    const hasShownWelcome = sessionStorage.getItem(`welcome_${location.pathname}`);
    
    if (pathMessages[location.pathname] && !hasShownWelcome) {
      toast.success(pathMessages[location.pathname]);
      sessionStorage.setItem(`welcome_${location.pathname}`, 'true');
    }
  }, [location.pathname]);

  // Gérer les erreurs de connexion internet
  useEffect(() => {
    const handleOnline = () => {
      toast.success('Connexion internet rétablie');
    };

    const handleOffline = () => {
      toast.error('Connexion internet perdue');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Toast avant de quitter la page si un formulaire est en cours
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const forms = document.querySelectorAll('form');
      let hasUnsavedChanges = false;

      forms.forEach(form => {
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
          if (input.value && input.defaultValue !== input.value) {
            hasUnsavedChanges = true;
          }
        });
      });

      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
};

/**
 * Toasts prédéfinis pour les actions courantes
 */
export const showSuccessToast = {
  profileUpdated: () => toast.success('Profil mis à jour avec succès'),
  photoUploaded: () => toast.success('Photo téléchargée avec succès'),
  settingsSaved: () => toast.success('Paramètres enregistrés'),
  missionCreated: () => toast.success('Mission créée avec succès'),
  missionApplied: () => toast.success('Candidature envoyée'),
  messageSent: () => toast.success('Message envoyé'),
  accountVerified: () => toast.success('Compte vérifié avec succès'),
  passwordChanged: () => toast.success('Mot de passe modifié'),
};

export const showErrorToast = {
  networkError: () => toast.error('Erreur de connexion au serveur'),
  uploadError: () => toast.error('Erreur lors du téléchargement'),
  formValidation: (message) => toast.error(message || 'Veuillez vérifier les champs du formulaire'),
  unauthorized: () => toast.error('Vous n\'êtes pas autorisé à effectuer cette action'),
  serverError: () => toast.error('Erreur serveur. Veuillez réessayer.'),
};

export const showInfoToast = {
  loading: (message) => toast.info(message || 'Chargement en cours...'),
  processing: () => toast.info('Traitement en cours...'),
  saved: () => toast.info('Sauvegarde en cours...'),
};
