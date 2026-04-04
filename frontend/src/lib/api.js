import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// Strip '/api' suffix to get the root domain for static assets (images, videos)
const BASE_URL = API_URL.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000, // 60 secondes - Fix timeout login avec DB lente
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    // Debug discret pour confirmer l'envoi du token
    if (config.url.includes('unread-count')) {
      console.log(`📡 [API] Token ajouté pour ${config.url}`);
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Gérer les erreurs d'authentification (401) et de token invalide/expiré (403)
    if (error.response?.status === 401 || error.response?.status === 403) {
      const errorUrl = error.config?.url || '';
      const currentPath = window.location.pathname;

      // Ne rediriger que si on n'est pas déjà sur une page publique
      const publicPaths = [
        '/', '/entreprise', '/login', '/register', '/account-type',
        '/verify-email', '/verify-login', '/forgot-password',
        '/register/automob', '/register/client', '/tutoriels',
        '/entreprise/tutoriels', '/faq', '/entreprise/faq',
        '/blog', '/entreprise/blog', '/contact', '/a-propos',
        '/secteurs', '/entreprise/secteurs', '/fonctionnement',
        '/entreprise/fonctionnement'
      ];

      const isPublicPage = publicPaths.some(path =>
        currentPath === path || currentPath.startsWith(path + '/')
      );

      // On ignore s'il s'agit de requêtes en arrière-plan non-critiques pour la session entière
      const isBackgroundRequest =
        errorUrl.includes('/fcm-token') ||
        errorUrl.includes('/chat/unread-count') ||
        errorUrl.includes('/notifications/unread-count') ||
        errorUrl.includes('/users/notifications');

      if (!isPublicPage && !isBackgroundRequest) {
        // Page protégée — on nettoie et on redirige
        console.error('🚫 [API] 401 DÉTECTÉ par URL:', errorUrl, 'Status:', error.response?.status);
        alert(`Déconnexion provoquée par: ${errorUrl}. Status: ${error.response?.status}`);

        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Retard pour laisser le temps de lire l'alerte
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      }
      // Page publique — on ignore silencieusement (AuthContext gère via /auth/me)
    }
    return Promise.reject(error);
  }
);

export default api;

/**
 * Construit l'URL complète pour un asset (image, vidéo) stocké dans le dossier uploads
 * @param {string} path - Chemin relatif du fichier (ex: '/profile/avatar.jpg')
 * @returns {string} URL complète
 */
export const getAssetUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
};

/**
 * Alias pour getAssetUrl spécialisé pour les documents
 */
export const getFileUrl = getAssetUrl;

export { BASE_URL };

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000, // 60 secondes pour l'inscription (géocodage + emails + notifications)
  }),
  getProfile: () => api.get('/auth/me'),
};

export const missionAPI = {
  getAll: (params) => api.get('/missions', { params }),
  getById: (id) => api.get(`/missions/${id}`),
  create: (data) => api.post('/missions', data),
  apply: (id, data) => api.post(`/missions/${id}/apply`, data),
  updateApplication: (missionId, applicationId, data) =>
    api.patch(`/missions/${missionId}/applications/${applicationId}`, data),
  getNearby: (lat, lng, radius) => api.get(`/missions/nearby/${lat}/${lng}?radius=${radius}`),
};

export const chatAPI = {
  getConversations: () => api.get('/chat/conversations'),
  createConversation: (data) => api.post('/chat/conversations', data),
  getMessages: (conversationId) => api.get(`/chat/conversations/${conversationId}/messages`),
  sendMessage: (conversationId, data) => api.post(`/chat/conversations/${conversationId}/messages`, data),
  getUnreadCount: () => api.get('/chat/unread-count'),
};

export const profileAPI = {
  updateEmail: (data) => api.put('/users/profile', data),
  updateAutomobProfile: (data) => api.put('/users/profile/automob', data),
  updateClientProfile: (data) => api.put('/users/profile/client', data),
  uploadAssets: (formData) => api.post('/users/profile/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getSecteurs: () => api.get('/secteurs'),
  getCompetences: () => api.get('/competences'),
};

export const usersAPI = {
  getHistory: () => api.get('/users/history'),
  getHistoryById: (id) => api.get(`/users/user/${id}/history`),
};

export const availabilitiesAPI = {
  getAll: () => api.get('/availabilities'),
  create: (data) => api.post('/availabilities', data),
  update: (id, data) => api.put(`/availabilities/${id}`, data),
  delete: (id) => api.delete(`/availabilities/${id}`),
};

export const documentsAPI = {
  getAll: () => api.get('/documents'),
  upload: (formData) => api.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/documents/${id}`),
};
