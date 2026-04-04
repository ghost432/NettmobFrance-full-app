import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { authAPI } from '@/lib/api';
import { toast } from 'sonner';

const SocketContext = createContext(null);

// Extraire l'URL de base sans /api pour Socket.IO
const getSocketUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  // Retirer /api si présent à la fin
  return apiUrl.replace(/\/api$/, '');
};

const SOCKET_URL = getSocketUrl();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, updateUser } = useAuth();

  useEffect(() => {
    if (user) {
      console.log('🔌 Tentative de connexion Socket.IO à:', SOCKET_URL);
      
      const newSocket = io(SOCKET_URL, {
        transports: ['polling', 'websocket'],
        upgrade: true,
        withCredentials: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity,
        timeout: 20000,
        autoConnect: true
      });
      
      newSocket.on('connect', () => {
        console.log('✅ Socket connecté avec succès (ID:', newSocket.id + ')');
        newSocket.emit('join', user.id);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('🔌 Socket déconnecté:', reason);
        if (reason === 'io server disconnect') {
          // Le serveur a forcé la déconnexion, on reconnecte
          newSocket.connect();
        }
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('🔄 Socket reconnecté après', attemptNumber, 'tentative(s)');
      });

      newSocket.on('connect_error', (error) => {
        console.warn('⚠️ Erreur de connexion Socket:', error.message);
      });

      newSocket.on('reconnect_attempt', (attemptNumber) => {
        console.log('🔄 Tentative de reconnexion #' + attemptNumber);
      });

      newSocket.on('reconnect_error', (error) => {
        console.warn('⚠️ Erreur de reconnexion:', error.message);
      });

      newSocket.on('reconnect_failed', () => {
        console.error('❌ Échec de reconnexion Socket après plusieurs tentatives');
        console.log('💡 Vérifiez que le serveur backend est démarré sur', SOCKET_URL);
      });

      // Écouter les nouvelles notifications
      newSocket.on('new_notification', async (notification) => {
        console.log('🔔 [SocketContext] Nouvelle notification reçue:', notification);
        
        // 1. Afficher un toast amélioré
        const toastType = notification.type === 'success' ? 'success' :
                          notification.type === 'error' ? 'error' :
                          notification.type === 'warning' ? 'warning' : 'info';
        
        const toastTitle = notification.title || 'Nouvelle notification';
        const toastMessage = notification.message || '';
        
        // Préparer les options du toast
        const toastOptions = {
          description: toastMessage,
          duration: 6000
        };
        
        // Ajouter un bouton d'action si URL fournie
        if (notification.action_url) {
          toastOptions.action = {
            label: 'Voir',
            onClick: () => window.location.href = notification.action_url
          };
        }
        
        // Utiliser la méthode appropriée de toast
        if (toastType === 'success') {
          toast.success(toastTitle, toastOptions);
        } else if (toastType === 'error') {
          toast.error(toastTitle, toastOptions);
        } else if (toastType === 'warning') {
          toast.warning(toastTitle, toastOptions);
        } else {
          toast.info(toastTitle, toastOptions);
        }
        
        // 2. Incrémenter le compteur de notifications non lues
        setUnreadCount(prev => prev + 1);
        
        // 3. Notification système (browser)
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            const systemNotification = new Notification(toastTitle, {
              body: toastMessage,
              icon: '/favicon-1.png',
              badge: '/favicon-1.png',
              tag: `notification-${notification.id || Date.now()}`,
              requireInteraction: false,
              vibrate: [200, 100, 200]
            });
            
            // Clic sur la notification système
            systemNotification.onclick = () => {
              window.focus();
              if (notification.action_url) {
                window.location.href = notification.action_url;
              }
              systemNotification.close();
            };
            
            console.log('✅ Notification système affichée');
          } catch (error) {
            console.warn('⚠️ Notification système échouée:', error);
          }
        }
        
        // 4. Vibration sur appareils mobiles
        if ('vibrate' in navigator) {
          const vibratePattern = notification.type === 'success' ? [100, 50, 100] :
                                notification.type === 'error' ? [200, 100, 200, 100, 200] :
                                [100];
          navigator.vibrate(vibratePattern);
        }

        // Si la notification concerne la vérification d'identité, rafraîchir le profil
        try {
          const isVerificationCategory = notification?.category === 'verification';
          const title = (notification?.title || '').toLowerCase();
          const isIdentityUpdate = title.includes('identité vérifiée') || title.includes('vérification révoquée') || title.includes('vérification refusée');
          if (isVerificationCategory || isIdentityUpdate) {
            const { data } = await authAPI.getProfile();
            const userWithProfile = { ...data.user, profile: data.profile };
            updateUser(userWithProfile);
          }
        } catch (e) {
          console.warn('Impossible de rafraîchir le profil après notification:', e?.message);
        }
      });

      setSocket(newSocket);

      return () => {
        if (newSocket && newSocket.connected) {
          console.log('🔌 Déconnexion propre du socket...');
          newSocket.disconnect();
        }
      };
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, unreadCount, setUnreadCount }}>
      {children}
    </SocketContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte Socket
export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
}
