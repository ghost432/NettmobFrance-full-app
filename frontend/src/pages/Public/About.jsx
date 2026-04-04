import Header from './components/Header';
import Footer from './components/Footer';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import {
    Users,
    Target,
    Rocket,
    ShieldCheck,
    CheckCircle2,
    Zap,
    Globe,
    Smartphone,
    Truck,
    Trees
} from 'lucide-react';

const About = () => {
    useDocumentTitle('À propos - NettmobFrance');

    const values = [
        {
            icon: <Globe className="h-8 w-8 text-primary" />,
            title: "Locale",
            description: "Une approche centrée sur l'économie locale et humaine."
        },
        {
            icon: <Users className="h-8 w-8 text-primary" />,
            title: "Humaine",
            description: "Humaniser les relations professionnelles via la technologie."
        },
        {
            icon: <Rocket className="h-8 w-8 text-primary" />,
            title: "Flexible",
            description: "Répondre aux nouveaux besoins de flexibilité du marché."
        }
    ];

    const sectors = [
        {
            icon: <Truck className="h-10 w-10" />,
            name: "Logistique de grande surface",
            description: "Optimisation des flux et gestion des rayons."
        },
        {
            icon: <Target className="h-10 w-10" />,
            name: "Logistique d'entrepôt",
            description: "Gestion des stocks, préparation de commandes et expédition."
        },
        {
            icon: <Trees className="h-10 w-10" />,
            name: "Nettoyage professionnel",
            description: "Maintenance et hygiène des locaux d'entreprises."
        }
    ];

    const features = [
        "Notifications en temps réel sur mobile",
        "Mise en relation directe et rapide",
        "Gestion simplifiée des prestations",
        "Paiements sécurisés",
        "Interface fluide et intuitive",
        "Support réactif et accompagnement"
    ];

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <Header />

            {/* Hero Section */}
            <section className="relative pt-40 pb-20 lg:pt-56 lg:pb-32 overflow-hidden bg-slate-900 text-white">
                <div className="absolute inset-0 z-0 opacity-20">
                    <img
                        src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1920"
                        alt="About Us Background"
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <h1 className="text-4xl lg:text-6xl font-black mb-6 uppercase tracking-tighter">
                        À Propos de <span className="text-primary">NettmobFrance</span>
                    </h1>
                    <p className="text-xl text-slate-300 max-w-3xl mx-auto font-medium">
                        Votre partenaire stratégique pour une économie plus flexible, plus humaine et plus locale.
                    </p>
                </div>
            </section>

            {/* Mission & Vision */}
            <section className="py-24">
                <div className="container mx-auto px-4">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8">
                            <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter leading-none">
                                Notre <span className="text-primary underline decoration-8 underline-offset-[12px]">Mission</span>
                            </h2>
                            <p className="text-xl text-muted-foreground leading-relaxed">
                                NettmobFrance est une plateforme de mise en relation spécialisée qui connecte des auto-entrepreneurs qualifiés avec des entreprises ayant des besoins ponctuels ou récurrents.
                            </p>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Nous croyons fermement en une économie où la technologie simplifie le travail tout en préservant le lien social et l'efficacité locale. Notre objectif est de transformer les défis du recrutement en opportunités fluides.
                            </p>
                            <div className="grid sm:grid-cols-3 gap-6 pt-8">
                                {values.map((value, index) => (
                                    <div key={index} className="space-y-4">
                                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                                            {value.icon}
                                        </div>
                                        <div>
                                            <h3 className="font-black uppercase tracking-tighter text-sm mb-2">{value.title}</h3>
                                            <p className="text-xs text-muted-foreground leading-tight">{value.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="relative group">
                            <div className="absolute -inset-4 bg-primary/20 rounded-[3rem] blur-2xl group-hover:bg-primary/30 transition-all duration-700"></div>
                            <img
                                src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1200"
                                alt="Team working"
                                className="relative rounded-[2.5rem] shadow-2xl border border-white/10"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Pourquoi nous ? */}
            <section className="py-24 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter mb-6">
                            Pourquoi <span className="text-primary">NettmobFrance</span> ?
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Une solution concrète face aux défis majeurs rencontrés par les entreprises et les indépendants.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="p-10 rounded-[2.5rem] bg-background border border-border shadow-soft hover:border-primary transition-colors">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-6 font-black text-xl italic">
                                ENT
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 text-[#3A559F]">Pour les entreprises</h3>
                            <p className="text-muted-foreground leading-relaxed italic border-l-4 border-blue-500 pl-4">
                                "Difficultés de recrutement persistantes et taux de turn-over élevé ? Nous offrons une réactivité accrue pour trouver du personnel qualifié immédiatement."
                            </p>
                        </div>
                        <div className="p-10 rounded-[2.5rem] bg-background border border-border shadow-soft hover:border-primary transition-colors">
                            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 mb-6 font-black text-xl italic">
                                AE
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 text-[#3A559F]">Pour les indépendants</h3>
                            <p className="text-muted-foreground leading-relaxed italic border-l-4 border-orange-500 pl-4">
                                "Manque de visibilité et difficultés à trouver des missions régulières ? Notre plateforme vous offre des opportunités directes et une meilleure visibilité sur le marché."
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Secteurs d'Activité */}
            <section className="py-24">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter mb-6">
                            Nos <span className="text-primary underline decoration-8 underline-offset-[12px]">Secteurs</span> d'Activité
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {sectors.map((sector, index) => (
                            <div key={index} className="p-8 rounded-[2rem] bg-muted/20 border border-border text-center group hover:bg-primary hover:text-white transition-all duration-300">
                                <div className="w-20 h-20 rounded-2xl bg-primary/10 group-hover:bg-white/20 flex items-center justify-center text-primary group-hover:text-white mx-auto mb-6 transform group-hover:rotate-12 transition-all">
                                    {sector.icon}
                                </div>
                                <h3 className="text-xl font-black uppercase tracking-tighter mb-4">{sector.name}</h3>
                                <p className="text-sm opacity-80 leading-relaxed font-medium">
                                    {sector.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Fonctionnement & Technologie */}
            <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
                    <Zap className="w-full h-full text-primary transform rotate-12 scale-150" />
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter mb-8 leading-none">
                                Technologie & <span className="text-primary">Simplicité</span>
                            </h2>
                            <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                                NettmobFrance propose une plateforme moderne accessible sur smartphone (Android et iPhone) via une application dédiée ou le navigateur.
                            </p>
                            <div className="grid gap-4">
                                {features.map((feature, index) => (
                                    <div key={index} className="flex items-center gap-4 group">
                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                            <CheckCircle2 className="h-5 w-5" />
                                        </div>
                                        <span className="font-black uppercase tracking-tight text-sm text-slate-200">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-4 pt-12">
                                <img src="https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&q=80&w=600" alt="Mobile app usage" className="rounded-3xl shadow-2xl border-4 border-slate-800" />
                                <div className="bg-primary p-6 rounded-3xl text-center">
                                    <Smartphone className="h-8 w-8 mx-auto mb-2" />
                                    <div className="font-black uppercase text-xs uppercase tracking-widest">Optimisé Mobile</div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="bg-slate-800 p-6 rounded-3xl text-center border border-slate-700">
                                    <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-primary" />
                                    <div className="font-black uppercase text-xs uppercase tracking-widest">100% Sécurisé</div>
                                </div>
                                <img src="https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=600" alt="Platform tech" className="rounded-3xl shadow-2xl border-4 border-slate-800" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24">
                <div className="container mx-auto px-4">
                    <div className="bg-primary rounded-[3rem] p-12 lg:p-20 text-white text-center shadow-2xl shadow-primary/40 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-blue-600 opacity-50"></div>
                        <div className="relative z-10">
                            <h2 className="text-3xl lg:text-5xl font-black uppercase tracking-tighter mb-8 leading-none">
                                Prêt à rejoindre <br className="hidden md:block" /> l'aventure ?
                            </h2>
                            <p className="text-xl mb-12 opacity-90 max-w-xl mx-auto font-medium">
                                Que vous soyez une entreprise en quête de talent ou un indépendant cherchant des missions, commencez dès aujourd'hui.
                            </p>
                            <div className="flex flex-wrap justify-center gap-6">
                                <button className="h-16 px-10 rounded-2xl bg-white text-primary font-black uppercase tracking-tighter text-lg hover:scale-105 transition-transform shadow-xl">
                                    Créer un compte
                                </button>
                                <button className="h-16 px-10 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-tighter text-lg hover:bg-slate-800 transition-colors shadow-xl">
                                    Nous contacter
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default About;
