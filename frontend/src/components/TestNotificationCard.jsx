import { useState } from 'react';
import { NotificationActivationCard } from './NotificationActivationCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';

/**
 * Composant de test pour la NotificationActivationCard
 * Permet de simuler différents états de notifications
 */
export const TestNotificationCard = () => {
  const [testStatus, setTestStatus] = useState(null);

  const simulateStatus = (hasToken, webPushEnabled) => {
    const status = { hasToken, webPushEnabled, role: 'automob' };
    setTestStatus(status);
    
    // Émettre l'événement de changement de statut
    window.dispatchEvent(new CustomEvent('notificationStatusChanged', { 
      detail: status 
    }));
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Test de la Carte de Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-3">
                Utilisez les boutons ci-dessous pour tester différents états :
              </p>
              
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={() => simulateStatus(false, false)}
                  variant="outline"
                  size="sm"
                >
                  <ToggleLeft className="h-4 w-4 mr-1" />
                  Pas de token
                </Button>
                
                <Button 
                  onClick={() => simulateStatus(true, false)}
                  variant="outline" 
                  size="sm"
                >
                  <ToggleLeft className="h-4 w-4 mr-1" />
                  Token mais désactivé
                </Button>
                
                <Button 
                  onClick={() => simulateStatus(true, true)}
                  variant="outline"
                  size="sm"
                >
                  <ToggleRight className="h-4 w-4 mr-1" />
                  Complètement activé
                </Button>
                
                <Button 
                  onClick={() => {
                    setTestStatus(null);
                    window.location.reload();
                  }}
                  variant="ghost"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Réinitialiser
                </Button>
              </div>
            </div>
            
            {testStatus && (
              <div className="p-3 bg-blue-50 rounded-md">
                <p className="text-sm font-medium text-blue-900 mb-1">État simulé :</p>
                <div className="flex gap-2">
                  <Badge variant={testStatus.hasToken ? "default" : "secondary"}>
                    Token: {testStatus.hasToken ? "✅" : "❌"}
                  </Badge>
                  <Badge variant={testStatus.webPushEnabled ? "default" : "secondary"}>
                    Push: {testStatus.webPushEnabled ? "✅" : "❌"}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* La carte de notification à tester */}
      <NotificationActivationCard />
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">📝 Comment tester</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong>1. Pas de token :</strong>
              <p className="text-gray-600">La carte s'affiche avec "Configurez les notifications push"</p>
            </div>
            <div>
              <strong>2. Token mais désactivé :</strong>
              <p className="text-gray-600">La carte s'affiche avec "Activez les notifications push"</p>
            </div>
            <div>
              <strong>3. Complètement activé :</strong>
              <p className="text-gray-600">La carte disparaît ou affiche "Notifications activées"</p>
            </div>
            <div>
              <strong>4. Test du lien :</strong>
              <p className="text-gray-600">Le bouton "Activer maintenant" mène vers les paramètres</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestNotificationCard;
