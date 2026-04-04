# Migrations de la base de données

## Migration : Ajout des champs au profil automob

### Description
Cette migration ajoute les nouveaux champs suivants au profil automob :
- **genre** : Sélection homme/femme
- **iban** : Numéro IBAN bancaire
- **bic_swift** : Code BIC/SWIFT
- **years_of_experience** : Années d'expertise (junior, intermédiaire, senior, expert)
- **about_me** : Zone de texte "À propos de moi"
- **work_areas** : JSON pour stocker plusieurs villes de travail

Et crée la table **automob_availabilities** pour gérer plusieurs périodes de disponibilité.

### Commandes d'exécution

#### Option 1 : Via MySQL CLI
```bash
mysql -u root -p automob_app < backend/database/migrations/add_automob_profile_fields.sql
```

#### Option 2 : Via MySQL Workbench ou phpMyAdmin
1. Ouvrir le fichier `add_automob_profile_fields.sql`
2. Copier tout le contenu
3. Coller et exécuter dans votre interface MySQL

#### Option 3 : Via la console MySQL
```bash
mysql -u root -p
```
Puis :
```sql
USE automob_app;
SOURCE /chemin/absolu/vers/add_automob_profile_fields.sql;
```

### Vérification
Après exécution, vérifier que :
```sql
-- Vérifier les nouvelles colonnes
DESCRIBE automob_profiles;

-- Vérifier la nouvelle table
SHOW TABLES LIKE 'automob_availabilities';
DESCRIBE automob_availabilities;
```

### Rollback (si nécessaire)
```sql
-- Supprimer les colonnes ajoutées
ALTER TABLE automob_profiles
DROP COLUMN gender,
DROP COLUMN iban,
DROP COLUMN bic_swift,
DROP COLUMN years_of_experience,
DROP COLUMN about_me,
DROP COLUMN work_areas;

-- Supprimer la table des disponibilités
DROP TABLE IF EXISTS automob_availabilities;
```

### Ordre des migrations
1. Exécuter d'abord cette migration
2. Redémarrer le serveur backend
3. Tester les modifications dans le frontend
