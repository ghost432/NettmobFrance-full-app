# 🔔 Système de Détection et Prompt de Notifications

Ce système détecte automatiquement les changements d'appareil/navigateur et invite l'utilisateur à activer les notifications.

## 📋 Fonctionnalités

### 1. **Détection d'Appareil/Navigateur**
Le système génère un "fingerprint" unique basé sur :
- User Agent (navigateur)
- Langue du navigateur
- Fuseau horaire
- Résolution d'écran
- Profondeur de couleur

### 2. **Conditions d'Affichage du Popup**
Le popup s'affiche uniquement si **TOUTES** ces conditions sont remplies :

✅ **Nouvel appareil/navigateur détecté**
- L'ID de l'appareil actuel ne correspond pas à celui enregistré

✅ **Notifications non accordées**
- `Notification.permission !== 'granted'`

✅ **Utilisateur a activé les notifications dans son profil**
- `user.profile.web_push_enabled === true` OU
- `user.profile.email_notifications === true`

✅ **Popup pas refusé récemment**
- Pas de refus dans les 7 derniers jours

### 3. **Protection Contre le Spam**
- ⏳ Si l'utilisateur clique sur "Plus tard", le popup ne réapparaît pas pendant **7 jours**
- 💾 L'état est stocké dans `localStorage`
- 🔄 Après 7 jours, le popup peut réapparaître

## 🎨 Interface du Popup

### Design
- 🎭 Overlay avec backdrop blur
- 📱 Responsive et centré
- 🌓 Support du mode sombre
- ✨ Animations fluides

### Contenu
- 📱 Icône d'appareil pour indiquer la détection
- 🔔 Icône de notification animée
- 📝 Liste des avantages :
  - Alertes missions
  - Rappels pointage
  - Messages clients
  - Mises à jour statuts

### Actions
1. **"Activer les notifications"** (bouton principal)
   - Active les notifications push
   - Met à jour le profil utilisateur
   - Enregistre l'appareil
   - Affiche un toast de succès

2. **"Plus tard"** (bouton secondaire)
   - Ferme le popup
   - Enregistre le refus pour 7 jours
   - Affiche un toast informatif

## 📁 Architecture

### Fichiers Créés

1. **`/hooks/useNotificationPrompt.js`**
   - Hook React pour la logique de détection
   - Génération du device ID
   - Vérification des conditions
   - Gestion du localStorage

2. **`/components/NotificationPrompt.jsx`**
   - Composant UI du popup
   - Gestion des interactions
   - Intégration avec FCM
   - Mise à jour du profil

3. **`/App.jsx`** (modifié)
   - Import du composant
   - Ajout dans l'arbre de composants

## 🔧 Utilisation

### Intégration Automatique
Le composant est déjà intégré dans `App.jsx` et s'affiche automatiquement quand nécessaire.

### Tester le Système

#### 1. Simuler un Nouvel Appareil
```javascript
// Dans la console du navigateur
localStorage.removeItem('deviceId');
localStorage.removeItem('notificationPromptDismissed');
// Recharger la page
```

#### 2. Vérifier l'État
```javascript
// Voir l'ID de l'appareil actuel
console.log(localStorage.getItem('deviceId'));

// Voir si le prompt a été refusé
console.log(localStorage.getItem('notificationPromptDismissed'));
```

#### 3. Réinitialiser le Prompt
```javascript
import { resetNotificationPrompt } from '@/hooks/useNotificationPrompt';
resetNotificationPrompt();
```

## 🔍 Débogage

### Logs Console
Le système affiche des logs détaillés :
```
🔍 Vérification notifications: {
  isNewDevice: true,
  permission: "default",
  userHasNotificationsEnabled: true,
  promptDismissed: null
}
```

### Vérifier les Conditions
```javascript
// Dans la console
const checkStatus = () => {
  console.log('Device ID:', localStorage.getItem('deviceId'));
  console.log('Permission:', Notification.permission);
  console.log('Dismissed:', localStorage.getItem('notificationPromptDismissed'));
};
checkStatus();
```

