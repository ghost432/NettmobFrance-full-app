# 🎯 SYSTÈME D'ASSISTANCE - DOCUMENTATION

## ✅ Installation

1. **Créer les tables**:
```bash
mysql -u root -p nettmobfrance < init-support-system.sql
```

2. **Démarrer le backend**:
```bash
npm start
```

## 📍 Endpoints API

### Utilisateurs (Automob/Client)
- `GET /api/support/tickets` - Liste des tickets
- `POST /api/support/tickets` - Créer un ticket
- `GET /api/support/tickets/:id` - Détails ticket
- `POST /api/support/tickets/:id/messages` - Envoyer message
- `PATCH /api/support/tickets/:id/status` - Changer statut

### Admin
- `GET /api/support/admin/tickets` - Tous les tickets
- `GET /api/support/stats` - Statistiques
- `PATCH /api/support/tickets/:id/assign` - Assigner ticket

## 🌐 Routes Frontend

- `/automob/support` - Page support automob
- `/client/support` - Page support client  
- `/admin/support` - Gestion admin

## 🔔 Notifications Socket.IO

- `new_support_ticket` - Nouveau ticket créé
- `new_support_message` - Nouveau message

## 🎨 Fonctionnalités

✅ Chat temps réel
✅ Gestion tickets (open, in_progress, resolved, closed)
✅ Priorités (low, normal, high, urgent)
✅ Catégories (technical, account, payment, mission, other)
✅ Assignation admins
✅ Notifications push
✅ Historique complet
✅ Compteur non lus

