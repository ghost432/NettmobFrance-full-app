import { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { ChevronDown, HelpCircle, User, Building2, CreditCard, ShieldCheck, Smartphone } from 'lucide-react';
import RevolutPartnerSection from './components/revolut/RevolutPartnerSection';

const faqs = [
    {
        category: 'Général',
        icon: <HelpCircle className="h-5 w-5" />,
        color: 'bg-blue-500/10 text-blue-500',
        questions: [
            {
                q: "Qu'est-ce que NettmobFrance ?",
                a: "NettmobFrance est une plateforme 100% digitale de mise en relation entre des auto-entrepreneurs (appelés auto-mobs) et des entreprises ayant des besoins ponctuels ou réguliers en main-d'œuvre qualifiée dans des secteurs tels que la logistique, le nettoyage, l'hôtellerie et la grande distribution."
            },
            {
                q: "Comment fonctionne la plateforme ?",
                a: "La plateforme fonctionne de manière simple : les entreprises publient des missions avec tous les détails (secteur, lieu, horaires, taux horaire). Les auto-mobs reçoivent des notifications par SMS avec une image et les détails de la mission. Ils peuvent accepter ou refuser en un clic. En cas d'acceptation, la mission est confirmée et les deux parties en sont informées."
            },
            {
                q: "NettmobFrance est-elle disponible en dehors de Paris ?",
                a: "Oui, NettmobFrance opère sur toute la France. Les auto-mobs peuvent définir leurs zones de travail préférées et les entreprises peuvent publier des missions dans n'importe quelle ville française."
            },
            {
                q: "Y a-t-il une application mobile ?",
                a: "Oui, NettmobFrance est disponible sur iOS (App Store) et Android (Google Play). Vous pouvez également utiliser la plateforme directement depuis votre navigateur web sur mobile ou desktop."
            },
        ]
    },
    {
        category: 'Pour les Auto-mobs',
        icon: <User className="h-5 w-5" />,
        color: 'bg-emerald-500/10 text-emerald-500',
        questions: [
            {
                q: "Qui peut s'inscrire en tant qu'auto-mob ?",
                a: "Toute personne ayant le statut d'auto-entrepreneur (micro-entrepreneur) en France peut s'inscrire sur NettmobFrance. Vous devez disposer d'un numéro SIRET valide et actif pour compléter votre inscription."
            },
            {
                q: "Comment créer mon compte auto-mob ?",
                a: "L'inscription se fait en 3 étapes simples depuis la page d'accueil : 1) Cliquez sur « S'inscrire » et choisissez le profil Auto-entrepreneur. 2) Renseignez vos informations personnelles et votre SIRET. 3) Vérifiez votre adresse email. Une fois votre identité vérifiée par notre équipe, vous pourrez commencer à recevoir des missions."
            },
            {
                q: "Comment vais-je recevoir les offres de mission ?",
                a: "Vous recevrez des notifications par SMS dès qu'une mission correspondant à vos compétences et à votre zone géographique est disponible. Chaque SMS contient une photo et tous les détails de la mission. Vous pouvez accepter ou refuser directement depuis votre espace sur la plateforme ou via le lien dans le SMS."
            },
            {
                q: "Puis-je choisir mes missions ?",
                a: "Oui, vous êtes totalement libre d'accepter ou de refuser n'importe quelle mission proposée. Il n'y a aucune obligation d'accepter. Cependant, un taux de refus trop élevé peut impacter la fréquence des propositions que vous recevez."
            },
            {
                q: "Comment fonctionne le pointage des missions ?",
                a: "En début et en fin de mission, vous devez effectuer un pointage via la plateforme (QR Code ou géolocalisation selon le site). Ce pointage permet de valider les heures travaillées et de déclencher la facturation automatique."
            },
            {
                q: "Comment suis-je rémunéré ?",
                a: "Vos heures sont automatiquement calculées après validation du pointage. Vous recevez une facture générée automatiquement par la plateforme. Le paiement est effectué selon les délais convenus avec l'entreprise. Vous pouvez demander un retrait depuis votre tableau de bord une fois le solde disponible."
            },
            {
                q: "Que se passe-t-il si je refuse une mission après l'avoir acceptée ?",
                a: "Si vous annulez une mission acceptée, cela génère un signalement sur votre profil. Des annulations répétées peuvent entraîner une suspension temporaire de votre compte. Nous vous recommandons de n'accepter que les missions que vous êtes sûr de pouvoir honorer."
            },
        ]
    },
    {
        category: 'Pour les Entreprises',
        icon: <Building2 className="h-5 w-5" />,
        color: 'bg-purple-500/10 text-purple-500',
        questions: [
            {
                q: "Comment publier une mission ?",
                a: "Depuis votre tableau de bord entreprise, cliquez sur « Publier une mission ». Renseignez le type de mission, le secteur d'activité, la date, les horaires, le lieu et le taux horaire. Votre mission sera immédiatement diffusée aux auto-mobs disponibles correspondant à vos critères."
            },
            {
                q: "Quels secteurs d'activité sont couverts ?",
                a: "NettmobFrance couvre actuellement quatre secteurs principaux : Hôtellerie (accueil, service en chambre, conciergerie), Logistique Grande Surface (réassort, gestion de stocks), Logistique Entrepôt (manutention, picking, emballage) et Nettoyage (locaux professionnels, chantiers, hôtels)."
            },
            {
                q: "Comment sont sélectionnés les auto-mobs ?",
                a: "Tous les auto-mobs sur la plateforme sont vérifiés : identité, SIRET, expérience et éventuels documents professionnels. Vous pouvez consulter leurs profils, avis et évaluations avant de confirmer une mission. La plateforme vous propose automatiquement les profils les plus adaptés à votre besoin."
            },
            {
                q: "Est-il possible de bloquer ou de préférer certains prestataires ?",
                a: "Oui, depuis votre espace entreprise, vous pouvez marquer des prestataires comme favoris pour les retrouver en priorité lors de vos prochaines publications. Vous pouvez également signaler un profil à notre équipe."
            },
            {
                q: "Quel est le délai pour trouver un prestataire ?",
                a: "Dans la plupart des cas, vous trouverez un auto-mob disponible en moins de 24 heures. Pour les demandes urgentes, la plateforme envoie des notifications prioritaires aux prestataires disponibles dans votre zone immédiatement."
            },
            {
                q: "Comment sont gérées la facturation et les paiements ?",
                a: "NettmobFrance génère automatiquement les factures après validation des heures pointées. Vous recevrez un récapitulatif mensuel détaillé. Les paiements sont sécurisés et traçables via la plateforme. Un mandat de facturation vous est fourni lors de l'inscription."
            },
        ]
    },
    {
        category: 'Paiements & Facturation',
        icon: <CreditCard className="h-5 w-5" />,
        color: 'bg-orange-500/10 text-orange-500',
        questions: [
            {
                q: "L'inscription sur NettmobFrance est-elle gratuite ?",
                a: "L'inscription est totalement gratuite pour les auto-mobs. Pour les entreprises, des formules d'abonnement sont disponibles selon le volume de missions et les fonctionnalités souhaitées. Consultez notre page tarifs pour plus de détails."
            },
            {
                q: "Comment demander un retrait de mes gains ?",
                a: "Depuis votre tableau de bord, rendez-vous dans la section « Portefeuille » puis cliquez sur « Demande de retrait ». Renseignez le montant souhaité et vos coordonnées bancaires (RIB). Le virement est effectué dans un délai de 3 à 5 jours ouvrés."
            },
            {
                q: "Les factures sont-elles générées automatiquement ?",
                a: "Oui. Grâce au mandat de facturation signé à l'inscription, NettmobFrance génère automatiquement les factures en votre nom à l'issue de chaque mission validée. Vous n'avez rien à faire : les factures sont disponibles dans votre espace personnel."
            },
            {
                q: "Quels moyens de paiement sont acceptés ?",
                a: "Les entreprises peuvent régler leurs factures par virement bancaire. D'autres moyens de paiement seront progressivement ajoutés à la plateforme. Toutes les transactions sont sécurisées et chiffrées."
            },
        ]
    },
    {
        category: 'Sécurité & Vérification',
        icon: <ShieldCheck className="h-5 w-5" />,
        color: 'bg-red-500/10 text-red-500',
        questions: [
            {
                q: "Comment mes données personnelles sont-elles protégées ?",
                a: "NettmobFrance est conforme au RGPD (Règlement Général sur la Protection des Données). Vos données sont chiffrées, stockées de manière sécurisée et ne sont jamais revendues à des tiers. Vous pouvez à tout moment consulter, modifier ou supprimer vos données depuis votre compte."
            },
            {
                q: "Comment fonctionne la vérification d'identité ?",
                a: "Lors de l'inscription, il vous est demandé de fournir une pièce d'identité valide ainsi que votre numéro SIRET (pour les auto-mobs) ou votre numéro SIRET d'entreprise (pour les clients). Notre équipe vérifie manuellement chaque dossier dans un délai de 24 à 48 heures."
            },
            {
                q: "Que faire en cas de litige avec un prestataire ou une entreprise ?",
                a: "En cas de litige, vous pouvez contacter notre équipe support via la page contact ou depuis votre tableau de bord. Nous disposons d'un processus de médiation interne pour régler les différends rapidement et équitablement."
            },
            {
                q: "Mon compte peut-il être suspendu ?",
                a: "Oui, tout compte ne respectant pas les conditions générales d'utilisation (fausses informations, comportement inapproprié, annulations répétées) peut être suspendu temporairement ou définitivement. Vous serez notifié par email avec les raisons de la suspension et les éventuelles procédures de réactivation."
            },
        ]
    },
    {
        category: 'Application & Support',
        icon: <Smartphone className="h-5 w-5" />,
        color: 'bg-cyan-500/10 text-cyan-500',
        questions: [
            {
                q: "Comment contacter le support NettmobFrance ?",
                a: "Vous pouvez nous joindre par email à contact@nettmobfrance.fr, par téléphone au +33 7 66 39 09 92, ou via le formulaire de contact disponible sur la page /contact. Notre équipe est disponible du lundi au vendredi de 9h à 18h."
            },
            {
                q: "Comment activer les notifications push ?",
                a: "Lors de votre première connexion, la plateforme vous demandera l'autorisation d'envoyer des notifications. Acceptez pour être alerté en temps réel des nouvelles missions. Vous pouvez également activer/désactiver les notifications depuis les paramètres de votre compte."
            },
            {
                q: "J'ai oublié mon mot de passe, que faire ?",
                a: "Depuis la page de connexion, cliquez sur « Mot de passe oublié ». Entrez votre adresse email et vous recevrez un lien de réinitialisation valable 24 heures. Si vous ne recevez pas l'email, vérifiez vos spams ou contactez notre support."
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

const FAQ = () => {
    useDocumentTitle('FAQ Auto-Entrepreneur — NettmobFrance');
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
                            <HelpCircle className="h-4 w-4" />
                            Auto-Entrepreneur
                        </div>
                        <h1 className="text-5xl font-black uppercase tracking-tighter mb-4">
                            FAQ <span className="text-primary italic">Auto-Entrepreneur</span>
                        </h1>
                        <p className="text-lg text-muted-foreground font-medium max-w-xl mx-auto">
                            Retrouvez les réponses aux questions les plus courantes pour les auto-mobs sur NettmobFrance.
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

                    {/* Revolut Partnership Section */}
                    <RevolutPartnerSection />

                    {/* CTA Contact */}
                    <div className="mt-20 p-10 rounded-[3rem] bg-slate-900 text-white text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[80px] rounded-full -mr-32 -mt-32 opacity-60" />
                        <div className="relative z-10">
                            <h3 className="text-2xl font-black uppercase tracking-tighter mb-3">
                                Vous n'avez pas trouvé votre réponse ?
                            </h3>
                            <p className="text-slate-400 mb-6 font-medium">Notre équipe est là pour vous aider.</p>
                            <a
                                href="/contact"
                                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm uppercase tracking-widest px-8 py-3 rounded-xl transition-colors"
                            >
                                Nous contacter
                            </a>
                        </div>
                    </div>

                </div>
            </main>
            <Footer />
        </div>
    );
};

export default FAQ;
