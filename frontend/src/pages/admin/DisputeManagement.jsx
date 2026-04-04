import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, Eye, CheckCircle, XCircle, Clock, 
  FileText, Euro, User, Calendar, MessageSquare,
  Scale, TrendingUp, Filter
} from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { Pagination } from '@/components/ui/pagination';
import api from '@/lib/api';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function DisputeManagement() {
  usePageTitle('Gestion Litiges');
  
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper pour parser JSON en toute sécurité
  const safeJsonParse = (jsonString, defaultValue = []) => {
    // Vérifications strictes avant parsing
    if (!jsonString) return defaultValue;
    if (typeof jsonString !== 'string') return defaultValue;
    
    const trimmed = jsonString.trim();
    if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return defaultValue;
    
    try {
      const parsed = JSON.parse(trimmed);
      return parsed || defaultValue;
    } catch (e) {
      console.warn('Impossible de parser JSON, retour valeur par défaut:', trimmed);
      return defaultValue;
    }
  };
  const [activeTab, setActiveTab] = useState('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const ITEMS_PER_PAGE = 15;
  
  const [resolveForm, setResolveForm] = useState({
    admin_decision: '',
    admin_notes: '',
    compensation_amount: '',
    compensation_to: ''
  });

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      const response = await api.get('/disputes/admin/all');
      setDisputes(Array.isArray(response.data.disputes) ? response.data.disputes : []);
    } catch (error) {
      console.error('Erreur chargement litiges:', error);
      toast.error('Impossible de charger les litiges');
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDisputeDetails = async (disputeId) => {
    try {
      const response = await api.get(`/disputes/admin/${disputeId}`);
      setSelectedDispute(response.data);
      setShowDetailsDialog(true);
    } catch (error) {
      console.error('Erreur chargement détails:', error);
      toast.error('Impossible de charger les détails');
    }
  };

  const handleResolve = async () => {
    try {
      if (!resolveForm.admin_decision) {
        toast.error('Décision requise');
        return;
      }

      if (!resolveForm.admin_notes) {
        toast.error('Notes administratives requises');
        return;
      }

      setSubmitting(true);

      await api.post(`/disputes/admin/${selectedDispute.dispute.id}/resolve`, resolveForm);

      toast.success('Litige résolu avec succès');
      setShowResolveDialog(false);
      setShowDetailsDialog(false);
      setSelectedDispute(null);
      setResolveForm({
        admin_decision: '',
        admin_notes: '',
        compensation_amount: '',
        compensation_to: ''
      });
      fetchDisputes();
    } catch (error) {
      console.error('Erreur résolution:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la résolution');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { label: 'En attente', icon: Clock, className: 'bg-yellow-600' },
      under_review: { label: 'En examen', icon: Eye, className: 'bg-blue-600' },
      resolved: { label: 'Résolu', icon: CheckCircle, className: 'bg-green-600' },
      rejected: { label: 'Rejeté', icon: XCircle, className: 'bg-red-600' }
    };
    
    const { label, icon: Icon, className } = config[status] || config.pending;
    
    return (
      <Badge className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const getDecisionBadge = (decision) => {
    if (!decision) return null;
    
    const config = {
      automob_wins: { label: 'Automob a raison', className: 'bg-blue-600' },
      client_wins: { label: 'Client a raison', className: 'bg-purple-600' },
      partial: { label: 'Partiel', className: 'bg-orange-600' },
      rejected: { label: 'Rejeté', className: 'bg-red-600' }
    };
    
    const { label, className } = config[decision] || {};
    
    return label ? (
      <Badge className={className}>
        <Scale className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    ) : null;
  };

  const getDisputeTypeBadge = (type) => {
    const types = {
      payment_issue: { label: 'Paiement', icon: Euro },
      service_quality: { label: 'Qualité service', icon: TrendingUp },
      mission_cancellation: { label: 'Annulation', icon: XCircle },
      communication_issue: { label: 'Communication', icon: MessageSquare },
      contract_breach: { label: 'Rupture contrat', icon: FileText },
      other: { label: 'Autre', icon: AlertTriangle }
    };
    
    const { label, icon: Icon } = types[type] || types.other;
    
    return (
      <Badge variant="outline">
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const filteredDisputes = disputes.filter(d => {
    if (activeTab === 'all') return true;
    return d.status === activeTab;
  });

  // Pagination
  const totalPages = Math.ceil(filteredDisputes.length / ITEMS_PER_PAGE);
  const paginatedDisputes = filteredDisputes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Réinitialiser la page lors du changement d'onglet
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const stats = {
    pending: disputes.filter(d => d.status === 'pending').length,
    under_review: disputes.filter(d => d.status === 'under_review').length,
    resolved: disputes.filter(d => d.status === 'resolved').length,
    rejected: disputes.filter(d => d.status === 'rejected').length
  };

  if (loading) {
    return (
      <DashboardLayout 
        title="Gestion Litiges"
        description="Gérez et résolvez les litiges entre clients et automobs"
        menuItems={adminNavigation}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Chargement des litiges...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Gestion Litiges"
      description="Gérez et résolvez les litiges entre clients et automobs"
      menuItems={adminNavigation}
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Gestion des Litiges</h1>
          <p className="text-muted-foreground">
            Gérez et résolvez les litiges entre clients et automobs
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">En attente</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">En examen</CardTitle>
              <Eye className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold">{stats.under_review}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">Résolus</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold">{stats.resolved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">Rejetés</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending">En attente ({stats.pending})</TabsTrigger>
            <TabsTrigger value="under_review">En examen ({stats.under_review})</TabsTrigger>
            <TabsTrigger value="resolved">Résolus ({stats.resolved})</TabsTrigger>
            <TabsTrigger value="rejected">Rejetés ({stats.rejected})</TabsTrigger>
            <TabsTrigger value="all">Tous ({disputes.length})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Liste des litiges</CardTitle>
                <CardDescription>
                  {filteredDisputes.length} litige(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredDisputes.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Aucun litige dans cette catégorie</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {paginatedDisputes.map((dispute) => (
                      <Card key={dispute.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-3 flex-1">
                              <div className="flex items-center gap-3 flex-wrap">
                                <h3 className="font-semibold text-lg">{dispute.title}</h3>
                                {getStatusBadge(dispute.status)}
                                {getDisputeTypeBadge(dispute.dispute_type)}
                                {dispute.admin_decision && getDecisionBadge(dispute.admin_decision)}
                              </div>

                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Mission</p>
                                  <p className="font-medium">{dispute.mission_title}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Créé par</p>
                                  <p className="font-medium">
                                    {dispute.creator_name} ({dispute.created_by_role})
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Contre</p>
                                  <p className="font-medium">
                                    {dispute.against_name} ({dispute.against_role})
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Date création</p>
                                  <p className="font-medium">
                                    {new Date(dispute.created_at).toLocaleDateString('fr-FR')}
                                  </p>
                                </div>
                              </div>

                              {dispute.disputed_amount > 0 && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Euro className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-semibold">
                                    Montant disputé: {parseFloat(dispute.disputed_amount).toFixed(2)}€
                                  </span>
                                </div>
                              )}

                              {dispute.compensation_amount > 0 && (
                                <div className="p-3 bg-green-50 dark:bg-green-950 rounded">
                                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                                    💰 Compensation accordée: {parseFloat(dispute.compensation_amount).toFixed(2)}€
                                    {dispute.compensation_paid && ' (Payée)'}
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col gap-2 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => fetchDisputeDetails(dispute.id)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Voir détails
                              </Button>

                              {dispute.status === 'pending' || dispute.status === 'under_review' ? (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    fetchDisputeDetails(dispute.id);
                                    setTimeout(() => setShowResolveDialog(true), 500);
                                  }}
                                >
                                  <Scale className="h-4 w-4 mr-2" />
                                  Trancher
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    </div>
                    
                    {/* Pagination */}
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                      itemsPerPage={ITEMS_PER_PAGE}
                      totalItems={filteredDisputes.length}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Détails du litige</DialogTitle>
              <DialogDescription>
                Informations complètes sur le litige
              </DialogDescription>
            </DialogHeader>

            {selectedDispute && (
              <div className="space-y-6">
                {/* Statuts */}
                <div className="flex items-center gap-3 flex-wrap">
                  {getStatusBadge(selectedDispute.dispute.status)}
                  {getDisputeTypeBadge(selectedDispute.dispute.dispute_type)}
                  {selectedDispute.dispute.admin_decision && getDecisionBadge(selectedDispute.dispute.admin_decision)}
                </div>

                {/* Informations principales */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Titre</Label>
                    <p className="font-medium">{selectedDispute.dispute.title}</p>
                  </div>
                  <div>
                    <Label>Mission</Label>
                    <p className="font-medium">{selectedDispute.dispute.mission_title}</p>
                  </div>
                  <div>
                    <Label>Créé par</Label>
                    <p className="font-medium">
                      {selectedDispute.dispute.creator_name} ({selectedDispute.dispute.created_by_role})
                    </p>
                  </div>
                  <div>
                    <Label>Contre</Label>
                    <p className="font-medium">
                      {selectedDispute.dispute.against_name} ({selectedDispute.dispute.against_role})
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label>Description</Label>
                  <p className="mt-2 text-sm whitespace-pre-wrap bg-muted p-4 rounded">
                    {selectedDispute.dispute.description}
                  </p>
                </div>

                {/* Montants */}
                {(selectedDispute.dispute.disputed_amount > 0 || selectedDispute.dispute.compensation_amount > 0) && (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedDispute.dispute.disputed_amount > 0 && (
                      <div>
                        <Label>Montant disputé</Label>
                        <p className="font-semibold text-lg">
                          {parseFloat(selectedDispute.dispute.disputed_amount).toFixed(2)}€
                        </p>
                      </div>
                    )}
                    {selectedDispute.dispute.compensation_amount > 0 && (
                      <div>
                        <Label>Compensation accordée</Label>
                        <p className="font-semibold text-lg text-green-600">
                          {parseFloat(selectedDispute.dispute.compensation_amount).toFixed(2)}€
                          {selectedDispute.dispute.compensation_paid && ' ✓'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes admin */}
                {selectedDispute.dispute.admin_notes && (
                  <div>
                    <Label>Notes administratives</Label>
                    <p className="mt-2 text-sm whitespace-pre-wrap bg-blue-50 dark:bg-blue-950 p-4 rounded">
                      {selectedDispute.dispute.admin_notes}
                    </p>
                  </div>
                )}

                {/* Preuves */}
                {(() => {
                  const evidenceArray = safeJsonParse(selectedDispute.dispute.evidence);
                  return evidenceArray.length > 0 && (
                    <div>
                      <Label>Preuves attachées</Label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {evidenceArray.map((url, index) => (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            📎 Preuve {index + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Messages */}
                {selectedDispute.messages && selectedDispute.messages.length > 0 && (
                  <div>
                    <Label>Messages échangés ({selectedDispute.messages.length})</Label>
                    <div className="mt-2 space-y-3 max-h-60 overflow-y-auto">
                      {selectedDispute.messages.map((msg) => (
                        <div key={msg.id} className="p-3 bg-muted rounded">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-sm">{msg.user_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(msg.created_at).toLocaleString('fr-FR')}
                            </p>
                          </div>
                          <p className="text-sm">{msg.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              {selectedDispute?.dispute.status === 'pending' || selectedDispute?.dispute.status === 'under_review' ? (
                <Button onClick={() => setShowResolveDialog(true)}>
                  <Scale className="h-4 w-4 mr-2" />
                  Trancher le litige
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Fermer
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Resolve Dialog */}
        <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Trancher le litige</DialogTitle>
              <DialogDescription>
                Prenez une décision et indiquez qui a raison
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="decision">Décision *</Label>
                <Select
                  value={resolveForm.admin_decision}
                  onValueChange={(value) => setResolveForm(prev => ({ ...prev, admin_decision: value }))}
                >
                  <SelectTrigger id="decision">
                    <SelectValue placeholder="Sélectionner une décision" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="automob_wins">Automob a raison</SelectItem>
                    <SelectItem value="client_wins">Client a raison</SelectItem>
                    <SelectItem value="partial">Décision partielle</SelectItem>
                    <SelectItem value="rejected">Rejeter le litige</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Notes administratives *</Label>
                <Textarea
                  id="notes"
                  rows={4}
                  placeholder="Expliquez votre décision et les raisons..."
                  value={resolveForm.admin_notes}
                  onChange={(e) => setResolveForm(prev => ({ ...prev, admin_notes: e.target.value }))}
                />
              </div>

              {resolveForm.admin_decision !== 'rejected' && (
                <>
                  <div>
                    <Label htmlFor="compensation">Montant compensation (€)</Label>
                    <Input
                      id="compensation"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={resolveForm.compensation_amount}
                      onChange={(e) => setResolveForm(prev => ({ ...prev, compensation_amount: e.target.value }))}
                    />
                  </div>

                  {resolveForm.compensation_amount > 0 && (
                    <div>
                      <Label htmlFor="compensationTo">Compensation à verser à</Label>
                      <Select
                        value={resolveForm.compensation_to}
                        onValueChange={(value) => setResolveForm(prev => ({ ...prev, compensation_to: value }))}
                      >
                        <SelectTrigger id="compensationTo">
                          <SelectValue placeholder="Sélectionner le bénéficiaire" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="automob">Automob</SelectItem>
                          <SelectItem value="client">Client</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowResolveDialog(false)}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button
                onClick={handleResolve}
                disabled={submitting}
              >
                {submitting ? 'Traitement...' : 'Confirmer la décision'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
