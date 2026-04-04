import { useState, useEffect } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import {
  CheckCircle, XCircle, Clock, Eye, Download, ExternalLink,
  User, Building2, FileText, Camera, Award, HardHat, Mail, Phone, MapPin
} from 'lucide-react';
import api from '@/lib/api';

const VerificationManagementNew = () => {
  useDocumentTitle('Gestion des Vérifications');
  const { user } = useAuth();
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState('all');

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${cleanPath}`;
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/verification-new/admin/all');
      const verifs = response.data.verifications || [];

      // Debug: afficher les fichiers reçus
      verifs.forEach(v => {
        console.log(`Frontend - Verification ${v.id}:`, {
          has_habilitations: v.has_habilitations,
          nombre_habilitations: v.nombre_habilitations,
          habilitations_files: v.habilitations_files,
          habilitations_files_type: typeof v.habilitations_files,
          habilitations_files_length: v.habilitations_files?.length,
          has_caces: v.has_caces,
          nombre_caces: v.nombre_caces,
          caces_files: v.caces_files,
          caces_files_type: typeof v.caces_files,
          caces_files_length: v.caces_files?.length
        });
      });

      setVerifications(verifs);
    } catch (error) {
      console.error('Erreur chargement vérifications:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir approuver cette demande ?')) return;

    setProcessing(true);
    try {
      await api.put(`/verification-new/admin/${id}/approve`);
      toast.success('Demande approuvée avec succès');
      fetchVerifications();
      setShowDetailDialog(false);
    } catch (error) {
      console.error('Erreur approbation:', error);
      toast.error('Erreur lors de l\'approbation');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Veuillez indiquer une raison de rejet');
      return;
    }

    setProcessing(true);
    try {
      await api.put(`/verification-new/admin/${selectedVerification.id}/reject`, {
        rejection_reason: rejectionReason
      });
      toast.success('Demande rejetée');
      fetchVerifications();
      setShowRejectDialog(false);
      setShowDetailDialog(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Erreur rejet:', error);
      toast.error('Erreur lors du rejet');
    } finally {
      setProcessing(false);
    }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir révoquer cette vérification ? L\'utilisateur devra soumettre une nouvelle demande.')) return;

    setProcessing(true);
    try {
      await api.put(`/verification-new/admin/${id}/revoke`);
      toast.success('Vérification révoquée avec succès');
      fetchVerifications();
      setShowDetailDialog(false);
    } catch (error) {
      console.error('Erreur révocation:', error);
      toast.error('Erreur lors de la révocation');
    } finally {
      setProcessing(false);
    }
  };

  const openDocument = (path) => {
    if (!path) return;
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${path}`;
    window.open(url, '_blank');
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      approved: { label: 'Approuvé', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      rejected: { label: 'Rejeté', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
    };

    const config = variants[status] || variants.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const filteredVerifications = verifications.filter(v => {
    if (filter === 'all') return true;
    return v.status === filter;
  });

  const DocumentCard = ({ label, path, icon: Icon = FileText }) => {
    if (!path) return null;

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">
                  {path.endsWith('.pdf') ? 'PDF' : 'Image'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => openDocument(path)}
              >
                <Eye className="h-4 w-4 mr-1" />
                Voir
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${path}`;
                  link.download = path.split('/').pop();
                  link.click();
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const VerificationDetail = ({ verification }) => {
    if (!verification) return null;

    const isAutomob = verification.user_type === 'automob';

    return (
      <div className="space-y-6 max-h-[70vh] overflow-y-auto">
        {/* En-tête */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              {isAutomob ? (
                `${verification.first_name} ${verification.last_name}`
              ) : (
                `${verification.manager_first_name} ${verification.manager_last_name}`
              )}
            </h3>
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
              {isAutomob ? <User className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
              {isAutomob ? 'Auto-entrepreneur' : 'Client'}
            </p>
          </div>
          {getStatusBadge(verification.status)}
        </div>

        {/* Informations personnelles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations {isAutomob ? 'personnelles' : 'du gérant'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="text-sm flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  {isAutomob ? verification.email : verification.manager_email}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Téléphone</Label>
                <p className="text-sm flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  {isAutomob ? verification.phone : verification.manager_phone}
                </p>
              </div>
            </div>
            {!isAutomob && verification.manager_position && (
              <div>
                <Label className="text-xs text-muted-foreground">Poste</Label>
                <p className="text-sm">{verification.manager_position}</p>
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">Adresse</Label>
              <p className="text-sm flex items-start gap-2">
                <MapPin className="h-3 w-3 mt-0.5" />
                {isAutomob ? verification.address : verification.manager_address}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Documents d'identité */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Documents d'identité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Type de document</Label>
              <p className="text-sm capitalize">{verification.document_type?.replace('_', ' ')}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <DocumentCard label="Recto" path={verification.document_recto} icon={FileText} />
              <DocumentCard label="Verso" path={verification.document_verso} icon={FileText} />
            </div>
            <DocumentCard label="Selfie avec document" path={verification.selfie_with_document} icon={Camera} />
          </CardContent>
        </Card>

        {/* Documents professionnels - AUTOMOB */}
        {isAutomob && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documents professionnels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <DocumentCard label="Assurance RC Pro" path={verification.assurance_rc} icon={FileText} />
                <DocumentCard label="Justificatif domicile" path={verification.justificatif_domicile} icon={FileText} />
                <DocumentCard label="Avis INSEE" path={verification.avis_insee} icon={FileText} />
                <DocumentCard label="Attestation URSSAF" path={verification.attestation_urssaf} icon={FileText} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documents entreprise - CLIENT */}
        {!isAutomob && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documents entreprise</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <DocumentCard label="Extrait KBIS" path={verification.kbis} icon={Building2} />
                <DocumentCard label="Justificatif domicile" path={verification.justificatif_domicile} icon={FileText} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Habilitations & CACES - AUTOMOB */}
        {isAutomob && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Habilitations & Certifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Habilitations */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    <Label className="text-sm font-medium">Possède des habilitations ?</Label>
                  </div>
                  <Badge className={verification.has_habilitations ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}>
                    {verification.has_habilitations ? 'Oui' : 'Non'}
                  </Badge>
                </div>

                {verification.has_habilitations && (
                  <>
                    <div className="pl-6">
                      <Label className="text-xs text-muted-foreground">Nombre d'habilitations</Label>
                      <p className="text-sm font-medium">{verification.nombre_habilitations}</p>
                    </div>
                    {verification.habilitations_files && verification.habilitations_files.length > 0 ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        {verification.habilitations_files.map((path, index) => (
                          <DocumentCard
                            key={index}
                            label={`Habilitation ${index + 1}`}
                            path={path}
                            icon={Award}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground pl-6">Aucun document fourni</p>
                    )}
                  </>
                )}
              </div>

              {/* CACES */}
              <div className="space-y-3 pt-3 border-t">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <HardHat className="h-4 w-4 text-primary" />
                    <Label className="text-sm font-medium">Possède des permis CACES ?</Label>
                  </div>
                  <Badge className={verification.has_caces ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}>
                    {verification.has_caces ? 'Oui' : 'Non'}
                  </Badge>
                </div>

                {verification.has_caces && (
                  <>
                    <div className="pl-6">
                      <Label className="text-xs text-muted-foreground">Nombre de CACES</Label>
                      <p className="text-sm font-medium">{verification.nombre_caces}</p>
                    </div>
                    {verification.caces_files && verification.caces_files.length > 0 ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        {verification.caces_files.map((path, index) => (
                          <DocumentCard
                            key={index}
                            label={`CACES ${index + 1}`}
                            path={path}
                            icon={HardHat}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground pl-6">Aucun document fourni</p>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Présentation */}
        {verification.presentation && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Présentation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{verification.presentation}</p>
            </CardContent>
          </Card>
        )}

        {/* Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations de traitement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <Label className="text-xs text-muted-foreground">Date de soumission</Label>
              <p>{new Date(verification.submitted_at).toLocaleString('fr-FR')}</p>
            </div>
            {verification.reviewed_at && (
              <div>
                <Label className="text-xs text-muted-foreground">Date de traitement</Label>
                <p>{new Date(verification.reviewed_at).toLocaleString('fr-FR')}</p>
              </div>
            )}
            {verification.rejection_reason && (
              <div>
                <Label className="text-xs text-muted-foreground">Raison du rejet</Label>
                <p className="text-red-600 dark:text-red-400">{verification.rejection_reason}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        {verification.status === 'pending' && (
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={() => handleApprove(verification.id)}
              disabled={processing}
              className="flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approuver
            </Button>
            <Button
              onClick={() => {
                setShowDetailDialog(false);
                setShowRejectDialog(true);
              }}
              disabled={processing}
              variant="destructive"
              className="flex-1"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rejeter
            </Button>
          </div>
        )}

        {verification.status === 'approved' && (
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={() => handleRevoke(verification.id)}
              disabled={processing}
              variant="destructive"
              className="w-full"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Révoquer la vérification
            </Button>
          </div>
        )}
      </div>
    );
  };

  const displayName = () => user?.email?.split('@')[0] || 'Admin';

  return (
    <DashboardLayout
      title="Vérifications d'identité"
      description="Gérez les demandes de vérification complètes"
      menuItems={adminNavigation}
      getRoleLabel={() => 'Administrateur'}
      getDisplayName={displayName}
    >
      <div className="space-y-6">
        {/* Filtres et statistiques */}
        <div className="flex flex-wrap gap-4">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            Toutes ({verifications.length})
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilter('pending')}
            className="gap-2"
          >
            <Clock className="h-4 w-4" />
            En attente ({verifications.filter(v => v.status === 'pending').length})
          </Button>
          <Button
            variant={filter === 'approved' ? 'default' : 'outline'}
            onClick={() => setFilter('approved')}
            className="gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Approuvées ({verifications.filter(v => v.status === 'approved').length})
          </Button>
          <Button
            variant={filter === 'rejected' ? 'default' : 'outline'}
            onClick={() => setFilter('rejected')}
            className="gap-2"
          >
            <XCircle className="h-4 w-4" />
            Rejetées ({verifications.filter(v => v.status === 'rejected').length})
          </Button>
        </div>

        {/* Liste des vérifications */}
        {loading ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Chargement...
            </CardContent>
          </Card>
        ) : filteredVerifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Aucune demande de vérification
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredVerifications.map((verification) => {
              const isAutomob = verification.user_type === 'automob';
              return (
                <Card key={verification.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex gap-4 flex-1">
                        <div className="rounded-full overflow-hidden w-12 h-12 flex-shrink-0 bg-primary/10 flex items-center justify-center">
                          {verification.user_avatar ? (
                            <img 
                              src={getImageUrl(verification.user_avatar)} 
                              alt="Avatar" 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                e.target.nextElementSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={verification.user_avatar ? "hidden w-full h-full items-center justify-center" : "w-full h-full flex items-center justify-center"}>
                            {isAutomob ? <User className="h-6 w-6 text-primary" /> : <Building2 className="h-6 w-6 text-primary" />}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">
                            {isAutomob ? (
                              `${verification.first_name} ${verification.last_name}`
                            ) : (
                              `${verification.manager_first_name} ${verification.manager_last_name}`
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {verification.user_email}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Soumis le {new Date(verification.submitted_at).toLocaleDateString('fr-FR')} à {new Date(verification.submitted_at).toLocaleTimeString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                        {getStatusBadge(verification.status)}
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedVerification(verification);
                            setShowDetailDialog(true);
                          }}
                          className="w-full sm:w-auto"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir détails
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Dialog Détails */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Détails de la demande</DialogTitle>
              <DialogDescription>
                Vérifiez tous les documents avant d'approuver ou rejeter
              </DialogDescription>
            </DialogHeader>
            {selectedVerification && <VerificationDetail verification={selectedVerification} />}
          </DialogContent>
        </Dialog>

        {/* Dialog Rejet */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rejeter la demande</DialogTitle>
              <DialogDescription>
                Indiquez la raison du rejet pour informer l'utilisateur
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Raison du rejet *</Label>
                <Textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  placeholder="Ex: Document d'identité illisible, KBIS expiré, etc."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectionReason('');
                }}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={processing || !rejectionReason.trim()}
              >
                {processing ? 'Rejet en cours...' : 'Confirmer le rejet'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default VerificationManagementNew;
