import { useState, useEffect } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

export const MissionsList = () => {
  useDocumentTitle('Missions - Admin');
  
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  
  const ITEMS_PER_PAGE = 15;

  useEffect(() => {
    fetchMissions();
  }, []);

  const fetchMissions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/missions');
      setMissions(response.data.missions);
    } catch (error) {
      console.error('Error fetching missions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'ouvert':
        return <Badge variant="outline">Ouvert</Badge>;
      case 'en_cours':
        return <Badge className="bg-blue-100 text-blue-800">En cours</Badge>;
      case 'termine':
        return <Badge className="bg-green-100 text-green-800">Terminé</Badge>;
      case 'annule':
        return <Badge variant="destructive">Annulé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout
      title="Liste des Missions"
      menuItems={adminNavigation}
      getRoleLabel={() => 'Administrateur'}
    >
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Toutes les missions</CardTitle>
            <Button asChild>
              <Link to="/admin/missions/publish">Publier une mission</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Localisation</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Tarif</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {missions.map(mission => (
                  <TableRow key={mission.id}>
                    <TableCell className="font-medium">{mission.title}</TableCell>
                    <TableCell>{mission.client_company}</TableCell>
                    <TableCell>{mission.city} ({mission.postal_code})</TableCell>
                    <TableCell>
                      {formatDate(mission.start_date)} - {formatDate(mission.end_date)}
                    </TableCell>
                    <TableCell>{mission.hourly_rate} €/h</TableCell>
                    <TableCell>{getStatusBadge(mission.status)}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/admin/missions/${mission.id}`}>Détails</Link>
                      </Button>
                    </TableCell>
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

export default MissionsList;
