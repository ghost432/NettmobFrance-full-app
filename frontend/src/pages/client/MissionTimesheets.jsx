import { useState, useEffect } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { clientNavigation } from '@/constants/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, FileText, Clock, CheckCircle, XCircle, Eye, User
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';

const MissionTimesheets = () => {
  useDocumentTitle('Relevés d\'heures mission');
  const { missionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [timesheets, setTimesheets] = useState([]);
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [missionId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [timesheetsResponse, missionResponse] = await Promise.all([
        api.get(`/timesheets/mission/${missionId}/all`),
        api.get(`/missions/${missionId}`)
      ]);
      setTimesheets(timesheetsResponse.data);
      setMission(missionResponse.data);
    } catch (error) {
      console.error('Erreur chargement:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      brouillon: { label: 'Brouillon', color: 'bg-gray-500', icon: FileText },
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

  const displayName = user?.profile?.company_name || user?.email?.split('@')[0] || 'Client';

  const totalApprovedHours = timesheets
    .filter(t => t.status === 'approuve')
    .reduce((sum, t) => sum + parseFloat(t.total_hours || 0), 0);

  const totalPendingHours = timesheets
    .filter(t => t.status === 'soumis')
    .reduce((sum, t) => sum + parseFloat(t.total_hours || 0), 0);

  const totalHours = mission?.total_hours || 0;
  const totalWorked = totalApprovedHours + totalPendingHours;
  const remainingHours = totalHours - totalWorked;

  return (
    <DashboardLayout
      title="Feuilles de temps"
      description="Validation des heures travaillées"
      menuItems={clientNavigation}
      getRoleLabel={() => 'Client'}
      getDisplayName={() => displayName}
    >
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(`/client/mission/${missionId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la mission
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
              <CardTitle className="text-sm font-medium">Approuvées</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold text-green-600">{totalApprovedHours}h</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">En attente</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold text-blue-600">{totalPendingHours}h</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">Restantes</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold text-orange-600">
                {Math.max(0, remainingHours)}h
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progression</span>
                <span className="font-medium">{Math.min(100, Math.round((totalWorked / totalHours) * 100))}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-600 h-3 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (totalWorked / totalHours) * 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timesheets List */}
        <Card>
          <CardHeader>
            <CardTitle>Feuilles de temps soumises</CardTitle>
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
                  Les auto-mobs n'ont pas encore soumis de feuilles de temps
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {timesheets.map((timesheet) => (
                  <div
                    key={timesheet.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{timesheet.automob_name}</span>
                        {getStatusBadge(timesheet.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          {new Date(timesheet.period_start).toLocaleDateString('fr-FR')} - {new Date(timesheet.period_end).toLocaleDateString('fr-FR')}
                        </span>
                        <span>•</span>
                        <span className="font-semibold">{timesheet.total_hours}h</span>
                        <span>•</span>
                        <span>{timesheet.entry_count || 0} entrée(s)</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/client/timesheet/${timesheet.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {timesheet.status === 'soumis' ? 'Valider' : 'Voir détails'}
                    </Button>
                  </div>
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
