import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { useEffect, useState } from 'react';
import { toast } from '@/components/ui/toast';

export const MissionTypes = () => {
  useDocumentTitle('Types de Mission - Admin');
  
  const [types, setTypes] = useState([]);
  const [newType, setNewType] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMissionTypes();
  }, []);

  const fetchMissionTypes = async () => {
    try {
      const response = await api.get('/admin/mission-types');
      setTypes(response.data.types);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAddType = async () => {
    if (!newType.trim()) return;
    
    setSaving(true);
    try {
      await api.post('/admin/mission-types', { name: newType });
      toast.success('Type ajouté');
      setNewType('');
      fetchMissionTypes();
    } catch (error) {
      console.error('Error:', error.response?.data);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'ajout');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/mission-types/${id}`);
      toast.success('Type supprimé');
      fetchMissionTypes();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <DashboardLayout
      title="Types de Mission"
      menuItems={adminNavigation}
      getRoleLabel={() => 'Administrateur'}
    >
      <Card>
        <CardHeader>
          <CardTitle>Gestion des types de mission</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input 
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              placeholder="Nouveau type de mission"
            />
            <Button onClick={handleAddType} disabled={saving}>
              {saving ? 'Ajout...' : 'Ajouter'}
            </Button>
          </div>
          
          {loading ? (
            <div>Chargement...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {types.map(type => (
                  <TableRow key={type.id}>
                    <TableCell>{type.id}</TableCell>
                    <TableCell>{type.name}</TableCell>
                    <TableCell>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDelete(type.id)}
                      >
                        Supprimer
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

export default MissionTypes;
