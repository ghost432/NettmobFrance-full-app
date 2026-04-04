// Service spécialisé pour les notifications push des utilisateurs déconnectés
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';

class PushNotificationService {
  constructor() {
    this.offlineQueue = new Map();
    this.maxRetries = 10;
    this.retryDelay = 5000; // 5 secondes
    this.isServiceWorkerRegistered = false;
    this.init();
  }

  /**
   * Initialiser le service de notifications push
   */
  async init() {
    try {
      // Vérifier si les service workers sont supportés
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        await this.registerServiceWorker();
        console.log('🔔 Service de notifications push initialisé');
      } else {
        console.warn('⚠️ Service Workers ou Push API non supportés');
      }
    } catch (error) {
      console.error('❌ Erreur initialisation service push:', error);
    }
  }

  /**
   * Enregistrer le service worker
   */
  async registerServiceWorker() {
    try {
      if (this.isServiceWorkerRegistered) return;

      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker enregistré:', registration);
      this.isServiceWorkerRegistered = true;
      
      // Gérer les messages du service worker
      navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));
      
    } catch (error) {
      console.error('❌ Erreur enregistrement Service Worker:', error);
    }
  }

  /**
   * Gérer les messages du service worker
   */
  handleServiceWorkerMessage(event) {
    console.log('📨 Message du Service Worker:', event.data);
    
    if (event.data.type === 'notification-received') {
      // Notification reçue même hors ligne
      console.log('📱 Notification reçue hors ligne:', event.data.payload);
    }
  }

  /**
   * Forcer l'envoi de notifications push aux utilisateurs déconnectés
   * @param {string} missionId 
   * @param {Object} options 
   */
  async forcePushToOfflineUsers(missionId, options = {}) {
    console.log('📱 FORCE PUSH NOTIFICATIONS HORS LIGNE:', {
      missionId,
      options,
      timestamp: new Date().toISOString()
    });

    // Pour l'instant, utiliser uniquement la méthode fallback
    // jusqu'à ce que les endpoints backend soient implémentés
    console.log('🔄 Utilisation méthode fallback pour notifications hors ligne');
    
    return await this.fallbackOfflineNotifications(missionId, options);
  }

  /**
   * Méthode de fallback pour les notifications hors ligne
   */
  async fallbackOfflineNotifications(missionId, options) {
    console.log('🔄 FALLBACK NOTIFICATIONS HORS LIGNE pour mission:', missionId);
    
    try {
      // Utiliser l'ancien endpoint avec options renforcées
      const fallbackResponse = await api.post(`/missions/${missionId}/force-notifications`, {
        send_to_offline: true,
        force_all: true,
        include_push: true,
        include_email: true,
        offline_priority: 'high',
        retry_offline: true,
        store_offline: true,
        ...options
      });

      console.log('🔄 RÉSULTAT FALLBACK:', fallbackResponse.data);
      return {
        success: true,
        fallback_used: true,
        notifications_sent: fallbackResponse.data.notifications_sent || 0
      };

    } catch (fallbackError) {
      console.error('❌ FALLBACK ÉCHOUÉ:', fallbackError);
      return {
        success: false,
        error: fallbackError.message,
        fallback_failed: true
      };
    }
  }

  /**
   * Programmer des tentatives répétées pour les utilisateurs hors ligne
   */
  scheduleOfflineRetries(missionId, failedUsers, options) {
    const retryKey = `offline_${missionId}`;
    const currentRetries = this.offlineQueue.get(retryKey) || 0;

    if (currentRetries < this.maxRetries) {
      console.log(`⏰ PROGRAMMATION RETRY HORS LIGNE ${currentRetries + 1}/${this.maxRetries}:`, {
        missionId,
        failedUsers: failedUsers.length,
        retryIn: (this.retryDelay * (currentRetries + 1)) / 1000 + 's'
      });

      setTimeout(() => {
        this.offlineQueue.set(retryKey, currentRetries + 1);
        this.retryOfflineNotifications(missionId, failedUsers, options);
      }, this.retryDelay * (currentRetries + 1));
    } else {
      console.warn(`⚠️ MAX RETRIES ATTEINT pour notifications hors ligne mission ${missionId}`);
      this.offlineQueue.delete(retryKey);
    }
  }

  /**
   * Retry des notifications pour utilisateurs spécifiques
   */
  async retryOfflineNotifications(missionId, failedUsers, options) {
    console.log('🔄 RETRY NOTIFICATIONS HORS LIGNE:', { missionId, users: failedUsers.length });
    
    try {
      const retryResponse = await api.post(`/notifications/retry-offline`, {
        mission_id: missionId,
        target_users: failedUsers,
        ...options
      });

      console.log('🔄 RÉSULTAT RETRY HORS LIGNE:', retryResponse.data);
      
      // S'il y a encore des échecs, reprogrammer
      if (retryResponse.data.failed_notifications > 0) {
        this.scheduleOfflineRetries(missionId, retryResponse.data.failed_users, options);
      }

    } catch (error) {
      console.error('❌ ERREUR RETRY HORS LIGNE:', error);
    }
  }

  /**
   * Stocker localement une notification pour un utilisateur spécifique
   */
  storeOfflineNotification(userId, missionId, missionTitle) {
    try {
      console.log('💾 STOCKAGE LOCAL NOTIFICATION:', { userId, missionId, missionTitle });
      
      this.storeNotificationLocally(userId, {
        type: 'new_mission',
        mission_id: missionId,
        mission_title: missionTitle,
        title: '🎯 Nouvelle Mission NettmobFrance',
        body: `Mission: ${missionTitle}`,
        icon: '/icons/mission-notification.png',
        tag: `mission-${missionId}`,
        stored_at: Date.now(),
        expires_at: Date.now() + 86400000 // 24h
      });
      
      console.log('💾 Notification stockée localement pour utilisateur:', userId);
      return true;
    } catch (error) {
      console.error('❌ ERREUR STOCKAGE NOTIFICATION LOCALE:', error);
      return false;
    }
  }

  /**
   * Vérifier et envoyer les notifications en attente lors de la reconnexion
   */
  async checkPendingNotifications(userId) {
    try {
      console.log('🔍 VÉRIFICATION NOTIFICATIONS EN ATTENTE pour utilisateur:', userId);
      
      // Pour l'instant, utiliser une approche locale avec localStorage
      // En attendant que les endpoints backend soient implémentés
      const storedNotifications = this.getStoredNotifications(userId);
      
      if (storedNotifications.length > 0) {
        console.log('📨 NOTIFICATIONS STOCKÉES LOCALEMENT TROUVÉES:', storedNotifications.length);
        
        // Envoyer toutes les notifications stockées
        for (const notification of storedNotifications) {
          await this.sendStoredNotification(userId, notification);
        }

        // Nettoyer les notifications envoyées
        this.clearStoredNotifications(userId);

        toast.info(`📨 ${storedNotifications.length} notification(s) reçue(s) pendant votre absence`);
      } else {
        console.log('✅ Aucune notification en attente pour utilisateur:', userId);
      }

    } catch (error) {
      console.error('❌ ERREUR VÉRIFICATION NOTIFICATIONS EN ATTENTE:', error);
    }
  }

  /**
   * Récupérer les notifications stockées localement
   */
  getStoredNotifications(userId) {
    try {
      const stored = localStorage.getItem(`offline_notifications_${userId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Erreur lecture notifications stockées:', error);
      return [];
    }
  }

  /**
   * Stocker une notification localement
   */
  storeNotificationLocally(userId, notificationData) {
    try {
      const existing = this.getStoredNotifications(userId);
      const updated = [...existing, {
        ...notificationData,
        stored_at: Date.now(),
        id: Date.now() + Math.random()
      }];
      
      localStorage.setItem(`offline_notifications_${userId}`, JSON.stringify(updated));
      console.log('💾 Notification stockée localement pour utilisateur:', userId);
    } catch (error) {
      console.error('❌ Erreur stockage notification locale:', error);
    }
  }

  /**
   * Nettoyer les notifications stockées
   */
  clearStoredNotifications(userId) {
    try {
      localStorage.removeItem(`offline_notifications_${userId}`);
      console.log('🧹 Notifications stockées nettoyées pour utilisateur:', userId);
    } catch (error) {
      console.error('❌ Erreur nettoyage notifications:', error);
    }
  }

  /**
   * Envoyer une notification stockée
   */
  async sendStoredNotification(userId, notificationData) {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(notificationData.title || 'Nouvelle mission', {
          body: notificationData.body || 'Une mission vous attend',
          icon: notificationData.icon || '/icons/mission-notification.png',
          tag: notificationData.tag || 'mission-notification',
          requireInteraction: true
        });

        notification.onclick = () => {
          window.focus();
          if (notificationData.mission_id) {
            window.location.href = `/automob/missions/${notificationData.mission_id}`;
          }
          notification.close();
        };

        console.log('📱 Notification stockée envoyée:', notificationData);
      }
    } catch (error) {
      console.error('❌ Erreur envoi notification stockée:', error);
    }
  }

  /**
   * Demander la permission pour les notifications
   */
  async requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      console.log('🔔 Permission notifications:', permission);
      return permission === 'granted';
    }
    return false;
  }

  /**
   * Vérifier si les notifications sont activées
   */
  areNotificationsEnabled() {
    return 'Notification' in window && Notification.permission === 'granted';
  }
}

// Instance singleton
const pushNotificationService = new PushNotificationService();

export default pushNotificationService;

// Fonctions utilitaires exportées
export const forcePushToOfflineUsers = (missionId, options) =>
  pushNotificationService.forcePushToOfflineUsers(missionId, options);

export const checkPendingNotifications = (userId) =>
  pushNotificationService.checkPendingNotifications(userId);

export const requestNotificationPermission = () =>
  pushNotificationService.requestNotificationPermission();
