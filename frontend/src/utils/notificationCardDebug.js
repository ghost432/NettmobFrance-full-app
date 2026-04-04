/**
 * Utilitaires pour déboguer la NotificationActivationCard
 */

// Réinitialiser la carte pour un utilisateur (supprime le flag de fermeture)
export const resetNotificationCardForUser = (userId) => {
  localStorage.removeItem(`notification-card-dismissed-${userId}`);
  console.log(`✅ Carte de notification réinitialisée pour l'utilisateur ${userId}`);
  window.location.reload(); // Recharger pour voir l'effet
};

// Forcer la fermeture de la carte pour un utilisateur
export const dismissNotificationCardForUser = (userId) => {
  localStorage.setItem(`notification-card-dismissed-${userId}`, 'true');
  console.log(`✅ Carte de notification fermée pour l'utilisateur ${userId}`);
  window.location.reload(); // Recharger pour voir l'effet
};

// Vérifier le statut de la carte pour un utilisateur
export const checkNotificationCardStatus = (userId) => {
  const dismissed = localStorage.getItem(`notification-card-dismissed-${userId}`);
  console.log(`🔍 Statut carte utilisateur ${userId}:`, dismissed === 'true' ? 'Fermée' : 'Active');
  return dismissed === 'true';
};

// Simuler différents états de notifications
export const simulateNotificationStatus = (hasToken, webPushEnabled) => {
  const status = { hasToken, webPushEnabled, role: 'automob' };
  console.log('🧪 Simulation statut notifications:', status);
  
  // Émettre l'événement de changement de statut
  window.dispatchEvent(new CustomEvent('notificationStatusChanged', { 
    detail: status 
  }));
  
  return status;
};

// Fonctions utilitaires à utiliser dans la console du navigateur
window.notificationCardDebug = {
  reset: resetNotificationCardForUser,
  dismiss: dismissNotificationCardForUser,
  check: checkNotificationCardStatus,
  simulate: simulateNotificationStatus,
  
  // Raccourcis pour l'utilisateur courant
  resetCurrent: () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.id) {
      resetNotificationCardForUser(user.id);
    } else {
      console.error('❌ Aucun utilisateur connecté trouvé');
    }
  },
  
  checkCurrent: () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.id) {
      return checkNotificationCardStatus(user.id);
    } else {
      console.error('❌ Aucun utilisateur connecté trouvé');
      return null;
    }
  },
  
  // Test avec l'utilisateur 24 spécifiquement
  resetUser24: () => resetNotificationCardForUser(24),
  checkUser24: () => checkNotificationCardStatus(24),
  
  // Simulations rapides
  simulateNoToken: () => simulateNotificationStatus(false, false),
  simulateNoWebPush: () => simulateNotificationStatus(true, false),
  simulateAllActive: () => simulateNotificationStatus(true, true)
};

console.log('🛠️ Utilitaires de debug disponibles dans window.notificationCardDebug');
console.log('📋 Commandes disponibles:');
console.log('  - notificationCardDebug.resetCurrent() // Réinitialise pour l\'utilisateur courant');
console.log('  - notificationCardDebug.checkCurrent() // Vérifie le statut courant');
console.log('  - notificationCardDebug.resetUser24() // Réinitialise pour l\'utilisateur 24');
console.log('  - notificationCardDebug.simulateAllActive() // Simule notifications actives');
