import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import api from '@/lib/api';
import { useEffect, useState } from 'react';
import { Pagination } from '@/components/ui/pagination';
import { usePagination } from '@/hooks/usePagination';

export const ArchivedMissions = () => {
  useDocumentTitle('Missions Archivées - Admin');
  
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const { currentItems: paginatedMissions, currentPage, totalPages, totalItems, setCurrentPage } = usePagination(missions, 15);

  useEffect(() => {
    fetchArchivedMissions();
  }, []);

  const fetchArchivedMissions = async () => {
    try {
      const response = await api.get('/admin/missions/archived');
      setMissions(response.data.missions);
    } catch (error) {
      console.error('Error fetching archived missions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="Missions Archivées"
      menuItems={adminNavigation}
      getRoleLabel={() => 'Administrateur'}
    >
      <Card>
        <CardHeader>
          <CardTitle>Liste des missions archivées</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Chargement...</div>
          ) : (
            <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date d'archivage</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMissions.map(mission => (
                  <TableRow key={mission.id}>
                    <TableCell>{mission.id}</TableCell>
                    <TableCell>{mission.title}</TableCell>
                    <TableCell>{mission.client?.company_name}</TableCell>
                    <TableCell>{new Date(mission.archived_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <button className="text-blue-600 hover:underline">
                        Détails
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={15} totalItems={totalItems} />
            </>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default ArchivedMissions;
