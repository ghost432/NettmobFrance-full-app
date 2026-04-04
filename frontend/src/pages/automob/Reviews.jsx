import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { automobNavigation } from '@/constants/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MessageSquare, Calendar, Briefcase, TrendingUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';

const Reviews = () => {
  useDocumentTitle('Mes Avis');
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await api.get('/automob/my-reviews');
      setReviews(response.data.reviews || []);
      setStats(response.data.stats || stats);
    } catch (error) {
      console.error('Erreur chargement avis:', error);
      toast.error('Erreur lors du chargement des avis');
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
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const displayName = user?.profile?.first_name && user?.profile?.last_name
    ? `${user.profile.first_name} ${user.profile.last_name}`
    : user?.email || 'Automob';

  return (
    <DashboardLayout
      title="Mes Avis"
      description="Consultez les avis reçus de vos clients"
      menuItems={automobNavigation}
      getRoleLabel={() => 'Auto-entrepreneur'}
      getDisplayName={() => displayName}
    >
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">Total Avis</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold">{stats.totalReviews}</div>
              <p className="text-xs text-muted-foreground">avis reçus</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">Note Moyenne</CardTitle>
              <Star className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold flex items-center gap-2">
                {stats.averageRating.toFixed(1)}
                <span className="text-sm text-muted-foreground">/5</span>
              </div>
              <div className="flex gap-0.5 mt-1">
                {renderStars(Math.round(stats.averageRating))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm font-medium">Taux de Satisfaction</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-2xl font-bold">
                {stats.totalReviews > 0 
                  ? Math.round((stats.averageRating / 5) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">clients satisfaits</p>
            </CardContent>
          </Card>
        </div>

        {/* Rating Distribution */}
        {stats.totalReviews > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Répartition des Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = stats.ratingDistribution[rating] || 0;
                  const percentage = stats.totalReviews > 0 
                    ? (count / stats.totalReviews) * 100 
                    : 0;
                  
                  return (
                    <div key={rating} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-20">
                        <span className="text-sm font-medium">{rating}</span>
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      </div>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-400 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reviews List */}
        <Card>
          <CardHeader>
            <CardTitle>Avis Reçus</CardTitle>
            <CardDescription>
              {reviews.length} avis au total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Chargement...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Aucun avis pour le moment</p>
                <p className="text-sm text-muted-foreground">
                  Complétez des missions pour recevoir des avis de vos clients
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={review.client_avatar} />
                          <AvatarFallback>
                            {review.client_company?.[0] || 'C'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <a 
                            href={`/public/client/${encodeURIComponent((review.client_company || 'entreprise').toLowerCase().replace(/\s+/g, '-'))}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {review.client_company}
                          </a>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Briefcase className="h-3 w-3" />
                            <span>{review.mission_name}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {renderStars(review.rating)}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(review.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-foreground italic">
                      "{review.comment}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Reviews;
