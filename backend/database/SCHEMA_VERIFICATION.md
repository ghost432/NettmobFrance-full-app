# Vérification du Schéma de Base de Données - NettMobFrance

## Tables Principales et Leurs Champs

### 1. **users**
Table de base pour tous les utilisateurs.

| Champ | Type | Description | Utilisé dans le code |
|-------|------|-------------|---------------------|
| id | INT | Clé primaire | ✅ Oui |
| email | VARCHAR(255) | Email unique | ✅ Oui |
| password | VARCHAR(255) | Mot de passe hashé | ✅ Oui |
| role | ENUM | automob/client/admin | ✅ Oui |
| verified | BOOLEAN | Email vérifié | ✅ Oui |
| created_at | TIMESTAMP | Date création | ✅ Oui |
| updated_at | TIMESTAMP | Date modification | ✅ Oui |

**Status**: ✅ Complet et utilisé

---

### 2. **missions**
Table des missions publiées par les clients.

| Champ | Type | Description | Utilisé dans le code | Ajouté |
|-------|------|-------------|---------------------|--------|
| id | INT | Clé primaire | ✅ Oui | Initial |
| client_id | INT | FK vers users | ✅ Oui | Initial |
| **mission_name** | VARCHAR(255) | Nom de la mission | ✅ Oui | ✅ Ajouté |
| **work_time** | ENUM('jour','nuit') | Période de travail | ✅ Oui | ✅ Ajouté |
| **secteur_id** | INT | FK vers secteurs | ✅ Oui | ✅ Ajouté |
| **billing_frequency** | ENUM | Fréquence facturation | ✅ Oui | ✅ Ajouté |
| **max_hours** | INT | Heures max | ✅ Oui | ✅ Ajouté |
| **hourly_rate** | DECIMAL(10,2) | Tarif horaire | ✅ Oui | ✅ Ajouté |
| **nb_automobs** | INT | Nombre de postes | ✅ Oui | ✅ Ajouté |
| title | VARCHAR(255) | Titre (ancien) | ⚠️ Remplacé par mission_name | Initial |
| description | TEXT | Description | ✅ Oui | Initial |
| city | VARCHAR(100) | Ville | ✅ Oui | Initial |
| **postal_code** | VARCHAR(10) | Code postal | ✅ Oui | ✅ Ajouté |
| address | TEXT | Adresse complète | ✅ Oui | Initial |
| latitude | DECIMAL(10,8) | Latitude | ✅ Oui | Initial |
| longitude | DECIMAL(11,8) | Longitude | ✅ Oui | Initial |
| budget | DECIMAL(10,2) | Budget (ancien) | ⚠️ Remplacé par hourly_rate | Initial |
| start_date | DATE | Date début | ✅ Oui | Initial |
| **start_time** | TIME | Heure début | ✅ Oui | ✅ Ajouté |
| end_date | DATE | Date fin | ✅ Oui | Initial |
| **end_time** | TIME | Heure fin | ✅ Oui | ✅ Ajouté |
| status | ENUM | ouvert/en_cours/termine/annule | ✅ Oui | Initial |
| assigned_automob_id | INT | FK vers users | ✅ Oui | Initial |
| created_at | TIMESTAMP | Date création | ✅ Oui | Initial |
| updated_at | TIMESTAMP | Date modification | ✅ Oui | Initial |

**Status**: ✅ Mis à jour avec nouveaux champs

**Foreign Keys**:
- `client_id` → `users(id)`
- `secteur_id` → `secteurs(id)`
- `assigned_automob_id` → `users(id)`

---

### 3. **mission_competences** (NOUVELLE TABLE)
Table de liaison entre missions et compétences.

| Champ | Type | Description | Utilisé dans le code |
|-------|------|-------------|---------------------|
| id | INT | Clé primaire | ✅ Oui |
| mission_id | INT | FK vers missions | ✅ Oui |
| competence_id | INT | FK vers competences | ✅ Oui |
| created_at | TIMESTAMP | Date création | ✅ Oui |

**Status**: ✅ Créée et utilisée

**Foreign Keys**:
- `mission_id` → `missions(id)` ON DELETE CASCADE
- `competence_id` → `competences(id)` ON DELETE CASCADE

**Contrainte**: UNIQUE (mission_id, competence_id)

---

### 4. **mission_applications**
Table des candidatures aux missions.

