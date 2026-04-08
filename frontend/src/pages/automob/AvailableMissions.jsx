import { useState, useEffect } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { usePageTitle } from '@/hooks/usePageTitle';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { automobNavigation } from '@/constants/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Briefcase, Search, Calendar, MapPin, Users, Euro, 
  Clock, Send, Building2, Sun, Moon, Eye, Check, X, AlertCircle, Loader2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { Pagination } from '@/components/ui/pagination';
import { usePagination } from '@/hooks/usePagination';
import { useNavigate } from 'react-router-dom';
import { createMissionSlug } from '@/utils/slugify';

const AvailableMissions = () => {
  useDocumentTitle('Missions Disponibles');
  usePageTitle('Missions Disponibles');
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectedMissions, setRejectedMissions] = useState([]);

  useEffect(() => {
    // Charger les missions refusées depuis localStorage
    const rejected = JSON.parse(localStorage.getItem('rejectedMissions') || '[]');
    setRejectedMissions(rejected);
    
    // Charger les missions
    fetchMissions();
  }, []);

  const fetchMissions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/missions');
      // Filtrer uniquement les missions ouvertes
      setMissions(response.data.filter(m => m.status === 'ouvert'));
    } catch (error) {
      console.error('Erreur chargement missions:', error);
      toast.error('Erreur lors du chargement des missions');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (mission) => {
    const slug = createMissionSlug(mission.mission_name || mission.title, mission.id);
    navigate(`/automob/missions/${slug}`);
  };

  const filteredMissions = missions.filter(mission =>
    mission.mission_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mission.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mission.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { currentItems: paginatedMissions, currentPage, totalPages, totalItems, setCurrentPage } = usePagination(filteredMissions, 15);

  const displayName = () => {
    if (user?.profile?.first_name && user?.profile?.last_name) {
      return `${user.profile.first_name} ${user.profile.last_name}`;
    }
    return user?.email?.split('@')[0] || 'Auto-mob';
  };

  // Calculer le montant total pour une mission
  const calculateTotalEarnings = (mission) => {
    // Si le total_hours est présent dans la mission (calculé par le serveur), on l'utilise
    if (mission.total_hours && parseFloat(mission.total_hours) > 0) {
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

    if (!mission.start_date || !mission.end_date || !mission.start_time || !mission.end_time || !mission.hourly_rate) {
      return null;
    }

    // Calculer le nombre de jours
    const startDate = new Date(mission.start_date);
    const endDate = new Date(mission.end_date);
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1; // +1 pour inclure le dernier jour

    // Calculer le nombre d'heures par jour
    const [startHour, startMin] = mission.start_time.split(':').map(Number);
    const [endHour, endMin] = mission.end_time.split(':').map(Number);
    const hoursPerDay = (endHour + endMin / 60) - (startHour + startMin / 60);

    // Calculer le total
    const totalHours = daysDiff * hoursPerDay;
    const totalEarnings = totalHours * parseFloat(mission.hourly_rate);

    return {
      totalHours: totalHours.toFixed(1),
      totalEarnings: totalEarnings.toFixed(2),
      daysDiff
    };
  };

  return (
    <DashboardLayout
      title="Missions Disponibles"
      description="Trouvez votre prochaine mission"
      menuItems={automobNavigation}
      getRoleLabel={() => 'Auto-mob'}
      getDisplayName={displayName}
    >
      <div className="space-y-6">
        {/* Search */}
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une mission..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Missions Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        ) : filteredMissions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Aucune mission disponible</p>
              <p className="text-sm text-muted-foreground">
                Revenez plus tard pour voir les nouvelles missions
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {paginatedMissions.map((mission) => (
              <Card key={mission.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{mission.mission_name || mission.title}</CardTitle>
                      <CardDescription className="mt-1">
                        <a 
                          href={`/public/client/${encodeURIComponent((mission.client_company || 'client').toLowerCase().replace(/\s+/g, '-'))}`}
                          className="text-primary hover:underline"
                        >
                          {mission.client_company || 'Client'}
                        </a>
                      </CardDescription>
                    </div>
                    {mission.work_time === 'nuit' ? (
                      <Badge variant="secondary">
                        <Moon className="h-3 w-3 mr-1" />
                        Nuit
                      </Badge>
                    ) : (
                      <Badge variant="default">
                        <Sun className="h-3 w-3 mr-1" />
                        Jour
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {mission.description}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{mission.city || mission.address}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Du {new Date(mission.start_date).toLocaleDateString('fr-FR')} 
                        {' '}au {new Date(mission.end_date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {mission.start_time} - {mission.end_time}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {mission.nb_automobs || 1} poste(s) disponible(s)
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-primary">
                          {mission.hourly_rate}€/h
                        </p>
                        {(() => {
                          const earnings = calculateTotalEarnings(mission);
                          return earnings ? (
                            <div className="mt-1">
                              <p className="text-sm font-semibold text-green-600">
                                Total: {earnings.totalEarnings}€
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {earnings.totalHours}h sur {earnings.daysDiff} jour(s)
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              {mission.max_hours}h / {mission.billing_frequency}
                            </p>
                          );
                        })()}
                      </div>
                      {mission.user_application ? (
                        <div className="flex flex-col gap-2">
                          {mission.user_application.status === 'en_attente' && (
                            <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
                              <Clock className="h-3 w-3 mr-1" />
                              Déjà postulé
                            </Badge>
                          )}
                          {mission.user_application.status === 'accepte' && (
                            <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                              <Check className="h-3 w-3 mr-1" />
                              Accepté
                            </Badge>
                          )}
                          {mission.user_application.status === 'refuse' && (
                            <Badge variant="destructive">
                              <X className="h-3 w-3 mr-1" />
                              Refusé
                            </Badge>
                          )}
                          <Button 
                            onClick={() => handleViewDetails(mission)}
                            variant="outline"
                            size="sm"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Voir détails
                          </Button>
                        </div>
                      ) : rejectedMissions.includes(mission.id) ? (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Mission refusée
                        </Badge>
                      ) : (
                        <Button 
                          onClick={() => handleViewDetails(mission)}
                          variant="default"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir plus
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={15} totalItems={totalItems} />
      </div>
    </DashboardLayout>
  );
};

export default AvailableMissions;
