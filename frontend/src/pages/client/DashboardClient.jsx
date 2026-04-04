import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { clientNavigation } from '@/constants/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Users, 
  MessageSquare, 
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  AlertTriangle,
  Bell,
  Calendar,
  Send
} from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAutoNotifications } from '@/hooks/useAutoNotifications';
import { useBadgeManager } from '@/hooks/useBadgeManager';
import { ProfileCompletionCard } from '@/components/ProfileCompletionCard';
import { NotificationActivationCard } from '@/components/NotificationActivationCard';
import { MissionsPublishedChart, ExpensesChart, ApplicationsReceivedChart } from '@/components/dashboard/ClientCharts';
import { 
  generateWeeklyPublishedMissionsData,
  generateMonthlyPublishedMissionsData,
  generateWeeklyExpensesData,
  generateMonthlyExpensesData,
  generateWeeklyApplicationsData,
  generateMonthlyApplicationsData
} from '@/utils/chartDataGenerator';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';
import RevolutPartnerSection from '../Public/components/revolut/RevolutPartnerSection';

const DashboardClient = () => {
  useDocumentTitle('Tableau de Bord');
  usePushNotifications(); // Configure les push notifications en arrière-plan
  useAutoNotifications(); // Auto-configuration complète des notifications
  useBadgeManager(); // Gestion du badge PWA affichant le nombre de notifications non lues
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMissions: 0,
    missionsPublished: 0,
    missionsInProgress: 0,
    missionsCompleted: 0,
    missionsCancelled: 0,
    totalApplications: 0,
    acceptedApplications: 0,
    rejectedApplications: 0,
    pendingApplications: 0,
    profileViews: 0
  });
  const [recentDisputes, setRecentDisputes] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [nextMission, setNextMission] = useState(null);
  const [chartPeriod, setChartPeriod] = useState('week');
  const [missionsChartData, setMissionsChartData] = useState([]);
  const [expensesChartData, setExpensesChartData] = useState([]);
  const [applicationsChartData, setApplicationsChartData] = useState([]);
  const [allMissions, setAllMissions] = useState([]);
  const [allApplications, setAllApplications] = useState([]);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${imagePath}`;
  };

  const roleLabel = () => user?.profile?.company_name || 'Entreprise';
  const displayName = () => user?.profile?.company_name || user?.email?.split('@')[0] || 'Client';
  const avatarSrc = () => getImageUrl(user?.profile?.profile_picture || user?.profile_picture);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [
        missionsRes,
        applicationsRes,
        disputesRes,
        notificationsRes
      ] = await Promise.all([
        api.get('/missions').catch(() => ({ data: [] })),
        api.get('/missions/applications').catch(() => ({ data: [] })),
        api.get('/disputes/client/my-disputes').catch(() => ({ data: [] })),
        api.get('/notifications').catch(() => ({ data: [] }))
      ]);

      const missions = missionsRes.data || [];
      const applications = applicationsRes.data || [];
      const disputes = disputesRes.data || [];
      const notifications = notificationsRes.data || [];

      // Sauvegarder pour les graphiques
      setAllMissions(missions);
      setAllApplications(applications);

      setStats({
        totalMissions: missions.length,
        missionsPublished: missions.filter(m => m.status === 'ouvert' || m.status === 'open').length,
        missionsInProgress: missions.filter(m => m.status === 'en_cours' || m.status === 'in_progress').length,
        missionsCompleted: missions.filter(m => m.status === 'termine' || m.status === 'completed').length,
        missionsCancelled: missions.filter(m => m.status === 'annule' || m.status === 'cancelled').length,
        totalApplications: applications.length,
        acceptedApplications: applications.filter(a => a.status === 'accepte' || a.status === 'accepted').length,
        rejectedApplications: applications.filter(a => a.status === 'refuse' || a.status === 'rejected').length,
        pendingApplications: applications.filter(a => a.status === 'en_attente' || a.status === 'pending').length,
        profileViews: user?.profile?.profile_views || 0
      });

      // Générer les données de graphiques
      updateChartData(missions, applications);

      setRecentDisputes(disputes.slice(0, 3));
      setRecentNotifications(notifications.slice(0, 5));

      const upcomingMissions = missions.filter(m => 
        m.status === 'en_cours' && new Date(m.start_date) > new Date()
      ).sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
      
      if (upcomingMissions.length > 0) {
        setNextMission(upcomingMissions[0]);
      }

    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      // Ne pas afficher d'erreur si c'est une erreur d'auth (AuthContext va gérer)
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        toast.error('Impossible de charger certaines statistiques');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateChartData = (missions, applications) => {
    if (chartPeriod === 'week') {
      setMissionsChartData(generateWeeklyPublishedMissionsData(missions));
      setExpensesChartData(generateWeeklyExpensesData(missions));
      setApplicationsChartData(generateWeeklyApplicationsData(applications));
    } else {
      setMissionsChartData(generateMonthlyPublishedMissionsData(missions));
      setExpensesChartData(generateMonthlyExpensesData(missions));
      setApplicationsChartData(generateMonthlyApplicationsData(applications));
    }
  };

  useEffect(() => {
    if (allMissions.length > 0 || allApplications.length > 0) {
      updateChartData(allMissions, allApplications);
    }
  }, [chartPeriod]);

  const getStatusBadge = (status) => {
    const badges = {
      pending: <Badge variant="outline" className="bg-yellow-50"><Clock className="h-3 w-3 mr-1" />En attente</Badge>,
      open: <Badge variant="outline" className="bg-blue-50"><Clock className="h-3 w-3 mr-1" />Ouvert</Badge>,
      resolved: <Badge variant="outline" className="bg-green-50"><CheckCircle className="h-3 w-3 mr-1" />Résolu</Badge>,
      closed: <Badge variant="outline" className="bg-gray-50"><XCircle className="h-3 w-3 mr-1" />Fermé</Badge>
    };
    return badges[status] || <Badge>{status}</Badge>;
  };

  return (
    <DashboardLayout
      title="Mes Statistiques"
      description={user?.email ? `Bienvenue, ${displayName()}` : 'Pilotage de vos missions et échanges'}
      menuItems={clientNavigation}
      getRoleLabel={roleLabel}
      getDisplayName={displayName}
      getAvatarSrc={avatarSrc}
    >
      <section className="space-y-6">
        {/* Carte d'activation des notifications */}
        <NotificationActivationCard />
        
        {/* Revolut Partnership Section */}
        <RevolutPartnerSection dismissible={true} variant="dashboard" />
        
        <ProfileCompletionCard user={user} role="client" />

        {nextMission && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-blue-900">Prochaine Mission</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-semibold text-blue-900">{nextMission.title || nextMission.mission_name}</p>
                <p className="text-sm text-blue-700">
                  Début: {new Date(nextMission.start_date).toLocaleDateString('fr-FR')}
                  {nextMission.start_time && ` à ${nextMission.start_time}`}
                </p>
                <Button 
                  size="sm" 
                  onClick={() => navigate(`/client/missions`)}
                  className="mt-2"
                >
                  Voir les détails
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div>
          <h3 className="text-lg font-semibold mb-4">Mes Missions</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <FileText className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                <div className="text-2xl font-bold">{stats.totalMissions}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
                <CardTitle className="text-sm font-medium">Publiées</CardTitle>
                <Send className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                <div className="text-2xl font-bold text-blue-600">{stats.missionsPublished}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
                <CardTitle className="text-sm font-medium">En Cours</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                <div className="text-2xl font-bold text-orange-600">{stats.missionsInProgress}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
                <CardTitle className="text-sm font-medium">Terminées</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                <div className="text-2xl font-bold text-green-600">{stats.missionsCompleted}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
                <CardTitle className="text-sm font-medium">Annulées</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                <div className="text-2xl font-bold text-red-600">{stats.missionsCancelled}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Candidatures Reçues</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                <div className="text-2xl font-bold">{stats.totalApplications}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
                <CardTitle className="text-sm font-medium">Acceptées</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                <div className="text-2xl font-bold text-green-600">{stats.acceptedApplications}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
                <CardTitle className="text-sm font-medium">Refusées</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                <div className="text-2xl font-bold text-red-600">{stats.rejectedApplications}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
                <CardTitle className="text-sm font-medium">En Attente</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                <div className="text-2xl font-bold text-yellow-600">{stats.pendingApplications}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sélecteur de période pour les graphiques */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Évolution de mon activité</h3>
          <div className="flex gap-2">
            <Button
              variant={chartPeriod === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartPeriod('week')}
            >
              Par semaine
            </Button>
            <Button
              variant={chartPeriod === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartPeriod('month')}
            >
              Par mois
            </Button>
          </div>
        </div>

        {/* Graphiques */}
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          <MissionsPublishedChart 
            data={missionsChartData}
            title="Missions publiées"
            description={chartPeriod === 'week' ? '12 dernières semaines' : '12 derniers mois'}
          />
          <ExpensesChart 
            data={expensesChartData}
            title="Dépenses"
            description={chartPeriod === 'week' ? '12 dernières semaines' : '12 derniers mois'}
          />
        </div>

        <ApplicationsReceivedChart 
          data={applicationsChartData}
          title="Candidatures reçues"
          description={chartPeriod === 'week' ? '12 dernières semaines' : '12 derniers mois'}
        />

        <div>
          <h3 className="text-lg font-semibold mb-4">Mon Profil</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
                <CardTitle className="text-sm font-medium">Vues du Profil</CardTitle>
                <Eye className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                <div className="text-2xl font-bold">{stats.profileViews}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
                <CardTitle className="text-sm font-medium">Missions Publiées</CardTitle>
                <FileText className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                <div className="text-2xl font-bold">{stats.totalMissions}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
                <CardTitle className="text-sm font-medium">Taux de Complétion</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                <div className="text-2xl font-bold text-green-600">
                  {stats.totalMissions > 0 
                    ? Math.round((stats.missionsCompleted / stats.totalMissions) * 100) 
                    : 0}%
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Derniers Litiges</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/client/disputes')}
                >
                  Voir tout
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentDisputes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun litige
                </p>
              ) : (
                <div className="space-y-3">
                  {recentDisputes.map((dispute) => (
                    <div key={dispute.id} className="flex items-start justify-between border-b pb-2 last:border-0">
                      <div className="space-y-1">
                        <p className="text-sm font-medium line-clamp-1">{dispute.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(dispute.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      {getStatusBadge(dispute.status)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Notifications Récentes</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/client/notifications')}
                >
                  Voir tout
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentNotifications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucune notification
                </p>
              ) : (
                <div className="space-y-3">
                  {recentNotifications.map((notif) => (
                    <div key={notif.id} className="flex items-start gap-3 border-b pb-2 last:border-0">
                      <Bell className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm line-clamp-2">{notif.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(notif.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </DashboardLayout>
  );
};

export default DashboardClient;
