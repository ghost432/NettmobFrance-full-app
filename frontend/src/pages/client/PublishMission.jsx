import { useState, useEffect } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useNavigate, useLocation } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { clientNavigation } from '@/constants/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Briefcase, MapPin, Clock, Calendar, Users, Euro, FileText,
  Info, Sun, Moon, Building, CheckCircle, AlertTriangle, Copy
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import notificationService from '@/utils/notificationService';
import missionVerificationService from '@/utils/missionVerificationService';
import emergencyMissionService from '@/utils/emergencyMissionService';
import pushNotificationService from '@/utils/pushNotificationService';

const PublishMission = () => {
  useDocumentTitle('Publier une mission');
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [secteurs, setSecteurs] = useState([]);
  const [competences, setCompetences] = useState([]);
  const [billingFrequencies, setBillingFrequencies] = useState([]);
  const [locationTypes, setLocationTypes] = useState([]);
  const [hourlyRates, setHourlyRates] = useState([]);

  const [publishMode, setPublishMode] = useState('express'); // 'express' ou 'with_algorithm'
  const template = location.state?.template;

  const [formData, setFormData] = useState({
    mission_name: template?.mission_name || '',
    mission_type_info: 'Mission tarif horaire - Payer chaque auto-mob sur le tarif par heure',
    work_time: template?.work_time || 'jour',
    secteur_id: template?.secteur_id || '',
    competences_ids: [],
    billing_frequency: template?.billing_frequency || 'jour',
    max_hours: template?.max_hours || '',
    hourly_rate: template?.hourly_rate || '',
    location_type: template?.location_type || 'sur_site',
    address: template?.address || '',
    description: template?.description || '',
    nb_automobs: template?.nb_automobs || 1,
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: ''
  });

  useEffect(() => {
    // Charger toutes les données initiales en parallèle pour optimiser les performances
    const loadInitialData = async () => {
      try {
        const [secteursRes, billingFreqRes, locationTypesRes, hourlyRatesRes] = await Promise.all([
          api.get('/secteurs').catch(err => ({ data: [] })),
          api.get('/admin/mission-settings/billing-frequencies').catch(err => ({ data: { frequencies: [] } })),
          api.get('/admin/mission-settings/location-types').catch(err => ({ data: { locationTypes: [] } })),
          api.get('/admin/mission-settings/hourly-rates', { params: { work_time: formData.work_time } }).catch(err => ({ data: { rates: [] } }))
        ]);

        setSecteurs(secteursRes.data || []);
        setBillingFrequencies(billingFreqRes.data.frequencies || []);
        setLocationTypes(locationTypesRes.data.locationTypes || []);
        setHourlyRates(hourlyRatesRes.data.rates || []);
      } catch (error) {
        console.error('Erreur chargement données initiales:', error);
        toast.error('Erreur lors du chargement des paramètres. Certaines fonctionnalités peuvent être limitées.');
      }
    };

    loadInitialData();
  }, []);

  // Charger les tarifs horaires en fonction du type de mission (jour/nuit) - optimisé
  useEffect(() => {
    if (formData.work_time) {
      fetchHourlyRates(formData.work_time);
    }
  }, [formData.work_time]);

  // Charger les compétences - optimisé avec debouncing
  useEffect(() => {
    if (formData.secteur_id) {
      fetchCompetences(formData.secteur_id);
    } else {
      setCompetences([]);
      setFormData(prev => ({ ...prev, competences_ids: [] }));
    }
  }, [formData.secteur_id]);

  const fetchCompetences = async (secteurId) => {
    try {
      const response = await api.get(`/competences/secteur/${secteurId}`);
      setCompetences(response.data || []);
    } catch (error) {
      console.error('Erreur chargement compétences:', error);
      toast.error('Erreur lors du chargement des compétences');
      setCompetences([]);
    }
  };

  const fetchHourlyRates = async (workTime) => {
    try {
      const params = workTime ? { work_time: workTime } : {};
      const response = await api.get('/admin/mission-settings/hourly-rates', { params });
      setHourlyRates(response.data.rates || []);

      // Réinitialiser le tarif sélectionné si le work_time change et que le tarif actuel n'est plus valide
      if (workTime && formData.hourly_rate) {
        const currentRateStillValid = response.data.rates?.some(
          rate => rate.rate.toString() === formData.hourly_rate
        );
        if (!currentRateStillValid) {
          setFormData(prev => ({ ...prev, hourly_rate: '' }));
        }
      }
    } catch (error) {
      console.error('Erreur chargement tarifs:', error);
      setHourlyRates([]);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleCompetence = (competenceId) => {
    setFormData(prev => {
      const newCompetences = prev.competences_ids.includes(competenceId)
        ? prev.competences_ids.filter(id => id !== competenceId)
        : [...prev.competences_ids, competenceId];
      return { ...prev, competences_ids: newCompetences };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation optimisée en une seule passe
    const validationErrors = [];
    if (!formData.mission_name.trim()) validationErrors.push('Veuillez saisir le nom de la mission');
    if (!formData.secteur_id) validationErrors.push('Veuillez sélectionner une catégorie');
    if (formData.competences_ids.length === 0) validationErrors.push('Veuillez sélectionner au moins une compétence');
    if (!formData.max_hours || formData.max_hours <= 0) validationErrors.push('Veuillez saisir le nombre d\'heures');
    if (!formData.hourly_rate) validationErrors.push('Veuillez sélectionner un tarif horaire');
    if (!formData.address.trim()) validationErrors.push('Veuillez saisir l\'adresse');
    if (!formData.description.trim()) validationErrors.push('Veuillez saisir une description');
    if (!formData.start_date || !formData.end_date) validationErrors.push('Veuillez sélectionner les dates');
    if (!formData.start_time || !formData.end_time) validationErrors.push('Veuillez sélectionner les horaires');

    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return;
    }

    setLoading(true);

    // Optimisation: Préparer les données en une seule fois
    const missionData = {
      ...formData,
      // Conversion des IDs en nombres pour optimiser le traitement backend
      secteur_id: parseInt(formData.secteur_id),
      competences_ids: formData.competences_ids.map(id => parseInt(id)),
      max_hours: parseFloat(formData.max_hours),
      hourly_rate: parseFloat(formData.hourly_rate),
      nb_automobs: parseInt(formData.nb_automobs),
      // Mode de publication pour optimiser le backend
      publish_mode: publishMode,
      // Force l'envoi de notifications même si auto-mobs déconnectés
      force_notifications: true,
      // Stockage persistant des notifications
      persistent_notifications: true
    };

    try {
      if (publishMode === 'express') {
        // Mode Express: Publication rapide (45 secondes max)
        const response = await api.post('/missions', missionData, {
          timeout: 45000 // 45 secondes pour éviter les timeouts
        });

        const missionId = response.data?.mission?.id;
        const missionTitle = formData.mission_name;

        // Logs détaillés pour debugging
        console.log('🚀 PUBLICATION EXPRESS RÉUSSIE:', {
          missionId,
          missionTitle,
          clientEmail: user?.email,
          responseData: response.data,
          timestamp: new Date().toISOString()
        });

        toast.success(
          '⚡ Mission publiée en mode express ! Notifications en cours d\'envoi...'
        );

        // Les notifications sont maintenant gérées 100% par le backend (Système Expert)
        // lors de l'appel POST /missions. Inutile de les redéclencher ici.

        // Lancer la vérification automatique de la mission
        setTimeout(() => {
          missionVerificationService.scheduleVerification(
            missionId,
            missionTitle,
            user?.email,
            (result) => {
              console.log('✅ MISSION VÉRIFIÉE:', result);
              // Notifications gérées automatiquement par le backend.
            },
            async (failure) => {
              console.error('❌ MISSION NON VÉRIFIÉE - LANCEMENT MODE URGENCE:', failure);

              // Activer le service d'urgence
              toast.warning(`⚠️ Mission "${missionTitle}" : Problème détecté. Lancement du diagnostic d'urgence...`);

              try {
                // Diagnostic d'urgence
                const diagnostic = await emergencyMissionService.diagnoseMissingMission(
                  missionTitle,
                  user?.email,
                  formData
                );

                if (diagnostic.success) {
                  console.log('🚨 DIAGNOSTIC D\'URGENCE TERMINÉ:', diagnostic);

                  // Essayer la synchronisation forcée
                  const syncResult = await emergencyMissionService.forceSyncMission(missionTitle, user?.email);

                  if (syncResult.success) {
                    toast.success(`🔄 Mission "${missionTitle}" récupérée avec succès !`);
                  } else {
                    // En dernier recours, tenter la recréation
                    const recreateResult = await emergencyMissionService.forceRecreateМission(formData, user?.email);

                    if (recreateResult.success) {
                      toast.success(`🔄 Mission "${missionTitle}" recréée avec succès !`);
                    } else {
                      toast.error(`❌ Échec total pour "${missionTitle}". Contactez le support avec ce titre exact.`);
                      // Activer le mode récupération automatique pour les futures publications
                      emergencyMissionService.enableAutoRecoveryMode(user?.email);
                    }
                  }
                } else {
                  toast.error(`❌ Diagnostic échoué pour "${missionTitle}". Contactez le support technique.`);
                }
              } catch (urgencyError) {
                console.error('❌ ERREUR SERVICE D\'URGENCE:', urgencyError);
                toast.error(`❌ Service d'urgence indisponible. Contactez immédiatement le support.`);
              }
            }
          );
        }, 2000);

        // Redirection immédiate avec état pour déclencher le toast sur la page missions
        setTimeout(() => {
          console.log('🔄 REDIRECTION vers /client/missions avec:', {
            missionId,
            missionTitle,
            clientEmail: user?.email
          });

          navigate('/client/missions', {
            state: {
              newMission: {
                id: missionId,
                title: missionTitle,
                mode: 'express',
                forceReload: true, // Force le rechargement
                clientEmail: user?.email,
                timestamp: Date.now()
              }
            },
            replace: false // Ne pas remplacer l'historique pour pouvoir revenir
          });
        }, 500);

      } else {
        // Mode avec algorithme synchrone (pour ceux qui préfèrent attendre)
        toast.info(
          '🔍 L\'algorithme recherche les auto-mobs compatibles, cela peut prendre 30-60 secondes...'
        );

        const response = await api.post('/missions', missionData, {
          timeout: 60000 // 1 minute pour éviter les timeouts
        });

        const missionId = response.data?.mission?.id;
        const missionTitle = formData.mission_name;
        const automobsFound = response.data?.automobs_found || 0;
        const automobsNotified = response.data?.automobs_notified || 0;
        // Notifications gérées automatiquement par le backend (Système Expert)

        if (automobsFound > 0) {
          toast.success(
            `✅ Mission publiée ! ${automobsFound} auto-mob${automobsFound > 1 ? 's' : ''} trouvé${automobsFound > 1 ? 's' : ''} et notifié${automobsFound > 1 ? 's' : ''} !`
          );
        } else {
          toast.success(
            '✅ Mission publiée ! Aucun auto-mob compatible pour le moment, mais votre mission est visible.'
          );
        }

        setTimeout(() => {
          navigate('/client/missions', {
            state: {
              newMission: {
                id: missionId,
                title: missionTitle,
                mode: 'with_algorithm',
                automobsFound,
                automobsNotified,
                timestamp: Date.now()
              }
            }
          });
        }, 1000);
      }

    } catch (error) {
      console.error('Erreur publication mission:', error);

      // Gestion spécifique des timeouts
      if (error.code === 'ECONNABORTED' && error.message?.includes('timeout')) {
        if (publishMode === 'express') {
          // En mode express, timeout après 45s peut signifier que la mission est créée
          toast.success(
            '⚡ Mission probablement publiée ! Le serveur met plus de 45s à répondre. Vérification automatique en cours...'
          );
        } else {
          toast.error(
            '⏰ L\'algorithme prend trop de temps. Votre mission est probablement publiée, la recherche continue en arrière-plan.'
          );
        }

        // Lancer immédiatement la vérification par titre même sans ID
        setTimeout(() => {
          console.log('🔍 TIMEOUT - Lancement vérification par titre:', formData.mission_name);
          missionVerificationService.scheduleVerification(
            null, // Pas d'ID à cause du timeout
            formData.mission_name,
            user?.email,
            (result) => {
              console.log('✅ MISSION TROUVÉE APRÈS TIMEOUT:', result);
              toast.success(`✅ Mission "${formData.mission_name}" confirmée ! Notifications gérées par le serveur.`);
            },
            (failure) => {
              console.error('❌ MISSION NON TROUVÉE APRÈS TIMEOUT:', failure);
              toast.error(`⚠️ Mission "${formData.mission_name}" : Vérification échouée. Contactez le support avec ce titre.`);
            }
          );
        }, 1000);

        setTimeout(() => {
          navigate('/client/missions', {
            state: {
              newMission: {
                id: null, // ID non récupéré à cause du timeout
                title: formData.mission_name,
                mode: publishMode,
                timeout: true,
                clientEmail: user?.email, // Récupérer le clientEmail même en cas de timeout
                forceReload: true,
                timestamp: Date.now()
              }
            }
          });
        }, 1500);
        return;
      }

      // Gestion d'erreur améliorée avec plus de détails
      if (error.response?.status === 403) {
        const errorData = error.response.data;
        if (errorData?.error === 'Profil non vérifié') {
          toast.error(
            errorData.message ||
            'Vous devez compléter et faire vérifier votre profil avant de publier une mission.'
          );
        } else {
          toast.error(errorData?.message || 'Accès non autorisé pour cette action');
        }
      } else if (error.response?.status === 422) {
        // Erreurs de validation du backend
        const errorData = error.response.data;
        toast.error(`Données invalides: ${errorData?.message || errorData?.error || 'Vérifiez vos informations'}`);
      } else if (error.response?.status >= 500) {
        toast.error('Erreur serveur temporaire. Veuillez réessayer dans quelques instants.');
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        toast.error('Problème de connexion. Vérifiez votre connexion internet et réessayez.');
      } else {
        toast.error(error.response?.data?.error || error.response?.data?.message || 'Erreur lors de la publication de la mission');
      }
    } finally {
      setLoading(false);
    }
  };

  const getFilteredHourlyRates = () => {
    // Les tarifs sont déjà filtrés par le backend selon work_time
    return hourlyRates;
  };

  const getMaxHoursLabel = () => {
    switch (formData.billing_frequency) {
      case 'jour':
        return 'Nombre maximal d\'heures par jour';
      case 'semaine':
        return 'Nombre maximal d\'heures par semaine';
      case 'mois':
        return 'Nombre maximal d\'heures par mois';
      default:
        return 'Nombre maximal d\'heures';
    }
  };

  const displayName = () => user?.profile?.company_name || user?.email?.split('@')[0] || 'Client';

  return (
    <DashboardLayout
      title="Publier une mission"
      description="Créez une nouvelle mission pour recruter des auto-mobs"
      menuItems={clientNavigation}
      getRoleLabel={() => user?.profile?.company_name || 'Client'}
      getDisplayName={displayName}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Formulaire */}
        <div className="space-y-6">
          {/* Bannière de duplication */}
          {template && (
            <Alert className="border-blue-300 bg-blue-50 dark:bg-blue-950/20">
              <Copy className="h-5 w-5 text-blue-600" />
              <AlertTitle className="text-blue-800">Mission dupliquée</AlertTitle>
              <AlertDescription className="text-blue-700">
                Les champs ont été pré-remplis depuis la mission d'origine. Mettez à jour les dates et vérifiez les informations avant de publier.
              </AlertDescription>
            </Alert>
          )}
          {/* Avertissement profil non vérifié */}
          {user && !user.id_verified && (
            <Alert variant="destructive" className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <AlertTitle className="text-orange-800 dark:text-orange-400">Profil non vérifié</AlertTitle>
              <AlertDescription className="text-orange-700 dark:text-orange-300">
                Vous devez compléter et faire vérifier votre profil avant de publier une mission.
                <Button
                  variant="link"
                  className="p-0 h-auto ml-1 text-orange-800 dark:text-orange-400 underline"
                  onClick={() => navigate('/client/profile')}
                >
                  Compléter mon profil
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nom de la mission */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Informations générales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mission_name">Nom de votre mission *</Label>
                  <Input
                    id="mission_name"
                    value={formData.mission_name}
                    onChange={(e) => handleInputChange('mission_name', e.target.value)}
                    placeholder="Ex: Nettoyage bureaux centre-ville"
                  />
                </div>

                {/* Type de mission - Info */}
                <div className="space-y-2">
                  <Label>Type de mission</Label>
                  <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100">
                        Mission tarif horaire
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Payer chaque auto-mob sur le tarif par heure
                      </p>
                    </div>
                  </div>
                </div>

                {/* Travail de jour/nuit */}
                <div className="space-y-2">
                  <Label htmlFor="work_time">Type de mission *</Label>
                  <Select
                    value={formData.work_time}
                    onValueChange={(value) => {
                      handleInputChange('work_time', value);
                      handleInputChange('hourly_rate', ''); // Reset tarif
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jour">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          Travail de jour
                        </div>
                      </SelectItem>
                      <SelectItem value="nuit">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          Travail de nuit
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Catégorie et Compétences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Catégorie et compétences requises
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="secteur">Catégorie de mission *</Label>
                  <Select
                    value={formData.secteur_id}
                    onValueChange={(value) => handleInputChange('secteur_id', value)}
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

                {formData.secteur_id && competences.length > 0 && (
                  <div className="space-y-2">
                    <Label>Compétences requises pour la mission *</Label>
                    <div className="flex flex-wrap gap-2">
                      {competences.map((competence) => (
                        <Badge
                          key={competence.id}
                          variant={formData.competences_ids.includes(competence.id) ? 'default' : 'outline'}
                          className="cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => toggleCompetence(competence.id)}
                        >
                          {formData.competences_ids.includes(competence.id) && (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          )}
                          {competence.nom}
                        </Badge>
                      ))}
                    </div>
                    {formData.competences_ids.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {formData.competences_ids.length} compétence(s) sélectionnée(s)
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Facturation et Tarif */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Euro className="h-5 w-5" />
                  Facturation et rémunération
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="billing_frequency">Fréquence de facturation *</Label>
                  <Select
                    value={formData.billing_frequency}
                    onValueChange={(value) => handleInputChange('billing_frequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
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

                <div className="space-y-2">
                  <Label htmlFor="max_hours">{getMaxHoursLabel()} *</Label>
                  <Input
                    id="max_hours"
                    type="number"
                    min="1"
                    value={formData.max_hours}
                    onChange={(e) => handleInputChange('max_hours', e.target.value)}
                    placeholder="Ex: 8"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hourly_rate">Tarif par heure de la mission *</Label>
                  <Select
                    value={formData.hourly_rate}
                    onValueChange={(value) => handleInputChange('hourly_rate', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un tarif" />
                    </SelectTrigger>
                    <SelectContent>
                      {getFilteredHourlyRates().map((rate) => (
                        <SelectItem key={rate.id} value={rate.rate.toString()}>
                          {rate.rate}€/h{rate.description ? ` - ${rate.description}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.work_time && (
                    <p className="text-sm text-muted-foreground flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>
                        Le tarif est basé sur le type de mission : <strong>{formData.work_time === 'jour' ? 'Jour' : 'Nuit'}</strong>.
                        Les tarifs de nuit sont généralement plus élevés en raison des conditions de travail.
                      </span>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lieu et Adresse */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Localisation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="location_type">Lieu de la mission *</Label>
                  <Select
                    value={formData.location_type}
                    onValueChange={(value) => handleInputChange('location_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
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

                <AddressAutocomplete
                  value={formData.address}
                  onChange={(value) => handleInputChange('address', value)}
                  label="Adresse de la mission"
                  placeholder="Ex: 123 Rue de la République, 75001 Paris"
                  required
                />
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Détails de la mission
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Description de la mission *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={6}
                    placeholder="Décrivez en détail les tâches à effectuer, les conditions de travail, etc."
                  />
                  <p className="text-sm text-muted-foreground">
                    {formData.description.length} caractères
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nb_automobs">Nombre d'auto-mobs recherchés *</Label>
                  <Input
                    id="nb_automobs"
                    type="number"
                    min="1"
                    value={formData.nb_automobs}
                    onChange={(e) => handleInputChange('nb_automobs', e.target.value)}
                    placeholder="Ex: 2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Dates et Horaires */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Période et horaires
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Date de début *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => handleInputChange('start_date', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_date">Date de fin *</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => handleInputChange('end_date', e.target.value)}
                      min={formData.start_date}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Heure de début *</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => handleInputChange('start_time', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_time">Heure de fin *</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => handleInputChange('end_time', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sélecteur de mode de publication */}
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
              <Label className="text-sm font-medium mb-3 block">Mode de publication</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div
                  className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${publishMode === 'express'
                      ? 'border-green-500 bg-green-50 dark:bg-green-950'
                      : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                    }`}
                  onClick={() => setPublishMode('express')}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="radio"
                      checked={publishMode === 'express'}
                      onChange={() => setPublishMode('express')}
                      className="text-green-600"
                    />
                    <span className="font-medium text-green-700 dark:text-green-400">
                      ⚡ Express (Recommandé)
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Publication rapide (5-45s). Notifications envoyées MÊME aux auto-mobs déconnectés.
                  </p>
                </div>

                <div
                  className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${publishMode === 'with_algorithm'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                    }`}
                  onClick={() => setPublishMode('with_algorithm')}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="radio"
                      checked={publishMode === 'with_algorithm'}
                      onChange={() => setPublishMode('with_algorithm')}
                      className="text-blue-600"
                    />
                    <span className="font-medium text-blue-700 dark:text-blue-400">
                      🔍 Avec algorithme
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Attendre les résultats de l'algorithme avant redirection (30-60s). Notifications complètes incluses.
                  </p>
                </div>
              </div>
            </div>

            {/* Bouton de soumission */}
            <Button type="submit" disabled={loading || !user?.id_verified} className="w-full bg-client hover:bg-client-dark text-white" size="lg">
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span className="animate-pulse">
                    {publishMode === 'express' ? 'Publication express...' : 'Algorithme en cours...'}
                  </span>
                </div>
              ) : (
                publishMode === 'express' ? '⚡ Publication Express' : '🔍 Publier avec Algorithme'
              )}
            </Button>
            {!user?.id_verified && (
              <p className="text-sm text-orange-600 text-center mt-2">
                Vous devez vérifier votre profil avant de publier une mission
              </p>
            )}

            {/* Information sur l'algorithme */}
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    🤖 Algorithme intelligent de matching
                  </p>
                  {publishMode === 'express' ? (
                    <p className="text-blue-700 dark:text-blue-300">
                      <strong>Mode Express :</strong> Votre mission est publiée immédiatement. L'algorithme de matching se lance en arrière-plan pour identifier les meilleurs candidats et vous envoyer une notification avec les résultats.
                    </p>
                  ) : (
                    <p className="text-blue-700 dark:text-blue-300">
                      <strong>Mode Algorithme :</strong> L'algorithme analyse tous les profils d'auto-mobs avant la publication
                      pour vous donner immédiatement les candidats les plus compatibles. Toutes les notifications (push, email, SMS) sont envoyées automatiquement. Durée : 30-60 secondes.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Aperçu de la mission</CardTitle>
              <CardDescription>Voici comment votre mission apparaîtra aux auto-mobs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.mission_name && (
                <div>
                  <h3 className="text-xl font-bold">{formData.mission_name}</h3>
                </div>
              )}

              {formData.work_time && (
                <div className="flex items-center gap-2">
                  {formData.work_time === 'jour' ? (
                    <Sun className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <Moon className="h-4 w-4 text-blue-500" />
                  )}
                  <span className="text-sm">
                    {formData.work_time === 'jour' ? 'Travail de jour' : 'Travail de nuit'}
                  </span>
                </div>
              )}

              {formData.secteur_id && (
                <div>
                  <Label className="text-xs text-muted-foreground">Secteur</Label>
                  <p className="text-sm font-medium">
                    {secteurs.find(s => s.id.toString() === formData.secteur_id)?.nom}
                  </p>
                </div>
              )}

              {formData.competences_ids.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Compétences requises</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formData.competences_ids.map((compId) => {
                      const comp = competences.find(c => c.id === compId);
                      return comp ? (
                        <Badge key={compId} variant="secondary" className="text-xs">
                          {comp.nom}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {formData.hourly_rate && (
                <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Tarif horaire</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {formData.hourly_rate} €/h
                    </span>
                  </div>
                </div>
              )}

              {formData.max_hours && (
                <div>
                  <Label className="text-xs text-muted-foreground">Heures maximales</Label>
                  <p className="text-sm font-medium">
                    {formData.max_hours}h / {formData.billing_frequency}
                  </p>
                </div>
              )}

              {formData.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Adresse</Label>
                    <p className="text-sm">{formData.address}</p>
                  </div>
                </div>
              )}

              {formData.description && (
                <div>
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">
                    {formData.description.substring(0, 200)}
                    {formData.description.length > 200 && '...'}
                  </p>
                </div>
              )}

              {formData.nb_automobs > 0 && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {formData.nb_automobs} auto-mob{formData.nb_automobs > 1 ? 's' : ''} recherché{formData.nb_automobs > 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {(formData.start_date || formData.end_date) && (
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Période</Label>
                    <p className="text-sm">
                      {formData.start_date && new Date(formData.start_date).toLocaleDateString('fr-FR')}
                      {formData.start_date && formData.end_date && ' - '}
                      {formData.end_date && new Date(formData.end_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              )}

              {(formData.start_time || formData.end_time) && (
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Horaires</Label>
                    <p className="text-sm">
                      {formData.start_time} - {formData.end_time}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PublishMission;
