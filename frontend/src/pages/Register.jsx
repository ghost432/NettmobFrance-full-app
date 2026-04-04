import { useState, useEffect } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { Logo } from '../components/Logo';
import { Mail, Lock, User, Phone, MapPin, Briefcase, Car, DollarSign, Building2, Eye, EyeOff, FileText } from 'lucide-react';

const Register = () => {
  useDocumentTitle('Inscription');
  const location = useLocation();
  const [role, setRole] = useState(location.state?.accountType || '');
  const [formData, setFormData] = useState({
    email: '', password: '', firstName: '', lastName: '', phone: '', city: '', address: '',
    skills: '', vehicleType: '', hourlyRate: '', companyName: ''
  });
  const [idDocument, setIdDocument] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!role) {
      navigate('/account-type');
    }
  }, [role, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const submitData = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key]) submitData.append(key, formData[key]);
    });
    submitData.append('role', role);
    if (idDocument) submitData.append('idDocument', idDocument);

    try {
      const response = await register(submitData);
      
      if (response.requiresVerification) {
        // Rediriger vers la page de vérification OTP
        navigate('/verify-email', {
          state: { email: formData.email, userId: response.userId }
        });
      } else {
        // Inscription réussie sans vérification (cas rare)
        alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
        navigate('/login');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 py-8 relative">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="max-w-2xl mx-auto">
      <div className="bg-card rounded-lg shadow-lg w-full border border-border my-4 max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
        <div className="flex flex-col items-center p-8 pb-4">
          <Logo className="h-16 w-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground">Inscription</h2>
        </div>
        
        {error && <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded mb-4">{error}</div>}
        
        {role && (
          <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto px-8 pb-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input placeholder="Prénom" value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring" required />
              </div>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input placeholder="Nom" value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring" required />
              </div>
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input type="email" placeholder="Email" value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring" required />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input placeholder="Téléphone" value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-10 pr-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring" required />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input type={showPassword ? 'text' : 'password'} placeholder="Mot de passe" value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-10 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring" required minLength={6} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input placeholder="Ville" value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full pl-10 pr-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring" required />
            </div>
            
            {role === 'automob' && (
              <>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input placeholder="Compétences" value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring" required />
                </div>
                <div className="relative">
                  <Car className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input placeholder="Type de véhicule" value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input type="number" placeholder="Taux horaire (€)" value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring" required />
                </div>
              </>
            )}
            
            {role === 'client' && (
              <>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input placeholder="Nom de l'entreprise" value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring" required />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input placeholder="Adresse complète" value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                <FileText className="inline h-4 w-4 mr-2 text-muted-foreground" />
                Document d'identité
              </label>
              <input type="file" accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => setIdDocument(e.target.files[0])}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer" />
            </div>
            
            <div className="flex gap-2">
              <Link to="/account-type" className="flex-1">
                <button type="button" className="w-full py-2 border border-border rounded-lg hover:bg-accent transition-colors text-foreground">Retour</button>
              </Link>
              <button type="submit" disabled={loading}
                className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {loading ? 'Inscription...' : 'S\'inscrire'}
              </button>
            </div>
          </form>
        )}
        
        <p className="text-center py-4 px-8 text-sm text-muted-foreground border-t border-border">
          Déjà inscrit ? <Link to="/login" className="text-primary hover:underline">Se connecter</Link>
        </p>
      </div>
      </div>
    </div>
  );
};

export default Register;
