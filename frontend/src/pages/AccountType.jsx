import { useNavigate, Link } from 'react-router-dom';
import { ThemeToggle } from '../components/ThemeToggle';
import { Logo } from '../components/Logo';
import { Card, CardContent } from '../components/ui/card';
import { FieldDescription, FieldGroup } from '../components/ui/field';
import { Briefcase, Building2, ArrowLeft } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const AccountType = () => {
  useDocumentTitle('Type de compte');
  const navigate = useNavigate();

  const handleSelectType = (type) => {
    if (type === 'automob') {
      navigate('/register/automob?etape=informations');
    } else {
      navigate('/register/client?etape=informations');
    }
  };

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10 relative">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-5xl py-8">
        <Card className="rounded-[2.5rem] shadow-2xl w-full border-2 border-border overflow-hidden flex flex-col bg-card/50 backdrop-blur-xl">
          <CardContent className="p-0 flex flex-col h-full overflow-hidden">
            <div className="flex flex-col items-center p-8 pb-4 border-b border-border/50 bg-muted/30">
              <Logo className="h-16 w-auto mb-6" />
              <h1 className="text-3xl font-black text-foreground uppercase tracking-tighter">Créer un compte</h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2">Choisissez votre profil</p>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 scrollbar-hide">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Auto-entrepreneur Card */}
                <button
                  onClick={() => handleSelectType('automob')}
                  className="group relative overflow-hidden rounded-3xl border-4 border-border bg-background p-8 text-left transition-all hover:border-primary hover:shadow-2xl hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <div className="flex flex-col items-start space-y-6">
                    <div className="rounded-2xl bg-primary/10 p-4 group-hover:bg-primary/20 transition-colors self-center shadow-inner">
                      <Briefcase className="h-10 w-10 text-primary" />
                    </div>
                    <div className="text-center w-full space-y-2">
                      <h3 className="font-black text-2xl uppercase tracking-tighter">Auto-entrepreneur</h3>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-tight leading-tight">
                        Concentrez-vous sur votre métier, nous gérons le reste !
                      </p>
                    </div>

                    <div className="space-y-3 w-full">
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                        <span className="text-green-600 font-black">✓</span>
                        <span className="text-[11px] font-bold text-muted-foreground leading-tight">Missions qualifiées sans prospection</span>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                        <span className="text-green-600 font-black">✓</span>
                        <span className="text-[11px] font-bold text-muted-foreground leading-tight">Facturation automatisée & sécurisée</span>
                      </div>
                    </div>

                    <div className="w-full pt-4">
                      <div className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-center font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                        S'inscrire en tant qu'Auto-entrepreneur
                      </div>
                    </div>
                  </div>
                </button>

                {/* Entreprise Card */}
                <button
                  onClick={() => handleSelectType('client')}
                  className="group relative overflow-hidden rounded-3xl border-4 border-border bg-background p-8 text-left transition-all hover:border-primary hover:shadow-2xl hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <div className="flex flex-col items-start space-y-6">
                    <div className="rounded-2xl bg-secondary/10 p-4 group-hover:bg-secondary/20 transition-colors self-center shadow-inner">
                      <Building2 className="h-10 w-10 text-primary" />
                    </div>
                    <div className="text-center w-full space-y-2">
                      <h3 className="font-black text-2xl uppercase tracking-tighter">Entreprise</h3>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-tight leading-tight">
                        Auto-mobs qualifiés en quelques clics
                      </p>
                    </div>

                    <div className="space-y-3 w-full">
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                        <span className="text-green-600 font-black">✓</span>
                        <span className="text-[11px] font-bold text-muted-foreground leading-tight">Trouvez des prestataires qualifiés</span>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                        <span className="text-green-600 font-black">✓</span>
                        <span className="text-[11px] font-bold text-muted-foreground leading-tight">Réponse garantie & ultra-rapide</span>
                      </div>
                    </div>

                    <div className="w-full pt-4">
                      <div className="w-full py-3 bg-foreground text-background rounded-xl text-center font-black uppercase tracking-widest text-xs shadow-lg shadow-foreground/10 group-hover:scale-105 transition-transform">
                        S'inscrire en Entreprise
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              <div className="text-center pt-8 border-t border-border/50">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Déjà inscrit ?</p>
                <Link to="/login" className="text-sm font-black text-primary hover:underline transition-all">SE CONNECTER</Link>
              </div>

              <div className="text-center">
                <Link to="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors group">
                  <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
                  RETOUR À L'ACCUEIL
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountType;
