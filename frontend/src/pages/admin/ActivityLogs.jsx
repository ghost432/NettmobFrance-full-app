import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { useEffect, useState } from 'react';

export const ActivityLogs = () => {
  useDocumentTitle('Journaux d\'Activité - Admin');
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityLogs();
  }, []);

  const fetchActivityLogs = async () => {
    try {
      const response = await api.get('/admin/activity-logs');
      setLogs(response.data.logs);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeVariant = (actionType) => {
    if (actionType.includes('created') || actionType.includes('registered')) {
      return 'default';
    }
    if (actionType.includes('submitted') || actionType.includes('accepted')) {
      return 'default';
    }
    if (actionType.includes('rejected') || actionType.includes('deleted')) {
      return 'destructive';
    }
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
        <CardHeader>
          <CardTitle>Historique des activités</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Chargement...</div>
          ) : (
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
                    <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
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
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default ActivityLogs;
