// Service de notifications persistantes pour les missions
import api from '@/lib/api';
import pushNotificationService from './pushNotificationService';

class NotificationService {
  constructor() {
    this.retryQueue = new Map();
    this.maxRetries = 5;
    this.retryDelay = 3000; // 3 secondes
  }

  /**
   * Force l'envoi de notifications pour une mission, même aux auto-mobs déconnectés
   * @param {string} missionId - ID de la mission
   * @param {Object} options - Options de notification
   */
  async forceNotifications(missionId, options = {}) {
    
    // Log détaillé du début
    console.log('🔔 DÉBUT FORÇAGE NOTIFICATIONS:', {
      missionId,
      options,
      timestamp: new Date().toISOString()
    });
    const defaultOptions = {
      send_to_offline: true,
      notification_type: 'new_mission',
      force_all: true,
      include_push: true,
      include_email: true,
      include_sms: false,
      ...options
    };

    try {
      console.log(`🔔 Envoi de notifications forcées pour mission ${missionId}`);
      
      // 1. Envoi des notifications standards
      const response = await api.post(`/missions/${missionId}/force-notifications`, defaultOptions);
      
      const { notifications_sent = 0, notifications_pending = 0, automobs_notified = 0 } = response.data;
      
      // 2. Envoi spécialisé des notifications push pour utilisateurs hors ligne
      let offlineResults = { offline_notifications_sent: 0 };
      if (defaultOptions.send_to_offline && defaultOptions.include_push) {
        try {
          console.log('📱 LANCEMENT NOTIFICATIONS PUSH HORS LIGNE...');
          offlineResults = await pushNotificationService.forcePushToOfflineUsers(missionId, {
            priority: 'high',
            store_for_reconnection: true,
            immediate_push: true
          });
          console.log('📱 RÉSULTAT NOTIFICATIONS HORS LIGNE:', offlineResults);
        } catch (offlineError) {
          console.error('❌ ERREUR NOTIFICATIONS HORS LIGNE:', offlineError);
          offlineResults = { offline_notifications_sent: 0, offline_error: offlineError.message };
        }
      }
      
      console.log('🔔 RÉSULTAT NOTIFICATIONS COMPLET:', {
        missionId,
        notifications_sent,
        notifications_pending,
        automobs_notified,
        offline_notifications_sent: offlineResults.offline_notifications_sent,
        total_notifications: notifications_sent + (offlineResults.offline_notifications_sent || 0),
        responseData: response.data,
        offlineResults,
        timestamp: new Date().toISOString()
      });
      
      // Si des notifications sont en attente, programmer une vérification
      if (notifications_pending > 0) {
        this.scheduleRetry(missionId, options);
      }
      
      return {
        success: true,
        notifications_sent,
        notifications_pending,
        automobs_notified,
        offline_notifications_sent: offlineResults.offline_notifications_sent || 0,
        total_notifications: notifications_sent + (offlineResults.offline_notifications_sent || 0),
        offline_results: offlineResults
      };
    } catch (error) {
      console.error(`❌ Erreur envoi notifications mission ${missionId}:`, error);
      
      // Programmer un retry si l'erreur n'est pas critique
      if (error.response?.status !== 404 && error.response?.status !== 403) {
        this.scheduleRetry(missionId, options);
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Programmer un retry pour les notifications échouées
   */
  scheduleRetry(missionId, options) {
    const retryKey = `mission_${missionId}`;
    const currentRetries = this.retryQueue.get(retryKey) || 0;
    
    if (currentRetries < this.maxRetries) {
      console.log(`⏰ Programmation retry ${currentRetries + 1}/${this.maxRetries} pour mission ${missionId}`);
      
      setTimeout(() => {
        this.retryQueue.set(retryKey, currentRetries + 1);
        this.forceNotifications(missionId, options);
      }, this.retryDelay * (currentRetries + 1)); // Délai croissant
    } else {
      console.warn(`⚠️ Max retries atteint pour mission ${missionId}`);
      this.retryQueue.delete(retryKey);
    }
  }

  /**
   * Vérifier le statut des notifications d'une mission
   */
  async checkNotificationStatus(missionId) {
    try {
      const response = await api.get(`/missions/${missionId}/notification-status`);
      return response.data;
    } catch (error) {
      console.error(`Erreur vérification statut notifications mission ${missionId}:`, error);
      return null;
    }
  }

  /**
   * Envoyer des notifications push même aux utilisateurs hors ligne
   */
  async sendOfflineNotifications(missionId, automobIds = []) {
    try {
      const response = await api.post(`/missions/${missionId}/offline-notifications`, {
        automob_ids: automobIds,
        store_for_later: true, // Stocker pour quand ils se reconnectent
        push_immediately: true // Essayer push immédiat même si hors ligne
      });
      
      console.log(`📱 Notifications hors ligne envoyées pour mission ${missionId}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur notifications hors ligne mission ${missionId}:`, error);
      return null;
    }
  }

  /**
   * Nettoyer les retries terminés
   */
  clearCompletedRetries() {
    // Cette méthode peut être appelée périodiquement pour nettoyer
    console.log('🧹 Nettoyage des retries terminés');
  }
}

// Instance singleton
const notificationService = new NotificationService();

export default notificationService;

// Fonctions utilitaires exportées
export const forceNotifications = (missionId, options) => 
  notificationService.forceNotifications(missionId, options);

export const checkNotificationStatus = (missionId) => 
  notificationService.checkNotificationStatus(missionId);

export const sendOfflineNotifications = (missionId, automobIds) => 
  notificationService.sendOfflineNotifications(missionId, automobIds);
