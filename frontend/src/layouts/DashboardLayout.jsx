import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, PanelLeftOpen, PanelRightOpen, Search as SearchIcon, LayoutGrid, Bell, MoreVertical, LogOut, Check, CheckCheck, Eye, Clock, Wallet, Euro, User, Settings, MessageSquare, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Logo } from '@/components/Logo';
import { AvatarWrapper as Avatar, getUserInitials } from '@/components/AvatarWrapper';
import { UserMenu } from '@/components/UserMenu';
import IdentityVerificationPopup from '@/components/IdentityVerificationPopup';
import { FeedbackPopup } from '@/components/FeedbackPopup';
import { NotificationPermissionPrompt } from '@/components/NotificationPermissionPrompt';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import verifiedIcon from '@/images/2.png';
import unverifiedIcon from '@/images/1.png';

export const DashboardLayout = ({
  title,
  description,
  menuItems = [],
  children,
  getDisplayName,
  getRoleLabel,
  getAvatarSrc,
  searchPlaceholder = 'Rechercher... ',
  searchValue,
  onSearchChange,
  onSearchSubmit,
  searchOptions = [],
  onSearchSelect,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [supportUnreadCount, setSupportUnreadCount] = useState(0);
  const [contactUnreadCount, setContactUnreadCount] = useState(0);
  const [pendingApplicationsCount, setPendingApplicationsCount] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);

  // Désactiver le scroll sur le body pour éviter les doubles barres de défilement
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
      document.documentElement.style.overflow = originalStyle;
    };
  }, []);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [showIdentityPopup, setShowIdentityPopup] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [loadingWallet, setLoadingWallet] = useState(true);

  const profileIdVerified = useMemo(() => {
    if (!user) return false;
    if (user.role === 'client') {
      const v = (user?.profile?.representative_id_verified ?? user?.profile?.id_verified ?? user?.id_verified);
      return v === 1 || v === true || v === '1';
    }
    if (user.role === 'automob') {
      const v = user?.profile?.id_verified;
      return v === 1 || v === true || v === '1';
    }
    const v = user?.id_verified;
    return v === 1 || v === true || v === '1';
  }, [user]);

  // Vérifier si le popup de vérification d'identité doit être affiché
  useEffect(() => {
    // Ne pas afficher pour les admins
    if (user?.role === 'admin') return;

    // Vérifier si l'identité est déjà vérifiée (selon le rôle)
    if (profileIdVerified) return;

    // Vérifier si l'utilisateur a déjà fermé le popup récemment (dans les dernières 24h)
    const dismissedAt = localStorage.getItem('identity_verification_dismissed');
    if (dismissedAt) {
      const hoursSinceDismissed = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 24) return;
    }

    // Attendre 3 secondes après le chargement avant d'afficher le popup
    const timer = setTimeout(() => {
      setShowIdentityPopup(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [user, profileIdVerified]);

  // Charger les notifications
  const fetchNotifications = async () => {
    try {
      const requests = [
        api.get('/notifications/unread-count'),
        api.get('/notifications?limit=5'),
        api.get('/support/unread-count'),
        ...(user?.role === 'admin' ? [api.get('/contact/admin/unread-count')] : []),
        ...(user?.role === 'client' ? [api.get('/missions/client/pending-applications-count')] : [])
      ];

      const results = await Promise.all(requests);
      setUnreadCount(results[0].data.count);
      setRecentNotifications(results[1].data);
      setSupportUnreadCount(results[2].data.unread_count || 0);

      if (user?.role === 'admin' && results[3]) {
        setContactUnreadCount(results[3].data.count || 0);
      }
      
      if (user?.role === 'client') {
        // Le résultat dépend de si l'admin est présent ou non (index 3 ou 4)
        const pendingApplicationsResult = user?.role === 'admin' ? results[4] : results[3];
        if (pendingApplicationsResult) {
          setPendingApplicationsCount(pendingApplicationsResult.data.count || 0);
        }
      }
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    }
  };

  // Charger le wallet pour les automobs
  useEffect(() => {
    const fetchWallet = async () => {
      if (user?.role === 'automob') {
        try {
          const response = await api.get('/wallet/my-wallet');
          setWallet(response.data);
        } catch (error) {
          console.error('Erreur chargement wallet:', error);
        } finally {
          setLoadingWallet(false);
        }
      } else {
        setLoadingWallet(false);
      }
    };

    fetchWallet();
  }, [user]);

  // Charger le compteur de notifications non lues
  useEffect(() => {
    if (!user) return; // Ne pas chercher si l'utilisateur n'est pas encore défini

    fetchNotifications();
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Marquer une notification comme lue
  const markAsRead = async (notifId) => {
    try {
      await api.put(`/notifications/${notifId}/read`);
      await fetchNotifications();
    } catch (error) {
      console.error('Erreur marquage notification:', error);
    }
  };

  // Marquer toutes comme lues
  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      await fetchNotifications();
      setShowNotificationMenu(false);
    } catch (error) {
      console.error('Erreur marquage toutes notifications:', error);
    }
  };

  // Détecter quand la barre devient sticky
  useEffect(() => {
    const handleScroll = (e) => {
      const scrollTop = e.target.scrollTop;
      setIsHeaderSticky(scrollTop > 0);
    };

    const scrollContainer = document.querySelector('.dashboard-scroll-container');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const initialGroups = useMemo(() => {
    const state = {};
    menuItems.forEach((item) => {
      if (item.children?.length) {
        const isChildActive = item.children.some((child) => child.path && location.pathname.startsWith(child.path));
        state[item.label] = isChildActive;
      }
    });
    return state;
  }, [menuItems, location.pathname]);

  const [openGroups, setOpenGroups] = useState(initialGroups);

  const toggleGroup = (label) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const displayName = getDisplayName
    ? getDisplayName(user)
    : user?.role === 'automob'
      ? user?.profile?.first_name && user?.profile?.last_name
        ? `${user.profile.first_name} ${user.profile.last_name}`
        : user?.email?.split('@')[0] || ''
      : user?.role === 'client'
        ? user?.profile?.company_name || user?.company_name || user?.email?.split('@')[0] || 'Entreprise'
        : user?.email?.split('@')[0] || 'Utilisateur';

  const roleLabel = getRoleLabel
    ? getRoleLabel(user)
    : user?.role === 'admin'
      ? 'Administrateur'
      : user?.role === 'automob'
        ? 'Automob'
        : user?.role === 'client'
          ? 'Client'
          : user?.role || '';

  // Helper pour construire l'URL complète de l'image
  const buildImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${imagePath}`;
  };

  const avatarSrc = getAvatarSrc
    ? getAvatarSrc(user)
    : buildImageUrl(user?.profile?.profile_picture || user?.profile_picture) || null;

  const [internalSearch, setInternalSearch] = useState(searchValue ?? '');
  const isSearchControlled = searchValue !== undefined;
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchVisible, setIsMobileSearchVisible] = useState(false);
  const blurTimeoutRef = useRef(null);
  const desktopSearchInputRef = useRef(null);
  const mobileSearchInputRef = useRef(null);
  const BLUR_DELAY_MS = 200;

  useEffect(() => {
    if (isSearchControlled) {
      setInternalSearch(searchValue ?? '');
    }
  }, [isSearchControlled, searchValue]);

  const currentSearchValue = isSearchControlled ? (searchValue ?? '') : internalSearch;

  const handleSearchChange = (event) => {
    const value = event.target.value;
    if (!isSearchControlled) {
      setInternalSearch(value);
    }
    onSearchChange?.(value);
  };

  const fallbackSearchEntries = useMemo(() => {
    const entries = [];
    menuItems.forEach((item) => {
      if (item.label) {
        entries.push({ label: item.label, path: item.path });
      }
      if (item.children?.length) {
        item.children.forEach((child) => {
          if (child.label) {
            entries.push({ label: child.label, path: child.path });
          }
        });
      }
    });

    const seen = new Map();
    entries.forEach((entry) => {
      const key = entry.label.trim().toLowerCase();
      if (!key.length) return;
      if (!seen.has(key)) {
        seen.set(key, entry);
      } else if (!seen.get(key).path && entry.path) {
        seen.set(key, entry);
      }
    });

    return Array.from(seen.values());
  }, [menuItems]);

  const availableSearchOptions = useMemo(() => {
    if (searchOptions.length) {
      return searchOptions;
    }
    return fallbackSearchEntries.map((entry) => entry.label);
  }, [fallbackSearchEntries, searchOptions]);

  const filteredOptions = useMemo(() => {
    const query = currentSearchValue.trim().toLowerCase();
    if (!query) {
      return availableSearchOptions.slice(0, 8);
    }
    return availableSearchOptions
      .filter((option) => option.toLowerCase().includes(query))
      .slice(0, 8);
  }, [availableSearchOptions, currentSearchValue]);

  const showDesktopSuggestions = isSearchFocused && filteredOptions.length > 0;
  const showMobileSuggestions = isMobileSearchVisible && filteredOptions.length > 0;

  const navigateToEntry = (value) => {
    const normalized = value.trim().toLowerCase();
    if (!normalized.length) return;

    const exact = fallbackSearchEntries.find((entry) => entry.label.trim().toLowerCase() === normalized);
    const partial = fallbackSearchEntries.find((entry) => entry.label.trim().toLowerCase().includes(normalized));
    const target = exact || partial;

    if (target?.path) {
      navigate(target.path);
    }
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const value = currentSearchValue.trim();
    if (!value.length) return;
    if (onSearchSubmit) {
      onSearchSubmit(value);
    } else {
      navigateToEntry(value);
    }
    setIsSearchFocused(false);
    setIsMobileSearchVisible(false);
  };

  const handleSearchSelect = (option) => {
    if (!isSearchControlled) {
      setInternalSearch(option);
    }
    if (onSearchSelect) {
      onSearchSelect(option);
    } else if (!onSearchSubmit) {
      navigateToEntry(option);
    }
    onSearchSubmit?.(option);
    setIsSearchFocused(false);
    setIsMobileSearchVisible(false);
  };

  const handleDesktopSearchFocus = () => {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    setIsSearchFocused(true);
  };

  const handleDesktopSearchBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      setIsSearchFocused(false);
    }, BLUR_DELAY_MS);
  };

  const handleMobileSearchToggle = () => {
    const next = !isMobileSearchVisible;
    setIsMobileSearchVisible(next);
    if (next) {
      requestAnimationFrame(() => {
        mobileSearchInputRef.current?.focus();
      });
    }
  };

  const handleMobileSearchFocus = () => {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    setIsMobileSearchVisible(true);
  };

  const handleMobileSearchBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      setIsMobileSearchVisible(false);
    }, BLUR_DELAY_MS);
  };

  const renderHeaderControls = () => (
    <div className="flex flex-wrap items-center justify-between gap-2 sm:flex-nowrap sm:gap-3">
      <div className="flex items-center gap-2 sm:flex-1">
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-muted/80 lg:hidden"
          aria-label="Ouvrir la navigation"
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
        <div className="relative sm:hidden">
          <button
            type="button"
            onClick={handleMobileSearchToggle}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground"
            aria-label="Rechercher"
          >
            <SearchIcon className="h-4 w-4" />
          </button>
          {isMobileSearchVisible && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsMobileSearchVisible(false)}
              />
              <div className="fixed left-1/2 top-20 z-40 w-[min(20rem,90vw)] -translate-x-1/2 rounded-lg border border-border bg-card p-3 shadow-lg">
                <form onSubmit={handleSearchSubmit} className="space-y-3">
                  <div className="relative">
                    <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      ref={mobileSearchInputRef}
                      type="search"
                      value={currentSearchValue}
                      onChange={handleSearchChange}
                      onFocus={handleMobileSearchFocus}
                      onBlur={handleMobileSearchBlur}
                      placeholder={searchPlaceholder.trim().length ? searchPlaceholder : 'Rechercher...'}
                      className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  {showMobileSuggestions && (
                    <ul className="max-h-64 overflow-y-auto rounded-md border border-border">
                      {filteredOptions.map((option) => (
                        <li key={option}>
                          <button
                            type="button"
                            onMouseDown={() => handleSearchSelect(option)}
                            className="flex w-full items-center justify-start px-3 py-2 text-sm text-left hover:bg-accent"
                          >
                            {option}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </form>
              </div>
            </>
          )}
        </div>
        <div className="relative hidden h-9 flex-1 items-center sm:flex sm:w-1/2 sm:max-w-md">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={desktopSearchInputRef}
            type="search"
            value={currentSearchValue}
            onChange={handleSearchChange}
            onFocus={handleDesktopSearchFocus}
            onBlur={handleDesktopSearchBlur}
            placeholder={searchPlaceholder.trim().length ? searchPlaceholder : 'Rechercher...'}
            className="h-full w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {showDesktopSuggestions && (
            <ul className="absolute left-0 top-11 z-30 w-full overflow-hidden rounded-lg border border-border bg-card shadow-lg">
              {filteredOptions.map((option) => (
                <li key={option}>
                  <button
                    type="button"
                    onMouseDown={() => handleSearchSelect(option)}
                    className="flex w-full items-center justify-start px-3 py-2 text-sm text-left hover:bg-accent"
                  >
                    {option}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Bouton Actualiser */}
        <button
          onClick={() => window.location.reload()}
          className="h-8 w-8 p-0 rounded-full hover:bg-accent transition-colors flex items-center justify-center"
          aria-label="Actualiser"
          title="Actualiser la page"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        <ThemeToggle buttonClassName="h-8 w-8 p-0" iconClassName="h-4 w-4" />

        {/* Bouton Support */}
        {user && user.role !== 'admin' && (
          <button
            onClick={() => navigate(`/${user.role}/support`)}
            className="relative h-8 w-8 p-0 rounded-full hover:bg-accent transition-colors flex items-center justify-center"
            aria-label="Support"
            title="Centre d'assistance"
          >
            <MessageSquare className="w-4 h-4" />
            {supportUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
                {supportUnreadCount > 9 ? '9+' : supportUnreadCount}
              </span>
            )}
          </button>
        )}

        {/* Bouton Support pour Admin */}
        {user && user.role === 'admin' && (
          <button
            onClick={() => navigate('/admin/support')}
            className="relative h-8 w-8 p-0 rounded-full hover:bg-accent transition-colors flex items-center justify-center"
            aria-label="Support"
            title="Gestion du support"
          >
            <MessageSquare className="w-4 h-4" />
            {supportUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
                {supportUnreadCount > 9 ? '9+' : supportUnreadCount}
              </span>
            )}
          </button>
        )}

        {/* Menu Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotificationMenu(!showNotificationMenu)}
            className="relative h-8 w-8 p-0 rounded-full hover:bg-accent transition-colors flex items-center justify-center"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Menu déroulant */}
          {showNotificationMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowNotificationMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 z-40 w-80 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <CheckCheck className="w-3 h-3" />
                      Tout marquer lu
                    </button>
                  )}
                </div>

                {/* Liste des notifications */}
                <div className="max-h-96 overflow-y-auto">
                  {recentNotifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      Aucune notification
                    </div>
                  ) : (
                    recentNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={cn(
                          "px-4 py-3 border-b border-border hover:bg-accent/50 transition-colors cursor-pointer",
                          !notif.is_read && "bg-accent/20 border-l-2 border-l-primary"
                        )}
                        onClick={() => {
                          if (!notif.is_read) markAsRead(notif.id);
                          if (notif.action_url) navigate(notif.action_url);
                          setShowNotificationMenu(false);
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{notif.title}</p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notif.message}</p>
                            <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {new Date(notif.created_at).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                          {!notif.is_read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notif.id);
                              }}
                              className="p-1 rounded hover:bg-accent"
                              title="Marquer comme lu"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-border bg-muted/30">
                  <button
                    onClick={() => {
                      const notifPath = user?.role === 'admin' ? '/admin/notifications' :
                        user?.role === 'automob' ? '/automob/notifications' :
                          '/client/notifications';
                      navigate(notifPath);
                      setShowNotificationMenu(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Eye className="w-4 h-4" />
                    Tout voir
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <UserMenu size="sm" />
      </div>
    </div>
  );

  const renderNavigation = (isCompact) => (
    <nav className="px-3 py-4 space-y-1">
      {menuItems.map((item) => {
        const ItemIcon = item.icon;
        const isActive = item.path
          ? item.exact
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path)
          : item.children?.some((child) => child.path && (child.exact ? location.pathname === child.path : location.pathname.startsWith(child.path)));

        if (item.children?.length) {
          const isOpen = openGroups[item.label];
          return (
            <div key={item.label}>
              <button
                type="button"
                onClick={() => toggleGroup(item.label)}
                className={cn(
                  'group w-full flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
                  isCompact && 'justify-center'
                )}
              >
                {ItemIcon && <ItemIcon className="h-5 w-5" />}
                {!isCompact && (
                  <span className="ml-3 flex-1 text-left truncate">{item.label}</span>
                )}
                {!isCompact && <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen ? 'rotate-180' : 'rotate-0')} />}
              </button>
              {!isCompact && isOpen && (
                <div className="mt-1 space-y-1 pl-6">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon;
                    const childActive = child.path
                      ? child.exact
                        ? location.pathname === child.path
                        : location.pathname.startsWith(child.path)
                      : false;

                    // Gérer les liens dynamiques pour profil public
                    const getNavigationPath = () => {
                      if (!child.isDynamic || !child.path) return child.path;

                      if (user?.role === 'automob') {
                        const name = user?.profile?.first_name && user?.profile?.last_name
                          ? `${user.profile.first_name}-${user.profile.last_name}`.toLowerCase().replace(/\s+/g, '-')
                          : user?.email?.split('@')[0] || 'automob';
                        return `/automob/profile/public/${encodeURIComponent(name)}`;
                      } else if (user?.role === 'client') {
                        const companyName = user?.profile?.company_name?.toLowerCase().replace(/\s+/g, '-') || user?.email?.split('@')[0] || 'entreprise';
                        return `/client/profile/public/${encodeURIComponent(companyName)}`;
                      }
                      return child.path;
                    };

                    return (
                      <button
                        key={child.label}
                        type="button"
                        onClick={child.path ? () => navigate(getNavigationPath()) : undefined}
                        className={cn(
                          'w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                          childActive ? 'bg-primary/90 text-primary-foreground' : 'hover:bg-accent',
                          child.disabled && 'opacity-60 cursor-not-allowed hover:bg-transparent'
                        )}
                        disabled={child.disabled}
                      >
                        {ChildIcon && <ChildIcon className="h-4 w-4" />}
                        <span className="truncate">{child.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        return (
          <button
            key={item.label}
            type="button"
            onClick={item.path ? () => navigate(item.path) : undefined}
            className={cn(
              'relative w-full flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
              item.disabled && 'opacity-60 cursor-not-allowed hover:bg-transparent',
              isCompact && 'justify-center'
            )}
            disabled={item.disabled}
          >
            {ItemIcon && <ItemIcon className="h-5 w-5" />}
            {!isCompact && <span className="ml-3 flex-1 text-left truncate">{item.label}</span>}
            {!isCompact && item.label === 'Contact' && contactUnreadCount > 0 && (
              <span className="ml-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {contactUnreadCount > 99 ? '99+' : contactUnreadCount}
              </span>
            )}
            {!isCompact && item.label === 'Support' && supportUnreadCount > 0 && (
              <span className="ml-2 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {supportUnreadCount > 99 ? '99+' : supportUnreadCount}
              </span>
            )}
            {isCompact && item.label === 'Contact' && contactUnreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full border border-background"></span>
            )}
            {isCompact && item.label === 'Support' && supportUnreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full border border-background"></span>
            )}
            {!isCompact && item.label === 'Demandes reçues' && pendingApplicationsCount > 0 && (
              <span className="ml-2 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {pendingApplicationsCount > 99 ? '99+' : pendingApplicationsCount}
              </span>
            )}
            {isCompact && item.label === 'Demandes reçues' && pendingApplicationsCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full border border-background"></span>
            )}
          </button>
        );
      })}
    </nav>
  );

  const renderSidebarFooter = (isCompact) => {
    const handleLogout = () => {
      logout();
      navigate('/login');
    };

    return (
      <>
        {/* Wallet Card pour automobs */}
        {user?.role === 'automob' && !loadingWallet && wallet && !isCompact && (
          <div className="px-4 pb-2">
            <div
              onClick={() => navigate('/automob/wallet')}
              className="bg-gradient-to-br from-green-600 to-green-800 text-white rounded-md p-2 cursor-pointer hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-1 mb-1">
                <Wallet className="h-3 w-3" />
                <span className="text-[9px] opacity-90">Solde</span>
              </div>
              <div className="flex items-center gap-0.5">
                <Euro className="h-3.5 w-3.5" />
                <span className="text-lg font-bold">
                  {parseFloat(wallet.balance || 0).toFixed(2)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 mt-1.5 pt-1.5 border-t border-white/20 text-[9px]">
                <div>
                  <p className="opacity-75">Gagné</p>
                  <p className="font-semibold text-[10px]">{parseFloat(wallet.total_earned || 0).toFixed(2)}€</p>
                </div>
                <div>
                  <p className="opacity-75">Retiré</p>
                  <p className="font-semibold text-[10px]">{parseFloat(wallet.total_withdrawn || 0).toFixed(2)}€</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 border-t border-border">
          {isCompact ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex justify-center w-full hover:bg-muted/60 rounded-lg p-2 transition-colors"
                aria-label="Menu profil"
              >
                <Avatar src={avatarSrc} alt={displayName} initials={getUserInitials(user)} size="sm" />
              </button>

              {/* Menu déroulant en mode compact */}
              {showProfileMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowProfileMenu(false)}
                  />
                  <div className="absolute bottom-full left-full ml-2 mb-0 z-50 w-56 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
                    <div className="px-4 py-3 border-b border-border">
                      <div className="flex items-center gap-3">
                        <Avatar src={avatarSrc} alt={displayName} initials={getUserInitials(user)} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="text-sm font-medium truncate">{displayName}</p>
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
                    </div>
                    <button
                      onClick={() => {
                        navigate(`/${user?.role}/profile`);
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors text-left"
                    >
                      <User className="h-4 w-4" />
                      <span>Mon Profil</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate(`/${user?.role}/settings`);
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors text-left"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Paramètres</span>
                    </button>
                    <div className="border-t border-border my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-accent transition-colors text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-full flex items-center gap-3 rounded-lg bg-muted/60 px-3 py-2.5 hover:bg-muted/80 transition-colors"
                aria-label="Menu profil"
              >
                <Avatar src={avatarSrc} alt={displayName} initials={getUserInitials(user)} size="sm" />
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-medium truncate">{displayName}</p>
                    {user?.role !== 'admin' && (
                      <img
                        src={profileIdVerified ? verifiedIcon : unverifiedIcon}
                        alt={profileIdVerified ? 'Vérifié' : 'Non vérifié'}
                        className="h-3 w-3 flex-shrink-0"
                        title={profileIdVerified ? 'Profil vérifié' : 'Profil non vérifié'}
                      />
                    )}
                  </div>
                  {user?.role && (
                    <p className="text-xs text-muted-foreground truncate">
                      {user.role === 'automob' ? 'Auto-entrepreneur' : user.role === 'client' ? 'Client' : 'Administrateur'}
                    </p>
                  )}
                </div>
                <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', showProfileMenu && 'rotate-180')} />
              </button>

              {/* Menu déroulant */}
              {showProfileMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowProfileMenu(false)}
                  />
                  <div className="absolute bottom-full left-4 right-4 mb-2 z-50 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
                    <button
                      onClick={() => {
                        navigate(`/${user?.role}/profile`);
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors text-left"
                    >
                      <User className="h-4 w-4" />
                      <span>Mon Profil</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate(`/${user?.role}/settings`);
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors text-left"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Paramètres</span>
                    </button>
                    <div className="border-t border-border my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-accent transition-colors text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </>
    );
  };

  const desktopSidebar = (
    <aside
      className={cn(
        'hidden lg:flex lg:flex-col lg:border-r lg:border-border lg:bg-background lg:transition-all lg:duration-300',
        sidebarCollapsed ? 'lg:w-20' : 'lg:w-72'
      )}
      aria-label="Navigation principale"
    >
      <div className="flex h-16 items-center gap-3 px-4">
        {sidebarCollapsed ? (
          <div className="flex items-center justify-center w-full">
            <Logo compact className="h-10 w-10" />
          </div>
        ) : (
          <>
            <Logo className="h-10 w-auto" />
            <button
              type="button"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className="ml-auto rounded-lg p-2 hover:bg-accent transition-colors"
              aria-label="Fermer le menu"
            >
              <PanelLeftOpen className="h-5 w-5" />
            </button>
          </>
        )}
        {sidebarCollapsed && (
          <button
            type="button"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            className="absolute -right-3 top-6 rounded-full p-1.5 bg-background border border-border shadow-md hover:bg-accent transition-colors z-10"
            aria-label="Ouvrir le menu"
          >
            <PanelRightOpen className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {renderNavigation(sidebarCollapsed)}
      </div>
      {renderSidebarFooter(sidebarCollapsed)}
    </aside>
  );

  const mobileSidebar = mobileSidebarOpen ? (
    <div className="lg:hidden">
      <div
        className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
        onClick={() => setMobileSidebarOpen(false)}
      />
      <aside className="fixed inset-y-0 left-0 z-50 flex h-screen w-72 flex-col border-r border-border bg-background shadow-lg">
        <div className="flex h-16 items-center gap-3 px-4">
          <Logo className="h-10 w-auto" />
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-muted/80"
            aria-label="Fermer la navigation"
          >
            <PanelLeftOpen className="h-4 w-4 rotate-180" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {renderNavigation(false)}
        </div>
        {renderSidebarFooter(false)}
      </aside>
    </div>
  ) : null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-muted/30">
      {desktopSidebar}
      {mobileSidebar}

      <div className="flex flex-1 flex-col overflow-y-auto dashboard-scroll-container bg-muted/30">
        {/* Barre sticky globale - apparaît au scroll */}
        {isHeaderSticky && (
          <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b border-border px-4 py-4 sm:px-6">
            {renderHeaderControls()}
          </div>
        )}

        {/* Contenu principal avec scroll général */}
        <main className="flex-1 px-4 sm:px-6">
          <div className="mx-auto w-full max-w-7xl">
            {/* Bloc contenu encapsulé */}
            <div className="border border-border bg-card shadow-sm rounded-[22px] overflow-hidden flex flex-col my-6">
              {/* Barre de contrôles initiale - visible seulement en haut */}
              {!isHeaderSticky && (
                <div className="border-b border-border px-4 py-4 sm:px-6">
                  {renderHeaderControls()}
                </div>
              )}

              {/* Titre et description */}
              <div className="bg-card px-4 py-4 sm:px-6">
                <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{title}</h1>
                {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
              </div>

              {/* Contenu */}
              <section className="px-4 py-6 sm:px-6">
                {children}
              </section>
            </div>
          </div>
        </main>
      </div>

      {/* Popup de vérification d'identité */}
      {showIdentityPopup && (
        <IdentityVerificationPopup onClose={() => setShowIdentityPopup(false)} />
      )}

      {/* Popup de feedback pour clients et automobs */}
      <FeedbackPopup />

      {/* Demande de permission notifications */}
      <NotificationPermissionPrompt />
    </div>
  );
};
