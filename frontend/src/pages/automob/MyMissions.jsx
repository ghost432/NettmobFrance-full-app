import { useState, useEffect } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { automobNavigation } from '@/constants/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Briefcase, Search, Calendar, MapPin, Euro, Clock,
  CheckCircle, XCircle, Building2, Timer, FileText, Plus, Send
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';

const MyMissions = () => {
  useDocumentTitle('Mes Missions');
  usePageTitle('Mes Missions');

  const { user } = useAuth();
  const navigate = useNavigate();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 15;

  useEffect(() => {
    fetchMyMissions();
  }, []);

  const fetchMyMissions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/timesheets/my-missions');
      setMissions(response.data);
    } catch (error) {
      console.error('Erreur chargement missions:', error);
      toast.error('Erreur lors du chargement de vos missions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      en_attente: {
        variant: 'default',
        label: 'En attente',
        icon: <Clock className="h-3 w-3 mr-1" />,
        className: 'bg-blue-500'
      },
      accepte: {
        variant: 'default',
        label: 'Acceptée',
        icon: <CheckCircle className="h-3 w-3 mr-1" />,
        className: 'bg-green-500'
      },
      refuse: {
        variant: 'destructive',
        label: 'Refusée',
        icon: <XCircle className="h-3 w-3 mr-1" />
      }
    };
    const config = variants[status] || variants.en_attente;
    return (
      <Badge variant={config.variant} className={`flex items-center w-fit ${config.className || ''}`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getMissionStatus = (mission) => {
    switch (mission.status) {
      case 'ouvert':
        return { label: 'Ouverte', color: 'text-blue-600' };
      case 'en_cours':
        return { label: 'En cours', color: 'text-green-600' };
      case 'termine':
        return { label: 'Terminée', color: 'text-gray-600' };
      case 'annule':
        return { label: 'Annulée', color: 'text-red-600' };
      default:
        return { label: mission.status, color: 'text-gray-600' };
    }
  };

  const handleCreateTimesheet = (mission) => {
    // Vérifier s'il y a une feuille en brouillon
    if (mission.draft_timesheet_id) {
      navigate(`/automob/timesheet/${mission.draft_timesheet_id}`);
    } else {
      navigate(`/automob/timesheet/create/${mission.id}`);
    }
  };

  const handleViewTimesheets = (mission) => {
    navigate(`/automob/mission/${mission.id}/timesheets`);
  };

  const handleSubmitAllTimesheets = async (mission) => {
    if (!mission.draft_timesheet_id) {
      toast.error('Aucune feuille de temps en brouillon à envoyer');
      return;
    }

    if (!confirm('Envoyer toutes vos heures au client pour validation ?')) {
      return;
    }

    try {
      await api.post(`/timesheets/${mission.draft_timesheet_id}/submit`);
      toast.success('Feuille de temps envoyée au client !');
      // Recharger les missions
      fetchMissions();
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de l\'envoi');
    }
  };

  const filteredMissions = missions.filter(mission => {
    const matchesSearch =
      mission.mission_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mission.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mission.client_company?.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'accepted') return matchesSearch && mission.application_status === 'accepte';
    if (activeTab === 'pending') return matchesSearch && mission.application_status === 'en_attente';
    if (activeTab === 'rejected') return matchesSearch && mission.application_status === 'refuse';

    return matchesSearch;
  }).sort((a, b) => {
    // Trier: en_cours et ouvert en premier, terminé en dernier
    const statusOrder = { 'en_cours': 1, 'ouvert': 2, 'termine': 3, 'annule': 4 };
    return (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5);
  });

  // Calculer les statistiques
  const stats = {
    total: missions.length,
    en_cours: missions.filter(m => m.status === 'en_cours').length,
    termine: missions.filter(m => m.status === 'termine').length,
    accepte: missions.filter(m => m.application_status === 'accepte').length
  };

  const displayName = () => {
    if (user?.profile?.first_name && user?.profile?.last_name) {
      return `${user.profile.first_name} ${user.profile.last_name}`;
    }
    return user?.email?.split('@')[0] || 'Auto-mob';
  };

  return (
    <DashboardLayout
      title="Mes Missions"
      description="Gérez vos missions et pointages"
      menuItems={automobNavigation}
      getRoleLabel={() => 'Auto-mob'}
      getDisplayName={displayName}
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Missions postulées</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">En cours</CardTitle>
              <Timer className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold text-green-600">{stats.en_cours}</div>
              <p className="text-xs text-muted-foreground">Missions actives</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">Terminées</CardTitle>
              <CheckCircle className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold text-gray-600">{stats.termine}</div>
              <p className="text-xs text-muted-foreground">Missions complétées</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">Acceptées</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold text-blue-600">{stats.accepte}</div>
              <p className="text-xs text-muted-foreground">Candidatures acceptées</p>
            </CardContent>
          </Card>
        </div>

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

        {/* Missions Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Toutes ({stats.total})</TabsTrigger>
            <TabsTrigger value="accepted">Acceptées ({stats.accepted})</TabsTrigger>
            <TabsTrigger value="pending">En attente ({stats.pending})</TabsTrigger>
            <TabsTrigger value="rejected">Refusées ({stats.rejected})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Chargement...</p>
              </div>
            ) : filteredMissions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Aucune mission</p>
                  <p className="text-sm text-muted-foreground">
                    {activeTab === 'all' && 'Commencez par postuler à des missions'}
                    {activeTab === 'accepted' && 'Aucune mission acceptée pour le moment'}
                    {activeTab === 'pending' && 'Aucune candidature en attente'}
                    {activeTab === 'rejected' && 'Aucune candidature refusée'}
                  </p>
                  {activeTab === 'all' && (
                    <Button onClick={() => navigate('/automob/missions')} className="mt-4">
                      Voir les missions disponibles
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredMissions.map((mission) => {
                  const missionStatus = getMissionStatus(mission);
                  const isAccepted = mission.application_status === 'accepte';

                  return (
                    <Card key={mission.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-xl">
                                {mission.mission_name || mission.title}
                              </CardTitle>
                              {getStatusBadge(mission.application_status)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Building2 className="h-4 w-4" />
                              <a
                                href={`/public/client/${encodeURIComponent((mission.client_company || 'client').toLowerCase().replace(/\s+/g, '-'))}`}
                                className="text-primary hover:underline"
                              >
                                {mission.client_company || 'Client'}
                              </a>
                              <span className="mx-2">•</span>
                              <span className={missionStatus.color}>{missionStatus.label}</span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {mission.description}
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{mission.city}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {new Date(mission.start_date).toLocaleDateString('fr-FR')}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <Euro className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{mission.hourly_rate}€/h</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {mission.start_time} - {mission.end_time}
                            </span>
                          </div>
                        </div>

                        {/* Timesheet info for accepted missions */}
                        {isAccepted && (() => {
                          const totalHours = parseFloat(mission.total_hours) || 0;
                          const recordedHours = parseFloat(mission.recorded_hours) || 0;
                          const approvedOvertime = parseFloat(mission.approved_overtime_hours) || 0;
                          const pendingHoursCount = parseFloat(mission.pending_hours) || 0;
                          const pendingOvertime = parseFloat(mission.pending_overtime_hours) || 0;

                          // Heures totales réelles (incluant les supp approuvées si elles s'ajoutent au total prévu, 
                          // ou simplement comparer le réalisé au prévu)
                          const totalRecordedInclOvertime = recordedHours; // recorded_hours inclut déjà tout dans la requête SQL
                          const remainingToRecord = totalHours - (recordedHours - approvedOvertime - pendingOvertime);
                          const isCompleted = remainingToRecord <= 0;

                          return (
                            <div className="pt-4 border-t space-y-3">
                              {/* Heures totales et progression */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="flex flex-col">
                                  <span className="text-xs text-muted-foreground">Heures totales</span>
                                  <span className="text-sm font-semibold">{totalHours}h</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs text-muted-foreground">Soumises</span>
                                  <span className="text-sm font-semibold text-blue-600">{recordedHours}h</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs text-muted-foreground">En validation</span>
                                  <span className="text-sm font-semibold text-orange-600">{pendingHoursCount + pendingOvertime}h</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs text-muted-foreground">À soumettre</span>
                                  <span className={`text-sm font-semibold ${isCompleted ? 'text-gray-500' : 'text-red-600'}`}>
                                    {Math.max(0, remainingToRecord).toFixed(1)}h
                                  </span>
                                </div>
                              </div>

                              {(approvedOvertime > 0 || pendingOvertime > 0) && (
                                <div className="text-xs bg-orange-50 text-orange-700 p-2 rounded border border-orange-100 italic">
                                  Inclut {approvedOvertime + pendingOvertime}h supplémentaires
                                </div>
                              )}

                              {/* Barre de progression */}
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all"
                                  style={{ width: `${Math.min(100, (recordedHours / totalHours) * 100)}%` }}
                                />
                              </div>

                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">
                                    {mission.timesheet_count || 0} feuille(s) de temps
                                  </span>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2">
                                  {mission.timesheet_count > 0 && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleViewTimesheets(mission)}
                                      className="w-full sm:w-auto"
                                    >
                                      <FileText className="h-4 w-4 mr-2" />
                                      <span className="hidden sm:inline">Voir les pointages</span>
                                      <span className="sm:hidden">Pointages</span>
                                    </Button>
                                  )}
                                  {!isCompleted && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleCreateTimesheet(mission)}
                                      className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      <span className="hidden sm:inline">{mission.draft_timesheet_id ? 'Continuer le pointage' : 'Nouveau pointage'}</span>
                                      <span className="sm:hidden">{mission.draft_timesheet_id ? 'Continuer' : 'Nouveau'}</span>
                                    </Button>
                                  )}
                                  {isCompleted && (
                                    <>
                                      <Badge variant="default" className="bg-green-600 w-full sm:w-auto justify-center">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Heures complètes
                                      </Badge>
                                      {mission.draft_timesheet_id ? (
                                        <Button
                                          size="sm"
                                          onClick={() => handleSubmitAllTimesheets(mission)}
                                          className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                                        >
                                          <Send className="h-4 w-4 mr-2" />
                                          <span className="hidden sm:inline">Envoyer au client</span>
                                          <span className="sm:hidden">Envoyer</span>
                                        </Button>
                                      ) : (pendingHoursCount + pendingOvertime) > 0 && (
                                        <Badge variant="default" className="bg-orange-600 w-full sm:w-auto justify-center">
                                          <Clock className="h-3 w-3 mr-1" />
                                          En attente d'approbation
                                        </Badge>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Application date for non-accepted missions */}
                        {!isAccepted && (
                          <div className="pt-4 border-t">
                            <p className="text-xs text-muted-foreground">
                              Candidature envoyée le {new Date(mission.applied_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default MyMissions;
