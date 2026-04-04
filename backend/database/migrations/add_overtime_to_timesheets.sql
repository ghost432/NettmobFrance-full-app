-- Migration pour ajouter la gestion des heures supplémentaires

-- Ajouter les colonnes pour les heures supplémentaires dans timesheets
ALTER TABLE timesheets 
ADD COLUMN overtime_hours DECIMAL(6, 2) DEFAULT 0 COMMENT 'Heures supplémentaires' AFTER total_hours,
ADD COLUMN overtime_reason TEXT NULL COMMENT 'Raison des heures supplémentaires' AFTER overtime_hours;

-- Ajouter une colonne pour marquer les entrées comme heures supplémentaires
ALTER TABLE timesheet_entries
ADD COLUMN is_overtime BOOLEAN DEFAULT FALSE COMMENT 'Indique si cette entrée est une heure supplémentaire' AFTER hours_worked;
