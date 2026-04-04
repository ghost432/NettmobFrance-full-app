// Service de test pour simuler les notifications offline
import pushNotificationService from './pushNotificationService';
import { toast } from '@/components/ui/toast';

class TestNotificationService {
  /**
   * Tester les notifications push pour un utilisateur spécifique
   */
  async testPushNotification(userId, missionId, missionTitle) {
    console.log('🧪 TEST NOTIFICATION PUSH:', { userId, missionId, missionTitle });
    
    try {
      // 1. Vérifier les permissions
      const hasPermission = pushNotificationService.areNotificationsEnabled();
      
      if (!hasPermission) {
        const granted = await pushNotificationService.requestNotificationPermission();
        if (!granted) {
          toast.error('❌ Permissions de notifications requises pour le test');
          return { success: false, error: 'Permissions refusées' };
        }
      }

      // 2. Envoyer une notification de test immédiate
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification('🧪 Test Notification - NettmobFrance', {
          body: `Test: ${missionTitle}`,
          icon: '/icons/mission-notification.png',
          tag: `test-mission-${missionId}`,
          requireInteraction: true,
          actions: [
            {
              action: 'view',
              title: 'Voir Test',
              icon: '/icons/view.png'
            }
          ]
        });

        notification.onclick = () => {
          console.log('🧪 Test notification cliquée');
          window.focus();
          notification.close();
        };

        setTimeout(() => {
          notification.close();
        }, 10000); // Auto-close après 10s
      }

      // 3. Stocker une notification pour test de reconnexion
      pushNotificationService.storeOfflineNotification(userId, missionId, `TEST: ${missionTitle}`);

      toast.success('🧪 Test notification envoyé ! Regardez en haut à droite de votre écran.');
      
      return {
        success: true,
        message: 'Test notification envoyé avec succès'
      };

    } catch (error) {
      console.error('❌ ERREUR TEST NOTIFICATION:', error);
      toast.error('❌ Erreur lors du test de notification');
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Simuler une publication de mission avec notifications hors ligne
   */
  async simulateMissionPublication(userId, missionData) {
    console.log('🎭 SIMULATION PUBLICATION MISSION:', { userId, missionData });
    
    try {
      const missionId = Date.now(); // ID simulé
      const missionTitle = missionData.title || 'Mission Test';

      // 1. Simuler l'envoi de notifications standards
      console.log('📤 Simulation notifications standards...');
      toast.info('📤 Simulation envoi notifications...');

      // 2. Simuler l'envoi de notifications hors ligne
      setTimeout(() => {
        console.log('📱 Simulation notifications hors ligne...');
        
        // Simuler le stockage pour utilisateurs hors ligne
        const offlineUsers = [
          { id: userId, email: 'test@example.com' },
          { id: userId + 1, email: 'test2@example.com' }
        ];

        offlineUsers.forEach(user => {
          pushNotificationService.storeOfflineNotification(
            user.id, 
            missionId, 
            missionTitle
          );
        });

        toast.success(`📱 ${offlineUsers.length} notifications stockées pour utilisateurs hors ligne`);
      }, 1000);

      // 3. Envoyer une notification immédiate si permissions accordées
      setTimeout(async () => {
        await this.testPushNotification(userId, missionId, missionTitle);
      }, 2000);

      return {
        success: true,
        missionId,
        offline_users_notified: 2,
        stored_notifications: 2
      };

    } catch (error) {
      console.error('❌ ERREUR SIMULATION:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Tester la récupération des notifications en attente
   */
  async testPendingNotifications(userId) {
    console.log('🔍 TEST RÉCUPÉRATION NOTIFICATIONS EN ATTENTE:', userId);
    
    try {
      // Simuler quelques notifications en attente
      const testNotifications = [
        {
          mission_id: Date.now(),
          mission_title: 'Mission Test 1',
          title: '🎯 Nouvelle Mission NettmobFrance',
          body: 'Mission Test 1 disponible',
          stored_at: Date.now() - 3600000 // Il y a 1h
        },
        {
          mission_id: Date.now() + 1,
          mission_title: 'Mission Test 2', 
          title: '🎯 Nouvelle Mission NettmobFrance',
          body: 'Mission Test 2 disponible',
          stored_at: Date.now() - 1800000 // Il y a 30min
        }
      ];

      // Stocker les notifications de test
      testNotifications.forEach(notification => {
        pushNotificationService.storeNotificationLocally(userId, notification);
      });

      toast.info('📨 Notifications de test stockées. Rechargez la page pour les voir.');

      // Lancer immédiatement la vérification
      setTimeout(() => {
        pushNotificationService.checkPendingNotifications(userId);
      }, 1000);

      return {
        success: true,
        test_notifications_created: testNotifications.length
      };

    } catch (error) {
      console.error('❌ ERREUR TEST NOTIFICATIONS EN ATTENTE:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Nettoyer toutes les données de test
   */
  cleanupTestData(userId) {
    try {
      pushNotificationService.clearStoredNotifications(userId);
      toast.info('🧹 Données de test nettoyées');
      console.log('🧹 Nettoyage données test terminé pour utilisateur:', userId);
      return { success: true };
    } catch (error) {
      console.error('❌ ERREUR NETTOYAGE:', error);
      return { success: false, error: error.message };
    }
  }
}

// Instance singleton
const testNotificationService = new TestNotificationService();

export default testNotificationService;

// Fonctions utilitaires exportées
export const testPushNotification = (userId, missionId, missionTitle) =>
  testNotificationService.testPushNotification(userId, missionId, missionTitle);

export const simulateMissionPublication = (userId, missionData) =>
  testNotificationService.simulateMissionPublication(userId, missionData);

export const testPendingNotifications = (userId) =>
  testNotificationService.testPendingNotifications(userId);

export const cleanupTestData = (userId) =>
  testNotificationService.cleanupTestData(userId);
