import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { Logo } from '../../../components/Logo';
import { Button } from '../../../components/ui/button';
import {
    Phone,
    Mail,
    MapPin,
    Facebook,
    Linkedin,
    Instagram,
    Youtube,
    Send,
    MessageCircle,
    Music,
    Moon,
    Sun,
    Menu,
    X,
    ChevronDown,
    LayoutDashboard,
    User,
    LogOut,
    AlertCircle,
    ChevronRight,
    Globe
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { AvatarWrapper as Avatar, getUserInitials } from '../../../components/AvatarWrapper';

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, setTheme } = useTheme();
    const { user, logout } = useAuth();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const desktopDropdownRef = useRef(null);
    const mobileDropdownRef = useRef(null);

    const getDashboardPath = (role) => {
        if (role === 'admin') return '/admin/dashboard';
        if (role === 'client') return '/client/dashboard';
        return '/automob/dashboard';
    };

    const getProfilePath = (role) => {
        if (role === 'admin') return '/admin/profile';
        if (role === 'client') return '/client/profile';
        return '/automob/profile';
    };

    const handleLogout = () => {
        setShowLogoutModal(false);
        setIsDropdownOpen(false);
        logout();
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            const isOutsideDesktop = !desktopDropdownRef.current || !desktopDropdownRef.current.contains(e.target);
            const isOutsideMobile = !mobileDropdownRef.current || !mobileDropdownRef.current.contains(e.target);

            if (isOutsideDesktop && isOutsideMobile) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isEnterprise = location.pathname === '/entreprise' || location.pathname.startsWith('/entreprise/');

    const getDisplayName = (u) => {
        if (!u) return '';
        if (u.role === 'client') {
            return u.profile?.company_name || u.company_name || u.email?.split('@')[0] || 'Entreprise';
        }
        if (u.profile?.first_name && u.profile?.last_name) {
            return `${u.profile.first_name} ${u.profile.last_name}`;
        }
        return u.name || u.email?.split('@')[0] || 'Utilisateur';
    };

    // Helper pour construire l'URL complète de l'image
    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const cleanImagePath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;

        // S'assurer qu'on n'a pas de double slash entre apiUrl et cleanImagePath
        const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
        return `${baseUrl}${cleanImagePath}`;
    };



    // Handle scroll
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close menu on navigation
    useEffect(() => {
        setIsMenuOpen(false);
    }, [location.pathname]);

    const handleToggle = (toEnterprise) => {
        if (toEnterprise) {
            navigate('/entreprise');
        } else {
            navigate('/');
        }
    };

    return (
        <header className="absolute top-0 w-full z-50 pointer-events-none">
            {/* TopBar */}
            <div className={`bg-[#a31a4d] text-white py-1 text-xs font-bold hidden lg:block pointer-events-auto`}>
                <div className="container mx-auto px-4 flex justify-between items-center">
                    {/* Left: Switcher */}
                    <div className="flex items-center gap-2 bg-white/10 p-0.5 rounded-xl border border-white/20">
                        <button
                            onClick={() => handleToggle(false)}
                            className={`px-3 py-1 rounded-lg text-[11px] font-light uppercase tracking-tighter transition-all ${!isEnterprise ? 'bg-white text-primary shadow-sm' : 'text-white/70 hover:text-white'}`}
                        >
                            Auto-entrepreneur
                        </button>
                        <button
                            onClick={() => handleToggle(true)}
                            className={`px-3 py-1 rounded-lg text-[11px] font-light uppercase tracking-tighter transition-all ${isEnterprise ? 'bg-white text-primary shadow-sm' : 'text-white/70 hover:text-white'}`}
                        >
                            Entreprise
                        </button>
                    </div>

                    {/* Center: Contact Info */}
                    <div className="flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
                            <a href="tel:+33766390992" className="text-slate-200 hover:text-white transition-colors flex items-center gap-1">
                                <Phone size={14} className="text-primary rotate-12" />
                                <span className="font-bold underline decoration-primary/30">+33 7 66 39 09 92</span>
                            </a>
                        <a href="mailto:contact@nettmobfrance.fr" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <Mail className="h-3 w-3" />
                            contact@nettmobfrance.fr
                        </a>
                        <span className="flex items-center gap-2 opacity-90">
                            <MapPin className="h-3 w-3" />
                            34 Av. des Champs-Élysées, 75008 Paris
                        </span>
                    </div>

                    {/* Right: Social Networks */}
                    <div className="flex items-center gap-3">
                        <a href="https://www.facebook.com/nettmobholdingltd/" target="_blank" rel="noopener noreferrer" className="hover:scale-125 transition-transform"><Facebook className="h-3.5 w-3.5" /></a>
                        <a href="https://fr.linkedin.com/company/nettmob-france" target="_blank" rel="noopener noreferrer" className="hover:scale-125 transition-transform"><Linkedin className="h-3.5 w-3.5" /></a>
                        <a href="https://www.instagram.com/nett.mobfrance/" target="_blank" rel="noopener noreferrer" className="hover:scale-125 transition-transform"><Instagram className="h-3.5 w-3.5" /></a>
                        <a href="https://whatsapp.com/channel/0029Vb6NDjLBlHpU65Tymy3t" target="_blank" rel="noopener noreferrer" className="hover:scale-125 transition-transform">
                            <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.67-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.004c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                        </a>
                        <a href="https://t.me/+a2pM28YK1opiZTVk" target="_blank" rel="noopener noreferrer" className="hover:scale-125 transition-transform"><Send className="h-3.5 w-3.5" /></a>
                        <a href="https://www.tiktok.com/@nettmobfrance" target="_blank" rel="noopener noreferrer" className="hover:scale-125 transition-transform">
                            <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                                <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.03-2.86-.31-4.13-1.03-2.28-1.29-3.67-3.91-3.32-6.49.15-1.17.6-2.35 1.35-3.29 1.34-1.68 3.54-2.63 5.74-2.42V10.1c-1.24-.15-2.52.14-3.55.82-1.03.68-1.74 1.85-1.84 3.09-.13 1.61.76 3.19 2.19 3.91 1.07.54 2.39.63 3.5.14 1.21-.52 1.9-1.68 2.1-2.98.03-2.93.02-5.86.02-8.79-.01-2.13-.01-4.26-.01-6.39z" />
                            </svg>
                        </a>
                        <a href="https://www.youtube.com/channel/UCHHWQyMsrawScl2feuB_Dyg" target="_blank" rel="noopener noreferrer" className="hover:scale-125 transition-transform"><Youtube className="h-3.5 w-3.5" /></a>
                    </div>
                </div>
            </div>

            {/* Main Header */}
            <nav className={`transition-all duration-300 pointer-events-auto ${isScrolled
                ? 'fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-[1400px] rounded-[25px] border shadow-md bg-background/95 backdrop-blur-2xl px-6 h-16'
                : 'bg-background/80 backdrop-blur-xl border-b border-border h-20 w-full'
                }`}>
                <div className="container mx-auto px-4 h-full flex items-center justify-between">
                    {/* Left: Logo */}
                    <div className="flex items-center flex-shrink-0">
                        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate(isEnterprise ? '/entreprise' : '/')}>
                            <Logo className="h-10 w-auto group-hover:scale-105 transition-transform" />
                        </div>
                    </div>

                    {/* Center: Menu Items */}
                    <div className="hidden lg:flex flex-1 items-center justify-center gap-4 xl:gap-8 px-4">
                        {[
                            isEnterprise ? { label: 'Notre plateforme', path: '/entreprise' } : { label: 'Notre plateforme', path: '/' },
                            isEnterprise ? { label: 'Secteurs', path: '/entreprise/secteurs' } : { label: 'Secteurs', path: '/secteurs' },
                            isEnterprise ? { label: 'Fonctionnement', path: '/entreprise/fonctionnement' } : { label: 'Fonctionnement', path: '/fonctionnement' },
                            isEnterprise ? { label: 'Tutoriels', path: '/entreprise/tutoriels' } : { label: 'Tutoriels', path: '/tutoriels' },
                            isEnterprise ? { label: 'FAQ', path: '/entreprise/faq' } : { label: 'FAQ', path: '/faq' },
                            isEnterprise ? { label: 'Blog', path: '/entreprise/blog' } : { label: 'Blog', path: '/blog' },
                            isEnterprise ? { label: 'Devis', path: '/entreprise/devis' } : null,
                            isEnterprise ? { label: 'Contact', path: '/entreprise/contact' } : { label: 'Contact', path: '/contact' },
                        ].filter(Boolean).map(({ label, path }) => {
                            const isActive = location.pathname === path || location.pathname.startsWith(path + '/');
                            return (
                                <a
                                    key={path}
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); navigate(path); }}
                                    className={`relative text-sm font-black whitespace-nowrap transition-colors ${isActive ? 'text-primary' : 'hover:text-primary'}`}
                                >
                                    {label}
                                    {isActive && (
                                        <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full" />
                                    )}
                                </a>
                            );
                        })}
                    </div>

                    {/* Right: Auth Buttons, User Avatar & Theme Toggle */}
                    <div className="flex items-center justify-end gap-4 lg:gap-6 flex-shrink-0">
                        <div className="hidden lg:flex items-center gap-4">
                            {user ? (
                                <div className="relative" ref={desktopDropdownRef}>
                                    <button
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-muted transition-colors border border-transparent hover:border-border"
                                    >
                                        <Avatar
                                            src={getImageUrl(user.profile?.profile_picture || user.profile_picture)}
                                            alt={getDisplayName(user)}
                                            initials={getUserInitials(user)}
                                            size="sm"
                                            className="border-2 border-primary"
                                        />
                                        <span className="text-sm font-black max-w-[120px] truncate">
                                            {getDisplayName(user)}
                                        </span>
                                        <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isDropdownOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-52 bg-background border border-border rounded-2xl shadow-2xl py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                                            <div className="px-4 py-2 border-b border-border mb-1">
                                                <p className="text-xs text-muted-foreground font-medium">Connecté en tant que</p>
                                                <p className="text-sm font-black truncate">
                                                    {getDisplayName(user)}
                                                </p>
                                                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black uppercase tracking-wider">{user.role}</span>
                                            </div>
                                            <button
                                                onClick={() => { navigate(getDashboardPath(user.role)); setIsDropdownOpen(false); }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold hover:bg-muted transition-colors text-left"
                                            >
                                                <LayoutDashboard className="h-4 w-4 text-primary" />
                                                Tableau de bord
                                            </button>
                                            <button
                                                onClick={() => { navigate(getProfilePath(user.role)); setIsDropdownOpen(false); }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold hover:bg-muted transition-colors text-left"
                                            >
                                                <User className="h-4 w-4 text-primary" />
                                                Mon profil
                                            </button>
                                            <div className="border-t border-border mt-1 pt-1">
                                                <button
                                                    onClick={() => { setIsDropdownOpen(false); setShowLogoutModal(true); }}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 transition-colors text-left"
                                                >
                                                    <LogOut className="h-4 w-4" />
                                                    Se déconnecter
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <Button variant="ghost" onClick={() => navigate('/login')} className="font-black text-xs uppercase tracking-widest h-10 px-4">
                                        Connexion
                                    </Button>
                                    <Button
                                        onClick={() => navigate(isEnterprise ? '/register/client?etape=informations' : '/account-type')}
                                        className="bg-primary text-primary-foreground hover:bg-primary/90 font-black text-xs uppercase tracking-widest px-6 h-10 rounded-xl shadow-lg shadow-primary/20"
                                    >
                                        S'inscrire
                                    </Button>
                                </>
                            )}
                        </div>

                        {/* Theme Toggle (Desktop & Mobile) */}
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground border border-transparent hover:border-border hidden lg:block"
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </button>

                        {/* Mobile Menu Toggle & Theme */}
                        <div className="flex items-center gap-2 lg:hidden">
                            {user && (
                                <div className="relative" ref={mobileDropdownRef}>
                                    <button
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-muted transition-colors border border-transparent hover:border-border"
                                    >
                                        <Avatar
                                            src={getImageUrl(user.profile?.profile_picture || user.profile_picture)}
                                            alt={getDisplayName(user)}
                                            initials={getUserInitials(user)}
                                            size="sm"
                                            className="border-2 border-primary"
                                        />
                                        <span className="text-[10px] font-black max-w-[80px] truncate">
                                            {getDisplayName(user)}
                                        </span>
                                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isDropdownOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-52 bg-background border border-border rounded-2xl shadow-2xl py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                                            <div className="px-4 py-2 border-b border-border mb-1 text-left">
                                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Compte</p>
                                                <p className="text-sm font-black truncate">
                                                    {getDisplayName(user)}
                                                </p>
                                                <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black uppercase tracking-wider">{user.role}</span>
                                            </div>
                                            <button
                                                onClick={() => { navigate(getDashboardPath(user.role)); setIsDropdownOpen(false); }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold hover:bg-muted transition-colors text-left"
                                            >
                                                <LayoutDashboard className="h-4 w-4 text-primary" />
                                                Tableau de bord
                                            </button>
                                            <button
                                                onClick={() => { navigate(getProfilePath(user.role)); setIsDropdownOpen(false); }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold hover:bg-muted transition-colors text-left"
                                            >
                                                <User className="h-4 w-4 text-primary" />
                                                Mon profil
                                            </button>
                                            <div className="border-t border-border mt-1 pt-1">
                                                <button
                                                    onClick={() => { setIsDropdownOpen(false); setShowLogoutModal(true); }}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 transition-colors text-left"
                                                >
                                                    <LogOut className="h-4 w-4" />
                                                    Se déconnecter
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            <button
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground border border-transparent hover:border-border"
                                aria-label="Toggle theme"
                            >
                                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </button>
                            <button
                                className="p-3 text-foreground bg-muted rounded-xl"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                            >
                                {isMenuOpen ? <X className="h-6 w-6" /> : (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="4" y1="8" x2="20" y2="8" />
                                        <line x1="12" y1="16" x2="20" y2="16" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="lg:hidden absolute top-full left-0 w-full bg-background border-b border-border p-8 space-y-6 animate-in slide-in-from-top duration-500 shadow-2xl overflow-y-auto max-h-[calc(100vh-80px)]">
                        <div className="flex flex-col gap-6">
                            {/* 1. Switcher Mobile */}
                            <div className="flex items-center justify-center gap-2 bg-muted p-2 rounded-2xl border border-border w-full">
                                <button
                                    onClick={() => handleToggle(false)}
                                    className={`flex-1 py-4 rounded-xl text-sm font-light uppercase tracking-tighter transition-all ${!isEnterprise ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground'}`}
                                >
                                    Indépendant
                                </button>
                                <button
                                    onClick={() => handleToggle(true)}
                                    className={`flex-1 py-4 rounded-xl text-sm font-light uppercase tracking-tighter transition-all ${isEnterprise ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground'}`}
                                >
                                    Entreprise
                                </button>
                            </div>

                            {/* 2. Menu Links */}
                            <div className="flex flex-col gap-2">
                                {[
                                    isEnterprise ? { label: 'Notre plateforme', path: '/entreprise' } : { label: 'Notre plateforme', path: '/' },
                                    isEnterprise ? { label: 'Secteurs d\'activité', path: '/entreprise/secteurs' } : { label: 'Secteurs d\'activité', path: '/secteurs' },
                                    isEnterprise ? { label: 'Comment ça marche', path: '/entreprise/fonctionnement' } : { label: 'Comment ça marche', path: '/fonctionnement' },
                                    isEnterprise ? { label: 'Tutoriels Vidéo', path: '/entreprise/tutoriels' } : { label: 'Tutoriels Vidéo', path: '/tutoriels' },
                                    isEnterprise ? { label: 'Questions fréquentes', path: '/entreprise/faq' } : { label: 'Questions fréquentes', path: '/faq' },
                                    isEnterprise ? { label: 'Blog & Actus', path: '/entreprise/blog' } : { label: 'Blog & Actus', path: '/blog' },
                                    isEnterprise ? { label: 'Demande de Devis', path: '/entreprise/devis' } : null,
                                    isEnterprise ? { label: 'Contact', path: '/entreprise/contact' } : { label: 'Contact', path: '/contact' },
                                ].filter(Boolean).map(({ label, path }) => {
                                    const isActive = location.pathname === path;
                                    return (
                                        <button
                                            key={path}
                                            onClick={() => { navigate(path); setIsMenuOpen(false); }}
                                            className={`flex items-center justify-between p-4 rounded-2xl font-black uppercase text-sm tracking-tight transition-all ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                                        >
                                            {label}
                                            <ChevronRight className={`h-4 w-4 ${isActive ? 'opacity-100' : 'opacity-30'}`} />
                                        </button>
                                    );
                                })}
                            </div>

                            {/* 3. Auth Actions */}
                            <div className="pt-6 border-t border-border">
                                {!user && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <Button variant="outline" onClick={() => navigate('/login')} className="h-16 font-black uppercase rounded-2xl border-2">
                                            Connexion
                                        </Button>
                                        <Button
                                            onClick={() => { navigate(isEnterprise ? '/register/client?etape=informations' : '/account-type'); setIsMenuOpen(false); }}
                                            className="h-16 font-black uppercase rounded-2xl bg-primary"
                                        >
                                            S'inscrire
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-auto"
                    style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                    onClick={() => setShowLogoutModal(false)}
                >
                    <div
                        className="bg-background rounded-3xl border border-border shadow-2xl p-8 max-w-sm w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                                <LogOut className="h-8 w-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tight">Se déconnecter ?</h3>
                            <p className="text-muted-foreground font-medium">
                                Êtes-vous sûr de vouloir vous déconnecter de votre compte ?
                            </p>
                            <div className="flex gap-3 w-full mt-2">
                                <Button
                                    variant="outline"
                                    className="flex-1 h-12 font-black uppercase rounded-2xl border-2"
                                    onClick={() => setShowLogoutModal(false)}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    className="flex-1 h-12 font-black uppercase rounded-2xl bg-red-500 hover:bg-red-600 text-white"
                                    onClick={handleLogout}
                                >
                                    Oui, se déconnecter
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;
