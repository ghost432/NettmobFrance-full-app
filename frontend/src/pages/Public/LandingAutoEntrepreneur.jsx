import { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import { Button } from '../../components/ui/button';
import { useNavigate, Link } from 'react-router-dom';
import {
    ArrowRight,
    CheckCircle2,
    Star,
    Hotel,
    Truck,
    Sparkles,
    ShoppingBag,
    UserCheck,
    ShieldCheck,
    Smartphone,
    Zap,
    Clock,
    MapPin,
    Euro,
    ThumbsUp,
    ChevronRight,
    ChevronLeft
} from 'lucide-react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import RevolutPartnerSection from './components/revolut/RevolutPartnerSection';

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
    { name: "Karim B.", role: "Auto-entrepreneur · Logistique", text: "Grâce à NettmobFrance, j'ai trouvé mes premières missions en moins de 48h après mon inscription. La plateforme est simple et les paiements sont rapides.", stars: 5, avatar: "K" },
    { name: "Fatou M.", role: "Auto-entrepreneur · Hôtellerie", text: "Je travaille à mon rythme, j'accepte les missions qui m'intéressent et j'ai toujours des propositions. C'est exactement ce que je cherchais comme indépendante.", stars: 5, avatar: "F" },
    { name: "Julien R.", role: "Auto-entrepreneur · Nettoyage", text: "La facturation automatique m'a simplifié la vie. Je n'ai plus à gérer la paperasse. Je me concentre uniquement sur mes missions.", stars: 5, avatar: "J" },
    { name: "Amina T.", role: "Auto-entrepreneur · Grande Surface", text: "J'ai pu remplir mon agenda en quelques jours. Les notifications SMS sont très pratiques, je ne rate aucune opportunité.", stars: 5, avatar: "A" },
    { name: "Thomas L.", role: "Auto-entrepreneur · Entrepôt", text: "La vérification d'identité est rapide. En 24h mon compte était validé et j'avais déjà ma première mission confirmée.", stars: 5, avatar: "T" },
    { name: "Sarah K.", role: "Auto-entrepreneur · Hôtellerie", text: "NettmobFrance m'a permis de découvrir des entreprises que je ne connaissais pas. Je travaille maintenant avec 3 hôtels différents chaque semaine.", stars: 5, avatar: "S" },
    { name: "Moussa D.", role: "Auto-entrepreneur · Logistique", text: "Le pointage via l'application est simple. Plus besoin de feuilles de présence, tout est numérique et les heures sont bien comptées.", stars: 5, avatar: "M" },
    { name: "Clara P.", role: "Auto-entrepreneur · Nettoyage", text: "Je recommande à tous les auto-entrepreneurs qui cherchent de la régularité. Les missions sont fréquentes et les entreprises sérieuses.", stars: 5, avatar: "C" },
    { name: "Rachid B.", role: "Auto-entrepreneur · Grande Surface", text: "La plateforme est intuitive, les missions sont claires et les paiements ponctuels. Je n'ai jamais eu de problème depuis mon inscription.", stars: 5, avatar: "R" },
];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BACKEND_URL = API_URL.replace('/api', '');

