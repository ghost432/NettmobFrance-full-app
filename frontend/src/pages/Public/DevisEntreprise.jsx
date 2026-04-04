import { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import { Button } from '../../components/ui/button';
import {
    Briefcase,
    Building2,
    Users2,
    CheckCircle2,
    ArrowRight,
    MessageSquare,
    Mail,
    Phone,
    User
} from 'lucide-react';
import axios from 'axios';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { toast } from '../../components/ui/toast';
import { useNavigate } from 'react-router-dom';

const DevisEntreprise = () => {
    useDocumentTitle('Demande de Devis - NettmobFrance');
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        secteur: '',
        volume: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const submissionData = {
                name: `${formData.firstName} ${formData.lastName}`,
                email: formData.email,
                phone: formData.phone,
                company: formData.company,
                secteur: formData.secteur,
                volume: formData.volume,
                message: formData.message
            };
            await axios.post(`${API_URL}/devis-entreprise`, submissionData);
            toast.success('Votre demande de devis a été envoyée avec succès ! Un conseiller vous contactera sous 24h.');
            setFormData({ firstName: '', lastName: '', email: '', phone: '', company: '', secteur: '', volume: '', message: '' });
            setTimeout(() => {
                navigate('/entreprise');
            }, 3000);
        } catch (error) {
            console.error('Error submitting devis form:', error);
            toast.error(error.response?.data?.error || 'Une erreur est survenue. Veuillez réessayer plus tard.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <Header />

            {/* Hero Section */}
            <section className="relative pt-40 pb-20 lg:pt-56 lg:pb-32 overflow-hidden bg-slate-900 text-white">
                <div className="absolute inset-0 z-0 opacity-20">
                    <img
                        src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=1920"
                        alt="Devis Entreprise Background"
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent z-10"></div>

                <div className="container mx-auto px-4 relative z-20 text-center">
                    <span className="inline-flex items-center gap-2 bg-primary/20 text-primary border border-primary/30 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full mb-6 relative">
                        <CheckCircle2 className="h-4 w-4" /> Devis Sur-Mesure
                    </span>
                    <h1 className="text-4xl lg:text-6xl font-black mb-6 uppercase tracking-tighter leading-none">
                        Parlez-nous de <span className="text-primary mt-2 block">votre projet</span>
                    </h1>
                    <p className="text-xl text-slate-300 max-w-2xl mx-auto font-medium">
                        Logistique, Nettoyage ou Hôtellerie : obtenez une proposition tarifaire abordable et adaptée à vos volumes en moins de 24 heures.
                    </p>
                </div>
            </section>

            <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">

                        {/* Highlights */}
                        <div className="grid md:grid-cols-3 gap-6 mb-16">
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-border text-center shadow-soft">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
                                    <MessageSquare className="h-6 w-6" />
                                </div>
                                <h3 className="font-black uppercase tracking-tight text-sm mb-2">Réponse en 24h</h3>
                                <p className="text-xs text-muted-foreground">Un expert analyse votre demande et vous propose une solution ciblée.</p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-border text-center shadow-soft">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
                                    <Briefcase className="h-6 w-6" />
                                </div>
                                <h3 className="font-black uppercase tracking-tight text-sm mb-2">Tarifs Dégressifs</h3>
                                <p className="text-xs text-muted-foreground">Profitez de réductions importantes pour un volume d'heures élevé.</p>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-border text-center shadow-soft">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
                                    <Users2 className="h-6 w-6" />
                                </div>
                                <h3 className="font-black uppercase tracking-tight text-sm mb-2">Équipe Dédiée</h3>
                                <p className="text-xs text-muted-foreground">Un gestionnaire de compte unique pour suivre toutes vos opérations.</p>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="bg-white dark:bg-slate-800 p-8 lg:p-12 rounded-[2.5rem] border border-border shadow-soft relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none"></div>

                            <h2 className="text-2xl font-black mb-8 uppercase tracking-tighter text-foreground flex items-center gap-3">
                                <Building2 className="h-6 w-6 text-primary" /> Formulons ensemble votre devis
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                                {/* Informations de contact */}
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-primary border-b border-border pb-2">Informations de contact</h3>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
                                                <User className="h-3 w-3" /> Prénom
                                            </Label>
                                            <Input
                                                required
                                                value={formData.firstName}
                                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                className="h-14 rounded-2xl border-2 font-bold bg-muted/20"
                                                placeholder="Jean"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
                                                <User className="h-3 w-3" /> Nom
                                            </Label>
                                            <Input
                                                required
                                                value={formData.lastName}
                                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                className="h-14 rounded-2xl border-2 font-bold bg-muted/20"
                                                placeholder="Dupont"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
                                                <Mail className="h-3 w-3" /> Email Pro
                                            </Label>
                                            <Input
                                                type="email"
                                                required
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="h-14 rounded-2xl border-2 font-bold bg-muted/20"
                                                placeholder="jean.dupont@entreprise.com"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
                                                <Phone className="h-3 w-3" /> Téléphone Direct
                                            </Label>
                                            <Input
                                                type="tel"
                                                required
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="h-14 rounded-2xl border-2 font-bold bg-muted/20"
                                                placeholder="07 45 22 80 10"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
                                            <Building2 className="h-3 w-3" /> Nom de l'entreprise
                                        </Label>
                                        <Input
                                            required
                                            value={formData.company}
                                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                            className="h-14 rounded-2xl border-2 font-bold bg-muted/20"
                                            placeholder="Ma Société SAS"
                                        />
                                    </div>
                                </div>

                                {/* Détails du besoin */}
                                <div className="space-y-6 pt-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-primary border-b border-border pb-2">Détails de votre besoin</h3>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
                                                Secteur d'activité principal
                                            </Label>
                                            <select
                                                required
                                                value={formData.secteur}
                                                onChange={(e) => setFormData({ ...formData, secteur: e.target.value })}
                                                className="flex h-14 w-full items-center justify-between rounded-2xl border-2 border-input bg-muted/20 px-3 py-2 font-bold text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <option value="" disabled>Sélectionnez un secteur...</option>
                                                <option value="Logistique Entrepôt">Logistique Entrepôt</option>
                                                <option value="Logistique Grande Surface">Logistique Grande Surface</option>
                                                <option value="Nettoyage et Propreté">Nettoyage et Propreté</option>
                                                <option value="Hôtellerie">Hôtellerie</option>
                                                <option value="Autre">Autre</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
                                                Volume estimé par mois
                                            </Label>
                                            <select
                                                required
                                                value={formData.volume}
                                                onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                                                className="flex h-14 w-full items-center justify-between rounded-2xl border-2 border-input bg-muted/20 px-3 py-2 font-bold text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <option value="" disabled>Sélectionnez un volume...</option>
                                                <option value="Moins de 10 missions">Moins de 10 missions / mois (Occasionnel)</option>
                                                <option value="De 10 à 50 missions">De 10 à 50 missions / mois (Régulier)</option>
                                                <option value="Plus de 50 missions">Plus de 50 missions / mois (Intensif)</option>
                                                <option value="Je ne sais pas encore">Je ne sais pas encore</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
                                            Description de vos attentes (Types de postes, horaires, villes...)
                                        </Label>
                                        <Textarea
                                            required
                                            rows="5"
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            className="rounded-2xl border-2 font-bold resize-none bg-muted/20 p-4"
                                            placeholder="Ex: Nous aurions besoin de 5 préparateurs de commandes les week-ends sur notre site de Lyon..."
                                        />
                                    </div>
                                </div>

                                <Button
                                    disabled={loading}
                                    type="submit"
                                    size="lg"
                                    className="w-full h-16 text-lg font-black bg-[#a31a4d] text-white rounded-2xl shadow-lg uppercase tracking-tighter hover:scale-[1.02] hover:bg-[#a31a4d]/90 transition-all"
                                >
                                    {loading ? 'Envoi en cours...' : 'Envoyer ma demande de devis'}
                                </Button>
                                <p className="text-center text-xs text-muted-foreground mt-4 font-medium">
                                    Vos données sont sécurisées et ne seront jamais partagées avec des tiers.
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default DevisEntreprise;
