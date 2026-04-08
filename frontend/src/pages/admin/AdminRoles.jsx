import { useState, useEffect } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, ShieldCheck, BookOpen, Headphones, Star } from 'lucide-react';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { useAuth } from '@/context/AuthContext';

const ROLE_CONFIG = {
  super_admin: {
    label: 'Super Admin',
    description: 'Accès complet à toutes les fonctionnalités',
    icon: Star,
    className: 'bg-purple-600',
  },
  moderateur: {
    label: 'Modérateur',
    description: 'Gestion des utilisateurs, missions et signalements',
    icon: ShieldCheck,
    className: 'bg-blue-600',
  },
  comptable: {
    label: 'Comptable',
    description: 'Accès aux factures, wallet et retraits uniquement',
    icon: BookOpen,
    className: 'bg-green-600',
  },
  support: {
    label: 'Support',
    description: 'Accès aux tickets support et utilisateurs (lecture)',
    icon: Headphones,
    className: 'bg-orange-600',
  },
};

const AdminRoles = () => {
  useDocumentTitle('Gestion des Sous-rôles Admin');
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await api.get('/admin/sub-roles');
      setAdmins(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des admins');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (adminId, newRole) => {
    setUpdating(adminId);
    try {
      await api.put(`/admin/sub-roles/${adminId}`, { admin_role: newRole });
      setAdmins(prev => prev.map(a => a.id === adminId ? { ...a, admin_role: newRole } : a));
      toast.success('Sous-rôle mis à jour');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <DashboardLayout
      title="Gestion des Sous-rôles"
      description="Attribuez des permissions granulaires aux comptes administrateurs"
      menuItems={adminNavigation}
      getRoleLabel={() => 'Administrateur'}
    >
      <div className="space-y-6">
        {/* Légende des rôles */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Object.entries(ROLE_CONFIG).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <Card key={key}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-sm">{config.label}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Table des admins */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Comptes administrateurs ({admins.length})</CardTitle>
            </div>
            <CardDescription>
              Modifiez le sous-rôle de chaque compte admin pour contrôler ses permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : admins.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Aucun admin trouvé</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Sous-rôle actuel</TableHead>
                      <TableHead>Inscription</TableHead>
                      <TableHead>Modifier</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins.map((admin) => {
                      const config = ROLE_CONFIG[admin.admin_role || 'super_admin'];
                      const isSelf = admin.id === user?.id;
                      return (
                        <TableRow key={admin.id}>
                          <TableCell className="font-medium">
                            {admin.email}
                            {isSelf && (
                              <Badge variant="outline" className="ml-2 text-xs">Vous</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={config?.className || 'bg-gray-500'}>
                              {config?.label || admin.admin_role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {admin.created_at ? new Date(admin.created_at).toLocaleDateString('fr-FR') : '-'}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={admin.admin_role || 'super_admin'}
                              onValueChange={(val) => handleRoleChange(admin.id, val)}
                              disabled={isSelf || updating === admin.id}
                            >
                              <SelectTrigger className="w-[160px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
                                  <SelectItem key={key} value={key}>
                                    {cfg.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminRoles;
