import { useState, useEffect } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { clientNavigation } from '@/constants/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  User, Search, CheckCircle, XCircle, Calendar, Briefcase,
  Mail, Phone, MapPin, Star
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api, { getAssetUrl } from '@/lib/api';
import { toast } from '@/components/ui/toast';

const ApplicationsReceived = () => {
  useDocumentTitle('Candidatures reçues');
  usePageTitle('Demandes Reçues');
  
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [actionType, setActionType] = useState(null); // 'accept' or 'reject'
  const [activeTab, setActiveTab] = useState(searchParams.get('status') || 'all');
  const [currentPage, setCurrentPage] = useState(1);
  
  const ITEMS_PER_PAGE = 15;

  useEffect(() => {
    fetchApplications();
  }, []);

  // Gérer la mise en évidence de candidature spécifique via URL params
  useEffect(() => {
    const highlightId = searchParams.get('highlight');
    if (highlightId && applications.length > 0) {
      const targetApplication = applications.find(app => app.id.toString() === highlightId);
      if (targetApplication) {
        console.log('🎯 Mise en évidence de la candidature:', targetApplication);
        // Mettre la candidature en évidence (scroll vers elle)
        setTimeout(() => {
          const element = document.getElementById(`application-${highlightId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('bg-blue-50', 'border-blue-200');
            setTimeout(() => {
              element.classList.remove('bg-blue-50', 'border-blue-200');
            }, 3000); // Retirer la mise en évidence après 3 secondes
          }
        }, 100);
      }
    }
  }, [applications, searchParams]);

  useEffect(() => {
    const status = searchParams.get('status');
    if (status) {
      setActiveTab(status);
    }
  }, [searchParams]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const missionsResponse = await api.get('/missions');
      const myMissions = missionsResponse.data;
      
      // Récupérer toutes les candidatures pour mes missions
      const allApplications = [];
      for (const mission of myMissions) {
        try {
          const appResponse = await api.get(`/missions/${mission.id}/applications`);
          const apps = appResponse.data.map(app => ({
            ...app,
            mission_name: mission.mission_name || mission.title,
            mission_id: mission.id,
            mission_automobs_needed: mission.automobs_needed || 1,
            mission_accepted_count: mission.accepted_count || 0
          }));
          allApplications.push(...apps);
        } catch (err) {
          console.error(`Erreur chargement applications mission ${mission.id}:`, err);
        }
      }
      
      setApplications(allApplications);
    } catch (error) {
      console.error('Erreur chargement applications:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedApplication) {
      console.warn('🚫 Pas de candidature sélectionnée');
      return;
    }

    try {
      const status = actionType === 'accept' ? 'accepte' : 'refuse';
      console.log('🔄 [ApplicationsReceived] Envoi requête:', {
        url: `/missions/${selectedApplication.mission_id}/applications/${selectedApplication.id}`,
        status,
        missionId: selectedApplication.mission_id,
        applicationId: selectedApplication.id
      });

      const response = await api.patch(
        `/missions/${selectedApplication.mission_id}/applications/${selectedApplication.id}`,
        { status }
      );

      console.log('✅ [ApplicationsReceived] Réponse reçue:', response.data);
      
      console.log('🔄 [ApplicationsReceived] Fermeture du dialog et rechargement des données...');
      // Fermer le dialogue d'abord
      setShowDialog(false);
      setSelectedApplication(null);
      
      // Attendre le rechargement des données
      await fetchApplications();
      console.log('✅ [ApplicationsReceived] Action complétée avec succès');
      
      // Afficher le toast après le rechargement
      toast.success(
        actionType === 'accept' 
          ? 'Candidature acceptée avec succès !' 
          : 'Candidature refusée avec succès'
      );
      
    } catch (error) {
      console.error('❌ [ApplicationsReceived] Erreur complète:', error);
      console.error('❌ [ApplicationsReceived] Response:', error.response?.data);
      console.error('❌ [ApplicationsReceived] Status:', error.response?.status);
      console.error('❌ [ApplicationsReceived] Headers:', error.response?.headers);
      
      // Gestion spécifique des erreurs
      if (error.response?.status === 401) {
        console.error('❌ [ApplicationsReceived] Non authentifié - redirection vers login');
        // L'interceptor Axios gère déjà cette redirection
        return;
      } else if (error.response?.status === 403) {
        console.error('❌ [ApplicationsReceived] Accès refusé');
        toast.error('Accès refusé. Vous n\'avez pas les permissions nécessaires.');
      } else if (error.response?.status === 404) {
        console.error('❌ [ApplicationsReceived] Candidature non trouvée');
        toast.error('Candidature non trouvée. Elle a peut-être déjà été traitée.');
        await fetchApplications(); // Recharger pour voir l'état actuel
      } else if (error.response?.status === 500) {
        console.error('❌ [ApplicationsReceived] Erreur serveur');
        toast.error('Erreur serveur. Veuillez réessayer dans quelques instants.');
      } else {
        const errorMessage = error.response?.data?.error || error.response?.data?.details || error.message || 'Une erreur est survenue';
        console.error('❌ [ApplicationsReceived] Erreur générique:', errorMessage);
        toast.error(errorMessage);
      }
      
      // En cas d'erreur, fermer quand même le dialog
      setShowDialog(false);
      setSelectedApplication(null);
    }
  };

  const openDialog = (application, type) => {
    setSelectedApplication(application);
    setActionType(type);
    setShowDialog(true);
  };

  const getStatusBadge = (status) => {
    const variants = {
      en_attente: { variant: 'default', label: 'En attente' },
      accepte: { variant: 'secondary', label: 'Accepté' },
      refuse: { variant: 'destructive', label: 'Refusé' }
    };
    const config = variants[status] || variants.en_attente;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.automob_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.mission_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && app.status === activeTab;
  });

  // Pagination
  const totalPages = Math.ceil(filteredApplications.length / ITEMS_PER_PAGE);
  const paginatedApplications = filteredApplications.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getApplicationsCount = (status) => {
    if (status === 'all') return applications.length;
    return applications.filter(app => app.status === status).length;
  };

  const displayName = () => user?.profile?.company_name || user?.email?.split('@')[0] || 'Client';

  return (
    <DashboardLayout
      title={
        <div className="flex items-center gap-3">
          Demandes Reçues
          {!loading && getApplicationsCount('en_attente') > 0 && (
            <Badge 
              variant="secondary" 
              className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none px-2.5 py-0.5 text-sm font-bold animate-in fade-in zoom-in duration-300"
            >
              {getApplicationsCount('en_attente')}
            </Badge>
          )}
        </div>
      }
      description="Gérez les candidatures des auto-mobs"
      menuItems={clientNavigation}
      getRoleLabel={() => 'Client'}
      getDisplayName={displayName}
    >
      <div className="space-y-6">
        {/* Search */}
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une candidature..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Applications Table with Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Candidatures reçues</CardTitle>
            <CardDescription>
              Gérez toutes les candidatures pour vos missions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="all">
                  Toutes ({getApplicationsCount('all')})
                </TabsTrigger>
                <TabsTrigger value="en_attente">
                  En attente ({getApplicationsCount('en_attente')})
                </TabsTrigger>
                <TabsTrigger value="accepte">
                  Acceptées ({getApplicationsCount('accepte')})
                </TabsTrigger>
                <TabsTrigger value="refuse">
                  Refusées ({getApplicationsCount('refuse')})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-0">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-muted-foreground">Chargement...</p>
                  </div>
                ) : filteredApplications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <User className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">Aucune candidature</p>
                    <p className="text-sm text-muted-foreground">
                      {activeTab === 'all' 
                        ? 'Les candidatures des auto-mobs apparaîtront ici'
                        : `Aucune candidature ${activeTab === 'en_attente' ? 'en attente' : activeTab === 'accepte' ? 'acceptée' : 'refusée'}`
                      }
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Auto-mob</TableHead>
                          <TableHead>Mission</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Expérience</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedApplications.map((application) => (
                          <TableRow 
                            key={application.id}
                            id={`application-${application.id}`}
                            className="transition-colors duration-300"
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarImage 
                                    src={getAssetUrl(application.automob_avatar)}
                                    alt={application.automob_name || 'Automob'} 
                                  />
                                  <AvatarFallback>
                                    {application.automob_name?.split(' ').map(n => n[0]).join('') || 'A'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{application.automob_name || 'Auto-mob'}</p>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    {application.automob_rating || '5.0'}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{application.mission_name}</p>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Briefcase className="h-3 w-3" />
                                  Mission #{application.mission_id}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <Calendar className="h-3 w-3" />
                                {new Date(application.created_at).toLocaleDateString('fr-FR')}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(application.status)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {application.automob_experience || 'Non spécifiée'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {application.status === 'en_attente' ? (
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-green-600 hover:text-green-700"
                                    onClick={() => openDialog(application, 'accept')}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Accepter
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => openDialog(application, 'reject')}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Refuser
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex justify-end">
                                  <Badge 
                                    variant={application.status === 'accepte' ? 'default' : 'destructive'}
                                    className="text-xs"
                                  >
                                    {application.status === 'accepte' ? (
                                      <>
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Candidature acceptée
                                      </>
                                    ) : (
                                      <>
                                        <XCircle className="h-3 w-3 mr-1" />
                                        Candidature refusée
                                      </>
                                    )}
                                  </Badge>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === 'accept' ? 'Accepter la candidature' : 'Refuser la candidature'}
              </DialogTitle>
              <DialogDescription>
                {actionType === 'accept'
                  ? `Voulez-vous vraiment accepter la candidature de ${selectedApplication?.automob_name} ?`
                  : `Voulez-vous vraiment refuser la candidature de ${selectedApplication?.automob_name} ?`
                }
              </DialogDescription>
            </DialogHeader>
            {selectedApplication && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <Avatar>
                    <AvatarImage 
                      src={getAssetUrl(selectedApplication?.automob_avatar)}
                      alt={selectedApplication?.automob_name || 'Automob'} 
                    />
                    <AvatarFallback>
                      {selectedApplication?.automob_name?.split(' ').map(n => n[0]).join('') || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedApplication.automob_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedApplication.mission_name}</p>
                  </div>
                </div>
                {actionType === 'accept' && (
                  <p className="text-sm text-muted-foreground">
                    {selectedApplication?.mission_automobs_needed > 1 ? (
                      <>
                        Cette action acceptera cet auto-mob pour la mission ({(selectedApplication?.mission_accepted_count || 0) + 1}/{selectedApplication?.mission_automobs_needed} places).
                        {(selectedApplication?.mission_accepted_count || 0) + 1 >= selectedApplication?.mission_automobs_needed && (
                          <span className="block mt-1 font-medium">Les candidatures restantes seront automatiquement refusées.</span>
                        )}
                      </>
                    ) : (
                      'Cette action mettra la mission en cours pour l\'auto-mob.'
                    )}
                  </p>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Annuler
              </Button>
              <Button
                variant={actionType === 'accept' ? 'default' : 'destructive'}
                onClick={handleAction}
              >
                {actionType === 'accept' ? 'Accepter' : 'Refuser'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ApplicationsReceived;
