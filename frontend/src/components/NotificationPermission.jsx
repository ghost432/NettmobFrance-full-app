import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import pushNotificationService from '@/utils/pushNotificationService';

const NotificationPermission = ({ 
  showAlways = false, 
  onPermissionGranted = null, 
  onPermissionDenied = null,
  className = ""
}) => {
  const [permission, setPermission] = useState('default');
  const [isRequesting, setIsRequesting] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Vérifier le support des notifications
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      toast.error('Notifications non supportées par votre navigateur');
      return;
    }

    setIsRequesting(true);
    
    try {
      const granted = await pushNotificationService.requestNotificationPermission();
      
      if (granted) {
        setPermission('granted');
        toast.success('🔔 Notifications activées ! Vous recevrez les nouvelles missions même hors ligne.');
        onPermissionGranted && onPermissionGranted();
      } else {
        setPermission('denied');
        toast.warning('⚠️ Notifications refusées. Vous pouvez les activer dans les paramètres du navigateur.');
        onPermissionDenied && onPermissionDenied();
      }
    } catch (error) {
      console.error('Erreur demande permission notifications:', error);
      toast.error('Erreur lors de l\'activation des notifications');
    } finally {
      setIsRequesting(false);
    }
  };

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          badge: <Badge variant="success">Activées</Badge>,
          title: 'Notifications activées',
          description: 'Vous recevrez les notifications même hors ligne',
          color: 'border-green-200 bg-green-50'
        };
      case 'denied':
        return {
          icon: <BellOff className="h-5 w-5 text-red-600" />,
          badge: <Badge variant="destructive">Refusées</Badge>,
          title: 'Notifications désactivées',
          description: 'Activez dans les paramètres du navigateur pour recevoir les missions',
          color: 'border-red-200 bg-red-50'
        };
      default:
        return {
          icon: <Bell className="h-5 w-5 text-orange-600" />,
          badge: <Badge variant="secondary">Non configurées</Badge>,
          title: 'Notifications non configurées',
          description: 'Activez pour recevoir les nouvelles missions même hors ligne',
          color: 'border-orange-200 bg-orange-50'
        };
    }
  };

  if (!isSupported) {
    return (
      <Card className={`${className} border-gray-200`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-gray-600" />
              <CardTitle className="text-sm">Notifications non supportées</CardTitle>
            </div>
            <Badge variant="secondary">Non disponible</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-xs">
            Votre navigateur ne supporte pas les notifications push. 
            Mettez à jour votre navigateur pour recevoir les notifications.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  // Ne pas afficher si permission accordée et showAlways = false
  if (permission === 'granted' && !showAlways) {
    return null;
  }

  const status = getPermissionStatus();

  return (
    <Card className={`${className} ${status.color}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {status.icon}
            <CardTitle className="text-sm">{status.title}</CardTitle>
          </div>
          {status.badge}
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-xs mb-3">
          {status.description}
        </CardDescription>
        
        {permission === 'default' && (
          <Button 
            onClick={requestPermission}
            disabled={isRequesting}
            size="sm"
            className="w-full"
          >
            <Bell className="h-4 w-4 mr-2" />
            {isRequesting ? 'Activation...' : 'Activer les notifications'}
          </Button>
        )}
        
        {permission === 'denied' && (
          <div className="text-xs text-gray-600 space-y-2">
            <p><strong>Pour activer manuellement :</strong></p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Cliquez sur l'icône 🔒 dans la barre d'adresse</li>
              <li>Autorisez les notifications</li>
              <li>Rechargez la page</li>
            </ol>
          </div>
        )}
        
        {permission === 'granted' && showAlways && (
          <div className="flex items-center gap-2 text-xs text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span>Vous recevrez toutes les nouvelles missions !</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationPermission;
