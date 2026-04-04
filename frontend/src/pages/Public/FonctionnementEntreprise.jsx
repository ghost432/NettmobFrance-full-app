import { useNavigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import {
    Building2, UserCheck, FileText, Clock, ShieldCheck,
    ArrowRight, CheckCircle, Zap, BarChart3, HeartHandshake,
    PlusCircle, Bell, Star, CreditCard, Users, Layers
} from 'lucide-react';

const steps = [
    {
        num: '01',
        icon: <PlusCircle className="h-7 w-7" />,
        title: 'Créez votre compte entreprise',
        description: "Inscrivez-vous en quelques minutes. Renseignez vos informations (SIRET, secteur, contacts). Notre équipe valide votre compte sous 24h.",
        details: ['Inscription 100% gratuite', 'Validation sous 24h', 'Aucun engagement de durée'],
        color: 'from-blue-500 to-blue-600',
        bg: 'bg-blue-50 dark:bg-blue-950/20',
        border: 'border-blue-200 dark:border-blue-800',
    },
    {
        num: '02',
        icon: <FileText className="h-7 w-7" />,
        title: 'Publiez votre mission',
        description: "Décrivez votre besoin en quelques clics : type de poste, secteur, date, horaires, lieu et taux horaire. Votre offre est en ligne instantanément.",
        details: ['Publication en moins de 2 minutes', 'Secteurs : logistique, nettoyage, hôtellerie, grande surface', 'Taux horaire libre'],
        color: 'from-primary to-primary/80',
        bg: 'bg-primary/5',
        border: 'border-primary/20',
    },
    {
        num: '03',
        icon: <Bell className="h-7 w-7" />,
        title: 'Les auto-mobs sont notifiés',
        description: "Dès la publication, les prestataires qualifiés de votre zone reçoivent une notification SMS avec tous les détails de la mission. Les candidatures arrivent en temps réel.",
        details: ['Notification SMS + plateforme', 'Ciblage géographique automatique', 'Réponse en moins de 24h en moyenne'],
        color: 'from-emerald-500 to-emerald-600',
        bg: 'bg-emerald-50 dark:bg-emerald-950/20',
        border: 'border-emerald-200 dark:border-emerald-800',
    },
    {
        num: '04',
        icon: <UserCheck className="h-7 w-7" />,
        title: 'Choisissez votre prestataire',
        description: "Consultez les profils des candidats (expériences, évaluations, avis d'autres entreprises). Confirmez le profil qui vous convient en un clic.",
        details: ['Profils vérifiés (ID, SIRET, RC Pro)', 'Historique de missions et évaluations', 'Favoris pour vos prestataires habituels'],
        color: 'from-purple-500 to-purple-600',
        bg: 'bg-purple-50 dark:bg-purple-950/20',
        border: 'border-purple-200 dark:border-purple-800',
    },
    {
        num: '05',
        icon: <CreditCard className="h-7 w-7" />,
        title: 'Facturation automatique',
        description: "À l'issue de la mission, les heures pointées sont calculées automatiquement. NettmobFrance génère et envoie la facture. Zéro administratif pour vous.",
        details: ['Pointage GPS ou QR Code', 'Facture générée automatiquement', 'Récapitulatif mensuel détaillé'],
        color: 'from-orange-500 to-orange-600',
        bg: 'bg-orange-50 dark:bg-orange-950/20',
        border: 'border-orange-200 dark:border-orange-800',
    },
];

const advantages = [
    {
        icon: <Zap className="h-6 w-6" />,
        title: 'Réactivité maximale',
        desc: 'Trouvez un prestataire qualifié en moins de 24h, même pour des besoins urgents.',
        color: 'text-yellow-500 bg-yellow-500/10',
    },
    {
        icon: <ShieldCheck className="h-6 w-6" />,
        title: 'Prestataires vérifiés',
        desc: "Identité, SIRET, assurance RC Pro — chaque auto-mob est contrôlé avant d'accéder à la plateforme.",
        color: 'text-emerald-500 bg-emerald-500/10',
    },
    {
        icon: <BarChart3 className="h-6 w-6" />,
        title: 'Suivi en temps réel',
        desc: "Dashboard centralisé pour gérer toutes vos missions, candidatures et pointages en un coup d'œil.",
        color: 'text-blue-500 bg-blue-500/10',
    },
    {
        icon: <HeartHandshake className="h-6 w-6" />,
        title: 'Zéro administratif',
        desc: "Facturation automatique, mandat de gestion : on s'occupe de tout, vous vous concentrez sur votre métier.",
        color: 'text-primary bg-primary/10',
    },
    {
        icon: <Users className="h-6 w-6" />,
        title: 'Réseau qualifié',
        desc: "Des milliers d'auto-mobs disponibles dans toute la France, spécialisés dans votre secteur.",
        color: 'text-purple-500 bg-purple-500/10',
    },
    {
        icon: <Layers className="h-6 w-6" />,
        title: 'Multi-secteurs',
        desc: "Logistique, nettoyage, hôtellerie, grande distribution — une seule plateforme pour tous vos besoins.",
        color: 'text-cyan-500 bg-cyan-500/10',
    },
];

const sectors = [
    { emoji: '🏨', name: 'Hôtellerie', desc: 'Accueil, service en chambre, conciergerie' },
    { emoji: '🏪', name: 'Grande Surface', desc: 'Réassort, gestion de stocks, caisse' },
    { emoji: '📦', name: 'Logistique Entrepôt', desc: 'Manutention, picking, emballage' },
    { emoji: '🧹', name: 'Nettoyage', desc: 'Locaux pro, chantiers, hôtels' },
];

const FonctionnementEntreprise = () => {
    useDocumentTitle('Comment ça marche — Entreprise · NettmobFrance');
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />

            {/* ── HERO ── */}
            <section className="relative overflow-hidden bg-slate-900 text-white pt-40 pb-28 lg:pt-52 lg:pb-36">
                <div className="absolute inset-0 opacity-30 pointer-events-none">
                    <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-primary/40 rounded-full blur-[140px] -mr-80 -mt-80" />
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] -ml-60 -mb-60" />
                </div>
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 text-white px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-8">
                        <Building2 className="h-4 w-4 text-primary" />
                        Espace Entreprise
                    </div>
                    <h1 className="text-3xl lg:text-5xl font-black uppercase tracking-tighter mb-6 leading-tight">
                        Comment ça <span className="text-primary italic">marche ?</span>
                    </h1>
                    <p className="text-xl text-slate-300 font-medium max-w-2xl mx-auto mb-10">
                        De la publication de votre mission à la facturation automatique —
                        NettmobFrance gère tout pour vous en 5 étapes simples.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <button
                            onClick={() => navigate('/register/client?etape=informations')}
                            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-black text-sm uppercase tracking-widest px-8 py-4 rounded-2xl transition-all shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5"
                        >
                            Commencer gratuitement <ArrowRight className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => navigate('/contact')}
                            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 text-white font-black text-sm uppercase tracking-widest px-8 py-4 rounded-2xl transition-all"
                        >
                            Demander une démo
                        </button>
                    </div>
                </div>
            </section>

            {/* ── 5 STEPS ── */}
            <section className="py-24 lg:py-36">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-2xl mx-auto mb-20">
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest mb-6">
                            <Clock className="h-4 w-4" />
                            Processus simplifié
                        </div>
                        <h2 className="text-2xl lg:text-4xl font-black uppercase tracking-tighter mb-4 whitespace-nowrap">
                            5 étapes, <span className="text-primary italic">zéro friction</span>
                        </h2>
                        <p className="text-muted-foreground font-medium text-lg">
                            De votre besoin à la mission accomplie, notre plateforme automatise chaque étape.
                        </p>
                    </div>

                    <div className="max-w-4xl mx-auto space-y-6">
                        {steps.map((step, i) => (
                            <div
                                key={step.num}
                                className={`group relative rounded-[2.5rem] border-2 ${step.border} ${step.bg} p-8 lg:p-10 hover:shadow-xl transition-all duration-500 hover:-translate-y-0.5`}
                            >
                                <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                                    {/* Step number + icon */}
                                    <div className="flex items-center gap-5 flex-shrink-0">
                                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                            {step.icon}
                                        </div>
                                        <span className="text-6xl font-black text-foreground/10 leading-none select-none">{step.num}</span>
                                    </div>
                                    {/* Content */}
                                    <div className="flex-1">
                                        <h3 className="text-xl lg:text-2xl font-black uppercase tracking-tight mb-2">{step.title}</h3>
                                        <p className="text-muted-foreground font-medium mb-4 leading-relaxed">{step.description}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {step.details.map((d, j) => (
                                                <span key={j} className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full bg-background/80 border border-border">
                                                    <CheckCircle className="h-3 w-3 text-primary" /> {d}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Connector arrow (not on last) */}
                                    {i < steps.length - 1 && (
                                        <div className="hidden lg:flex absolute -bottom-4 left-20 w-8 h-8 bg-background border-2 border-border rounded-full items-center justify-center z-10">
                                            <ArrowRight className="h-3 w-3 text-muted-foreground rotate-90" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SECTORS ── */}
            <section className="py-20 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-14">
                        <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-tighter mb-3">
                            Secteurs <span className="text-primary italic">disponibles</span>
                        </h2>
                        <p className="text-muted-foreground font-medium">Une seule plateforme pour tous vos besoins en main-d'œuvre flexible.</p>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                        {sectors.map((s) => (
                            <div key={s.name} className="bg-background border border-border rounded-[2rem] p-8 text-center hover:shadow-lg hover:border-primary/30 transition-all duration-300 hover:-translate-y-1">
                                <div className="text-5xl mb-4">{s.emoji}</div>
                                <h3 className="font-black text-lg uppercase tracking-tight mb-2">{s.name}</h3>
                                <p className="text-sm text-muted-foreground font-medium">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── ADVANTAGES ── */}
            <section className="py-24 lg:py-32">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-tighter mb-4">
                            Pourquoi <span className="text-primary italic">NettmobFrance ?</span>
                        </h2>
                        <p className="text-muted-foreground font-medium text-lg">
                            Tout ce dont votre entreprise a besoin pour recruter avec agilité.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        {advantages.map((a) => (
                            <div key={a.title} className="bg-background border border-border rounded-[2rem] p-8 hover:shadow-xl hover:border-primary/30 hover:-translate-y-1 transition-all duration-300">
                                <div className={`w-12 h-12 rounded-2xl ${a.color} flex items-center justify-center mb-5`}>
                                    {a.icon}
                                </div>
                                <h3 className="font-black text-lg uppercase tracking-tight mb-2">{a.title}</h3>
                                <p className="text-muted-foreground font-medium text-sm leading-relaxed">{a.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="py-20 pb-32 bg-slate-900 text-white">
                <div className="container mx-auto px-4 text-center relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
                    <div className="relative z-10 max-w-2xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest mb-8">
                            <Star className="h-4 w-4" />
                            Rejoignez-nous
                        </div>
                        <h2 className="text-3xl lg:text-5xl font-black uppercase tracking-tighter mb-6 leading-none">
                            Prêt à recruter <span className="text-primary italic">autrement ?</span>
                        </h2>
                        <p className="text-slate-400 font-medium text-lg mb-10">
                            Rejoignez les entreprises qui font confiance à NettmobFrance pour leurs besoins en main-d'œuvre flexible.
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <button
                                onClick={() => navigate('/register/client?etape=informations')}
                                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest px-10 py-4 rounded-2xl transition-all shadow-lg shadow-primary/30 hover:-translate-y-0.5 hover:shadow-xl"
                            >
                                Créer mon compte <ArrowRight className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => navigate('/entreprise/faq')}
                                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 text-white font-black uppercase tracking-widest px-10 py-4 rounded-2xl transition-all"
                            >
                                Voir la FAQ
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <div className="py-16 bg-background" />
            <Footer />
        </div>
    );
};

export default FonctionnementEntreprise;
