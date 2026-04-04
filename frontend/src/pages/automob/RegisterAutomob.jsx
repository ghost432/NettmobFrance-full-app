import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../../components/ThemeToggle';
import { Logo } from '../../components/Logo';
import { Mail, User, Briefcase, ArrowLeft, ArrowRight, CheckCircle2, ExternalLink, Lock, Eye, EyeOff, MapPin } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import api from '../../lib/api';
import { toast } from '../../components/ui/toast';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { requestNotificationPermission } from '../../config/firebase';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Card, CardContent } from '../../components/ui/card';
import { cn } from '../../lib/utils';

// Fonction geocoding avec fetch
const geocodeAddress = async (query) => {
  const token = import.meta.env.VITE_MAPBOX_TOKEN;
  if (!token) {
    console.error('❌ [RegisterAutomob] Mapbox token non configuré');
    console.error('💡 Vérifiez que VITE_MAPBOX_TOKEN est défini dans .env et redémarrez le serveur');
    return [];
  }

  console.log('🔍 [RegisterAutomob] Recherche adresse:', query);

  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?country=FR&limit=5&access_token=${token}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error('❌ [RegisterAutomob] Erreur HTTP:', response.status);
      return [];
    }

    const data = await response.json();
    console.log('✅ [RegisterAutomob] Suggestions:', data.features?.length || 0);
    return data.features || [];
  } catch (err) {
    console.error('❌ [RegisterAutomob] Erreur geocoding:', err);
    return [];
  }
};

