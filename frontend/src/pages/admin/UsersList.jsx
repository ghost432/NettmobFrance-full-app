import { useState, useEffect } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, XCircle, Search, Filter, Eye, ShieldCheck, ShieldAlert, UserPlus, MoreVertical, Edit, Trash2, UserX, Building2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

const UsersList = () => {
  useDocumentTitle('Gestion des Utilisateurs');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, automob, client, verified, unverified
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const ITEMS_PER_PAGE = 15;
  
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${cleanPath}`;
  };

  const formatDuration = (seconds = 0) => {
    if (!seconds) return '0 min';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const parts = [];
    if (hours) parts.push(`${hours} h`);
    if (minutes) parts.push(`${minutes} min`);
    if (!hours && !minutes) parts.push(`${secs} s`);
    return parts.join(' ');
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users');
      console.log('📊 Utilisateurs reçus:', response.data);
      
      // Debug: afficher les premiers utilisateurs
      if (response.data.length > 0) {
        console.log('👤 Premier utilisateur:', {
          id: response.data[0].id,
          email: response.data[0].email,
          nom_complet: response.data[0].nom_complet,
          created_at: response.data[0].created_at,
          id_verified: response.data[0].id_verified,
          role: response.data[0].role
        });
      }
      
      setUsers(response.data);
    } catch (err) {
      console.error('❌ Erreur chargement utilisateurs:', err);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyUser = async (userId, verified) => {
    try {
      await api.put(`/admin/users/${userId}`, { verified });
      toast.success(`Utilisateur ${verified ? 'vérifié' : 'non vérifié'}`);
      fetchUsers();
    } catch (err) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      setDeleting(true);
      await api.delete(`/admin/users/${selectedUser.id}`);
      toast.success('Utilisateur supprimé avec succès');
      setShowDeleteDialog(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      console.error('Erreur suppression:', err);
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteDialog = (userData) => {
    setSelectedUser(userData);
    setShowDeleteDialog(true);
  };

  const filteredUsers = users.filter(u => {
    if (filter === 'automob' && u.role !== 'automob') return false;
    if (filter === 'client' && u.role !== 'client') return false;
    if (filter === 'verified' && !u.verified) return false;
    if (filter === 'unverified' && u.verified) return false;
    if (searchTerm && !u.email.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !u.nom_complet?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const stats = {
    total: users.length,
    automob: users.filter(u => u.role === 'automob').length,
    client: users.filter(u => u.role === 'client').length,
    verified: users.filter(u => u.verified).length,
    unverified: users.filter(u => !u.verified).length,
    idUnverified: users.filter(u => !u.id_verified || u.id_verified === 0 || u.id_verified === '0').length,
  };

  return (
    <DashboardLayout
      title="Gestion des utilisateurs"
      description="Surveillez les comptes et mettez à jour leur statut"
      menuItems={adminNavigation}
      getRoleLabel={() => 'Administrateur'}
      getDisplayName={() => user?.email?.split('@')[0] || 'Admin'}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/dashboard')}>
              <ArrowLeft className="h-4 w-4" />
              Tableau de bord
            </Button>
            <Button variant="default" size="sm" onClick={() => navigate('/admin/users/new')}>
              <UserPlus className="h-4 w-4 mr-1" />
              Ajouter un utilisateur
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>{filteredUsers.length} utilisateurs filtrés sur {stats.total}</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
              <p className="mt-1 text-2xl font-semibold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Auto-entrepreneurs</p>
              <p className="mt-1 text-2xl font-semibold">{stats.automob}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Entreprises</p>
              <p className="mt-1 text-2xl font-semibold">{stats.client}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Email vérifiés</p>
              <p className="mt-1 text-2xl font-semibold text-green-600">{stats.verified}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Email en attente</p>
              <p className="mt-1 text-2xl font-semibold text-orange-600">{stats.unverified}</p>
            </CardContent>
          </Card>
          <Card className="border-red-200 dark:border-red-900">
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Identité non vérifiée</p>
              <p className="mt-1 text-2xl font-semibold text-red-600">{stats.idUnverified}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative w-full md:flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher par email ou nom..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>Tous</Button>
                <Button variant={filter === 'automob' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('automob')}>Auto-mob</Button>
                <Button variant={filter === 'client' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('client')}>Clients</Button>
                <Button variant={filter === 'verified' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('verified')}>Vérifiés</Button>
                <Button variant={filter === 'unverified' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('unverified')}>Non vérifiés</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Utilisateurs ({filteredUsers.length})</CardTitle>
              <CardDescription>Liste des comptes enregistrés sur la plateforme</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Chargement...</p>
            ) : filteredUsers.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Aucun utilisateur trouvé</p>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/80">
                    <tr className="border-b border-border text-left">
                      <th className="px-4 py-3 font-medium">Photo</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Nom</th>
                      <th className="px-4 py-3 font-medium">Rôle</th>
                      <th className="px-4 py-3 font-medium">Statut Email</th>
                      <th className="px-4 py-3 font-medium">Identité</th>
                      <th className="px-4 py-3 font-medium">Inscription</th>
                      <th className="px-4 py-3 font-medium">Dernière connexion</th>
                      <th className="px-4 py-3 font-medium">Durée totale</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => {
                      // Formater le nom complet selon le rôle
                      let displayName = 'Sans nom';
                      if (u.nom_complet && u.nom_complet.trim() !== '' && u.nom_complet !== 'Sans nom') {
                        displayName = u.nom_complet;
                      } else if (u.role === 'client' && u.company_name) {
                        displayName = u.company_name;
                      }
                      
                      // Formater la date de création avec validation stricte
                      let createdDate = 'N/A';
                      if (u.created_at) {
                        try {
                          const date = new Date(u.created_at);
                          // Vérifier que la date est valide
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
                      
                      // Formater la dernière connexion
                      let lastLoginDate = 'Jamais connecté';
                      if (u.last_login) {
                        try {
                          const date = new Date(u.last_login);
                          if (!isNaN(date.getTime()) && date.getFullYear() > 2000) {
                            lastLoginDate = date.toLocaleString('fr-FR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            });
                          }
                        } catch (e) {
                          console.error('Erreur format date last_login:', e);
                        }
                      }
                      
                      return (
                        <tr key={u.id} className="border-b border-border last:border-none hover:bg-muted/50">
                          <td className="px-4 py-3">
                            <div className="rounded-full overflow-hidden w-10 h-10 flex-shrink-0 bg-primary/10 flex items-center justify-center border border-border/50">
                              {u.profile_picture ? (
                                <img 
                                  src={getImageUrl(u.profile_picture)} 
                                  alt="Avatar" 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                    e.target.nextElementSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div className={u.profile_picture ? "hidden w-full h-full items-center justify-center" : "w-full h-full flex items-center justify-center"}>
                                {u.role === 'client' ? <Building2 className="h-5 w-5 text-primary" /> : <UserPlus className="h-5 w-5 text-primary" />}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">{u.email}</td>
                          <td className="px-4 py-3">
                            <span className={displayName === 'Sans nom' ? 'text-muted-foreground italic' : ''}>
                              {displayName}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                                u.role === 'automob'
                                  ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200'
                                  : u.role === 'client'
                                    ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200'
                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-200'
                              )}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {u.verified === 1 || u.verified === true ? (
                              <span className="inline-flex items-center gap-1 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                Vérifié
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-orange-600">
                                <XCircle className="h-4 w-4" />
                                En attente
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {u.id_verified === 1 || u.id_verified === true || u.id_verified === '1' ? (
                              <span className="inline-flex items-center gap-1 text-green-600">
                                <ShieldCheck className="h-4 w-4" />
                                Vérifié
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-gray-500">
                                <ShieldAlert className="h-4 w-4" />
                                Non vérifié
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {createdDate}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {lastLoginDate}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatDuration(u.total_session_duration || 0)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => navigate(`/admin/users/${u.id}`)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Voir le profil
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/admin/users/${u.id}`)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Modifier
                                </DropdownMenuItem>
                                {u.role !== 'admin' && (
                                  <DropdownMenuItem 
                                    onClick={() => handleVerifyUser(u.id, !(u.verified === 1 || u.verified === true))}
                                  >
                                    <UserX className="h-4 w-4 mr-2" />
                                    {u.verified === 1 || u.verified === true ? 'Révoquer vérification' : 'Vérifier email'}
                                  </DropdownMenuItem>
                                )}
                                {u.id !== user.id && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => openDeleteDialog(u)}
                                      className="text-red-600 focus:text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Supprimer
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer l'utilisateur{' '}
              <strong>{selectedUser?.email}</strong> ?
              <br />
              <br />
              Cette action est <strong>irréversible</strong> et supprimera :
              <ul className="list-disc list-inside mt-2 text-sm">
                <li>Le compte utilisateur</li>
                <li>Toutes les données de profil</li>
                <li>Les sessions et l'historique</li>
                <li>Les notifications</li>
                {selectedUser?.role === 'automob' && (
                  <>
                    <li>Les compétences et disponibilités</li>
                    <li>Les expériences professionnelles</li>
                  </>
                )}
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteUser}
              disabled={deleting}
            >
              {deleting ? 'Suppression...' : 'Supprimer définitivement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default UsersList;
