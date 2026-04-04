import { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import { Button } from '../../components/ui/button';
import { useNavigate, Link } from 'react-router-dom';
import {
    ArrowRight,
    CheckCircle2,
    Building2,
    Users2,
    Zap,
    ShieldCheck,
    Star,
    ChevronLeft,
    ChevronRight,
    Briefcase
} from 'lucide-react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

const partners = [
    '/partner/veepee-logo-300x83-1.png',
    '/partner/atalian-cmjn-medium-300x146-1.png',
    '/partner/WhatsApp_Image_2024-03-15_at_18.33.00-removebg-preview-300x118-1.png',
    '/partner/WhatsApp_Image_2024-03-15_at_18.33.31-removebg-preview-1-300x152-1.png',
    '/partner/WhatsApp_Image_2024-03-15_at_18.33.59-removebg-preview.png',
    '/partner/WhatsApp_Image_2024-03-15_at_18.34.25-removebg-preview-300x90-1.png',
    '/partner/WhatsApp_Image_2024-03-15_at_18.34.56-removebg-preview.png',
    '/partner/WhatsApp_Image_2024-03-15_at_18.35.41-removebg-preview-300x74-1.png',
    '/partner/WhatsApp_Image_2024-03-15_at_18.38.32-removebg-preview-300x68-1.png',
    '/partner/WhatsApp_Image_2024-03-15_at_18.39.11-removebg-preview-300x106-1.png',
    '/partner/WhatsApp_Image_2024-03-15_at_18.41.47-removebg-preview-300x65-1.png',
    '/partner/WhatsApp_Image_2024-03-15_at_18.45.30-removebg-preview-300x109-1.png',
];

const testimonials = [
    { name: "Marc D.", role: "Directeur Logistique · Veepee", text: "NettmobFrance a complètement transformé notre gestion des pics d'activité. Les profils sont qualifiés et opérationnels immédiatement.", stars: 5, avatar: "M" },
    { name: "Sophie L.", role: "Responsable RH · Atalian", text: "Un gain de temps incroyable. Plus besoin de passer par des agences classiques chronophages, en 15 minutes la mission est publiée et pourvue.", stars: 5, avatar: "S" },
    { name: "Thomas R.", role: "Gérant · Hôtel de Luxe", text: "La qualité du service est irréprochable. Le système de vérification des profils et d'évaluation nous garantit les meilleurs intervenants.", stars: 5, avatar: "T" },
    { name: "Claire M.", role: "Directrice d'Entrepôt", text: "Nous avons réduit nos coûts de recrutement de 40% tout en ayant accès à une base de travailleurs autonomes très motivés.", stars: 5, avatar: "C" },
    { name: "Antoine V.", role: "Chef de projet · Nettoyage Industriel", text: "L'interface est hyper intuitive, la facturation automatique est un soulagement administratif massif. Je recommande à 100%.", stars: 5, avatar: "A" },
    { name: "Nadia B.", role: "Responsable Exploitation", text: "Le service client est très réactif et la plateforme en elle-même est fluide. Trouver du personnel en urgence n'est plus un casse-tête.", stars: 5, avatar: "N" },
    { name: "Laurent K.", role: "Directeur de Magasin", text: "Idéal pour nos inventaires et nos mises en rayon nocturnes. Les auto-entrepreneurs inscrits sont ponctuels et professionnels.", stars: 5, avatar: "L" },
    { name: "Julie F.", role: "Manager Restauration", text: "Pour l'hôtellerie-restauration, c'est devenu notre outil principal. Nous modulons nos équipes chaque semaine selon la demande.", stars: 5, avatar: "J" },
    { name: "Alexandre P.", role: "Responsable Logistique", text: "La traçabilité et le pointage numérique des heures nous font gagner des heures chaque semaine. C'est le futur de l'interim 2.0.", stars: 5, avatar: "A" },
];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BACKEND_URL = API_URL.replace('/api', '');

const EnterpriseBlogSection = () => {
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        fetch(`${API_URL}/blog?type=enterprise&limit=4`)
            .then(r => r.json())
            .then(data => Array.isArray(data) && setPosts(data.slice(0, 4)))
            .catch(() => { });
    }, []);

    if (!posts.length) return null;

    const getImg = (p) => {
        if (!p.image_url) return null;
        return p.image_url.startsWith('http') ? p.image_url : `${BACKEND_URL}${p.image_url}`;
    };

    const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <section className="py-20 lg:py-32 bg-slate-50 dark:bg-slate-800/20">
            <div className="container mx-auto px-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest mb-4">
                            S'informer
                        </div>
                        <h2 className="text-3xl lg:text-4xl font-black tracking-tighter uppercase text-foreground">
                            Actualités <span className="text-primary">Entreprise</span>
                        </h2>
                    </div>
                    <Link to="/entreprise/blog" className="flex items-center gap-2 text-primary font-black uppercase text-sm tracking-wider hover:gap-3 transition-all">
                        Voir tous les articles <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {posts.map(post => (
                        <Link
                            key={post.id}
                            to={`/entreprise/blog/${post.slug || post.id}`}
                            className="group bg-card border border-border rounded-[1.5rem] overflow-hidden hover:shadow-xl hover:border-primary/40 transition-all duration-500 hover:-translate-y-1 flex flex-col"
                        >
                            <div className="h-40 overflow-hidden bg-muted">
                                {getImg(post) ? (
                                    <img src={getImg(post)} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" onError={e => { e.target.style.display = 'none'; }} />
                                ) : (
                                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-2xl">📰</div>
                                )}
                            </div>
                            <div className="p-4 flex flex-col flex-1">
                                <div className="text-xs text-muted-foreground font-bold mb-2">{formatDate(post.created_at)}</div>
                                <h3 className="font-black text-foreground text-sm line-clamp-3 group-hover:text-primary transition-colors leading-tight flex-1">
                                    {post.title}
                                </h3>
                                <div className="mt-3 pt-3 border-t border-border flex items-center gap-1.5 text-primary text-xs font-black uppercase tracking-wider">
                                    Lire <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

const LandingEnterprise = () => {
    useDocumentTitle('NettmobFrance - Le partenaire des entreprises');
    const navigate = useNavigate();

    // Testimonial Slider State
    const [currentSlide, setCurrentSlide] = useState(0);
    const [visibleCount, setVisibleCount] = useState(window.innerWidth < 1024 ? 1 : 3);
    const autoplayRef = useRef(null);
    const maxSlide = testimonials.length - visibleCount;

    useEffect(() => {
        const handleResize = () => {
            setVisibleCount(window.innerWidth < 1024 ? 1 : 3);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const nextSlide = () => setCurrentSlide(s => Math.min(s + 1, maxSlide));
    const prevSlide = () => setCurrentSlide(s => Math.max(s - 1, 0));

    useEffect(() => {
        autoplayRef.current = setInterval(() => {
            setCurrentSlide(s => (s >= maxSlide ? 0 : s + 1));
        }, 5000);
        return () => clearInterval(autoplayRef.current);
    }, [maxSlide]);

    const valueProps = [
        {
            title: "Vivier Qualifié",
            icon: <Users2 className="h-8 w-8 text-primary" />,
            desc: "Accédez à plus de 10 000 profils vérifiés et prêts à intervenir immédiatement."
        },
        {
            title: "Recrutement Express",
            icon: <Zap className="h-8 w-8 text-primary" />,
            desc: "Publiez votre mission et recevez des candidatures en moins de 15 minutes chrono."
        },
        {
            title: "Sécurité Totale",
            icon: <ShieldCheck className="h-8 w-8 text-primary" />,
            desc: "Assurance incluse et gestion administrative et facturation 100% automatisées."
        },
        {
            title: "Hauts Standards",
            icon: <Star className="h-8 w-8 text-primary" />,
            desc: "Une sélection rigoureuse sur le terrain pour garantir l'excellence opérationnelle."
        }
    ];

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 transition-colors duration-300">
            <Header />

            {/* Hero Section - Redimensionné (plus petit) avec Image à droite */}
            <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-20 overflow-hidden bg-slate-900 text-white">
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/40 rounded-full blur-[120px] -mr-64 -mt-64"></div>
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/30 rounded-full blur-[120px] -ml-64 -mb-64"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Text Content */}
                        <div className="max-w-xl">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white text-xs font-black mb-6 uppercase tracking-widest border border-white/20">
                                <Building2 className="h-4 w-4" />
                                <span>Solution Entreprise B2B</span>
                            </div>
                            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter mb-8 uppercase leading-[0.9]">
                                Recrutez vos experts <span className="text-primary drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]">en 2 mins.</span>
                            </h1>
                            <p className="text-lg lg:text-xl text-slate-300 mb-10 max-w-lg leading-relaxed font-semibold">
                                Optimisez votre flexibilité avec la plateforme N°1 du recrutement de travailleurs indépendants dans la logistique et le nettoyage.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <Button
                                    size="lg"
                                    onClick={() => navigate('/register/client?etape=informations')}
                                    className="h-14 px-8 text-lg font-black bg-[#a31a4d] text-white rounded-2xl w-full sm:w-auto uppercase tracking-wider hover:bg-[#a31a4d]/90 shadow-[0_10px_30px_rgba(163,26,77,0.3)] transition-all"
                                >
                                    Créer mon compte <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={() => navigate('/entreprise/fonctionnement')}
                                    className="h-14 px-8 text-lg font-black rounded-2xl w-full sm:w-auto uppercase tracking-wider bg-transparent border-white text-white hover:bg-white/10 transition-all border-2"
                                >
                                    En savoir plus
                                </Button>
                            </div>
                        </div>

                        {/* Image Showcase */}
                        <div className="relative hidden lg:flex justify-center items-center">
                            <div className="relative w-full max-w-[500px]">
                                {/* Decorative elements */}
                                <div className="absolute -top-4 -left-4 w-32 h-20 bg-primary/20 rounded-[1.5rem] border border-primary/30" />
                                <div className="absolute -bottom-4 -right-4 w-24 h-16 bg-blue-500/20 rounded-[1.5rem] border border-blue-400/30" />

                                <img
                                    src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=800"
                                    alt="NettmobFrance pour les Entreprises"
                                    className="relative z-10 w-full h-[400px] object-cover rounded-[2rem] shadow-2xl border-4 border-slate-800"
                                />

                                {/* Floating KPI */}
                                <div className="absolute z-20 -bottom-8 -left-8 bg-slate-800 border border-slate-700 rounded-[1.5rem] px-6 py-4 shadow-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                                            <CheckCircle2 className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <div className="text-xl font-black text-white">100%</div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Missions Pourvues</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Partners Section */}
            <section className="py-16 border-b border-border bg-muted/10">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-10">
                        <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight mb-3">
                            <span className="text-primary">200+ entreprises</span> délèguent leurs missions avec NettmobFrance
                        </h3>
                        <div className="w-16 h-0.5 bg-primary/50 mx-auto" />
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6 items-center max-w-5xl mx-auto">
                        {partners.map((logo, i) => (
                            <div key={i} className="flex items-center justify-center p-3 rounded-xl bg-white dark:bg-slate-900 border border-border hover:border-primary/30 transition-all shadow-sm">
                                <img
                                    src={logo}
                                    alt={`Partenaire ${i + 1}`}
                                    className="h-10 w-auto max-w-full object-contain grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Value Propositions */}
            <section className="py-24 relative">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16 max-w-3xl mx-auto">
                        <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter mb-4 leading-none">
                            Vos problèmes de personnel <span className="text-primary italic">résolus</span>
                        </h2>
                        <p className="text-muted-foreground text-lg font-medium">De l'expression du besoin à la facturation, NettmobFrance gère vos renforts en toute sérénité.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {valueProps.map((prop, i) => (
                            <div key={i} className="group p-8 rounded-[2.5rem] bg-card border border-border hover:border-primary transition-all duration-500 hover:shadow-2xl">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-all">
                                    {prop.icon}
                                </div>
                                <h3 className="text-xl font-black mb-3 uppercase tracking-tight">{prop.title}</h3>
                                <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                                    {prop.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Feature Section with Dashboard Image */}
            <section className="py-32 bg-slate-50 dark:bg-slate-800/20">
                <div className="container mx-auto px-4">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <div className="order-2 lg:order-1 relative">
                            <div className="aspect-video bg-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden border-[8px] border-slate-900 group relative">
                                <img src="/15.png" alt="Dashboard preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
                            </div>
                            <div className="absolute -bottom-8 -left-8 bg-[#a31a4d]/10 p-4 rounded-[2rem] border-4 border-background backdrop-blur-xl">
                                <div className="bg-[#a31a4d] px-6 py-4 rounded-xl text-white">
                                    <div className="text-xl font-black uppercase tracking-wider flex items-center gap-2">
                                        <Briefcase className="h-5 w-5" />
                                        DASHBOARD PRO
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="order-1 lg:order-2">
                            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest mb-6">✦ Technologie B2B</div>
                            <h2 className="text-3xl lg:text-4xl font-black mb-8 uppercase tracking-tighter leading-[0.9]">
                                Pilotez tout depuis votre <span className="text-primary italic">compte</span>
                            </h2>
                            <div className="space-y-6">
                                {[
                                    "Suivi en direct des auto-entrepreneurs",
                                    "Vérification Kbis & URSSAF ultra-stricte",
                                    "Validation des heures & facturation instantanée",
                                    "Système de notation exclusif pour fidéliser"
                                ].map((text, i) => (
                                    <div key={i} className="flex gap-4 items-center group bg-white dark:bg-slate-900 p-4 rounded-2xl border border-border shadow-sm hover:border-primary transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                                            <CheckCircle2 className="h-5 w-5" />
                                        </div>
                                        <span className="text-lg font-black uppercase tracking-tight text-slate-700 dark:text-slate-300">
                                            {text}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials - Slider */}
            <section className="py-32">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16 max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest mb-6">✦ Témoignages</div>
                        <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter leading-none mb-4">
                            Les leaders logistiques <span className="text-primary italic">valident</span>
                        </h2>
                        <p className="text-muted-foreground font-medium text-lg">Rejoignez des centaines de dirigeants qui ont réinventé leur gestion du personnel.</p>
                    </div>

                    <div className="relative">
                        <div className="overflow-hidden">
                            <div
                                className="flex transition-transform duration-500 ease-in-out"
                                style={{ transform: `translateX(-${currentSlide * (100 / testimonials.length)}%)` }}
                            >
                                {testimonials.map((t, i) => (
                                    <div key={i} className="w-full lg:w-1/3 flex-shrink-0 px-3">
                                        <div className="p-8 rounded-[2rem] border border-border bg-card dark:bg-slate-900/50 hover:border-primary/40 transition-all flex flex-col gap-6 h-full shadow-sm hover:shadow-xl">
                                            <div className="flex gap-1 bg-yellow-400/10 w-fit p-2 rounded-lg">
                                                {[...Array(t.stars)].map((_, j) => (
                                                    <Star key={j} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                                ))}
                                            </div>
                                            <p className="text-foreground leading-relaxed font-medium italic flex-1 text-lg">"{t.text}"</p>
                                            <div className="flex items-center gap-4 pt-6 border-t border-border">
                                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black lg:text-xl flex-shrink-0">
                                                    {t.avatar}
                                                </div>
                                                <div>
                                                    <div className="font-black text-foreground uppercase tracking-tight">{t.name}</div>
                                                    <div className="text-xs text-muted-foreground font-bold">{t.role}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Pagination / Controls */}
                        <div className="flex items-center justify-center gap-4 mt-12">
                            <button onClick={prevSlide} disabled={currentSlide === 0} className="w-12 h-12 rounded-full border-2 border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors disabled:opacity-30">
                                <ChevronLeft className="h-6 w-6" />
                            </button>
                            <div className="flex gap-2">
                                {Array.from({ length: maxSlide + 1 }).map((_, i) => (
                                    <button key={i} onClick={() => setCurrentSlide(i)} className={`h-2.5 rounded-full transition-all ${i === currentSlide ? 'bg-primary w-8' : 'bg-border w-2.5 hover:bg-primary/50'}`} />
                                ))}
                            </div>
                            <button onClick={nextSlide} disabled={currentSlide === maxSlide} className="w-12 h-12 rounded-full border-2 border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors disabled:opacity-30">
                                <ChevronRight className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Devis */}
            <section className="pb-20">
                <div className="container mx-auto px-4">
                    <div className="rounded-[3rem] bg-slate-900 p-12 md:p-20 text-center text-white relative overflow-hidden border border-slate-800 shadow-2xl">
                        <div className="absolute inset-0 opacity-20 pointer-events-none">
                            <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary rounded-full blur-[100px]" />
                        </div>
                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest mb-6 border border-primary/30">
                                <CheckCircle2 className="h-4 w-4" /> Solution sur-mesure
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-6">
                                Besoin d'un accompagnement <span className="text-primary italic">personnalisé ?</span>
                            </h2>
                            <p className="text-slate-400 text-lg font-medium mb-10 max-w-2xl mx-auto">
                                Obtenez une tarification sur-mesure pour vos besoins en volume et découvrez comment NettmobFrance peut déployer des équipes entières pour vous.
                            </p>
                            <Button size="lg" onClick={() => navigate('/entreprise/devis')} className="h-14 px-10 font-black uppercase rounded-2xl bg-[#a31a4d] hover:bg-[#a31a4d]/90 text-white gap-2 shadow-[0_10px_30px_rgba(163,26,77,0.4)] hover:scale-105 transition-all">
                                Demander un devis gratuit <ArrowRight className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            <EnterpriseBlogSection />

            <Footer />
        </div>
    );
};

export default LandingEnterprise;
