import { useState, useEffect } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';

export const PublishMission = () => {
  useDocumentTitle('Publier une Mission - Admin');
  
  const [formData, setFormData] = useState({
    client_id: '',
    title: '',
    description: '',
    city: '',
    address: '',
    postal_code: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    hourly_rate: '',
    nb_automobs: 1,
    secteur_id: '',
    competences_ids: [],
    mission_type_id: '',
    work_time: 'jour',
    billing_frequency: '',
    location_type: ''
  });
  
  const [clients, setClients] = useState([]);
  const [secteurs, setSecteurs] = useState([]);
  const [competences, setCompetences] = useState([]);
  const [missionTypes, setMissionTypes] = useState([]);
  const [billingFrequencies, setBillingFrequencies] = useState([]);
  const [locationTypes, setLocationTypes] = useState([]);
  const [hourlyRates, setHourlyRates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [previewData, setPreviewData] = useState(null);

  // Charger les données initiales
  useEffect(() => {
    fetchClients();
    fetchSecteurs();
    fetchMissionTypes();
    fetchBillingFrequencies();
    fetchLocationTypes();
  }, []);

  // Charger les tarifs horaires en fonction du type de mission (jour/nuit)
  useEffect(() => {
    if (formData.work_time) {
      fetchHourlyRates(formData.work_time);
    }
  }, [formData.work_time]);

  const fetchClients = async () => {
    try {
      const response = await api.get('/admin/clients');
      setClients(response.data.clients);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchSecteurs = async () => {
    try {
      const response = await api.get('/secteurs');
      setSecteurs(response.data.secteurs);
    } catch (error) {
      console.error('Error fetching secteurs:', error);
    }
  };

  const fetchMissionTypes = async () => {
    try {
      const response = await api.get('/admin/mission-types');
      setMissionTypes(response.data.types);
    } catch (error) {
      console.error('Error fetching mission types:', error);
    }
  };

  const fetchBillingFrequencies = async () => {
    try {
      const response = await api.get('/admin/mission-settings/billing-frequencies');
      setBillingFrequencies(response.data.frequencies || []);
    } catch (error) {
      console.error('Error fetching billing frequencies:', error);
    }
  };

  const fetchLocationTypes = async () => {
    try {
      const response = await api.get('/admin/mission-settings/location-types');
      setLocationTypes(response.data.locationTypes || []);
    } catch (error) {
      console.error('Error fetching location types:', error);
    }
  };

  const fetchHourlyRates = async (workTime) => {
    try {
      const params = workTime ? { work_time: workTime } : {};
      const response = await api.get('/admin/mission-settings/hourly-rates', { params });
      setHourlyRates(response.data.rates || []);
      
      // Réinitialiser le tarif sélectionné si le work_time change
      if (workTime && formData.hourly_rate) {
        const currentRateStillValid = response.data.rates?.some(
          rate => rate.rate.toString() === formData.hourly_rate
        );
        if (!currentRateStillValid) {
          setFormData(prev => ({ ...prev, hourly_rate: '' }));
        }
      }
    } catch (error) {
      console.error('Error fetching hourly rates:', error);
    }
  };

  const fetchCompetences = async (secteurId) => {
    try {
      const response = await api.get(`/secteurs/${secteurId}/competences`);
      setCompetences(response.data.competences);
    } catch (error) {
      console.error('Error fetching competences:', error);
    }
  };

  const validateMissionDates = (startDate, endDate) => {
    const errors = {};
    const today = new Date().setHours(0,0,0,0);
    
    if (!startDate) errors.start_date = 'Date requise';
    else if (new Date(startDate) < today) errors.start_date = 'Date dans le passé';
    
    if (!endDate) errors.end_date = 'Date requise';
    else if (new Date(endDate) < new Date(startDate)) errors.end_date = 'Doit être après la date de début';
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const dateErrors = validateMissionDates(formData.start_date, formData.end_date);
    if (Object.keys(dateErrors).length > 0) {
      setErrors(dateErrors);
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post('/admin/missions', formData);
      toast.success('Mission publiée avec succès');
      setPreviewData(null);
      // Reset form...
    } catch (error) {
      console.error('Error:', error.response?.data);
      toast.error(
        error.response?.data?.message || 
        'Erreur détaillée: ' + JSON.stringify(error.response?.data?.errors)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="Publier une Mission"
      menuItems={adminNavigation}
      getRoleLabel={() => 'Administrateur'}
    >
      <Card>
        <CardHeader>
          <CardTitle>Publier une nouvelle mission</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Client</Label>
              <Select 
                value={formData.client_id} 
                onValueChange={(value) => setFormData({...formData, client_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.company_name} ({client.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Titre de la mission</Label>
              <Input 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>
            
            <div>
              <Label>Description</Label>
              <Textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Ville</Label>
                <Input 
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label>Code postal</Label>
                <Input 
                  value={formData.postal_code}
                  onChange={(e) => setFormData({...formData, postal_code: e.target.value})}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label>Adresse complète</Label>
              <Input 
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Date de début</Label>
                <Input 
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  required
                />
                {errors.start_date && <p className="text-red-500">{errors.start_date}</p>}
              </div>
              
              <div>
                <Label>Date de fin</Label>
                <Input 
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  required
                />
                {errors.end_date && <p className="text-red-500">{errors.end_date}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Heure de début</Label>
                <Input 
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label>Heure de fin</Label>
                <Input 
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Type de mission</Label>
                <Select 
                  value={formData.mission_type_id}
                  onValueChange={(value) => setFormData({...formData, mission_type_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type de mission" />
                  </SelectTrigger>
                  <SelectContent>
                    {missionTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Secteur d'activité</Label>
                <Select 
                  value={formData.secteur_id} 
                  onValueChange={(value) => {
                    setFormData({...formData, secteur_id: value, competences_ids: []});
                    fetchCompetences(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un secteur" />
                  </SelectTrigger>
                  <SelectContent>
                    {secteurs.map(secteur => (
                      <SelectItem key={secteur.id} value={secteur.id}>
                        {secteur.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Période de travail</Label>
                <Select 
                  value={formData.work_time} 
                  onValueChange={(value) => setFormData({...formData, work_time: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jour">Jour</SelectItem>
                    <SelectItem value="nuit">Nuit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Tarif horaire</Label>
                <Select 
                  value={formData.hourly_rate}
                  onValueChange={(value) => setFormData({...formData, hourly_rate: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un tarif" />
                  </SelectTrigger>
                  <SelectContent>
                    {hourlyRates.map(rate => (
                      <SelectItem key={rate.id} value={rate.rate.toString()}>
                        {rate.rate}€/h{rate.description ? ` - ${rate.description}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nombre d'Auto-Mobs</Label>
                <Input 
                  type="number"
                  min="1"
                  value={formData.nb_automobs}
                  onChange={(e) => setFormData({...formData, nb_automobs: parseInt(e.target.value)})}
                  required
                />
              </div>
              
              <div>
                <Label>Fréquence de facturation</Label>
                <Select 
                  value={formData.billing_frequency}
                  onValueChange={(value) => setFormData({...formData, billing_frequency: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {billingFrequencies.map(freq => (
                      <SelectItem key={freq.id} value={freq.value}>
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>Lieu de la mission</Label>
              <Select 
                value={formData.location_type}
                onValueChange={(value) => setFormData({...formData, location_type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {locationTypes.map(loc => (
                    <SelectItem key={loc.id} value={loc.value}>
                      {loc.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {formData.secteur_id && (
              <div>
                <Label>Compétences requises</Label>
                <div className="space-y-2 mt-2">
                  {competences.map(competence => (
                    <div key={competence.id} className="flex items-center gap-2">
                      <input 
                        type="checkbox"
                        id={`competence-${competence.id}`}
                        checked={formData.competences_ids.includes(competence.id)}
                        onChange={(e) => {
                          const newCompetences = e.target.checked
                            ? [...formData.competences_ids, competence.id]
                            : formData.competences_ids.filter(id => id !== competence.id);
                          setFormData({...formData, competences_ids: newCompetences});
                        }}
                      />
                      <label htmlFor={`competence-${competence.id}`}>
                        {competence.nom}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setPreviewData(formData)}
              >
                Prévisualiser
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Publication en cours...' : 'Publier la mission'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      {previewData && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Aperçu de la Mission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Titre:</strong> {previewData.title}</p>
              <p><strong>Description:</strong> {previewData.description}</p>
              <p><strong>Dates:</strong> {previewData.start_date} au {previewData.end_date}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
};

export default PublishMission;
