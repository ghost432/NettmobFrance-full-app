-- Migration: Ajout du champ poste actuel et table des expériences professionnelles
-- Date: 2025-01-05

-- 1. Ajouter le champ current_position à la table automob_profiles
ALTER TABLE automob_profiles
ADD COLUMN current_position VARCHAR(100) DEFAULT NULL AFTER years_of_experience;

-- 2. Créer la table automob_experiences pour stocker l'historique professionnel
CREATE TABLE IF NOT EXISTS automob_experiences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    job_title VARCHAR(100) NOT NULL,
    company_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ROLLBACK (À exécuter en cas de problème)
-- ============================================
-- ALTER TABLE automob_profiles DROP COLUMN current_position;
-- DROP TABLE IF EXISTS automob_experiences;
