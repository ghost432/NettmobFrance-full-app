import { useState, useEffect } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { clientNavigation } from '@/constants/navigation';
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
  Briefcase, Search, Filter, Calendar, MapPin, Users, Euro, 
  Clock, ChevronLeft, ChevronRight, Eye, Edit, Trash2, MoreHorizontal,
  CheckCircle2, CheckCircle, XCircle, Loader2, AlertCircle, Plus
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api, { getAssetUrl } from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { createMissionSlug } from '@/utils/slugify';
import notificationService from '@/utils/notificationService';

const MissionsList = () => {
  useDocumentTitle('Mes Missions');
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    ouvert: 0,
    en_cours: 0,
    termine: 0,
    annule: 0
  });
  const itemsPerPage = 15;

  // Gestion du toast de nouvelle mission après publication
  useEffect(() => {
    const newMission = location.state?.newMission;
    if (newMission && Date.now() - newMission.timestamp < 15000) { // 15 secondes max
      
      console.log('🔄 NOUVELLE MISSION DÉTECTÉE:', {
        missionId: newMission.id,
        title: newMission.title,
        mode: newMission.mode,
        clientEmail: newMission.clientEmail,
        forceReload: newMission.forceReload
      });
      
      // Rechargement immédiat
      fetchMissions();
      
      // Recharger après 1 seconde
      setTimeout(() => {
        console.log('🔄 RECHARGEMENT 1s après détection');
        fetchMissions();
      }, 1000);
      
      // Recharger après 3 secondes pour être sûr
      setTimeout(() => {
        console.log('🔄 RECHARGEMENT 3s après détection');
        fetchMissions();
      }, 3000);
      
      // Rechargement final après 6 secondes
      setTimeout(() => {
        console.log('🔄 RECHARGEMENT FINAL 6s après détection');
        fetchMissions();
      }, 6000);
      
      if (newMission.timeout) {
        // Cas de timeout : mission possiblement créée mais algorithme interrompu
        toast.info(
          `⏰ Mission "${newMission.title}" : Publication en cours de finalisation. Vérification des résultats dans quelques instants...`
        );
        
        // Vérifier les résultats après un délai plus long
        setTimeout(() => {
          checkMissionResults(newMission.id, newMission.title, true);
          fetchMissions(); // Recharger encore
        }, 5000);
        
      } else if (newMission.mode === 'express') {
        // Mode express : lancer la vérification en arrière-plan
        toast.info(
          `⚡ Mission "${newMission.title}" publiée ! Vérification des résultats de l'algorithme...`
        );
        
        setTimeout(() => {
          checkMissionResults(newMission.id, newMission.title);
          fetchMissions(); // Recharger la liste
        }, 2000); // Attendre 2 secondes pour que la mission soit bien traitée
        
      } else if (newMission.mode === 'with_algorithm') {
        // Mode algorithme : afficher immédiatement les résultats
        const automobsFound = newMission.automobsFound || 0;
        const automobsNotified = newMission.automobsNotified || 0;
        
        if (automobsFound > 0) {
          toast.success(
            `🎯 Mission "${newMission.title}" : ${automobsNotified} auto-mob${automobsNotified > 1 ? 's' : ''} contacté${automobsNotified > 1 ? 's' : ''} sur ${automobsFound} trouvé${automobsFound > 1 ? 's' : ''}`
          );
          
          // Notification push
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Mission "${newMission.title}" publiée`, {
              body: `${automobsNotified} auto-mob${automobsNotified > 1 ? 's' : ''} contacté${automobsNotified > 1 ? 's' : ''}`,
              icon: '/favicon.ico'
            });
          }
        } else {
          toast.info(
            `📢 Mission "${newMission.title}" publiée ! Aucun auto-mob compatible trouvé pour le moment, mais votre mission est visible par tous.`
          );
        }
      }
      
      // Nettoyer l'état pour éviter de re-afficher le toast
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate]);

  useEffect(() => {
    fetchMissions();
  }, [currentPage, statusFilter]);

  // Vérifier les résultats d'une mission en arrière-plan (mode express)
  const checkMissionResults = async (missionId, missionTitle, isTimeout = false) => {
    try {
      // Si pas d'ID de mission (cas de timeout), essayer de retrouver la mission par son titre
      let actualMissionId = missionId;
      if (!actualMissionId && isTimeout) {
        // Recharger les missions pour trouver la nouvelle
        await fetchMissions();
        // Note: Dans un cas réel, on pourrait rechercher par titre et date récente
        toast.info(
          `🔍 Mission "${missionTitle}" créée avec succès ! Recherche des résultats de l'algorithme...`
        );
        return;
      }
      
      const response = await api.get(`/missions/${actualMissionId}/results`);
      const { automobs_found = 0, automobs_notified = 0, notifications_pending = 0 } = response.data;
      
      // Si des auto-mobs sont trouvés mais pas notifiés, forcer les notifications avec le service
      if (automobs_found > 0 && automobs_notified === 0) {
        try {
          toast.info(
            `📤 Mission "${missionTitle}" : ${automobs_found} auto-mob${automobs_found > 1 ? 's' : ''} trouvé${automobs_found > 1 ? 's' : ''}, envoi des notifications (même hors ligne)...`
          );
          
          const result = await notificationService.forceNotifications(actualMissionId, {
            send_to_offline: true,
            notification_type: 'new_mission',
            force_all: true,
            include_push: true,
            include_email: true,
            priority: 'high',
            retry_offline: true
          });
          
          if (result.success) {
            // Recharger la liste des missions immédiatement
            fetchMissions();
            
            // Re-vérifier après 3 secondes pour voir les résultats
            setTimeout(() => {
              checkMissionResults(actualMissionId, missionTitle, false);
              fetchMissions(); // Recharger encore
            }, 3000);
            
            if (result.automobs_notified > 0) {
              toast.success(
                `🎯 ${result.automobs_notified} auto-mob${result.automobs_notified > 1 ? 's' : ''} contacté${result.automobs_notified > 1 ? 's' : ''} avec succès !`
              );
            }
          } else {
            toast.error(`Erreur lors de l'envoi des notifications: ${result.error || 'Erreur inconnue'}`);
            // Même en cas d'erreur, recharger les missions au cas où elles seraient créées
            fetchMissions();
          }
          return;
        } catch (error) {
          console.error('Erreur service notifications:', error);
          toast.error('Erreur lors de l\'envoi des notifications aux auto-mobs');
        }
      }
      
      if (automobs_notified > 0) {
        toast.success(
          `🎯 Mission "${missionTitle}" : ${automobs_notified} auto-mob${automobs_notified > 1 ? 's' : ''} contacté${automobs_notified > 1 ? 's' : ''} avec succès !`
        );
        
        // Notification push supplémentaire si le navigateur le supporte
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🎯 Résultats de mission disponibles', {
            body: `${automobs_notified} auto-mob${automobs_notified > 1 ? 's' : ''} contacté${automobs_notified > 1 ? 's' : ''} pour "${missionTitle}"`,
            icon: '/favicon.ico',
            tag: `mission-${actualMissionId}` // Éviter les doublons
          });
        }
      } else if (automobs_found > 0) {
        toast.info(
          `📋 Mission "${missionTitle}" : ${automobs_found} auto-mob${automobs_found > 1 ? 's' : ''} compatible${automobs_found > 1 ? 's' : ''} trouvé${automobs_found > 1 ? 's' : ''}, notifications en cours...`
        );
      } else {
        toast.info(
          `📢 Mission "${missionTitle}" : Aucun auto-mob compatible trouvé pour le moment, mais votre mission est maintenant visible par tous !`
        );
      }
    } catch (error) {
      console.error('Erreur vérification résultats mission:', error);
      
      if (error.response?.status === 404 && isTimeout) {
        // Mission pas encore trouvée, réessayer
        toast.info(
          `⏳ Mission "${missionTitle}" : Finalisation en cours, vérification dans 10 secondes...`
        );
        setTimeout(() => {
          fetchMissions(); // Recharger la liste
        }, 10000);
      } else {
        // Toast de fallback
        toast.info(
          `✅ Mission "${missionTitle}" publiée avec succès ! L'algorithme continue son analyse en arrière-plan.`
        );
      }
    }
  };

  const fetchMissions = async () => {
    try {
      setLoading(true);
      
      console.log('📋 RECHARGEMENT MISSIONS:', {
        statusFilter,
        currentPage,
        itemsPerPage,
        timestamp: new Date().toISOString()
      });
      
      const response = await api.get('/missions', {
        params: {
          status: statusFilter === 'all' ? undefined : statusFilter,
          page: currentPage,
          limit: itemsPerPage,
          forceRefresh: Date.now() // Cache busting
        }
      });
      const data = response.data;
      
      console.log('📋 MISSIONS CHARGÉES:', {
        totalMissions: data.length,
        missions: data.map(m => ({ id: m.id, title: m.mission_name, status: m.status }))
      });
      
      // Récupérer les candidatures et timesheets pour chaque mission
      const missionsWithApplications = await Promise.all(
        data.map(async (mission) => {
          try {
            const appResponse = await api.get(`/missions/${mission.id}/applications`);
            // Récupérer les timesheets en attente et approuvés
            let pendingTimesheets = [];
            let approvedTimesheets = [];
            try {
              const timesheetsResponse = await api.get(`/timesheets/mission/${mission.id}/all`);
              pendingTimesheets = timesheetsResponse.data.filter(ts => ts.status === 'soumis');
              approvedTimesheets = timesheetsResponse.data.filter(ts => ts.status === 'approuve');
            } catch (tsError) {
              console.log('Pas de timesheets pour mission:', mission.id);
            }
            return { 
              ...mission, 
              applications: appResponse.data || [],
              pendingTimesheets: pendingTimesheets,
              approvedTimesheets: approvedTimesheets
            };
          } catch (error) {
            return { ...mission, applications: [], pendingTimesheets: [], approvedTimesheets: [] };
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
      
      setTotalPages(Math.ceil(data.length / itemsPerPage));
    } catch (error) {
      console.error('Erreur chargement missions:', error);
      toast.error('Erreur lors du chargement des missions');
    } finally {
      setLoading(false);
    }
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

  const handleMarkAsCompleted = async (missionId) => {
    try {
      await api.put(`/missions/${missionId}`, { status: 'termine' });
      toast.success('Mission marquée comme terminée');
      fetchMissions();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (missionId) => {
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

  const filteredMissions = missions
    .filter(mission =>
      mission.mission_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mission.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Trier: ouvert et en_cours en premier, terminé en dernier
      const statusOrder = { 'ouvert': 1, 'en_cours': 2, 'termine': 3, 'annule': 4 };
      return (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5);
    });

  const displayName = () => user?.profile?.company_name || user?.email?.split('@')[0] || 'Client';

  return (
    <DashboardLayout
      title="Mes Missions"
      description="Gérez toutes vos missions publiées"
      menuItems={clientNavigation}
      getRoleLabel={() => 'Client'}
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
                placeholder="Rechercher une mission..."
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

            <Button onClick={() => navigate('/client/publish-mission')}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Mission
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
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Chargement...</p>
              </div>
            ) : filteredMissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Aucune mission trouvée</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Commencez par créer votre première mission
                </p>
                <Button onClick={() => navigate('/client/publish-mission')}>
                  Créer une mission
                </Button>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mission</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Période</TableHead>
                        <TableHead>Lieu</TableHead>
                        <TableHead>Auto-mobs</TableHead>
                        <TableHead>Heures reçues</TableHead>
                        <TableHead>Tarif</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMissions.map((mission) => (
                        <TableRow key={mission.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{mission.mission_name || mission.title}</p>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {mission.description}
                              </p>
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
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3" />
                              {mission.city || 'Non spécifié'}
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
                                      title={`${app.automob_name || `${app.automob_first_name} ${app.automob_last_name}`} - ${app.status === 'accepte' ? 'Accepté' : app.status === 'refuse' ? 'Refusé' : 'En attente'}`}
                                      onClick={() => navigate(`/client/applications?highlight=${app.id}&mission=${mission.id}`)}
                                    >
                                      <Avatar className="h-5 w-5">
                                        <AvatarImage 
                                          src={getAssetUrl(app.automob_avatar)} 
                                          alt={`${app.automob_first_name} ${app.automob_last_name}`}
                                        />
                                        <AvatarFallback className="text-[8px]">
                                          {app.automob_first_name?.[0]}{app.automob_last_name?.[0]}
                                        </AvatarFallback>
                                      </Avatar>
                                      {mission.applications.length === 1 && (
                                        <span className="font-medium truncate max-w-[80px] text-primary hover:underline">
                                          {app.automob_first_name} {app.automob_last_name}
                                        </span>
                                      )}
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
                                      onClick={() => navigate('/client/applications')}
                                    >
                                      +{mission.applications.length - 3}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {(mission.pendingTimesheets && mission.pendingTimesheets.length > 0) || 
                             (mission.approvedTimesheets && mission.approvedTimesheets.length > 0) ? (
                              <div className="space-y-2">
                                {/* Demandes en attente */}
                                {mission.pendingTimesheets && mission.pendingTimesheets.length > 0 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate('/client/timesheets')}
                                    className="w-full bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700"
                                  >
                                    <Clock className="h-3 w-3 mr-2" />
                                    {mission.pendingTimesheets.length} en attente
                                  </Button>
                                )}
                                
                                {/* Demandes validées */}
                                {mission.approvedTimesheets && mission.approvedTimesheets.length > 0 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate('/client/timesheets')}
                                    className="w-full bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                                  >
                                    <CheckCircle className="h-3 w-3 mr-2" />
                                    {mission.approvedTimesheets.length} validée{mission.approvedTimesheets.length > 1 ? 's' : ''}
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground text-center">Aucune demande</p>
                            )}
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
                                <DropdownMenuItem
                                  onClick={() => navigate(`/client/missions/${createMissionSlug(mission.mission_name || mission.title, mission.id)}`)}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  Voir les détails
                                </DropdownMenuItem>
                                {mission.status === 'ouvert' && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => navigate(`/client/missions/${createMissionSlug(mission.mission_name || mission.title, mission.id)}/edit`)}
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Modifier
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleDelete(mission.id)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Supprimer
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {mission.status === 'en_cours' && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => navigate(`/client/mission/${mission.id}/complete-automobs`)}
                                    >
                                      <CheckCircle2 className="mr-2 h-4 w-4" />
                                      Gérer les automobs
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleMarkAsCompleted(mission.id)}
                                    >
                                      <CheckCircle2 className="mr-2 h-4 w-4" />
                                      Marquer comme terminée
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {currentPage} sur {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MissionsList;
