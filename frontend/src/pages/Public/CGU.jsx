import Header from './components/Header';
import Footer from './components/Footer';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { Scale, AlertCircle, CheckCircle2, Info } from 'lucide-react';

const Section = ({ title, children, variant = 'default' }) => {
    const base = "rounded-[2rem] p-8 space-y-4 border";
    const styles = {
        default: `${base} bg-muted/20 border-border`,
        primary: `${base} bg-primary/5 border-primary/10`,
        dark: `${base} bg-slate-900 text-white border-slate-800`,
        warning: `${base} bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800`,
    };
    return (
        <section className={styles[variant]}>
            {title && <h2 className="text-xl font-black uppercase tracking-tight text-foreground">{title}</h2>}
            {children}
        </section>
    );
};

const Li = ({ children }) => (
    <li className="flex gap-3 text-muted-foreground">
        <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <span>{children}</span>
    </li>
);

const CGU = () => {
    useDocumentTitle('CGU & CGV - NettmobFrance');

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />
            <main className="pt-32 pb-20">
                <div className="container mx-auto px-4 max-w-4xl space-y-8">
                    {/* Title */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                            <Scale className="h-8 w-8" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black uppercase tracking-tighter">
                                CGU / CGV & <span className="text-primary">Politique de confidentialité</span>
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">Conditions générales d'utilisation et de vente</p>
                        </div>
                    </div>

                    {/* Mentions légales */}
                    <Section title="Mentions légales" variant="dark">
                        <p className="text-slate-300 leading-relaxed">
                            Le présent site est la propriété de <strong className="text-white">Nettmob Holding LTD</strong>, immatriculée au RCS de LONDRES sous le n° <strong className="text-white">12689739</strong>, dont le siège social est situé 3rd floor 207 Regent Street W1B 3HH LONDON United Kingdom.
                        </p>
                        <p className="text-slate-300 leading-relaxed">
                            <strong className="text-white">Raymond SALAZAR</strong> est le représentant de l'entreprise. Il agit également en qualité de directeur de la publication et responsable de la rédaction.
                        </p>
                        <p className="text-slate-300 leading-relaxed">
                            Nettmob Holding LTD est joignable par mail : <a href="mailto:contact@nettmobfrance.fr" className="text-primary hover:underline">contact@nettmobfrance.fr</a>.
                        </p>
                        <p className="text-slate-300 leading-relaxed">
                            Le site Nettmobfrance.fr est hébergé chez <strong className="text-white">1&1 IONOS SARL</strong> situé 7 Place de la Gare, 57200 Sarreguemines. SIRET hébergeur : 431 303 775 00016 — Tél : 09 70 80 89 11.
                        </p>
                    </Section>

                    {/* Introduction */}
                    <Section title="Introduction" variant="primary">
                        <p className="text-muted-foreground leading-relaxed">
                            Les présentes conditions générales d'utilisation (dites « CGU ») ont pour objet l'encadrement juridique des relations entre le site Nettmobfrance.fr et ses utilisateurs. Elles définissent les conditions d'accès et d'utilisation des services par « l'Utilisateur ».
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                            Les CGU doivent être acceptées par tout Utilisateur souhaitant accéder au site. Toute inscription implique l'acceptation sans réserve des présentes CGU. Nettmobfrance.fr se réserve le droit de modifier unilatéralement ces CGU à tout moment ; l'utilisateur en sera informé et son consentement redemandé.
                        </p>
                    </Section>

                    {/* Article 1 */}
                    <Section title="Article 1 : Définitions" variant="default">
                        <ul className="space-y-3 list-none pl-0">
                            <li><strong className="text-foreground">Utilisateur :</strong> Un Client ou un Auto-entrepreneur.</li>
                            <li><strong className="text-foreground">Client :</strong> Personne physique ou morale utilisant la plateforme à des fins professionnelles pour être mis en relation avec un auto-entrepreneur.</li>
                            <li><strong className="text-foreground">Auto-entrepreneur :</strong> Personne physique immatriculée sous statut d'auto-entrepreneur (SIRET), proposant ses services sur la plateforme.</li>
                            <li><strong className="text-foreground">Prestation de services :</strong> Mission qu'un Client confie à un auto-entrepreneur.</li>
                            <li><strong className="text-foreground">Mandat de Facturation :</strong> Contrat par lequel l'auto-entrepreneur confie à Nettmob Holding LTD l'établissement des factures en son nom.</li>
                            <li><strong className="text-foreground">STRIPE :</strong> Prestataire bancaire sécurisé via lequel les transactions sont établies sur le site.</li>
                        </ul>
                    </Section>

                    {/* Article 2 */}
                    <Section title="Article 2 : Accès au site" variant="default">
                        <p className="text-muted-foreground leading-relaxed">
                            Le site est accessible gratuitement à tout Utilisateur disposant d'un accès Internet. L'inscription est obligatoire pour accéder aux fonctionnalités. L'Utilisateur s'engage à fournir des informations exactes lors de l'inscription (SIRET, email, numéro mobile, etc.) et à les maintenir à jour.
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                            Les identifiants de connexion sont strictement personnels et confidentiels. Pour toute désinscription : <a href="mailto:contact@nettmobfrance.fr" className="text-primary hover:underline">contact@nettmobfrance.fr</a>.
                        </p>
                        <div className="flex gap-3 p-4 bg-background rounded-xl border border-border">
                            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                            <p className="text-sm text-muted-foreground">
                                En cas de non-respect des CGU, Nettmobfrance.fr se réserve le droit de suspendre ou fermer le compte après mise en demeure électronique restée sans effet.
                            </p>
                        </div>
                    </Section>

                    {/* Article 3 */}
                    <Section title="Article 3 : Données personnelles" variant="primary">
                        <p className="text-muted-foreground leading-relaxed">
                            Le site assure une collecte et un traitement d'informations personnelles conformément à la loi n°78-17 du 6 janvier 1978.
                        </p>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-background rounded-xl p-4 border border-border">
                                <h3 className="font-black text-sm uppercase text-foreground mb-3">Données Clients</h3>
                                <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-4">
                                    <li>Dénomination sociale</li>
                                    <li>Numéro de SIRET</li>
                                    <li>Email & numéro mobile</li>
                                    <li>Détails des missions proposées</li>
                                </ul>
                            </div>
                            <div className="bg-background rounded-xl p-4 border border-border">
                                <h3 className="font-black text-sm uppercase text-foreground mb-3">Données Auto-entrepreneurs</h3>
                                <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-4">
                                    <li>Nom & prénom</li>
                                    <li>Email & numéro mobile</li>
                                    <li>Code postal & SIRET</li>
                                    <li>Secteur & expériences</li>
                                </ul>
                            </div>
                        </div>
                        <p className="text-muted-foreground leading-relaxed text-sm">
                            Les données bancaires sont exclusivement gérées par <strong>STRIPE</strong>. Nettmob Holding LTD n'en conserve aucune. Conformément à la loi Informatique et Libertés, vous disposez d'un droit d'accès, de rectification, de suppression et d'opposition en contactant : <a href="mailto:contact@nettmobfrance.fr" className="text-primary hover:underline">contact@nettmobfrance.fr</a>. Les données sont supprimées après 3 ans d'inactivité du compte.
                        </p>
                        <div className="flex gap-3 p-4 bg-background rounded-xl border border-border">
                            <Info className="h-5 w-5 text-primary shrink-0" />
                            <p className="text-sm text-muted-foreground">L'utilisateur dispose du droit de déclencher une réclamation auprès de la <strong>CNIL</strong>.</p>
                        </div>
                    </Section>

                    {/* Article 4 */}
                    <Section title="Article 4 : Propriété intellectuelle" variant="default">
                        <p className="text-muted-foreground leading-relaxed">
                            Les marques, logos et contenus du site sont protégés par le Code de la propriété intellectuelle. Toute reproduction, publication ou copie est soumise à autorisation préalable. Toute représentation non autorisée constitue une contrefaçon sanctionnée par l'article L 335-2 du Code de la propriété intellectuelle.
                        </p>
                    </Section>

                    {/* Article 5 */}
                    <Section title="Article 5 : Responsabilité" variant="default">
                        <p className="text-muted-foreground leading-relaxed">
                            Nettmob Holding LTD ne garantit aucune obligation de résultat sur les recherches. Le site ne peut être tenu responsable de virus ou de faits dus à un cas de force majeure. Nettmob Holding LTD a souscrit une <strong className="text-foreground">assurance responsabilité civile professionnelle auprès d'AXA FRANCE</strong> couvrant les dommages corporels et matériels causés par les auto-entrepreneurs (franchise de 2 000 € à la charge de l'auto-entrepreneur).
                        </p>
                        <div className="space-y-4">
                            <div className="bg-background rounded-xl p-4 border border-border">
                                <h3 className="font-black text-sm uppercase text-foreground mb-2">5.1 : Responsabilité de l'utilisateur</h3>
                                <p className="text-sm text-muted-foreground">L'Utilisateur s'engage à respecter les lois en vigueur et à utiliser la plateforme avec loyauté. Tout contournement des services (collaboration directe hors plateforme) expose l'utilisateur à une indemnité forfaitaire de 500 € par utilisateur concerné. L'utilisation de la plateforme à des fins concurrentielles ou de recrutement est formellement interdite.</p>
                            </div>
                            <div className="bg-background rounded-xl p-4 border border-border">
                                <h3 className="font-black text-sm uppercase text-foreground mb-2">5.2 : Responsabilité du client</h3>
                                <p className="text-sm text-muted-foreground">Le Client s'engage, en cas d'annulation d'une offre acceptée, à verser un montant forfaitaire de <strong>50 € HT</strong> correspondant aux frais de traitement. Ce montant sera prélevé via Stripe. Tout démarchage commercial est interdit.</p>
                            </div>
                            <div className="bg-background rounded-xl p-4 border border-border">
                                <h3 className="font-black text-sm uppercase text-foreground mb-2">5.3 : Responsabilité de l'auto-entrepreneur</h3>
                                <p className="text-sm text-muted-foreground">L'auto-entrepreneur reconnaît que les services de Nettmob ne se substituent pas à ses propres démarches. Il s'engage à informer Nettmob de tout changement de statut (cessation, changement de SIRET, transformation en société).</p>
                            </div>
                        </div>
                    </Section>

                    {/* Article 6 */}
                    <Section title="Article 6 : Cookies" variant="default">
                        <p className="text-muted-foreground leading-relaxed">
                            L'Utilisateur est informé que lors de ses visites sur le site, un cookie peut s'installer avec son accord. Les cookies sont de petits fichiers anonymisés nécessaires au bon fonctionnement du site. Ils permettent notamment de mémoriser vos identifiants et d'analyser la navigation pour améliorer l'expérience.
                        </p>
                        <ul className="space-y-2">
                            <Li>Mémoriser les identifiants de connexion entre les pages.</Li>
                            <Li>Assurer la réactivité des services.</Li>
                            <Li>Analyser la navigation de manière anonymisée.</Li>
                        </ul>
                        <p className="text-sm text-muted-foreground">
                            L'Utilisateur peut désactiver les cookies via les paramètres de son navigateur. À défaut d'acceptation, certaines fonctionnalités pourraient être indisponibles.
                        </p>
                    </Section>

                    {/* Article 7 */}
                    <Section title="Article 7 : Services proposés" variant="primary">
                        <p className="text-muted-foreground leading-relaxed">
                            Nettmobfrance.fr met en relation des auto-entrepreneurs et des Clients. Le Client poste une offre de prestation, la plateforme la propose aux auto-entrepreneurs les plus adaptés. L'offre est conclue avec le premier auto-entrepreneur à l'accepter, formant un contrat tacite.
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                            Une fois la prestation réalisée, l'auto-entrepreneur saisit ses heures dans un délai de <strong className="text-foreground">3 jours</strong>. Le Client valide dans un délai de <strong className="text-foreground">7 jours</strong> (validation automatique à l'issue). Les évaluations mutuelles sont publiées sur les profils.
                        </p>
                        <ul className="space-y-2">
                            <Li>Vérification des compétences et du statut des auto-entrepreneurs.</Li>
                            <Li>Paiements sécurisés via Stripe.</Li>
                            <Li>Notifications email et SMS pour les nouvelles missions.</Li>
                            <Li>Facturation en autopilote via le mandat de facturation.</Li>
                        </ul>
                    </Section>

                    {/* Article 8 - Paiement */}
                    <Section title="Article 8 : Paiement" variant="default">
                        <p className="text-muted-foreground leading-relaxed">
                            Les services sont <strong className="text-foreground">gratuits pour les auto-entrepreneurs</strong>. Pour les Clients, une <strong className="text-foreground">commission de 20%</strong> est appliquée sur la valeur des prestations. Les tarifs sont exprimés en euros HT.
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                            Nettmob Holding LTD établit deux factures : une au nom de l'auto-entrepreneur et une pour sa propre commission. Les règlements s'effectuent via Stripe par prélèvement automatique ou mandat SEPA.
                        </p>
                    </Section>

                    {/* Article 9 - Litiges */}
                    <Section title="Article 9 : Litiges" variant="warning">
                        <p className="text-muted-foreground leading-relaxed">
                            Nettmob Holding LTD est uniquement une plateforme de mise en relation et n'est pas tenue responsable des désaccords entre Clients et Auto-entrepreneurs. Elle peut toutefois proposer, après tentative d'accord amiable, la nomination d'un expert neutre. Les honoraires de cet expert sont à la charge des parties.
                        </p>
                    </Section>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default CGU;
