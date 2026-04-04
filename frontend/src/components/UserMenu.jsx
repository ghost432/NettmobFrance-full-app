import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AvatarWrapper as Avatar, getUserInitials } from './AvatarWrapper';
import { User, Settings, LogOut, Globe } from 'lucide-react';
import api from '../lib/api';
import verifiedIcon from '../images/2.png';
import unverifiedIcon from '../images/1.png';

export const UserMenu = ({ size = 'md' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Vérification correcte du statut de vérification selon le rôle
  const profileIdVerified = useMemo(() => {
    if (!user) return false;
    if (user.role === 'client') {
      // Pour les clients, vérifier representative_id_verified en priorité
      const v = (user?.profile?.representative_id_verified ?? user?.profile?.id_verified ?? user?.id_verified);
      return v === 1 || v === true || v === '1';
    }
    if (user.role === 'automob') {
      const v = user?.profile?.id_verified;
      return v === 1 || v === true || v === '1';
    }
    // Pour admin, pas de vérification
    return false;
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getUserName = () => {
    if (user?.role === 'client') {
      return user?.profile?.company_name || user?.company_name || user?.email?.split('@')[0] || 'Entreprise';
    } else if (user?.role === 'automob') {
      if (user?.profile?.first_name && user?.profile?.last_name) {
        return `${user.profile.first_name} ${user.profile.last_name}`;
      }
      return user?.email?.split('@')[0] || 'Auto-entrepreneur';
    }
    return user?.email?.split('@')[0] || 'Utilisateur';
  };

  const handleProfileClick = () => {
    navigate(`/${user?.role}/profile`);
    setIsOpen(false);
  };

  const handlePublicProfileClick = () => {
    let publicUrl = '';
    if (user?.role === 'automob') {
      const name = user?.profile?.first_name && user?.profile?.last_name
        ? `${user.profile.first_name}-${user.profile.last_name}`.toLowerCase().replace(/\s+/g, '-')
        : user?.email?.split('@')[0] || 'automob';
      publicUrl = `/automob/profile/public/${encodeURIComponent(name)}`;
    } else if (user?.role === 'client') {
      const companyName = user?.profile?.company_name?.toLowerCase().replace(/\s+/g, '-') || user?.email?.split('@')[0] || 'entreprise';
      publicUrl = `/client/profile/public/${encodeURIComponent(companyName)}`;
    }
    navigate(publicUrl);
    setIsOpen(false);
  };

  const handleSettingsClick = () => {
    navigate(`/${user?.role}/settings`);
    setIsOpen(false);
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignorer une éventuelle erreur réseau : la session sera nettoyée côté client
      console.error('Erreur lors du logout API:', error);
    } finally {
      logout();
      setIsOpen(false);
    }
  };

  const iconSizeClasses = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const avatarSize = size === 'sm' ? 'sm' : 'md';

  // Construire l'URL de l'image avec timestamp pour éviter le cache
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    const baseUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${imagePath}`;
    // Ajouter timestamp seulement si on a une image
    return baseUrl;
  };

  const avatarSrc = getImageUrl(user?.profile?.profile_picture);

  return (
    <div className="flex items-center gap-2">
      {/* User Menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-accent"
        >
          <Avatar src={avatarSrc} alt={getUserName()} initials={getUserInitials(user)} size={avatarSize} />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg py-2 z-50">
            <div className="px-4 py-3 border-b border-border flex items-center gap-3">
              <Avatar src={avatarSrc} alt={getUserName()} initials={getUserInitials(user)} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-sm font-medium text-foreground truncate">{getUserName()}</p>
                  {user?.role !== 'admin' && (
                    <img
                      src={profileIdVerified ? verifiedIcon : unverifiedIcon}
                      alt={profileIdVerified ? 'Vérifié' : 'Non vérifié'}
                      className="h-3 w-3 flex-shrink-0"
                      title={profileIdVerified ? 'Profil vérifié' : 'Profil non vérifié'}
                    />
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>

            <button
              onClick={handleProfileClick}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent transition-colors"
            >
              <User className="h-4 w-4" />
              <span>Mon Profil</span>
            </button>

            {(user?.role === 'automob' || user?.role === 'client') && (
              <button
                onClick={handlePublicProfileClick}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent transition-colors"
              >
                <Globe className="h-4 w-4" />
                <span>Profil public</span>
              </button>
            )}

            <button
              onClick={handleSettingsClick}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span>Paramètres</span>
            </button>

            <div className="border-t border-border my-2"></div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-accent transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Déconnexion</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