| Champ | Type | Description | Utilisé dans le code |
|-------|------|-------------|---------------------|
| id | INT | Clé primaire | ✅ Oui |
| mission_id | INT | FK vers missions | ✅ Oui |
| automob_id | INT | FK vers users | ✅ Oui |
| status | ENUM | en_attente/accepte/refuse | ✅ Oui |
| message | TEXT | Message de motivation | ✅ Oui (optionnel) |
| created_at | TIMESTAMP | Date candidature | ✅ Oui |

**Status**: ✅ Complet et utilisé

**Foreign Keys**:
- `mission_id` → `missions(id)` ON DELETE CASCADE
- `automob_id` → `users(id)` ON DELETE CASCADE

**Contrainte**: UNIQUE (mission_id, automob_id)

---

### 5. **secteurs**
Table des secteurs d'activité.

| Champ | Type | Description | Utilisé dans le code |
|-------|------|-------------|---------------------|
| id | INT | Clé primaire | ✅ Oui |
| nom | VARCHAR(255) | Nom du secteur | ✅ Oui |
| description | TEXT | Description | ✅ Oui |
| active | BOOLEAN | Actif/Inactif | ✅ Oui |
| created_at | TIMESTAMP | Date création | ✅ Oui |
| updated_at | TIMESTAMP | Date modification | ✅ Oui |

**Status**: ✅ Complet et utilisé

**Données initiales**:
1. Logistique – Grande Surface
2. Logistique – Entrepôt
3. Hôtellerie
4. Nettoyage professionnel

---

### 6. **competences**
Table des compétences liées aux secteurs.

| Champ | Type | Description | Utilisé dans le code |
|-------|------|-------------|---------------------|
| id | INT | Clé primaire | ✅ Oui |
| secteur_id | INT | FK vers secteurs | ✅ Oui |
| nom | VARCHAR(255) | Nom de la compétence | ✅ Oui |
| description | TEXT | Description | ✅ Oui |
| active | BOOLEAN | Actif/Inactif | ✅ Oui |
| created_at | TIMESTAMP | Date création | ✅ Oui |
| updated_at | TIMESTAMP | Date modification | ✅ Oui |

**Status**: ✅ Complet et utilisé

**Foreign Keys**:
- `secteur_id` → `secteurs(id)` ON DELETE CASCADE

---

### 7. **automob_profiles**
Profils des auto-mobs.

| Champ | Type | Description | Utilisé dans le code |
|-------|------|-------------|---------------------|
| id | INT | Clé primaire | ✅ Oui |
| user_id | INT | FK vers users | ✅ Oui |
| first_name | VARCHAR(100) | Prénom | ✅ Oui |
| last_name | VARCHAR(100) | Nom | ✅ Oui |
| phone | VARCHAR(20) | Téléphone | ✅ Oui |
| experience | VARCHAR(50) | Expérience | ✅ Oui |
| secteur_id | INT | FK vers secteurs | ✅ Oui |
| profile_picture | VARCHAR(255) | Photo de profil | ✅ Oui |
| ... | ... | Autres champs | ✅ Oui |

**Status**: ✅ Complet et utilisé

---

### 8. **client_profiles**
Profils des clients.

| Champ | Type | Description | Utilisé dans le code |
|-------|------|-------------|---------------------|
| id | INT | Clé primaire | ✅ Oui |
| user_id | INT | FK vers users | ✅ Oui |
| company_name | VARCHAR(255) | Nom entreprise | ✅ Oui |
| first_name | VARCHAR(100) | Prénom | ✅ Oui |
| last_name | VARCHAR(100) | Nom | ✅ Oui |
| phone | VARCHAR(20) | Téléphone | ✅ Oui |
| secteur_id | INT | FK vers secteurs | ✅ Oui |
| ... | ... | Autres champs | ✅ Oui |

**Status**: ✅ Complet et utilisé

---

## Routes Backend et Utilisation des Champs

### Routes Missions

#### GET /api/missions (Liste des missions)
**Champs utilisés**:
- ✅ mission_name
- ✅ description
- ✅ city
- ✅ status
- ✅ start_date, end_date
- ✅ start_time, end_time
- ✅ hourly_rate
- ✅ nb_automobs
- ✅ work_time
- ✅ client_company (JOIN)

#### GET /api/missions/:id (Détails d'une mission)
**Champs utilisés**:
- ✅ Tous les champs de missions
- ✅ secteur_name (JOIN secteurs)
- ✅ competences (JOIN mission_competences + competences)
- ✅ client_company (JOIN client_profiles)

#### POST /api/missions (Créer une mission)
**Champs requis**:
- ✅ client_id
- ✅ mission_name
- ✅ description
- ✅ secteur_id
- ✅ competences_ids (array)
- ✅ start_date, end_date
- ✅ start_time, end_time
- ✅ hourly_rate
- ✅ nb_automobs
- ✅ address, city, postal_code
- ✅ work_time

