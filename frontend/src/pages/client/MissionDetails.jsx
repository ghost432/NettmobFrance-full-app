import { useState, useEffect } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { clientNavigation } from '@/constants/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Calendar, MapPin, Users, Euro, Clock, 
  Briefcase, Edit, Trash2, CheckCircle, XCircle, UserCheck, UserX, FileText 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { extractIdFromSlug, createMissionSlug } from '@/utils/slugify';

const MissionDetails = () => {
  useDocumentTitle('Détails de la mission');
  const { slug, missionId: routeMissionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mission, setMission] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMission();
  }, [slug, routeMissionId]);

  const fetchMission = async () => {
    try {
      setLoading(true);
      // Accepter soit un slug soit un ID direct
      const missionId = routeMissionId || extractIdFromSlug(slug);
      
      if (!missionId) {
        toast.error('ID de mission invalide');
        navigate('/client/missions');
        return;
      }

      const [missionResponse, applicationsResponse] = await Promise.all([
        api.get(`/missions/${missionId}`),
        api.get(`/missions/${missionId}/applications`)
      ]);
      
      setMission(missionResponse.data);
      setApplications(applicationsResponse.data || []);
    } catch (error) {
      console.error('Erreur chargement mission:', error);
      toast.error('Erreur lors du chargement de la mission');
      navigate('/client/missions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      ouvert: { variant: 'default', label: 'Ouvert', icon: CheckCircle },
      en_cours: { variant: 'secondary', label: 'En cours', icon: Clock },
      termine: { variant: 'outline', label: 'Terminé', icon: CheckCircle },
      annule: { variant: 'destructive', label: 'Annulé', icon: XCircle }
    };
    const config = variants[status] || variants.ouvert;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const displayName = () => user?.profile?.company_name || user?.email?.split('@')[0] || 'Client';

  if (loading) {
    return (
      <DashboardLayout
        title="Détails de la mission"
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

  if (!mission) {
    return null;
  }

  return (
    <DashboardLayout
      title={mission.mission_name || mission.title}
      description="Détails de la mission"
      menuItems={clientNavigation}
      getRoleLabel={() => 'Client'}
      getDisplayName={displayName}
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/client/missions')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux missions
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/client/mission/${mission.id}/timesheets`)}
            >
              <FileText className="h-4 w-4 mr-2" />
              Feuilles de temps
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/client/missions/${createMissionSlug(mission.mission_name || mission.title, mission.id)}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            <Button variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </div>

        {/* Mission Info */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{mission.mission_name || mission.title}</CardTitle>
                <CardDescription className="mt-2">
                  Publié le {new Date(mission.created_at).toLocaleDateString('fr-FR')}
                </CardDescription>
              </div>
              {getStatusBadge(mission.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Description */}
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{mission.description}</p>
            </div>

            {/* Informations principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Secteur d'activité</p>
                  <p className="text-sm text-muted-foreground">{mission.secteur_name || 'Non spécifié'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Lieu</p>
                  <p className="text-sm text-muted-foreground">
                    {mission.address}<br />
                    {mission.postal_code} {mission.city}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Période</p>
                  <p className="text-sm text-muted-foreground">
                    Du {new Date(mission.start_date).toLocaleDateString('fr-FR')} au {new Date(mission.end_date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Horaires</p>
                  <p className="text-sm text-muted-foreground">
                    {mission.start_time} - {mission.end_time}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Auto-mobs requis</p>
                  <p className="text-sm text-muted-foreground">{mission.nb_automobs || 1} personne(s)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Euro className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Tarif horaire</p>
                  <p className="text-sm text-muted-foreground font-semibold">{mission.hourly_rate}€/h</p>
                </div>
              </div>
            </div>

            {/* Compétences requises */}
            {mission.competences && mission.competences.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Compétences requises</h3>
                <div className="flex flex-wrap gap-2">
                  {mission.competences.map((comp, index) => (
                    <Badge key={index} variant="secondary">
                      {comp}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Candidatures */}
            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-4">Candidatures reçues</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Total */}
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate('/client/applications')}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold">{applications.length}</p>
                        <p className="text-sm text-muted-foreground">Total</p>
                      </div>
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                {/* Acceptées */}
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate('/client/applications?status=accepte')}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          {applications.filter(app => app.status === 'accepte').length}
                        </p>
                        <p className="text-sm text-muted-foreground">Acceptées</p>
                      </div>
                      <UserCheck className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                {/* En attente */}
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate('/client/applications?status=en_attente')}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-orange-600">
                          {applications.filter(app => app.status === 'en_attente').length}
                        </p>
                        <p className="text-sm text-muted-foreground">En attente</p>
                      </div>
                      <Clock className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>

                {/* Refusées */}
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate('/client/applications?status=refuse')}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-red-600">
                          {applications.filter(app => app.status === 'refuse').length}
                        </p>
                        <p className="text-sm text-muted-foreground">Refusées</p>
                      </div>
                      <UserX className="h-8 w-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-4 flex justify-end">
                <Button onClick={() => navigate('/client/applications')}>
                  Gérer toutes les candidatures
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MissionDetails;
