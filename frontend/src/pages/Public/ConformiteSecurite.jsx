import Header from './components/Header';
import Footer from './components/Footer';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { ShieldCheck, Lock, CheckCircle2, AlertCircle, LayoutDashboard, Bell, FileSearch, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Section = ({ number, title, subtitle, children, variant = 'default' }) => {
    const styles = {
        default: 'bg-muted/20 border-border',
        primary: 'bg-primary/5 border-primary/10',
        dark: 'bg-slate-900 border-slate-800',
    };
    return (
        <section className={`rounded-[2rem] p-8 space-y-5 border ${styles[variant]}`}>
            <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-black text-sm shrink-0">{number}</div>
                <div>
                    <h2 className="text-xl font-black text-foreground uppercase tracking-tight">{title}</h2>
                    {subtitle && <p className="text-primary font-bold text-sm mt-0.5">{subtitle}</p>}
                </div>
            </div>
            {children}
        </section>
    );
};

const Li = ({ icon: Icon = CheckCircle2, children }) => (
    <li className="flex gap-3 text-muted-foreground">
        <Icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <span className="text-sm">{children}</span>
    </li>
);

const ConformiteSecurite = () => {
    useDocumentTitle('Conformité et Sécurité - NettmobFrance');
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <Header />
            <main className="pt-32 pb-20">
                <div className="container mx-auto px-4 max-w-4xl space-y-8">

                    {/* Title */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                            <ShieldCheck className="h-8 w-8" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black uppercase tracking-tighter">
                                Conformité et <span className="text-primary">Sécurité</span>
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">Nettmob France vous protège du travail dissimulé</p>
                        </div>
                    </div>

                    {/* Intro */}
                    <div className="bg-primary/5 border border-primary/10 rounded-[2rem] p-8">
                        <p className="text-muted-foreground leading-relaxed">
                            Le travail dissimulé représente un risque majeur pour les entreprises, avec des sanctions financières importantes et une atteinte potentielle à leur réputation. Chez Nettmob France, nous comprenons ces enjeux et nous nous engageons à garantir la conformité de tous les auto-entrepreneurs présents sur notre plateforme.
                        </p>
                    </div>

                    {/* Section 1 */}
                    <Section number="1" title="Vérification des documents" subtitle="La base de notre engagement">
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Chez Nettmob France, la vérification des documents est la première étape essentielle pour garantir la conformité des auto-entrepreneurs. Nous exigeons les documents suivants :
                        </p>
                        <ul className="space-y-3 list-none">
                            <Li><strong className="text-foreground">Pièce d'identité</strong> — Pour nous assurer de l'identité de chaque auto-entrepreneur.</Li>
                            <Li><strong className="text-foreground">Extrait K-bis (ou équivalent)</strong> — Pour vérifier l'existence légale de l'entreprise.</Li>
                            <Li><strong className="text-foreground">Attestation d'assurance RC professionnelle</strong> — Pour vous protéger en cas de dommages causés par l'auto-entrepreneur.</Li>
                            <Li><strong className="text-foreground">Attestation de vigilance URSSAF</strong> — Pour s'assurer qu'il est à jour de ses obligations sociales (vérifiée périodiquement).</Li>
                        </ul>
                        <div className="flex gap-3 p-4 bg-background rounded-xl border border-border text-sm text-muted-foreground">
                            <FileSearch className="h-5 w-5 text-primary shrink-0" />
                            <span>Notre équipe vérifie scrupuleusement l'authenticité de chaque document auprès des organismes compétents. Seuls des auto-entrepreneurs en règle peuvent rejoindre notre plateforme.</span>
                        </div>
                    </Section>

                    {/* Section 2 */}
                    <Section number="2" title="Contrôle des déclarations" subtitle="Un suivi rigoureux">
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Nous ne nous contentons pas de vérifier les documents à l'inscription. Nous assurons également un suivi rigoureux des déclarations des auto-entrepreneurs auprès de l'URSSAF.
                        </p>
                        <ul className="space-y-3 list-none">
                            <Li icon={CheckCircle2}><strong className="text-foreground">Rappels et outils</strong> — Nous mettons à leur disposition des rappels pour effectuer leurs déclarations dans les délais.</Li>
                            <Li icon={Bell}><strong className="text-foreground">Suivi</strong> — Nous suivons l'évolution de leurs déclarations et alertons en cas d'anomalie (CA non déclaré, cotisations impayées…).</Li>
                            <Li icon={Lock}><strong className="text-foreground">Suspension</strong> — En cas de manquement répété à leurs obligations, nous pouvons suspendre leur compte sur notre plateforme.</Li>
                        </ul>
                    </Section>

                    {/* Section 3 */}
                    <Section number="3" title="Suivi en temps réel" subtitle="Votre tableau de bord personnalisé">
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Avec Nettmob France, vous gardez le contrôle ! Notre tableau de bord vous permet de suivre en temps réel la situation administrative de chaque auto-entrepreneur avec lequel vous travaillez.
                        </p>
                        <div className="grid sm:grid-cols-3 gap-4">
                            {[
                                { icon: FileSearch, title: 'Accès aux documents', desc: 'Consultez à tout moment les documents vérifiés de chaque auto-entrepreneur.' },
                                { icon: LayoutDashboard, title: 'Suivi des déclarations', desc: "Suivez l'état de leurs déclarations auprès de l'URSSAF." },
                                { icon: Bell, title: 'Alertes personnalisées', desc: 'Recevez des alertes en cas de document expiré ou de déclaration manquante.' },
                            ].map(({ icon: Icon, title, desc }) => (
                                <div key={title} className="bg-background rounded-2xl p-4 border border-border space-y-2">
                                    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <p className="font-black text-xs uppercase tracking-tight text-foreground">{title}</p>
                                    <p className="text-xs text-muted-foreground">{desc}</p>
                                </div>
                            ))}
                        </div>
                    </Section>

                    {/* Section 4 - AXA */}
                    <Section number="4" title="Notre engagement" subtitle="Votre sérénité est notre priorité" variant="dark">
                        <p className="text-slate-300 text-sm leading-relaxed">
                            Chez Nettmob France, nous sommes convaincus que la conformité est un facteur clé de succès pour une collaboration sereine et durable. C'est pourquoi nous mettons tout en œuvre pour vous protéger contre les risques liés au travail dissimulé.
                        </p>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-20 bg-white rounded-lg flex items-center justify-center font-black italic text-[#00008F] text-lg">AXA</div>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Partenaire Officiel</span>
                            </div>
                            <p className="text-slate-300 text-sm leading-relaxed">
                                Nettmob France a souscrit une assurance <strong className="text-white">responsabilité civile professionnelle</strong> auprès de la compagnie <strong className="text-white">AXA FRANCE</strong>. Cette assurance couvre les dommages corporels, matériels et immatériels causés par les auto-entrepreneurs.
                            </p>
                            <div className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-tight">
                                <AlertCircle className="h-4 w-4" />
                                <span>Franchise de 2 000 € à la charge de l'auto-entrepreneur en cas de sinistre</span>
                            </div>
                        </div>
                        <p className="text-slate-400 text-sm">
                            Nous sommes à votre écoute pour répondre à toutes vos questions et vous accompagner dans votre démarche de mise en conformité.
                        </p>
                    </Section>

                    {/* CTA */}
                    <div className="text-center space-y-4 py-4">
                        <p className="text-lg font-black uppercase tracking-tight text-foreground">
                            N'attendez plus pour collaborer avec des auto-entrepreneurs en toute sécurité !
                        </p>
                        <p className="text-muted-foreground text-sm">Contactez-nous dès aujourd'hui pour en savoir plus sur Nettmob France.</p>
                        <button
                            onClick={() => navigate('/contact')}
                            className="inline-flex items-center gap-2 bg-primary text-white font-black uppercase tracking-tighter px-8 py-4 rounded-2xl hover:bg-primary/90 transition-colors"
                        >
                            <Phone className="h-4 w-4" />
                            Contactez-nous
                        </button>
                    </div>

                </div>
            </main>
            <Footer />
        </div>
    );
};

export default ConformiteSecurite;
