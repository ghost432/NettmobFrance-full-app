import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Bell, Smartphone } from 'lucide-react';
import { useNotificationPrompt, dismissNotificationPrompt } from '@/hooks/useNotificationPrompt';
import { useExpertNotifications } from '@/hooks/useExpertNotifications';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/toast';

/**
 * Popup pour demander l'activation des notifications sur un nouvel appareil/navigateur
 */
export const NotificationPrompt = () => {
  const shouldPrompt = useNotificationPrompt();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { requestPermission } = useExpertNotifications();
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  if (!shouldPrompt || !isVisible) {
    return null;
  }

  const handleEnable = async () => {
    setIsLoading(true);

    try {
      // Utiliser le hook Expert pour demander la permission et gérer le token
      const granted = await requestPermission();

      if (granted) {
        // Enregistrer l'appareil dans le localStorage
        localStorage.setItem('notificationsEnabled', 'true');
        localStorage.setItem('pushNotificationsPending', 'true');

        toast.success('🔔 Notifications activées sur cet appareil !');
        setIsVisible(false);

        // Rediriger vers le dashboard après 1 seconde
        setTimeout(() => {
          const dashboardPath = user?.role === 'admin' ? '/admin/dashboard' :
            user?.role === 'client' ? '/client/dashboard' :
              '/automob/dashboard';
          navigate(dashboardPath);
        }, 1000);
      } else {
        toast.warning('⚠️ Notifications refusées ou bloquées.');
        setIsVisible(false);

        // Rediriger quand même
        setTimeout(() => {
          const dashboardPath = user?.role === 'admin' ? '/admin/dashboard' :
            user?.role === 'client' ? '/client/dashboard' :
              '/automob/dashboard';
          navigate(dashboardPath);
        }, 1000);
      }

    } catch (error) {
      console.error('Erreur activation notifications:', error);
      toast.error('Erreur lors de l\'activation des notifications');
      setIsVisible(false);

      // Rediriger quand même
      setTimeout(() => {
        const dashboardPath = user?.role === 'admin' ? '/admin/dashboard' :
          user?.role === 'client' ? '/client/dashboard' :
            '/automob/dashboard';
        navigate(dashboardPath);
      }, 1000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    dismissNotificationPrompt();
    setIsVisible(false);
    toast.info('Vous pouvez activer les notifications plus tard dans vos paramètres');

    // Rediriger vers le dashboard
    setTimeout(() => {
      const dashboardPath = user?.role === 'admin' ? '/admin/dashboard' :
        user?.role === 'client' ? '/client/dashboard' :
          '/automob/dashboard';
      navigate(dashboardPath);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* Header avec icône */}
        <div className="relative p-6 pb-4">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
            <Bell className="w-8 h-8 text-white animate-pulse" />
          </div>

          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
            Nouveau appareil détecté
          </h2>
        </div>

        {/* Contenu */}
        <div className="px-6 pb-6 space-y-4">
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Il semble que vous utilisiez un nouvel appareil ou navigateur. Souhaitez-vous activer les notifications pour rester informé ?
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Avec les notifications, vous recevrez :
            </p>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Alertes pour vos nouvelles missions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Rappels de pointage d'heures</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Messages importants de vos clients</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Mises à jour de statut de missions</span>
              </li>
            </ul>
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-col gap-3 pt-4">
            <button
              onClick={handleEnable}
              disabled={isLoading}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Activation...</span>
                </>
              ) : (
                <>
                  <Bell className="w-5 h-5" />
                  <span>Activer les notifications</span>
                </>
              )}
            </button>

            <button
              onClick={handleDismiss}
              disabled={isLoading}
              className="w-full px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Plus tard
            </button>
          </div>

          <p className="text-xs text-center text-gray-500 dark:text-gray-400 pt-2">
            Vous pouvez modifier ce choix à tout moment dans vos paramètres
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationPrompt;
