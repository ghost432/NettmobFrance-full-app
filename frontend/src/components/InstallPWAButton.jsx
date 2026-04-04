import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from '@/components/ui/toast';

export const InstallPWAButton = ({ variant = "outline", size = "sm", className = "" }) => {
  const { isInstallable, isInstalled, installPWA } = usePWAInstall();

  const handleInstall = async () => {
    const success = await installPWA();
    if (success) {
      toast.success('Application installée avec succès ! 🎉');
    } else {
      toast.info('Installation annulée');
    }
  };

  // Ne pas afficher le bouton si déjà installé ou pas installable
  if (isInstalled || !isInstallable) {
    return null;
  }

  return (
    <Button
      onClick={handleInstall}
      variant={variant}
      size={size}
      className={className}
    >
      <Download className="h-4 w-4 mr-2" />
      Installer l'app
    </Button>
  );
};
