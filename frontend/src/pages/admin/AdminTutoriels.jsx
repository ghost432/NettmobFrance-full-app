import { useState, useEffect, useRef } from 'react';
import { Play, Upload, Trash2, PlusCircle, X, Building2, User, ChevronLeft, Pencil, Check, Search, Filter } from 'lucide-react';
import { Pagination } from '../../components/ui/pagination';
import axios from 'axios';
import { getAssetUrl } from '../../lib/api';
import { toast } from '../../components/ui/toast';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { adminNavigation } from '../../constants/navigation';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const PAGE_SIZE = 12;

const AdminTutoriels = () => {
    useDocumentTitle('Gestion des Tutoriels Vidéo');
    const { user } = useAuth();

    const [tutoriels, setTutoriels] = useState([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);
    const [filterType, setFilterType] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [titre, setTitre] = useState('');
    const [type, setType] = useState('auto-entrepreneur');
    const [videoFile, setVideoFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileRef = useRef();

    const [editId, setEditId] = useState(null);
    const [editTitre, setEditTitre] = useState('');
    const [editType, setEditType] = useState('');

    const getToken = () => localStorage.getItem('token');
    const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

    const load = async (p = page, t = filterType) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: p, limit: PAGE_SIZE });
            if (t && t !== 'all') params.append('type', t);
            const { data } = await axios.get(`${API_URL}/tutoriels?${params}`, { headers: authHeaders() });

            // Client side search filtering since the backend API does not currently support search
            let filteredTutos = data.tutoriels || [];
            if (searchTerm) {
                filteredTutos = filteredTutos.filter(tuto => tuto.titre.toLowerCase().includes(searchTerm.toLowerCase()));
            }

            setTutoriels(filteredTutos);
            setTotal(data.total || 0);
            setTotalPages(data.totalPages || 1);
        } catch {
            toast.error('Erreur de chargement');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(page, filterType); }, [page, filterType, searchTerm]);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!titre || !videoFile) return toast.error('Titre et vidéo requis');
        setUploading(true);
        const fd = new FormData();
        fd.append('titre', titre);
        fd.append('type', type);
        fd.append('video', videoFile);
        try {
            await axios.post(`${API_URL}/tutoriels`, fd, {
                headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (e) => setUploadProgress(Math.round(e.loaded * 100 / e.total))
            });
            toast.success('Tutoriel publié !');
            setTitre(''); setVideoFile(null); setShowForm(false); setUploadProgress(0);
            load(1, filterType);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erreur upload');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer ce tutoriel définitivement ?')) return;
        try {
            await axios.delete(`${API_URL}/tutoriels/${id}`, { headers: authHeaders() });
            toast.success('Tutoriel supprimé.');
            load(page, filterType);
        } catch { toast.error('Erreur suppression'); }
    };

    const handleEdit = async (id) => {
        try {
            await axios.put(`${API_URL}/tutoriels/${id}`, { titre: editTitre, type: editType }, { headers: authHeaders() });
            setEditId(null);
            toast.success('Tutoriel mis à jour.');
            load(page, filterType);
        } catch { toast.error('Erreur modification'); }
    };

    const displayName = () => user?.email?.split('@')[0] || 'Admin';
    const avatarSrc = () => getAssetUrl(user?.profile?.profile_picture || user?.profile_picture);

    return (
        <DashboardLayout
            title="Gestion des Tutoriels"
            description="Publiez et gérez les vidéos tutoriels pour vos utilisateurs (Auto-Entrepreneurs et Entreprises)."
            menuItems={adminNavigation}
            getRoleLabel={() => 'Administrateur'}
            getDisplayName={displayName}
            getAvatarSrc={avatarSrc}
        >
            <div className="space-y-8 animate-in fade-in duration-500">
                {!showForm ? (
                    <>
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-border shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                                    <Play className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Contenu</p>
                                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Tutoriels Vidéo</h2>
                                </div>
                            </div>
                            <Button
                                onClick={() => setShowForm(true)}
                                className="h-12 px-6 rounded-2xl font-black uppercase tracking-wider bg-primary text-white hover:bg-primary/90 flex items-center gap-2 shadow-lg"
                            >
                                <PlusCircle className="h-5 w-5" />
                                Nouveau tutoriel
                            </Button>
                        </div>

                        {/* Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Rechercher un tutoriel..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full bg-white border-2 border-border focus:border-primary rounded-2xl pl-12 pr-6 py-4 outline-none transition-all font-bold shadow-sm"
                                />
                            </div>
                            <div className="relative">
                                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <select
                                    value={filterType}
                                    onChange={e => { setFilterType(e.target.value); setPage(1); }}
                                    className="w-full bg-white border-2 border-border focus:border-primary rounded-2xl pl-12 pr-6 py-4 outline-none transition-all font-bold shadow-sm appearance-none cursor-pointer"
                                >
                                    <option value="all">Tous les tutoriels</option>
                                    <option value="auto-entrepreneur">Auto-Entrepreneur</option>
                                    <option value="enterprise">Entreprise</option>
                                </select>
                            </div>
                        </div>

                        {/* List */}
                        <div className="bg-white rounded-[2.5rem] border border-border shadow-soft overflow-hidden">
                            {loading ? (
                                <div className="p-20 text-center">
                                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-slate-500 font-bold">Chargement...</p>
                                </div>
                            ) : tutoriels.length === 0 ? (
                                <div className="p-20 text-center space-y-4">
                                    <div className="text-5xl">🎬</div>
                                    <h3 className="text-xl font-black text-slate-900">Aucun tutoriel</h3>
                                    <p className="text-slate-500">Publiez votre première vidéo avec le bouton ci-dessus.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {tutoriels.map(t => (
                                        <div key={t.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 hover:bg-slate-50 transition-colors">
                                            {/* Thumbnail */}
                                            <div className="w-full sm:w-40 h-24 bg-slate-900 rounded-2xl overflow-hidden flex-shrink-0 relative group">
                                                <video src={getAssetUrl(t.video_url)} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" preload="metadata" />
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                                                        <Play className="h-4 w-4 text-white fill-white" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0 w-full space-y-2">
                                                {editId === t.id ? (
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <input
                                                            value={editTitre}
                                                            onChange={e => setEditTitre(e.target.value)}
                                                            className="flex-1 min-w-[200px] border-2 border-border focus:border-primary rounded-xl px-3 py-2 font-bold outline-none"
                                                        />
                                                        <select value={editType} onChange={e => setEditType(e.target.value)} className="border-2 border-border rounded-xl px-3 py-2 font-bold outline-none">
                                                            <option value="auto-entrepreneur">Auto-Entrepreneur</option>
                                                            <option value="enterprise">Entreprise</option>
                                                        </select>
                                                        <button onClick={() => handleEdit(t.id)} className="p-2 bg-green-500 text-white rounded-xl hover:bg-green-600"><Check className="h-5 w-5" /></button>
                                                        <button onClick={() => setEditId(null)} className="p-2 bg-slate-200 text-slate-600 rounded-xl hover:bg-slate-300"><X className="h-5 w-5" /></button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${t.type === 'enterprise' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                                {t.type === 'enterprise' ? 'Entreprise' : 'Auto-Entrepreneur'}
                                                            </span>
                                                            <span className="text-xs text-slate-400 font-bold">{new Date(t.created_at).toLocaleDateString('fr-FR')}</span>
                                                        </div>
                                                        <h3 className="font-black text-lg text-slate-900 leading-tight">{t.titre}</h3>
                                                    </>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center mt-2 sm:mt-0">
                                                <a
                                                    href={getAssetUrl(t.video_url)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-2.5 rounded-xl border-2 border-slate-200 hover:border-primary text-slate-400 hover:text-primary transition-all"
                                                    title="Voir"
                                                >
                                                    <Play className="h-4 w-4" />
                                                </a>
                                                {editId !== t.id && (
                                                    <button
                                                        onClick={() => { setEditId(t.id); setEditTitre(t.titre); setEditType(t.type); }}
                                                        className="p-2.5 rounded-xl border-2 border-slate-200 hover:border-primary text-slate-400 hover:text-primary transition-all"
                                                        title="Modifier"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(t.id)}
                                                    className="p-2.5 rounded-xl border-2 border-red-100 hover:border-red-300 text-slate-400 hover:text-red-500 transition-all"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                            itemsPerPage={PAGE_SIZE}
                            totalItems={total}
                        />
                    </>
                ) : (
                    /* FORM */
                    <form onSubmit={handleUpload} className="space-y-6">
                        <div className="flex items-center gap-4 bg-white p-6 rounded-3xl border border-border shadow-sm">
                            <button type="button" onClick={() => setShowForm(false)} className="p-2.5 rounded-xl border-2 border-border hover:border-primary text-muted-foreground hover:text-primary transition-all">
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Créer</p>
                                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Nouveau tutoriel</h2>
                            </div>
                        </div>

                        <div className="grid lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white p-6 rounded-3xl border border-border shadow-sm space-y-4">
                                    <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground">Titre de la vidéo *</label>
                                    <input
                                        required
                                        value={titre}
                                        onChange={e => setTitre(e.target.value)}
                                        placeholder="Ex: Comment publier une mission..."
                                        className="w-full border-2 border-border focus:border-primary rounded-xl px-5 py-4 outline-none transition-all font-black text-xl tracking-tight"
                                    />
                                </div>

                                <div className="bg-white p-6 rounded-3xl border border-border shadow-sm space-y-4">
                                    <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground">Fichier vidéo *</label>
                                    <div
                                        className="border-2 border-dashed border-border rounded-xl p-8 lg:p-12 text-center cursor-pointer hover:border-primary transition-colors bg-slate-50"
                                        onClick={() => fileRef.current?.click()}
                                    >
                                        {videoFile ? (
                                            <div className="space-y-2">
                                                <Play className="h-10 w-10 mx-auto text-primary" />
                                                <p className="font-black text-slate-900 text-lg">{videoFile.name}</p>
                                                <p className="text-slate-500 font-bold">{(videoFile.size / 1024 / 1024).toFixed(1)} MB</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <Upload className="h-10 w-10 mx-auto text-slate-400" />
                                                <h3 className="font-black text-slate-900">Cliquez pour choisir une vidéo</h3>
                                                <p className="text-slate-500 text-sm font-bold">MP4, WebM, MOV, AVI — max 500MB</p>
                                            </div>
                                        )}
                                        <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={e => setVideoFile(e.target.files[0])} />
                                    </div>

                                    {uploading && (
                                        <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-border">
                                            <div className="flex items-center justify-between mb-2 text-sm font-black text-slate-900">
                                                <span>Upload en cours…</span>
                                                <span className="text-primary">{uploadProgress}%</span>
                                            </div>
                                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                                <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-white p-6 rounded-3xl border border-border shadow-sm space-y-4">
                                    <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground">Type d'audience *</label>
                                    <div className="space-y-3">
                                        {[
                                            { value: 'auto-entrepreneur', label: 'Auto-Entrepreneur', icon: <User className="h-4 w-4" /> },
                                            { value: 'enterprise', label: 'Entreprise', icon: <Building2 className="h-4 w-4" /> },
                                        ].map(opt => (
                                            <label
                                                key={opt.value}
                                                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${type === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
                                            >
                                                <input
                                                    type="radio"
                                                    value={opt.value}
                                                    checked={type === opt.value}
                                                    onChange={e => setType(e.target.value)}
                                                    className="sr-only"
                                                />
                                                <div className={`p-2 rounded-lg ${type === opt.value ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}`}>
                                                    {opt.icon}
                                                </div>
                                                <div className="font-black text-sm text-slate-900">{opt.label}</div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={uploading}
                                    className="w-full h-14 rounded-2xl font-black uppercase tracking-wider text-lg bg-primary text-white hover:bg-primary/90 shadow-lg flex items-center justify-center gap-3"
                                >
                                    {uploading ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Upload className="h-5 w-5" />
                                    )}
                                    {uploading ? 'Enregistrement...' : 'Publier'}
                                </Button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </DashboardLayout>
    );
};

export default AdminTutoriels;
