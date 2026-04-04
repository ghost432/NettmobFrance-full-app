-- Migration: Ajout des champs pour profil client et table documents automob
-- Date: 2024-11-05

-- Ajouter les colonnes manquantes dans client_profiles
ALTER TABLE client_profiles
ADD COLUMN manager_position VARCHAR(100) AFTER last_name,
ADD COLUMN company_description TEXT AFTER secteur_id;

-- Créer la table pour les documents et habilitations des automob
CREATE TABLE IF NOT EXISTS automob_documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('document', 'habilitation') NOT NULL DEFAULT 'document',
    has_expiry BOOLEAN DEFAULT FALSE,
    file_path VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rollback (si besoin d'annuler cette migration)
-- ALTER TABLE client_profiles DROP COLUMN manager_position;
-- ALTER TABLE client_profiles DROP COLUMN company_description;
-- DROP TABLE IF EXISTS automob_documents;
