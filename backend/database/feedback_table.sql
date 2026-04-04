-- Table pour stocker les avis utilisateurs
CREATE TABLE IF NOT EXISTS user_feedback (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  user_role ENUM('client', 'automob') NOT NULL,
  user_display_name VARCHAR(255) NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT NOT NULL,
  suggestions TEXT,
  category ENUM('general', 'performance', 'interface', 'fonctionnalites', 'bugs') DEFAULT 'general',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_rating (rating),
  INDEX idx_is_read (is_read)
);

-- Ajouter une colonne pour marquer si l'utilisateur a déjà donné son avis
ALTER TABLE users ADD COLUMN feedback_given BOOLEAN DEFAULT FALSE;
