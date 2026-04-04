import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, AlertCircle, ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Logo } from '@/components/Logo';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const NotFound = () => {
  useDocumentTitle('Page non trouvée');
  const navigate = useNavigate();
  const { user } = useAuth();

  const getDashboardPath = () => {
    if (!user) return '/login';
    
    switch (user.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'client':
        return '/client/dashboard';
      case 'automob':
        return '/automob/dashboard';
      default:
        return '/dashboard';
    }
  };

  const handleGoBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(getDashboardPath());
    }
  };

  const handleGoToDashboard = () => {
    navigate(getDashboardPath());
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-6 relative">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Logo en haut */}
      <div className="mb-8">
        <Logo className="h-16 w-auto" />
      </div>

      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-destructive/10 p-6">
              <AlertCircle className="h-16 w-16 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-4xl font-bold">404</CardTitle>
          <CardDescription className="text-xl mt-2">
            Page non trouvée
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground">
              Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
            </p>
            <p className="text-muted-foreground mt-2 text-sm">
              Vérifiez l'URL ou utilisez les boutons ci-dessous pour naviguer.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {/* Bouton Retour */}
            <Button
              onClick={handleGoBack}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la page précédente
            </Button>

            {/* Bouton Dashboard */}
            <Button
              onClick={handleGoToDashboard}
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              {user ? 'Retour au tableau de bord' : 'Retour à l\'accueil'}
            </Button>
          </div>

          {/* Message informatif pour les utilisateurs connectés */}
          {user && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground text-center">
                Connecté en tant que <strong>{user.email}</strong>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer avec informations supplémentaires */}
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          Besoin d'aide ? Contactez le support à{' '}
          <a href="mailto:support@nettmobfrance.fr" className="text-primary hover:underline">
            support@nettmobfrance.fr
          </a>
        </p>
      </div>
    </div>
  );
};

export default NotFound;
