/**
 * Utilitaires pour tester et déboguer les notifications
 * Utilisez ces fonctions dans la console du navigateur
 */

/**
 * Affiche l'état complet des notifications
 */
export const debugNotifications = () => {
  console.log('🔍 === DEBUG NOTIFICATIONS ===');
  console.log('');
  
  // Support
  console.log('📱 Support:');
  console.log('  Notification API:', 'Notification' in window ? '✅' : '❌');
  console.log('  Service Worker:', 'serviceWorker' in navigator ? '✅' : '❌');
  console.log('  Push API:', 'PushManager' in window ? '✅' : '❌');
  console.log('');
  
  // Permission
  if ('Notification' in window) {
    const permission = Notification.permission;
    const emoji = permission === 'granted' ? '✅' : permission === 'denied' ? '❌' : '⚠️';
    console.log('🔐 Permission:', emoji, permission);
  }
  console.log('');
  
  // LocalStorage
  console.log('💾 LocalStorage:');
  const deviceId = localStorage.getItem('deviceId');
  const dismissed = localStorage.getItem('notificationPromptDismissed');
  const user = localStorage.getItem('user');
  
  console.log('  deviceId:', deviceId ? deviceId.substring(0, 30) + '...' : '❌ Non défini (nouveau appareil)');
  console.log('  promptDismissed:', dismissed || '❌ Jamais refusé');
  console.log('  user:', user ? '✅ Connecté' : '❌ Non connecté');
  
  if (user) {
    try {
      const userData = JSON.parse(user);
      console.log('  web_push_enabled:', userData?.profile?.web_push_enabled ?? 'undefined');
    } catch (e) {
      console.log('  Erreur parsing user');
    }
  }
  console.log('');
  
  // Recommandations
  console.log('💡 Recommandations:');
  if (!deviceId) {
    console.log('  ✅ Le popup devrait s\'afficher (nouveau appareil)');
  } else if (Notification.permission === 'granted') {
    console.log('  ℹ️ Permission déjà accordée, popup ne s\'affichera pas');
  } else if (dismissed) {
    const dismissedDate = new Date(dismissed);
    const daysSince = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 7) {
      console.log(`  ⏳ Popup refusé il y a ${Math.floor(daysSince)} jour(s), réapparaîtra dans ${Math.ceil(7 - daysSince)} jour(s)`);
    } else {
      console.log('  ✅ Le popup devrait s\'afficher (délai de 7 jours écoulé)');
    }
  } else {
    console.log('  ✅ Le popup devrait s\'afficher');
  }
  
  console.log('');
  console.log('=== FIN DEBUG ===');
};

/**
 * Réinitialise toutes les données de notifications
 */
export const resetNotifications = () => {
  console.log('🔄 Réinitialisation des notifications...');
  
  localStorage.removeItem('deviceId');
  localStorage.removeItem('notificationPromptDismissed');
  
  console.log('✅ Données réinitialisées !');
  console.log('💡 Rechargez la page pour voir le popup');
};

/**
 * Force l'affichage du popup (pour test)
 */
export const forceShowPopup = () => {
  console.log('🔔 Forçage de l\'affichage du popup...');
  
  resetNotifications();
  
  console.log('✅ Rechargez la page maintenant');
  console.log('💡 Le popup devrait apparaître après 2 secondes');
};

/**
 * Teste l'envoi d'une notification
 */
export const testNotification = () => {
  console.log('🧪 Test d\'envoi de notification...');
  
  if (!('Notification' in window)) {
    console.error('❌ Notifications non supportées');
    return;
  }
  
  if (Notification.permission !== 'granted') {
    console.warn('⚠️ Permission non accordée. Demandez d\'abord la permission.');
    return;
  }
  
  try {
    new Notification('🔔 Test NettMobFrance', {
      body: 'Les notifications fonctionnent correctement !',
      icon: '/logo.png',
      badge: '/logo.png',
      tag: 'test-notification'
    });
    
    console.log('✅ Notification envoyée !');
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
};

/**
 * Demande la permission de notification
 */
export const requestNotificationPermission = async () => {
  console.log('🔐 Demande de permission...');
  
  if (!('Notification' in window)) {
    console.error('❌ Notifications non supportées');
    return;
  }
  
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('✅ Permission accordée !');
      testNotification();
    } else if (permission === 'denied') {
      console.error('❌ Permission refusée');
    } else {
      console.warn('⚠️ Permission en attente');
    }
    
    return permission;
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
};

// Rendre les fonctions disponibles globalement pour la console
if (typeof window !== 'undefined') {
  window.debugNotifications = debugNotifications;
  window.resetNotifications = resetNotifications;
  window.forceShowPopup = forceShowPopup;
  window.testNotification = testNotification;
  window.requestNotificationPermission = requestNotificationPermission;
  
  console.log('🔔 Utilitaires de notifications chargés !');
  console.log('💡 Fonctions disponibles:');
  console.log('  - debugNotifications()');
  console.log('  - resetNotifications()');
  console.log('  - forceShowPopup()');
  console.log('  - testNotification()');
  console.log('  - requestNotificationPermission()');
}

export default {
  debugNotifications,
  resetNotifications,
  forceShowPopup,
  testNotification,
  requestNotificationPermission
};
