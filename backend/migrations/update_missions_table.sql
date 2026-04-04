-- Ajouter les nouveaux champs à la table missions
-- Note: ignorer les erreurs si les colonnes existent déjà

ALTER TABLE missions
ADD COLUMN mission_name VARCHAR(255) AFTER client_id,
ADD COLUMN work_time ENUM('jour', 'nuit') DEFAULT 'jour' AFTER mission_name,
ADD COLUMN secteur_id INT AFTER work_time,
ADD COLUMN billing_frequency ENUM('jour', 'semaine', 'mois') DEFAULT 'jour' AFTER secteur_id,
ADD COLUMN max_hours INT AFTER billing_frequency,
ADD COLUMN hourly_rate DECIMAL(10,2) AFTER max_hours,
ADD COLUMN location_type VARCHAR(50) DEFAULT 'sur_site' AFTER hourly_rate,
ADD COLUMN nb_automobs INT DEFAULT 1 AFTER description,
ADD COLUMN start_time TIME AFTER start_date,
ADD COLUMN end_time TIME AFTER end_date;

-- Table pour les compétences requises par mission
CREATE TABLE IF NOT EXISTS mission_competences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mission_id INT NOT NULL,
  competence_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
  FOREIGN KEY (competence_id) REFERENCES competences(id) ON DELETE CASCADE,
  UNIQUE KEY unique_mission_competence (mission_id, competence_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index pour optimiser les requêtes
ALTER TABLE missions
ADD INDEX idx_work_time (work_time),
ADD INDEX idx_secteur (secteur_id),
ADD INDEX idx_billing_frequency (billing_frequency);
