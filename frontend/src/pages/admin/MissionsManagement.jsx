import { useState, useEffect } from 'react';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/ui/pagination';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Briefcase, Search, Filter, Calendar, MapPin, Users, Euro,
  Clock, MoreHorizontal, Eye, Edit, Trash2, CheckCircle2,
  XCircle, Loader2, AlertCircle, Plus, Building2, User, Download
} from 'lucide-react';
import { exportToCSV } from '@/utils/exportCSV';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { TableSkeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { useNavigate } from 'react-router-dom';

const MissionsManagement = () => {
  useDocumentTitle('Gestion des Missions');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [missions, setMissions] = useState([]);
  const [clients, setClients] = useState([]);
  const [secteurs, setSecteurs] = useState([]);
  const [competences, setCompetences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showApplicationsDialog, setShowApplicationsDialog] = useState(false);
  const [selectedMission, setSelectedMission] = useState(null);
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    ouvert: 0,
    en_cours: 0,
    termine: 0,
    annule: 0
  });

  const [formData, setFormData] = useState({
    client_id: '',
    mission_name: '',
    description: '',
    secteur_id: '',
    competences_ids: [],
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    hourly_rate: '',
    nb_automobs: 1,
    address: '',
    city: '',
    postal_code: '',
    work_time: 'jour'
  });

  useEffect(() => {
    fetchMissions();
    fetchClients();
    fetchSecteurs();
    fetchCompetences();
  }, [statusFilter]);

  const fetchMissions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/missions/all');
      const data = response.data;
      
      // Récupérer les candidatures pour chaque mission
      const missionsWithApplications = await Promise.all(
        data.map(async (mission) => {
          try {
            const appResponse = await api.get(`/missions/${mission.id}/applications/all`);
            return { ...mission, applications: appResponse.data || [] };
          } catch (error) {
            return { ...mission, applications: [] };
          }
        })
      );
      
      setMissions(missionsWithApplications);
      
      // Calculer les statistiques
      setStats({
        total: data.length,
        ouvert: data.filter(m => m.status === 'ouvert').length,
        en_cours: data.filter(m => m.status === 'en_cours').length,
        termine: data.filter(m => m.status === 'termine').length,
        annule: data.filter(m => m.status === 'annule').length
      });
    } catch (error) {
      console.error('Erreur chargement missions:', error);
      toast.error('Erreur lors du chargement des missions');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await api.get('/admin/users?role=client');
      setClients(response.data);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
    }
  };

  const fetchSecteurs = async () => {
    try {
      const response = await api.get('/secteurs');
      setSecteurs(response.data);
    } catch (error) {
      console.error('Erreur chargement secteurs:', error);
    }
  };

  const fetchCompetences = async () => {
    try {
      const response = await api.get('/competences');
      setCompetences(response.data);
    } catch (error) {
      console.error('Erreur chargement compétences:', error);
    }
  };

  const handleCreateMission = async (e) => {
    e.preventDefault();
    
    try {
      await api.post('/missions/admin', formData);
      toast.success('Mission créée avec succès');
      setShowCreateDialog(false);
      resetForm();
      fetchMissions();
    } catch (error) {
      console.error('Erreur création mission:', error);
      toast.error('Erreur lors de la création de la mission');
    }
  };

  const handleViewApplications = async (mission) => {
    setSelectedMission(mission);
    setApplications(mission.applications || []);
    setShowApplicationsDialog(true);
  };

  const handleUpdateApplicationStatus = async (applicationId, status) => {
    try {
      await api.patch(`/missions/${selectedMission.id}/applications/${applicationId}`, { status });
      toast.success(`Candidature ${status === 'accepte' ? 'acceptée' : 'refusée'}`);
      fetchMissions();
      setShowApplicationsDialog(false);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDeleteMission = async (missionId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette mission ?')) return;
    
    try {
      await api.delete(`/missions/${missionId}`);
      toast.success('Mission supprimée');
      fetchMissions();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const resetForm = () => {
    setFormData({
      client_id: '',
      mission_name: '',
      description: '',
      secteur_id: '',
      competences_ids: [],
      start_date: '',
      end_date: '',
      start_time: '',
      end_time: '',
      hourly_rate: '',
      nb_automobs: 1,
      address: '',
      city: '',
      postal_code: '',
      work_time: 'jour'
    });
  };

  const handleCompetenceToggle = (competenceId) => {
    setFormData(prev => ({
      ...prev,
      competences_ids: prev.competences_ids.includes(competenceId)
        ? prev.competences_ids.filter(id => id !== competenceId)
        : [...prev.competences_ids, competenceId]
    }));
  };

  const getStatusBadge = (status) => {
    const variants = {
      ouvert: { variant: 'default', label: 'Ouvert' },
      en_cours: { variant: 'secondary', label: 'En cours' },
      termine: { variant: 'outline', label: 'Terminé' },
      annule: { variant: 'destructive', label: 'Annulé' }
    };
    const config = variants[status] || variants.ouvert;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getApplicationStatusBadge = (status) => {
    const variants = {
      en_attente: { variant: 'secondary', label: 'En attente', icon: '⏳' },
      accepte: { variant: 'default', label: 'Accepté', icon: '✓' },
      refuse: { variant: 'destructive', label: 'Refusé', icon: '✗' }
    };
    const config = variants[status] || variants.en_attente;
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.icon} {config.label}
      </Badge>
    );
  };

  const filteredMissions = missions.filter(mission =>
    mission.mission_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mission.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mission.client_company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { currentItems: paginatedMissions, currentPage: missionsPage, totalPages: missionsTotalPages, totalItems: missionsTotalItems, setCurrentPage: setMissionsPage } = usePagination(filteredMissions, 15);

  const displayName = () => user?.email?.split('@')[0] || 'Admin';

  return (
    <DashboardLayout
      title="Gestion des Missions"
      description="Gérez toutes les missions de la plateforme"
      menuItems={adminNavigation}
      getRoleLabel={() => 'Admin'}
      getDisplayName={displayName}
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">missions publiées</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">Ouvertes</CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold">{stats.ouvert}</div>
              <p className="text-xs text-muted-foreground">en attente de candidats</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">En cours</CardTitle>
              <Loader2 className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold">{stats.en_cours}</div>
              <p className="text-xs text-muted-foreground">missions actives</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">Terminées</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold">{stats.termine}</div>
              <p className="text-xs text-muted-foreground">missions complétées</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">Annulées</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold">{stats.annule}</div>
              <p className="text-xs text-muted-foreground">missions annulées</p>
            </CardContent>
          </Card>
        </div>

        {/* Header Actions */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une mission ou un client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="ouvert">Ouvert</SelectItem>
                <SelectItem value="en_cours">En cours</SelectItem>
                <SelectItem value="termine">Terminé</SelectItem>
                <SelectItem value="annule">Annulé</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une Mission
            </Button>
            <Button
              variant="outline"
              onClick={() => exportToCSV(
                filteredMissions.map(m => ({
                  nom: m.mission_name || m.title,
                  statut: m.status,
                  client: m.client_name || m.client_email || '',
                  debut: m.start_date ? new Date(m.start_date).toLocaleDateString('fr-FR') : '',
                  fin: m.end_date ? new Date(m.end_date).toLocaleDateString('fr-FR') : '',
                  tarif: m.hourly_rate,
                  automobs: m.nb_automobs || 1,
                  ville: m.city || m.address || ''
                })),
                'missions',
                { nom: 'Mission', statut: 'Statut', client: 'Client', debut: 'Début', fin: 'Fin', tarif: 'Tarif/h', automobs: 'Nb Automobs', ville: 'Ville' }
              )}
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter CSV
            </Button>
          </div>
        </div>

        {/* Missions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des missions</CardTitle>
            <CardDescription>
              {filteredMissions.length} mission(s) trouvée(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton rows={8} cols={7} />
            ) : filteredMissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Aucune mission trouvée</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mission</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Période</TableHead>
                      <TableHead>Candidatures</TableHead>
                      <TableHead>Tarif</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedMissions.map((mission) => (
                      <TableRow key={mission.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{mission.mission_name || mission.title}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {mission.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{mission.client_company || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(mission.status)}</TableCell>
                        <TableCell>
                          <div className="text-sm whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span>{new Date(mission.start_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              au {new Date(mission.end_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Users className="h-3 w-3" />
                              {mission.applications?.length || 0} / {mission.nb_automobs || 1}
                            </div>
                            {mission.applications && mission.applications.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {mission.applications.slice(0, 3).map((app) => (
                                  <div
                                    key={app.id}
                                    className="flex items-center gap-1.5 bg-muted rounded-md px-2 py-1 text-xs hover:bg-muted/80 transition-colors cursor-pointer"
                                    title={`${app.automob_name} - ${app.status}`}
                                    onClick={() => handleViewApplications(mission)}
                                  >
                                    <Avatar className="h-5 w-5">
                                      <AvatarImage src={app.automob_avatar} />
                                      <AvatarFallback className="text-[8px]">
                                        {app.automob_first_name?.[0]}{app.automob_last_name?.[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <Badge
                                      variant={
                                        app.status === 'accepte' ? 'default' :
                                        app.status === 'refuse' ? 'destructive' :
                                        'secondary'
                                      }
                                      className="h-4 px-1 text-[9px]"
                                    >
                                      {app.status === 'accepte' ? '✓' :
                                       app.status === 'refuse' ? '✗' :
                                       '⏳'}
                                    </Badge>
                                  </div>
                                ))}
                                {mission.applications.length > 3 && (
                                  <div 
                                    className="flex items-center justify-center bg-muted rounded-md px-2 py-1 text-xs font-medium hover:bg-muted/80 transition-colors cursor-pointer"
                                    onClick={() => handleViewApplications(mission)}
                                  >
                                    +{mission.applications.length - 3}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <Euro className="h-3 w-3" />
                            {mission.hourly_rate}€/h
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Ouvrir le menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleViewApplications(mission)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Voir les candidatures
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteMission(mission.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <Pagination
              currentPage={missionsPage}
              totalPages={missionsTotalPages}
              onPageChange={setMissionsPage}
              itemsPerPage={15}
              totalItems={missionsTotalItems}
            />
          </CardContent>
        </Card>

        {/* Create Mission Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer une nouvelle mission</DialogTitle>
              <DialogDescription>
                Créez une mission pour un client
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateMission} className="space-y-4">
              {/* Client */}
              <div className="space-y-2">
                <Label htmlFor="client_id">Client *</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.company_name || client.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Nom de la mission */}
              <div className="space-y-2">
                <Label htmlFor="mission_name">Nom de la mission *</Label>
                <Input
                  id="mission_name"
                  value={formData.mission_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, mission_name: e.target.value }))}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  required
                />
              </div>

              {/* Secteur et Compétences */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Secteur *</Label>
                  <Select
                    value={formData.secteur_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, secteur_id: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                    <SelectContent>
                      {secteurs.map((s) => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          {s.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Période *</Label>
                  <Select
                    value={formData.work_time}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, work_time: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jour">Jour</SelectItem>
                      <SelectItem value="nuit">Nuit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dates et Horaires */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date début *</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date fin *</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Heure début *</Label>
                  <Input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Heure fin *</Label>
                  <Input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Adresse */}
              <div className="space-y-2">
                <Label>Adresse *</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Code postal *</Label>
                  <Input
                    value={formData.postal_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ville *</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Tarif et Nombre */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tarif horaire (€) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nombre d'auto-mobs *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.nb_automobs}
                    onChange={(e) => setFormData(prev => ({ ...prev, nb_automobs: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Annuler
                </Button>
                <Button type="submit">
                  Créer la mission
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Applications Dialog */}
        <Dialog open={showApplicationsDialog} onOpenChange={setShowApplicationsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Candidatures pour: {selectedMission?.mission_name}</DialogTitle>
              <DialogDescription>
                {applications.length} candidature(s) reçue(s)
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {applications.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucune candidature pour cette mission
                </p>
              ) : (
                applications.map((app) => (
                  <Card key={app.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={app.automob_avatar} />
                            <AvatarFallback>
                              {app.automob_first_name?.[0]}{app.automob_last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {app.automob_first_name} {app.automob_last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Postulé le {new Date(app.created_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getApplicationStatusBadge(app.status)}
                          {app.status === 'en_attente' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateApplicationStatus(app.id, 'accepte')}
                              >
                                Accepter
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleUpdateApplicationStatus(app.id, 'refuse')}
                              >
                                Refuser
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      {app.message && (
                        <div className="mt-4 p-3 bg-muted rounded-md">
                          <p className="text-sm">{app.message}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default MissionsManagement;
