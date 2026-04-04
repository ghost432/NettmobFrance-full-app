# NettmobFrance Full App

Projet complet NettmobFrance (Backend & Frontend) pour le développement.

## Structure du Projet

- `backend/` : Serveur Node.js (Express, TypeORM, MySQL)
- `frontend/` : Application React (Vite, Tailwind CSS)
- `nettmobfrance_db_export.sql` : Export de la base de données MySQL locale.

## Installation et Lancement (Mode Dev)

### 1. Base de données
- Importer `nettmobfrance_db_export.sql` dans votre instance MySQL locale.
- Assurez-vous que les identifiants dans `backend/.env` correspondent à votre configuration locale.

### 2. Backend
```bash
cd backend
npm install
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

## Fonctionnalités incluses
- Gestion des missions et des utilisateurs.
- Système de notifications (Push & SMS).
- Intégrations Mapbox et Google Maps.
- Dashboard Admin, Client, et Automob.

## Notes de développement
Ce dépôt contient les fichiers nécessaires pour le développement local. Les fichiers de production (`dist/`) et les clés secrètes critiques ont été exclus pour des raisons de sécurité.