const RegisterAutomob = () => {
  useDocumentTitle('Inscription Auto-entrepreneur');
  const [searchParams, setSearchParams] = useSearchParams();
  const stepParam = searchParams.get('etape') || 'informations';

  const stepMap = {
    'informations': 1,
    'experience': 2,
    'email': 3,
    'mot-de-passe': 4,
    'validation': 5
  };

  const step = useMemo(() => stepMap[stepParam] || 1, [stepParam]);
  const [formData, setFormData] = useState({
    siret: '', firstName: '', lastName: '', phone: '+33', address: '',
    experience: '', secteurId: '', competences: [],
    email: '', password: '', confirmPassword: '',
    webPushEnabled: false, emailNotifications: false,
    privacyAccepted: false, mandateAccepted: false
  });
  const [secteurs, setSecteurs] = useState([]);
  const [competences, setCompetences] = useState([]);
  const [filteredCompetences, setFilteredCompetences] = useState([]);
  const [emailValid, setEmailValid] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ valid: false, message: '' });
  const [loading, setLoading] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [addressValid, setAddressValid] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const experiences = ['Je débute', 'J\'ai déjà réalisé quelques missions', 'J\'ai déjà plusieurs clients réguliers'];

  const stepNames = ['informations', 'experience', 'email', 'mot-de-passe', 'validation'];

  useEffect(() => {
    fetchSecteurs();
    fetchCompetences();
  }, []);

  useEffect(() => {
    if (formData.secteurId) {
      const filtered = competences.filter(c => c.secteur_id === parseInt(formData.secteurId));
      setFilteredCompetences(filtered);
      setFormData(prev => ({ ...prev, competences: [] }));
    } else {
      setFilteredCompetences([]);
    }
  }, [formData.secteurId, competences]);


  const fetchSecteurs = async () => {
    try {
      console.log('🔍 Chargement des secteurs...');
      console.log('📍 URL API:', import.meta.env.VITE_API_URL || 'http://localhost:5000/api');
      const response = await api.get('/secteurs');
      console.log('✅ Secteurs reçus:', response.data);
      console.log('📊 Nombre de secteurs:', response.data.length);
      setSecteurs(response.data);
    } catch (err) {
      console.error('❌ Erreur chargement secteurs:', err);
      console.error('📍 URL tentée:', err.config?.url);
      console.error('🔴 Status:', err.response?.status);
      console.error('🔴 Détails:', err.response?.data || err.message);
      toast.error('Impossible de charger les secteurs d\'activité. Vérifiez que le serveur backend est démarré.');
    }
  };

  const fetchCompetences = async () => {
    try {
      const response = await api.get('/competences');
      setCompetences(response.data);
    } catch (err) {
      console.error('Erreur chargement compétences:', err);
    }
  };

  const checkEmail = (email) => {
    // Validation avec regex robuste
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = email && emailRegex.test(email);
    setEmailValid(isValid);
    return isValid;
  };

  const validateAddressFrance = (address) => {
    if (!address || address.length < 10) return false;
    // Vérifier qu'il y a un code postal français (5 chiffres)
    const hasPostalCode = /\d{5}/.test(address);
    // Vérifier qu'il y a au moins un chiffre (numéro de rue)
    const hasNumber = /\d+/.test(address);
    return hasPostalCode && hasNumber;
  };

  const validatePassword = (password) => {
    const hasNumber = /\d/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;

    const criteria = {
      length: { valid: isLongEnough, text: 'Au moins 8 caractères' },
      number: { valid: hasNumber, text: 'Au moins un chiffre' },
      uppercase: { valid: hasUpperCase, text: 'Au moins une lettre majuscule' },
      special: { valid: hasSpecialChar, text: 'Au moins un caractère spécial (!@#$%^&*...)' }
    };

    const allValid = hasNumber && hasUpperCase && hasSpecialChar && isLongEnough;

    return {
      valid: allValid,
      message: allValid ? 'Mot de passe fort' : 'Le mot de passe ne respecte pas tous les critères',
      criteria
    };
  };

  useEffect(() => {
    if (formData.password) {
      setPasswordStrength(validatePassword(formData.password));
    }
  }, [formData.password]);

  const handleCompetenceToggle = (compId) => {
    setFormData(prev => ({
      ...prev,
      competences: prev.competences.includes(compId)
        ? prev.competences.filter(id => id !== compId)
        : [...prev.competences, compId]
    }));
  };

  const searchAddress = async (query) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    const features = await geocodeAddress(`${query}, France`);
    setAddressSuggestions(features.map(f => ({
      place_name: f.place_name,
      coordinates: f.geometry.coordinates
    })));
  };

  const requestFirebaseNotificationPermission = async () => {
    try {
      // Demander la permission et obtenir le token FCM
      const fcmToken = await requestNotificationPermission();
      if (fcmToken) {
        setFormData(prev => ({ ...prev, webPushEnabled: true }));
        // Sauvegarder le token pour l'enregistrer après l'inscription
        localStorage.setItem('pendingFCMToken', fcmToken);
        toast.success('Notifications push activées !');
      }
    } catch (error) {
      console.error('Erreur permission Firebase:', error);
      setFormData(prev => ({ ...prev, webPushEnabled: false }));
      if (error.message.includes('refusée')) {
        toast.error('Permission de notification refusée');
      }
    }
  };

  const canGoNext = () => {
    if (step === 1) {
      return formData.siret && formData.firstName && formData.lastName && formData.phone && formData.address;
    }
    if (step === 2) {
      return formData.experience && formData.secteurId && formData.competences.length > 0;
    }
    if (step === 3) {
      return formData.email && emailValid;
    }
    if (step === 4) {
      return formData.password && formData.confirmPassword &&
        passwordStrength.valid && formData.password === formData.confirmPassword;
    }
    return true;
  };

  const goToStep = (stepNumber) => {
    setSearchParams({ etape: stepNames[stepNumber - 1] });
    // Défilement automatique vers le haut de la page
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.privacyAccepted || !formData.mandateAccepted) {
      toast.error('Vous devez accepter les conditions');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);

    try {
      // Convertir en FormData pour l'envoi multipart/form-data
      const submitData = new FormData();
      submitData.append('email', formData.email);
      submitData.append('password', formData.password);
      submitData.append('role', 'automob');
      submitData.append('firstName', formData.firstName);
      submitData.append('lastName', formData.lastName);
      submitData.append('phone', formData.phone);
      submitData.append('address', formData.address);
      submitData.append('siret', formData.siret);
      submitData.append('experience', formData.experience);
      submitData.append('secteurId', formData.secteurId);
      submitData.append('competences', JSON.stringify(formData.competences));
      submitData.append('privacyAccepted', formData.privacyAccepted ? '1' : '0');
      submitData.append('mandateAccepted', formData.mandateAccepted ? '1' : '0');
      submitData.append('webPushEnabled', formData.webPushEnabled ? '1' : '0');
      submitData.append('emailNotifications', formData.emailNotifications ? '1' : '0');

      const response = await register(submitData);

      if (response.requiresVerification && response.userId && response.email) {
        // Sauvegarder l'état des notifications push pour l'utiliser après vérification
        if (formData.webPushEnabled) {
          localStorage.setItem('pendingPushSubscription', 'true');
        }
        toast.success('Inscription réussie ! Un code de vérification a été envoyé à votre email.');
        navigate('/verify-email', { state: { userId: response.userId, email: response.email } });
      } else {
        toast.success('Inscription réussie !');
        navigate('/login');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10 relative">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-2xl py-8">
        <Card className="rounded-[2.5rem] shadow-2xl w-full border-2 border-border overflow-hidden flex flex-col bg-card/50 backdrop-blur-xl">
          <CardContent className="p-0 flex flex-col h-full overflow-hidden">
            <div className="flex flex-col items-center p-8 pb-4 border-b border-border/50 bg-muted/30">
              <Logo className="h-16 w-auto mb-6" />
              <h2 className="text-3xl font-black text-foreground uppercase tracking-tighter">Inscription <span className="text-primary italic">Automob</span></h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2">Étape {step} sur 5</p>

              <div className="w-full max-w-md mt-6">
                <div className="flex justify-between mb-3 text-[10px] font-black uppercase tracking-widest">
                  <span className={step >= 1 ? 'text-primary' : 'text-muted-foreground/50'}>Infos</span>
                  <span className={step >= 2 ? 'text-primary' : 'text-muted-foreground/50'}>Expérience</span>
                  <span className={step >= 3 ? 'text-primary' : 'text-muted-foreground/50'}>Email</span>
                  <span className={step >= 4 ? 'text-primary' : 'text-muted-foreground/50'}>Pass</span>
                  <span className={step >= 5 ? 'text-primary' : 'text-muted-foreground/50'}>Valid</span>
                </div>
                <div className="w-full bg-muted/50 rounded-full h-3 p-1 border border-border/50">
                  <div className="bg-primary h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(var(--primary),0.3)]" style={{ width: `${(step / 5) * 100}%` }}></div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 py-8 space-y-8 scrollbar-hide">
              {/* Étape 1: Informations */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Numéro de SIRET</Label>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        placeholder="14 chiffres"
                        value={formData.siret}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          setFormData({ ...formData, siret: value });
                        }}
                        className="h-14 pl-12 pr-12 rounded-2xl border-2 font-bold"
                        required
                        maxLength={14}
                      />
                      {formData.siret && formData.siret.length === 14 && (
                        <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-green-600" />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Prénom</Label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          placeholder="Jean"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="h-14 pl-12 rounded-2xl border-2 font-bold"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nom</Label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          placeholder="Dupont"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="h-14 pl-12 rounded-2xl border-2 font-bold"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Téléphone</Label>
                    <PhoneInput
                      international
                      defaultCountry="FR"
                      value={formData.phone}
                      onChange={(phone) => setFormData({ ...formData, phone: phone || '+33' })}
                      className="phone-input w-full"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Adresse de résidence</Label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                      <Input
                        placeholder="Ex: 12 rue de la Paix, Paris"
                        value={formData.address}
                        onChange={(e) => {
                          const newAddress = e.target.value;
                          setFormData({ ...formData, address: newAddress });
                          setAddressValid(validateAddressFrance(newAddress));
                          searchAddress(newAddress);
                        }}
                        className="h-14 pl-12 rounded-2xl border-2 font-bold"
                        required
                      />
                      {addressSuggestions.length > 0 && (
                        <div className="absolute z-20 w-full mt-2 bg-card border-2 border-border rounded-2xl shadow-2xl max-h-60 overflow-y-auto overflow-x-hidden">
                          {addressSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => {
                                const selectedAddress = suggestion.place_name;
                                setFormData({ ...formData, address: selectedAddress });
                                setAddressValid(validateAddressFrance(selectedAddress));
                                setAddressSuggestions([]);
                              }}
                              className="w-full text-left px-5 py-3 hover:bg-muted font-bold text-sm transition-colors border-b border-border/50 last:border-0"
                            >
                              {suggestion.place_name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {formData.address && !addressValid && (
                      <p className="text-[10px] font-bold text-destructive uppercase tracking-widest mt-1 ml-1">
                        Numéro de rue + CP 5 chiffres requis
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Étape 2: Expérience */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Niveau d'expérience</Label>
                    <select
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                      className="w-full h-14 px-4 bg-background border-2 border-border rounded-2xl text-foreground font-bold focus:outline-none focus:border-primary transition-all appearance-none cursor-pointer"
                      required
                    >
                      <option value="">Choisissez une option...</option>
                      {experiences.map((exp) => (
                        <option key={exp} value={exp}>{exp}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Secteur d'activité</Label>
                    <select
                      value={formData.secteurId}
                      onChange={(e) => setFormData({ ...formData, secteurId: e.target.value })}
                      className="w-full h-14 px-4 bg-background border-2 border-border rounded-2xl text-foreground font-bold focus:outline-none focus:border-primary transition-all appearance-none cursor-pointer disabled:opacity-50"
                      required
                      disabled={secteurs.length === 0}
                    >
                      <option value="">
                        {secteurs.length === 0 ? 'Chargement en cours...' : 'Sélectionnez un secteur...'}
                      </option>
                      {secteurs.map((secteur) => (
                        <option key={secteur.id} value={secteur.id}>{secteur.nom}</option>
                      ))}
                    </select>
                  </div>

                  {filteredCompetences.length > 0 && (
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Vos compétences professionnelles</Label>
                      <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto scrollbar-hide pr-2">
                        {filteredCompetences.map((comp) => (
                          <div
                            key={comp.id}
                            onClick={() => handleCompetenceToggle(comp.id)}
                            className={cn(
                              "flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer font-bold",
                              formData.competences.includes(comp.id)
                                ? "border-primary bg-primary/5 text-primary shadow-sm"
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            <div className={cn(
                              "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors",
                              formData.competences.includes(comp.id) ? "bg-primary border-primary" : "border-muted-foreground"
                            )}>
                              {formData.competences.includes(comp.id) && <CheckCircle2 className="h-3 w-3 text-white" />}
                            </div>
                            <span className="text-sm">{comp.nom}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Étape 3: Email */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Adresse email professionnelle</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                      <Input
                        type="email"
                        placeholder="nom@exemple.com"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          checkEmail(e.target.value);
                        }}
                        className="h-14 pl-12 pr-12 rounded-2xl border-2 font-bold"
                        required
                      />
                      {!emailChecking && formData.email && (
                        emailValid ?
                          <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-green-600" /> :
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-destructive font-black">✕</span>
                      )}
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest ml-1">
                      {formData.email && emailValid ? <span className="text-green-600">✓ Email valide</span> : <span className="text-muted-foreground">Utilisée pour vos futures missions</span>}
                    </p>
                  </div>
                </div>
              )}

              {/* Étape 4: Mot de passe */}
              {step === 4 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Définir un mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="8 caractères min."
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="h-14 pl-12 pr-12 rounded-2xl border-2 font-bold"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {formData.password && passwordStrength.criteria && (
                    <div className="mt-3 p-4 bg-muted/50 rounded-2xl border-2 border-border/50">
                      <p className="text-[10px] font-black uppercase tracking-widest mb-3 text-muted-foreground">Sécurité requise :</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.entries(passwordStrength.criteria).map(([key, criterion]) => (
                          <div key={key} className="flex items-center gap-2">
                            {criterion.valid ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                            ) : (
                              <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                            )}
                            <span className={cn("text-[10px] font-bold uppercase tracking-tight", criterion.valid ? 'text-green-600' : 'text-muted-foreground')}>
                              {criterion.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Confirmer le mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Répétez le mot de passe"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="h-14 pl-12 pr-12 rounded-2xl border-2 font-bold"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {formData.confirmPassword && (
                      <p className={cn("text-[10px] font-black uppercase tracking-widest mt-1 ml-1", formData.password === formData.confirmPassword ? 'text-green-600' : 'text-destructive')}>
                        {formData.password === formData.confirmPassword ? '✓ Correspondance OK' : '✕ Les mots de passe diffèrent'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Étape 5: Validation */}
              {step === 5 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div
                      onClick={() => setFormData(prev => ({ ...prev, emailNotifications: !prev.emailNotifications, webPushEnabled: false }))}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4",
                        formData.emailNotifications ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                      )}
                    >
                      <div className={cn(
                        "w-6 h-6 rounded-md border-2 flex flex-shrink-0 items-center justify-center transition-colors mt-1",
                        formData.emailNotifications ? "bg-primary border-primary" : "border-muted-foreground"
                      )}>
                        {formData.emailNotifications && <CheckCircle2 className="h-4 w-4 text-white" />}
                      </div>
                      <div>
                        <p className="font-black text-sm uppercase tracking-tight">Notifications intelligentes</p>
                        <p className="text-xs font-medium text-muted-foreground leading-snug mt-1">
                          Recevez des alertes immédiates pour les nouvelles missions qui match avec votre profil.
                          {formData.webPushEnabled && <span className="block text-green-600 font-bold mt-1 uppercase text-[9px]">✓ Push Firebase activé</span>}
                        </p>
                      </div>
                    </div>

                    <div
                      onClick={() => setFormData(prev => ({ ...prev, privacyAccepted: !prev.privacyAccepted }))}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4",
                        formData.privacyAccepted ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                      )}
                    >
                      <div className={cn(
                        "w-6 h-6 rounded-md border-2 flex flex-shrink-0 items-center justify-center transition-colors mt-1",
                        formData.privacyAccepted ? "bg-primary border-primary" : "border-muted-foreground"
                      )}>
                        {formData.privacyAccepted && <CheckCircle2 className="h-4 w-4 text-white" />}
                      </div>
                      <div>
                        <p className="font-black text-sm uppercase tracking-tight">Politique de confidentialité</p>
                        <p className="text-xs font-medium text-muted-foreground leading-snug mt-1">
                          J'accepte le traitement de mes données conformément à la
                          <a href="/cgu-cgv" target="_blank" className="text-primary hover:underline ml-1 font-bold">politique de confidentialité <ExternalLink className="h-3 w-3 inline" /></a>
                        </p>
                      </div>
                    </div>

                    <div
                      onClick={() => setFormData(prev => ({ ...prev, mandateAccepted: !prev.mandateAccepted }))}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4",
                        formData.mandateAccepted ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                      )}
                    >
                      <div className={cn(
                        "w-6 h-6 rounded-md border-2 flex flex-shrink-0 items-center justify-center transition-colors mt-1",
                        formData.mandateAccepted ? "bg-primary border-primary" : "border-muted-foreground"
                      )}>
                        {formData.mandateAccepted && <CheckCircle2 className="h-4 w-4 text-white" />}
                      </div>
                      <div>
                        <p className="font-black text-sm uppercase tracking-tight">Mandat de facturation</p>
                        <p className="text-xs font-medium text-muted-foreground leading-snug mt-1">
                          J'accepte que NettmobFrance gère mes factures via le
                          <a href="/mandat-facturation" target="_blank" className="text-primary hover:underline ml-1 font-bold">mandat de facturation <ExternalLink className="h-3 w-3 inline" /></a>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex gap-4 pt-4 pb-2">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => goToStep(step - 1)}
                    className="flex-1 h-14 rounded-2xl border-2 font-black uppercase tracking-widest transition-all"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Précédent
                  </Button>
                )}

                {step < 5 ? (
                  <Button
                    type="button"
                    onClick={() => goToStep(step + 1)}
                    disabled={!canGoNext()}
                    className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all"
                  >
                    Suivant
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={loading || !formData.privacyAccepted || !formData.mandateAccepted}
                    className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all"
                  >
                    {loading ? 'Création...' : 'S\'inscrire'}
                  </Button>
                )}
              </div>
            </form>

            <div className="text-center py-6 px-8 bg-muted/20 border-t border-border">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Déjà membre ?</p>
              <Link to="/login" className="text-sm font-black text-primary hover:underline transition-all">
                SE CONNECTER À MON COMPTE
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterAutomob;
