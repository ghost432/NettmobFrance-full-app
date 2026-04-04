import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { ChevronDown, HelpCircle, Building2, CreditCard, ShieldCheck, Smartphone, Users, FileText, Zap, ArrowRight } from 'lucide-react';

const faqs = [
    {
        category: 'Général',
        icon: <HelpCircle className="h-5 w-5" />,
        color: 'bg-blue-500/10 text-blue-500',
        questions: [
            {
                q: "Qu'est-ce que NettmobFrance pour les entreprises ?",
                a: "NettmobFrance est une plateforme digitale B2B qui met en relation les entreprises avec des auto-entrepreneurs qualifiés (appelés auto-mobs) pour répondre à leurs besoins ponctuels ou réguliers en main-d'œuvre dans les secteurs de la logistique, du nettoyage, de l'hôtellerie et de la grande distribution."
            },
            {
                q: "Quels types d'entreprises peuvent utiliser NettmobFrance ?",
                a: "Toute entreprise ayant besoin de renforts flexibles peut utiliser NettmobFrance : hôtels, entrepôts logistiques, grandes surfaces, chaînes de nettoyage, restaurants, sites industriels, etc. La plateforme s'adapte aussi bien aux PME qu'aux grands groupes."
            },
            {
                q: "Faut-il signer un contrat pour utiliser la plateforme ?",
                a: "Non, il n'y a pas de contrat de longue durée imposé. Vous pouvez utiliser NettmobFrance de façon ponctuelle ou régulière selon vos besoins. Un mandat de facturation vous permet de déléguer la gestion administrative à la plateforme."
            },
            {
                q: "NettmobFrance est-elle disponible partout en France ?",
                a: "Oui, la plateforme opère sur toute la France. Vous pouvez publier des missions dans n'importe quelle ville et des auto-mobs locaux seront notifiés. Notre réseau est particulièrement dense en Île-de-France et dans les grandes métropoles."
            },
        ]
    },
    {
        category: 'Recrutement & Missions',
        icon: <Users className="h-5 w-5" />,
        color: 'bg-emerald-500/10 text-emerald-500',
        questions: [
            {
                q: "Comment publier une mission ?",
                a: "Depuis votre tableau de bord entreprise, cliquez sur « Publier une mission ». Renseignez le type de poste, le secteur d'activité, la date, les horaires, le lieu et le taux horaire. Votre mission est immédiatement diffusée aux auto-mobs disponibles correspondant à vos critères."
            },
            {
                q: "Combien de temps faut-il pour trouver un prestataire ?",
                a: "Dans la plupart des cas, vous trouverez un auto-mob qualifié dans les 24 heures suivant la publication. Pour les besoins urgents, la plateforme envoie des alertes prioritaires aux prestataires disponibles dans votre zone immédiatement."
            },
            {
                q: "Puis-je choisir les profils que j'accepte ?",
                a: "Oui. Vous pouvez consulter les profils des auto-mobs (expériences, évaluations, avis d'autres entreprises) avant de confirmer une mission. Vous pouvez également marquer des favoris pour retrouver en priorité vos prestataires habituels lors de vos prochaines publications."
            },
            {
                q: "Comment sont sélectionnés les auto-mobs ?",
                a: "Tous les auto-mobs inscrits sont vérifiés par notre équipe : identité, numéro SIRET valide, documents professionnels si requis. La plateforme vous propose automatiquement les profils les plus adaptés à vos critères (secteur, localisation, disponibilité, évaluations)."
            },
            {
                q: "Puis-je publier plusieurs missions simultanément ?",
                a: "Oui, vous pouvez gérer plusieurs missions en parallèle depuis votre tableau de bord. Chaque mission dispose de son propre espace de suivi : candidatures reçues, confirmation, pointages et facturation."
            },
            {
                q: "Quels secteurs d'activité sont couverts ?",
                a: "NettmobFrance couvre quatre secteurs principaux : Hôtellerie (accueil, service en chambre, conciergerie), Logistique Grande Surface (réassort, gestion de stocks), Logistique Entrepôt (manutention, picking, emballage) et Nettoyage (locaux professionnels, chantiers, hôtels). D'autres secteurs sont en cours d'intégration."
            },
        ]
    },
    {
        category: 'Facturation & Paiements',
        icon: <CreditCard className="h-5 w-5" />,
        color: 'bg-orange-500/10 text-orange-500',
        questions: [
            {
                q: "Comment fonctionne la facturation ?",
                a: "NettmobFrance génère automatiquement les factures à l'issue de chaque mission validée. Vous recevez un récapitulatif mensuel détaillé avec toutes les heures effectuées, les taux horaires appliqués et les montants correspondants. Vous n'avez aucune démarche administrative à effectuer."
            },
            {
                q: "Quels moyens de paiement sont acceptés ?",
                a: "Les entreprises règlent leurs factures par virement bancaire (SEPA). D'autres moyens de paiement seront progressivement ajoutés. Toutes les transactions sont sécurisées et traçables depuis votre espace entreprise."
            },
            {
                q: "Y a-t-il des frais cachés ?",
                a: "Non. La plateforme applique des frais de service transparents inclus dans le taux horaire affiché. Vous savez exactement ce que vous paierez avant de publier une mission. Aucune surprise sur votre facture finale."
            },
            {
                q: "Quels sont les tarifs et abonnements disponibles ?",
                a: "NettmobFrance propose différentes formules adaptées à vos volumes de missions (occasionnel, régulier, intensif). Chaque formule inclut un nombre de missions, des fonctionnalités spécifiques et un niveau de support. Contactez-nous pour obtenir un devis personnalisé."
            },
            {
                q: "Comment suivre mes dépenses sur la plateforme ?",
                a: "Votre tableau de bord entreprise intègre un espace de suivi financier complet : historique des missions, factures téléchargeables, récapitulatifs mensuels et graphiques de dépenses. Vous pouvez exporter toutes vos données comptables en CSV ou PDF."
            },
        ]
    },
    {
        category: 'Gestion & Pointage',
        icon: <FileText className="h-5 w-5" />,
        color: 'bg-purple-500/10 text-purple-500',
        questions: [
            {
                q: "Comment fonctionne le pointage des missions ?",
                a: "En début et en fin de mission, l'auto-mob effectue un pointage via l'application (QR Code scannable sur site ou géolocalisation). Les heures sont validées automatiquement et déclenchent la facturation. Vous recevez une confirmation en temps réel."
            },
            {
                q: "Que se passe-t-il si l'auto-mob ne se présente pas ?",
                a: "En cas d'absence non signalée, vous êtes notifié immédiatement. La plateforme recherche automatiquement un remplaçant disponible dans votre zone. L'auto-mob fautif reçoit un signalement sur son profil pouvant entraîner une suspension."
            },
            {
                q: "Puis-je évaluer les prestataires après une mission ?",
                a: "Oui, à l'issue de chaque mission vous pouvez laisser une évaluation (note et commentaire). Ces avis sont visibles par les autres entreprises et contribuent à la qualité globale du réseau de prestataires."
            },
            {
                q: "Comment signaler un problème avec un prestataire ?",
                a: "Depuis votre tableau de bord, utilisez le bouton « Signaler » sur la fiche du prestataire ou la mission concernée. Notre équipe traite chaque signalement dans les 24h et vous tient informé des mesures prises."
            },
        ]
    },
    {
        category: 'Sécurité & Conformité',
        icon: <ShieldCheck className="h-5 w-5" />,
        color: 'bg-red-500/10 text-red-500',
        questions: [
            {
                q: "NettmobFrance est-elle conforme RGPD ?",
                a: "Oui, NettmobFrance est entièrement conforme au RGPD. Les données de vos collaborateurs et de vos missions sont chiffrées, stockées de manière sécurisée sur des serveurs en France, et ne sont jamais revendues à des tiers."
            },
            {
                q: "Quelle est la responsabilité de l'entreprise vis-à-vis des auto-mobs ?",
                a: "Les auto-mobs ont le statut d'auto-entrepreneur indépendant. Vous n'avez donc pas à gérer de contrat de travail, de cotisations sociales ou de bulletins de salaire. NettmobFrance gère la relation commerciale via le mandat de facturation."
            },
            {
                q: "En cas de litige avec un prestataire, quel est le recours ?",
                a: "NettmobFrance dispose d'un processus de médiation interne accessible depuis votre tableau de bord. Notre équipe support intervient pour trouver une solution équitable. En cas de litige financier, les montants contestés sont bloqués jusqu'à résolution."
            },
            {
                q: "Les auto-mobs sont-ils assurés durant les missions ?",
                a: "Chaque auto-mob est responsable de sa propre assurance professionnelle (RC Pro). NettmobFrance vérifie la validité des assurances lors de l'inscription. Nous vous recommandons de vérifier que vos propres assurances couvrent la prestation de services externes sur votre site."
            },
        ]
    },
    {
        category: 'Support & Intégration',
        icon: <Smartphone className="h-5 w-5" />,
        color: 'bg-cyan-500/10 text-cyan-500',
        questions: [
            {
                q: "Existe-t-il une intégration avec nos outils RH ou ERP ?",
                a: "NettmobFrance propose des exports de données (CSV, PDF) compatibles avec la plupart des outils comptables et RH. Des intégrations API sont disponibles sur les formules avancées. Contactez notre équipe commerciale pour étudier une intégration sur mesure."
            },
            {
                q: "Quel support est disponible pour les entreprises ?",
                a: "Nos clients entreprises bénéficient d'un accès prioritaire au support : email à contact@nettmobfrance.fr, téléphone au +33 7 66 39 09 92, ou chat depuis votre tableau de bord. Un account manager dédié est disponible sur les formules Premium."
            },
            {
                q: "Comment former mon équipe à l'utilisation de la plateforme ?",
                a: "NettmobFrance propose des tutoriels vidéo, une documentation complète et des webinaires de formation. Après votre inscription, notre équipe peut organiser une démonstration personnalisée de la plateforme pour vous et votre équipe."
            },
        ]
    },
];

