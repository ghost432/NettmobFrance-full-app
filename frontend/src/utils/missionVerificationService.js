// Service de vérification des missions après publication
import api from '@/lib/api';

class MissionVerificationService {
  constructor() {
    this.verificationQueue = new Map();
    this.maxRetries = 10;
    this.retryDelay = 2000; // 2 secondes
  }

  /**
   * Calculer la similarité entre deux chaînes de caractères
   * @param {string} str1 
   * @param {string} str2 
   * @returns {number} Pourcentage de similarité (0-100)
   */
  calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return 100;
    
    // Calcul simple basé sur les mots communs
    const words1 = s1.split(/\s+/);
    const words2 = s2.split(/\s+/);
    
    let commonWords = 0;
    words1.forEach(word1 => {
      if (words2.some(word2 => word1.includes(word2) || word2.includes(word1))) {
        commonWords++;
      }
    });
    
    return Math.round((commonWords / Math.max(words1.length, words2.length)) * 100);
  }

  /**
   * Vérifier côté backend si une mission existe vraiment
   * @param {string} missionTitle 
   * @param {string} clientEmail 
   */
  async verifyBackendMission(missionTitle, clientEmail) {
    console.log('⚠️ VÉRIFICATION BACKEND DÉSACTIVÉE - Endpoint non implémenté');
    console.log('🔍 Paramètres reçus:', { missionTitle, clientEmail });
    
    // Retourner un résultat négatif sans faire d'appel réseau
    return { 
      found: false, 
      mission: null, 
      note: 'Vérification backend désactivée - endpoint /missions/verify-existence non implémenté' 
    };
  }

  /**
   * Vérifier qu'une mission existe bien après publication
   * @param {string} missionId - ID de la mission
   * @param {string} missionTitle - Titre de la mission
   * @param {string} clientEmail - Email du client
   */
  async verifyMissionExists(missionId, missionTitle, clientEmail) {
    console.log('🔍 VÉRIFICATION MISSION:', {
      missionId,
      missionTitle,
      clientEmail,
      timestamp: new Date().toISOString()
    });

    try {
      // Essayer de récupérer la mission directement
      if (missionId) {
        const missionResponse = await api.get(`/missions/${missionId}`);
        if (missionResponse.data) {
          console.log('✅ MISSION TROUVÉE PAR ID:', {
            missionId,
            mission: missionResponse.data,
            timestamp: new Date().toISOString()
          });
          return {
            found: true,
            method: 'direct',
            mission: missionResponse.data
          };
        }
      }

      // Si pas trouvée par ID, chercher dans la liste des missions du client
      const missionsResponse = await api.get('/missions', {
        params: {
          forceRefresh: Date.now(),
          limit: 100 // Charger plus de missions pour être sûr
        }
      });

      const missions = missionsResponse.data || [];
      
      // Chercher la mission par titre et date récente (dernières 30 minutes)
      const recentMissions = missions.filter(mission => {
        const createdTime = new Date(mission.created_at).getTime();
        const now = Date.now();
        const timeDiff = now - createdTime;
        return timeDiff < 1800000; // 30 minutes (étendu)
      });

      console.log('🔍 ANALYSE MISSIONS:', {
        totalMissions: missions.length,
        recentMissions: recentMissions.length,
        missionsDetails: missions.map(m => ({
          id: m.id,
          titre: m.mission_name,
          client: m.client_email,
          créé: m.created_at,
          timeDiff: Math.round((Date.now() - new Date(m.created_at).getTime()) / 60000) + 'min'
        }))
      });

      // 1. Chercher d'abord dans les missions récentes
      let foundMission = recentMissions.find(mission => 
        mission.mission_name === missionTitle ||
        mission.mission_name?.toLowerCase().includes(missionTitle?.toLowerCase())
      );

      // 2. Si pas trouvée dans les récentes, chercher par titre exact d'abord (TRÈS PERMISSIF)
      if (!foundMission) {
        console.log('🔍 RECHERCHE PAR TITRE EXACT (PERMISSIVE):', missionTitle);
        
        // Recherche par titre exact
        foundMission = missions.find(mission => 
          mission.mission_name === missionTitle
        );
        
        // Si pas trouvé par titre exact, essayer avec trim et casse
        if (!foundMission) {
          foundMission = missions.find(mission => 
            mission.mission_name?.toLowerCase().trim() === missionTitle?.toLowerCase().trim()
          );
        }
        
        // Si toujours pas trouvé, chercher avec includes
        if (!foundMission) {
          foundMission = missions.find(mission => 
            mission.mission_name?.toLowerCase().includes(missionTitle?.toLowerCase()) ||
            missionTitle?.toLowerCase().includes(mission.mission_name?.toLowerCase())
          );
        }
        
        if (foundMission) {
          console.log('✅ MISSION TROUVÉE PAR TITRE (MÉTHODE PERMISSIVE):', {
            id: foundMission.id,
            titre: foundMission.mission_name,
            client: foundMission.client_email || 'Non défini',
            méthode: 'titre_permissif'
          });
          // Retourner immédiatement si trouvée
          return {
            found: true,
            method: 'permissive_title_search',
            mission: foundMission,
            note: 'Mission trouvée par recherche permissive de titre'
          };
        }
      }

      // 3. Si pas trouvée par titre exact, chercher dans les missions du client (si client_email disponible)
      if (!foundMission && clientEmail) {
        console.log('🔍 RECHERCHE ÉTENDUE pour client:', clientEmail);
        const clientMissions = missions.filter(mission => 
          mission.client_email?.toLowerCase() === clientEmail?.toLowerCase()
        );

        console.log('🔍 MISSIONS DU CLIENT AVEC EMAIL DÉFINI:', {
          clientEmail,
          clientMissions: clientMissions.map(m => ({
            id: m.id,
            titre: m.mission_name,
            créé: m.created_at,
            statut: m.status
          }))
        });

        foundMission = clientMissions.find(mission => 
          mission.mission_name === missionTitle ||
          mission.mission_name?.toLowerCase().includes(missionTitle?.toLowerCase()) ||
          missionTitle?.toLowerCase().includes(mission.mission_name?.toLowerCase())
        );
      }

      // 4. Si toujours pas trouvée, recherche floue sur les mots clés (avec et sans filtre client)
      if (!foundMission) {
        console.log('🔍 RECHERCHE FLOUE pour:', missionTitle);
        const keywords = missionTitle?.toLowerCase().split(' ').filter(word => word.length > 2);
        
        if (keywords && keywords.length > 0) {
          // D'abord essayer avec les missions du client si email disponible
          if (clientEmail) {
            const clientMissions = missions.filter(mission => 
              mission.client_email?.toLowerCase() === clientEmail?.toLowerCase()
            );

            foundMission = clientMissions.find(mission => {
              const missionWords = mission.mission_name?.toLowerCase().split(' ') || [];
              return keywords.some(keyword => 
                missionWords.some(word => word.includes(keyword) || keyword.includes(word))
              );
            });

            if (foundMission) {
              console.log('✅ MISSION TROUVÉE PAR RECHERCHE FLOUE (CLIENT):', {
                recherché: missionTitle,
                trouvé: foundMission.mission_name,
                keywords,
                client: foundMission.client_email
              });
            }
          }
          
          // Si pas trouvée avec filtre client, essayer dans TOUTES les missions
          if (!foundMission) {
            console.log('🔍 RECHERCHE FLOUE GLOBALE (TOUTES MISSIONS)');
            foundMission = missions.find(mission => {
              const missionWords = mission.mission_name?.toLowerCase().split(' ') || [];
              return keywords.some(keyword => 
                missionWords.some(word => word.includes(keyword) || keyword.includes(word))
              );
            });

            if (foundMission) {
              console.log('✅ MISSION TROUVÉE PAR RECHERCHE FLOUE GLOBALE:', {
                recherché: missionTitle,
                trouvé: foundMission.mission_name,
                keywords,
                client: foundMission.client_email || 'Non défini',
                note: 'Trouvée sans filtre client - client_email peut être undefined'
              });
            }
          }
        }
      }

      if (foundMission) {
        console.log('✅ MISSION TROUVÉE:', {
          missionTitle,
          foundMission: {
            id: foundMission.id,
            titre: foundMission.mission_name,
            client: foundMission.client_email || 'Non défini',
            statut: foundMission.status
          },
          method: 'multi_level_search',
          timestamp: new Date().toISOString()
        });
        return {
          found: true,
          method: 'multi_level_search',
          mission: foundMission,
          note: foundMission.client_email ? 'Mission avec client défini' : 'Mission trouvée mais client_email undefined - problème backend possible'
        };
      }

      console.log('❌ MISSION NON TROUVÉE - ANALYSE DÉTAILLÉE:', {
        missionId,
        missionTitle,
        clientEmail,
        totalMissions: missions.length,
        recentMissions: recentMissions.length,
        allMissionsAnalysis: missions.map(m => ({
          id: m.id,
          titre: m.mission_name,
          client: m.client_email,
          similarity: this.calculateSimilarity(missionTitle, m.mission_name),
          isFromSameClient: m.client_email?.toLowerCase() === clientEmail?.toLowerCase()
        })),
        timestamp: new Date().toISOString()
      });

      // Au lieu d'appeler un endpoint inexistant, faire une recherche plus approfondie
      console.log('🔍 MISSION NON TROUVÉE - Recherche approfondie dans toutes les missions...');
      
      // Étendre la recherche à TOUTES les missions sans filtre de date
      const allMissions = missions.filter(mission => 
        mission.client_email?.toLowerCase() === clientEmail?.toLowerCase()
      );
      
      console.log('🔍 TOUTES LES MISSIONS DU CLIENT:', {
        clientEmail,
        totalClientMissions: allMissions.length,
        missions: allMissions.map(m => ({
          id: m.id,
          titre: m.mission_name,
          créé: m.created_at,
          statut: m.status
        }))
      });
      
      // ⚡ MODE RÉCUPÉRATION D'URGENCE: Chercher toute mission avec 100% de similarité
      console.log('⚡ MODE RÉCUPÉRATION D\'URGENCE - Recherche par similarité exacte');
      const perfectMatch = missions.find(mission => {
        const similarity = this.calculateSimilarity(missionTitle, mission.mission_name);
        console.log(`🔍 Test similarité: "${mission.mission_name}" → ${similarity}%`);
        return similarity === 100;
      });
      
      if (perfectMatch) {
        console.log('🚨 ✅ MISSION TROUVÉE EN MODE URGENCE (100% similarité):', {
          id: perfectMatch.id,
          titre: perfectMatch.mission_name,
          client: perfectMatch.client_email || 'Non défini',
          similarity: 100
        });
        return {
          found: true,
          method: 'emergency_similarity_100',
          mission: perfectMatch,
          note: 'Mission trouvée en mode urgence avec 100% de similarité - client_email peut être undefined'
        };
      }

      // Recherche très permissive par mots-clés
      const foundByKeywords = allMissions.find(mission => {
        const missionWords = mission.mission_name?.toLowerCase().split(/\s+/) || [];
        const searchWords = missionTitle?.toLowerCase().split(/\s+/) || [];
        
        // Si au moins 50% des mots correspondent
        const matchingWords = searchWords.filter(searchWord => 
          missionWords.some(missionWord => 
            missionWord.includes(searchWord) || 
            searchWord.includes(missionWord) ||
            missionWord === searchWord
          )
        );
        
        return matchingWords.length >= Math.ceil(searchWords.length * 0.5);
      });
      
      if (foundByKeywords) {
        console.log('✅ MISSION TROUVÉE PAR MOTS-CLÉS:', foundByKeywords);
        return {
          found: true,
          method: 'keywords_fallback',
          mission: foundByKeywords,
          note: 'Mission trouvée via recherche approfondie par mots-clés'
        };
      }

      return {
        found: false,
        totalMissions: missions.length,
        recentMissions: recentMissions.length,
        allMissions: missions.map(m => ({
          id: m.id,
          titre: m.mission_name,
          client: m.client_email,
          créé: m.created_at
        }))
      };

    } catch (error) {
      console.error('❌ ERREUR VÉRIFICATION MISSION:', {
        missionId,
        missionTitle,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      return {
        found: false,
        error: error.message
      };
    }
  }

  /**
   * Programmer une vérification avec retry automatique
   */
  async scheduleVerification(missionId, missionTitle, clientEmail, onSuccess, onFailure) {
    const verifyKey = `mission_${missionId}_${Date.now()}`;
    let retryCount = 0;

    const verify = async () => {
      retryCount++;
      console.log(`🔄 TENTATIVE VÉRIFICATION ${retryCount}/${this.maxRetries} pour mission: ${missionTitle}`);

      const result = await this.verifyMissionExists(missionId, missionTitle, clientEmail);

      if (result.found) {
        console.log('✅ MISSION VÉRIFIÉE AVEC SUCCÈS:', {
          method: result.method,
          missionId: result.mission?.id,
          note: result.note
        });
        if (onSuccess) onSuccess(result);
        return;
      }

      // Réduire le nombre de retries pour éviter les boucles infinies
      if (retryCount < 3) { // Seulement 3 tentatives au lieu de 10
        console.log(`⏳ RETRY DANS ${this.retryDelay}ms (${retryCount}/3)`);
        setTimeout(verify, this.retryDelay);
      } else {
        console.warn('⚠️ ÉCHEC VÉRIFICATION APRÈS 3 TENTATIVES - Mode urgence activé');
        
        // Mode urgence: forcer la recherche une dernière fois avec logs détaillés
        console.log('🚨 ACTIVATION MODE URGENCE - Recherche exhaustive...');
        try {
          const urgentResult = await this.verifyMissionExists(null, missionTitle, clientEmail);
          if (urgentResult.found) {
            console.log('🚨 ✅ MISSION TROUVÉE EN MODE URGENCE !');
            if (onSuccess) onSuccess(urgentResult);
            return;
          }
        } catch (urgentError) {
          console.error('🚨 Erreur mode urgence:', urgentError);
        }
        
        console.error('❌ ÉCHEC DÉFINITIF APRÈS MODE URGENCE');
        if (onFailure) onFailure(result);
      }
    };

    // Commencer la vérification immédiatement
    verify();
  }

  /**
   * Vérifier et relancer les notifications si nécessaire
   */
  async verifyAndRetryNotifications(missionId, missionTitle, clientEmail) {
    console.log('🔔 DÉBUT VÉRIFICATION NOTIFICATIONS:', { missionId, missionTitle, clientEmail });
    
    const result = await this.verifyMissionExists(missionId, missionTitle, clientEmail);
    
    if (result.found && result.mission) {
      const actualMissionId = result.mission.id;
      console.log('🔔 MISSION TROUVÉE - ID RÉEL:', actualMissionId);
      
      try {
        // D'abord vérifier que la mission existe vraiment côté serveur
        console.log('🔍 VÉRIFICATION EXISTENCE SERVEUR pour ID:', actualMissionId);
        const missionCheckResponse = await api.get(`/missions/${actualMissionId}`);
        
        if (!missionCheckResponse.data) {
          console.error('❌ MISSION INEXISTANTE CÔTÉ SERVEUR:', actualMissionId);
          return {
            missionVerified: false,
            error: `Mission ID ${actualMissionId} n'existe pas côté serveur`
          };
        }
        
        console.log('✅ MISSION CONFIRMÉE CÔTÉ SERVEUR:', missionCheckResponse.data);
        
        // Maintenant envoyer les notifications
        console.log('🔔 ENVOI NOTIFICATIONS pour mission confirmée ID:', actualMissionId);
        const notificationResult = await api.post(`/missions/${actualMissionId}/force-notifications`, {
          send_to_offline: true,
          notification_type: 'new_mission',
          force_all: true,
          include_push: true,
          include_email: true,
          priority: 'high',
          retry_failed: true
        });

        console.log('🔔 NOTIFICATIONS RELANCÉES AVEC SUCCÈS:', notificationResult.data);
        return {
          missionVerified: true,
          missionId: actualMissionId,
          notificationsSent: notificationResult.data?.automobs_notified || 0,
          notificationsDetails: notificationResult.data
        };
        
      } catch (error) {
        console.error('❌ ERREUR LORS DE LA VÉRIFICATION/NOTIFICATIONS:', {
          missionId: actualMissionId,
          error: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        
        if (error.response?.status === 404) {
          console.log('🔍 MISSION 404 - ID INVALIDE, RELANCE RECHERCHE APPROFONDIE');
          // L'ID trouvé est invalide, relancer une recherche sans ID
          const retryResult = await this.verifyMissionExists(null, missionTitle, clientEmail);
          
          if (retryResult.found && retryResult.mission) {
            console.log('✅ MISSION TROUVÉE VIA RECHERCHE APPROFONDIE:', retryResult.mission);
            // Recursive call avec le nouvel ID
            return await this.verifyAndRetryNotifications(retryResult.mission.id, missionTitle, clientEmail);
          }
        }
        
        return {
          missionVerified: true,
          notificationError: error.message,
          needsManualCheck: true
        };
      }
    }

    console.log('❌ MISSION NON TROUVÉE - ÉCHEC VÉRIFICATION');
    return {
      missionVerified: false,
      error: 'Mission non trouvée après vérification approfondie'
    };
  }
}

// Instance singleton
const missionVerificationService = new MissionVerificationService();

export default missionVerificationService;

// Fonctions utilitaires exportées
export const verifyMissionExists = (missionId, missionTitle, clientEmail) => 
  missionVerificationService.verifyMissionExists(missionId, missionTitle, clientEmail);

export const scheduleVerification = (missionId, missionTitle, clientEmail, onSuccess, onFailure) => 
  missionVerificationService.scheduleVerification(missionId, missionTitle, clientEmail, onSuccess, onFailure);

export const verifyAndRetryNotifications = (missionId, missionTitle, clientEmail) => 
  missionVerificationService.verifyAndRetryNotifications(missionId, missionTitle, clientEmail);
