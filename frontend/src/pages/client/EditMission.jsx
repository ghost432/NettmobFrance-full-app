import { useState, useEffect } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { clientNavigation } from '@/constants/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { extractIdFromSlug, createMissionSlug } from '@/utils/slugify';

const EditMission = () => {
  useDocumentTitle('Modifier la mission');
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [secteurs, setSecteurs] = useState([]);
  const [competences, setCompetences] = useState([]);
  const [formData, setFormData] = useState({
    mission_name: '',
    description: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    hourly_rate: '',
    nb_automobs: 1,
    address: '',
    city: '',
    postal_code: '',
    secteur_id: '',
    competences_ids: []
  });

  useEffect(() => {
    fetchSecteurs();
    fetchCompetences();
    fetchMission();
  }, [slug]);

  const fetchSecteurs = async () => {
    try {
      const response = await api.get('/secteurs');
      setSecteurs(response.data);
    } catch (error) {
      console.error('Erreur chargement secteurs:', error);
    }
  };

  const fetchCompetences = async () => {
    try {
      const response = await api.get('/competences');
      setCompetences(response.data);
    } catch (error) {
      console.error('Erreur chargement compétences:', error);
    }
  };

  const fetchMission = async () => {
    try {
      setLoading(true);
      const missionId = extractIdFromSlug(slug);
      
      if (!missionId) {
        toast.error('ID de mission invalide');
        navigate('/client/missions');
        return;
      }

      const response = await api.get(`/missions/${missionId}`);
      const mission = response.data;
      
      setFormData({
        mission_name: mission.mission_name || '',
        description: mission.description || '',
        start_date: mission.start_date?.split('T')[0] || '',
        end_date: mission.end_date?.split('T')[0] || '',
        start_time: mission.start_time || '',
        end_time: mission.end_time || '',
        hourly_rate: mission.hourly_rate || '',
        nb_automobs: mission.nb_automobs || 1,
        address: mission.address || '',
        city: mission.city || '',
        postal_code: mission.postal_code || '',
        secteur_id: mission.secteur_id?.toString() || '',
        competences_ids: mission.competences_ids || []
      });
    } catch (error) {
      console.error('Erreur chargement mission:', error);
      toast.error('Erreur lors du chargement de la mission');
      navigate('/client/missions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const missionId = extractIdFromSlug(slug);
      
      await api.put(`/missions/${missionId}`, formData);
      
      toast.success('Mission mise à jour avec succès');
      navigate(`/client/missions/${createMissionSlug(formData.mission_name, missionId)}`);
    } catch (error) {
      console.error('Erreur mise à jour mission:', error);
      toast.error('Erreur lors de la mise à jour de la mission');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCompetenceToggle = (competenceId) => {
    setFormData(prev => ({
      ...prev,
      competences_ids: prev.competences_ids.includes(competenceId)
        ? prev.competences_ids.filter(id => id !== competenceId)
        : [...prev.competences_ids, competenceId]
    }));
  };

  const displayName = () => user?.profile?.company_name || user?.email?.split('@')[0] || 'Client';

  if (loading) {
    return (
      <DashboardLayout
        title="Modifier la mission"
        description="Chargement..."
        menuItems={clientNavigation}
        getRoleLabel={() => 'Client'}
        getDisplayName={displayName}
      >
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Modifier la mission"
      description="Modifiez les informations de votre mission"
      menuItems={clientNavigation}
      getRoleLabel={() => 'Client'}
      getDisplayName={displayName}
    >
      <div className="space-y-6">
        {/* Header */}
        <Button
          variant="ghost"
          onClick={() => navigate(`/client/missions/${slug}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux détails
        </Button>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Informations de la mission</CardTitle>
              <CardDescription>
                Modifiez les détails de votre mission
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Nom de la mission */}
              <div className="space-y-2">
                <Label htmlFor="mission_name">Nom de la mission *</Label>
                <Input
                  id="mission_name"
                  name="mission_name"
                  value={formData.mission_name}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  required
                />
              </div>

              {/* Secteur d'activité */}
              <div className="space-y-2">
                <Label htmlFor="secteur_id">Secteur d'activité *</Label>
                <Select
                  value={formData.secteur_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, secteur_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un secteur" />
                  </SelectTrigger>
                  <SelectContent>
                    {secteurs.map((secteur) => (
                      <SelectItem key={secteur.id} value={secteur.id.toString()}>
                        {secteur.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Compétences requises */}
              <div className="space-y-2">
                <Label>Compétences requises *</Label>
                <div className="border rounded-md p-4 space-y-2 max-h-60 overflow-y-auto">
                  {competences.map((competence) => (
                    <div key={competence.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`competence-${competence.id}`}
                        checked={formData.competences_ids.includes(competence.id)}
                        onChange={() => handleCompetenceToggle(competence.id)}
                        className="rounded border-gray-300"
                      />
                      <label
                        htmlFor={`competence-${competence.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {competence.nom}
                      </label>
                    </div>
                  ))}
                </div>
                {formData.competences_ids.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.competences_ids.map((id) => {
                      const comp = competences.find(c => c.id === id);
                      return comp ? (
                        <Badge key={id} variant="secondary" className="flex items-center gap-1">
                          {comp.nom}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => handleCompetenceToggle(id)}
                          />
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Date de début *</Label>
                  <Input
                    id="start_date"
                    name="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">Date de fin *</Label>
                  <Input
                    id="end_date"
                    name="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Horaires */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Heure de début *</Label>
                  <Input
                    id="start_time"
                    name="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">Heure de fin *</Label>
                  <Input
                    id="end_time"
                    name="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Adresse */}
              <div className="space-y-2">
                <Label htmlFor="address">Adresse *</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Code postal *</Label>
                  <Input
                    id="postal_code"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ville *</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Tarif et nombre */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hourly_rate">Tarif horaire (€) *</Label>
                  <Input
                    id="hourly_rate"
                    name="hourly_rate"
                    type="number"
                    step="0.01"
                    value={formData.hourly_rate}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nb_automobs">Nombre d'auto-mobs *</Label>
                  <Input
                    id="nb_automobs"
                    name="nb_automobs"
                    type="number"
                    min="1"
                    value={formData.nb_automobs}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/client/missions/${slug}`)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default EditMission;
