import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, X, Info, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useSocket } from '@/context/SocketContext';
import { toast } from '@/components/ui/toast';

export const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    // Écouter les nouvelles notifications via WebSocket
    if (socket) {
      socket.on('new_notification', (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Le toast global est déjà géré centralement dans SocketContext.jsx
      });

      return () => {
        socket.off('new_notification');
      };
    }
  }, [socket]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/notifications?limit=20');
      setNotifications(response.data);
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Erreur comptage notifications:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(notif => notif.id === id ? { ...notif, is_read: 1, read_at: new Date() } : notif)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erreur marquage notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: 1, read_at: new Date() }))
      );
      setUnreadCount(0);
      toast.success('Toutes les notifications ont été marquées comme lues');
    } catch (error) {
      console.error('Erreur marquage toutes notifications:', error);
      toast.error('Erreur lors du marquage');
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      toast.success('Notification supprimée');
    } catch (error) {
      console.error('Erreur suppression notification:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      system: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      mission: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      message: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      payment: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      verification: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
      account: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
      support: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
    };
    return colors[category] || colors.system;
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now - notifDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return notifDate.toLocaleDateString('fr-FR');
  };

  return (
    <div className="relative">
      {/* Bouton Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-accent transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panneau notifications */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panneau */}
          <div className="absolute right-0 top-12 z-50 w-96 max-h-[600px] overflow-hidden rounded-lg border bg-popover shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <h3 className="font-semibold">Notifications</h3>
                <p className="text-xs text-muted-foreground">
                  {unreadCount} non {unreadCount > 1 ? 'lues' : 'lue'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="h-8 px-2"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Liste notifications */}
            <div className="max-h-[500px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Bell className="w-12 h-12 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">Aucune notification</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={cn(
                        'p-4 hover:bg-accent/50 transition-colors relative group',
                        !notif.is_read && 'bg-accent/30'
                      )}
                    >
                      {/* Indicateur non lu */}
                      {!notif.is_read && (
                        <div className="absolute left-2 top-6 w-2 h-2 rounded-full bg-primary"></div>
                      )}

                      <div className="flex gap-3 pl-4">
                        {/* Icône type */}
                        <div className="flex-shrink-0 mt-1">
                          {getTypeIcon(notif.type)}
                        </div>

                        {/* Contenu */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-sm leading-tight">
                              {notif.title}
                            </h4>
                            <span className={cn(
                              'text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0',
                              getCategoryColor(notif.category)
                            )}>
                              {notif.category}
                            </span>
                          </div>

                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {notif.message}
                          </p>

                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(notif.created_at)}
                            </span>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!notif.is_read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead(notif.id)}
                                  className="h-7 px-2"
                                >
                                  <Check className="w-3 h-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteNotification(notif.id)}
                                className="h-7 px-2 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          {notif.action_url && (
                            <a
                              href={notif.action_url}
                              className="text-xs text-primary hover:underline mt-1 inline-block"
                              onClick={() => setIsOpen(false)}
                            >
                              Voir plus →
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
