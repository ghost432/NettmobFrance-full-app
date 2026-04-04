import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { automobNavigation } from '@/constants/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, FileText, Clock, CheckCircle, XCircle, AlertCircle, Eye, Plus
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';

const MissionTimesheets = () => {
  useDocumentTitle('Feuilles de Temps');
  const { missionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [timesheets, setTimesheets] = useState([]);
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimesheets();
  }, [missionId]);

  const fetchTimesheets = async () => {
    try {
      setLoading(true);
      const [timesheetsResponse, missionResponse] = await Promise.all([
        api.get(`/timesheets/mission/${missionId}`),
        api.get(`/missions/${missionId}`)
      ]);
      setTimesheets(timesheetsResponse.data);
      setMission(missionResponse.data);
    } catch (error) {
      console.error('Erreur chargement feuilles de temps:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      brouillon: {
        variant: 'secondary',
        label: 'Brouillon',
        icon: <FileText className="h-3 w-3 mr-1" />,
        className: 'bg-gray-500'
      },
      soumis: {
        variant: 'default',
        label: 'En attente',
        icon: <Clock className="h-3 w-3 mr-1" />,
        className: 'bg-blue-500'
      },
      approuve: {
        variant: 'default',
        label: 'Approuvé',
        icon: <CheckCircle className="h-3 w-3 mr-1" />,
        className: 'bg-green-500'
      },
      rejete: {
        variant: 'destructive',
        label: 'Rejeté',
        icon: <XCircle className="h-3 w-3 mr-1" />
      }
    };
    const config = variants[status] || variants.brouillon;
    return (
      <Badge variant={config.variant} className={`flex items-center w-fit ${config.className || ''}`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getPeriodLabel = (timesheet) => {
    const start = new Date(timesheet.period_start).toLocaleDateString('fr-FR');
    const end = new Date(timesheet.period_end).toLocaleDateString('fr-FR');
    
    if (timesheet.period_type === 'jour') {
      return `${start}`;
    } else if (timesheet.period_type === 'semaine') {
      return `${start} - ${end}`;
    } else {
      return `${start} - ${end}`;
    }
  };

  const displayName = () => {
    if (user?.profile?.first_name && user?.profile?.last_name) {
      return `${user.profile.first_name} ${user.profile.last_name}`;
    }
    return user?.email?.split('@')[0] || 'Auto-mob';
  };

  const totalApprovedHours = timesheets
    .filter(t => t.status === 'approuve')
    .reduce((sum, t) => sum + parseFloat(t.total_hours || 0), 0);

  const totalPendingHours = timesheets
    .filter(t => t.status === 'soumis')
    .reduce((sum, t) => sum + parseFloat(t.total_hours || 0), 0);

  // Total des heures enregistrées (toutes les feuilles)
  const totalRecordedHours = timesheets
    .reduce((sum, t) => sum + parseFloat(t.total_hours || 0), 0);

  const totalHours = parseFloat(mission?.total_hours) || 0;
  const remainingToRecord = totalHours - totalRecordedHours;
  const isCompleted = remainingToRecord <= 0;
  const draftTimesheet = timesheets.find(t => t.status === 'brouillon');

  const handleCreateTimesheet = () => {
    if (draftTimesheet) {
      navigate(`/automob/timesheet/${draftTimesheet.id}`);
    } else {
      navigate(`/automob/timesheet/create/${missionId}`);
    }
  };

  return (
    <DashboardLayout
      title="Feuilles de temps"
      description="Historique de vos pointages"
      menuItems={automobNavigation}
      getRoleLabel={() => 'Auto-mob'}
      getDisplayName={displayName}
    >
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/automob/my-missions')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à mes missions
        </Button>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">Total heures</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold">{totalHours}h</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">Déjà soumises</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold text-blue-600">{totalRecordedHours}h</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">En validation</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold text-orange-600">{totalPendingHours}h</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">À soumettre</CardTitle>
              <AlertCircle className={`h-4 w-4 ${isCompleted ? 'text-gray-500' : 'text-red-600'}`} />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className={`text-2xl font-bold ${isCompleted ? 'text-gray-500' : 'text-red-600'}`}>
                {Math.max(0, remainingToRecord)}h
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barre de progression */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Heures enregistrées</span>
                <span className="font-medium">{Math.min(100, Math.round((totalRecordedHours / totalHours) * 100))}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-automob h-3 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (totalRecordedHours / totalHours) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{totalRecordedHours}h déjà enregistrées</span>
                <span>{Math.max(0, remainingToRecord)}h restantes</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timesheets List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle>Historique</CardTitle>
              {!isCompleted && (
                <Button
                  onClick={handleCreateTimesheet}
                  className="bg-automob hover:bg-automob-dark text-white w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">{draftTimesheet ? 'Continuer le pointage' : 'Nouveau pointage'}</span>
                  <span className="sm:hidden">{draftTimesheet ? 'Continuer' : 'Nouveau'}</span>
                </Button>
              )}
              {isCompleted && (
                <Badge variant="default" className="bg-automob w-full sm:w-auto justify-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Heures complètes
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Chargement...</p>
              </div>
            ) : timesheets.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">Aucune feuille de temps</p>
                <p className="text-sm text-muted-foreground">
                  Créez votre première feuille de temps pour cette mission
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {timesheets.map((timesheet) => (
                  <Card key={timesheet.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold">
                              {timesheet.period_type === 'jour' && 'Journée'}
                              {timesheet.period_type === 'semaine' && 'Semaine'}
                              {timesheet.period_type === 'mois' && 'Mois'}
                            </h3>
                            {getStatusBadge(timesheet.status)}
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            {getPeriodLabel(timesheet)}
                          </p>

                          <div className="flex items-center gap-4 text-sm">
                            <span className="font-medium">
                              {timesheet.total_hours}h travaillées
                            </span>
                            <span className="text-muted-foreground">
                              {timesheet.entry_count} entrée(s)
                            </span>
                          </div>

                          {timesheet.status === 'soumis' && timesheet.submitted_at && (
                            <p className="text-xs text-muted-foreground">
                              Soumis le {new Date(timesheet.submitted_at).toLocaleDateString('fr-FR')}
                            </p>
                          )}

                          {timesheet.status === 'approuve' && timesheet.reviewed_at && (
                            <p className="text-xs text-green-600">
                              Approuvé le {new Date(timesheet.reviewed_at).toLocaleDateString('fr-FR')}
                            </p>
                          )}

                          {timesheet.status === 'rejete' && (
                            <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                              <div className="flex gap-2">
                                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-red-900 dark:text-red-100">
                                    Rejeté
                                  </p>
                                  {timesheet.rejection_reason && (
                                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                                      {timesheet.rejection_reason}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/automob/timesheet/${timesheet.id}`)}
                          className="w-full sm:w-auto"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir détails
                        </Button>
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

export default MissionTimesheets;