#### PUT /api/missions/:id (Modifier une mission)
**Champs modifiables**:
- ✅ mission_name
- ✅ description
- ✅ secteur_id
- ✅ competences_ids
- ✅ start_date, end_date
- ✅ start_time, end_time
- ✅ hourly_rate
- ✅ nb_automobs
- ✅ address, city, postal_code
- ✅ work_time

#### GET /api/missions/:id/applications (Candidatures)
**Champs utilisés**:
- ✅ mission_applications.*
- ✅ automob_first_name, automob_last_name (JOIN)
- ✅ automob_avatar (profile_picture)
- ✅ automob_experience

#### POST /api/missions/:id/apply (Postuler)
**Champs utilisés**:
- ✅ mission_id
- ✅ automob_id
- ✅ message (optionnel)
- ✅ status (défaut: en_attente)

---

## Frontend - Utilisation des Données

### Page MissionsList (Client)
**Affiche**:
- ✅ mission_name
- ✅ description
- ✅ status
- ✅ start_date, end_date
- ✅ city
- ✅ hourly_rate
- ✅ nb_automobs
- ✅ applications (avec avatars et statuts)

### Page MissionDetails (Automob)
**Affiche**:
- ✅ mission_name
- ✅ description
- ✅ client_company
- ✅ work_time (badge Jour/Nuit)
- ✅ secteur_name
- ✅ competences (liste de badges)
- ✅ address, postal_code, city
- ✅ start_date, end_date (formatées)
- ✅ start_time, end_time
- ✅ hourly_rate
- ✅ nb_automobs
- ✅ Calcul du gain total

### Page PublishMission (Client)
**Formulaire avec**:
- ✅ mission_name
- ✅ description
- ✅ secteur_id (select)
- ✅ competences_ids (multi-select)
- ✅ start_date, end_date
- ✅ start_time, end_time
- ✅ hourly_rate
- ✅ nb_automobs
- ✅ address, city, postal_code
- ✅ work_time (radio Jour/Nuit)

---

## Vérifications à Effectuer

### 1. Exécuter le script de mise à jour
```bash
mysql -u root -p nettmobfrance < backend/database/verify_and_update_schema.sql
```

### 2. Vérifier les colonnes ajoutées
```sql
DESCRIBE missions;
```

**Colonnes attendues**:
- ✅ mission_name
- ✅ work_time
- ✅ secteur_id
- ✅ billing_frequency
- ✅ max_hours
- ✅ hourly_rate
- ✅ nb_automobs
- ✅ postal_code
- ✅ start_time
- ✅ end_time

### 3. Vérifier la table mission_competences
```sql
SHOW TABLES LIKE 'mission_competences';
DESCRIBE mission_competences;
```

### 4. Vérifier les foreign keys
```sql
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'nettmobfrance'
AND TABLE_NAME = 'missions';
```

---

## Résumé des Modifications

### Tables Créées
1. ✅ **mission_competences** - Liaison missions ↔ compétences

### Colonnes Ajoutées à `missions`
1. ✅ **mission_name** - Nom de la mission
2. ✅ **work_time** - Période (jour/nuit)
3. ✅ **secteur_id** - Secteur d'activité
4. ✅ **billing_frequency** - Fréquence de facturation
5. ✅ **max_hours** - Heures maximum
6. ✅ **hourly_rate** - Tarif horaire
7. ✅ **nb_automobs** - Nombre de postes
8. ✅ **postal_code** - Code postal
9. ✅ **start_time** - Heure de début
10. ✅ **end_time** - Heure de fin

### Foreign Keys Ajoutées
1. ✅ missions.secteur_id → secteurs.id
2. ✅ mission_competences.mission_id → missions.id
3. ✅ mission_competences.competence_id → competences.id

---

## Status Global

| Composant | Status | Notes |
|-----------|--------|-------|
| Tables de base | ✅ OK | users, secteurs, competences |
| Table missions | ⚠️ À mettre à jour | Exécuter verify_and_update_schema.sql |
| Table mission_competences | ⚠️ À créer | Exécuter verify_and_update_schema.sql |
| Table mission_applications | ✅ OK | Déjà existante |
| Routes backend | ✅ OK | Utilisent les nouveaux champs |
| Frontend | ✅ OK | Affiche tous les champs |
| Foreign keys | ⚠️ À vérifier | Exécuter le script |

**Action requise**: Exécuter le script `verify_and_update_schema.sql` pour mettre à jour la base de données.
