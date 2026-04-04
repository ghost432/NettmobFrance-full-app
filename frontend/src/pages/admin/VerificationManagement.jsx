import { useState, useEffect } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { CheckCircle, XCircle, Clock, Eye, FileText, User, Mail, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import api, { getAssetUrl } from '@/lib/api';

const VerificationManagement = () => {
  useDocumentTitle('Gestion des Vérifications');
  const { user } = useAuth();
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [revokeReason, setRevokeReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchVerifications();
  }, [filter]);

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/verification/all?status=${filter}`);
      setVerifications(response.data);
    } catch (error) {
      console.error('Erreur récupération vérifications:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir approuver cette vérification ?')) return;

    setProcessing(true);
    try {
      await api.put(`/verification/${id}/approve`);
      toast.success('Vérification approuvée avec succès');
      fetchVerifications();
      setSelectedVerification(null);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'approbation');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Veuillez saisir une raison de rejet');
      return;
    }

    setProcessing(true);
    try {
      await api.put(`/verification/${selectedVerification.id}/reject`, {
        reason: rejectionReason
      });
      toast.success('Vérification rejetée');
      setShowRejectDialog(false);
      setRejectionReason('');
      fetchVerifications();
      setSelectedVerification(null);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors du rejet');
    } finally {
      setProcessing(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeReason.trim()) {
      toast.error('Veuillez saisir une raison de révocation');
      return;
    }

    setProcessing(true);
    try {
      await api.put(`/verification/${selectedVerification.id}/revoke`, {
        reason: revokeReason
      });
      toast.success('Vérification révoquée');
      setShowRevokeDialog(false);
      setRevokeReason('');
      fetchVerifications();
      setSelectedVerification(null);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la révocation');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> En attente</span>;
      case 'approved':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Approuvé</span>;
      case 'rejected':
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs flex items-center gap-1 w-fit"><XCircle className="w-3 h-3" /> Refusé</span>;
      default:
        return null;
    }
  };

  const getRoleBadge = (role) => {
    const colors = {
      automob: 'bg-blue-100 text-blue-700',
      client: 'bg-purple-100 text-purple-700'
    };
    return (
      <span className={`px-2 py-1 ${colors[role]} rounded text-xs font-medium uppercase`}>
        {role}
      </span>
    );
  };

  const displayName = () => {
    return user?.email?.split('@')[0] || 'Admin';
  };

  const getImageUrl = (imagePath) => getAssetUrl(imagePath);

  const avatarSrc = () => getImageUrl(user?.profile?.profile_picture || user?.profile_picture);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <DashboardLayout
      title="Vérifications d'identité"
      description="Approuvez ou rejetez les demandes de vérification d'identité"
      menuItems={adminNavigation}
      getRoleLabel={() => 'Administrateur'}
      getDisplayName={displayName}
      getAvatarSrc={avatarSrc}
    >

      {/* Onglets de filtrage */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            filter === 'pending'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Clock className="w-4 h-4 inline mr-2" />
          En attente
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            filter === 'approved'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <CheckCircle className="w-4 h-4 inline mr-2" />
          Approuvées
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            filter === 'rejected'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <XCircle className="w-4 h-4 inline mr-2" />
          Rejetées
        </button>
        <button
          onClick={() => setFilter('')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            filter === ''
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Toutes
        </button>
      </div>

      {/* Liste des vérifications */}
      {verifications.length === 0 ? (
        <div className="text-center py-16 bg-muted/50 rounded-lg">
          <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-lg text-muted-foreground">Aucune vérification trouvée</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {verifications.map((verification) => (
            <Card key={verification.id} className="hover:shadow-lg transition-all border-l-4" style={{
              borderLeftColor: 
                verification.status === 'pending' ? '#eab308' :
                verification.status === 'approved' ? '#10b981' :
                '#ef4444'
            }}>
              <CardContent className="p-3 sm:p-6">
                <div className="flex flex-col lg:flex-row items-start justify-between gap-3 lg:gap-6">
                  <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-semibold">{verification.full_name}</span>
                          </div>
                          {getRoleBadge(verification.role)}
                          {getStatusBadge(verification.status)}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          {verification.email}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Type:</span>
                            <span className="ml-2 font-medium">
                              {verification.document_type === 'carte_identite' ? 'Carte d\'identité' :
                               verification.document_type === 'passeport' ? 'Passeport' :
                               verification.document_type === 'permis_conduire' ? 'Permis de conduire' :
                               verification.document_type}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">N°:</span>
                            <span className="ml-2 font-mono">{verification.document_number}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Soumis le:</span>
                            <span className="ml-2">{new Date(verification.submitted_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                          {verification.reviewed_at && (
                            <div>
                              <span className="text-muted-foreground">Traité le:</span>
                              <span className="ml-2">{new Date(verification.reviewed_at).toLocaleDateString('fr-FR')}</span>
                            </div>
                          )}
                        </div>

                        {verification.rejection_reason && (
                          <div className="bg-red-50 border border-red-200 rounded p-2 text-sm">
                            <span className="font-semibold text-red-900">Raison du rejet:</span>
                            <p className="text-red-700 mt-1">{verification.rejection_reason}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 w-full lg:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedVerification(verification)}
                          className="w-full lg:w-auto"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Voir
                        </Button>

                        {verification.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(verification.id)}
                              disabled={processing}
                              className="bg-green-600 hover:bg-green-700 w-full lg:w-auto"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approuver
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedVerification(verification);
                                setShowRejectDialog(true);
                              }}
                              disabled={processing}
                              className="w-full lg:w-auto"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Rejeter
                            </Button>
                          </>
                        )}

                        {verification.status === 'approved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedVerification(verification);
                              setShowRevokeDialog(true);
                            }}
                            disabled={processing}
                            className="text-orange-600 hover:text-orange-700 w-full lg:w-auto"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Révoquer
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

      {/* Dialog pour voir le document */}
      <Dialog open={selectedVerification !== null && !showRejectDialog && !showRevokeDialog} onOpenChange={() => setSelectedVerification(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Document d'identité - {selectedVerification?.full_name}</DialogTitle>
            <DialogDescription>
              {selectedVerification?.document_type} - N° {selectedVerification?.document_number}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {selectedVerification && (
              <img
                src={getAssetUrl(selectedVerification.document_path)}
                alt="Document d'identité"
                className="w-full rounded-lg border"
              />
            )}
          </div>
          {selectedVerification?.status === 'pending' && (
            <div className="flex gap-2 mt-4">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => handleApprove(selectedVerification.id)}
                disabled={processing}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approuver
              </Button>
              <Button
                className="flex-1"
                variant="destructive"
                onClick={() => setShowRejectDialog(true)}
                disabled={processing}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rejeter
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog pour rejeter */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la vérification</DialogTitle>
            <DialogDescription>
              Veuillez indiquer la raison du rejet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="reason">Raison du rejet *</Label>
              <Textarea
                id="reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: Document illisible, informations non visibles, document expiré..."
                rows={4}
                className="mt-2"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectionReason('');
                }}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={processing || !rejectionReason.trim()}
                className="flex-1"
              >
                Confirmer le rejet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog pour révoquer */}
      <Dialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Révoquer la vérification</DialogTitle>
            <DialogDescription>
              Cette action révoquera la vérification d'identité approuvée. L'utilisateur devra soumettre à nouveau ses documents.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="revoke-reason">Raison de la révocation *</Label>
              <Textarea
                id="revoke-reason"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Ex: Document expiré, informations non conformes, suspicion de fraude..."
                rows={4}
                className="mt-2"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRevokeDialog(false);
                  setRevokeReason('');
                }}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={handleRevoke}
                disabled={processing || !revokeReason.trim()}
                className="flex-1"
              >
                Confirmer la révocation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default VerificationManagement;
