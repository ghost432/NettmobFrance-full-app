-- Migration pour ajouter le champ total_hours à la table missions

-- Ajouter le champ total_hours pour définir le nombre d'heures maximal de la mission
ALTER TABLE missions 
ADD COLUMN total_hours DECIMAL(8, 2) DEFAULT NULL COMMENT 'Nombre total d\'heures pour la mission' AFTER end_date;

-- Mettre à jour les missions existantes avec une valeur par défaut basée sur la durée
-- Par exemple: 8h par jour entre start_date et end_date
UPDATE missions 
SET total_hours = DATEDIFF(COALESCE(end_date, start_date), start_date) * 8 
WHERE total_hours IS NULL AND start_date IS NOT NULL;
