-- Table pour les nouvelles vérifications d'identité complètes
CREATE TABLE IF NOT EXISTS identity_verifications_new (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  user_type ENUM('automob', 'client') NOT NULL,
  
  -- Informations personnelles (AUTOMOB)
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  
  -- Informations gérant (CLIENT)
  manager_first_name VARCHAR(100),
  manager_last_name VARCHAR(100),
  manager_email VARCHAR(255),
  manager_phone VARCHAR(20),
  manager_address TEXT,
  manager_position VARCHAR(100),
  
  -- Documents d'identité (commun)
  document_type ENUM('carte_identite', 'passeport', 'permis_conduire') NOT NULL,
  document_recto TEXT,
  document_verso TEXT,
  selfie_with_document TEXT,
  
  -- Documents professionnels AUTOMOB
  assurance_rc TEXT,
  justificatif_domicile TEXT,
  avis_insee TEXT,
  attestation_urssaf TEXT,
  
  -- Habilitations AUTOMOB
  has_habilitations BOOLEAN DEFAULT FALSE,
  nombre_habilitations INT DEFAULT 0,
  habilitations_files JSON,
  
  -- CACES AUTOMOB
  has_caces BOOLEAN DEFAULT FALSE,
  nombre_caces INT DEFAULT 0,
  caces_files JSON,
  
  -- Documents entreprise CLIENT
  kbis TEXT,
  
  -- Présentation
  presentation TEXT,
  
  -- Statut
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  submitted_at DATETIME,
  reviewed_at DATETIME,
  reviewed_by INT,
  rejection_reason TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_user_type (user_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
