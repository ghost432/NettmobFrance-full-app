import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

/**
 * Hook pour charger et afficher le profil automob
 * Retourne le profil complet et le nom d'affichage
 */
export const useAutomobProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/automob/profile');
      setProfile(response.data.profile);
    } catch (error) {
      console.error('Erreur chargement profil automob:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayName = useMemo(() => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return user?.email || 'Automob';
  }, [profile, user]);

  return {
    profile,
    loading,
    displayName,
    refreshProfile: fetchProfile
  };
};
