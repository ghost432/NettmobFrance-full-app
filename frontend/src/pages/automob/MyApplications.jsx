import { useState, useEffect } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { usePageTitle } from '@/hooks/usePageTitle';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { automobNavigation } from '@/constants/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Clock, Search, CheckCircle, XCircle, Calendar, Briefcase,
  MapPin, Euro, Building2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { Pagination } from '@/components/ui/pagination';
import { usePagination } from '@/hooks/usePagination';

const MyApplications = () => {
  useDocumentTitle('Mes Candidatures');
  usePageTitle('Mes Candidatures');
  
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      // Note: Cette route doit être créée côté backend
      const response = await api.get('/missions/my-applications');
      setApplications(response.data);
    } catch (error) {
      console.error('Erreur chargement candidatures:', error);
      toast.error('Erreur lors du chargement de vos candidatures');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      en_attente: { 
        variant: 'default', 
        label: 'En attente',
        icon: <Clock className="h-3 w-3 mr-1" />
      },
      accepte: { 
        variant: 'secondary', 
        label: 'Accepté',
        icon: <CheckCircle className="h-3 w-3 mr-1" />
      },
      refuse: { 
        variant: 'destructive', 
        label: 'Refusé',
        icon: <XCircle className="h-3 w-3 mr-1" />
      }
    };
    const config = variants[status] || variants.en_attente;
    return (
      <Badge variant={config.variant} className="flex items-center w-fit">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const filteredApplications = applications.filter(app =>
    app.mission_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { currentItems: paginatedApplications, currentPage, totalPages, totalItems, setCurrentPage } = usePagination(filteredApplications, 15);

  const displayName = () => {
    if (user?.profile?.first_name && user?.profile?.last_name) {
      return `${user.profile.first_name} ${user.profile.last_name}`;
    }
    return user?.email?.split('@')[0] || 'Auto-mob';
  };

  return (
    <DashboardLayout
      title="Mes Candidatures"
      description="Suivez l'état de vos candidatures"
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
              placeholder="Rechercher une candidature..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">En attente</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold">
                {applications.filter(a => a.status === 'en_attente').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Candidatures en cours d'examen
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">Acceptées</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold">
                {applications.filter(a => a.status === 'accepte').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Missions confirmées
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">Refusées</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold">
                {applications.filter(a => a.status === 'refuse').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Candidatures non retenues
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle>Toutes mes candidatures</CardTitle>
            <CardDescription>
              {filteredApplications.length} candidature(s) au total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Chargement...</p>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Aucune candidature</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Commencez par postuler à des missions
                </p>
                <Button onClick={() => window.location.href = '/automob/missions'}>
                  Voir les missions disponibles
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mission</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Date de candidature</TableHead>
                      <TableHead>Période</TableHead>
                      <TableHead>Tarif</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedApplications.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{application.mission_name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <MapPin className="h-3 w-3" />
                              {application.mission_city}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{application.client_name || 'Client'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {new Date(application.created_at).toLocaleDateString('fr-FR')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{new Date(application.mission_start_date).toLocaleDateString('fr-FR')}</div>
                            <div className="text-xs text-muted-foreground">
                              au {new Date(application.mission_end_date).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <Euro className="h-3 w-3" />
                            {application.mission_hourly_rate}€/h
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(application.status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={15} totalItems={totalItems} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MyApplications;
