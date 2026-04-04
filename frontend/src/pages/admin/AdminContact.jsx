import { useState, useEffect } from 'react';
import {
    Mail,
    Trash2,
    Eye,
    CheckCircle,
    XCircle,
    Search,
    MessageSquare,
    Calendar,
    User,
    Filter,
    Phone
} from 'lucide-react';
import axios from 'axios';
import { toast } from '../../components/ui/toast';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { adminNavigation } from '../../constants/navigation';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { Pagination } from '../../components/ui/pagination';

const AdminContact = () => {
    useDocumentTitle('Messages de Contact');
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, read, unread
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/contact/admin`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(response.data.messages);
        } catch (error) {
            console.error('Error fetching contact messages:', error);
            toast.error('Impossible de charger les messages.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    const toggleRead = async (id, currentStatus) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${API_URL}/contact/admin/${id}/read`,
                { is_read: !currentStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessages(messages.map(m => m.id === id ? { ...m, is_read: !currentStatus ? 1 : 0 } : m));
            toast.success(`Message marqué comme ${!currentStatus ? 'lu' : 'non lu'}.`);
        } catch (error) {
            console.error('Error updating message status:', error);
            toast.error('Impossible de mettre à jour le statut.');
        }
    };

    const deleteMessage = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/contact/admin/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(messages.filter(m => m.id !== id));
            toast.success('Message supprimé avec succès.');
        } catch (error) {
            console.error('Error deleting message:', error);
            toast.error('Impossible de supprimer le message.');
        }
    };

    const filteredMessages = messages.filter(m => {
        const matchesFilter = filter === 'all' ||
            (filter === 'read' && m.is_read) ||
            (filter === 'unread' && !m.is_read);

        const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.message.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    const totalPages = Math.ceil(filteredMessages.length / itemsPerPage);
    const currentMessages = filteredMessages.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filter, searchTerm]);

    const displayName = () => {
        return user?.email?.split('@')[0] || 'Admin';
    };

    const avatarSrc = () => {
        return user?.profile?.profile_picture || user?.profile_picture;
    };

    return (
        <DashboardLayout
            title="Messages de Contact"
            description="Gérez les demandes reçues via le formulaire de contact public."
            menuItems={adminNavigation}
            getRoleLabel={() => 'Administrateur'}
            getDisplayName={displayName}
            getAvatarSrc={avatarSrc}
        >
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Stats Header Replacement */}
                <div className="flex items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-border shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                            <MessageSquare className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Boîte de réception</p>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Messages du Formulaire</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider">
                            {messages.filter(m => !m.is_read).length} Non lus
                        </div>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Rechercher par nom, email, sujet..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border-2 border-border focus:border-primary rounded-2xl pl-12 pr-6 py-4 outline-none transition-all font-bold shadow-sm"
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full bg-white border-2 border-border focus:border-primary rounded-2xl pl-12 pr-6 py-4 outline-none transition-all font-bold shadow-sm appearance-none cursor-pointer"
                        >
                            <option value="all">Tous les messages</option>
                            <option value="unread">Non lus</option>
                            <option value="read">Lus</option>
                        </select>
                    </div>
                </div>

                {/* Messages List */}
                <div className="bg-white rounded-[2.5rem] border border-border shadow-soft overflow-hidden">
                    {loading ? (
                        <div className="p-20 text-center space-y-4">
                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <p className="text-slate-500 font-bold">Chargement des messages...</p>
                        </div>
                    ) : filteredMessages.length === 0 ? (
                        <div className="p-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                                <Mail className="h-10 w-10" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Aucun message trouvé</h3>
                            <p className="text-slate-500 font-medium">Ajustez vos filtres ou attendez de nouvelles soumissions.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {currentMessages.map((msg) => (
                                <div key={msg.id} className={`p-6 transition-colors hover:bg-slate-50 flex flex-col lg:flex-row gap-6 ${!msg.is_read ? 'bg-primary/5' : ''}`}>
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                                                        {msg.subject}
                                                        {!msg.is_read && <span className="bg-primary w-2 h-2 rounded-full animate-pulse"></span>}
                                                    </h3>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-slate-500">
                                                    <span className="flex items-center gap-1.5"><User className="h-4 w-4" /> {msg.name}</span>
                                                    <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" /> {msg.email}</span>
                                                    {msg.phone && <span className="flex items-center gap-1.5"><Phone className="h-4 w-4" /> {msg.phone}</span>}
                                                    <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {new Date(msg.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-slate-100/50 p-6 rounded-3xl border border-slate-200 text-slate-700 leading-relaxed font-medium">
                                            {msg.message}
                                        </div>
                                    </div>
                                    <div className="flex lg:flex-col items-center justify-center gap-3 lg:border-l lg:border-slate-100 lg:pl-6 min-w-[120px]">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => toggleRead(msg.id, msg.is_read)}
                                            className={`w-full h-12 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest ${msg.is_read ? 'text-slate-400 border-slate-200' : 'text-primary border-primary hover:bg-primary/5'}`}
                                        >
                                            {msg.is_read ? <CheckCircle className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                                            {msg.is_read ? 'Lu' : 'Marquer lu'}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => deleteMessage(msg.id)}
                                            className="w-full h-12 rounded-xl border-2 border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 font-black uppercase text-[10px] tracking-widest"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Supprimer
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {!loading && filteredMessages.length > 0 && (
                    <div className="bg-white p-4 rounded-3xl border border-border shadow-sm">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            totalItems={filteredMessages.length}
                            itemsPerPage={itemsPerPage}
                        />
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default AdminContact;
