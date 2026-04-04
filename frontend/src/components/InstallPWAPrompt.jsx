import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, X, Smartphone } from 'lucide-react';

export const InstallPWAPrompt = () => {
  const { isInstallable, isInstalled, installPWA } = usePWAInstall();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const location = useLocation();

  const isAllowedPath = useMemo(() => {
    const path = location.pathname;
    return path.startsWith('/login') ||
      path.startsWith('/register') ||
      path.startsWith('/dashboard') ||
      path.startsWith('/admin') ||
      path.startsWith('/client') ||
      path.startsWith('/automob');
  }, [location.pathname]);

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà refusé
    const hasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (hasDismissed) {
      setDismissed(true);
      return;
    }

    // Afficher le prompt après 5 secondes si installable et sur une page autorisée
    if (isInstallable && !isInstalled && isAllowedPath) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      setShowPrompt(false);
    }
  }, [isInstallable, isInstalled, isAllowedPath]);

  const handleInstall = async () => {
    const success = await installPWA();
    if (success) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  const handleLater = () => {
    setShowPrompt(false);
    // Ne pas marquer comme dismissed pour rappeler plus tard
  };

  // Ne rien afficher si déjà installé ou dismissed
  if (isInstalled || dismissed || !isInstallable || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9998] w-[calc(100%-2rem)] max-w-sm animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
      <div className="relative group">
        {/* Glow Effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-blue-600 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>

        <Card className="relative border-none bg-background/80 backdrop-blur-xl shadow-2xl rounded-[1.8rem] overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="absolute inset-0 bg-primary/20 blur-lg rounded-2xl animate-pulse"></div>
                <div className="relative p-3 bg-primary/10 rounded-2xl border border-primary/20">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-black text-sm uppercase tracking-tight mb-0.5">
                  App NettmobFrance
                </h3>
                <p className="text-[11px] text-muted-foreground font-medium leading-tight">
                  Installez pour un accès direct et notifications.
                </p>
              </div>

              <button
                onClick={handleDismiss}
                className="shrink-0 p-1.5 hover:bg-muted rounded-full transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <Button
                onClick={handleInstall}
                size="sm"
                className="rounded-xl h-9 text-xs font-black uppercase tracking-tighter bg-primary hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary/20"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Installer
              </Button>
              <Button
                onClick={handleLater}
                size="sm"
                variant="ghost"
                className="rounded-xl h-9 text-xs font-bold uppercase tracking-tighter hover:bg-muted transition-all"
              >
                Plus tard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
