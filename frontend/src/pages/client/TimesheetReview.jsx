import { useState, useEffect } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { clientNavigation } from '@/constants/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  ArrowLeft, CheckCircle, XCircle, Clock, Calendar, User, FileText, AlertCircle, Star, MessageSquare
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';

const TimesheetReview = () => {
  useDocumentTitle('Relevés d\'heures');
  const { timesheetId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [timesheet, setTimesheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionDialog, setActionDialog] = useState({ open: false, action: null });
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [review, setReview] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    fetchTimesheetDetails();
  }, [timesheetId]);

  const fetchTimesheetDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/timesheets/client/${timesheetId}`);
      setTimesheet(response.data);
    } catch (error) {
      console.error('Erreur chargement timesheet:', error);
      toast.error('Erreur lors du chargement');
      navigate('/client/missions');
    } finally {
      setLoading(false);
    }
  };

  const openActionDialog = (action) => {
    setActionDialog({ open: true, action });
    setRejectionReason('');
  };

  const closeActionDialog = () => {
    setActionDialog({ open: false, action: null });
    setRejectionReason('');
  };

  const handleApprove = async () => {
    try {
      setProcessing(true);
      const response = await api.patch(`/timesheets/${timesheetId}/approve`);
      
      // Fermer le dialogue
      closeActionDialog();
      
      // Si la mission est terminée, demander si le client veut marquer comme terminé
      if (response.data?.missionCompleted) {
        setShowCompletionDialog(true);
      } else {
        // Attendre le rechargement des données
        await fetchTimesheetDetails();
      }
      
      // Afficher le toast après le rechargement
      toast.success('Feuille de temps approuvée avec succès');
    } catch (error) {
      console.error('Erreur approbation:', error);
      
      // Handle specific error cases
      if (error.response?.data?.alreadyApproved) {
        toast.info('Cette feuille de temps est déjà approuvée');
        // Refresh to update UI
        await fetchTimesheetDetails();
      } else if (error.response?.status === 400) {
        toast.error(error.response?.data?.error || 'Action non autorisée');
        await fetchTimesheetDetails();
      } else {
        toast.error(error.response?.data?.error || 'Erreur lors de l\'approbation');
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleCompleteMissionWithReview = async () => {
    if (!review.comment.trim()) {
      toast.error('Veuillez ajouter un commentaire');
      return;
    }
    
    try {
      setProcessing(true);
      await api.post(`/missions/${timesheet.mission_id}/complete-automob`, {
        automob_id: timesheet.automob_id,
        rating: review.rating,
        comment: review.comment
      });
      toast.success('Mission terminée et avis envoyé !');
      setShowReviewDialog(false);
      setShowCompletionDialog(false);
      navigate(`/client/mission/${timesheet.mission_id}`);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la finalisation');
    } finally {
      setProcessing(false);
    }
  };

  const handleCompleteMissionWithoutReview = async () => {
    try {
      setProcessing(true);
      await api.post(`/missions/${timesheet.mission_id}/complete-automob`, {
        automob_id: timesheet.automob_id
      });
      toast.success('Mission terminée !');
      setShowCompletionDialog(false);
      navigate(`/client/mission/${timesheet.mission_id}`);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la finalisation');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Veuillez indiquer la raison du refus');
      return;
    }

    try {
      setProcessing(true);
      await api.patch(`/timesheets/${timesheetId}/reject`, {
        reason: rejectionReason
      });
      
      // Fermer le dialogue
      closeActionDialog();
      
      // Attendre le rechargement des données
      await fetchTimesheetDetails();
      
      // Afficher le toast après le rechargement
      toast.success('Feuille de temps refusée');
    } catch (error) {
      console.error('Erreur refus:', error);
      toast.error(error.response?.data?.error || 'Erreur lors du refus');
      await fetchTimesheetDetails();
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      brouillon: { label: 'Brouillon', color: 'bg-gray-500', icon: FileText },
      soumis: { label: 'En attente', color: 'bg-blue-500', icon: Clock },
      approuve: { label: 'Approuvée', color: 'bg-green-600', icon: CheckCircle },
      rejete: { label: 'Refusée', color: 'bg-red-600', icon: XCircle }
    };
    const variant = variants[status] || variants.brouillon;
    const Icon = variant.icon;
    
    return (
      <Badge className={`${variant.color} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {variant.label}
      </Badge>
    );
  };

  const displayName = user?.profile?.company_name || user?.email?.split('@')[0] || 'Client';

  if (loading) {
    return (
      <DashboardLayout
        title="Feuille de temps"
        description="Validation des heures"
        menuItems={clientNavigation}
        getRoleLabel={() => 'Client'}
        getDisplayName={() => displayName}
      >
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!timesheet) return null;

  const totalHours = timesheet.total_hours || 0;
  const overtimeHours = timesheet.overtime_hours || 0;
  const normalHours = totalHours - overtimeHours;

  return (
    <DashboardLayout
      title="Validation feuille de temps"
      description="Vérifier et valider les heures travaillées"
      menuItems={clientNavigation}
      getRoleLabel={() => 'Client'}
      getDisplayName={() => displayName}
    >
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(`/client/mission/${timesheet.mission_id}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la mission
        </Button>

        {/* Timesheet Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl">{timesheet.mission_name}</CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{timesheet.automob_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(timesheet.period_start).toLocaleDateString('fr-FR')} - {new Date(timesheet.period_end).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="font-semibold">{totalHours}h</span>
                  </div>
                </div>
              </div>
              {getStatusBadge(timesheet.status)}
            </div>
          </CardHeader>
        </Card>

        {/* Overtime Warning */}
        {overtimeHours > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-orange-900">⚠️ Heures supplémentaires détectées</p>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-orange-700">Heures normales : <span className="font-semibold">{normalHours}h</span></p>
                    </div>
                    <div>
                      <p className="text-sm text-orange-700">Heures supplémentaires : <span className="font-semibold">{overtimeHours}h</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rejection Reason if rejected */}
        {timesheet.status === 'rejete' && timesheet.rejection_reason && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900">Raison du refus :</p>
                  <p className="text-sm text-red-800 mt-1">{timesheet.rejection_reason}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Entries Table */}
        <Card>
          <CardHeader>
            <CardTitle>Détail des heures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Début</th>
                    <th className="text-left py-3 px-4">Fin</th>
                    <th className="text-left py-3 px-4">Pause (min)</th>
                    <th className="text-right py-3 px-4">Heures</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Heures normales */}
                  {timesheet.entries?.filter(e => !e.is_overtime).map((entry) => (
                    <tr key={entry.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {new Date(entry.work_date).toLocaleDateString('fr-FR', { 
                          weekday: 'short', 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </td>
                      <td className="py-3 px-4">{entry.start_time}</td>
                      <td className="py-3 px-4">{entry.end_time}</td>
                      <td className="py-3 px-4">{entry.break_duration || 0} min</td>
                      <td className="py-3 px-4 text-right font-semibold">{entry.hours_worked}h</td>
                    </tr>
                  ))}
                  
                  {/* Heures supplémentaires */}
                  {timesheet.entries?.filter(e => e.is_overtime).length > 0 && (
                    <>
                      <tr className="bg-orange-50">
                        <td colSpan="5" className="py-2 px-4 text-sm font-semibold text-orange-800">
                          ⚠️ Heures supplémentaires
                        </td>
                      </tr>
                      {timesheet.entries?.filter(e => e.is_overtime).map((entry) => (
                        <tr key={entry.id} className="border-b hover:bg-orange-50 bg-orange-50/50">
                          <td className="py-3 px-4">
                            {new Date(entry.work_date).toLocaleDateString('fr-FR', { 
                              weekday: 'short', 
                              day: 'numeric', 
                              month: 'short' 
                            })}
                          </td>
                          <td className="py-3 px-4">{entry.start_time}</td>
                          <td className="py-3 px-4">{entry.end_time}</td>
                          <td className="py-3 px-4">{entry.break_duration || 0} min</td>
                          <td className="py-3 px-4 text-right font-semibold text-orange-700">
                            {entry.hours_worked}h
                            <span className="ml-2 text-xs bg-orange-200 px-2 py-0.5 rounded">Supp.</span>
                          </td>
                        </tr>
                      ))}
                    </>
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-semibold">
                    <td colSpan="4" className="py-3 px-4 text-right">Total :</td>
                    <td className="py-3 px-4 text-right text-lg">{totalHours}h</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {timesheet.status === 'soumis' && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Validez ou refusez cette feuille de temps
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => openActionDialog('reject')}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Refuser
                  </Button>
                  <Button
                    className="bg-client hover:bg-client-dark text-white"
                    onClick={() => openActionDialog('approve')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approuver
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Approval Dialog */}
      <Dialog open={actionDialog.open && actionDialog.action === 'approve'} onOpenChange={closeActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approuver la feuille de temps</DialogTitle>
            <DialogDescription>
              Confirmez-vous l'approbation de cette feuille de temps de {totalHours}h ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeActionDialog} disabled={processing}>
              Annuler
            </Button>
            <Button 
              className="bg-client hover:bg-client-dark text-white" 
              onClick={handleApprove}
              disabled={processing}
            >
              {processing ? 'Approbation...' : 'Confirmer l\'approbation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={actionDialog.open && actionDialog.action === 'reject'} onOpenChange={closeActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser la feuille de temps</DialogTitle>
            <DialogDescription>
              Indiquez la raison du refus pour que l'auto-mob puisse corriger.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Raison du refus *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Ex: Heures incorrectes le 15/11, pause non déduite..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeActionDialog} disabled={processing}>
              Annuler
            </Button>
            <Button 
              variant="destructive"
              onClick={handleReject}
              disabled={processing}
            >
              {processing ? 'Refus...' : 'Confirmer le refus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mission Completion Dialog */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🎉 Toutes les heures sont approuvées !</DialogTitle>
            <DialogDescription>
              Souhaitez-vous marquer cette mission comme terminée pour {timesheet?.automob_name} ?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              En marquant la mission comme terminée, l'automob sera notifié et vous pourrez laisser un avis sur son travail.
            </p>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCompletionDialog(false);
                fetchTimesheetDetails();
              }}
            >
              Plus tard
            </Button>
            <Button 
              variant="secondary"
              onClick={handleCompleteMissionWithoutReview}
              disabled={processing}
            >
              Terminer sans avis
            </Button>
            <Button 
              className="bg-client hover:bg-client-dark text-white"
              onClick={() => {
                setShowCompletionDialog(false);
                setShowReviewDialog(true);
              }}
            >
              <Star className="h-4 w-4 mr-2" />
              Terminer avec avis
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Donner votre avis sur {timesheet?.automob_name}</DialogTitle>
            <DialogDescription>
              Votre avis aidera les autres clients et l'automob à s'améliorer
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Rating */}
            <div>
              <Label>Note</Label>
              <div className="flex gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReview({ ...review, rating: star })}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= review.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div>
              <Label htmlFor="comment">Commentaire *</Label>
              <Textarea
                id="comment"
                value={review.comment}
                onChange={(e) => setReview({ ...review, comment: e.target.value })}
                placeholder="Partagez votre expérience avec cet automob..."
                rows={4}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowReviewDialog(false)}
              disabled={processing}
            >
              Annuler
            </Button>
            <Button 
              className="bg-client hover:bg-client-dark text-white"
              onClick={handleCompleteMissionWithReview}
              disabled={processing || !review.comment.trim()}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              {processing ? 'Envoi...' : 'Envoyer et terminer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default TimesheetReview;
