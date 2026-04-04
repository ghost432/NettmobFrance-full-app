// Service d'urgence pour les missions qui ne s'affichent pas malgré la publication
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';

class EmergencyMissionService {
  constructor() {
    this.emergencyQueue = new Map();
  }

  /**
   * Analyser et diagnostiquer un problème de mission manquante
   * @param {string} missionTitle 
   * @param {string} clientEmail 
   * @param {Object} formData - Données originales de la mission
   */
  async diagnoseMissingMission(missionTitle, clientEmail, formData = {}) {
    console.log('🚨 DIAGNOSTIC D\'URGENCE MISSION MANQUANTE:', {
      missionTitle,
      clientEmail,
      formData: formData ? Object.keys(formData) : 'non fourni',
      timestamp: new Date().toISOString()
    });

    try {
      // 1. Vérifier les logs backend pour cette mission
      const logsResponse = await api.post('/admin/missions/diagnostic', {
        mission_title: missionTitle,
        client_email: clientEmail,
        search_timeframe: 60 // Dernières 60 minutes
      });

      console.log('🔍 LOGS BACKEND DIAGNOSTIC:', logsResponse.data);

      // 2. Vérifier la base de données directement
      const dbCheckResponse = await api.post('/admin/missions/db-check', {
        mission_title: missionTitle,
        client_email: clientEmail,
        include_deleted: true,
        include_pending: true
      });

      console.log('🗄️ VÉRIFICATION BASE DE DONNÉES:', dbCheckResponse.data);

      // 3. Analyser les tentatives de publication récentes
      const publicationAttemptsResponse = await api.get('/admin/publication-attempts', {
        params: {
          client_email: clientEmail,
          since: new Date(Date.now() - 3600000).toISOString() // Dernière heure
        }
      });

      console.log('📊 TENTATIVES DE PUBLICATION:', publicationAttemptsResponse.data);

      return {
        success: true,
        logs: logsResponse.data,
        dbCheck: dbCheckResponse.data,
        publicationAttempts: publicationAttemptsResponse.data,
        recommendations: this.generateRecommendations(
          logsResponse.data,
          dbCheckResponse.data,
          publicationAttemptsResponse.data
        )
      };

    } catch (error) {
      console.error('❌ ERREUR DIAGNOSTIC D\'URGENCE:', error);
      return {
        success: false,
        error: error.message,
        fallbackActions: [
          'Republier la mission avec un titre légèrement différent',
          'Vérifier la connexion réseau',
          'Contacter le support technique'
        ]
      };
    }
  }

  /**
   * Forcer la recréation d'une mission côté backend
   * @param {Object} originalFormData - Données de la mission originale
   * @param {string} clientEmail 
   */
  async forceRecreateМission(originalFormData, clientEmail) {
    console.log('🔄 FORCE RECRÉATION MISSION:', {
      originalTitle: originalFormData.mission_name,
      clientEmail,
      timestamp: new Date().toISOString()
    });

    try {
      // Appel spécial au backend pour forcer la recréation
      const response = await api.post('/missions/force-recreate', {
        ...originalFormData,
        client_email: clientEmail,
        force_mode: true,
        emergency_creation: true,
        original_attempt_time: new Date().toISOString()
      });

      console.log('✅ MISSION RECRÉÉE AVEC SUCCÈS:', response.data);
      
      toast.success(`🔄 Mission "${originalFormData.mission_name}" recréée avec succès !`);

      return {
        success: true,
        mission: response.data.mission,
        notifications: response.data.notifications
      };

    } catch (error) {
      console.error('❌ ERREUR FORCE RECRÉATION:', error);
      toast.error(`❌ Échec de la recréation de la mission. Erreur: ${error.message}`);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Synchroniser manuellement une mission avec la base de données
   * @param {string} missionTitle 
   * @param {string} clientEmail 
   */
  async forceSyncMission(missionTitle, clientEmail) {
    console.log('🔄 SYNCHRONISATION FORCÉE:', { missionTitle, clientEmail });

    try {
      const response = await api.post('/missions/force-sync', {
        mission_title: missionTitle,
        client_email: clientEmail,
        force_refresh_cache: true,
        regenerate_notifications: true
      });

      console.log('✅ SYNCHRONISATION RÉUSSIE:', response.data);
      
      if (response.data.mission) {
        toast.success(`🔄 Mission "${missionTitle}" synchronisée ! ${response.data.notifications_sent || 0} notifications envoyées.`);
        return {
          success: true,
          mission: response.data.mission,
          notificationsSent: response.data.notifications_sent
        };
      } else {
        toast.warning(`⚠️ Synchronisation partielle pour "${missionTitle}".`);
        return {
          success: false,
          partialSync: true,
          details: response.data
        };
      }

    } catch (error) {
      console.error('❌ ERREUR SYNCHRONISATION:', error);
      toast.error(`❌ Échec synchronisation pour "${missionTitle}".`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Générer des recommandations basées sur le diagnostic
   */
  generateRecommendations(logs, dbCheck, publicationAttempts) {
    const recommendations = [];

    if (dbCheck.found_in_db && !dbCheck.visible_in_api) {
      recommendations.push({
        priority: 'high',
        action: 'sync_database',
        description: 'Mission trouvée en base mais pas visible via API - Synchronisation nécessaire'
      });
    }

    if (publicationAttempts.multiple_attempts) {
      recommendations.push({
        priority: 'medium',
        action: 'check_duplicates',
        description: 'Multiples tentatives détectées - Vérifier les doublons'
      });
    }

    if (logs.server_errors) {
      recommendations.push({
        priority: 'high',
        action: 'check_server_logs',
        description: 'Erreurs serveur détectées - Investigation technique requise'
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        priority: 'medium',
        action: 'recreate_mission',
        description: 'Aucun problème identifié - Recréation de la mission recommandée'
      });
    }

    return recommendations;
  }

  /**
   * Activer le mode de récupération automatique pour un client
   * @param {string} clientEmail 
   */
  async enableAutoRecoveryMode(clientEmail) {
    console.log('🔧 ACTIVATION MODE RÉCUPÉRATION AUTO pour:', clientEmail);
    
    this.emergencyQueue.set(clientEmail, {
      enabled: true,
      startTime: Date.now(),
      attempts: 0,
      maxAttempts: 5
    });

    // Programmer un nettoyage automatique après 1 heure
    setTimeout(() => {
      this.emergencyQueue.delete(clientEmail);
      console.log('🧹 MODE RÉCUPÉRATION AUTO DÉSACTIVÉ pour:', clientEmail);
    }, 3600000);

    toast.info(`🔧 Mode récupération automatique activé pour vos prochaines publications.`);
  }

  /**
   * Vérifier si le mode de récupération automatique est actif
   * @param {string} clientEmail 
   */
  isAutoRecoveryActive(clientEmail) {
    return this.emergencyQueue.has(clientEmail);
  }
}

// Instance singleton
const emergencyMissionService = new EmergencyMissionService();

export default emergencyMissionService;

// Fonctions utilitaires exportées
export const diagnoseMissingMission = (missionTitle, clientEmail, formData) =>
  emergencyMissionService.diagnoseMissingMission(missionTitle, clientEmail, formData);

export const forceRecreateМission = (originalFormData, clientEmail) =>
  emergencyMissionService.forceRecreateМission(originalFormData, clientEmail);

export const forceSyncMission = (missionTitle, clientEmail) =>
  emergencyMissionService.forceSyncMission(missionTitle, clientEmail);

export const enableAutoRecoveryMode = (clientEmail) =>
  emergencyMissionService.enableAutoRecoveryMode(clientEmail);
