# Migrations Base de Données

## Migration : Profil Client et Documents Automob

**Fichier**: `add_client_fields_and_documents.sql`

### Changements apportés

#### 1. Profil Client - Nouvelles colonnes
- `manager_position` : Poste du gérant (VARCHAR 100)
- `company_description` : À propos de l'entreprise (TEXT)

#### 2. Table Documents Automob
Nouvelle table `automob_documents` pour gérer les documents et habilitations des auto-entrepreneurs.

**Colonnes** :
- `id` : Identifiant unique
- `user_id` : Référence utilisateur
- `name` : Nom du document
- `type` : Type (document/habilitation)
- `has_expiry` : Si c'est une habilitation avec date d'expiration
- `file_path` : Chemin du fichier
- `uploaded_at` : Date d'upload

### Comment exécuter cette migration

```bash
# Se connecter à MySQL
mysql -u root -p

# Utiliser la base de données
USE automob;

# Exécuter la migration
source /chemin/vers/backend/database/migrations/add_client_fields_and_documents.sql
```

Ou via ligne de commande directe :
```bash
mysql -u root -p automob < backend/database/migrations/add_client_fields_and_documents.sql
```

### Rollback

Si vous devez annuler cette migration, décommentez et exécutez les lignes de rollback à la fin du fichier SQL.

---

## Ordre d'exécution des migrations

1. `add_automob_profile_fields.sql` (si pas déjà fait)
2. `add_automob_experiences.sql` (si pas déjà fait)
3. **`add_client_fields_and_documents.sql`** ← Nouvelle migration

---

## Vérification

Après la migration, vérifiez que les changements sont bien appliqués :

```sql
-- Vérifier les colonnes client_profiles
DESCRIBE client_profiles;

-- Vérifier la table documents
DESCRIBE automob_documents;

-- Vérifier les données
SELECT * FROM client_profiles LIMIT 1;
SELECT * FROM automob_documents LIMIT 1;
```
