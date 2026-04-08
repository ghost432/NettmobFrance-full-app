import { useState, useEffect, useRef } from 'react';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/ui/pagination';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { adminNavigation } from '@/constants/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import { 
  MessageSquare, 
  Send, 
  ArrowLeft, 
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  User,
  Filter,
  Mail
} from 'lucide-react';

const SupportAdmin = () => {
  useDocumentTitle('Support');
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const messagesEndRef = useRef(null);

  const [tickets, setTickets] = useState([]);
  const { currentItems: paginatedTickets, currentPage, totalPages, totalItems, setCurrentPage } = usePagination(tickets, 15);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    status: '',
    assigned: ''
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Charger les statistiques
  const fetchStats = async () => {
    try {
      const { data } = await api.get('/support/stats');
      setStats(data.stats || {});
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  // Charger les tickets
  const fetchTickets = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.assigned) params.append('assigned', filters.assigned);

      const { data } = await api.get(`/support/admin/tickets?${params.toString()}`);
      setTickets(data.tickets || []);
    } catch (error) {
      console.error('Erreur chargement tickets:', error);
      toast.error('Erreur lors du chargement des tickets');
    }
  };

  // Charger un ticket spécifique
  const fetchTicket = async (id) => {
    try {
      setLoading(true);
      const { data } = await api.get(`/support/tickets/${id}`);
      setSelectedTicket(data.ticket);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Erreur chargement ticket:', error);
      toast.error('Erreur lors du chargement du ticket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchTickets();
    if (ticketId) {
      fetchTicket(ticketId);
    } else {
      setLoading(false);
    }
  }, [ticketId, filters]);

  // Écouter les nouveaux messages et tickets
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      if (data.ticketId === selectedTicket?.id) {
        fetchTicket(data.ticketId);
      }
      fetchTickets();
      fetchStats();
    };

    const handleNewTicket = () => {
      fetchTickets();
      fetchStats();
      toast.info('Nouveau ticket support reçu');
    };

    socket.on('new_support_message', handleNewMessage);
    socket.on('new_support_ticket', handleNewTicket);

    return () => {
      socket.off('new_support_message', handleNewMessage);
      socket.off('new_support_ticket', handleNewTicket);
    };
  }, [socket, selectedTicket]);

  // Envoyer un message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicket) return;

    try {
      setSending(true);
      await api.post(`/support/tickets/${selectedTicket.id}/messages`, {
        message: newMessage
      });
      setNewMessage('');
      await fetchTicket(selectedTicket.id);
    } catch (error) {
      console.error('Erreur envoi message:', error);
      toast.error('Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  // Changer le statut
  const handleStatusChange = async (status) => {
    if (!selectedTicket) return;

    try {
      await api.patch(`/support/tickets/${selectedTicket.id}/status`, { status });
      toast.success('Statut mis à jour');
      await fetchTicket(selectedTicket.id);
      await fetchTickets();
      await fetchStats();
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  // Assigner à moi
  const handleAssignToMe = async () => {
    if (!selectedTicket) return;

    try {
      await api.patch(`/support/tickets/${selectedTicket.id}/assign`, { 
        adminId: user.id 
      });
      toast.success('Ticket assigné');
      await fetchTicket(selectedTicket.id);
      await fetchTickets();
    } catch (error) {
      console.error('Erreur assignation:', error);
      toast.error('Erreur lors de l\'assignation');
    }
  };

  // Statut badge
  const getStatusBadge = (status) => {
    const badges = {
      open: { icon: AlertCircle, text: 'Ouvert', class: 'bg-blue-100 text-blue-800' },
      in_progress: { icon: Clock, text: 'En cours', class: 'bg-yellow-100 text-yellow-800' },
      resolved: { icon: CheckCircle, text: 'Résolu', class: 'bg-green-100 text-green-800' },
      closed: { icon: XCircle, text: 'Fermé', class: 'bg-gray-100 text-gray-800' }
    };
    const badge = badges[status] || badges.open;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.class}`}>
        <Icon className="w-3 h-3" />
        {badge.text}
      </span>
    );
  };

  // Priorité badge
  const getPriorityBadge = (priority) => {
    const badges = {
      low: { text: 'Faible', class: 'bg-gray-100 text-gray-600' },
      normal: { text: 'Normale', class: 'bg-blue-100 text-blue-600' },
      high: { text: 'Haute', class: 'bg-orange-100 text-orange-600' },
      urgent: { text: 'Urgente', class: 'bg-red-100 text-red-600' }
    };
    const badge = badges[priority] || badges.normal;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.class}`}>
        {badge.text}
      </span>
    );
  };

  // Catégorie texte
  const getCategoryText = (category) => {
    const categories = {
      technical: 'Technique',
      account: 'Compte',
      payment: 'Paiement',
      mission: 'Mission',
      other: 'Autre'
    };
    return categories[category] || 'Autre';
  };

  if (loading) {
    return (
      <DashboardLayout
        title="Gestion Support"
        description="Chargement..."
        menuItems={adminNavigation}
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Gestion Support"
      description="Gérez les demandes d'assistance des utilisateurs"
      menuItems={adminNavigation}
    >
      <div className="space-y-6">
        {/* Header avec stats */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Tickets de support</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Suivez et répondez aux demandes</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total || 0}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg shadow-sm border border-blue-200 dark:border-blue-800">
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">{stats.open || 0}</div>
              <div className="text-xs text-blue-600 dark:text-blue-400">Ouverts</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg shadow-sm border border-yellow-200 dark:border-yellow-800">
              <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">{stats.in_progress || 0}</div>
              <div className="text-xs text-yellow-600 dark:text-yellow-400">En cours</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg shadow-sm border border-green-200 dark:border-green-800">
              <div className="text-2xl font-bold text-green-900 dark:text-green-300">{stats.resolved || 0}</div>
              <div className="text-xs text-green-600 dark:text-green-400">Résolus</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.closed || 0}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Fermés</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg shadow-sm border border-red-200 dark:border-red-800">
              <div className="text-2xl font-bold text-red-900 dark:text-red-300">{stats.unassigned || 0}</div>
              <div className="text-xs text-red-600 dark:text-red-400">Non assignés</div>
            </div>
          </div>

          {/* Filtres */}
          <div className="flex gap-3 flex-wrap">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              <option value="">Tous les statuts</option>
              <option value="open">Ouvert</option>
              <option value="in_progress">En cours</option>
              <option value="resolved">Résolu</option>
              <option value="closed">Fermé</option>
            </select>
            <select
              value={filters.assigned}
              onChange={(e) => setFilters({ ...filters, assigned: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              <option value="">Toutes les assignations</option>
              <option value="me">Mes tickets</option>
              <option value="unassigned">Non assignés</option>
            </select>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des tickets */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">Tickets ({tickets.length})</h2>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
                {tickets.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p>Aucun ticket</p>
                  </div>
                ) : (
                  paginatedTickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      onClick={() => navigate(`/admin/support/${ticket.id}`)}
                      className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                        selectedTicket?.id === ticket.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1">{ticket.subject}</h3>
                        {ticket.unread_count > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                            {ticket.unread_count}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
                        <User className="w-3 h-3" />
                        <span>{ticket.user_name}</span>
                        <span className="text-gray-400 dark:text-gray-500">•</span>
                        <span className="uppercase">{ticket.user_role}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 mb-2">{ticket.last_message}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(ticket.status)}
                        {getPriorityBadge(ticket.priority)}
                      </div>
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(ticket.last_message_at || ticket.created_at).toLocaleString('fr-FR')}
                      </div>
                    </button>
                  ))
                )}
              </div>
              <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={15}
                  totalItems={totalItems}
                />
              </div>
            </div>
          </div>

          {/* Conversation */}
          <div className="lg:col-span-2">
            {selectedTicket ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-[700px]">
                {/* Header conversation */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => navigate('/admin/support')}
                    className="lg:hidden flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-3"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Retour
                  </button>
                  
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{selectedTicket.subject}</h2>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <User className="w-4 h-4" />
                        <span>{selectedTicket.user_name}</span>
                        <a 
                          href={`mailto:${selectedTicket.user_email}`}
                          className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <Mail className="w-3 h-3" />
                          {selectedTicket.user_email}
                        </a>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(selectedTicket.status)}
                        {getPriorityBadge(selectedTicket.priority)}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {getCategoryText(selectedTicket.category)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions admin */}
                  <div className="flex gap-2 flex-wrap">
                    {selectedTicket.assigned_admin_id !== user.id && (
                      <button
                        onClick={handleAssignToMe}
                        className="px-3 py-1 text-sm bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition"
                      >
                        M'assigner
                      </button>
                    )}
                    {selectedTicket.status !== 'in_progress' && (
                      <button
                        onClick={() => handleStatusChange('in_progress')}
                        className="px-3 py-1 text-sm bg-yellow-600 dark:bg-yellow-500 text-white rounded hover:bg-yellow-700 dark:hover:bg-yellow-600 transition"
                      >
                        Marquer en cours
                      </button>
                    )}
                    {selectedTicket.status !== 'resolved' && (
                      <button
                        onClick={() => handleStatusChange('resolved')}
                        className="px-3 py-1 text-sm bg-green-600 dark:bg-green-500 text-white rounded hover:bg-green-700 dark:hover:bg-green-600 transition"
                      >
                        Marquer résolu
                      </button>
                    )}
                    {selectedTicket.status !== 'closed' && (
                      <button
                        onClick={() => handleStatusChange('closed')}
                        className="px-3 py-1 text-sm bg-gray-600 dark:bg-gray-500 text-white rounded hover:bg-gray-700 dark:hover:bg-gray-600 transition"
                      >
                        Fermer
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.is_admin ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%]`}>
                        <div
                          className={`rounded-lg p-3 ${
                            message.is_admin
                              ? 'bg-blue-600 dark:bg-blue-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium">
                              {message.is_admin ? message.sender_name : selectedTicket.user_name}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        </div>
                        <div className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${message.is_admin ? 'text-right' : ''}`}>
                          {new Date(message.created_at).toLocaleString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input message */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Écrivez votre réponse..."
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition flex items-center gap-2"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Envoyer
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-[700px] flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p className="text-lg font-medium mb-2">Sélectionnez un ticket</p>
                  <p className="text-sm">pour voir la conversation et répondre</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SupportAdmin;
