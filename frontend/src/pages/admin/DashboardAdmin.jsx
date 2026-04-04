import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingScreen, PageLoader } from '@/components/LoadingScreen';
import {
  Users,
  Briefcase,
  Building2,
  FileText,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Send,
  UserCheck,
  UserX,
  MapPin,
  TrendingUp,
  Star,
  Activity,
  Bell
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import api from '@/lib/api';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

const DashboardAdmin = () => {
  useDocumentTitle('Dashboard Admin');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await api.get('/dashboard/admin/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Erreur chargement statistiques:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <LoadingScreen message="Chargement des statistiques..." />;
  }

  if (!stats) {
    return (
      <DashboardLayout
        title="Dashboard Admin"
        description="Erreur de chargement"
        menuItems={adminNavigation}
        getRoleLabel={() => 'Administrateur'}
      >
        <div className="text-center py-10">
          <p className="text-muted-foreground">Erreur lors du chargement des statistiques</p>
        </div>
      </DashboardLayout>
    );
  }

  // Cards des utilisateurs
  const userCards = [
    {
      title: 'Total Utilisateurs',
      value: stats.users.total,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      title: 'Administrateurs', 
      value: stats.users.byRole.admin?.count || 0,
      icon: Users,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20'
    },
    {
      title: 'Clients',
      value: stats.users.byRole.client?.count || 0, 
      icon: Building2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    },
    {
      title: 'Auto-entrepreneurs',
      value: stats.users.byRole.automob?.count || 0,
      icon: Briefcase,
      color: 'text-green-600', 
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    }
  ];

  // Cards des missions
  const missionCards = [
    {
      title: 'Ouvertes',
      value: stats.missions.byStatus.ouvert || 0,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      title: 'En cours', 
      value: stats.missions.byStatus.en_cours || 0,
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20'
    },
    {
      title: 'Terminées',
      value: stats.missions.byStatus.termine || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      title: 'Fermées',
      value: stats.missions.byStatus.ferme || 0,
      icon: XCircle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100 dark:bg-gray-900/20'
    },
    {
      title: 'Refusées',
      value: stats.missions.byStatus.refuse || 0,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20'
    }
  ];

  // Cards des candidatures
  const applicationCards = [
    {
      title: 'Envoyées',
      value: stats.applications.byStatus.pending || 0,
      icon: Send,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      title: 'Acceptées',
      value: stats.applications.byStatus.accepted || 0,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      title: 'Refusées',
      value: stats.applications.byStatus.rejected || 0,
      icon: UserX,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20'
    },
    {
      title: 'En attente',
      value: stats.applications.byStatus.pending || 0,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20'
    }
  ];

  return (
    <DashboardLayout
      title="Dashboard Admin"
      description={`Bienvenue, ${user?.profile?.first_name ? user.profile.first_name : (user?.email?.split('@')[0] || 'Administrateur')}`}
      menuItems={adminNavigation}
      getRoleLabel={() => 'Administrateur'}
    >
      <div className="space-y-8">
        {/* Cards Utilisateurs */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Utilisateurs
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {userCards.map((card) => (
              <Card key={card.title} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <div className={`p-2 rounded-full ${card.bgColor}`}>
                    <card.icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                  <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cards Missions */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Missions
          </h2>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            {missionCards.map((card) => (
              <Card key={card.title} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <div className={`p-2 rounded-full ${card.bgColor}`}>
                    <card.icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                  <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cards Candidatures */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Send className="h-5 w-5" />
            Candidatures
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {applicationCards.map((card) => (
              <Card key={card.title} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <div className={`p-2 rounded-full ${card.bgColor}`}>
                    <card.icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                  <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Graphiques - Première ligne */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Répartition par villes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Répartition par villes
              </CardTitle>
              <CardDescription>Top 10 des villes d'inscription</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.cityDistribution?.slice(0, 10) || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="city" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tendances d'inscription */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Tendances d'inscription
              </CardTitle>
              <CardDescription>Évolution des inscriptions (6 derniers mois)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.inscriptionTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Graphiques financiers */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Dépenses clients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Dépenses des clients
              </CardTitle>
              <CardDescription>Montants dépensés par mois</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.clientSpending || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}€`, 'Dépensé']} />
                  <Area type="monotone" dataKey="total_spent" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gains automobs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Gains des automobs
              </CardTitle>
              <CardDescription>Montants gagnés par mois</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.automobEarnings || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}€`, 'Gagné']} />
                  <Area type="monotone" dataKey="total_earned" stroke="#ffc658" fill="#ffc658" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top performers */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top 10 automobs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Top 10 Automobs du mois
              </CardTitle>
              <CardDescription>Classement par nombre de missions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topAutomobs?.slice(0, 10).map((automob, index) => (
                  <div key={automob.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-mono text-xs">
                        #{index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">
                          {automob.first_name} {automob.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">{automob.city}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        {automob.missions_count} missions
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {automob.total_earned}€ gagné
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top 10 clients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Top 10 Clients du mois
              </CardTitle>
              <CardDescription>Classement par montant dépensé</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topClients?.slice(0, 10).map((client, index) => (
                  <div key={client.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-mono text-xs">
                        #{index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">{client.company_name}</p>
                        <p className="text-xs text-muted-foreground">{client.city}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-purple-600">
                        {client.total_spent}€ dépensé
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {client.missions_posted} missions
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dernières actions et notifications */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Dernières actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Dernières actions
              </CardTitle>
              <CardDescription>Activité récente du système</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentActions?.slice(0, 10).map((action, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 rounded border">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{action.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(action.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>État des notifications (24h)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">Non lues</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.notifications.unread_count}</p>
                  </div>
                  <Bell className="h-8 w-8 text-blue-500" />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-950/20 border">
                  <div>
                    <p className="font-medium">Total envoyées</p>
                    <p className="text-2xl font-bold text-gray-600">{stats.notifications.total_count}</p>
                  </div>
                  <Bell className="h-8 w-8 text-gray-500" />
                </div>
                <Button 
                  onClick={() => navigate('/admin/notifications')} 
                  className="w-full"
                  variant="outline"
                >
                  Gérer les notifications
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions rapides */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Actions rapides</h2>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Button onClick={() => navigate('/admin/users')} className="h-16 sm:h-20 flex flex-col gap-1 sm:gap-2 text-sm sm:text-base">
              <Users className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-xs sm:text-sm">Gérer les utilisateurs</span>
            </Button>
            <Button onClick={() => navigate('/admin/missions')} className="h-16 sm:h-20 flex flex-col gap-1 sm:gap-2 text-sm sm:text-base">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-xs sm:text-sm">Gérer les missions</span>
            </Button>
            <Button onClick={() => navigate('/admin/verifications')} className="h-16 sm:h-20 flex flex-col gap-1 sm:gap-2 text-sm sm:text-base">
              <UserCheck className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-xs sm:text-sm">Vérifications</span>
            </Button>
            <Button onClick={() => navigate('/admin/broadcast')} className="h-16 sm:h-20 flex flex-col gap-1 sm:gap-2 text-sm sm:text-base">
              <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-xs sm:text-sm">Envoyer notification</span>
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardAdmin;
