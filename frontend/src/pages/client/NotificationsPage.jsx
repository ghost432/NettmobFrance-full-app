import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, Filter, Search, Mail, Clock, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { clientNavigation } from '@/constants/navigation';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';

const NotificationsPage = () => {
  useDocumentTitle('Notifications');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/notifications?limit=100');
      setNotifications(response.data);
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(notif => notif.id === id ? { ...notif, is_read: 1 } : notif)
      );
    } catch (error) {
      console.error('Erreur marquage:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(notif => ({ ...notif, is_read: 1 })));
      toast.success('Toutes les notifications ont été marquées comme lues');
    } catch (error) {
      toast.error('Erreur lors du marquage');
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      toast.success('Notification supprimée');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const deleteAllRead = async () => {
    try {
      await api.delete('/notifications/read/all');
      setNotifications(prev => prev.filter(notif => !notif.is_read));
      toast.success('Notifications lues supprimées');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      success: <CheckCircle className="w-4 h-4 text-green-500" />,
      warning: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
      error: <AlertCircle className="w-4 h-4 text-red-500" />,
      info: <Info className="w-4 h-4 text-blue-500" />
    };
    return icons[type] || icons.info;
  };

  const getCategoryBadge = (category) => {
    const colors = {
      system: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      mission: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      message: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      payment: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      verification: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
      account: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300'
    };
    return colors[category] || colors.system;
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return d.toLocaleDateString('fr-FR');
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread' && notif.is_read) return false;
    if (filter === 'read' && !notif.is_read) return false;
    if (searchTerm && !notif.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !notif.message.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <DashboardLayout
      title="Notifications"
      description={`${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`}
      menuItems={clientNavigation}
    >
      <div className="space-y-6">
        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <CheckCheck className="w-4 h-4 mr-2" />
              Tout marquer comme lu
            </Button>
          )}
          <Button variant="outline" onClick={deleteAllRead}>
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer les lues
          </Button>
        </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                size="sm"
              >
                Toutes ({notifications.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                onClick={() => setFilter('unread')}
                size="sm"
              >
                Non lues ({unreadCount})
              </Button>
              <Button
                variant={filter === 'read' ? 'default' : 'outline'}
                onClick={() => setFilter('read')}
                size="sm"
              >
                Lues ({notifications.length - unreadCount})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Bell className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune notification</h3>
            <p className="text-muted-foreground">
              {filter === 'unread' ? 'Vous avez tout lu !' : 'Vous n\'avez aucune notification'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notif) => (
            <Card
              key={notif.id}
              className={cn(
                'transition-all hover:shadow-md',
                !notif.is_read && 'border-l-4 border-l-primary bg-accent/30'
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getTypeIcon(notif.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className={cn(
                        "font-semibold",
                        !notif.is_read && "font-bold"
                      )}>
                        {notif.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={cn(
                          'text-xs px-2 py-1 rounded-full',
                          getCategoryBadge(notif.category)
                        )}>
                          {notif.category}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">
                      {notif.message}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatDate(notif.created_at)}
                      </div>

                      <div className="flex items-center gap-2">
                        {!notif.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notif.id)}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Marquer comme lu
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notif.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {notif.action_url && (
                      <a
                        href={notif.action_url}
                        className="text-xs text-primary hover:underline mt-2 inline-block"
                      >
                        Voir plus →
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </DashboardLayout>
  );
};

export default NotificationsPage;
