import { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { Play, X, PlayCircle, Building2, User, ChevronLeft, ChevronRight } from 'lucide-react';
import RevolutPartnerSection from './components/revolut/RevolutPartnerSection';
import { getAssetUrl } from '../../lib/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const PAGE_SIZE = 12;

const VideoModal = ({ tuto, onClose }) => {
    if (!tuto) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.9)' }} onClick={onClose}>
            <div className="relative w-full max-w-4xl bg-black rounded-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors backdrop-blur-sm" aria-label="Fermer">
                    <X className="w-5 h-5 text-white" />
                </button>
                <div className="aspect-video w-full">
                    <video className="w-full h-full" controls autoPlay preload="auto" key={tuto.video_url}>
                        <source src={getAssetUrl(tuto.video_url)} type="video/mp4" />
                        Votre navigateur ne supporte pas la lecture de vidéos.
                    </video>
                </div>
                <div className="p-6 bg-slate-900">
                    <h3 className="text-xl font-black uppercase tracking-tight text-white">{tuto.titre}</h3>
                    <p className="text-slate-400 mt-1 font-medium text-sm">{new Date(tuto.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
            </div>
        </div>
    );
};

const TutorielsPage = ({ type }) => {
    const isEnterprise = type === 'enterprise';
    useDocumentTitle(isEnterprise ? 'Tutoriels Entreprise - NettmobFrance' : 'Tutoriels Vidéo - NettmobFrance');

    const [tutos, setTutos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [activeVideo, setActiveVideo] = useState(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({ type, page, limit: PAGE_SIZE });
                const res = await fetch(`${API_URL}/tutoriels?${params}`);
                const data = await res.json();
                setTutos(data.tutoriels || []);
                setTotal(data.total || 0);
                setTotalPages(data.totalPages || 1);
            } catch {
                setTutos([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [type, page]);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />
            <VideoModal tuto={activeVideo} onClose={() => setActiveVideo(null)} />

            {/* Hero */}
            <section className="relative pt-40 pb-20 lg:pt-56 lg:pb-32 overflow-hidden bg-slate-900 text-white">
                <div className="absolute inset-0 z-0 opacity-25">
                    <img
                        src={isEnterprise
                            ? "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1920"
                            : "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1920"}
                        alt="Tutoriels Background"
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-black mb-6 uppercase tracking-widest border bg-white/10 text-white border-white/20">
                        {isEnterprise ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
                        <span>{isEnterprise ? 'Espace Entreprise' : 'Espace Auto-Entrepreneur'}</span>
                    </div>
                    <h1 className="text-4xl lg:text-6xl font-black tracking-tighter mb-6 uppercase text-white">
                        Guides <span className="text-primary">{isEnterprise ? 'Entreprise' : 'Vidéo'}</span>
                    </h1>
                    <p className="text-xl max-w-2xl mx-auto font-semibold text-slate-300">
                        {isEnterprise
                            ? "Tout ce qu'une entreprise doit savoir pour réussir son recrutement sur NettmobFrance."
                            : "Tout ce qu'un auto-entrepreneur doit savoir pour réussir sur NettmobFrance, expliqué en vidéo."}
                    </p>
                </div>
            </section>

            {/* Content */}
            <section className="py-20 lg:py-32">
                <div className="container mx-auto px-4">
                    {loading ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="rounded-[2.5rem] border border-border overflow-hidden animate-pulse bg-muted">
                                    <div className="aspect-video bg-slate-800" />
                                    <div className="p-6 space-y-3">
                                        <div className="h-5 bg-muted-foreground/20 rounded-full w-3/4" />
                                        <div className="h-4 bg-muted-foreground/10 rounded-full w-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : tutos.length === 0 ? (
                        <div className="text-center py-24">
                            <div className="text-6xl mb-4">🎬</div>
                            <h3 className="text-2xl font-black text-foreground mb-2">Aucun tutoriel disponible</h3>
                            <p className="text-muted-foreground">Les tutoriels seront disponibles prochainement.</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-muted-foreground font-bold mb-8">
                                {total} tutoriel{total > 1 ? 's' : ''} · page {page}/{totalPages}
                            </p>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {tutos.map((tuto, index) => (
                                    <div
                                        key={tuto.id}
                                        className="group bg-muted/30 rounded-[2.5rem] border border-border overflow-hidden hover:border-primary/50 transition-all hover:shadow-2xl hover:shadow-primary/5 cursor-pointer"
                                        onClick={() => setActiveVideo(tuto)}
                                    >
                                        <div className="aspect-video bg-slate-900 relative overflow-hidden">
                                            <video className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity pointer-events-none" preload="metadata" muted>
                                                <source src={getAssetUrl(tuto.video_url)} type="video/mp4" />
                                            </video>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-16 h-16 bg-white/10 group-hover:bg-primary/80 backdrop-blur-sm border-2 border-white/30 group-hover:border-primary rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-xl">
                                                    <PlayCircle className="w-8 h-8 text-white fill-white" />
                                                </div>
                                            </div>
                                            <div className="absolute top-4 left-4 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-black shadow-lg">
                                                {(page - 1) * PAGE_SIZE + index + 1}
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <h3 className="text-lg font-black uppercase tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight mb-2">
                                                {tuto.titre}
                                            </h3>
                                            <p className="text-xs text-muted-foreground font-bold mb-3">
                                                {new Date(tuto.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                            </p>
                                            <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest">
                                                <Play className="w-3.5 h-3.5 fill-primary" />
                                                Regarder
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-3 mt-16">
                                    <button onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} disabled={page === 1} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-border font-black text-sm hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                                        <ChevronLeft className="h-4 w-4" /> Précédent
                                    </button>
                                    <div className="flex items-center gap-2">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                                            <button key={n} onClick={() => { setPage(n); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`w-10 h-10 rounded-xl font-black text-sm transition-all ${n === page ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'border border-border hover:bg-muted'}`}>
                                                {n}
                                            </button>
                                        ))}
                                    </div>
                                    <button onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} disabled={page === totalPages} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-border font-black text-sm hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
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

            {/* CTA */}
            <section className="pb-20">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="p-10 md:p-16 rounded-[3rem] bg-slate-900 text-white text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -mr-32 -mt-32 opacity-50" />
                        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-6 relative z-10">
                            {isEnterprise ? 'Besoin d\'un accompagnement ?' : 'Besoin d\'aide personnalisée ?'}
                            <span className="text-primary italic"> On est là.</span>
                        </h2>
                        <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto font-medium relative z-10">
                            {isEnterprise
                                ? "Un account manager dédié peut vous aider à optimiser vos recrutements."
                                : "Notre support est disponible pour répondre à toutes vos questions."}
                        </p>
                        <a href={isEnterprise ? '/entreprise/contact' : '/contact'} className="inline-block bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-primary/20 relative z-10">
                            {isEnterprise ? 'Prendre rendez-vous' : 'Contacter le support'}
                        </a>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default TutorielsPage;
