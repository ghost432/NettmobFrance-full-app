-- Script de vérification et création de toutes les tables nécessaires

-- 1. Vérifier que la table missions a tous les champs nécessaires
ALTER TABLE missions 
ADD COLUMN IF NOT EXISTS assigned_automob_id INT NULL,
ADD COLUMN IF NOT EXISTS applications_count INT DEFAULT 0,
ADD FOREIGN KEY IF NOT EXISTS fk_missions_automob (assigned_automob_id) REFERENCES users(id) ON DELETE SET NULL;

-- 2. Vérifier la table mission_competences
CREATE TABLE IF NOT EXISTS mission_competences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  mission_id INT NOT NULL,
  competence_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
  FOREIGN KEY (competence_id) REFERENCES competences(id) ON DELETE CASCADE,
  UNIQUE KEY unique_mission_competence (mission_id, competence_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Vérifier la table mission_applications
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

-- 4. Vérifier les index
CREATE INDEX IF NOT EXISTS idx_missions_status ON missions(status);
CREATE INDEX IF NOT EXISTS idx_missions_client ON missions(client_id);
CREATE INDEX IF NOT EXISTS idx_missions_dates ON missions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_mission_applications_mission ON mission_applications(mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_applications_automob ON mission_applications(automob_id);
CREATE INDEX IF NOT EXISTS idx_mission_applications_status ON mission_applications(status);

-- 5. Vérifier la table identity_verifications_new
CREATE TABLE IF NOT EXISTS identity_verifications_new (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  user_type ENUM('automob', 'client') NOT NULL,
  
  -- Informations personnelles/gérant
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  manager_position VARCHAR(100),
  
  -- Documents
  document_type ENUM('carte_identite', 'passeport', 'permis_conduire', 'titre_sejour'),
  document_recto VARCHAR(255),
  document_verso VARCHAR(255),
  selfie_with_document VARCHAR(255),
  
  -- Documents professionnels (automob)
  assurance_rc VARCHAR(255),
  justificatif_domicile VARCHAR(255),
  avis_insee VARCHAR(255),
  attestation_urssaf VARCHAR(255),
  
  -- Documents entreprise (client)
  kbis VARCHAR(255),
  
  -- Habilitations & CACES (automob)
  has_habilitations ENUM('oui', 'non') DEFAULT 'non',
  nombre_habilitations INT DEFAULT 0,
  habilitations_files TEXT,
  has_caces ENUM('oui', 'non') DEFAULT 'non',
  nombre_caces INT DEFAULT 0,
  caces_files TEXT,
  
  -- Présentation
  presentation TEXT,
  
  -- Statut
  status ENUM('en_attente', 'approuve', 'rejete', 'revoque') DEFAULT 'en_attente',
  admin_comment TEXT,
  reviewed_by INT,
  reviewed_at TIMESTAMP NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index pour identity_verifications_new
CREATE INDEX IF NOT EXISTS idx_verifications_user ON identity_verifications_new(user_id);
CREATE INDEX IF NOT EXISTS idx_verifications_status ON identity_verifications_new(status);
CREATE INDEX IF NOT EXISTS idx_verifications_type ON identity_verifications_new(user_type);