const FAQItem = ({ question, answer }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className={`border border-border rounded-2xl overflow-hidden transition-all ${open ? 'bg-primary/5 border-primary/30' : 'bg-muted/20 hover:bg-muted/40'}`}>
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between p-5 text-left gap-4"
            >
                <span className={`font-bold text-sm leading-snug ${open ? 'text-primary' : ''}`}>{question}</span>
                <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 ${open ? 'rotate-180 text-primary' : ''}`} />
            </button>
            {open && (
                <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
                    {answer}
                </div>
            )}
        </div>
    );
};

const FAQEntreprise = () => {
    useDocumentTitle('FAQ Entreprise — NettmobFrance');
    const navigate = useNavigate();
    const [activeCategory, setActiveCategory] = useState(null);

    const displayed = activeCategory
        ? faqs.filter(f => f.category === activeCategory)
        : faqs;

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="pt-32 pb-20">
                <div className="container mx-auto px-4 max-w-4xl">

                    {/* Hero */}
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest mb-6">
                            <Building2 className="h-4 w-4" />
                            Espace Entreprise
                        </div>
                        <h1 className="text-5xl font-black uppercase tracking-tighter mb-4">
                            FAQ <span className="text-primary italic">Entreprise</span>
                        </h1>
                        <p className="text-lg text-muted-foreground font-medium max-w-xl mx-auto">
                            Toutes les réponses à vos questions pour recruter et gérer vos prestataires sur NettmobFrance.
                        </p>
                    </div>

                    {/* Category Filter */}
                    <div className="flex flex-wrap gap-2 justify-center mb-12">
                        <button
                            onClick={() => setActiveCategory(null)}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${activeCategory === null
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'border-border hover:border-primary/50 hover:text-primary'
                                }`}
                        >
                            Toutes
                        </button>
                        {faqs.map(f => (
                            <button
                                key={f.category}
                                onClick={() => setActiveCategory(f.category === activeCategory ? null : f.category)}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${activeCategory === f.category
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'border-border hover:border-primary/50 hover:text-primary'
                                    }`}
                            >
                                {f.category}
                            </button>
                        ))}
                    </div>

                    {/* FAQ Sections */}
                    <div className="space-y-12">
                        {displayed.map((section) => (
                            <div key={section.category}>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className={`w-10 h-10 rounded-xl ${section.color} flex items-center justify-center`}>
                                        {section.icon}
                                    </div>
                                    <h2 className="text-xl font-black uppercase tracking-tight">{section.category}</h2>
                                    <div className="flex-1 h-px bg-border" />
                                    <span className="text-xs text-muted-foreground font-bold">{section.questions.length} questions</span>
                                </div>
                                <div className="space-y-3">
                                    {section.questions.map((item, i) => (
                                        <FAQItem key={i} question={item.q} answer={item.a} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* CTA Contact */}
                    <div className="mt-20 p-10 rounded-[3rem] bg-slate-900 text-white text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[80px] rounded-full -mr-32 -mt-32 opacity-60" />
                        <div className="relative z-10">
                            <h3 className="text-2xl font-black uppercase tracking-tighter mb-3">
                                Prêt à commencer ?
                            </h3>
                            <p className="text-slate-400 mb-8 font-medium">Rejoignez les entreprises qui nous font déjà confiance.</p>
                            <div className="flex flex-wrap items-center justify-center gap-4">
                                <button
                                    onClick={() => navigate('/register/client?etape=informations')}
                                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm uppercase tracking-widest px-8 py-4 rounded-xl transition-colors shadow-lg shadow-primary/20"
                                >
                                    Créer mon compte <ArrowRight className="h-4 w-4" />
                                </button>
                                <a
                                    href="/entreprise/contact"
                                    className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black text-sm uppercase tracking-widest px-8 py-4 rounded-xl transition-colors"
                                >
                                    Nous contacter
                                </a>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
            <Footer />
        </div>
    );
};

export default FAQEntreprise;
