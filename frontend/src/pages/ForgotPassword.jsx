import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../components/ThemeToggle';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '../components/ui/field';
import { Input } from '../components/ui/input';
import { ArrowLeft, Mail } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const ForgotPassword = () => {
  useDocumentTitle('Mot de passe oublié');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // TODO: Implémenter l'appel API pour la réinitialisation du mot de passe
      // await api.post('/auth/forgot-password', { email });

      // Simulation
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess(true);
    } catch (error) {
      setError(error.response?.data?.error || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10 relative">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md py-8">
        <Card className="rounded-[2.5rem] shadow-2xl w-full border-2 border-border overflow-hidden flex flex-col bg-card/50 backdrop-blur-xl">
          <CardContent className="p-0">
            {!success ? (
              <form onSubmit={handleSubmit} className="p-8 space-y-8">
                <FieldGroup>
                  <div className="flex flex-col items-center gap-2 text-center pb-8 border-b border-border/50">
                    <Logo className="h-16 w-auto mb-4" />
                    <h1 className="text-3xl font-black uppercase tracking-tighter">Récupération</h1>
                    <p className="text-muted-foreground text-sm font-medium">
                      Entrez votre email pour recevoir un lien
                    </p>
                  </div>

                  {error && (
                    <div className="bg-destructive/10 border-2 border-destructive/20 text-destructive px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-tight">
                      {error}
                    </div>
                  )}

                  <Field className="space-y-2">
                    <FieldLabel htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email</FieldLabel>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="nom@exemple.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-14 pl-12 rounded-2xl border-2 font-bold"
                        required
                      />
                    </div>
                  </Field>

                  <Field className="pt-4">
                    <Button type="submit" disabled={loading} className="w-full h-14 rounded-2xl text-lg font-black uppercase tracking-tighter shadow-lg shadow-primary/20">
                      {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
                    </Button>
                  </Field>

                  <div className="text-center pt-4 border-t border-border/50">
                    <Link to="/login" className="text-xs font-black text-primary hover:underline uppercase tracking-widest inline-flex items-center gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      Retour à la connexion
                    </Link>
                  </div>
                </FieldGroup>
              </form>
            ) : (
              <div className="p-8 space-y-8">
                <div className="flex flex-col items-center gap-6 text-center">
                  <div className="rounded-full bg-primary/10 p-6 shadow-inner ring-4 ring-primary/5">
                    <Mail className="h-12 w-12 text-primary animate-bounce" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black uppercase tracking-tighter">Email envoyé !</h2>
                    <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                      Un lien de réinitialisation vient d'être envoyé à <span className="text-foreground font-black underline decoration-primary underline-offset-4">{email}</span>
                    </p>
                  </div>
                  <Link to="/login" className="w-full">
                    <Button variant="outline" className="w-full h-14 rounded-2xl border-2 font-black uppercase tracking-widest">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      RETOUR À LA CONNEXION
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
