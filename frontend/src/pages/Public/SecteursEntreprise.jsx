import Header from './components/Header';
import Footer from './components/Footer';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useNavigate } from 'react-router-dom';
import {
    Hotel,
    ShoppingCart,
    Warehouse,
    Sparkles,
    ShieldCheck,
    Zap,
    Users,
    Clock,
    PlusCircle,
    Bell,
    UserCheck,
    BarChart3,
    ArrowRight
} from 'lucide-react';

const SecteursEntreprise = () => {
    useDocumentTitle('Secteurs d\'activité Entreprise — NettmobFrance');
    const navigate = useNavigate();

    const sectors = [
        {
            title: "Hôtellerie",
            icon: <Hotel className="h-6 w-6" />,
            description: "Vos standards d'accueil ne souffrent aucune compromission. NettmobFrance vous connecte à des auto-mobs aguerris en réception, service en chambre, conciergerie et entretien. Gérez vos pics d'activité, vos ouvertures de saison et vos remplacements urgents sans délai.",
            color: "bg-blue-500/10 text-blue-500",
            tags: ["Réception", "Service en chambre", "Conciergerie", "Entretien"]
        },
        {
            title: "Logistique – Grande Surface",
            icon: <ShoppingCart className="h-6 w-6" />,
            description: "Gardez vos rayons pleins et vos flux logistiques fluides. Recrutez en quelques heures des prestataires qualifiés pour le réassort, la mise en rayon, la préparation de commandes et la gestion des stocks — que ce soit en magasin ou en zone de réception.",
            color: "bg-orange-500/10 text-orange-500",
            tags: ["Réassort", "Mise en rayon", "Gestion de stocks", "Préparation de commandes"]
        },
        {
            title: "Logistique – Entrepôt",
            icon: <Warehouse className="h-6 w-6" />,
            description: "Pics d'activité, sous-traitance d'urgence, renfort saisonnier : NettmobFrance met à votre disposition des auto-mobs spécialisés en manutention, picking, emballage, chargement/déchargement et conduite d'engins. Votre chaîne logistique ne s'arrête plus.",
            color: "bg-emerald-500/10 text-emerald-500",
            tags: ["Manutention", "Picking", "Emballage", "Chargement / déchargement"]
        },
        {
            title: "Nettoyage",
            icon: <Sparkles className="h-6 w-6" />,
            description: "L'image de vos locaux reflète celle de votre marque. Mobilisez rapidement des auto-mobs formés au nettoyage industriel, tertiaire ou spécifique (bureaux, magasins, chantiers, hôtels). Interventions régulières ou ponctuelles, aux horaires qui vous conviennent.",
            color: "bg-purple-500/10 text-purple-500",
            tags: ["Locaux professionnels", "Nettoyage industriel", "Chantiers", "Hôtels"]
        }
    ];

    const steps = [
        {
            icon: <UserCheck className="h-6 w-6" />,
            title: "Créez votre compte entreprise",
            desc: "Inscription gratuite en moins de 5 minutes. Validation de votre compte sous 24h par notre équipe."
        },
        {
            icon: <PlusCircle className="h-6 w-6" />,
            title: "Publiez votre mission",
            desc: "Décrivez votre besoin : poste, secteur, date, horaires, lieu et taux horaire. En ligne instantanément."
        },
        {
            icon: <Bell className="h-6 w-6" />,
            title: "Recevez des candidatures",
            desc: "Les auto-mobs qualifiés de votre zone sont notifiés immédiatement. Réponses en temps réel."
        },
        {
            icon: <BarChart3 className="h-6 w-6" />,
            title: "Gérez & facturez sans effort",
            desc: "Pointage automatique, facture générée, récapitulatif mensuel. Zéro administratif pour vous."
        }
    ];

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="pt-32 pb-20">
                <div className="container mx-auto px-4">

                    {/* ✦ Intro Platform Section */}
                    <div className="mb-20 p-10 md:p-16 rounded-[3rem] bg-slate-900 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[120px] rounded-full -mr-48 -mt-48 opacity-50" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="text-primary font-black text-2xl">✦</span>
                                <span className="text-xs font-black uppercase tracking-[0.3em] text-primary bg-primary/10 px-4 py-1.5 rounded-lg">
                                    NettmobFrance Entreprise
                                </span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-4 leading-tight">
                                Recrutez avec <span className="text-primary italic">agilité, zéro administratif</span>
                            </h2>
                            <p className="text-slate-400 text-lg mb-10 max-w-2xl font-medium">
                                Publiez votre mission et obtenez un prestataire qualifié en moins de 24h — facturation automatique incluse.
                            </p>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {steps.map((step, i) => (
                                    <div key={i} className="flex flex-col gap-3 p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/40 transition-colors">
                                        <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                            {step.icon}
                                        </div>
                                        <h3 className="font-black text-sm uppercase tracking-wide">{step.title}</h3>
                                        <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Hero Section */}
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h1 className="text-3xl lg:text-5xl font-black uppercase tracking-tighter mb-6">
                            Nos secteurs <span className="text-primary italic">d'intervention</span>
                        </h1>
                        <p className="text-xl text-muted-foreground font-medium">
                            Quelle que soit votre activité, NettmobFrance vous propose des prestataires vérifiés, disponibles et opérationnels immédiatement.
                        </p>
                    </div>

                    {/* Sectors Grid */}
                    <div className="grid md:grid-cols-2 gap-8 mb-20">
                        {sectors.map((sector, index) => (
                            <div key={index} className="group p-8 rounded-[2.5rem] bg-muted/30 border border-border hover:border-primary/50 transition-all hover:shadow-2xl hover:shadow-primary/5">
                                <div className={`w-14 h-14 rounded-2xl ${sector.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    {sector.icon}
                                </div>
                                <h3 className="text-xl font-black uppercase tracking-tight mb-4">{sector.title}</h3>
                                <p className="text-muted-foreground leading-relaxed italic mb-5">{sector.description}</p>
                                <div className="flex flex-wrap gap-2">
                                    {sector.tags.map(tag => (
                                        <span key={tag} className="text-xs font-black px-3 py-1.5 rounded-full bg-background border border-border">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Why Us? */}
                    <div className="p-10 md:p-20 rounded-[3rem] bg-slate-900 text-white relative overflow-hidden mb-0">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[120px] rounded-full -mr-48 -mt-48 opacity-50"></div>
                        <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-8 leading-tight">
                                    Pourquoi choisir <span className="text-primary italic">NettmobFrance ?</span>
                                </h2>
                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                                            <ShieldCheck className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-black uppercase tracking-widest text-sm mb-1">Prestataires vérifiés</h4>
                                            <p className="opacity-60 text-sm">Identité, SIRET, RC Pro et expériences contrôlés avant chaque accès à la plateforme.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                                            <Clock className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-black uppercase tracking-widest text-sm mb-1">Réponse en moins de 24h</h4>
                                            <p className="opacity-60 text-sm">Même pour les besoins urgents — nos alertes SMS mobilisent les prestataires sans délai.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                                            <Zap className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-black uppercase tracking-widest text-sm mb-1">Zéro administratif</h4>
                                            <p className="opacity-60 text-sm">Facturation automatique, mandat de gestion, récapitulatifs mensuels — on gère tout.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                                            <Users className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-black uppercase tracking-widest text-sm mb-1">Support dédié</h4>
                                            <p className="opacity-60 text-sm">Un account manager disponible pour vous accompagner et résoudre vos urgences.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="relative">
                                <img
                                    src="/capture.png"
                                    alt="NettmobFrance App Preview"
                                    className="max-w-xs mx-auto drop-shadow-[0_35px_35px_rgba(0,0,0,0.5)] rounded-3xl"
                                />
                            </div>
                        </div>
                    </div>

                    {/* CTA Section */}
                    <div className="mt-20 p-10 md:p-20 rounded-[3rem] bg-primary text-primary-foreground text-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-[80px]" />
                            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full blur-[80px]" />
                        </div>
                        <div className="relative z-10">
                            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-6 leading-tight">
                                Prêt à recruter <br />vos prochains experts ?
                            </h2>
                            <p className="text-primary-foreground/80 text-lg mb-10 max-w-xl mx-auto font-medium">
                                Inscription gratuite, validation en 24h et publication de mission immédiate.
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-4">
                                <button
                                    onClick={() => navigate('/register/client?etape=informations')}
                                    className="inline-flex items-center gap-2 bg-white text-primary hover:bg-white/90 font-black text-sm uppercase tracking-widest px-10 py-4 rounded-2xl transition-all shadow-lg shadow-white/10 hover:-translate-y-0.5"
                                >
                                    Créer mon compte <ArrowRight className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={() => navigate('/entreprise/contact')}
                                    className="inline-flex items-center gap-2 bg-primary-foreground/10 hover:bg-primary-foreground/20 border border-white/20 text-white font-black text-sm uppercase tracking-widest px-10 py-4 rounded-2xl transition-all"
                                >
                                    Nous contacter
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default SecteursEntreprise;
