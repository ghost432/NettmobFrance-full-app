import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Settings, X, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import '@/utils/notificationCardDebug'; // Charger les outils de debug

/**
 * Composant de carte pour encourager l'activation des notifications push
 * S'affiche seulement si l'utilisateur n'a pas activé les notifications
 * Disparaît une fois les notifications activées
 */
export const NotificationActivationCard = () => {
  const { user } = useAuth();
  const [showCard, setShowCard] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState(null);

  // Vérifier le statut des notifications au chargement
  useEffect(() => {
    checkNotificationStatus();
  }, [user]);

  // Écouter les changements de statut des notifications
  useEffect(() => {
    const handleStatusChange = (event) => {
      const status = event.detail;
      setNotificationStatus(status);

      // Cacher la carte si les notifications sont maintenant activées
      const shouldShow = !status.hasToken || !status.webPushEnabled;
      setShowCard(shouldShow);
    };

    window.addEventListener('notificationStatusChanged', handleStatusChange);
    return () => {
      window.removeEventListener('notificationStatusChanged', handleStatusChange);
    };
  }, []);

  const checkNotificationStatus = async () => {
    try {
      setIsLoading(true);

      // Ne pas afficher la carte si elle a été fermée dans les 7 derniers jours
      const dismissedUntil = localStorage.getItem(`notification-card-dismissed-${user.id}`);
      if (dismissedUntil === 'true') {
        console.log('🔍 [NotificationCard] Carte masquée par l\'utilisateur (7 jours)');
        setIsDismissed(true);
        setIsLoading(false);
        return;
      }

      // Vérifier que le token existe
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('🔍 [NotificationCard] Pas de token - Masquer carte');
        setShowCard(false);
        setIsLoading(false);
        return;
      }

      // Vérifier le statut des notifications via l'API
      console.log('🔍 [NotificationCard] Vérification statut API...');
      const response = await api.get('/users/notifications');
      const status = response.data;

      console.log('🔍 [NotificationCard] Réponse API:', status);
      setNotificationStatus(status);

      // Afficher la carte si :
      // - L'utilisateur n'a pas de token FCM OU
      // - Les notifications push ne sont pas activées
      const shouldShow = !status.hasToken || !status.webPushEnabled;

      console.log('🔍 [NotificationCard] Logique affichage:');
      console.log(`   - hasToken: ${status.hasToken}`);
      console.log(`   - webPushEnabled: ${status.webPushEnabled}`);
      console.log(`   - shouldShow: ${shouldShow}`);
      console.log(`   - Formule: !hasToken (${!status.hasToken}) || !webPushEnabled (${!status.webPushEnabled}) = ${shouldShow}`);

      setShowCard(shouldShow);

    } catch (error) {
      console.error('🔍 [NotificationCard] Erreur API:', error);

      // Gestion spécifique selon le type d'erreur
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn('🔍 [NotificationCard] Token invalide/expiré - Masquer carte (AuthContext va gérer déconnexion)');
        // Ne pas afficher la carte si le token est invalide
        // AuthContext va détecter le 403 et déconnecter l'utilisateur
        setShowCard(false);
      } else if (error.response?.status === 404) {
        console.error('🔍 [NotificationCard] Route /users/notifications introuvable');
        // Afficher la carte par défaut en cas d'erreur 404 pour encourager activation
        setShowCard(true);
      } else {
        console.warn('🔍 [NotificationCard] Erreur inattendue:', error.message);
        // En cas d'erreur réseau ou autre, masquer la carte pour ne pas gêner l'UX
        setShowCard(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setShowCard(false);
    // Sauvegarder le choix localement (pour 7 jours)
    localStorage.setItem(`notification-card-dismissed-${user.id}`, 'true');
    // Auto-expiration après 7 jours
    setTimeout(() => {
      localStorage.removeItem(`notification-card-dismissed-${user.id}`);
    }, 7 * 24 * 60 * 60 * 1000);
  };

  const getSettingsLink = () => {
    if (user?.role === 'automob') {
      return '/automob/settings?section=notifications';
    } else if (user?.role === 'client') {
      return '/client/settings?section=notifications';
    }
    return '/settings';
  };

  const getCardMessage = () => {
    if (!notificationStatus) {
      return {
        title: "Activez les notifications",
        description: "Ne ratez plus aucune opportunité ! Activez les notifications push pour être informé en temps réel."
      };
    }

    if (!notificationStatus.hasToken) {
      return {
        title: "Configurez les notifications push",
        description: "Soyez alerté instantanément des nouvelles missions, candidatures et messages importants."
      };
    }

    if (!notificationStatus.webPushEnabled) {
      return {
        title: "Activez les notifications push",
        description: "Vos notifications sont configurées mais désactivées. Activez-les pour ne rien rater !"
      };
    }

    return {
      title: "Notifications activées",
      description: "Parfait ! Vous recevrez toutes les notifications importantes."
    };
  };

  // Ne pas afficher si en chargement, fermé ou non nécessaire
  if (isLoading || isDismissed || !showCard || !user) {
    return null;
  }

  const { title, description } = getCardMessage();
  const isActivated = notificationStatus?.hasToken && notificationStatus?.webPushEnabled;

  return (
    <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-full">
            {isActivated ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <Bell className="h-5 w-5 text-blue-600" />
            )}
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">
              {title}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">
              {description}
            </CardDescription>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {!notificationStatus?.hasToken && (
              <Badge variant="secondary" className="text-xs">
                Token requis
              </Badge>
            )}
            {notificationStatus?.hasToken && !notificationStatus?.webPushEnabled && (
              <Badge variant="outline" className="text-xs">
                À activer
              </Badge>
            )}
            {isActivated && (
              <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                ✅ Activé
              </Badge>
            )}
          </div>

          {!isActivated && (
            <Link to={getSettingsLink()}>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Settings className="h-4 w-4 mr-2" />
                Activer maintenant
              </Button>
            </Link>
          )}
        </div>

        <div className="mt-4 p-3 bg-blue-25 rounded-md border border-blue-200">
          <p className="text-xs text-blue-700 mb-2 font-medium">
            ✨ Avec les notifications activées, vous recevrez :
          </p>
          <ul className="text-xs text-blue-600 space-y-1">
            {user?.role === 'automob' ? (
              <>
                <li>• 🎯 Nouvelles missions correspondant à votre profil</li>
                <li>• ✅ Réponses à vos candidatures</li>
                <li>• 💰 Notifications de paiement</li>
                <li>• 💬 Nouveaux messages importants</li>
              </>
            ) : (
              <>
                <li>• 📝 Nouvelles candidatures sur vos missions</li>
                <li>• 📋 Feuilles de temps soumises</li>
                <li>• ✅ Confirmations de mission</li>
                <li>• 💬 Messages importants</li>
              </>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationActivationCard;
