-- Script pour vérifier et corriger la table missions

-- Vérifier que toutes les colonnes existent et les ajouter si nécessaire
ALTER TABLE missions 
ADD COLUMN IF NOT EXISTS work_time ENUM('jour', 'nuit') DEFAULT 'jour' AFTER mission_name;

ALTER TABLE missions 
ADD COLUMN IF NOT EXISTS title VARCHAR(255) AFTER mission_name;

ALTER TABLE missions 
ADD COLUMN IF NOT EXISTS billing_frequency ENUM('jour', 'semaine', 'mois') DEFAULT 'jour' AFTER secteur_id;

ALTER TABLE missions 
ADD COLUMN IF NOT EXISTS max_hours INT DEFAULT 8 AFTER billing_frequency;

ALTER TABLE missions 
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2) NOT NULL AFTER max_hours;

ALTER TABLE missions 
ADD COLUMN IF NOT EXISTS location_type VARCHAR(50) DEFAULT 'sur_site' AFTER hourly_rate;

ALTER TABLE missions 
ADD COLUMN IF NOT EXISTS city VARCHAR(100) AFTER address;

ALTER TABLE missions 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8) AFTER city;

ALTER TABLE missions 
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8) AFTER latitude;

ALTER TABLE missions 
ADD COLUMN IF NOT EXISTS nb_automobs INT DEFAULT 1 AFTER description;

ALTER TABLE missions 
ADD COLUMN IF NOT EXISTS start_time TIME AFTER end_date;

ALTER TABLE missions 
ADD COLUMN IF NOT EXISTS end_time TIME AFTER start_time;

ALTER TABLE missions 
ADD COLUMN IF NOT EXISTS budget DECIMAL(10,2) AFTER end_time;

ALTER TABLE missions 
ADD COLUMN IF NOT EXISTS assigned_automob_id INT NULL AFTER budget;

ALTER TABLE missions 
ADD COLUMN IF NOT EXISTS applications_count INT DEFAULT 0 AFTER assigned_automob_id;

-- Mettre à jour les valeurs par défaut si NULL
UPDATE missions SET work_time = 'jour' WHERE work_time IS NULL;
UPDATE missions SET billing_frequency = 'jour' WHERE billing_frequency IS NULL;
UPDATE missions SET max_hours = 8 WHERE max_hours IS NULL OR max_hours = 0;
UPDATE missions SET location_type = 'sur_site' WHERE location_type IS NULL;
UPDATE missions SET nb_automobs = 1 WHERE nb_automobs IS NULL OR nb_automobs = 0;
UPDATE missions SET applications_count = 0 WHERE applications_count IS NULL;

-- Ajouter les contraintes de clé étrangère si elles n'existent pas
ALTER TABLE missions 
ADD CONSTRAINT IF NOT EXISTS fk_missions_automob 
FOREIGN KEY (assigned_automob_id) REFERENCES users(id) ON DELETE SET NULL;

-- Afficher la structure finale
DESCRIBE missions;
