import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { ArrowLeft, Mail } from 'lucide-react';
import api from '../lib/api';
import { toast } from '../components/ui/toast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { registerPendingFCMToken } from '../services/fcmService';

const VerifyEmail = () => {
  useDocumentTitle('Vérification Email');
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, email, isLogin } = location.state || {};
  const { updateUser } = useAuth();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(0);
  const [codeExpiry, setCodeExpiry] = useState(600); // 10 minutes en secondes

  useEffect(() => {
    if (!userId || !email) {
      navigate('/login');
    } else {
      // Démarrer le compte à rebours de validité du code
      setCodeExpiry(600); // 10 minutes
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
      const response = await api.post('/otp/verify-email-otp', {
        userId,
        email,
        otp: otpCode
      });

      // Stocker le token et les données utilisateur
      if (response.data.token && response.data.user) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        toast.success('Email vérifié avec succès ! Redirection...');

        // Enregistrer le token FCM en attente (si l'utilisateur a activé les notifications)
        try {
          const registered = await registerPendingFCMToken();
          if (registered) {
            console.log('✅ Token FCM enregistré avec succès');
          }
        } catch (fcmError) {
          console.error('❌ Erreur enregistrement FCM:', fcmError);
          // Ne pas bloquer la navigation si l'enregistrement échoue
        }

        // Rediriger selon le contexte (login vs inscription)
        const role = response.data.user.role;
        setTimeout(() => {
          if (isLogin) {
            // Cas login OTP : rediriger vers le dashboard
            window.location.href = `/${role}/dashboard`;
          } else {
            // Cas inscription : rediriger vers la vérification d'identité
            if (role === 'automob') {
              window.location.href = '/automob/verify-identity';
            } else if (role === 'client') {
              window.location.href = '/client/verify-identity';
            } else if (role === 'admin') {
              window.location.href = '/admin/dashboard';
            } else {
              window.location.href = '/dashboard';
            }
          }
        }, 1000);
      } else {
        // Fallback si pas de token (ancien comportement)
        toast.success('Email vérifié avec succès !');
        navigate('/login');
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
        type: 'verification'
      });

      toast.success('Nouveau code envoyé par email');
      setTimer(60);
      setCodeExpiry(600); // Réinitialiser le compte à rebours
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
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md py-8">
        <Card className="rounded-[2.5rem] shadow-2xl w-full border-2 border-border overflow-hidden flex flex-col bg-card/50 backdrop-blur-xl">
          <CardContent className="p-8 flex flex-col h-full overflow-hidden space-y-8">
            <div className="flex flex-col items-center gap-2 text-center pb-8 border-b border-border/50">
              <Logo className="h-16 w-auto mb-6" />
              <div className="rounded-2xl bg-primary/10 p-6 shadow-inner ring-4 ring-primary/5 mb-4 animate-pulse">
                <Mail className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-3xl font-black uppercase tracking-tighter">Vérification</h1>
              <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                Code envoyé à <span className="text-foreground font-black underline decoration-primary underline-offset-4">{email}</span>
              </p>

              <div className="mt-6 w-full">
                {codeExpiry > 0 ? (
                  <div className="px-4 py-2 bg-amber-500/10 border-2 border-amber-500/20 rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                      ⏱️ Expire dans : {Math.floor(codeExpiry / 60)}:{String(codeExpiry % 60).padStart(2, '0')}
                    </p>
                  </div>
                ) : (
                  <div className="px-4 py-2 bg-destructive/10 border-2 border-destructive/20 rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-destructive">
                      ❌ Code expiré
                    </p>
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="flex justify-center gap-3">
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
                    className="w-12 h-16 text-center text-3xl font-black bg-background border-4 border-muted rounded-2xl focus:outline-none focus:border-primary transition-all shadow-inner"
                    required
                  />
                ))}
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading || otp.some(d => !d)}
                  className="w-full h-14 rounded-2xl text-lg font-black uppercase tracking-tighter shadow-lg shadow-primary/20"
                >
                  {loading ? 'Vérification...' : 'Confirmer le code'}
                </Button>
              </div>

              <div className="text-center pt-4 border-t border-border/50 space-y-4">
                {timer > 0 ? (
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Renvoyer dans {timer}s
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="text-sm font-black text-primary hover:underline uppercase tracking-widest disabled:opacity-50 transition-all"
                  >
                    {resending ? 'Envoi...' : 'Renvoyer un code'}
                  </button>
                )}

                <div className="pt-2">
                  <Link to="/login" className="text-[10px] font-black text-muted-foreground hover:text-foreground uppercase tracking-widest inline-flex items-center gap-2 transition-colors group">
                    <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
                    RETOUR À LA CONNEXION
                  </Link>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;
