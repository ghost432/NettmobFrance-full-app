import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { authAPI } from '../lib/api';
import { toast } from '../components/ui/toast';
import pushNotificationService from '../utils/pushNotificationService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  const navigate = useNavigate();

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Déconnexion réussie');
    // Navigate to homepage instead of leaving ProtectedRoute redirect user to /login
    navigate('/');
  }, [navigate]);


  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      // Charger immédiatement l'utilisateur depuis localStorage
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setInitialLoad(false);

      // Puis mettre à jour en arrière-plan avec les données fraîches
      authAPI.getProfile()
        .then(({ data }) => {
          // Inclure le profil avec l'utilisateur
          const userWithProfile = {
            ...data.user,
            profile: data.profile
          };
          setUser(userWithProfile);
          localStorage.setItem('user', JSON.stringify(userWithProfile));

          // Vérifier les notifications en attente lors de la reconnexion
          if (userWithProfile.id) {
            console.log('🔔 Vérification notifications en attente pour utilisateur:', userWithProfile.id);
            pushNotificationService.checkPendingNotifications(userWithProfile.id);
          }
        })
        .catch((error) => {
          // Ne déconnecter que si c'est vraiment une erreur d'auth (pas un timeout réseau)
          if (error.response?.status === 401 || error.response?.status === 403) {
            console.warn('🔒 [AuthContext] Token invalide, déconnexion');
            logout();
          } else {
            console.warn('🔒 [AuthContext] Erreur réseau lors du chargement du profil, conservation du token:', error.message);
            // En cas d'erreur réseau, on garde l'utilisateur connecté avec les données locales
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [logout]);

  const login = useCallback(async (credentials) => {
    const { data } = await authAPI.login(credentials);

    // Si OTP requis, ne pas connecter l'utilisateur
    if (data.requiresOTP || data.requiresVerification) {
      return data;
    }

    // Sinon, connexion normale
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);

      // Vérifier les notifications en attente lors de la première connexion
      if (data.user?.id) {
        console.log('🔔 Première connexion - Vérification notifications en attente:', data.user.id);
        setTimeout(() => {
          pushNotificationService.checkPendingNotifications(data.user.id);
        }, 2000); // Attendre 2s pour que l'utilisateur soit bien connecté
      }
    }

    return data;
  }, []);

  const register = useCallback(async (formData) => {
    const { data } = await authAPI.register(formData);
    return data;
  }, []);

  const updateUser = useCallback((updatedUser) => {
    if (updatedUser) {
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } else {
      localStorage.removeItem('user');
      setUser(null);
    }
  }, []);

  // Fonction pour définir directement le token et l'utilisateur (utilisée après vérification OTP)
  const setAuthData = useCallback((token, userData) => {
    if (token && userData) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, initialLoad, login, register, logout, updateUser, setAuthData }),
    [user, loading, initialLoad, login, register, logout, updateUser, setAuthData]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte d'authentification
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
