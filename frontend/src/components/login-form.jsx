import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Logo } from '@/components/Logo';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import backgroundImage from '@/images/login-bg.jpg';
import { toast } from '@/components/ui/toast';

export function LoginForm({ className, ...props }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Éviter les soumissions multiples
    if (loading) return;

    setLoading(true);

    // Message informatif pour les connexions lentes
    const slowLoadingTimeout = setTimeout(() => {
      if (loading) {
        toast.info('Chargement du profil en cours...', {
          duration: 10000
        });
      }
    }, 3000);

    try {
      const response = await login(formData);
      clearTimeout(slowLoadingTimeout);

      // Vérifier si un OTP de connexion est requis
      if (response.requiresOTP && response.userId && response.email) {
        toast.success('Code de connexion envoyé par email');
        setLoading(false);
        navigate('/verify-login', { state: { userId: response.userId, email: response.email } });
        return;
      }

      // Vérifier si l'email doit être vérifié
      if (response.requiresVerification && response.userId && response.email) {
        toast.error('Veuillez vérifier votre email avant de vous connecter');
        setLoading(false);
        navigate('/verify-email', {
          state: {
            userId: response.userId,
            email: response.email,
            isLogin: true  // Indiquer que c'est un login OTP
          }
        });
        return;
      }

      // Connexion réussie (directe ou après OTP)
      if (response.token && response.user) {
        toast.success('Connexion réussie !');
        const role = response.user?.role || 'client';
        setLoading(false);

        // Redirection immédiate vers le bon dashboard spécifique
        navigate(`/${role}/dashboard`);
        return;
      }

      // Cas inattendu
      setLoading(false);
    } catch (error) {
      clearTimeout(slowLoadingTimeout);
      // Afficher l'erreur sans recharger la page
      console.error('Erreur de connexion:', error);
      const errorMessage = error.response?.data?.error || 'Email ou mot de passe incorrect';
      toast.error(errorMessage);
      setLoading(false);

      // Ne pas réinitialiser le formulaire pour permettre à l'utilisateur de corriger
      // Juste vider le mot de passe pour la sécurité
      setFormData(prev => ({ ...prev, password: '' }));
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center pb-8 border-b border-border/50 mb-8">
                <Logo className="h-16 w-auto mb-4" />
                <h1 className="text-3xl font-black uppercase tracking-tighter">Bienvenue</h1>
                <p className="text-muted-foreground text-sm font-medium">
                  Connectez-vous à votre compte <span className="text-primary font-bold">NettmobFrance</span>
                </p>
              </div>
              <Field className="space-y-2">
                <FieldLabel htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email</FieldLabel>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="nom@exemple.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-14 pl-12 rounded-2xl border-2 font-bold focus:border-primary transition-all"
                    required
                  />
                </div>
              </Field>
              <Field className="space-y-2">
                <div className="flex items-center px-1">
                  <FieldLabel htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mot de passe</FieldLabel>
                  <Link to="/forgot-password" alt="Mot de passe oublié?" className="ml-auto text-xs font-bold text-primary hover:underline">Mot de passe oublié?</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="h-14 pl-12 pr-12 rounded-2xl border-2 font-bold focus:border-primary transition-all"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </Field>
              <Field className="pt-4">
                <Button type="submit" disabled={loading} className="w-full h-14 rounded-2xl text-lg font-black uppercase tracking-tighter shadow-lg shadow-primary/20">
                  {loading ? 'Connexion en cours...' : 'Se connecter'}
                </Button>
              </Field>
              <FieldDescription className="text-center font-bold text-sm">
                Pas de compte ? <Link to="/account-type" className="text-primary hover:underline">S'inscrire gratuitement</Link>
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className="bg-muted relative hidden md:block p-4">
            <img src={backgroundImage} alt="Background" className="h-full w-full object-cover rounded-[2rem] shadow-xl dark:brightness-[0.7]" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
