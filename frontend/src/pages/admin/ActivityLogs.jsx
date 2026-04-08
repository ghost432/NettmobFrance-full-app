import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import api from '@/lib/api';
import { useEffect, useState } from 'react';
import { exportToCSV } from '@/utils/exportCSV';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/skeleton';

const PAGE_SIZE = 50;

export const ActivityLogs = () => {
  useDocumentTitle('Journaux d\'Activité - Admin');

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchActivityLogs(currentPage);
  }, [currentPage]);

  const fetchActivityLogs = async (page) => {
    setLoading(true);
    try {
      const response = await api.get('/admin/activity-logs', {
        params: { page, limit: PAGE_SIZE }
      });
      setLogs(response.data.logs || []);
      const pagination = response.data.pagination || {};
      setTotalPages(pagination.totalPages || 1);
      setTotalItems(pagination.total || 0);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeVariant = (actionType) => {
    if (actionType.includes('rejected') || actionType.includes('deleted')) return 'destructive';
    return 'default';
  };

  const formatAction = (action) => {
    const actions = {
      'mission_created': '📝 Mission créée',
      'user_registered': '👤 Inscription',
      'application_submitted': '📄 Candidature',
    };
    return actions[action] || action;
  };

  return (
    <DashboardLayout
      title="Journaux d'Activité"
      menuItems={adminNavigation}
      getRoleLabel={() => 'Administrateur'}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Historique des activités</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCSV(
              logs.map(l => ({
                date: new Date(l.timestamp).toLocaleString('fr-FR'),
                utilisateur: l.user_name,
                role: l.user_role,
                action: l.action,
                entite: l.entity_id,
                details: l.description
              })),
              'journaux-activite',
              { date: 'Date', utilisateur: 'Utilisateur', role: 'Rôle', action: 'Action', entite: 'Entité #', details: 'Détails' }
            )}
            disabled={logs.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={8} cols={5} />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entité</TableHead>
                    <TableHead>Détails</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log, index) => (
                    <TableRow key={`${log.action}-${log.entity_id}-${log.timestamp}-${index}`}>
                      <TableCell>{new Date(log.timestamp).toLocaleString('fr-FR')}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.user_name}</div>
                          <div className="text-xs text-muted-foreground">{log.user_role}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getBadgeVariant(log.action)}>
                          {formatAction(log.action)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">#{log.entity_id}</span>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{log.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={PAGE_SIZE}
                totalItems={totalItems}
              />
            </>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default ActivityLogs;
