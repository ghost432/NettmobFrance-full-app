import Header from './components/Header';
import Footer from './components/Footer';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { Shield, Lock, Eye, UserCheck, Download, XCircle, Ban, FileWarning, Cookie, Server, RefreshCw } from 'lucide-react';

const Section = ({ title, children, variant = 'default' }) => {
    const styles = {
        default: 'bg-muted/20 border-border',
        primary: 'bg-primary/5 border-primary/10',
        dark: 'bg-slate-900 border-slate-800',
    };
    return (
        <section className={`rounded-[2rem] p-8 space-y-4 border ${styles[variant]}`}>
            {title && <h2 className="text-xl font-black uppercase tracking-tight text-foreground">{title}</h2>}
            {children}
        </section>
    );
};

const rights = [
    { icon: Eye, label: "Droit d'accès" },
    { icon: UserCheck, label: "Droit de rectification" },
    { icon: XCircle, label: "Droit à l'effacement" },
    { icon: Ban, label: "Droit d'opposition" },
    { icon: Download, label: "Droit à la portabilité" },
    { icon: FileWarning, label: "Réclamation CNIL" },
];

const RGPD = () => {
    useDocumentTitle('RGPD - NettmobFrance');

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <Header />
            <main className="pt-32 pb-20">
                <div className="container mx-auto px-4 max-w-4xl space-y-8">

                    {/* Title */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                            <Shield className="h-8 w-8" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black uppercase tracking-tighter">
                                Protection des <span className="text-primary">Données (RGPD)</span>
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">Politique de confidentialité — NettmobFrance</p>
                        </div>
                    </div>

                    {/* Intro */}
                    <Section variant="primary">
                        <p className="text-muted-foreground leading-relaxed">
                            Chez NettmobFrance, la protection de vos données personnelles est une priorité. Cette politique de confidentialité vous informe de manière claire sur la façon dont nous collectons, utilisons, stockons et protégeons vos données, conformément au <strong className="text-foreground">Règlement Général sur la Protection des Données (RGPD)</strong>.
                        </p>
                    </Section>

                    {/* 1. Qui sommes-nous */}
                    <Section title="1. Qui sommes-nous ?" variant="default">
                        <p className="text-muted-foreground leading-relaxed">
                            NettmobFrance est une plateforme de mise en relation entre auto-entrepreneurs et entreprises.
                        </p>
                        <div className="bg-background rounded-xl p-4 border border-border space-y-1 text-sm">
                            <p><strong className="text-foreground">Responsable du traitement :</strong> NettmobFrance</p>
                            <p><strong className="text-foreground">Email :</strong> <a href="mailto:contact@nettmobfrance.fr" className="text-primary hover:underline">contact@nettmobfrance.fr</a></p>
                            <p><strong className="text-foreground">Adresse :</strong> 34 Av. des Champs-Élysées, 75008 Paris, France</p>
                        </div>
                    </Section>

                    {/* 2. Données collectées */}
                    <Section title="2. Quelles données collectons-nous ?" variant="default">
                        <p className="text-muted-foreground text-sm">Nous collectons uniquement les données strictement nécessaires à l'utilisation de la plateforme :</p>
                        <ul className="space-y-2 list-disc pl-5 text-muted-foreground text-sm">
                            <li><strong className="text-foreground">Données d'identification :</strong> nom, prénom, adresse e-mail, numéro de téléphone</li>
                            <li><strong className="text-foreground">Informations professionnelles :</strong> statut, domaine d'activité, expérience, disponibilités</li>
                            <li><strong className="text-foreground">Données de connexion :</strong> adresse IP, type de terminal, logs de connexion</li>
                            <li><strong className="text-foreground">Messages et échanges</strong> avec le support ou entre utilisateurs</li>
                        </ul>
                    </Section>

                    {/* 3. Finalités */}
                    <Section title="3. Pourquoi collectons-nous ces données ?" variant="default">
                        <ul className="space-y-2 list-disc pl-5 text-muted-foreground text-sm">
                            <li>Création et gestion de votre compte utilisateur</li>
                            <li>Mise en relation avec des missions correspondant à votre profil</li>
                            <li>Gestion des communications (emails, notifications, WhatsApp, Telegram…)</li>
                            <li>Amélioration de la plateforme et de l'expérience utilisateur</li>
                            <li>Réponse à vos demandes d'assistance</li>
                            <li>Respect des obligations légales</li>
                        </ul>
                    </Section>

                    {/* 4. Conservation */}
                    <Section title="4. Durée de conservation" variant="default">
                        <p className="text-muted-foreground leading-relaxed">
                            Vos données sont conservées pendant toute la durée d'utilisation de votre compte, et jusqu'à <strong className="text-foreground">3 ans après la dernière activité</strong>, sauf obligation légale contraire.
                        </p>
                    </Section>

                    {/* 5. Accès aux données */}
                    <Section title="5. Qui a accès à vos données ?" variant="default">
                        <p className="text-muted-foreground leading-relaxed">
                            Seules les personnes habilitées de l'équipe NettmobFrance peuvent accéder à vos données. <strong className="text-foreground">Nous ne vendons, ni ne louons aucune donnée personnelle à des tiers.</strong>
                        </p>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Des prestataires techniques (hébergement, emailing, support, analytics) peuvent accéder aux données strictement nécessaires à leurs services, dans un cadre contractuel sécurisé.
                        </p>
                    </Section>

                    {/* 6. Vos droits */}
                    <Section title="6. Vos droits" variant="primary">
                        <p className="text-muted-foreground text-sm">Conformément au RGPD, vous disposez des droits suivants :</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {rights.map(({ icon: Icon, label }) => (
                                <div key={label} className="flex flex-col items-center gap-2 p-4 bg-background rounded-2xl border border-border text-center">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-tight text-foreground">{label}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Pour exercer vos droits, contactez-nous à : <a href="mailto:contact@nettmobfrance.fr" className="text-primary hover:underline font-bold">contact@nettmobfrance.fr</a>
                        </p>
                    </Section>

                    {/* 7. Cookies */}
                    <Section title="7. Cookies et traceurs" variant="default">
                        <div className="flex gap-3">
                            <Cookie className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Notre site peut utiliser des cookies à des fins de mesure d'audience, de sécurité ou de personnalisation de l'expérience. Vous pouvez les accepter ou refuser via notre bandeau de consentement.
                            </p>
                        </div>
                    </Section>

                    {/* 8. Sécurité */}
                    <Section title="8. Sécurité des données" variant="dark">
                        <div className="flex gap-3">
                            <Server className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <p className="text-slate-300 text-sm leading-relaxed">
                                Nous mettons en œuvre toutes les mesures techniques et organisationnelles appropriées pour protéger vos données contre toute perte, vol, divulgation ou accès non autorisé.
                            </p>
                        </div>
                    </Section>

                    {/* 9. Modifications */}
                    <Section title="9. Modification de la politique" variant="default">
                        <div className="flex gap-3">
                            <RefreshCw className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Cette politique peut être mise à jour à tout moment. Vous serez informé(e) en cas de modification importante.
                            </p>
                        </div>
                    </Section>

                </div>
            </main>
            <Footer />
        </div>
    );
};

export default RGPD;
