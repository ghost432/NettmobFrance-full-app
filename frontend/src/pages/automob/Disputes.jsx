import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, AlertTriangle, Clock, CheckCircle, XCircle, Eye, MessageSquare } from 'lucide-react';
import api from '@/lib/api';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { automobNavigation } from '@/constants/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { Pagination } from '@/components/ui/pagination';

export default function AutomobDisputes() {
  useDocumentTitle('Mes Litiges');
  const navigate = useNavigate();
  const [disputes, setDisputes] = useState([]);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const ITEMS_PER_PAGE = 15;
  
  const [formData, setFormData] = useState({
    mission_id: '',
    dispute_type: 'other',
    title: '',
    description: '',
    disputed_amount: '',
    evidence: []
  });

  useEffect(() => {
    fetchDisputes();
    fetchMissions();
  }, []);

  const fetchDisputes = async () => {
    try {
      console.log('Fetching disputes...');
      const response = await api.get('/disputes/automob/my-disputes');
      console.log('Disputes response:', response.data);
      setDisputes(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erreur chargement litiges:', error);
      toast.error(error.response?.data?.error || 'Impossible de charger les litiges');
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMissions = async () => {
    try {
      // Utiliser la route timesheets qui retourne les missions de l'automob
      const response = await api.get('/timesheets/my-missions');
      console.log('Automob missions:', response.data);
      // Filtrer les missions éligibles pour créer un litige
      const eligibleMissions = response.data.filter(m => 
        m.status && ['accepted', 'in_progress', 'completed', 'cancelled', 'en_cours', 'termine', 'annule'].includes(m.status)
      );
      console.log('Eligible missions for disputes:', eligibleMissions);
      setMissions(eligibleMissions);
    } catch (error) {
      console.error('Erreur chargement missions:', error);
      setMissions([]);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + formData.evidence.length > 5) {
      toast.error('Maximum 5 fichiers autorisés');
      return;
    }
    setFormData(prev => ({ ...prev, evidence: [...prev.evidence, ...files] }));
  };

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      evidence: prev.evidence.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = new FormData();
      data.append('mission_id', formData.mission_id);
      data.append('dispute_type', formData.dispute_type);
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('disputed_amount', formData.disputed_amount || 0);
      
      formData.evidence.forEach(file => {
        data.append('evidence', file);
      });

      await api.post('/disputes/automob/create', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Votre litige a été soumis avec succès');

      setShowCreateDialog(false);
      setFormData({
        mission_id: '',
        dispute_type: 'other',
        title: '',
        description: '',
        disputed_amount: '',
        evidence: []
      });
      fetchDisputes();
    } catch (error) {
      console.error('Erreur création litige:', error);
      toast.error(error.response?.data?.error || 'Impossible de créer le litige');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: { variant: 'secondary', icon: Clock, label: 'En attente' },
      under_review: { variant: 'default', icon: Eye, label: 'En examen' },
      resolved: { variant: 'success', icon: CheckCircle, label: 'Résolu' },
      rejected: { variant: 'destructive', icon: XCircle, label: 'Rejeté' }
    };
    
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Pagination
  const totalPages = Math.ceil(disputes.length / ITEMS_PER_PAGE);
  const paginatedDisputes = disputes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getDecisionBadge = (decision) => {
    if (!decision) return null;
    
    const variants = {
      automob_wins: { variant: 'success', label: 'Vous avez gagné' },
      client_wins: { variant: 'destructive', label: 'Client a gagné' },
      partial: { variant: 'default', label: 'Partiel' },
      rejected: { variant: 'secondary', label: 'Rejeté' }
    };
    
    const config = variants[decision] || variants.rejected;
    
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const disputeTypes = [
    { value: 'payment_issue', label: 'Problème de paiement' },
    { value: 'service_quality', label: 'Qualité du service' },
    { value: 'mission_cancellation', label: 'Annulation de mission' },
    { value: 'communication_issue', label: 'Problème de communication' },
    { value: 'contract_breach', label: 'Non-respect du contrat' },
    { value: 'other', label: 'Autre' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <DashboardLayout
      title="Mes Litiges"
      description="Gérez vos litiges avec les clients"
      menuItems={automobNavigation}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-end">
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Créer un litige
          </Button>
        </div>

        {disputes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun litige</h3>
              <p className="text-muted-foreground text-center mb-4">
                Vous n'avez aucun litige en cours
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4">
              {paginatedDisputes.map(dispute => (
              <Card key={dispute.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{dispute.title}</CardTitle>
                      <CardDescription>
                        Mission: {dispute.mission_title} • 
                        <a 
                          href={`/public/client/${encodeURIComponent((dispute.client_company || dispute.against_email).toLowerCase().replace(/\s+/g, '-'))}`}
                          className="text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {dispute.client_company || dispute.against_email}
                        </a>
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {getStatusBadge(dispute.status)}
                      {dispute.admin_decision && getDecisionBadge(dispute.admin_decision)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {dispute.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Créé le {new Date(dispute.created_at).toLocaleDateString('fr-FR')}
                      </span>
                      {dispute.disputed_amount > 0 && (
                        <span className="font-semibold">
                          Montant: {parseFloat(dispute.disputed_amount).toFixed(2)}€
                        </span>
                      )}
                      {dispute.compensation_amount > 0 && (
                        <Badge variant="success">
                          Compensation: {parseFloat(dispute.compensation_amount).toFixed(2)}€
                        </Badge>
                      )}
                    </div>

                    {dispute.admin_notes && (
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-sm font-semibold mb-1">Note de l'administrateur:</p>
                        <p className="text-sm">{dispute.admin_notes}</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/automob/disputes/${dispute.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Voir détails
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/automob/disputes/${dispute.id}#messages`)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Messages
                      </Button>
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
              totalItems={disputes.length}
            />
          </>
        )}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer un nouveau litige</DialogTitle>
              <DialogDescription>
                Signalez un problème concernant une mission
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="mission">Mission concernée *</Label>
                <Select
                  value={formData.mission_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, mission_id: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une mission" />
                  </SelectTrigger>
                  <SelectContent>
                    {missions.map(mission => (
                      <SelectItem key={mission.id} value={mission.id.toString()}>
                        {mission.title} - {mission.client_company || mission.client_email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="type">Type de litige *</Label>
                <Select
                  value={formData.dispute_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, dispute_type: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {disputeTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Résumé du problème"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description détaillée *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Décrivez le problème en détail..."
                  rows={5}
                  required
                />
              </div>

              <div>
                <Label htmlFor="amount">Montant en litige (€)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.disputed_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, disputed_amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="evidence">Preuves (max 5 fichiers)</Label>
                <Input
                  id="evidence"
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Formats acceptés: JPEG, PNG, PDF, DOC, DOCX (max 10MB par fichier)
                </p>
                
                {formData.evidence.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {formData.evidence.map((file, index) => (
                      <div key={index} className="flex items-center justify-between text-sm bg-muted p-2 rounded">
                        <span className="truncate">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  disabled={submitting}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Création...' : 'Créer le litige'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
    </DashboardLayout>
  );
}
