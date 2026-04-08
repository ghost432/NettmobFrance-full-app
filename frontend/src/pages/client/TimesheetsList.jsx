import { useState, useEffect } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { clientNavigation } from '@/constants/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, XCircle, Eye, Calendar, User, Briefcase } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { Pagination } from '@/components/ui/pagination';
import { usePagination } from '@/hooks/usePagination';

const TimesheetsList = () => {
  useDocumentTitle('Relevés d\'heures');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected

  useEffect(() => {
    fetchTimesheets();
  }, []);

  const fetchTimesheets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/timesheets/client/all');
      setTimesheets(response.data || []);
    } catch (error) {
      console.error('Erreur chargement feuilles de temps:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      brouillon: { label: 'Brouillon', color: 'bg-gray-500', icon: Clock },
      soumis: { label: 'En attente', color: 'bg-blue-500', icon: Clock },
      approuve: { label: 'Approuvée', color: 'bg-green-600', icon: CheckCircle },
      rejete: { label: 'Refusée', color: 'bg-red-600', icon: XCircle }
    };
    const variant = variants[status] || variants.brouillon;
    const Icon = variant.icon;
    
    return (
      <Badge className={`${variant.color} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {variant.label}
      </Badge>
    );
  };

  const filteredTimesheets = timesheets.filter(ts => {
    if (filter === 'all') return true;
    if (filter === 'pending') return ts.status === 'soumis';
    if (filter === 'approved') return ts.status === 'approuve';
    if (filter === 'rejected') return ts.status === 'rejete';
    return true;
  });

  const { currentItems: paginatedTimesheets, currentPage, totalPages, totalItems, setCurrentPage } = usePagination(filteredTimesheets, 15);

  const pendingCount = timesheets.filter(ts => ts.status === 'soumis').length;
  const approvedCount = timesheets.filter(ts => ts.status === 'approuve').length;
  const rejectedCount = timesheets.filter(ts => ts.status === 'rejete').length;

  const displayName = user?.profile?.company_name || user?.email || 'Client';

  return (
    <DashboardLayout
      title="Demandes de Validation d'Heures"
      description="Gérez toutes les demandes de validation d'heures reçues"
      menuItems={clientNavigation}
      getRoleLabel={() => 'Client'}
      getDisplayName={() => displayName}
    >
      <div className="space-y-6">
        {/* Filtres */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                className={filter === 'all' ? 'bg-client hover:bg-client-dark text-white' : ''}
              >
                Toutes ({timesheets.length})
              </Button>
              <Button
                variant={filter === 'pending' ? 'default' : 'outline'}
                onClick={() => setFilter('pending')}
                className={filter === 'pending' ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''}
              >
                <Clock className="h-4 w-4 mr-2" />
                En attente ({pendingCount})
              </Button>
              <Button
                variant={filter === 'approved' ? 'default' : 'outline'}
                onClick={() => setFilter('approved')}
                className={filter === 'approved' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approuvées ({approvedCount})
              </Button>
              <Button
                variant={filter === 'rejected' ? 'default' : 'outline'}
                onClick={() => setFilter('rejected')}
                className={filter === 'rejected' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Refusées ({rejectedCount})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Liste des demandes */}
        <Card>
          <CardHeader>
            <CardTitle>
              {filter === 'pending' && 'Demandes en attente'}
              {filter === 'approved' && 'Demandes approuvées'}
              {filter === 'rejected' && 'Demandes refusées'}
              {filter === 'all' && 'Toutes les demandes'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Chargement...</p>
              </div>
            ) : filteredTimesheets.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">Aucune demande</p>
                <p className="text-sm text-muted-foreground">
                  {filter === 'pending' && 'Aucune demande en attente de validation'}
                  {filter === 'approved' && 'Aucune demande approuvée'}
                  {filter === 'rejected' && 'Aucune demande refusée'}
                  {filter === 'all' && 'Aucune demande reçue'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedTimesheets.map((timesheet) => (
                  <div
                    key={timesheet.id}
                    className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusBadge(timesheet.status)}
                          <span className="text-sm text-muted-foreground">
                            #{timesheet.id}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <a 
                            href={`/public/automob/${encodeURIComponent(`${timesheet.automob_first_name}-${timesheet.automob_last_name}`.toLowerCase())}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {timesheet.automob_first_name} {timesheet.automob_last_name}
                          </a>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Briefcase className="h-4 w-4" />
                          <span>{timesheet.mission_name}</span>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {timesheet.start_date && timesheet.end_date ? (
                                <>
                                  Du {new Date(timesheet.start_date).toLocaleDateString('fr-FR')} au{' '}
                                  {new Date(timesheet.end_date).toLocaleDateString('fr-FR')}
                                </>
                              ) : timesheet.period_start && timesheet.period_end ? (
                                <>
                                  Du {new Date(timesheet.period_start).toLocaleDateString('fr-FR')} au{' '}
                                  {new Date(timesheet.period_end).toLocaleDateString('fr-FR')}
                                </>
                              ) : (
                                'Période non définie'
                              )}
                            </span>
                          </div>
                          <div className="font-semibold text-foreground">
                            {timesheet.total_hours}h
                          </div>
                        </div>

                        {timesheet.status === 'soumis' && timesheet.submitted_at && (
                          <p className="text-xs text-muted-foreground">
                            Soumis le {new Date(timesheet.submitted_at).toLocaleDateString('fr-FR')} à{' '}
                            {new Date(timesheet.submitted_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => navigate(`/client/timesheet/${timesheet.id}`)}
                          className="bg-client hover:bg-client-dark text-white"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir détails
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={15} totalItems={totalItems} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TimesheetsList;
