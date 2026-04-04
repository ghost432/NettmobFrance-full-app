import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { automobNavigation } from '@/constants/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, MapPin, Users, Euro, Clock, Building2, Sun, Moon, 
  Check, X, AlertCircle, Loader2, Briefcase, Tag, Wrench, RefreshCw
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { extractIdFromSlug } from '@/utils/slugify';

const MissionDetails = () => {
  useDocumentTitle('Détails de la Mission');
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [applying, setApplying] = useState(false);
  const [localRejected, setLocalRejected] = useState(false);

  useEffect(() => {
    fetchMissionDetails();
  }, [slug]);

  useEffect(() => {
    // Ouvrir le dialog si le paramètre confirm est présent
    if (searchParams.get('confirm') === 'true' && mission) {
      setShowApplyDialog(true);
    }
  }, [searchParams, mission]);

  // Mettre à jour le titre de la page
  useEffect(() => {
    if (mission) {
      document.title = `${mission.mission_name || mission.title} - NettMobFrance`;
    }
    return () => {
      document.title = 'NettMobFrance';
    };
  }, [mission]);

  const fetchMissionDetails = async () => {
    try {
      setLoading(true);
      const missionId = extractIdFromSlug(slug);
      
      if (!missionId) {
        toast.error('Mission introuvable');
        navigate('/automob/missions');
        return;
      }

      const response = await api.get(`/missions/${missionId}`);
      setMission(response.data);
      
      // Vérifier si la mission a été refusée localement
      const rejectedMissions = JSON.parse(localStorage.getItem('rejectedMissions') || '[]');
      if (rejectedMissions.includes(missionId)) {
        setLocalRejected(true);
      }
    } catch (error) {
      console.error('Erreur chargement mission:', error);
      toast.error('Erreur lors du chargement de la mission');
      navigate('/automob/missions');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!mission) {
      console.log('[handleApply] No mission selected');
      return;
    }

    console.log('[handleApply] Starting application for mission:', mission.id);
    setApplying(true);
    
    try {
      // Supprimer le refus local s'il existe (l'utilisateur change d'avis)
      const rejectedMissions = JSON.parse(localStorage.getItem('rejectedMissions') || '[]');
      const updatedRejected = rejectedMissions.filter(id => id !== mission.id);
      localStorage.setItem('rejectedMissions', JSON.stringify(updatedRejected));
      setLocalRejected(false);
      
      const response = await api.post(`/missions/${mission.id}/apply`, { message: '' });
      console.log('[handleApply] Success:', response.data);
      
      toast.success('Candidature envoyée avec succès !');
      setShowApplyDialog(false);
      
      // Recharger les détails de la mission pour obtenir le statut mis à jour
      await fetchMissionDetails();
      
      // Redirection immédiate vers mes candidatures
      navigate('/automob/my-applications', { replace: true });
    } catch (error) {
      console.error('[handleApply] Error:', error);
      setApplying(false);
      
      if (error.response?.status === 403 && error.response?.data?.requiresVerification) {
        // Profil non vérifié - afficher un popup de redirection
        setShowApplyDialog(false);
        
        // Afficher un dialog personnalisé
        const confirmVerify = window.confirm(
          'Profil non vérifié\n\n' +
          'Vous devez vérifier votre profil avant de postuler à une mission.\n\n' +
          'Voulez-vous être redirigé vers la page de vérification maintenant ?'
        );
        
        if (confirmVerify) {
          navigate('/automob/verify-identity');
        }
      } else if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.error || 'Vous avez déjà postulé à cette mission';
        toast.error(errorMessage);
        setShowApplyDialog(false);
      } else if (error.response?.status === 500) {
        console.error('[handleApply] Erreur serveur 500:', error.response?.data);
        toast.error('Erreur serveur. Veuillez réessayer dans quelques instants.');
        setShowApplyDialog(false);
      } else {
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Erreur lors de l\'envoi de la candidature';
        toast.error(errorMessage);
        setShowApplyDialog(false);
      }
    }
  };

  const handleReject = () => {
    console.log('[handleReject] Rejecting mission');
    setLocalRejected(true);
    setShowApplyDialog(false);
    
    // Sauvegarder le refus dans localStorage
    const rejectedMissions = JSON.parse(localStorage.getItem('rejectedMissions') || '[]');
    if (!rejectedMissions.includes(mission.id)) {
      rejectedMissions.push(mission.id);
      localStorage.setItem('rejectedMissions', JSON.stringify(rejectedMissions));
    }
    
    toast.error('Vous avez refusé la mission');
    
    setTimeout(() => {
      navigate('/automob/missions');
    }, 1500);
  };

  const calculateTotalEarnings = (mission) => {
    // Si le total_hours est déjà calculé par le serveur de façon précise, on l'utilise
    if (mission?.total_hours && parseFloat(mission.total_hours) > 0) {
      const totalHours = parseFloat(mission.total_hours);
      const totalEarnings = totalHours * parseFloat(mission.hourly_rate);
      const startDate = new Date(mission.start_date);
      const endDate = new Date(mission.end_date);
      const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

      return {
        totalHours: totalHours.toFixed(1),
        totalEarnings: totalEarnings.toFixed(2),
        daysDiff
      };
    }

    if (!mission?.start_date || !mission?.end_date || !mission?.start_time || !mission?.end_time || !mission?.hourly_rate) {
      return null;
    }

    const startDate = new Date(mission.start_date);
    const endDate = new Date(mission.end_date);
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    const [startHour, startMin] = mission.start_time.split(':').map(Number);
    const [endHour, endMin] = mission.end_time.split(':').map(Number);
    const hoursPerDay = (endHour + endMin / 60) - (startHour + startMin / 60);

    const totalHours = daysDiff * hoursPerDay;
    const totalEarnings = totalHours * parseFloat(mission.hourly_rate);

    return {
      totalHours: totalHours.toFixed(1),
      totalEarnings: totalEarnings.toFixed(2),
      daysDiff
    };
  };

  const displayName = () => {
    if (user?.profile?.first_name && user?.profile?.last_name) {
      return `${user.profile.first_name} ${user.profile.last_name}`;
    }
    return user?.email?.split('@')[0] || 'Auto-mob';
  };

  if (loading) {
    return (
      <DashboardLayout
        title="Chargement..."
        description="Veuillez patienter"
        menuItems={automobNavigation}
        getRoleLabel={() => 'Auto-mob'}
        getDisplayName={displayName}
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!mission) {
    return (
      <DashboardLayout
        title="Mission introuvable"
        description="Cette mission n'existe pas"
        menuItems={automobNavigation}
        getRoleLabel={() => 'Auto-mob'}
        getDisplayName={displayName}
      >
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Mission introuvable</p>
            <Button onClick={() => navigate('/automob/missions')} className="mt-4">
              Retour aux missions
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const earnings = calculateTotalEarnings(mission);

  return (
    <DashboardLayout
      title={mission.mission_name || mission.title}
      description="Détails de la mission"
      menuItems={automobNavigation}
      getRoleLabel={() => 'Auto-mob'}
      getDisplayName={displayName}
    >
      <div className="space-y-6">
        {/* Mission Header Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl">{mission.mission_name || mission.title}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={`/public/client/${encodeURIComponent((mission.client_company || 'client').toLowerCase().replace(/\s+/g, '-'))}`}
                    className="text-primary hover:underline"
                  >
                    {mission.client_company || 'Client'}
                  </a>
                </div>
              </div>
              {mission.work_time === 'nuit' ? (
                <Badge variant="secondary" className="text-sm">
                  <Moon className="h-4 w-4 mr-1" />
                  Nuit
                </Badge>
              ) : (
                <Badge variant="default" className="text-sm">
                  <Sun className="h-4 w-4 mr-1" />
                  Jour
                </Badge>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{mission.description}</p>
          </CardContent>
        </Card>

        {/* Secteur et Compétences */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Secteur */}
          {mission.secteur_name && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Secteur d'activité
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="text-sm">
                  {mission.secteur_name}
                </Badge>
              </CardContent>
            </Card>
          )}

          {/* Compétences */}
          {mission.competences && mission.competences.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Compétences requises
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {mission.competences.map((comp, index) => (
                    <Badge key={index} variant="outline" className="text-sm">
                      <Tag className="h-3 w-3 mr-1" />
                      {comp}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Details Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Lieu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="font-medium">{mission.address}</p>
              <p className="text-muted-foreground">{mission.postal_code} {mission.city}</p>
            </CardContent>
          </Card>

          {/* Period */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Période
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="font-medium">
                Du {new Date(mission.start_date).toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
              <p className="text-muted-foreground">
                au {new Date(mission.end_date).toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horaires
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-lg">
                {mission.start_time} - {mission.end_time}
              </p>
              {earnings && (
                <p className="text-sm text-muted-foreground mt-1">
                  {earnings.totalHours}h de travail sur {earnings.daysDiff} jour(s)
                </p>
              )}
            </CardContent>
          </Card>

          {/* Positions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Postes disponibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-lg">
                {mission.nb_automobs || 1} poste(s)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Remuneration Card */}
        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-green-700 dark:text-green-400">
              <Euro className="h-5 w-5" />
              Rémunération
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">Tarif horaire</span>
              <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                {mission.hourly_rate}€/h
              </span>
            </div>
            {earnings && (
              <div className="pt-4 border-t border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium">Gain total estimé</span>
                  <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {earnings.totalEarnings}€
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Pour {earnings.totalHours}h de travail sur {earnings.daysDiff} jour(s)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Application Status Banner */}
        {mission.user_application && (
          <Card className={`border-2 ${
            mission.user_application.status === 'en_attente' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' :
            mission.user_application.status === 'accepte' ? 'border-green-500 bg-green-50 dark:bg-green-950' :
            'border-red-500 bg-red-50 dark:bg-red-950'
          }`}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {mission.user_application.status === 'en_attente' && (
                    <>
                      <Clock className="h-6 w-6 text-blue-600" />
                      <div>
                        <p className="font-semibold text-blue-900 dark:text-blue-100">Candidature en attente</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Vous avez postulé le {new Date(mission.user_application.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </>
                  )}
                  {mission.user_application.status === 'accepte' && (
                    <>
                      <Check className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="font-semibold text-green-900 dark:text-green-100">Candidature acceptée</p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Félicitations ! Votre candidature a été acceptée
                        </p>
                      </div>
                    </>
                  )}
                  {mission.user_application.status === 'refuse' && (
                    <>
                      <X className="h-6 w-6 text-red-600" />
                      <div>
                        <p className="font-semibold text-red-900 dark:text-red-100">Candidature refusée</p>
                        <p className="text-sm text-red-700 dark:text-red-300">
                          Votre candidature n'a pas été retenue pour cette mission
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate('/automob/my-applications')}
                >
                  Voir mes candidatures
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rejected Mission Banner */}
        {localRejected && !mission.user_application && (
          <Card className="border-2 border-orange-500 bg-orange-50 dark:bg-orange-950">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                  <div>
                    <p className="font-semibold text-orange-900 dark:text-orange-100">Mission refusée</p>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      Vous avez refusé cette mission. Vous pouvez changer d'avis et postuler.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowApplyDialog(true)}
                  className="border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Changer d'avis
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons - Only show if not applied and not rejected */}
        {!mission.user_application && !localRejected && (
          <div className="flex gap-4 justify-end sticky bottom-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 rounded-lg border shadow-lg">
            <Button
              variant="destructive"
              size="lg"
              onClick={handleReject}
            >
              <X className="h-5 w-5 mr-2" />
              Refuser la mission
            </Button>
            <Button
              size="lg"
              onClick={() => setShowApplyDialog(true)}
              className="bg-automob hover:bg-automob-dark text-white"
            >
              <Check className="h-5 w-5 mr-2" />
              Accepter la mission
            </Button>
          </div>
        )}

        {/* Apply Confirmation Dialog - Simplifié */}
        {showApplyDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => console.log('[Dialog] Backdrop clicked - should not close')}
            />
            
            {/* Dialog Content */}
            <div className="relative bg-background border rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-semibold">Confirmer votre candidature</h2>
              </div>
              
              <p className="text-muted-foreground mb-6">
                Voulez-vous postuler à cette mission ?
              </p>
              
              {/* Mission Summary */}
              <div className="p-4 bg-muted rounded-lg space-y-2 mb-6">
                <h3 className="font-semibold">{mission.mission_name}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {mission.city}
                  </div>
                  <div className="flex items-center gap-1">
                    <Euro className="h-3 w-3" />
                    {mission.hourly_rate}€/h
                  </div>
                </div>
                {earnings && (
                  <div className="pt-2 border-t mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Gain total estimé:</span>
                      <span className="text-lg font-bold text-green-600">
                        {earnings.totalEarnings}€
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                Votre candidature sera envoyée directement au client. Vous recevrez une notification dès qu'il aura pris une décision.
              </p>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button 
                  onClick={() => {
                    console.log('[Button] Refuser clicked - calling handleReject');
                    handleReject();
                  }}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-destructive text-destructive-foreground hover:bg-destructive/90 h-11 px-8 min-w-[120px]"
                >
                  <X className="h-4 w-4 mr-2" />
                  Refuser
                </button>
                <button 
                  onClick={() => {
                    console.log('[Button] Accepter clicked - calling handleApply');
                    handleApply();
                  }}
                  disabled={applying}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-automob hover:bg-automob-dark text-white h-11 px-8 min-w-[120px] disabled:opacity-50"
                >
                  {applying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Accepter
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MissionDetails;
