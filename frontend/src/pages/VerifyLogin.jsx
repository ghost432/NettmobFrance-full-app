import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { ArrowLeft, Shield } from 'lucide-react';
import api from '../lib/api';
import { toast } from '../components/ui/toast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const VerifyLogin = () => {
  useDocumentTitle('Code de connexion');
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuthData } = useAuth();
  const { userId, email } = location.state || {};

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(0);
  const [codeExpiry, setCodeExpiry] = useState(600); // 10 minutes

  useEffect(() => {
    if (!userId || !email) {
      navigate('/login');
    } else {
      setCodeExpiry(600);
    }
  }, [userId, email, navigate]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(t => t - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  useEffect(() => {
    if (codeExpiry > 0) {
      const interval = setInterval(() => {
        setCodeExpiry(t => {
          if (t <= 1) {
            toast.error('Le code a expiré. Veuillez en demander un nouveau.');
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [codeExpiry]);

  const handleChange = (index, value) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus sur le champ suivant
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }

    // Soumission automatique si tous les champs sont remplis
    if (value && index === 5 && newOtp.every(digit => digit !== '')) {
      const otpCode = newOtp.join('');
      verifyOtp(otpCode);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
    setOtp(newOtp);

    // Soumission automatique si 6 chiffres sont collés
    if (pastedData.length === 6) {
      verifyOtp(pastedData);
    }
  };

  const verifyOtp = async (otpCode) => {
    if (loading) return; // Éviter les soumissions multiples
    if (otpCode.length !== 6) {
      toast.error('Veuillez saisir les 6 chiffres');
      return;
    }

    setLoading(true);

    try {
      // Vérifier l'OTP
      await api.post('/otp/verify-login-otp', {
        userId,
        email,
        otp: otpCode
      });

      // Finaliser la connexion
      const response = await api.post('/auth/login-verify', {
        userId,
        email
      });

      // Définir directement le token et l'utilisateur dans le contexte
      if (response.data.token && response.data.user) {
        setAuthData(response.data.token, response.data.user);
        toast.success('Connexion réussie ! Redirection...');
        
        // Rediriger vers le dashboard selon le rôle
        // Utiliser window.location.href pour garantir une navigation propre
        const role = response.data.user.role;
        setTimeout(() => {
          if (role === 'automob') {
            window.location.href = '/automob/dashboard';
          } else if (role === 'client') {
            window.location.href = '/client/dashboard';
          } else if (role === 'admin') {
            window.location.href = '/admin/dashboard';
          } else {
            window.location.href = '/dashboard';
          }
        }, 500);
      } else {
        throw new Error('Données de connexion invalides');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Code invalide');
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    verifyOtp(otpCode);
  };

  const handleResend = async () => {
    setResending(true);

    try {
      await api.post('/otp/resend-otp', {
        userId,
        email,
        type: 'login'
      });

      toast.success('Nouveau code envoyé par email');
      setTimer(60);
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors du renvoi du code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <Card>
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col items-center gap-2 text-center mb-8">
              <Logo className="h-16 w-auto mb-2" />
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">Code de connexion</h1>
              <p className="text-muted-foreground text-balance">
                Nous avons envoyé un code à 6 chiffres à <strong>{email}</strong>
              </p>
              {codeExpiry > 0 && (
                <div className="mt-4 px-4 py-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    ⏱️ Code valide pendant : <strong>{Math.floor(codeExpiry / 60)}:{String(codeExpiry % 60).padStart(2, '0')}</strong>
                  </p>
                </div>
              )}
              {codeExpiry === 0 && (
                <div className="mt-4 px-4 py-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    ❌ Code expiré. Veuillez en demander un nouveau.
                  </p>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-center gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className="w-12 h-14 text-center text-2xl font-bold bg-background border-2 border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"
                    required
                  />
                ))}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || otp.some(d => !d)}
              >
                {loading ? 'Vérification...' : 'Se connecter'}
              </Button>

              <div className="text-center space-y-2">
                {timer > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Renvoyer le code dans {timer}s
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="text-sm text-primary hover:underline disabled:opacity-50"
                  >
                    {resending ? 'Envoi en cours...' : 'Renvoyer le code'}
                  </button>
                )}
              </div>

              <div className="text-center">
                <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" />
                  Retour à la connexion
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyLogin;
