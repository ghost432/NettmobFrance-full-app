import { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import { Button } from '../../components/ui/button';
import {
    Mail,
    Phone,
    MapPin,
    Send,
    MessageSquare,
    Clock,
    User
} from 'lucide-react';
import axios from 'axios';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { toast } from '../../components/ui/toast';
import { useNavigate } from 'react-router-dom';

const ContactEntreprise = () => {
    useDocumentTitle('Contact Entreprise - NettmobFrance');
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        subject: '',
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
                subject: `[Entreprise${formData.company ? ` - ${formData.company}` : ''}] ${formData.subject}`,
                message: formData.message
            };
            await axios.post(`${API_URL}/contact`, submissionData);
            toast.success('Votre message a été envoyé avec succès ! Redirection...');
            setFormData({ firstName: '', lastName: '', email: '', phone: '', company: '', subject: '', message: '' });
            setTimeout(() => {
                navigate('/entreprise');
            }, 2000);
        } catch (error) {
            console.error('Error submitting contact form:', error);
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
                        src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1920"
                        alt="Contact Entreprise Background"
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <span className="inline-block bg-primary/20 text-primary border border-primary/30 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full mb-6">
                        Espace Entreprise
                    </span>
                    <h1 className="text-4xl lg:text-5xl font-black mb-6 uppercase tracking-tighter">
                        Contactez-<span className="text-primary">Nous</span>
                    </h1>
                    <p className="text-xl text-slate-300 max-w-2xl mx-auto font-medium">
                        Un projet d'externalisation ? Une question sur nos services entreprise ? Notre équipe dédiée est à votre disposition.
                    </p>
                </div>
            </section>

            <section className="py-24">
                <div className="container mx-auto px-4">
                    <div className="grid lg:grid-cols-2 gap-16">
                        {/* Contact Form */}
                        <div className="bg-muted/30 p-8 lg:p-12 rounded-[2.5rem] border border-border shadow-soft">
                            <h2 className="text-2xl font-black mb-8 uppercase tracking-tighter text-[#3A559F]">Envoyez un message</h2>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
                                            <User className="h-3 w-3" /> Prénom
                                        </Label>
                                        <Input
                                            required
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            className="h-14 rounded-2xl border-2 font-bold"
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
                                            className="h-14 rounded-2xl border-2 font-bold"
                                            placeholder="Dupont"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
                                            <Mail className="h-3 w-3" /> Email
                                        </Label>
                                        <Input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="h-14 rounded-2xl border-2 font-bold"
                                            placeholder="jean.dupont@entreprise.com"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
                                            <Phone className="h-3 w-3" /> Téléphone
                                        </Label>
                                        <Input
                                            type="tel"
                                            required
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="h-14 rounded-2xl border-2 font-bold"
                                            placeholder="07 45 22 80 10"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
                                        <User className="h-3 w-3" /> Nom de l'entreprise
                                    </Label>
                                    <Input
                                        value={formData.company}
                                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                        className="h-14 rounded-2xl border-2 font-bold"
                                        placeholder="Ma Société SAS"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
                                        <MessageSquare className="h-3 w-3" /> Sujet
                                    </Label>
                                    <Input
                                        required
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        className="h-14 rounded-2xl border-2 font-bold"
                                        placeholder="Demande de devis entreprise"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
                                        <Send className="h-3 w-3" /> Message
                                    </Label>
                                    <Textarea
                                        required
                                        rows="6"
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        className="rounded-2xl border-2 font-bold resize-none"
                                        placeholder="Décrivez votre besoin..."
                                    />
                                </div>
                                <Button
                                    disabled={loading}
                                    type="submit"
                                    size="lg"
                                    className="w-full h-16 text-lg font-black bg-primary rounded-2xl shadow-lg shadow-primary/20 uppercase tracking-tighter"
                                >
                                    {loading ? 'Envoi en cours...' : 'Envoyer le message'}
                                </Button>
                            </form>
                        </div>

                        {/* Contact Info & Map */}
                        <div className="space-y-12">
                            <div>
                                <h2 className="text-3xl font-black mb-12 uppercase tracking-tighter leading-none">
                                    Nos <span className="text-primary underline decoration-8 underline-offset-[12px]">coordonnées</span>
                                </h2>
                                <div className="grid gap-8">
                                    <div className="flex gap-4 p-6 rounded-3xl bg-muted/20 border border-border group hover:border-primary transition-colors">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                            <Phone className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1">Appelez-nous</div>
                                            <a href="tel:+33766390992" className="text-lg font-black hover:text-primary transition-colors">+33 7 66 39 09 92</a>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 p-6 rounded-3xl bg-muted/20 border border-border group hover:border-primary transition-colors">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                            <Mail className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1">Email</div>
                                            <a href="mailto:contact@nettmobfrance.fr" className="text-lg font-black hover:text-primary transition-colors">contact@nettmobfrance.fr</a>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 p-6 rounded-3xl bg-muted/20 border border-border group hover:border-primary transition-colors sm:col-span-2">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                            <MapPin className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1">Adresse</div>
                                            <div className="text-lg font-black">34 Av. des Champs-Élysées, 75008 Paris, France</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 p-6 rounded-3xl bg-muted/20 border border-border group hover:border-primary transition-colors sm:col-span-2">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                            <Clock className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1">Horaires</div>
                                            <div className="text-lg font-black">Lundi - Vendredi: 09:00 - 18:00</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Map */}
                            <div className="h-[400px] w-full rounded-[2.5rem] overflow-hidden border-4 border-muted shadow-soft relative bg-muted group">
                                <iframe
                                    src="https://www.openstreetmap.org/export/embed.html?bbox=2.3020815%2C48.8691388%2C2.3070815%2C48.8731388&layer=mapnik&marker=48.8711388%2C2.3045815"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                    title="Localisation NettmobFrance"
                                    className="relative z-10 grayscale hover:grayscale-0 transition-all duration-700"
                                ></iframe>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default ContactEntreprise;
