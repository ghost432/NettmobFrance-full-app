import Header from './components/Header';
import Footer from './components/Footer';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { FileSignature, Receipt, CheckCircle2, AlertCircle } from 'lucide-react';

const MandatFacturation = () => {
    useDocumentTitle('Mandat de Facturation - NettmobFrance');

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <Header />
            <main className="pt-32 pb-20">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary font-black uppercase tracking-tighter">
                            <FileSignature className="h-8 w-8" />
                        </div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter">Mandat de <span className="text-primary">Facturation</span></h1>
                    </div>

                    <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-muted-foreground font-medium leading-relaxed">
                        <section className="bg-muted/30 p-8 rounded-[2rem] border border-border">
                            <p className="text-foreground">
                                Comme il en a été prévu dans les conditions générales d’utilisation du site Nettmob, pour s’inscrire en tant
                                qu’auto-entrepreneur sur la plateforme, il est nécessaire d’accepter ce mandat de facturation. Ce mandat de
                                facturation a pour but de faciliter la gestion de la facturation pour l’auto-entrepreneur et les entreprises
                                clientes. Par ce présent contrat, l’auto-entrepreneur accepte que la société Nettmob Holding LTD immatriculée au Registre du Commerce et des Sociétés de Londres sous le numéro
                                12689739 dont le siège social est situé à 3rd floor 207 Regent Street W1B 3HH LONDON United Kingdom,
                                établisse les factures en son nom et pour son compte, pour toutes les prestations de services réalisées par le
                                biais du site Nettmob.
                            </p>
                        </section>

                        <section className="space-y-4 bg-muted/30 p-8 rounded-[2rem] border border-border">
                            <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">I/ Objet du mandat</h2>
                            <p>
                                Par ce contrat l’auto-entrepreneur donne mandat au mandataire qui l’accepte, d’établir ses factures issues
                                de prestations de services réalisées par l’intermédiaire de Nettmob, en son nom et pour son compte.
                                Ce mandat est établit conformément à l’articles 242 nonies, I et 289, I-2 du code général des impôts, ainsi
                                qu’à celle de l’instruction fiscale du 7 août 2003.
                            </p>
                        </section>

                        <section className="space-y-4 bg-primary/5 p-8 rounded-[2rem] border border-primary/10">
                            <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">II/ Durée du mandat</h2>
                            <p>
                                Le présent mandat est conclu pour une durée indéterminée. Celui-ci prend effet dès son acceptation soit lors
                                de la finalisation de son inscription sur la plateforme Nettmob. Ce mandat peut être révoqué à tout moment par le mandant et ceux sans motif. Pour être révoqué le mandant doit en faire le souhait adressé par lettre recommandé avec accusé de réception à l’adresse du mandataire. La révocation du mandat prend dans ce cas effet au moment de la réception de la lettre.
                            </p>
                            <div className="flex gap-3 p-4 bg-background rounded-xl border border-border mt-4">
                                <AlertCircle className="h-5 w-5 text-primary shrink-0" />
                                <p className="text-sm">
                                    Il est important de rappeler que l’acceptation du présent mandat de facturation est une des conditions, présentes dans les conditions générales d’utilisations du site Nettmob. De ce fait la révocation de ce mandat entrainera la fermeture du compte de l’auto-entrepreneur sur la plateforme Nettmob.
                                </p>
                            </div>
                        </section>

                        <section className="space-y-4 bg-muted/30 p-8 rounded-[2rem] border border-border">
                            <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">III/ Obligations du mandataire</h2>
                            <p>
                                Après réception du relevé d’intervention validé par le Client, le mandataire s’engage à établir les factures
                                dans un délai de 8 jours. Ces factures comporteront la mention « facture établie au nom et pour le compte « Nom de l’autoentrepreneur », afin d’éviter toute confusion. D’autre part un double des factures émises seront transmises à l’auto-entrepreneur.
                            </p>
                        </section>

                        <section className="space-y-4 p-8 border border-border bg-muted/20 rounded-[2rem]">
                            <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">IV/ Obligations du mandant</h2>
                            <p>Comme prévu dans les conditions générales d’utilisation, l’auto-entrepreneur s’engage à transmettre au mandataire :</p>
                            <ul className="space-y-3 list-none pl-0">
                                <li className="flex gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                                    <span>un relevé d’intervention validé par le client, suite à ses prestations de services réalisées par l’intermédiaire de Nettmob.</span>
                                </li>
                                <li className="flex gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                                    <span>des informations exactes à propos de son auto-entreprise et notamment son numéro d’identification SIRET.</span>
                                </li>
                                <li className="flex gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                                    <span>Informer le mandataire de toute modification relative à son auto-entreprise.</span>
                                </li>
                            </ul>
                            <p className="mt-4">
                                Le fait de transmettre ce relevé et ces informations va permettre au mandataire d’établir la facturation. Un
                                double des facturations sont envoyées au mandant. Le mandant dispose d’un délai de 3 jours pour contester
                                et demander une rectification des mentions inscrites dans les factures établies en son nom et pour son compte.
                                La contestation doit se faire à l’adresse suivante : <a href="mailto:contact@nettmobfrance.fr" className="text-primary hover:underline">contact@nettmobfrance.fr</a>
                            </p>
                        </section>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default MandatFacturation;
