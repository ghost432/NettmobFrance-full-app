# 🔔 Système de Rappels Automatiques

Ce système envoie automatiquement des emails et notifications aux automobs pour leurs missions.

## 📋 Types de Rappels

### 1. **Rappel 24h avant la mission** ⏰
- **Quand ?** Tous les jours à **9h00**
- **Pour qui ?** Automobs avec une mission qui commence dans 24h
- **Contenu :**
  - Détails de la mission (nom, date, lieu, client, taux horaire)
  - Rappel de se présenter de la part de **NettmobFrance**
  - Conseil de pointer les heures quotidiennement
  - Bouton pour accéder à la mission

### 2. **Rappel quotidien de pointage** ⏱️
- **Quand ?** Tous les jours à **18h00**
- **Pour qui ?** Automobs avec une mission en cours (entre start_date et end_date)
- **Contenu :**
  - Rappel de pointer les heures de travail
  - Avantages du pointage quotidien
  - Bouton pour pointer les heures

## 🗄️ Base de Données

### Table `mission_reminders`
Stocke l'historique des rappels envoyés pour éviter les doublons.

```sql
CREATE TABLE mission_reminders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  mission_id INT NOT NULL,
  automob_id INT NOT NULL,
  reminder_type ENUM('mission_start', 'timesheet'),
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🚀 Installation

1. **Installer les dépendances**
```bash
cd backend
npm install
```

2. **Créer la table de rappels**
```bash
mysql -u root -p nettmobfrance < migrations/create_mission_reminders_table.sql
```

3. **Démarrer le serveur**
Le scheduler démarre automatiquement avec le serveur :
```bash
npm start
```

## ⚙️ Configuration

Les horaires sont configurés dans `/backend/services/missionScheduler.js` :

```javascript
// Rappels mission - 9h00 tous les jours
const sendMissionReminders = cron.schedule('0 9 * * *', async () => { ... });

// Rappels pointage - 18h00 tous les jours
const sendTimesheetReminders = cron.schedule('0 18 * * *', async () => { ... });
```

### Format Cron
```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Jour de la semaine (0-7, 0 et 7 = dimanche)
│ │ │ └───── Mois (1-12)
│ │ └─────── Jour du mois (1-31)
│ └───────── Heure (0-23)
└─────────── Minute (0-59)
```

**Exemples :**
- `0 9 * * *` = Tous les jours à 9h00
- `0 18 * * *` = Tous les jours à 18h00
- `0 9 * * 1-5` = Du lundi au vendredi à 9h00
- `*/30 * * * *` = Toutes les 30 minutes

## 📧 Emails Envoyés

### Email de rappel mission
- **Sujet :** "⏰ Rappel : Votre mission commence demain - NettmobFrance"
- **Contenu :** Détails complets de la mission avec instructions

### Email de rappel pointage
- **Sujet :** "⏱️ Rappel : Pointez vos heures de travail - NettmobFrance"
- **Contenu :** Rappel avec avantages du pointage quotidien

## 🔔 Notifications In-App

En plus des emails, le système crée des notifications dans l'application :

1. **Notification mission** : Lien vers `/automob/missions/{id}`
2. **Notification pointage** : Lien vers `/automob/missions/{id}/timesheets`

## 🛠️ Maintenance

### Vérifier les logs
```bash
# Logs du scheduler
tail -f logs/scheduler.log

# Logs des emails
tail -f logs/email.log
```

### Désactiver temporairement
Dans `server.js`, commenter la ligne :
```javascript
// startSchedulers();
```

### Tester manuellement
Créer un script de test :
```javascript
import { sendMissionReminderEmail } from './services/emailService.js';

const testData = {
  mission_name: 'Test Mission',
  start_date: new Date(),
  address: '123 Rue Test',
  city: 'Paris',
  client_name: 'Client Test',
  hourly_rate: 15
};

await sendMissionReminderEmail('test@example.com', 'John Doe', testData);
```

## 🔍 Dépannage

### Les rappels ne sont pas envoyés
1. Vérifier que le serveur est démarré
2. Vérifier les logs : `console.log` dans `missionScheduler.js`
3. Vérifier la configuration SMTP dans `.env`
4. Vérifier que la table `mission_reminders` existe

### Doublons de rappels
- Le système vérifie automatiquement les rappels déjà envoyés
- Les rappels mission ne sont pas renvoyés dans les 2 jours
- Les rappels pointage ne sont envoyés qu'une fois par jour

### Modifier les horaires
Éditer les expressions cron dans `missionScheduler.js` et redémarrer le serveur.

## 📊 Statistiques

Pour voir les rappels envoyés :
```sql
-- Rappels des 7 derniers jours
SELECT 
  reminder_type,
  COUNT(*) as total,
  DATE(sent_at) as date
FROM mission_reminders
WHERE sent_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY reminder_type, DATE(sent_at)
ORDER BY date DESC;
```

## 🔐 Sécurité

- Les emails sont envoyés via SMTP sécurisé
- Les données sensibles sont dans `.env`
- Les erreurs sont loggées sans exposer d'informations sensibles
- Les rappels sont liés aux missions actives uniquement
