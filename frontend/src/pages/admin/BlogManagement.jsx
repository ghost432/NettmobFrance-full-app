import { useState, useEffect, useRef, useCallback } from 'react';
import {
    PlusCircle, Pencil, Trash2, Eye, Search, Filter,
    FileText, Building2, User, Calendar, ImagePlus, X,
    Save, ChevronLeft, Bold, Italic, List, Link as LinkIcon,
    Heading2, Heading3, AlignLeft, Quote
} from 'lucide-react';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../../components/ui/pagination';
import axios from 'axios';
import { toast } from '../../components/ui/toast';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { adminNavigation } from '../../constants/navigation';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { getAssetUrl } from '../../lib/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Simple Rich Text Editor using execCommand (no npm needed)
const RichTextEditor = ({ value, onChange }) => {
    const editorRef = useRef(null);
    const isInitialized = useRef(false);

    useEffect(() => {
        if (editorRef.current && !isInitialized.current) {
            editorRef.current.innerHTML = value || '';
            isInitialized.current = true;
        }
    }, []);

    const exec = (command, val = null) => {
        editorRef.current?.focus();
        document.execCommand(command, false, val);
        if (onChange) onChange(editorRef.current.innerHTML);
    };

    const handleInput = () => {
        if (onChange) onChange(editorRef.current.innerHTML);
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    };

    return (
        <div className="border-2 border-border rounded-2xl overflow-hidden focus-within:border-primary transition-colors">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-3 bg-muted/40 border-b border-border">
                {[
                    { icon: <Bold className="h-4 w-4" />, cmd: 'bold', title: 'Gras' },
                    { icon: <Italic className="h-4 w-4" />, cmd: 'italic', title: 'Italique' },
                    { icon: <Heading2 className="h-4 w-4" />, cmd: 'formatBlock', val: 'h2', title: 'Titre 2' },
                    { icon: <Heading3 className="h-4 w-4" />, cmd: 'formatBlock', val: 'h3', title: 'Titre 3' },
                    { icon: <AlignLeft className="h-4 w-4" />, cmd: 'formatBlock', val: 'p', title: 'Paragraphe' },
                    { icon: <List className="h-4 w-4" />, cmd: 'insertUnorderedList', title: 'Liste' },
                    { icon: <Quote className="h-4 w-4" />, cmd: 'formatBlock', val: 'blockquote', title: 'Citation' },
                ].map((btn, i) => (
                    <button
                        key={i}
                        type="button"
                        title={btn.title}
                        onClick={() => exec(btn.cmd, btn.val)}
                        className="p-2 rounded-lg hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors"
                    >
                        {btn.icon}
                    </button>
                ))}
                <div className="w-px h-6 bg-border mx-1" />
                <button
                    type="button"
                    title="Lien"
                    onClick={() => {
                        const url = prompt('URL du lien :');
                        if (url) exec('createLink', url);
                    }}
                    className="p-2 rounded-lg hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors"
                >
                    <LinkIcon className="h-4 w-4" />
                </button>
            </div>
            {/* Editable area */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                onPaste={handlePaste}
                className="min-h-[300px] p-5 outline-none text-foreground leading-8 font-medium
          [&_h2]:text-2xl [&_h2]:font-black [&_h2]:tracking-tight [&_h2]:mt-6 [&_h2]:mb-3
          [&_h3]:text-xl [&_h3]:font-black [&_h3]:tracking-tight [&_h3]:mt-4 [&_h3]:mb-2
          [&_p]:mb-4 [&_p]:text-muted-foreground
          [&_strong]:text-foreground [&_strong]:font-black
          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_li]:text-muted-foreground [&_li]:mb-1
          [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:bg-primary/5 [&_blockquote]:rounded-r-xl [&_blockquote]:py-3 [&_blockquote]:my-4
          [&_a]:text-primary [&_a]:underline"
            />
        </div>
    );
};

const BlogManagement = () => {
    useDocumentTitle('Gestion du Blog');
    const { user } = useAuth();

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list' | 'form'
    const [editingPost, setEditingPost] = useState(null);
    const [filterType, setFilterType] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [saving, setSaving] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        type: 'auto-entrepreneur',
        excerpt: '',
        content: '',
    });

    const getToken = () => localStorage.getItem('token');

    const fetchPosts = async () => {
        try {
            const res = await axios.get(`${API_URL}/blog`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            setPosts(res.data);
        } catch (e) {
            toast.error("Impossible de charger les articles.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPosts(); }, []);

    const openCreate = () => {
        setEditingPost(null);
        setFormData({ title: '', type: 'auto-entrepreneur', excerpt: '', content: '' });
        setImagePreview(null);
        setSelectedFile(null);
        setView('form');
    };

    const openEdit = (post) => {
        setEditingPost(post);
        setFormData({
            title: post.title,
            type: post.type,
            excerpt: post.excerpt || '',
            content: post.content || '',
        });
        const img = getAssetUrl(post.image_url);
        setImagePreview(img);
        setSelectedFile(null);
        setView('form');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer cet article définitivement ?')) return;
        try {
            await axios.delete(`${API_URL}/blog/${id}`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            setPosts(posts.filter(p => p.id !== id));
            toast.success('Article supprimé.');
        } catch (e) {
            toast.error("Suppression impossible.");
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setSelectedFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.content) {
            toast.error('Titre et contenu requis.');
            return;
        }
        setSaving(true);
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('type', formData.type);
            data.append('excerpt', formData.excerpt);
            data.append('content', formData.content);
            if (selectedFile) data.append('image', selectedFile);

            if (editingPost) {
                await axios.put(`${API_URL}/blog/${editingPost.id}`, data, {
                    headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Article mis à jour !');
            } else {
                await axios.post(`${API_URL}/blog`, data, {
                    headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Article publié !');
            }
            await fetchPosts();
            setView('list');
        } catch (e) {
            toast.error("Enregistrement impossible.");
        } finally {
            setSaving(false);
        }
    };

    const filtered = posts.filter(p => {
        const matchType = filterType === 'all' || p.type === filterType;
        const matchSearch = !searchTerm || p.title.toLowerCase().includes(searchTerm.toLowerCase());
        return matchType && matchSearch;
    });
    const { currentItems: paginatedAdmin, currentPage: adminPage, totalPages: adminTotalPages, totalItems: adminTotalItems, setCurrentPage: setAdminPage } = usePagination(filtered, 15);

    const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    const getImageSrc = (p) => {
        if (!p.image_url) return null;
        return getAssetUrl(p.image_url);
    };

    const displayName = () => user?.email?.split('@')[0] || 'Admin';
    const avatarSrc = () => getAssetUrl(user?.profile?.profile_picture || user?.profile_picture);

    return (
        <DashboardLayout
            title="Gestion du Blog"
            description="Créez et gérez les articles du blog pour auto-entrepreneurs et entreprises."
            menuItems={adminNavigation}
            getRoleLabel={() => 'Administrateur'}
            getDisplayName={displayName}
            getAvatarSrc={avatarSrc}
        >
            <div className="space-y-8 animate-in fade-in duration-500">

                {view === 'list' ? (
                    <>
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-border shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Contenu</p>
                                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Articles du Blog</h2>
                                </div>
                            </div>
                            <Button
                                onClick={openCreate}
                                className="h-12 px-6 rounded-2xl font-black uppercase tracking-wider bg-primary text-white hover:bg-primary/90 flex items-center gap-2 shadow-lg"
                            >
                                <PlusCircle className="h-5 w-5" />
                                Nouvel article
                            </Button>
                        </div>

                        {/* Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Rechercher un article..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full bg-white border-2 border-border focus:border-primary rounded-2xl pl-12 pr-6 py-4 outline-none transition-all font-bold shadow-sm"
                                />
                            </div>
                            <div className="relative">
                                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <select
                                    value={filterType}
                                    onChange={e => setFilterType(e.target.value)}
                                    className="w-full bg-white border-2 border-border focus:border-primary rounded-2xl pl-12 pr-6 py-4 outline-none transition-all font-bold shadow-sm appearance-none cursor-pointer"
                                >
                                    <option value="all">Tous les articles</option>
                                    <option value="auto-entrepreneur">Auto-Entrepreneur</option>
                                    <option value="enterprise">Entreprise</option>
                                </select>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { label: 'Total', count: posts.length, icon: <FileText className="h-5 w-5" /> },
                                { label: 'Auto-Entrepreneur', count: posts.filter(p => p.type === 'auto-entrepreneur').length, icon: <User className="h-5 w-5" /> },
                                { label: 'Entreprise', count: posts.filter(p => p.type === 'enterprise').length, icon: <Building2 className="h-5 w-5" /> },
                            ].map((s, i) => (
                                <div key={i} className="bg-white p-5 rounded-2xl border border-border shadow-sm flex items-center gap-4">
                                    <div className="bg-primary/10 p-2.5 rounded-xl text-primary">{s.icon}</div>
                                    <div>
                                        <div className="text-2xl font-black text-slate-900">{s.count}</div>
                                        <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{s.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Articles list */}
                        <div className="bg-white rounded-[2.5rem] border border-border shadow-soft overflow-hidden">
                            {loading ? (
                                <div className="p-20 text-center">
                                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-slate-500 font-bold">Chargement...</p>
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="p-20 text-center space-y-4">
                                    <div className="text-5xl">📝</div>
                                    <h3 className="text-xl font-black text-slate-900">Aucun article</h3>
                                    <p className="text-slate-500">Créez votre premier article avec le bouton ci-dessus.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {paginatedAdmin.map(post => (
                                        <div key={post.id} className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors">
                                            {/* Thumbnail */}
                                            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-muted flex-shrink-0">
                                                {getImageSrc(post) ? (
                                                    <img src={getImageSrc(post)} alt="" className="w-full h-full object-cover" onError={e => e.target.parentElement.querySelector('.fallback').style.display = 'flex'} />
                                                ) : (
                                                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-2xl">📰</div>
                                                )}
                                            </div>
                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${post.type === 'enterprise' ? 'bg-blue-100 text-blue-700' : 'bg-primary/10 text-primary'}`}>
                                                        {post.type === 'enterprise' ? 'Entreprise' : 'Auto-Entrepreneur'}
                                                    </span>
                                                </div>
                                                <h3 className="font-black text-slate-900 line-clamp-1">{post.title}</h3>
                                                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold mt-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDate(post.created_at)}
                                                </div>
                                                <div className="flex items-center gap-3 mt-1.5">
                                                    <span className="flex items-center gap-1 text-xs font-black text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
                                                        👍 {post.helpful_yes || 0}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-xs font-black text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                                                        👎 {post.helpful_no || 0}
                                                    </span>
                                                </div>
                                            </div>
                                            {/* Actions */}
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <a
                                                    href={post.type === 'enterprise' ? `/entreprise/blog/${post.slug || post.id}` : `/blog/${post.slug || post.id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2.5 rounded-xl border-2 border-slate-200 hover:border-primary text-slate-400 hover:text-primary transition-all"
                                                    title="Voir"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </a>
                                                <button
                                                    onClick={() => openEdit(post)}
                                                    className="p-2.5 rounded-xl border-2 border-slate-200 hover:border-primary text-slate-400 hover:text-primary transition-all"
                                                    title="Modifier"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(post.id)}
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

                        {/* Admin Pagination */}
                        <Pagination
                            currentPage={adminPage}
                            totalPages={adminTotalPages}
                            onPageChange={setAdminPage}
                            itemsPerPage={15}
                            totalItems={adminTotalItems}
                        />
                    </>
                ) : (
                    /* FORM VIEW */
                    <form onSubmit={handleSave} className="space-y-6">
                        {/* Form header */}
                        <div className="flex items-center gap-4 bg-white p-6 rounded-3xl border border-border shadow-sm">
                            <button
                                type="button"
                                onClick={() => setView('list')}
                                className="p-2.5 rounded-xl border-2 border-border hover:border-primary text-muted-foreground hover:text-primary transition-all"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{editingPost ? 'Modifier' : 'Créer'}</p>
                                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                                    {editingPost ? 'Modifier l\'article' : 'Nouvel article'}
                                </h2>
                            </div>
                        </div>

                        <div className="grid lg:grid-cols-3 gap-6">
                            {/* Main content */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Title */}
                                <div className="bg-white p-6 rounded-3xl border border-border shadow-sm space-y-4">
                                    <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground">Titre de l'article *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={e => setFormData(f => ({ ...f, title: e.target.value }))}
                                        placeholder="Un titre accrocheur..."
                                        className="w-full border-2 border-border focus:border-primary rounded-2xl px-5 py-4 outline-none transition-all font-black text-xl tracking-tight"
                                    />
                                </div>

                                {/* Excerpt */}
                                <div className="bg-white p-6 rounded-3xl border border-border shadow-sm space-y-4">
                                    <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground">Extrait / Résumé</label>
                                    <textarea
                                        value={formData.excerpt}
                                        onChange={e => setFormData(f => ({ ...f, excerpt: e.target.value }))}
                                        placeholder="Courte description de l'article (affiché dans les listes)..."
                                        rows={3}
                                        className="w-full border-2 border-border focus:border-primary rounded-2xl px-5 py-4 outline-none transition-all font-medium resize-none"
                                    />
                                </div>

                                {/* Content - Rich Text Editor (Quill-style) */}
                                <div className="bg-white p-6 rounded-3xl border border-border shadow-sm space-y-4">
                                    <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground">Contenu de l'article *</label>
                                    <RichTextEditor
                                        value={formData.content}
                                        onChange={html => setFormData(f => ({ ...f, content: html }))}
                                    />
                                </div>
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-6">
                                {/* Type */}
                                <div className="bg-white p-6 rounded-3xl border border-border shadow-sm space-y-4">
                                    <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground">Type d'article *</label>
                                    <div className="space-y-3">
                                        {[
                                            { value: 'auto-entrepreneur', label: 'Auto-Entrepreneur', icon: <User className="h-4 w-4" />, desc: 'Page /blog' },
                                            { value: 'enterprise', label: 'Entreprise', icon: <Building2 className="h-4 w-4" />, desc: 'Page /entreprise/blog' },
                                        ].map(opt => (
                                            <label
                                                key={opt.value}
                                                className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${formData.type === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="type"
                                                    value={opt.value}
                                                    checked={formData.type === opt.value}
                                                    onChange={e => setFormData(f => ({ ...f, type: e.target.value }))}
                                                    className="sr-only"
                                                />
                                                <div className={`p-2 rounded-xl ${formData.type === opt.value ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                                                    {opt.icon}
                                                </div>
                                                <div>
                                                    <div className="font-black text-sm text-foreground">{opt.label}</div>
                                                    <div className="text-xs text-muted-foreground font-bold">{opt.desc}</div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Image */}
                                <div className="bg-white p-6 rounded-3xl border border-border shadow-sm space-y-4">
                                    <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground">Image de couverture</label>
                                    {imagePreview ? (
                                        <div className="relative rounded-2xl overflow-hidden">
                                            <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => { setImagePreview(null); setSelectedFile(null); }}
                                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center gap-3 w-full h-40 border-2 border-dashed border-border rounded-2xl hover:border-primary cursor-pointer transition-colors">
                                            <ImagePlus className="h-8 w-8 text-muted-foreground" />
                                            <span className="text-sm font-bold text-muted-foreground">Cliquez pour choisir une image</span>
                                            <span className="text-xs text-muted-foreground">JPG, PNG, WEBP — max 10 MB</span>
                                            <input type="file" accept="image/*" onChange={handleImageChange} className="sr-only" />
                                        </label>
                                    )}
                                </div>

                                {/* Save */}
                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full h-14 rounded-2xl font-black uppercase tracking-wider text-lg bg-primary text-white hover:bg-primary/90 shadow-lg flex items-center justify-center gap-3"
                                >
                                    {saving ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Save className="h-5 w-5" />
                                    )}
                                    {saving ? 'Enregistrement...' : (editingPost ? 'Mettre à jour' : 'Publier l\'article')}
                                </Button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </DashboardLayout>
    );
};

export default BlogManagement;
