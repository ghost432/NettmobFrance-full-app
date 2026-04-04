import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, Monitor, CheckCircle2, Info } from 'lucide-react';

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState('unknown');

  useEffect(() => {
    // Détecter la plateforme
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    // Vérifier si déjà installé
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  return (
    <DashboardLayout
      title="Installer l'application PWA"
      description="Installez NettmobFrance sur votre appareil pour un accès rapide"
      menuItems={adminNavigation}
    >
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* État d'installation */}
        {isInstalled ? (
          <Card className="p-6 bg-green-50 border-green-200">
            <div className="flex items-center gap-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-green-900">
                  Application déjà installée
                </h3>
                <p className="text-green-700">
                  NettmobFrance est déjà installée sur cet appareil
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <>
            {/* Bouton d'installation rapide (Chrome/Edge) */}
            {deferredPrompt && (
              <Card className="p-6 bg-blue-50 border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Download className="h-10 w-10 text-blue-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900">
                        Installation en un clic
                      </h3>
                      <p className="text-blue-700">
                        Installez l'application directement depuis votre navigateur
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleInstallClick}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Installer maintenant
                  </Button>
                </div>
              </Card>
            )}

            {/* Instructions Android */}
            {platform === 'android' && !deferredPrompt && (
              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <Smartphone className="h-8 w-8 text-green-600 flex-shrink-0" />
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Installation sur Android</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Ouvrez le menu de votre navigateur (⋮)</li>
                      <li>Appuyez sur "Ajouter à l'écran d'accueil" ou "Installer l'application"</li>
                      <li>Confirmez l'installation</li>
                      <li>L'icône NettmobFrance apparaîtra sur votre écran d'accueil</li>
                    </ol>
                  </div>
                </div>
              </Card>
            )}

            {/* Instructions iOS */}
            {platform === 'ios' && (
              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <Smartphone className="h-8 w-8 text-gray-600 flex-shrink-0" />
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Installation sur iOS (Safari uniquement)</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Ouvrez cette page dans Safari (pas Chrome)</li>
                      <li>Appuyez sur le bouton Partager <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-500 text-white rounded text-xs">↑</span></li>
                      <li>Faites défiler et appuyez sur "Sur l'écran d'accueil"</li>
                      <li>Appuyez sur "Ajouter"</li>
                      <li>L'icône NettmobFrance apparaîtra sur votre écran d'accueil</li>
                    </ol>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                      <div className="flex gap-2">
                        <Info className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-yellow-800">
                          <strong>Important:</strong> Sur iOS, l'installation PWA ne fonctionne que dans Safari, pas dans Chrome ou Firefox.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Instructions Desktop */}
            {platform === 'desktop' && !deferredPrompt && (
              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <Monitor className="h-8 w-8 text-blue-600 flex-shrink-0" />
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Installation sur ordinateur</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-sm mb-2">Chrome / Edge:</h4>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                          <li>Cliquez sur l'icône d'installation dans la barre d'adresse (⊕ ou 💻)</li>
                          <li>Ou ouvrez le menu (⋮) → "Installer NettmobFrance"</li>
                          <li>Confirmez l'installation</li>
                        </ol>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-2">Firefox:</h4>
                        <p className="text-sm text-muted-foreground">
                          Firefox ne supporte pas encore pleinement les PWA sur ordinateur. Utilisez Chrome ou Edge pour une meilleure expérience.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}

        {/* Avantages de la PWA */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Avantages de l'application installée</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Accès rapide</h4>
                <p className="text-sm text-muted-foreground">
                  Lancez l'application depuis votre écran d'accueil
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Mode hors ligne</h4>
                <p className="text-sm text-muted-foreground">
                  Consultez vos données même sans connexion
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Notifications push</h4>
                <p className="text-sm text-muted-foreground">
                  Recevez des notifications instantanées
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Expérience native</h4>
                <p className="text-sm text-muted-foreground">
                  Interface optimisée comme une application native
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default InstallPWA;
