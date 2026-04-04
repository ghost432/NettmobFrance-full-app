import Header from './components/Header';
import Footer from './components/Footer';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useNavigate } from 'react-router-dom';
import {
    UserPlus,
    Search,
    Wallet,
    Smartphone,
    ShieldCheck,
    Zap,
    Clock,
    ArrowRight,
    CheckCircle2,
    Star
} from 'lucide-react';
import RevolutPartnerSection from './components/revolut/RevolutPartnerSection';

const Fonctionnement = () => {
    useDocumentTitle('Comment ça marche - NettmobFrance');
    const navigate = useNavigate();

    const steps = [
        {
            num: "01",
            title: "Inscription & Validation",
            icon: <UserPlus className="h-7 w-7" />,
            content: "Crée ton profil en 2 minutes. Télécharge tes documents (ID, SIRET) pour une vérification rapide par nos experts sous 24h.",
            color: "bg-blue-500/10 text-blue-600"
        },
        {
            num: "02",
            title: "Missions sur mesure",
            icon: <Search className="h-7 w-7" />,
            content: "Accède à des centaines de missions près de chez toi. Postule instantanément à celles qui correspondent à ton planning.",
            color: "bg-primary/10 text-primary"
        },
        {
            num: "03",
            title: "Réalisation & App",
            icon: <Smartphone className="h-7 w-7" />,
            content: "Gère tout depuis ton smartphone. Pointe tes heures via l'application NettmobFrance pour un suivi précis et sans erreur.",
            color: "bg-orange-500/10 text-orange-600"
        },
        {
            num: "04",
            title: "Paiement J+7",
            icon: <Wallet className="h-7 w-7" />,
            content: "Gagne ton argent en toute sécurité. Tes factures sont générées automatiquement et payées directement sur ton compte.",
            color: "bg-green-500/10 text-green-600"
        }
    ];

    const benefits = [
        {
            title: "Zéro Administratif",
            description: "On s'occupe de la facturation et du recouvrement. Tu te concentres sur ton job.",
            icon: <CheckCircle2 className="h-6 w-6 text-primary" />
        },
        {
            title: "Flexibilité Totale",
            description: "Choisis tes missions, tes horaires et tes clients. Tu es ton propre patron.",
            icon: <Zap className="h-6 w-6 text-primary" />
        },
        {
            title: "Paiement Garanti",
            description: "Plus d'impayés ! NettmobFrance garantit ton paiement pour chaque mission validée.",
            icon: <ShieldCheck className="h-6 w-6 text-primary" />
        }
    ];

    return (
        <div className="min-h-screen bg-background font-sans">
            <Header />

            <main>
                {/* Hero section premium */}
                <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 opacity-10 pointer-events-none">
                        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px]"></div>
                        <div className="absolute bottom-[10%] right-[-10%] w-[30%] h-[30%] bg-blue-600 rounded-full blur-[100px]"></div>
                    </div>

                    <div className="container mx-auto px-4 relative z-10 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-[0.2em] mb-8 animate-fade-in">
                            <Star className="h-3 w-3 fill-primary" /> Pour les Auto-Entrepreneurs
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter mb-8 leading-[0.9] text-foreground">
                            Deviens <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-light to-blue-600">Libre</span> <br />
                            & <span className="italic font-serif normal-case font-medium">Gagne plus</span>
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed mb-12">
                            Rejoins la première plateforme d'interim digital conçue pour les indépendants. Trouve des missions, gère tes paiements et booste ton activité.
                        </p>
                        <div className="flex flex-wrap justify-center gap-6">
                            <button
                                onClick={() => navigate('/register/automob')}
                                className="h-16 px-10 rounded-2xl bg-primary text-white font-black uppercase tracking-tighter text-lg hover:scale-105 transition-all shadow-xl shadow-primary/20 flex items-center gap-3"
                            >
                                Commencer maintenant <ArrowRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </section>

                {/* Step section premium */}
                <section className="py-24 bg-muted/30">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-20">
                            <h2 className="text-3xl lg:text-5xl font-black uppercase tracking-tighter mb-4 text-foreground">
                                Ton parcours vers le <span className="text-primary">succès</span>
                            </h2>
                            <div className="h-1.5 w-24 bg-primary mx-auto rounded-full"></div>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {steps.map((step, index) => (
                                <div key={index} className="relative p-10 rounded-[2.5rem] bg-card border border-border shadow-soft group hover:border-primary/50 transition-all duration-500 hover:-translate-y-2">
                                    <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-background border-4 border-muted/30 flex items-center justify-center font-black text-primary text-lg z-20">
                                        {step.num}
                                    </div>
                                    <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center mb-8 transform group-hover:rotate-12 transition-transform duration-500`}>
                                        {step.icon}
                                    </div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 leading-none">{step.title}</h3>
                                    <p className="text-muted-foreground font-medium leading-relaxed">
                                        {step.content}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Advantages section premium */}
                <section className="py-32 overflow-hidden relative">
                    <div className="container mx-auto px-4">
                        <div className="flex flex-col lg:flex-row items-center gap-16">
                            <div className="lg:w-1/2 space-y-8">
                                <h2 className="text-4xl lg:text-6xl font-black uppercase tracking-tighter leading-none text-foreground">
                                    Pourquoi choisir <br />
                                    <span className="text-primary underline decoration-primary/20 underline-offset-8">NettmobFrance</span> ?
                                </h2>
                                <p className="text-xl text-muted-foreground leading-relaxed">
                                    Plus qu'une simple plateforme, nous sommes ton partenaire de croissance. Nous avons supprimé toutes les barrières administratives pour te laisser faire ce que tu fais de mieux.
                                </p>

                                <div className="space-y-6 pt-4">
                                    {benefits.map((benefit, index) => (
                                        <div key={index} className="flex gap-6 p-6 rounded-3xl bg-muted/50 border border-border/50 hover:border-primary/30 transition-all">
                                            <div className="mt-1">{benefit.icon}</div>
                                            <div>
                                                <h4 className="text-xl font-black uppercase tracking-tighter mb-1">{benefit.title}</h4>
                                                <p className="text-muted-foreground font-medium">{benefit.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="lg:w-1/2 relative">
                                <div className="absolute -inset-10 bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-[4rem] blur-3xl opacity-50"></div>
                                <div className="relative">
                                    <div className="bg-slate-900 rounded-[3rem] p-4 shadow-2xl overflow-hidden border-8 border-slate-800">
                                        <img
                                            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200"
                                            alt="Dashboard Preview"
                                            className="rounded-[2.5rem] opacity-90 group-hover:opacity-100 transition-opacity"
                                        />
                                    </div>
                                    {/* Floaters for premium effect */}
                                    <div className="absolute -top-10 -left-10 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-2xl border border-border animate-bounce-slow">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center font-black">
                                                €
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Paiement reçu</div>
                                                <div className="text-xl font-black">+450,20 €</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-6 -right-6 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-2xl border border-border">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                                <Clock className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Temps gagné</div>
                                                <div className="text-lg font-black italic">8h / semaine</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Revolut Partnership Section */}
                <RevolutPartnerSection />

                {/* Final CTA premium */}
                <section className="py-24">
                    <div className="container mx-auto px-4">
                        <div className="relative rounded-[4rem] bg-slate-900 overflow-hidden p-12 lg:p-24 text-center">
                            <div className="absolute inset-0 z-0 opacity-40">
                                <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-primary rounded-full blur-[120px]"></div>
                                <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-blue-600 rounded-full blur-[100px]"></div>
                            </div>

                            <div className="relative z-10 text-white space-y-8">
                                <h2 className="text-4xl lg:text-7xl font-black uppercase tracking-tighter leading-none">
                                    Ta nouvelle vie <br /> commencie <span className="text-primary">ici</span>.
                                </h2>
                                <p className="text-xl text-slate-300 max-w-xl mx-auto font-medium leading-relaxed">
                                    Ne laisse plus l'administratif freiner tes ambitions. Rejoins NettmobFrance et deviens un indépendant serein.
                                </p>
                                <div className="flex flex-wrap justify-center gap-6 pt-4">
                                    <button
                                        onClick={() => navigate('/register/automob')}
                                        className="h-16 px-12 rounded-2xl bg-primary text-white font-black uppercase tracking-tighter text-lg hover:scale-105 transition-all shadow-2xl shadow-primary/40"
                                    >
                                        Créer mon compte
                                    </button>
                                    <button
                                        onClick={() => navigate('/contact')}
                                        className="h-16 px-12 rounded-2xl bg-white/10 text-white font-black uppercase tracking-tighter text-lg hover:bg-white/20 transition-all border border-white/20 backdrop-blur-md"
                                    >
                                        Parler à un expert
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default Fonctionnement;
