import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, TestTube, Play, Trash2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import testNotificationService from '@/utils/testNotificationService';
import pushNotificationService from '@/utils/pushNotificationService';

const NotificationTester = ({ className = "" }) => {
  const { user } = useAuth();
  const [isTestingPush, setIsTestingPush] = useState(false);
  const [isTestingSimulation, setIsTestingSimulation] = useState(false);
  const [isTestingPending, setIsTestingPending] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  const testPushNotification = async () => {
    if (!user?.id) return;
    
    setIsTestingPush(true);
    try {
      await testNotificationService.testPushNotification(
        user.id,
        Date.now(),
        'Mission de Test Push'
      );
    } finally {
      setIsTestingPush(false);
    }
  };

  const simulatePublication = async () => {
    if (!user?.id) return;
    
    setIsTestingSimulation(true);
    try {
      await testNotificationService.simulateMissionPublication(user.id, {
        title: 'Mission Simulation Test',
        description: 'Test complet du système de notifications'
      });
    } finally {
      setIsTestingSimulation(false);
    }
  };

  const testPendingNotifications = async () => {
    if (!user?.id) return;
    
    setIsTestingPending(true);
    try {
      await testNotificationService.testPendingNotifications(user.id);
    } finally {
      setIsTestingPending(false);
    }
  };

  const cleanupTestData = async () => {
    if (!user?.id) return;
    
    setIsCleaningUp(true);
    try {
      await testNotificationService.cleanupTestData(user.id);
    } finally {
      setIsCleaningUp(false);
    }
  };

  const checkPermissions = () => {
    const hasPermission = pushNotificationService.areNotificationsEnabled();
    return hasPermission;
  };

  if (!user) {
    return (
      <Card className={`${className} border-gray-200`}>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Test Notifications
          </CardTitle>
          <CardDescription className="text-xs">
            Connectez-vous pour tester les notifications
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const hasPermission = checkPermissions();

  return (
    <Card className={`${className} border-blue-200 bg-blue-50`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TestTube className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-sm">Test Notifications Push</CardTitle>
          </div>
          <Badge variant={hasPermission ? "success" : "secondary"}>
            {hasPermission ? "Permissions OK" : "Permissions requises"}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Testez le système de notifications pour les utilisateurs déconnectés
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Test Notification Push Directe */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-700">1. Test Push Immédiat</h4>
          <Button
            onClick={testPushNotification}
            disabled={isTestingPush}
            size="sm"
            variant="outline"
            className="w-full"
          >
            <Bell className="h-4 w-4 mr-2" />
            {isTestingPush ? 'Test en cours...' : 'Tester Push Notification'}
          </Button>
        </div>

        {/* Simulation Publication Mission */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-700">2. Simulation Publication</h4>
          <Button
            onClick={simulatePublication}
            disabled={isTestingSimulation}
            size="sm"
            variant="outline"
            className="w-full"
          >
            <Play className="h-4 w-4 mr-2" />
            {isTestingSimulation ? 'Simulation...' : 'Simuler Publication Mission'}
          </Button>
        </div>

        {/* Test Notifications en Attente */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-700">3. Test Notifications Stockées</h4>
          <Button
            onClick={testPendingNotifications}
            disabled={isTestingPending}
            size="sm"
            variant="outline"
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {isTestingPending ? 'Test...' : 'Tester Notifications en Attente'}
          </Button>
        </div>

        {/* Nettoyage */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-700">4. Nettoyage</h4>
          <Button
            onClick={cleanupTestData}
            disabled={isCleaningUp}
            size="sm"
            variant="destructive"
            className="w-full"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isCleaningUp ? 'Nettoyage...' : 'Nettoyer Données Test'}
          </Button>
        </div>

        {/* Instructions */}
        <div className="mt-4 p-2 bg-blue-100 rounded text-xs">
          <p className="font-medium mb-1">Instructions de test :</p>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>Testez push immédiat (notification visible immédiatement)</li>
            <li>Simulez publication (stockage pour hors ligne)</li>
            <li>Rechargez la page pour voir les notifications stockées</li>
            <li>Nettoyez les données après test</li>
          </ol>
        </div>

        {!hasPermission && (
          <div className="mt-2 p-2 bg-orange-100 border border-orange-200 rounded text-xs text-orange-700">
            ⚠️ Autorisez les notifications dans votre navigateur pour tester
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationTester;
