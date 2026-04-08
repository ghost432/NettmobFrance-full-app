import { useState, useEffect } from 'react';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/ui/pagination';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  UserPlus,
  Edit,
  Trash2,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Users,
  Building2,
  UserCog,
  Mail,
  User as UserIcon,
  CheckCircle2,
  XCircle as XCircleIcon,
  Download
} from 'lucide-react';
import { exportToCSV } from '@/utils/exportCSV';
import api from '@/lib/api';
import { TableSkeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const UsersManagement = () => {
  useDocumentTitle('Gestion des Utilisateurs');
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${cleanPath}`;
  };

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Form data
  const [selectedUser, setSelectedUser] = useState(null);
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    role: 'automob',
    first_name: '',
    last_name: '',
    phone: '',
    company_name: ''
  });

  const [editForm, setEditForm] = useState({
    email: '',
    verified: false,
    first_name: '',
    last_name: '',
    phone: '',
    company_name: ''
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (err) {
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!createForm.email || !createForm.password || !createForm.role) {
      toast.error('Email, mot de passe et rôle sont requis');
      return;
    }

    setSubmitting(true);
    try {
      const userData = createForm.role === 'admin' ? {} : {
        first_name: createForm.first_name,
        last_name: createForm.last_name,
        phone: createForm.phone,
        ...(createForm.role === 'client' && { company_name: createForm.company_name })
      };

      await api.post('/users/create', {
        email: createForm.email,
        password: createForm.password,
        role: createForm.role,
        userData
      });

      toast.success('Utilisateur créé avec succès');
      setShowCreateDialog(false);
      setCreateForm({
        email: '',
        password: '',
        role: 'automob',
        first_name: '',
        last_name: '',
        phone: '',
        company_name: ''
      });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = async () => {
    if (!editForm.email) {
      toast.error('Email requis');
      return;
    }

    setSubmitting(true);
    try {
      const userData = selectedUser.role === 'admin' ? {} : {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        phone: editForm.phone,
        ...(selectedUser.role === 'client' && { company_name: editForm.company_name })
      };

      await api.put(`/users/${selectedUser.id}/edit`, {
        email: editForm.email,
        verified: editForm.verified,
        userData
      });

      toast.success('Utilisateur modifié avec succès');
      setShowEditDialog(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la modification');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    setSubmitting(true);
    try {
      await api.delete(`/users/${selectedUser.id}`);
      toast.success('Utilisateur supprimé avec succès');
      setShowDeleteDialog(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendVerification = async (userId) => {
    try {
      await api.post(`/users/${userId}/resend-verification`);
      toast.success('Email de vérification renvoyé avec succès');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'envoi de l\'email');
    }
  };

  const openEditDialog = (userData) => {
    setSelectedUser(userData);
    setEditForm({
      email: userData.email,
      verified: userData.verified,
      first_name: userData.first_name || '',
      last_name: userData.last_name || '',
      phone: userData.phone || '',
      company_name: userData.company_name || ''
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (userData) => {
    setSelectedUser(userData);
    setShowDeleteDialog(true);
  };

  const filteredUsers = users.filter(u => {
    if (filter === 'automob' && u.role !== 'automob') return false;
    if (filter === 'client' && u.role !== 'client') return false;
    if (filter === 'admin' && u.role !== 'admin') return false;
    if (filter === 'verified' && !u.verified) return false;
    if (filter === 'unverified' && u.verified) return false;
    if (searchTerm && !u.email.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !u.nom_complet?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const { currentItems: paginatedUsers, currentPage, totalPages, totalItems, setCurrentPage } = usePagination(filteredUsers, 15);

  const stats = {
    total: users.length,
    automob: users.filter(u => u.role === 'automob').length,
    client: users.filter(u => u.role === 'client').length,
    admin: users.filter(u => u.role === 'admin').length,
    verified: users.filter(u => u.verified).length,
  };

  return (
    <DashboardLayout
      title="Gestion des utilisateurs"
      description="Créer, modifier et gérer les comptes utilisateurs"
      menuItems={adminNavigation}
      getRoleLabel={() => 'Administrateur'}
      getDisplayName={() => user?.email?.split('@')[0] || 'Admin'}
      getAvatarSrc={() => getImageUrl(user?.profile?.profile_picture || user?.profile_picture)}
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-muted-foreground uppercase">Total</p>
                <h3 className="text-2xl font-bold">{stats.total}</h3>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-muted-foreground uppercase">Auto-entrepreneur</p>
                <h3 className="text-2xl font-bold">{stats.automob}</h3>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-muted-foreground uppercase">Entreprises</p>
                <h3 className="text-2xl font-bold">{stats.client}</h3>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-muted-foreground uppercase">Email vérifiés</p>
                <h3 className="text-2xl font-bold">{stats.verified}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barre d'actions */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            <div className="flex gap-2">
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-primary w-full sm:w-auto"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Ajouter un utilisateur
              </Button>
              <Button
                variant="outline"
                onClick={() => exportToCSV(
                  filteredUsers.map(u => ({
                    email: u.email,
                    role: u.role,
                    nom: u.nom_complet || u.company_name || '',
                    telephone: u.phone || '',
                    verifie: u.id_verified ? 'Oui' : 'Non',
                    inscription: u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : ''
                  })),
                  'utilisateurs',
                  { email: 'Email', role: 'Rôle', nom: 'Nom / Société', telephone: 'Téléphone', verifie: 'Vérifié', inscription: "Date d'inscription" }
                )}
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter CSV
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="automob">Auto-mob</SelectItem>
                  <SelectItem value="client">Clients</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                  <SelectItem value="verified">Vérifiés</SelectItem>
                  <SelectItem value="unverified">Non vérifiés</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Liste des utilisateurs */}
        <Card>
          <CardHeader>
            <CardTitle>Utilisateurs ({filteredUsers.length})</CardTitle>
            <CardDescription>Gérez tous les comptes de la plateforme</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton rows={8} cols={6} />
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun utilisateur trouvé
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Photo</TableHead>
                      <TableHead>Nom / Société</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Date d'inscription</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((userData) => {
                      // Formater le nom complet selon le rôle
                      let displayName = 'Sans nom';
                      if (userData.nom_complet && userData.nom_complet.trim() !== '' && userData.nom_complet !== 'Sans nom') {
                        displayName = userData.nom_complet;
                      } else if (userData.role === 'client' && userData.company_name) {
                        displayName = userData.company_name;
                      }

                      // Formater la date de création avec validation stricte
                      let createdDate = 'N/A';
                      if (userData.created_at) {
                        try {
                          const date = new Date(userData.created_at);
                          if (!isNaN(date.getTime()) && date.getFullYear() > 2000) {
                            createdDate = date.toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            });
                          }
                        } catch (e) {
                          console.error('Erreur format date created_at:', e);
                        }
                      }

                      const isVerified = userData.id_verified === 1 || userData.id_verified === true;

                      return (
                        <TableRow key={userData.id}>
                          <TableCell>
                            <div className="rounded-full overflow-hidden w-10 h-10 flex-shrink-0 bg-primary/10 flex items-center justify-center border border-border/50">
                              {userData.profile_picture ? (
                                <img 
                                  src={getImageUrl(userData.profile_picture)} 
                                  alt="Avatar" 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                    e.target.nextElementSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div className={userData.profile_picture ? "hidden w-full h-full items-center justify-center" : "w-full h-full flex items-center justify-center"}>
                                {userData.role === 'client' ? <Building2 className="h-5 w-5 text-primary" /> : <UserIcon className="h-5 w-5 text-primary" />}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            <span className={displayName === 'Sans nom' ? 'text-muted-foreground italic' : ''}>
                              {displayName}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn(
                              "capitalize font-bold text-[10px] tracking-tight",
                              userData.role === 'admin' ? 'bg-red-100 text-red-700 border-red-200' :
                              userData.role === 'automob' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                              'bg-purple-100 text-purple-700 border-purple-200'
                            )}>
                              {userData.role === 'admin' ? 'Admin' : userData.role === 'automob' ? 'Auto-mob' : 'Client'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {isVerified ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 gap-1 font-bold text-[10px]">
                                <CheckCircle2 className="h-3 w-3" />
                                Vérifié
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200 gap-1 font-bold text-[10px]">
                                <XCircleIcon className="h-3 w-3" />
                                Non vérifié
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {userData.email}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {createdDate}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {(!userData.verified) && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleResendVerification(userData.id)}
                                  title="Renvoyer l'email de vérification"
                                  className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                >
                                  <Mail className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openEditDialog(userData)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {userData.id !== user.id && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openDeleteDialog(userData)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={15}
              totalItems={totalItems}
            />
          </CardContent>
        </Card>
      </div>

      {/* Dialog Créer utilisateur */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
            <DialogDescription>
              Remplissez les informations pour créer un compte utilisateur
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-role">Type de compte *</Label>
              <Select
                value={createForm.role}
                onValueChange={(value) => setCreateForm({ ...createForm, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrateur</SelectItem>
                  <SelectItem value="automob">Auto-entrepreneur</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-email">Email *</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="email@exemple.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-password">Mot de passe *</Label>
                <Input
                  id="create-password"
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {createForm.role !== 'admin' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-first-name">Prénom</Label>
                    <Input
                      id="create-first-name"
                      value={createForm.first_name}
                      onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })}
                      placeholder="Jean"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-last-name">Nom</Label>
                    <Input
                      id="create-last-name"
                      value={createForm.last_name}
                      onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })}
                      placeholder="Dupont"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-phone">Téléphone</Label>
                  <Input
                    id="create-phone"
                    type="tel"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>

                {createForm.role === 'client' && (
                  <div className="space-y-2">
                    <Label htmlFor="create-company">Nom de l'entreprise</Label>
                    <Input
                      id="create-company"
                      value={createForm.company_name}
                      onChange={(e) => setCreateForm({ ...createForm, company_name: e.target.value })}
                      placeholder="Entreprise SARL"
                    />
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateUser} disabled={submitting}>
              {submitting ? 'Création...' : 'Créer l\'utilisateur'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifier utilisateur */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>
              Modifiez les informations de {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-verified"
                checked={editForm.verified}
                onChange={(e) => setEditForm({ ...editForm, verified: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="edit-verified">Compte vérifié</Label>
            </div>

            {selectedUser?.role !== 'admin' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-first-name">Prénom</Label>
                    <Input
                      id="edit-first-name"
                      value={editForm.first_name}
                      onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-last-name">Nom</Label>
                    <Input
                      id="edit-last-name"
                      value={editForm.last_name}
                      onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Téléphone</Label>
                  <Input
                    id="edit-phone"
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>

                {selectedUser?.role === 'client' && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-company">Nom de l'entreprise</Label>
                    <Input
                      id="edit-company"
                      value={editForm.company_name}
                      onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleEditUser} disabled={submitting}>
              {submitting ? 'Modification...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Supprimer utilisateur */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{selectedUser?.email}</strong> ?
              Cette action est irréversible et supprimera toutes les données associées.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={submitting}
            >
              {submitting ? 'Suppression...' : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default UsersManagement;
