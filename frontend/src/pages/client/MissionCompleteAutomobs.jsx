import { useState, useEffect } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { clientNavigation } from '@/constants/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  ArrowLeft, CheckCircle2, Star, Users, Calendar, Clock, MessageSquare, Mail, Phone, MapPin, Briefcase, Euro, Timer
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';

const MissionCompleteAutomobs = () => {
  useDocumentTitle('Auto-mobs de la mission');
  const { missionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mission, setMission] = useState(null);
  const [automobs, setAutomobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedAutomob, setSelectedAutomob] = useState(null);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchMissionAndAutomobs();
  }, [missionId]);

  const fetchMissionAndAutomobs = async () => {
    try {
      setLoading(true);
      
      // Récupérer les détails de la mission
      const missionResponse = await api.get(`/missions/${missionId}`);
      setMission(missionResponse.data);

      // Récupérer tous les automobs acceptés pour cette mission
      const applicationsResponse = await api.get(`/missions/${missionId}/applications`);
      const acceptedApps = applicationsResponse.data.filter(app => app.status === 'accepte');

      // Pour chaque automob accepté, récupérer son statut dans mission_automobs
      const automobsWithStatus = await Promise.all(
        acceptedApps.map(async (app) => {
          try {
            // Récupérer le statut de la mission pour cet automob
            const statusResponse = await api.get(`/missions/${missionId}/automobs/${app.automob_id}/status`);
            return {
              ...app,
              missionStatus: statusResponse.data.status,
              completed_at: statusResponse.data.completed_at,
              hasReview: statusResponse.data.hasReview
            };
          } catch (error) {
            // Si pas encore dans mission_automobs, statut par défaut
            return {
              ...app,
              missionStatus: 'en_cours',
              completed_at: null,
              hasReview: false
            };
          }
        })
      );

      setAutomobs(automobsWithStatus);
    } catch (error) {
      console.error('Erreur chargement:', error);
      toast.error('Erreur lors du chargement');
      navigate('/client/missions');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteWithReview = (automob) => {
    setSelectedAutomob(automob);
    setReview({ rating: 5, comment: '' });
    setShowReviewDialog(true);
  };

  const handleCompleteWithoutReview = (automob) => {
    setSelectedAutomob(automob);
    setShowConfirmDialog(true);
  };

  const submitCompleteWithReview = async () => {
    if (!review.comment.trim()) {
      toast.error('Veuillez ajouter un commentaire');
      return;
    }

    try {
      setProcessing(true);
      await api.post(`/missions/${missionId}/complete-automob`, {
        automob_id: selectedAutomob.automob_id,
        rating: review.rating,
        comment: review.comment
      });
      
      // Fermer le dialogue et réinitialiser
      setShowReviewDialog(false);
      setSelectedAutomob(null);
      setReview({ rating: 5, comment: '' });
      
      // Attendre le rechargement des données
      await fetchMissionAndAutomobs();
      
      // Afficher le toast après le rechargement
      toast.success('Mission terminée et avis envoyé !');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la finalisation');
    } finally {
      setProcessing(false);
    }
  };

  const submitCompleteWithoutReview = async () => {
    try {
      setProcessing(true);
      await api.post(`/missions/${missionId}/complete-automob`, {
        automob_id: selectedAutomob.automob_id
      });
      
      // Fermer le dialogue et réinitialiser
      setShowConfirmDialog(false);
      setSelectedAutomob(null);
      
      // Attendre le rechargement des données
      await fetchMissionAndAutomobs();
      
      // Afficher le toast après le rechargement
      toast.success('Mission terminée pour cet automob !');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la finalisation');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      en_cours: { label: 'En cours', color: 'bg-blue-500' },
      termine: { label: 'Terminé', color: 'bg-green-600' }
    };
    const variant = variants[status] || variants.en_cours;
    
    return (
      <Badge className={`${variant.color} text-white`}>
        {variant.label}
      </Badge>
    );
  };

  const displayName = () => user?.profile?.company_name || user?.email?.split('@')[0] || 'Client';

  if (loading) {
    return (
      <DashboardLayout
        title="Gérer les automobs"
        description="Finaliser les missions"
        menuItems={clientNavigation}
        getRoleLabel={() => 'Client'}
        getDisplayName={displayName}
      >
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!mission) return null;

  return (
    <DashboardLayout
      title="Gérer les automobs"
      description={mission.mission_name}
      menuItems={clientNavigation}
      getRoleLabel={() => 'Client'}
      getDisplayName={displayName}
    >
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/client/missions')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux missions
        </Button>

        {/* Mission Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{mission.mission_name}</CardTitle>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(mission.start_date).toLocaleDateString('fr-FR')} - {new Date(mission.end_date).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{mission.city}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{automobs.length} automob(s)</span>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Automobs List */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des automobs</CardTitle>
            <CardDescription>
              Marquez les automobs comme terminés et laissez un avis (optionnel)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {automobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Aucun automob sur cette mission</p>
                <p className="text-sm text-muted-foreground">
                  Les automobs acceptés apparaîtront ici
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {automobs.map((automob) => (
                  <Card key={automob.automob_id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        {/* Automob Info */}
                        <div className="flex items-start gap-4 flex-1">
                          <Avatar className="h-16 w-16">
                            <AvatarImage 
                              src={automob.automob_avatar ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${automob.automob_avatar}` : undefined}
                              alt={`${automob.automob_first_name} ${automob.automob_last_name}`}
                            />
                            <AvatarFallback className="text-lg">
                              {automob.automob_first_name?.[0]}{automob.automob_last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-lg font-semibold text-foreground">
                                  {automob.automob_first_name && automob.automob_last_name
                                    ? `${automob.automob_first_name} ${automob.automob_last_name}`
                                    : automob.automob_email || 'Automob'}
                                </h3>
                                {automob.automob_email && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                    <Mail className="h-3 w-3" />
                                    <span>{automob.automob_email}</span>
                                  </div>
                                )}
                                {automob.automob_phone && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                    <Phone className="h-3 w-3" />
                                    <span>{automob.automob_phone}</span>
                                  </div>
                                )}
                              </div>
                              {getStatusBadge(automob.missionStatus)}
                            </div>

                            {/* Mission Details */}
                            <div className="bg-muted rounded-lg p-3 space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <Briefcase className="h-4 w-4 text-primary" />
                                <span className="font-medium">{mission.mission_name}</span>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3 w-3" />
                                  <span>{new Date(mission.start_date).toLocaleDateString('fr-FR')} - {new Date(mission.end_date).toLocaleDateString('fr-FR')}</span>
                                </div>
                                
                                {mission.start_time && mission.end_time && (
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-3 w-3" />
                                    <span>{mission.start_time} - {mission.end_time}</span>
                                  </div>
                                )}
                                
                                <div className="flex items-center gap-2">
                                  <Euro className="h-3 w-3" />
                                  <span>{mission.hourly_rate}€/h</span>
                                </div>
                                
                                {mission.total_hours && (
                                  <div className="flex items-center gap-2">
                                    <Timer className="h-3 w-3" />
                                    <span>{mission.total_hours}h prévues</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Status Info */}
                            {automob.completed_at ? (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>Terminé le {new Date(automob.completed_at).toLocaleDateString('fr-FR')}</span>
                                {automob.hasReview && (
                                  <Badge variant="outline" className="ml-2">
                                    <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                                    Avis laissé
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              automob.accepted_at && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>Accepté le {new Date(automob.accepted_at).toLocaleDateString('fr-FR')}</span>
                                </div>
                              )
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        {automob.missionStatus !== 'termine' && (
                          <div className="flex flex-col gap-2">
                            <Button
                              className="bg-client hover:bg-client-dark text-white"
                              onClick={() => handleCompleteWithReview(automob)}
                            >
                              <Star className="h-4 w-4 mr-2" />
                              Terminer avec avis
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleCompleteWithoutReview(automob)}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Terminer sans avis
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Donner votre avis sur {selectedAutomob?.automob_first_name && selectedAutomob?.automob_last_name
                ? `${selectedAutomob.automob_first_name} ${selectedAutomob.automob_last_name}`
                : selectedAutomob?.automob_email || 'cet automob'}
            </DialogTitle>
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
              onClick={() => {
                setShowReviewDialog(false);
                setSelectedAutomob(null);
                setReview({ rating: 5, comment: '' });
              }}
              disabled={processing}
            >
              Annuler
            </Button>
            <Button 
              className="bg-client hover:bg-client-dark text-white"
              onClick={submitCompleteWithReview}
              disabled={processing || !review.comment.trim()}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              {processing ? 'Envoi...' : 'Envoyer et terminer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog (Without Review) */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terminer la mission sans avis</DialogTitle>
            <DialogDescription>
              Confirmez-vous vouloir marquer cette mission comme terminée pour <strong>{selectedAutomob?.automob_first_name && selectedAutomob?.automob_last_name
                ? `${selectedAutomob.automob_first_name} ${selectedAutomob.automob_last_name}`
                : selectedAutomob?.automob_email || 'cet automob'}</strong> sans laisser d'avis ?
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowConfirmDialog(false);
                setSelectedAutomob(null);
              }}
              disabled={processing}
            >
              Annuler
            </Button>
            <Button 
              onClick={submitCompleteWithoutReview}
              disabled={processing}
            >
              {processing ? 'Finalisation...' : 'Confirmer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default MissionCompleteAutomobs;
