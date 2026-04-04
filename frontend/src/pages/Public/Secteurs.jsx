import Header from './components/Header';
import Footer from './components/Footer';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import {
    Hotel,
    ShoppingCart,
    Warehouse,
    Sparkles,
    ShieldCheck,
    Zap,
    Users,
    Bell,
    UserCheck,
    Smartphone
} from 'lucide-react';
import RevolutPartnerSection from './components/revolut/RevolutPartnerSection';

const Secteurs = () => {
    useDocumentTitle('Secteurs d\'activité - NettmobFrance');

    const sectors = [
        {
            title: "Hôtellerie",
            icon: <Hotel className="h-6 w-6" />,
            description: "Dans l'hôtellerie, chaque détail compte pour garantir une expérience client irréprochable. NettmobFrance permet aux établissements hôteliers de faire appel à des auto-mobs compétents pour des missions d'accueil, de service en chambre, de conciergerie, ou d'entretien, tout en s'adaptant à leur saisonnalité.",
            color: "bg-blue-500/10 text-blue-500"
        },
        {
            title: "Logistique – Grande Surface",
            icon: <ShoppingCart className="h-6 w-6" />,
            description: "La logistique en grande distribution exige réactivité, rigueur et efficacité. NettmobFrance met en relation les auto-mob's avec des enseignes de la grande distribution pour répondre à des besoins en approvisionnement, réassort, préparation de commandes, et gestion des stocks, que ce soit en magasin ou en zone de réception.",
            color: "bg-orange-500/10 text-orange-500"
        },
        {
            title: "Logistique – Entrepôt",
            icon: <Warehouse className="h-6 w-6" />,
            description: "Les entrepôts sont au cœur des flux de marchandises. Grâce à NettmobFrance, les professionnels du secteur peuvent recruter rapidement des auto-mobs qualifiés pour des missions de manutention, picking, emballage, chargement/déchargement, ou encore conduite d'engins spécialisés. Une solution souple et efficace pour faire face aux pics d'activité.",
            color: "bg-emerald-500/10 text-emerald-500"
        },
        {
            title: "Nettoyage",
            icon: <Sparkles className="h-6 w-6" />,
            description: "L'entretien des locaux professionnels est un enjeu majeur pour l'image et le bon fonctionnement de toute entreprise. Sur NettmobFrance, des auto-mobs spécialisés dans le nettoyage industriel, tertiaire ou spécifique (bureaux, magasins, chantiers, hôtels) peuvent être mobilisés rapidement et selon vos horaires.",
            color: "bg-purple-500/10 text-purple-500"
        }
    ];

    const steps = [
        {
            icon: <UserCheck className="h-6 w-6" />,
            title: "Créez votre compte gratuitement",
            desc: "En moins de 5 minutes, inscrivez-vous et accédez à la plateforme."
        },
        {
            icon: <ShieldCheck className="h-6 w-6" />,
            title: "Vérifiez votre identité",
            desc: "Téléchargez vos documents pour être validé par notre équipe."
        },
        {
            icon: <Zap className="h-6 w-6" />,
            title: "Renseignez vos compétences",
            desc: "Complétez votre profil afin de recevoir les missions qui vous correspondent."
        },
        {
            icon: <Smartphone className="h-6 w-6" />,
            title: "Recevez des missions par SMS",
            desc: "Soyez alerté en temps réel avec photo et détails de chaque mission disponible."
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
                                    NettmobFrance
                                </span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-4 leading-tight">
                                Une plateforme <span className="text-primary italic">100% digitale</span> et automatisée
                            </h2>
                            <p className="text-slate-400 text-lg mb-10 max-w-2xl font-medium">
                                Rejoignez des milliers d'auto-entrepreneurs qui trouvent des missions en quelques clics.
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
                        <h1 className="text-5xl font-black uppercase tracking-tighter mb-6">
                            Nos secteurs <span className="text-primary italic">d'activité</span>
                        </h1>
                        <p className="text-xl text-muted-foreground font-medium">
                            NettmobFrance accompagne les entreprises dans divers domaines en proposant des profils qualifiés et vérifiés.
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
                                <p className="text-muted-foreground leading-relaxed italic">{sector.description}</p>
                            </div>
                        ))}
                    </div>

                    {/* Why Us? */}
                    <div className="p-10 md:p-20 rounded-[3rem] bg-slate-900 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[120px] rounded-full -mr-48 -mt-48 opacity-50"></div>
                        <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                            <div>
                                <h2 className="text-4xl font-black uppercase tracking-tighter mb-8 leading-none">
                                    Pourquoi choisir <br /><span className="text-primary italic">NettmobFrance ?</span>
                                </h2>
                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                                            <ShieldCheck className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-black uppercase tracking-widest text-sm mb-1">Qualité garantie</h4>
                                            <p className="opacity-60 text-sm">Chaque profil est vérifié (Identité, SIRET, Expérience).</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                                            <Zap className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-black uppercase tracking-widest text-sm mb-1">Rapidité</h4>
                                            <p className="opacity-60 text-sm">Trouvez un prestataire en quelques minutes seulement.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                                            <Users className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-black uppercase tracking-widest text-sm mb-1">Accompagnement</h4>
                                            <p className="opacity-60 text-sm">Notre équipe est disponible 24/7 pour vos urgences.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="relative">
                                <img
                                    src="/capture.png"
                                    alt="App Preview"
                                    className="max-w-xs mx-auto drop-shadow-[0_35px_35px_rgba(0,0,0,0.5)] rounded-3xl"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Revolut Partnership Section */}
                    <RevolutPartnerSection />
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Secteurs;
