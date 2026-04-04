import { useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, User } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import api from '@/lib/api';

const UserCreate = () => {
  useDocumentTitle('Ajouter un utilisateur');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'automob',
    // Commun
    first_name: '',
    last_name: '',
    phone: '',
    // Automob spécifique
    gender: '',
    siret: '',
    address: '',
    city: '',
    hourly_rate: '',
    about_me: '',
    iban: '',
    bic_swift: '',
    // Client spécifique
    company_name: '',
    manager_first_name: '',
    manager_last_name: '',
    manager_position: '',
    company_description: '',
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Email et mot de passe sont requis');
      return;
    }

    if (formData.role === 'automob' && (!formData.first_name || !formData.last_name)) {
      toast.error('Prénom et nom sont requis pour un auto-entrepreneur');
      return;
    }

    if (formData.role === 'client' && !formData.company_name) {
      toast.error('Nom de l\'entreprise est requis pour un client');
      return;
    }

    try {
      setLoading(true);
      
      // Préparer les données utilisateur selon le rôle
      const userData = {};
      
      if (formData.role === 'automob') {
        userData.first_name = formData.first_name;
        userData.last_name = formData.last_name;
        userData.phone = formData.phone;
        userData.gender = formData.gender;
        userData.siret = formData.siret;
        userData.address = formData.address;
        userData.city = formData.city;
        userData.hourly_rate = formData.hourly_rate;
        userData.about_me = formData.about_me;
        userData.iban = formData.iban;
        userData.bic_swift = formData.bic_swift;
      } else if (formData.role === 'client') {
        userData.company_name = formData.company_name;
        userData.first_name = formData.manager_first_name;
        userData.last_name = formData.manager_last_name;
        userData.phone = formData.phone;
        userData.manager_position = formData.manager_position;
        userData.company_description = formData.company_description;
        userData.siret = formData.siret;
        userData.address = formData.address;
        userData.city = formData.city;
      }
      
      // Créer l'utilisateur via l'API admin
      await api.post('/users/create', {
        email: formData.email,
        password: formData.password,
        role: formData.role,
        userData
      });

      toast.success('Utilisateur créé avec succès');
      navigate('/admin/users');
    } catch (err) {
      console.error('Erreur création utilisateur:', err);
      toast.error(err.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="Ajouter un utilisateur"
      description="Créer un nouveau compte utilisateur"
      menuItems={adminNavigation}
      getRoleLabel={() => 'Administrateur'}
      getDisplayName={() => user?.email?.split('@')[0] || 'Admin'}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/users')}>
            <ArrowLeft className="h-4 w-4" />
            Retour à la liste
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations du compte
            </CardTitle>
            <CardDescription>
              Créer un nouveau compte utilisateur sur la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="utilisateur@exemple.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">Mot de passe *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="role">Rôle *</Label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="automob">Auto-entrepreneur</option>
                    <option value="client">Client (Entreprise)</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
              </div>

              {formData.role === 'automob' && (
                <>
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-4">Informations personnelles</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="first_name">Prénom *</Label>
                        <Input
                          id="first_name"
                          value={formData.first_name}
                          onChange={(e) => handleInputChange('first_name', e.target.value)}
                          placeholder="Jean"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="last_name">Nom *</Label>
                        <Input
                          id="last_name"
                          value={formData.last_name}
                          onChange={(e) => handleInputChange('last_name', e.target.value)}
                          placeholder="Dupont"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="gender">Genre</Label>
                        <select
                          id="gender"
                          value={formData.gender}
                          onChange={(e) => handleInputChange('gender', e.target.value)}
                          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">Sélectionner</option>
                          <option value="male">Homme</option>
                          <option value="female">Femme</option>
                          <option value="other">Autre</option>
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="siret">SIRET</Label>
                        <Input
                          id="siret"
                          value={formData.siret}
                          onChange={(e) => handleInputChange('siret', e.target.value)}
                          placeholder="12345678901234"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-4">Adresse</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <Label htmlFor="address">Adresse complète</Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          placeholder="123 rue de la République"
                        />
                      </div>

                      <div>
                        <Label htmlFor="city">Ville</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          placeholder="Paris"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-4">Informations professionnelles</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="hourly_rate">Taux horaire (€)</Label>
                        <Input
                          id="hourly_rate"
                          type="number"
                          value={formData.hourly_rate}
                          onChange={(e) => handleInputChange('hourly_rate', e.target.value)}
                          placeholder="25"
                        />
                      </div>

                      <div>
                        <Label htmlFor="iban">IBAN</Label>
                        <Input
                          id="iban"
                          value={formData.iban}
                          onChange={(e) => handleInputChange('iban', e.target.value)}
                          placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                        />
                      </div>

                      <div>
                        <Label htmlFor="bic_swift">BIC/SWIFT</Label>
                        <Input
                          id="bic_swift"
                          value={formData.bic_swift}
                          onChange={(e) => handleInputChange('bic_swift', e.target.value)}
                          placeholder="BNPAFRPPXXX"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label htmlFor="about_me">À propos</Label>
                        <textarea
                          id="about_me"
                          value={formData.about_me}
                          onChange={(e) => handleInputChange('about_me', e.target.value)}
                          placeholder="Présentez vos compétences et expériences..."
                          className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {formData.role === 'client' && (
                <>
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-4">Informations de l'entreprise</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <Label htmlFor="company_name">Nom de l'entreprise *</Label>
                        <Input
                          id="company_name"
                          value={formData.company_name}
                          onChange={(e) => handleInputChange('company_name', e.target.value)}
                          placeholder="Mon Entreprise SARL"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="siret">SIRET</Label>
                        <Input
                          id="siret"
                          value={formData.siret}
                          onChange={(e) => handleInputChange('siret', e.target.value)}
                          placeholder="12345678901234"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label htmlFor="company_description">Description de l'entreprise</Label>
                        <textarea
                          id="company_description"
                          value={formData.company_description}
                          onChange={(e) => handleInputChange('company_description', e.target.value)}
                          placeholder="Décrivez votre entreprise et vos activités..."
                          className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-4">Responsable / Contact principal</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="manager_first_name">Prénom du responsable</Label>
                        <Input
                          id="manager_first_name"
                          value={formData.manager_first_name}
                          onChange={(e) => handleInputChange('manager_first_name', e.target.value)}
                          placeholder="Marie"
                        />
                      </div>

                      <div>
                        <Label htmlFor="manager_last_name">Nom du responsable</Label>
                        <Input
                          id="manager_last_name"
                          value={formData.manager_last_name}
                          onChange={(e) => handleInputChange('manager_last_name', e.target.value)}
                          placeholder="Martin"
                        />
                      </div>

                      <div>
                        <Label htmlFor="manager_position">Poste du responsable</Label>
                        <Input
                          id="manager_position"
                          value={formData.manager_position}
                          onChange={(e) => handleInputChange('manager_position', e.target.value)}
                          placeholder="Directeur, Manager, etc."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-4">Adresse de l'entreprise</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <Label htmlFor="address">Adresse complète</Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          placeholder="123 avenue des Champs-Élysées"
                        />
                      </div>

                      <div>
                        <Label htmlFor="city">Ville</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          placeholder="Paris"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/users')}
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Création...' : 'Créer l\'utilisateur'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default UserCreate;
