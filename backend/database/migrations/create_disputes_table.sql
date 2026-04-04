-- Table pour gérer les litiges entre automobs et clients
CREATE TABLE IF NOT EXISTS disputes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Référence à la mission concernée
  mission_id INT NOT NULL,
  
  -- Qui a créé le litige
  created_by_user_id INT NOT NULL,
  created_by_role ENUM('automob', 'client') NOT NULL,
  
  -- Contre qui le litige est créé
  against_user_id INT NOT NULL,
  against_role ENUM('automob', 'client') NOT NULL,
  
  -- Type de litige
  dispute_type ENUM(
    'payment_issue',           -- Problème de paiement
    'service_quality',         -- Qualité du service
    'mission_cancellation',    -- Annulation de mission
    'communication_issue',     -- Problème de communication
    'contract_breach',         -- Non-respect du contrat
    'other'                    -- Autre
  ) NOT NULL DEFAULT 'other',
  
  -- Détails du litige
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  -- Montant en litige (si applicable)
  disputed_amount DECIMAL(10, 2) DEFAULT 0.00,
  
  -- Preuves (URLs des fichiers uploadés)
  evidence JSON DEFAULT NULL COMMENT 'Array of file URLs',
  
  -- Statut du litige
  status ENUM(
    'pending',        -- En attente de traitement admin
    'under_review',   -- En cours d'examen par admin
    'resolved',       -- Résolu
    'rejected'        -- Rejeté
  ) NOT NULL DEFAULT 'pending',
  
  -- Décision de l'admin
  admin_decision ENUM('automob_wins', 'client_wins', 'partial', 'rejected') DEFAULT NULL,
  admin_notes TEXT DEFAULT NULL,
  admin_user_id INT DEFAULT NULL,
  decided_at DATETIME DEFAULT NULL,
  
  -- Compensation financière (si applicable)
  compensation_amount DECIMAL(10, 2) DEFAULT 0.00,
  compensation_to_user_id INT DEFAULT NULL,
  compensation_paid BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (against_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (compensation_to_user_id) REFERENCES users(id) ON DELETE SET NULL,
  
  -- Indexes pour améliorer les performances
  INDEX idx_mission (mission_id),
  INDEX idx_created_by (created_by_user_id),
  INDEX idx_against (against_user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table pour les messages/commentaires dans un litige
CREATE TABLE IF NOT EXISTS dispute_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dispute_id INT NOT NULL,
  user_id INT NOT NULL,
  user_role ENUM('automob', 'client', 'admin') NOT NULL,
  message TEXT NOT NULL,
  attachments JSON DEFAULT NULL COMMENT 'Array of file URLs',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (dispute_id) REFERENCES disputes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  INDEX idx_dispute (dispute_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table pour l'historique des actions admin sur les litiges
CREATE TABLE IF NOT EXISTS dispute_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dispute_id INT NOT NULL,
  admin_user_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  details TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (dispute_id) REFERENCES disputes(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  INDEX idx_dispute (dispute_id),
  INDEX idx_admin (admin_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
