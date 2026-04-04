import { useState, useEffect } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { automobNavigation } from '@/constants/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeft, Star, Users, Calendar, Clock, MessageSquare, Mail, Phone, MapPin, Euro, Timer, CheckCircle2, Award, Briefcase
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';

const CompletedMissions = () => {
  useDocumentTitle('Missions Terminées');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompletedMissions();
  }, []);

  const fetchCompletedMissions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/automob/completed-missions');
      setMissions(response.data);
    } catch (error) {
      console.error('Erreur chargement missions terminées:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const displayName = () => {
    if (user?.profile?.first_name && user?.profile?.last_name) {
      return `${user.profile.first_name} ${user.profile.last_name}`;
    }
    return user?.email?.split('@')[0] || 'Automob';
  };

  return (
    <DashboardLayout
      title="Missions Terminées"
      description="Vos missions complétées et les avis reçus"
      menuItems={automobNavigation}
      getRoleLabel={() => 'Auto-mob'}
      getDisplayName={displayName}
    >
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/automob/my-missions')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à mes missions
        </Button>

        {/* Stats Card */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">Total terminées</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold">{missions.length}</div>
              <p className="text-xs text-muted-foreground">missions complétées</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">Avis reçus</CardTitle>
              <MessageSquare className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold">
                {missions.filter(m => m.review).length}
              </div>
              <p className="text-xs text-muted-foreground">clients ont laissé un avis</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">Note moyenne</CardTitle>
              <Award className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold">
                {missions.filter(m => m.review).length > 0
                  ? (missions.filter(m => m.review).reduce((acc, m) => acc + m.review.rating, 0) / missions.filter(m => m.review).length).toFixed(1)
                  : '—'}
              </div>
              <p className="text-xs text-muted-foreground">sur 5 étoiles</p>
            </CardContent>
          </Card>
        </div>

        {/* Missions List */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des missions terminées</CardTitle>
            <CardDescription>
              {missions.length} mission(s) terminée(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Chargement...</p>
              </div>
            ) : missions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Aucune mission terminée</p>
                <p className="text-sm text-muted-foreground">
                  Vos missions terminées apparaîtront ici
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {missions.map((mission) => (
                  <Card key={mission.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Mission Header */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start gap-3">
                              <Avatar className="h-12 w-12">
                                <AvatarImage 
                                  src={mission.client_avatar ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${mission.client_avatar}` : undefined}
                                  alt={mission.client_name}
                                />
                                <AvatarFallback>
                                  {mission.client_name?.charAt(0) || 'C'}
                                </AvatarFallback>
                              </Avatar>

                              <div className="flex-1 space-y-2">
                                <h3 className="text-lg font-semibold">{mission.mission_name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  Client: {mission.client_name}
                                </p>
                                
                                <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>
                                      {new Date(mission.start_date).toLocaleDateString('fr-FR')} - {new Date(mission.end_date).toLocaleDateString('fr-FR')}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    <span>{mission.city}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Euro className="h-3 w-3 text-green-600" />
                                    <span className="font-medium">{mission.hourly_rate}€/h</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <Badge className="bg-green-600 text-white">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Terminée
                          </Badge>
                        </div>

                        {/* Completion Info */}
                        <div className="bg-muted rounded-lg p-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span>
                              Mission terminée le {new Date(mission.completed_at).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Review Section */}
                        {mission.review ? (
                          <div className="border-t pt-4">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0">
                                <div className="bg-yellow-50 rounded-full p-3">
                                  <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                                </div>
                              </div>
                              
                              <div className="flex-1 space-y-3">
                                <div>
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="font-semibold">Avis du client</h4>
                                    {renderStars(mission.review.rating)}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Reçu le {new Date(mission.review.created_at).toLocaleDateString('fr-FR', {
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric'
                                    })}
                                  </p>
                                </div>

                                <div className="bg-muted rounded-lg p-4">
                                  <p className="text-sm italic">"{mission.review.comment}"</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="border-t pt-4">
                            <div className="bg-muted rounded-lg p-4 text-center">
                              <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">
                                Le client n'a pas encore laissé d'avis pour cette mission
                              </p>
                            </div>
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
    </DashboardLayout>
  );
};

export default CompletedMissions;
