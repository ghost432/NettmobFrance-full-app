import { useNavigate } from 'react-router-dom';
import { Logo } from '../../../components/Logo';
import {
    Mail,
    Phone,
    MapPin,
    Facebook,
    Linkedin,
    Instagram,
    Youtube,
    Send,
    MessageCircle,
    Music,
    ArrowRight
} from 'lucide-react';

const Footer = () => {
    const navigate = useNavigate();

    return (
        <footer className="bg-[#0F172A] text-white pt-24 pb-12 transition-colors duration-300 mx-4 mb-4 rounded-[20px] overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
                    {/* Brand & Social */}
                    <div className="space-y-8">
                        <div>
                            <div className="flex items-center gap-4 mb-6">
                                <Logo className="h-10 w-auto" />
                            </div>
                            <p className="text-slate-400 leading-relaxed max-w-sm">
                                Plateforme de mise en relation de référence pour les professionnels du nettoyage et de la logistique à travers toute la France.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2.5">
                            <a href="https://www.facebook.com/nettmobholdingltd/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-primary hover:border-primary transition-all group">
                                <Facebook className="h-4 w-4 group-hover:scale-110 transition-transform" />
                            </a>
                            <a href="https://fr.linkedin.com/company/nettmob-france" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-primary hover:border-primary transition-all group">
                                <Linkedin className="h-4 w-4 group-hover:scale-110 transition-transform" />
                            </a>
                            <a href="https://www.instagram.com/nett.mobfrance/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-primary hover:border-primary transition-all group">
                                <Instagram className="h-4 w-4 group-hover:scale-110 transition-transform" />
                            </a>
                            <a href="https://whatsapp.com/channel/0029Vb6NDjLBlHpU65Tymy3t" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-primary hover:border-primary transition-all group">
                                <svg className="h-4 w-4 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.67-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.004c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                </svg>
                            </a>
                            <a href="https://t.me/+a2pM28YK1opiZTVk" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-primary hover:border-primary transition-all group">
                                <Send className="h-4 w-4 group-hover:scale-110 transition-transform" />
                            </a>
                            <a href="https://www.tiktok.com/@nettmobfrance" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-primary hover:border-primary transition-all group">
                                <svg className="h-4 w-4 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                    <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.03-2.86-.31-4.13-1.03-2.28-1.29-3.67-3.91-3.32-6.49.15-1.17.6-2.35 1.35-3.29 1.34-1.68 3.54-2.63 5.74-2.42V10.1c-1.24-.15-2.52.14-3.55.82-1.03.68-1.74 1.85-1.84 3.09-.13 1.61.76 3.19 2.19 3.91 1.07.54 2.39.63 3.5.14 1.21-.52 1.9-1.68 2.1-2.98.03-2.93.02-5.86.02-8.79-.01-2.13-.01-4.26-.01-6.39z" />
                                </svg>
                            </a>
                            <a href="https://www.youtube.com/channel/UCHHWQyMsrawScl2feuB_Dyg" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-primary hover:border-primary transition-all group">
                                <Youtube className="h-4 w-4 group-hover:scale-110 transition-transform" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-lg font-bold mb-8 relative inline-block">
                            Plateforme
                            <span className="absolute -bottom-2 left-0 w-8 h-1 bg-primary rounded-full"></span>
                        </h4>
                        <ul className="space-y-4">
                            {[
                                { label: 'FAQ Auto-entrepreneur', path: '/faq' },
                                { label: 'FAQ Entreprise', path: '/entreprise/faq' },
                                { label: 'Tutoriels Auto-entrepreneur', path: '/tutoriels' },
                                { label: 'Tutoriels Entreprise', path: '/entreprise/tutoriels' },
                                { label: 'Fonctionnement Auto-entrepreneur', path: '/fonctionnement' },
                                { label: 'Fonctionnement Entreprise', path: '/entreprise/fonctionnement' },
                            ].map((link) => (
                                <li key={link.label}>
                                    <a
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            navigate(link.path);
                                        }}
                                        className="text-slate-400 hover:text-primary flex items-center gap-2 group transition-colors"
                                    >
                                        <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="text-lg font-bold mb-8 relative inline-block">
                            Contact
                            <span className="absolute -bottom-2 left-0 w-8 h-1 bg-primary rounded-full"></span>
                        </h4>
                        <ul className="space-y-6">
                            <li className="flex items-start gap-4 text-slate-400 group">
                                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-500 uppercase mb-1">Email</div>
                                    <a href="mailto:contact@nettmobfrance.fr" className="hover:text-white transition-colors">contact@nettmobfrance.fr</a>
                                </div>
                            </li>
                            <li className="flex items-start gap-4 text-slate-400 group">
                                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                                    <Phone className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-500 uppercase mb-1">Téléphone</div>
                                    <a href="tel:+33766390992" className="hover:text-white transition-colors">+33 7 66 39 09 92</a>
                                </div>
                            </li>
                            <li className="flex items-start gap-4 text-slate-400 group">
                                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                                    <MapPin className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-500 uppercase mb-1">Adresse</div>
                                    <span className="leading-relaxed">34 Av. des Champs-Élysées,<br />75008 Paris, France</span>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* Mobile Apps */}
                    <div>
                        <h4 className="text-lg font-bold mb-8 relative inline-block">
                            Application Mobile
                            <span className="absolute -bottom-2 left-0 w-8 h-1 bg-primary rounded-full"></span>
                        </h4>
                        <p className="text-slate-400 text-sm mb-6">Gérez vos missions où que vous soyez.</p>
                        <div className="space-y-3">
                            <a href="#" className="block">
                                <img
                                    src="/google.png"
                                    alt="Disponible sur Google Play"
                                    className="h-10 w-auto rounded-lg hover:opacity-90 transition-opacity"
                                />
                            </a>
                            <a href="#" className="block">
                                <img
                                    src="/apple.png"
                                    alt="Télécharger dans l'App Store"
                                    className="h-10 w-auto rounded-lg hover:opacity-90 transition-opacity"
                                />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Legal & Copyright */}
                <div className="pt-12 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-slate-500 text-sm">
                        © {new Date().getFullYear()} NettMobFrance. Tous droits réservés.
                    </p>
                    <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/cgu-cgv'); }} className="hover:text-primary transition-colors">CGU / CGV</a>
                        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/rgpd'); }} className="hover:text-primary transition-colors">RGPD</a>
                        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/mandat-facturation'); }} className="hover:text-primary transition-colors">Mandat de Facturation</a>
                        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/conformite-securite'); }} className="hover:text-primary transition-colors">Conformité & Sécurité</a>
                        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/contact'); }} className="hover:text-primary transition-colors">Contact</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
