import { X, AlertTriangle, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function IdentityVerificationPopup({ onClose }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const role = user?.role || 'automob';
  const roleText = role === 'automob' ? 'auto-entrepreneur' : 'gérant de votre entreprise';
  const verifyUrl = `/${role}/verify-identity`;

  const handleVerify = () => {
    onClose();
    navigate(verifyUrl);
  };

  const handleLater = () => {
    localStorage.setItem('identity_verification_dismissed', Date.now().toString());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-amber-500 to-orange-500 p-6 rounded-t-lg">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Vérification d'identité</h2>
              <p className="text-white/90 text-sm">Étape obligatoire</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Action requise
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Pour garantir la sécurité sur notre plateforme, nous devons vérifier l'identité {roleText}.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Documents acceptés :</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Carte d'identité nationale
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Passeport valide
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Permis de conduire
              </li>
            </ul>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium text-foreground">Processus simple :</p>
            <ol className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="font-semibold text-primary">1.</span>
                Prenez une photo de votre document
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-primary">2.</span>
                Téléchargez-la sur la plateforme
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-primary">3.</span>
                Vérification sous 24-48h
              </li>
            </ol>
          </div>

          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Vos données sont sécurisées et conformes au RGPD
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={handleLater}
            className="flex-1 px-4 py-2.5 border border-border rounded-lg hover:bg-accent transition-colors text-sm font-medium"
          >
            Plus tard
          </button>
          <button
            onClick={handleVerify}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all text-sm font-medium shadow-lg shadow-amber-500/25"
          >
            Vérifier maintenant
          </button>
        </div>
      </div>
    </div>
  );
}
