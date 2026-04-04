import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingScreen, PageLoader } from '@/components/LoadingScreen';
import {
  Star,
  MessageCircle,
  User,
  Calendar,
  Filter,
  Eye,
  EyeOff,
  TrendingUp,
  BarChart3,
  Users,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Send,
  Heart
} from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import api from '@/lib/api';

const FeedbackManagement = () => {
  useDocumentTitle('Gestion des Avis');
  const { user } = useAuth();
  
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({
    category: 'all',
    rating: 'all'
  });
  const [sendingThanks, setSendingThanks] = useState(false);
  const [thanksResult, setThanksResult] = useState(null);

  const categories = [
    { value: 'all', label: 'Toutes les catégories' },
    { value: 'general', label: '🎯 Général' },
    { value: 'performance', label: '⚡ Performance' },
    { value: 'interface', label: '🎨 Interface' },
    { value: 'fonctionnalites', label: '🛠️ Fonctionnalités' },
    { value: 'bugs', label: '🐛 Problèmes' }
  ];

  const ratings = [
    { value: 'all', label: 'Toutes les notes' },
    { value: '5', label: '⭐⭐⭐⭐⭐ (5 étoiles)' },
    { value: '4', label: '⭐⭐⭐⭐ (4 étoiles)' },
    { value: '3', label: '⭐⭐⭐ (3 étoiles)' },
    { value: '2', label: '⭐⭐ (2 étoiles)' },
    { value: '1', label: '⭐ (1 étoile)' }
  ];

  const fetchFeedbacks = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...filters
      });

      const response = await api.get(`/feedback/all?${params}`);
      setFeedbacks(response.data.feedbacks);
      setPagination(response.data.pagination);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Erreur chargement avis:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks(currentPage);
  }, [currentPage, filters]);

  const handleMarkAsRead = async (feedbackId) => {
    try {
      await api.patch(`/feedback/${feedbackId}/mark-read`);
      // Mettre à jour localement
      setFeedbacks(prev => prev.map(f => 
        f.id === feedbackId ? { ...f, is_read: true, read_at: new Date().toISOString() } : f
      ));
    } catch (error) {
      console.error('Erreur marquage lu:', error);
    }
  };

  const handleSendThanksToAll = async () => {
    if (!confirm('Êtes-vous sûr de vouloir envoyer un message de remerciement à tous les utilisateurs qui ont soumis un avis ? Cela enverra une notification, un email et une notification push web à chacun d\'entre eux.')) {
      return;
    }

    try {
      setSendingThanks(true);
      setThanksResult(null);
      const response = await api.post('/feedback/send-thanks-to-all');
      setThanksResult(response.data);
      setTimeout(() => setThanksResult(null), 10000); // Clear after 10 seconds
    } catch (error) {
      console.error('Erreur envoi remerciements:', error);
      alert('Erreur lors de l\'envoi des remerciements. Veuillez réessayer.');
    } finally {
      setSendingThanks(false);
    }
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-green-600 bg-green-100 dark:bg-green-900/20';
    if (rating === 3) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
    return 'text-red-600 bg-red-100 dark:bg-red-900/20';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      general: '🎯',
      performance: '⚡',
      interface: '🎨',
      fonctionnalites: '🛠️',
      bugs: '🐛'
    };
    return icons[category] || '📝';
  };

  const getRoleColor = (role) => {
    return role === 'client' 
      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
      : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
  };

  if (loading && !feedbacks.length) {
    return <LoadingScreen message="Chargement des avis..." />;
  }

  return (
    <DashboardLayout
      title="Gestion des Avis"
      description="Consultez et gérez les retours utilisateurs"
      menuItems={adminNavigation}
      getRoleLabel={() => 'Administrateur'}
    >
      <div className="space-y-6">
        {/* Statistiques */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
                <CardTitle className="text-sm font-medium">Total Avis</CardTitle>
                <MessageCircle className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                <div className="text-2xl font-bold text-blue-600">{stats.total_feedback}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
                <CardTitle className="text-sm font-medium">Note Moyenne</CardTitle>
                <Star className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                <div className="text-2xl font-bold text-yellow-600">
                  {parseFloat(stats.average_rating).toFixed(1)}/5
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
                <CardTitle className="text-sm font-medium">Avis Positifs</CardTitle>
                <ThumbsUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                <div className="text-2xl font-bold text-green-600">{stats.positive_feedback}</div>
                <p className="text-xs text-muted-foreground">≥ 4 étoiles</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
                <CardTitle className="text-sm font-medium">Avis Négatifs</CardTitle>
                <ThumbsDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                <div className="text-2xl font-bold text-red-600">{stats.negative_feedback}</div>
                <p className="text-xs text-muted-foreground">≤ 2 étoiles</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4 sm:pb-2">
                <CardTitle className="text-sm font-medium">Cette Semaine</CardTitle>
                <Clock className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                <div className="text-2xl font-bold text-purple-600">{stats.recent_feedback}</div>
                <p className="text-xs text-muted-foreground">7 derniers jours</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bouton d'envoi de remerciements */}
        {stats && stats.total_feedback > 0 && (
          <Card className="border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-pink-700 dark:text-pink-400">
                <Heart className="h-5 w-5" />
                Remercier les utilisateurs
              </CardTitle>
              <CardDescription>
                Envoyez un message de remerciement à tous les utilisateurs qui ont pris le temps de donner leur avis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleSendThanksToAll}
                disabled={sendingThanks}
                className="w-full md:w-auto bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white gap-2"
              >
                {sendingThanks ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Envoyer les remerciements ({stats.total_feedback} utilisateur{stats.total_feedback > 1 ? 's' : ''})
                  </>
                )}
              </Button>

              {thanksResult && (
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                        <Heart className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                        ✅ {thanksResult.message}
                      </h4>
                      <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                        <p>📧 {thanksResult.stats.emailsSent} emails envoyés</p>
                        <p>🔔 {thanksResult.stats.notificationsSent} notifications envoyées</p>
                        <p>📱 {thanksResult.stats.pushSent} notifications push web envoyées</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Filtres */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-2 block">Catégorie</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Note</label>
                <select
                  value={filters.rating}
                  onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value }))}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {ratings.map(rating => (
                    <option key={rating.value} value={rating.value}>{rating.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des avis */}
        <div className="space-y-4">
          {feedbacks.length === 0 ? (
            <Card>
              <CardContent className="text-center py-10">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucun avis trouvé avec ces filtres</p>
              </CardContent>
            </Card>
          ) : (
            feedbacks.map((feedback) => (
              <Card key={feedback.id} className={`transition-all hover:shadow-md ${
                !feedback.is_read ? 'border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/10' : ''
              }`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge className={getRoleColor(feedback.user_role)}>
                          {feedback.user_role === 'client' ? '🏢 Client' : '⚡ Automob'}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          {getCategoryIcon(feedback.category)}
                          {categories.find(c => c.value === feedback.category)?.label.replace(/^.*?\s/, '') || feedback.category}
                        </Badge>
                        {!feedback.is_read && (
                          <Badge className="bg-blue-500 text-white">Nouveau</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{feedback.user_display_name}</span>
                          <span className="text-sm text-muted-foreground">({feedback.user_email})</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{feedback.formatted_date}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${getRatingColor(feedback.rating)}`}>
                        <Star className="h-4 w-4 fill-current" />
                        <span className="font-semibold">{feedback.rating}/5</span>
                      </div>
                      {!feedback.is_read && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkAsRead(feedback.id)}
                          className="gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          Marquer lu
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Commentaire
                    </h4>
                    <p className="text-sm bg-gray-50 dark:bg-gray-900/20 p-3 rounded-lg border-l-4 border-l-gray-300">
                      {feedback.feedback}
                    </p>
                  </div>

                  {feedback.suggestions && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2 text-yellow-600">
                        💡 Suggestions
                      </h4>
                      <p className="text-sm bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-lg border-l-4 border-l-yellow-300">
                        {feedback.suggestions}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {pagination.page} sur {pagination.totalPages} ({pagination.total} avis au total)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={pagination.page === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FeedbackManagement;
