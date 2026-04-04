import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  MapPin, 
  CreditCard,
  Shield,
  Calendar,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from '@/components/ui/toast';
import api from '@/lib/api';

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({});

  useDocumentTitle('Détails Utilisateur');

  useEffect(() => {
    fetchUserDetails();
  }, [id]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users/${id}`);
      console.log('📊 Détails utilisateur:', response.data);
      
      setUserData(response.data.user);
      setProfile(response.data.profile);
      
      // Initialiser le formulaire avec les données existantes
      const initialData = {
        email: response.data.user.email || '',
        verified: response.data.user.verified || false,
        id_verified: response.data.user.id_verified || false,
        ...response.data.profile
      };
      
      setFormData(initialData);
    } catch (err) {
      console.error('❌ Erreur chargement détails:', err);
      toast.error('Erreur lors du chargement des détails');
      navigate('/admin/users');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Mettre à jour le statut vérifié
      await api.put(`/users/${id}/verify`, { 
        verified: formData.verified 
      });
      
      // Mettre à jour le profil via la route admin
      await api.put(`/users/${id}/profile`, formData);
      
      toast.success('Utilisateur mis à jour avec succès');
      fetchUserDetails();
    } catch (err) {
      console.error('❌ Erreur sauvegarde:', err);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime()) && date.getFullYear() > 2000) {
        return date.toLocaleString('fr-FR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (e) {
      console.error('Erreur format date:', e);
    }
    return 'N/A';
  };

  const formatDuration = (seconds = 0) => {
    if (!seconds) return '0 min';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const parts = [];
    if (hours) parts.push(`${hours} h`);
    if (minutes) parts.push(`${minutes} min`);
    return parts.join(' ');
  };

  if (loading) {
    return (
      <DashboardLayout
        title="Détails Utilisateur"
        menuItems={adminNavigation}
        getRoleLabel={() => 'Administrateur'}
        getDisplayName={() => currentUser?.email?.split('@')[0] || 'Admin'}
      >
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!userData) {
    return null;
  }

  return (
    <DashboardLayout
      title="Détails Utilisateur"
      description="Modifier les informations de l'utilisateur"
      menuItems={adminNavigation}
      getRoleLabel={() => 'Administrateur'}
      getDisplayName={() => currentUser?.email?.split('@')[0] || 'Admin'}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate('/admin/users')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>

        {/* Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations générales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Input
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled
                  />
                </div>
              </div>
              
              <div>
                <Label>Rôle</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <Input value={userData.role} disabled />
                </div>
              </div>

              <div>
                <Label>Statut Email</Label>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={formData.verified || false}
                    onChange={(e) => handleInputChange('verified', e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">
                    {formData.verified ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        Email vérifié
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-orange-600">
                        <XCircle className="h-4 w-4" />
                        Email non vérifié
                      </span>
                    )}
                  </span>
                </div>
              </div>

              <div>
                <Label>Identité vérifiée</Label>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={formData.id_verified || false}
                    onChange={(e) => handleInputChange('id_verified', e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">
                    {formData.id_verified ? 'Identité vérifiée' : 'Identité non vérifiée'}
                  </span>
                </div>
              </div>

              <div>
                <Label>Date d'inscription</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input value={formatDate(userData.created_at)} disabled />
                </div>
              </div>

              <div>
                <Label>Dernière connexion</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input value={formatDate(userData.last_login)} disabled />
                </div>
              </div>

              <div>
                <Label>Durée totale de connexion</Label>
                <Input value={formatDuration(userData.total_session_duration)} disabled />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profil Auto-entrepreneur */}
        {userData.role === 'automob' && (
          <Card>
            <CardHeader>
              <CardTitle>Profil Auto-entrepreneur</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Prénom</Label>
                  <Input
                    value={formData.first_name || ''}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    placeholder="Prénom"
                  />
                </div>

                <div>
                  <Label>Nom</Label>
                  <Input
                    value={formData.last_name || ''}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    placeholder="Nom"
                  />
                </div>

                <div>
                  <Label>Genre</Label>
                  <select
                    value={formData.gender || ''}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3"
                  >
                    <option value="">Sélectionner</option>
                    <option value="male">Homme</option>
                    <option value="female">Femme</option>
                    <option value="other">Autre</option>
                  </select>
                </div>

                <div>
                  <Label>Téléphone</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <Input
                      value={formData.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+33 6 12 34 56 78"
                    />
                  </div>
                </div>

                <div>
                  <Label>SIRET</Label>
                  <Input
                    value={formData.siret || ''}
                    onChange={(e) => handleInputChange('siret', e.target.value)}
                    placeholder="SIRET"
                  />
                </div>

                <div>
                  <Label>Taux horaire (€)</Label>
                  <Input
                    type="number"
                    value={formData.hourly_rate || ''}
                    onChange={(e) => handleInputChange('hourly_rate', e.target.value)}
                    placeholder="25"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Adresse</Label>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <Input
                      value={formData.address || ''}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Adresse complète"
                    />
                  </div>
                </div>

                <div>
                  <Label>Ville</Label>
                  <Input
                    value={formData.city || ''}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Ville"
                  />
                </div>

                <div>
                  <Label>IBAN</Label>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <Input
                      value={formData.iban || ''}
                      onChange={(e) => handleInputChange('iban', e.target.value)}
                      placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                    />
                  </div>
                </div>

                <div>
                  <Label>BIC/SWIFT</Label>
                  <Input
                    value={formData.bic_swift || ''}
                    onChange={(e) => handleInputChange('bic_swift', e.target.value)}
                    placeholder="BNPAFRPPXXX"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>À propos</Label>
                  <textarea
                    value={formData.about_me || ''}
                    onChange={(e) => handleInputChange('about_me', e.target.value)}
                    placeholder="Description du profil"
                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profil Client/Entreprise */}
        {userData.role === 'client' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Profil Entreprise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nom de l'entreprise</Label>
                  <Input
                    value={formData.company_name || ''}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    placeholder="Nom de l'entreprise"
                  />
                </div>

                <div>
                  <Label>SIRET</Label>
                  <Input
                    value={formData.siret || ''}
                    onChange={(e) => handleInputChange('siret', e.target.value)}
                    placeholder="SIRET"
                  />
                </div>

                <div>
                  <Label>Prénom du responsable</Label>
                  <Input
                    value={formData.manager_first_name || ''}
                    onChange={(e) => handleInputChange('manager_first_name', e.target.value)}
                    placeholder="Prénom"
                  />
                </div>

                <div>
                  <Label>Nom du responsable</Label>
                  <Input
                    value={formData.manager_last_name || ''}
                    onChange={(e) => handleInputChange('manager_last_name', e.target.value)}
                    placeholder="Nom"
                  />
                </div>

                <div>
                  <Label>Poste du responsable</Label>
                  <Input
                    value={formData.manager_position || ''}
                    onChange={(e) => handleInputChange('manager_position', e.target.value)}
                    placeholder="Directeur, Manager, etc."
                  />
                </div>

                <div>
                  <Label>Téléphone</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <Input
                      value={formData.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+33 1 23 45 67 89"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Label>Adresse</Label>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <Input
                      value={formData.address || ''}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Adresse complète"
                    />
                  </div>
                </div>

                <div>
                  <Label>Ville</Label>
                  <Input
                    value={formData.city || ''}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Ville"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Description de l'entreprise</Label>
                  <textarea
                    value={formData.company_description || ''}
                    onChange={(e) => handleInputChange('company_description', e.target.value)}
                    placeholder="Description de l'entreprise"
                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bouton de sauvegarde en bas */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserDetail;
