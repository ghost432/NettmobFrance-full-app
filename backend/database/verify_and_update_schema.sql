-- Script de vérification et mise à jour du schéma de la base de données
-- Ce script ajoute les colonnes manquantes sans supprimer les données existantes

USE nettmobfrance;

-- ============================================
-- MISE À JOUR DE LA TABLE MISSIONS
-- ============================================

-- Ajouter mission_name si elle n'existe pas
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'nettmobfrance' 
AND TABLE_NAME = 'missions' 
AND COLUMN_NAME = 'mission_name';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE missions ADD COLUMN mission_name VARCHAR(255) AFTER client_id',
    'SELECT "mission_name existe déjà"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter work_time si elle n'existe pas
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'nettmobfrance' 
AND TABLE_NAME = 'missions' 
AND COLUMN_NAME = 'work_time';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE missions ADD COLUMN work_time ENUM(''jour'', ''nuit'') DEFAULT ''jour'' AFTER mission_name',
    'SELECT "work_time existe déjà"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter secteur_id si elle n'existe pas
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'nettmobfrance' 
AND TABLE_NAME = 'missions' 
AND COLUMN_NAME = 'secteur_id';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE missions ADD COLUMN secteur_id INT AFTER work_time',
    'SELECT "secteur_id existe déjà"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter billing_frequency si elle n'existe pas
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'nettmobfrance' 
AND TABLE_NAME = 'missions' 
AND COLUMN_NAME = 'billing_frequency';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE missions ADD COLUMN billing_frequency ENUM(''jour'', ''semaine'', ''mois'') DEFAULT ''jour'' AFTER secteur_id',
    'SELECT "billing_frequency existe déjà"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter max_hours si elle n'existe pas
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'nettmobfrance' 
AND TABLE_NAME = 'missions' 
AND COLUMN_NAME = 'max_hours';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE missions ADD COLUMN max_hours INT AFTER billing_frequency',
    'SELECT "max_hours existe déjà"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter start_time si elle n'existe pas
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'nettmobfrance' 
AND TABLE_NAME = 'missions' 
AND COLUMN_NAME = 'start_time';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE missions ADD COLUMN start_time TIME AFTER start_date',
    'SELECT "start_time existe déjà"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter end_time si elle n'existe pas
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'nettmobfrance' 
AND TABLE_NAME = 'missions' 
AND COLUMN_NAME = 'end_time';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE missions ADD COLUMN end_time TIME AFTER end_date',
    'SELECT "end_time existe déjà"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter hourly_rate si elle n'existe pas
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'nettmobfrance' 
AND TABLE_NAME = 'missions' 
AND COLUMN_NAME = 'hourly_rate';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE missions ADD COLUMN hourly_rate DECIMAL(10, 2) AFTER max_hours',
    'SELECT "hourly_rate existe déjà"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter nb_automobs si elle n'existe pas
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'nettmobfrance' 
AND TABLE_NAME = 'missions' 
AND COLUMN_NAME = 'nb_automobs';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE missions ADD COLUMN nb_automobs INT DEFAULT 1 AFTER hourly_rate',
    'SELECT "nb_automobs existe déjà"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter postal_code si elle n'existe pas
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'nettmobfrance' 
AND TABLE_NAME = 'missions' 
AND COLUMN_NAME = 'postal_code';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE missions ADD COLUMN postal_code VARCHAR(10) AFTER city',
    'SELECT "postal_code existe déjà"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- CRÉATION DE LA TABLE mission_competences
-- ============================================

CREATE TABLE IF NOT EXISTS mission_competences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    mission_id INT NOT NULL,
    competence_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
    FOREIGN KEY (competence_id) REFERENCES competences(id) ON DELETE CASCADE,
    UNIQUE KEY unique_mission_competence (mission_id, competence_id),
    INDEX idx_mission (mission_id),
    INDEX idx_competence (competence_id)
);

-- ============================================
-- VÉRIFICATION DES FOREIGN KEYS
-- ============================================

-- Ajouter la foreign key pour secteur_id si elle n'existe pas
SET @fk_exists = 0;
SELECT COUNT(*) INTO @fk_exists
FROM information_schema.TABLE_CONSTRAINTS
WHERE TABLE_SCHEMA = 'nettmobfrance'
AND TABLE_NAME = 'missions'
AND CONSTRAINT_NAME = 'missions_ibfk_secteur';

SET @query = IF(@fk_exists = 0,
    'ALTER TABLE missions ADD CONSTRAINT missions_ibfk_secteur FOREIGN KEY (secteur_id) REFERENCES secteurs(id) ON DELETE SET NULL',
    'SELECT "Foreign key missions_ibfk_secteur existe déjà"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- AFFICHER LA STRUCTURE FINALE
-- ============================================

SELECT 'Structure de la table missions:' as Info;
DESCRIBE missions;

SELECT 'Structure de la table mission_competences:' as Info;
DESCRIBE mission_competences;

SELECT 'Structure de la table mission_applications:' as Info;
DESCRIBE mission_applications;

-- ============================================
-- VÉRIFIER LES DONNÉES
-- ============================================

SELECT 'Nombre de missions:' as Info, COUNT(*) as count FROM missions;
SELECT 'Nombre de candidatures:' as Info, COUNT(*) as count FROM mission_applications;
SELECT 'Nombre de secteurs:' as Info, COUNT(*) as count FROM secteurs;
SELECT 'Nombre de compétences:' as Info, COUNT(*) as count FROM competences;
SELECT 'Nombre de mission_competences:' as Info, COUNT(*) as count FROM mission_competences;
