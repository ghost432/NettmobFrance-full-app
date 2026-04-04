import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { useEffect, useState } from 'react';
import { Smartphone, Monitor, Globe, Calendar } from 'lucide-react';

export const PWAStats = () => {
  useDocumentTitle('Statistiques PWA - Admin');
  
  const [stats, setStats] = useState({
    total: 0,
    byPlatform: [],
    byBrowser: [],
    recentInstalls: [],
    byDay: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPWAStats();
  }, []);

  const fetchPWAStats = async () => {
    try {
      const response = await api.get('/admin/pwa-stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching PWA stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadge = (role) => {
    const variants = {
      'automob': { text: 'Automob', variant: 'default' },
      'client': { text: 'Client', variant: 'secondary' },
      'admin': { text: 'Admin', variant: 'destructive' }
    };
    const config = variants[role] || { text: role, variant: 'default' };
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const getPlatformIcon = (platform) => {
    if (platform.includes('Android')) return '🤖';
    if (platform.includes('iOS') || platform.includes('iPhone')) return '🍎';
    if (platform.includes('Windows')) return '🪟';
    if (platform.includes('Mac')) return '💻';
    if (platform.includes('Linux')) return '🐧';
    return '📱';
  };

  return (
    <DashboardLayout
      title="Statistiques PWA"
      description="Suivez les installations de l'application PWA"
      menuItems={adminNavigation}
    >
      <div className="space-y-6">
        {/* Statistiques globales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">Total Installations</CardTitle>
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                PWA installées au total
              </p>
            </CardContent>
          </Card>

          {stats.byPlatform.length > 0 && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
                  <CardTitle className="text-sm font-medium">Plateforme principale</CardTitle>
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                  <div className="text-2xl font-bold flex items-center gap-2">
                    {getPlatformIcon(stats.byPlatform[0].platform)}
                    {stats.byPlatform[0].platform}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.byPlatform[0].count} installation{stats.byPlatform[0].count > 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>

              {stats.byBrowser.length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
                    <CardTitle className="text-sm font-medium">Navigateur principal</CardTitle>
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                    <div className="text-2xl font-bold">{stats.byBrowser[0].browser}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.byBrowser[0].count} installation{stats.byBrowser[0].count > 1 ? 's' : ''}
                    </p>
                  </CardContent>
                </Card>
              )}

              {stats.byDay.length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
                    <CardTitle className="text-sm font-medium">Aujourd'hui</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                    <div className="text-2xl font-bold">{stats.byDay[0].count}</div>
                    <p className="text-xs text-muted-foreground">
                      Nouvelle{stats.byDay[0].count > 1 ? 's' : ''} installation{stats.byDay[0].count > 1 ? 's' : ''}
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        {/* Répartition par plateforme */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Par Plateforme</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.byPlatform.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getPlatformIcon(item.platform)}</span>
                      <span className="text-sm font-medium">{item.platform}</span>
                    </div>
                    <Badge variant="outline">{item.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Par Navigateur</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.byBrowser.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.browser}</span>
                    <Badge variant="outline">{item.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Graphique des 7 derniers jours */}
        {stats.byDay.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Installations (7 derniers jours)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.byDay.map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <span className="text-sm font-medium w-24">
                      {new Date(item.date).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short'
                      })}
                    </span>
                    <div className="flex-1 bg-secondary rounded-full h-8 overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-300"
                        style={{
                          width: `${(item.count / Math.max(...stats.byDay.map(d => d.count))) * 100}%`
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold w-12 text-right">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Liste des installations récentes */}
        <Card>
          <CardHeader>
            <CardTitle>Installations Récentes (50 dernières)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Chargement...</p>
            ) : stats.recentInstalls.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Aucune installation PWA pour le moment</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Plateforme</TableHead>
                    <TableHead>Navigateur</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentInstalls.map((install) => (
                    <TableRow key={install.id}>
                      <TableCell className="font-medium">{install.user_name}</TableCell>
                      <TableCell>{install.email}</TableCell>
                      <TableCell>{getRoleBadge(install.role)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span>{getPlatformIcon(install.platform)}</span>
                          <span className="text-sm">{install.platform}</span>
                        </div>
                      </TableCell>
                      <TableCell>{install.browser}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{install.ip_address}</TableCell>
                      <TableCell className="text-sm">{formatDate(install.installed_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PWAStats;
