import { useState, useEffect } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Briefcase,
  User,
  Phone,
  Mail,
  MapPin,
  Euro
} from 'lucide-react';
import { toast } from '@/components/ui/toast';
import api from '@/lib/api';

const ApplicationsReceived = () => {
  useDocumentTitle('Demandes Reçues - Admin');
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, en_attente, accepte, refuse
  const [currentPage, setCurrentPage] = useState(1);
  
  const ITEMS_PER_PAGE = 15;

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/missions/applications/received');
      console.log('📋 Applications reçues:', response.data);
      setApplications(response.data.applications || []);
    } catch (err) {
      console.error('❌ Erreur chargement applications:', err);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      await api.put(`/missions/applications/${applicationId}/status`, { status: newStatus });
      toast.success(`Demande ${newStatus === 'accepte' ? 'acceptée' : 'refusée'} avec succès`);
      fetchApplications();
    } catch (err) {
      console.error('❌ Erreur modification statut:', err);
      toast.error('Erreur lors de la modification du statut');
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'en_attente':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">En attente</Badge>;
      case 'accepte':
        return <Badge className="bg-green-100 text-green-800">Acceptée</Badge>;
      case 'refuse':
        return <Badge variant="destructive">Refusée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  const stats = {
    total: applications.length,
    en_attente: applications.filter(a => a.status === 'en_attente').length,
    accepte: applications.filter(a => a.status === 'accepte').length,
    refuse: applications.filter(a => a.status === 'refuse').length,
  };

  return (
    <DashboardLayout
      title="Demandes Reçues"
      description="Gérer les demandes de candidature aux missions"
      menuItems={adminNavigation}
      getRoleLabel={() => 'Administrateur'}
      getDisplayName={() => currentUser?.email?.split('@')[0] || 'Admin'}
    >
      <div className="space-y-6">
        {/* Statistiques */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{stats.en_attente}</div>
              <p className="text-xs text-muted-foreground">En attente</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.accepte}</div>
              <p className="text-xs text-muted-foreground">Acceptées</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{stats.refuse}</div>
              <p className="text-xs text-muted-foreground">Refusées</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Toutes les demandes</CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant={filter === 'all' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  Toutes
                </Button>
                <Button 
                  variant={filter === 'en_attente' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setFilter('en_attente')}
                >
                  En attente
                </Button>
                <Button 
                  variant={filter === 'accepte' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setFilter('accepte')}
                >
                  Acceptées
                </Button>
                <Button 
                  variant={filter === 'refuse' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setFilter('refuse')}
                >
                  Refusées
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucune demande à afficher
              </div>
            ) : (
              <div className="space-y-4">
                {filteredApplications.map(app => (
                  <Card key={app.id} className="border-l-4 border-l-primary">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {/* En-tête */}
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-5 w-5 text-primary" />
                              <h3 className="font-semibold text-lg">{app.mission_name || app.mission_city}</h3>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              {app.mission_city}
                            </div>
                          </div>
                          {getStatusBadge(app.status)}
                        </div>

                        {/* Informations candidat */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                          <div>
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{app.automob_name || 'N/A'}</span>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span>{app.email || 'N/A'}</span>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{app.phone || 'N/A'}</span>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 text-sm">
                              <Euro className="h-4 w-4 text-muted-foreground" />
                              <span>{app.hourly_rate ? `${app.hourly_rate}€/h` : 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Message */}
                        {app.message && (
                          <div className="pt-4 border-t">
                            <p className="text-sm text-muted-foreground mb-1">Message du candidat:</p>
                            <p className="text-sm">{app.message}</p>
                          </div>
                        )}

                        {/* Dates */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-4 border-t">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Candidature: {formatDate(app.created_at)}
                          </div>
                          {app.mission_start_date && (
                            <div>
                              Mission: {formatDate(app.mission_start_date)}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-4 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/missions/${app.mission_id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Voir mission
                          </Button>
                          {app.status === 'en_attente' && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleStatusChange(app.id, 'accepte')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Accepter
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleStatusChange(app.id, 'refuse')}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Refuser
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ApplicationsReceived;
