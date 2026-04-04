import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowLeft, Building2, User, ChevronLeft, ChevronRight } from 'lucide-react';
import Header from './components/Header';
import Footer from './components/Footer';
import RevolutPartnerSection from './components/revolut/RevolutPartnerSection';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BACKEND_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
const PAGE_SIZE = 12;

const BlogList = ({ type }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    const isEnterprise = type === 'enterprise';
    useDocumentTitle(isEnterprise ? 'Blog Entreprise — NettmobFrance' : 'Blog Auto-Entrepreneur — NettmobFrance');

    useEffect(() => {
        setPage(1);
        const fetchPosts = async () => {
            try {
                const res = await fetch(`${API_URL}/blog?type=${type}`);
                const data = await res.json();
                setPosts(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Error fetching blog posts:', err);
                setPosts([]);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, [type]);

    const getImageSrc = (post) => {
        if (!post.image_url) return null;
        if (post.image_url.startsWith('http')) return post.image_url;
        return `${BACKEND_URL}${post.image_url}`;
    };

    const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric'
    });

    const totalPages = Math.ceil(posts.length / PAGE_SIZE);
    const paginated = posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const scrollToTop = () => window.scrollTo({ top: 320, behavior: 'smooth' });

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <Header />

            {/* Hero */}
            <section className="relative pt-40 pb-20 lg:pt-56 lg:pb-32 overflow-hidden bg-slate-900 text-white">
                {/* Background image */}
                <div className="absolute inset-0 z-0 opacity-20">
                    <img
                        src={isEnterprise
                            ? "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1920"
                            : "https://images.unsplash.com/photo-1455849318743-b2233052fcff?auto=format&fit=crop&q=80&w=1920"}
                        alt="Blog Background"
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-black mb-6 uppercase tracking-widest border bg-white/10 text-white border-white/20">
                        {isEnterprise ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
                        <span>{isEnterprise ? 'Ressources Entreprise' : 'Conseils Auto-Entrepreneur'}</span>
                    </div>
                    <h1 className="text-4xl lg:text-6xl font-black tracking-tighter mb-6 uppercase text-white">
                        Notre <span className="text-primary">Blog</span>
                    </h1>
                    <p className="text-xl max-w-2xl mx-auto font-semibold text-slate-300">
                        {isEnterprise
                            ? "Actualités, conseils et stratégies pour optimiser vos recrutements."
                            : "Guides pratiques et conseils pour réussir en tant qu'auto-entrepreneur."}
                    </p>
                </div>
            </section>

            {/* Articles Grid */}
            <section className="py-20 lg:py-32">
                <div className="container mx-auto px-4">
                    {loading ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="bg-card border border-border rounded-[2rem] overflow-hidden animate-pulse">
                                    <div className="h-56 bg-muted"></div>
                                    <div className="p-6 space-y-4">
                                        <div className="h-4 bg-muted rounded-full w-1/3"></div>
                                        <div className="h-6 bg-muted rounded-full w-4/5"></div>
                                        <div className="h-4 bg-muted rounded-full w-full"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-24">
                            <div className="text-6xl mb-4">📝</div>
                            <h3 className="text-2xl font-black text-foreground mb-2">Aucun article pour le moment</h3>
                            <p className="text-muted-foreground">Revenez bientôt pour découvrir nos contenus.</p>
                        </div>
                    ) : (
                        <>
                            {/* Count label */}
                            <p className="text-sm text-muted-foreground font-bold mb-8">
                                {posts.length} article{posts.length > 1 ? 's' : ''} · page {page}/{totalPages}
                            </p>

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {paginated.map((post) => {
                                    const imgSrc = getImageSrc(post);
                                    return (
                                        <Link
                                            key={post.id}
                                            to={isEnterprise ? `/entreprise/blog/${post.slug || post.id}` : `/blog/${post.slug || post.id}`}
                                            className="group bg-card border border-border rounded-[2rem] overflow-hidden hover:shadow-2xl hover:border-primary/40 transition-all duration-500 hover:-translate-y-1 flex flex-col"
                                        >
                                            <div className="h-56 overflow-hidden bg-muted relative">
                                                {imgSrc ? (
                                                    <img
                                                        src={imgSrc}
                                                        alt={post.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-6xl">📰</div>
                                                )}
                                                <div className="absolute top-4 left-4">
                                                    <span className="bg-primary text-white text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                                                        {post.type === 'enterprise' ? 'Entreprise' : 'Auto-Entrepreneur'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-6 flex flex-col flex-1">
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground font-black uppercase tracking-widest mb-3">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    <span>{formatDate(post.created_at)}</span>
                                                </div>
                                                <h2 className="text-xl font-black text-foreground tracking-tight mb-3 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                                                    {post.title}
                                                </h2>
                                                {post.excerpt && (
                                                    <p className="text-muted-foreground font-medium line-clamp-3 text-sm leading-relaxed flex-1">
                                                        {post.excerpt}
                                                    </p>
                                                )}
                                                <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 text-primary text-sm font-black uppercase tracking-wider">
                                                    <span>Lire l'article</span>
                                                    <ArrowLeft className="h-4 w-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-3 mt-16">
                                    <button
                                        onClick={() => { setPage(p => Math.max(1, p - 1)); scrollToTop(); }}
                                        disabled={page === 1}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-border font-black text-sm hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="h-4 w-4" /> Précédent
                                    </button>

                                    <div className="flex items-center gap-2">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                                            <button
                                                key={n}
                                                onClick={() => { setPage(n); scrollToTop(); }}
                                                className={`w-10 h-10 rounded-xl font-black text-sm transition-all ${n === page ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'border border-border hover:bg-muted'}`}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => { setPage(p => Math.min(totalPages, p + 1)); scrollToTop(); }}
                                        disabled={page === totalPages}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-border font-black text-sm hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        Suivant <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {/* Revolut Partnership Section */}
                    <RevolutPartnerSection />
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default BlogList;
