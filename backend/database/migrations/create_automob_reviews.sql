-- Créer la table pour les avis des clients sur les automobs
CREATE TABLE IF NOT EXISTS automob_reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  automob_id INT NOT NULL,
  client_id INT NOT NULL,
  mission_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (automob_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
  INDEX idx_automob_id (automob_id),
  INDEX idx_client_id (client_id),
  INDEX idx_mission_id (mission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ajouter la colonne completed_at à mission_automobs si elle n'existe pas
ALTER TABLE mission_automobs 
ADD COLUMN completed_at TIMESTAMP NULL AFTER status;
