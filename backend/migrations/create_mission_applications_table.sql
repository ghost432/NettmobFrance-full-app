-- Table pour les candidatures aux missions
CREATE TABLE IF NOT EXISTS mission_applications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  mission_id INT NOT NULL,
  automob_id INT NOT NULL,
  message TEXT,
  status ENUM('en_attente', 'accepte', 'refuse') DEFAULT 'en_attente',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
  FOREIGN KEY (automob_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_application (mission_id, automob_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index pour améliorer les performances
CREATE INDEX idx_mission_applications_mission ON mission_applications(mission_id);
CREATE INDEX idx_mission_applications_automob ON mission_applications(automob_id);
CREATE INDEX idx_mission_applications_status ON mission_applications(status);
