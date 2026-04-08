import { useState, useEffect } from 'react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { adminNavigation } from '../../constants/navigation';
import { Pagination } from '../../components/ui/pagination';
import { usePagination } from '../../hooks/usePagination';
import {
    Briefcase,
    Mail,
    Phone,
    Calendar,
    Search,
    Building2,
    Eye,
    MessageCircle,
    CheckCircle2,
    Trash2,
    Filter
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from '../../components/ui/toast';
import axios from 'axios';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const AdminDevis = () => {
    useDocumentTitle('Demandes de Devis - Admin');
    const { user } = useAuth();
    const [devis, setDevis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedDevis, setSelectedDevis] = useState(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    const fetchDevis = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/devis-entreprise`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDevis(response.data);
        } catch (error) {
            console.error('Erreur lors de la récupération des devis:', error);
            toast.error('Erreur lors du chargement des demandes de devis');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDevis();
    }, []);

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${API_URL}/devis-entreprise/${id}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setDevis(devis.map(d => d.id === id ? { ...d, status: newStatus } : d));
            if (selectedDevis && selectedDevis.id === id) {
                setSelectedDevis({ ...selectedDevis, status: newStatus });
            }
            toast.success(`Statut mis à jour : ${newStatus}`);
        } catch (error) {
            toast.error('Erreur lors de la mise à jour du statut');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette demande de devis ?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/devis-entreprise/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDevis(devis.filter(d => d.id !== id));
            if (selectedDevis && selectedDevis.id === id) setSelectedDevis(null);
            toast.success('Demande supprimée avec succès');
        } catch (error) {
            toast.error('Erreur lors de la suppression');
        }
    };

    const filteredDevis = devis.filter(d => {
        const matchesSearch =
            d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || d.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const { currentItems: paginatedDevis, currentPage, totalPages, totalItems, setCurrentPage } = usePagination(filteredDevis, 10);

    const getStatusConfig = (status) => {
        switch (status) {
            case 'nouveau': return { color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400', label: 'Nouveau', icon: <Mail className="h-4 w-4" /> };
            case 'lu': return { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400', label: 'Lu', icon: <Eye className="h-4 w-4" /> };
            case 'repondu': return { color: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400', label: 'Traité', icon: <CheckCircle2 className="h-4 w-4" /> };
            default: return { color: 'bg-slate-100 text-slate-700', label: status, icon: <Mail className="h-4 w-4" /> };
        }
    };

    const displayName = () => user?.email?.split('@')[0] || 'Admin';

    return (
        <DashboardLayout
            title="Demandes de Devis"
            description="Gérez les demandes de devis des entreprises clientes"
            menuItems={adminNavigation}
            getRoleLabel={() => 'Administrateur'}
            getDisplayName={displayName}
        >
            <div className="space-y-8 animate-in fade-in duration-500">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center space-y-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                            <p className="text-muted-foreground font-medium uppercase tracking-widest text-sm">Chargement...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Filters */}
                        <div className="bg-card rounded-[2rem] border border-border p-4 shadow-sm flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    placeholder="Rechercher par entreprise, contact, email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-12 h-14 rounded-2xl bg-muted/50 border-transparent focus:bg-background"
                                />
                            </div>
                            <div className="flex gap-2 p-1.5 bg-muted/50 rounded-2xl w-full sm:w-auto overflow-x-auto">
                                {['all', 'nouveau', 'lu', 'repondu'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={`px-6 py-3 rounded-xl text-sm font-black uppercase tracking-wider whitespace-nowrap transition-all ${statusFilter === status
                                                ? 'bg-primary text-white shadow-md'
                                                : 'text-muted-foreground hover:bg-muted'
                                            }`}
                                    >
                                        {status === 'all' ? 'Toutes' : status === 'nouveau' ? 'Nouveau' : status === 'lu' ? 'En cours' : 'Traité'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid lg:grid-cols-3 gap-8">
                            {/* List */}
                            <div className="lg:col-span-1 space-y-4">
                                {filteredDevis.length === 0 ? (
                                    <div className="text-center py-12 bg-muted/30 rounded-[2rem] border border-dashed border-border">
                                        <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                                        <h3 className="text-lg font-black uppercase tracking-tighter mb-2">Aucun devis</h3>
                                        <p className="text-sm text-muted-foreground">Aucune demande ne correspond à vos filtres.</p>
                                    </div>
                                ) : (
                                    <>
                                        {paginatedDevis.map(d => {
                                            const config = getStatusConfig(d.status);
                                            const isSelected = selectedDevis?.id === d.id;
                                            return (
                                                <div
                                                    key={d.id}
                                                    onClick={() => {
                                                        setSelectedDevis(d);
                                                        if (d.status === 'nouveau') handleUpdateStatus(d.id, 'lu');
                                                    }}
                                                    className={`p-5 rounded-[2rem] border cursor-pointer transition-all hover:scale-[1.02] ${isSelected
                                                            ? 'border-primary bg-primary/5 shadow-md'
                                                            : 'border-border bg-card hover:border-primary/50'
                                                        }`}
                                                >
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className={`p-2 rounded-xl ${config.color}`}>
                                                            {config.icon}
                                                        </div>
                                                        <span className="text-xs font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-lg">
                                                            {format(new Date(d.created_at), 'dd MMM', { locale: fr })}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-black truncate text-lg">{d.company}</h3>
                                                    <p className="text-sm text-muted-foreground font-medium truncate mb-3">{d.name}</p>

                                                    <div className="flex gap-2">
                                                        <span className="text-[10px] uppercase tracking-wider font-black bg-muted px-2 py-1 rounded-md truncate max-w-[100px]">
                                                            {d.secteur}
                                                        </span>
                                                        <span className="text-[10px] uppercase tracking-wider font-black bg-muted px-2 py-1 rounded-md">
                                                            {d.volume.split(' ')[0]}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            onPageChange={setCurrentPage}
                                            itemsPerPage={10}
                                            totalItems={totalItems}
                                        />
                                    </>
                                )}
                            </div>

                            {/* Detail View */}
                            <div className="lg:col-span-2">
                                {selectedDevis ? (
                                    <div className="bg-card rounded-[2.5rem] border border-border shadow-soft overflow-hidden animate-in slide-in-from-right-8 duration-300">
                                        {/* Header Detail */}
                                        <div className="p-8 border-b border-border bg-muted/20 relative">
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                                        <Building2 className="h-8 w-8" />
                                                    </div>
                                                    <div>
                                                        <h2 className="text-2xl font-black uppercase tracking-tight">{selectedDevis.company}</h2>
                                                        <p className="text-muted-foreground font-medium flex items-center gap-2">
                                                            <Calendar className="h-4 w-4" />
                                                            Reçu le {format(new Date(selectedDevis.created_at), 'dd/MM/yyyy à HH:mm')}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2">
                                                    {selectedDevis.status !== 'repondu' && (
                                                        <Button
                                                            onClick={() => handleUpdateStatus(selectedDevis.id, 'repondu')}
                                                            className="bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg shadow-green-500/20 font-black uppercase text-xs"
                                                        >
                                                            Marquer Traité
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => handleDelete(selectedDevis.id)}
                                                        className="border-red-200 text-red-500 hover:bg-red-50 rounded-xl"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                                                <div className="bg-background p-4 rounded-2xl border border-border">
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Contact</div>
                                                    <div className="font-bold truncate" title={selectedDevis.name}>{selectedDevis.name}</div>
                                                </div>
                                                <div className="bg-background p-4 rounded-2xl border border-border">
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Email</div>
                                                    <a href={`mailto:${selectedDevis.email}`} className="font-bold text-primary truncate block hover:underline" title={selectedDevis.email}>{selectedDevis.email}</a>
                                                </div>
                                                <div className="bg-background p-4 rounded-2xl border border-border">
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Téléphone</div>
                                                    <a href={`tel:${selectedDevis.phone}`} className="font-bold truncate block">{selectedDevis.phone}</a>
                                                </div>
                                                <div className="bg-background p-4 rounded-2xl border border-border">
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Statut</div>
                                                    <div className="font-bold flex items-center gap-2">
                                                        {getStatusConfig(selectedDevis.status).icon}
                                                        <span className="uppercase">{getStatusConfig(selectedDevis.status).label}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Body Detail */}
                                        <div className="p-8 space-y-8">
                                            <div className="grid md:grid-cols-2 gap-6 bg-primary/5 p-6 rounded-[2rem] border border-primary/10">
                                                <div>
                                                    <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                                                        <Briefcase className="h-3 w-3" /> Secteur d'activité
                                                    </h4>
                                                    <p className="font-bold text-lg">{selectedDevis.secteur}</p>
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                                                        <Search className="h-3 w-3" /> Volume estimé
                                                    </h4>
                                                    <p className="font-bold text-lg">{selectedDevis.volume}</p>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                                                    <MessageCircle className="h-4 w-4" /> Description du besoin
                                                </h4>
                                                <div className="bg-muted/30 p-6 rounded-[2rem] border border-border">
                                                    <p className="whitespace-pre-wrap font-medium leading-relaxed text-slate-700 dark:text-slate-300">
                                                        {selectedDevis.message}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="pt-6 border-t border-border flex justify-end gap-4">
                                                <Button
                                                    onClick={() => window.location.href = `mailto:${selectedDevis.email}?subject=Suite à votre demande de devis sur NettmobFrance B2B`}
                                                    size="lg"
                                                    className="h-14 px-8 font-black uppercase rounded-2xl gap-2 shadow-lg"
                                                >
                                                    <Mail className="h-5 w-5" /> Répondre par Email
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center bg-card rounded-[2.5rem] border border-dashed border-border p-12 text-center">
                                        <div className="max-w-sm">
                                            <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6">
                                                <Briefcase className="h-10 w-10 text-muted-foreground opacity-50" />
                                            </div>
                                            <h3 className="text-2xl font-black uppercase tracking-tighter mb-3">Détails du devis</h3>
                                            <p className="text-muted-foreground font-medium">Sélectionnez une demande dans la liste à gauche pour consulter les détails du besoin et y répondre.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

export default AdminDevis;