const BlogSection = ({ type }) => {
    const [posts, setPosts] = useState([]);
    const isEnterprise = type === 'enterprise';
    const blogPath = isEnterprise ? '/entreprise/blog' : '/blog';

    useEffect(() => {
        fetch(`${API_URL}/blog?type=${type}&limit=4`)
            .then(r => r.json())
            .then(data => Array.isArray(data) && setPosts(data.slice(0, 4)))
            .catch(() => { });
    }, [type]);

    if (!posts.length) return null;

    const getImg = (p) => {
        if (!p.image_url) return null;
        return p.image_url.startsWith('http') ? p.image_url : `${BACKEND_URL}${p.image_url}`;
    };

    const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <section className="py-20 lg:py-32 bg-muted/30">
            <div className="container mx-auto px-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest mb-4">
                            Blog
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase text-foreground">
                            Derniers <span className="text-primary">articles</span>
                        </h2>
                    </div>
                    <Link to={blogPath} className="flex items-center gap-2 text-primary font-black uppercase text-sm tracking-wider hover:gap-3 transition-all">
                        Voir tous les articles <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {posts.map(post => (
                        <Link
                            key={post.id}
                            to={`${blogPath}/${post.slug || post.id}`}
                            className="group bg-card border border-border rounded-[1.5rem] overflow-hidden hover:shadow-xl hover:border-primary/40 transition-all duration-500 hover:-translate-y-1 flex flex-col"
                        >
                            <div className="h-40 overflow-hidden bg-muted">
                                {getImg(post) ? (
                                    <img src={getImg(post)} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" onError={e => e.target.parentElement.innerHTML = '<div class="w-full h-full bg-primary/10 flex items-center justify-center text-2xl">📰</div>'} />
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

const LandingAutoEntrepreneur = () => {
    useDocumentTitle('NettmobFrance - Le travail enfin libre!');
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [visibleCount, setVisibleCount] = useState(window.innerWidth < 768 ? 1 : 3);
    const autoplayRef = useRef(null);

    const maxSlide = testimonials.length - visibleCount;

    useEffect(() => {
        const handleResize = () => {
            setVisibleCount(window.innerWidth < 768 ? 1 : 3);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const nextSlide = () => setCurrentSlide(s => Math.min(s + 1, maxSlide));
    const prevSlide = () => setCurrentSlide(s => Math.max(s - 1, 0));

    useEffect(() => {
        autoplayRef.current = setInterval(() => {
            setCurrentSlide(s => (s >= maxSlide ? 0 : s + 1));
        }, 4000);
        return () => clearInterval(autoplayRef.current);
    }, [maxSlide]);

    const sectors = [
        {
            title: "Logistique Entrepôt",
            icon: <Truck className="h-6 w-6" />,
            image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800",
            description: "Missions de préparation de commande et manutention."
        },
        {
            title: "Hôtellerie",
            icon: <Hotel className="h-6 w-6" />,
            image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800",
            description: "Service, réception et entretien haut de gamme."
        },
        {
            title: "Nettoyage",
            icon: <Sparkles className="h-6 w-6" />,
            image: "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&q=80&w=800",
            description: "Professionnels de l'hygiène pour tous types de locaux."
        },
        {
            title: "Logistique Grande Surface",
            icon: <ShoppingBag className="h-6 w-6" />,
            image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800",
            description: "Mise en rayon et gestion des flux en magasin."
        }
    ];

    const stats = [
        { label: "Rémunération moyenne", value: "15€/h" },
        { label: "Entreprises partenaires", value: "200+" },
        { label: "Missions disponibles", value: "500+" },
        { label: "Professionnels inscrits", value: "10 000+" }
    ];

    const steps = [
        { number: "01", icon: <UserCheck className="h-7 w-7" />, title: "Créez votre compte", desc: "Inscription gratuite en 5 minutes. Renseignez vos informations et votre numéro SIRET." },
        { number: "02", icon: <ShieldCheck className="h-7 w-7" />, title: "Vérification d'identité", desc: "Notre équipe valide votre profil sous 24–48h pour garantir la sécurité de tous." },
        { number: "03", icon: <Smartphone className="h-7 w-7" />, title: "Recevez des missions par SMS", desc: "Alertes en temps réel avec photo et détails. Acceptez ou refusez en un clic." },
        { number: "04", icon: <Euro className="h-7 w-7" />, title: "Faites-vous payer", desc: "Les factures sont générées automatiquement. Demandez votre retrait depuis le tableau de bord." }
    ];

    const advantages = [
        { icon: <Zap className="h-6 w-6" />, title: "Missions immédiates", desc: "Accédez à des centaines de missions disponibles immédiatement dans votre secteur et votre zone." },
        { icon: <Clock className="h-6 w-6" />, title: "Flexibilité totale", desc: "Choisissez vos missions selon vos disponibilités. Vous n'avez aucune obligation d'accepter." },
        { icon: <MapPin className="h-6 w-6" />, title: "Partout en France", desc: "Des missions dans toutes les grandes villes françaises, en adéquation avec votre zone de déplacement." },
        { icon: <Euro className="h-6 w-6" />, title: "Paiement sécurisé", desc: "Facturation automatique après chaque mission. Vos gains sont sécurisés et tracés sur votre compte." },
        { icon: <ShieldCheck className="h-6 w-6" />, title: "Profils vérifiés", desc: "Toutes les entreprises partenaires sont vérifiées. Vous travaillez toujours dans un cadre sécurisé." },
        { icon: <ThumbsUp className="h-6 w-6" />, title: "Réputation & évaluations", desc: "Construisez votre réputation grâce aux évaluations après mission. Accédez à de meilleures opportunités." }
    ];

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 transition-colors duration-300">
            <Header />

            {/* Hero Section */}
            <section className="relative pt-36 pb-20 lg:pt-48 lg:pb-28 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -mr-64 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] -ml-64 -mb-32"></div>
                </div>
                <div className="container mx-auto px-4 relative">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left: Text */}
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-black mb-6 uppercase tracking-wider">
                                <Star className="h-4 w-4 fill-primary" />
                                <span>N°1 de la mission logistique &amp; nettoyage</span>
                            </div>
                            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter mb-6 uppercase leading-[0.9]">
                                A la recherche<br /> d'une <span className="text-primary">mission?</span>
                            </h1>
                            <p className="text-lg text-muted-foreground mb-10 max-w-xl leading-relaxed font-medium">
                                Devenez indépendant et travaillez selon vos disponibilités. NettmobFrance offre des missions à travers toute la France dans les secteurs porteurs.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                                <Button size="lg" onClick={() => navigate('/account-type')} className="h-14 px-10 text-base font-black bg-primary rounded-2xl uppercase tracking-tighter">
                                    Je m'inscris gratuitement <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                                <Button variant="outline" size="lg" onClick={() => navigate('/fonctionnement')} className="h-14 px-10 text-base font-black rounded-2xl uppercase tracking-tighter border-2">
                                    Comment ça marche ?
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground font-bold uppercase tracking-widest">
                                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> Inscription gratuite</span>
                                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> SIRET requis</span>
                                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> Paiement sécurisé</span>
                                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> Toute la France</span>
                            </div>
                        </div>
                        {/* Right: App screenshot */}
                        <div className="relative hidden lg:flex justify-center items-center">
                            <div className="relative">
                                {/* Decorative cards behind */}
                                <div className="absolute -top-6 -left-6 w-40 h-24 bg-primary/10 rounded-[20px] border border-primary/20" />
                                <div className="absolute -bottom-6 -right-6 w-32 h-20 bg-blue-500/10 rounded-[20px] border border-blue-400/20" />
                                <div className="absolute top-1/2 -right-12 -translate-y-1/2 w-24 h-32 bg-muted/60 rounded-[20px] border border-border" />
                                {/* Main image */}
                                <img
                                    src="/11.png"
                                    alt="NettmobFrance - Excellence"
                                    className="relative z-10 w-[500px] h-[400px] object-cover rounded-[20px] shadow-2xl border border-border"
                                />
                                {/* Floating badge */}
                                <div className="absolute z-20 -bottom-6 -left-12 bg-background border border-border rounded-[20px] px-6 py-4 shadow-xl">
                                    <div className="text-2xl font-black text-primary">500+</div>
                                    <div className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">Missions actives</div>
                                </div>
                                <div className="absolute z-20 -top-6 -right-12 bg-primary text-primary-foreground rounded-[20px] px-6 py-4 shadow-xl">
                                    <div className="text-2xl font-black">10k+</div>
                                    <div className="text-[11px] opacity-80 font-bold uppercase tracking-wider">Auto-mobs</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Revolut Partnership Section */}
            <RevolutPartnerSection />

            {/* Stats Bar */}
            <section className="bg-muted/30 border-y border-border py-16">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
                        {stats.map((stat, i) => (
                            <div key={i} className="text-center group border-r last:border-0 border-border/50">
                                <div className="text-5xl font-black text-primary mb-2 group-hover:scale-110 transition-transform">{stat.value}</div>
                                <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Partners Section */}
            <section className="py-16 border-b border-border">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-10">
                        <h3 className="text-2xl font-black uppercase tracking-tight mb-3">
                            Entreprises qui boostent leur quotidien avec <span className="text-primary">NettmobFrance</span>
                        </h3>
                        <div className="w-16 h-0.5 bg-primary mx-auto" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
                        {partners.map((logo, i) => (
                            <div key={i} className="flex items-center justify-center p-4 rounded-2xl bg-muted/20 border border-border hover:border-primary/30 hover:bg-muted/40 transition-all">
                                <img
                                    src={logo}
                                    alt={`Partenaire ${i + 1}`}
                                    className="h-12 w-auto max-w-full object-contain opacity-70 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Sectors Section */}
            <section className="py-24">
                <div className="container mx-auto px-4">
                    <div className="text-left max-w-3xl mb-16">
                        <h2 className="text-4xl lg:text-5xl font-black mb-6 uppercase tracking-tighter leading-none">
                            Nos secteurs <br /><span className="text-primary underline decoration-4 underline-offset-[10px]">d'activité</span>
                        </h2>
                        <p className="text-lg text-muted-foreground font-medium">
                            Trouvez la mission qui correspond à vos compétences parmi nos 4 univers d'excellence.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {sectors.map((sector, i) => (
                            <div key={i} className="group relative aspect-[3/4] overflow-hidden rounded-[2.5rem] border border-border hover:border-primary transition-all duration-500">
                                <img src={sector.image} alt={sector.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                                <div className="absolute bottom-0 left-0 p-8 w-full group-hover:translate-y-[-10px] transition-transform">
                                    <div className="w-14 h-14 rounded-2xl bg-primary/20 backdrop-blur-xl flex items-center justify-center text-primary mb-6">
                                        {sector.icon}
                                    </div>
                                    <h3 className="text-xl font-black text-white mb-2 uppercase">{sector.title}</h3>
                                    <p className="text-slate-300 text-sm font-medium line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {sector.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="text-center mt-12">
                        <Button variant="outline" onClick={() => navigate('/secteurs')} className="h-12 px-8 font-black uppercase rounded-2xl border-2 gap-2">
                            Voir tous les secteurs <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </section>

            {/* Comment ça marche */}
            <section className="py-32 bg-slate-900 text-white relative overflow-hidden mx-4 rounded-[3rem]">
                <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-primary/20 blur-[120px] rounded-full -ml-48 -mt-48 opacity-50" />
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full -mr-48 -mb-48 opacity-50" />
                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-20">
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest mb-6">✦ Simple & Rapide</div>
                        <h2 className="text-5xl lg:text-6xl font-black uppercase tracking-tighter mb-4 leading-tight">
                            Comment ça <span className="text-primary italic">marche ?</span>
                        </h2>
                        <p className="text-slate-400 text-lg font-medium max-w-xl mx-auto">De l'inscription à votre première mission, tout est automatisé.</p>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {steps.map((step, i) => (
                            <div key={i} className="relative p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-primary/40 transition-all group">
                                <div className="text-6xl font-black text-white/5 absolute top-4 right-6 select-none">{step.number}</div>
                                <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                                    {step.icon}
                                </div>
                                <h3 className="font-black text-base uppercase tracking-tight mb-3">{step.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                    <div className="text-center mt-12">
                        <Button onClick={() => navigate('/fonctionnement')} className="h-12 px-8 font-black uppercase rounded-2xl gap-2 bg-primary hover:bg-primary/90">
                            En savoir plus <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </section>

            {/* Advantages */}
            <section className="py-32">
                <div className="container mx-auto px-4">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest mb-6">✦ Pourquoi nous choisir</div>
                            <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter leading-none mb-6">
                                Tous les avantages <span className="text-primary italic">en un seul endroit</span>
                            </h2>
                            <p className="text-muted-foreground text-lg font-medium mb-10">
                                NettmobFrance conçoit chaque fonctionnalité pour maximiser vos revenus tout en simplifiant votre quotidien d'auto-entrepreneur.
                            </p>
                            <Button onClick={() => navigate('/account-type')} className="h-12 px-8 font-black uppercase rounded-2xl gap-2 bg-primary hover:bg-primary/90">
                                Commencer maintenant <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {advantages.map((adv, i) => (
                                <div key={i} className="p-6 rounded-2xl border border-border bg-muted/20 hover:border-primary/40 hover:bg-primary/5 transition-all group">
                                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                                        {adv.icon}
                                    </div>
                                    <h4 className="font-black uppercase tracking-tight text-sm mb-2">{adv.title}</h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{adv.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* App Showcase */}
            <section className="py-20 bg-muted/20 border-y border-border">
                <div className="container mx-auto px-4">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="relative flex justify-center">
                            <img src="/capture.png" alt="Dashboard NettmobFrance" className="max-w-[280px] w-full rounded-[2.5rem] shadow-2xl border border-border" />
                            <div className="absolute -bottom-6 -right-6 bg-primary text-primary-foreground rounded-2xl px-6 py-4 shadow-xl font-black text-sm uppercase tracking-tight hidden md:block">
                                <div className="text-2xl font-black">500+</div>
                                <div className="text-[10px] opacity-80">Missions actives</div>
                            </div>
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest mb-6">✦ Application mobile</div>
                            <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter leading-none mb-6">
                                Gérez tout depuis <span className="text-primary italic">votre mobile</span>
                            </h2>
                            <p className="text-muted-foreground text-lg font-medium mb-8">
                                Tableau de bord, notifications SMS, pointage, demande de retrait… tout est accessible en quelques secondes depuis votre smartphone.
                            </p>
                            <div className="flex gap-4 flex-wrap">
                                <a href="#" className="block hover:opacity-90 transition-opacity"><img src="/google.png" alt="Google Play" className="h-12 w-auto" /></a>
                                <a href="#" className="block hover:opacity-90 transition-opacity"><img src="/apple.png" alt="App Store" className="h-12 w-auto" /></a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials - 9 scrolling 3 per slide */}
            <section className="py-32">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest mb-6">✦ Témoignages</div>
                        <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter">
                            Ils nous font <span className="text-primary italic">confiance</span>
                        </h2>
                    </div>

                    <div className="relative">
                        {/* Track: 9 cards, each 1/3 wide. Transform moves 1/9 of track per step = 1 card */}
                        <div className="overflow-hidden">
                            <div
                                className="flex transition-transform duration-500 ease-in-out"
                                style={{ transform: `translateX(-${currentSlide * (100 / testimonials.length)}%)` }}
                            >
                                {testimonials.map((t, i) => (
                                    <div
                                        key={i}
                                        className="w-full md:w-1/3 flex-shrink-0 px-3"
                                    >
                                        <div className="p-8 rounded-[2rem] border border-border bg-muted/20 hover:border-primary/40 transition-all flex flex-col gap-5 h-full">
                                            <div className="flex gap-1">
                                                {[...Array(t.stars)].map((_, j) => (
                                                    <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                                                ))}
                                            </div>
                                            <p className="text-muted-foreground leading-relaxed italic flex-1">"{t.text}"</p>
                                            <div className="flex items-center gap-3 pt-4 border-t border-border">
                                                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-black flex-shrink-0">
                                                    {t.avatar}
                                                </div>
                                                <div>
                                                    <div className="font-black text-sm">{t.name}</div>
                                                    <div className="text-xs text-muted-foreground">{t.role}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-center gap-4 mt-10">
                            <button onClick={prevSlide} disabled={currentSlide === 0} className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors disabled:opacity-30">
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <div className="flex gap-2">
                                {Array.from({ length: maxSlide + 1 }).map((_, i) => (
                                    <button key={i} onClick={() => setCurrentSlide(i)} className={`h-2 rounded-full transition-all ${i === currentSlide ? 'bg-primary w-6' : 'bg-border w-2'}`} />
                                ))}
                            </div>
                            <button onClick={nextSlide} disabled={currentSlide === maxSlide} className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors disabled:opacity-30">
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="pb-20">
                <div className="container mx-auto px-4">
                    <div className="rounded-[3rem] bg-primary p-16 md:p-24 text-center text-primary-foreground relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-[80px]" />
                            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full blur-[80px]" />
                        </div>
                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest mb-8">
                                ✦ Rejoignez 10 000+ auto-mobs
                            </div>
                            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-6">
                                Prêt à trouver<br />votre prochaine mission ?
                            </h2>
                            <p className="text-primary-foreground/80 text-lg font-medium mb-10 max-w-xl mx-auto">
                                Inscription gratuite, profil validé en 24h, premières missions disponibles immédiatement.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Button size="lg" onClick={() => navigate('/account-type')} className="h-14 px-10 font-black uppercase rounded-2xl bg-white text-primary hover:bg-white/90 gap-2">
                                    Je m'inscris gratuitement <ArrowRight className="h-5 w-5" />
                                </Button>
                                <Button variant="outline" size="lg" onClick={() => navigate('/contact')} className="h-14 px-10 font-black uppercase rounded-2xl border-white text-[#FDA050] hover:bg-white hover:text-primary transition-all gap-2">
                                    Nous contacter
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Latest Blog Posts */}
            <BlogSection type="auto-entrepreneur" />

            <Footer />
        </div>
    );
};

export default LandingAutoEntrepreneur;
