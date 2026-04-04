import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// Composant wrapper pour garder la compatibilité avec l'ancienne API
export const AvatarWrapper = ({ src, alt, className, size = 'md', initials }) => {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24',
  };

  // Générer les initiales à partir du nom
  const getInitials = (name) => {
    if (!name) return '?';
    const names = name.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Helper pour obtenir la bonne URL d'image
  const getFullSrc = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const baseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : (apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl);
    return `${baseUrl}${url.startsWith('/') ? url : '/' + url}`;
  };

  return (
    <Avatar className={cn(sizes[size], className)}>
      <AvatarImage
        src={getFullSrc(src)}
        alt={alt || 'Avatar'}
        className="object-cover"
        style={{ imageRendering: 'high-quality' }}
      />
      <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
        {initials || getInitials(alt || '')}
      </AvatarFallback>
    </Avatar>
  );
};

export const getUserInitials = (user) => {
  if (!user) return '?';

  // Priorité à l'entreprise pour les clients
  if (user.role === 'client') {
    const clientName = user.profile?.company_name || user.company_name;
    if (clientName) {
      const names = clientName.trim().split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase();
      }
      return clientName.substring(0, 2).toUpperCase();
    }
  }

  // Priorité absolue au prénom/nom du profil
  if (user.profile?.first_name && user.profile?.last_name) {
    return (user.profile.first_name[0] + user.profile.last_name[0]).toUpperCase();
  }
  // Cas fallback : email ou nom
  const fallbackSource = user.role === 'client' ? (user.email || user.name || '?') : (user.name || user.email || '?');
  return fallbackSource.substring(0, 2).toUpperCase();
};

export default AvatarWrapper;
