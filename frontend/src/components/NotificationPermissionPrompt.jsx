import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Bell, X } from 'lucide-react';
import { subscribeToPush } from '../services/firebasePushNotification';
import { useToast } from './NotificationToast';

export const NotificationPermissionPrompt = () => {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    // Vérifier si on doit afficher le prompt
    const checkPermission = async () => {
      // Ne pas afficher si déjà autorisé
      if (Notification.permission === 'granted') {
        return;
      }

      // Ne pas afficher si déjà refusé
      if (Notification.permission === 'denied') {
        return;
      }

      // Ne pas afficher si déjà demandé récemment (dans les 7 derniers jours)
      const lastAsked = localStorage.getItem('notification_last_asked');
      if (lastAsked) {
        const daysSinceLastAsk = (Date.now() - parseInt(lastAsked)) / (1000 * 60 * 60 * 24);
        if (daysSinceLastAsk < 7) {
          return;
        }
      }

      // Attendre 3 secondes après le chargement de la page
      setTimeout(() => {
        setShow(true);
      }, 3000);
    };

    checkPermission();
  }, []);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const subscribed = await subscribeToPush();
      
      if (subscribed) {
        success('✅ Notifications activées ! Vous recevrez les notifications importantes');
        setShow(false);
        localStorage.setItem('notification_last_asked', Date.now().toString());
      } else {
        error('❌ Impossible d\'activer les notifications');
      }
    } catch (err) {
      console.error('Erreur activation notifications:', err);
      error('❌ Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    // Se rappeler qu'on a demandé
    localStorage.setItem('notification_last_asked', Date.now().toString());
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-5">
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="relative pb-3">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">Activer les notifications ?</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <CardDescription className="text-sm">
            Recevez des notifications instantanées pour :
          </CardDescription>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Nouvelles missions disponibles</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Candidatures acceptées ou refusées</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Messages importants</span>
            </li>
          </ul>
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleEnable}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Activation...' : 'Activer'}
            </Button>
            <Button
              variant="outline"
              onClick={handleDismiss}
              disabled={loading}
            >
              Plus tard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