## 🎯 Scénarios d'Usage

### Scénario 1 : Premier Appareil
1. Utilisateur s'inscrit sur PC
2. Active les notifications dans les paramètres
3. ✅ Notifications activées sur PC

### Scénario 2 : Nouvel Appareil
1. Utilisateur se connecte sur mobile
2. 🔔 Popup apparaît automatiquement
3. Utilisateur clique "Activer"
4. ✅ Notifications activées sur mobile

### Scénario 3 : Refus Temporaire
1. Utilisateur se connecte sur tablette
2. 🔔 Popup apparaît
3. Utilisateur clique "Plus tard"
4. ⏳ Popup ne réapparaît pas pendant 7 jours

### Scénario 4 : Changement de Navigateur
1. Utilisateur passe de Chrome à Firefox
2. 🔔 Popup apparaît (nouveau fingerprint)
3. Utilisateur active les notifications
4. ✅ Notifications sur les deux navigateurs

## 🔐 Sécurité et Confidentialité

### Device ID
- ✅ Généré localement (pas envoyé au serveur)
- ✅ Hash SHA-256 du fingerprint
- ✅ Stocké uniquement dans localStorage
- ✅ Pas de tracking cross-site

### Données Collectées
Le fingerprint utilise uniquement des données publiques :
- User Agent (déjà envoyé à chaque requête)
- Paramètres d'affichage (publics)
- Langue et fuseau horaire (publics)

### Permissions
- ✅ Demande explicite à l'utilisateur
- ✅ Respecte les choix de l'utilisateur
- ✅ Peut être révoqué à tout moment

## ⚙️ Configuration

### Modifier le Délai de Réaffichage
Dans `/hooks/useNotificationPrompt.js` :
```javascript
// Actuellement : 7 jours
if (daysSinceDismissed < 7) {
  // Changer à 3 jours par exemple
  if (daysSinceDismissed < 3) {
```

### Personnaliser le Popup
Dans `/components/NotificationPrompt.jsx` :
- Modifier les couleurs
- Changer les textes
- Ajouter/retirer des avantages
- Personnaliser les animations

### Désactiver Temporairement
Dans `/App.jsx`, commenter :
```javascript
// <NotificationPrompt />
```

## 📊 Statistiques

Pour suivre l'adoption des notifications :
```sql
-- Utilisateurs avec notifications activées
SELECT 
  role,
  COUNT(*) as total,
  SUM(CASE WHEN web_push_enabled = 1 THEN 1 ELSE 0 END) as with_push,
  ROUND(SUM(CASE WHEN web_push_enabled = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as percentage
FROM users u
LEFT JOIN automob_profiles ap ON u.id = ap.user_id
LEFT JOIN client_profiles cp ON u.id = cp.user_id
WHERE u.role IN ('automob', 'client')
GROUP BY role;
```

## 🐛 Problèmes Courants

### Le popup ne s'affiche pas
1. Vérifier que l'utilisateur est connecté
2. Vérifier que les notifications sont activées dans le profil
3. Vérifier que `Notification.permission !== 'granted'`
4. Vérifier le localStorage pour `notificationPromptDismissed`

### Le popup s'affiche trop souvent
1. Vérifier que le deviceId est bien enregistré
2. Vérifier que le délai de 7 jours est respecté
3. Nettoyer le localStorage si nécessaire

### Les notifications ne s'activent pas
1. Vérifier la configuration Firebase
2. Vérifier les permissions du navigateur
3. Vérifier la console pour les erreurs FCM

## 🚀 Améliorations Futures

Idées d'améliorations possibles :
- 📊 Analytics sur le taux d'acceptation
- 🎯 A/B testing de différents messages
- 🌍 Traductions multilingues
- 📱 Détection du type d'appareil (mobile/desktop)
- 🔄 Synchronisation cross-device
