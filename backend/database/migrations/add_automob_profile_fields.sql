-- Vérifier et ajouter les colonnes une par une
-- Note: Si une colonne existe déjà, commentez la ligne correspondante

-- Colonne gender
ALTER TABLE automob_profiles ADD COLUMN gender ENUM('homme', 'femme', '') DEFAULT '' AFTER last_name;

-- Colonne iban
ALTER TABLE automob_profiles ADD COLUMN iban VARCHAR(34) AFTER phone_country_code;

-- Colonne bic_swift
ALTER TABLE automob_profiles ADD COLUMN bic_swift VARCHAR(11) AFTER iban;

-- Colonne years_of_experience
ALTER TABLE automob_profiles ADD COLUMN years_of_experience ENUM('junior', 'intermediaire', 'senior', 'expert', '') DEFAULT '' AFTER experience;

-- Colonne about_me
ALTER TABLE automob_profiles ADD COLUMN about_me TEXT AFTER secteur_id;

-- Colonne work_areas
ALTER TABLE automob_profiles ADD COLUMN work_areas JSON AFTER city;

-- Table pour gérer les disponibilités multiples
CREATE TABLE IF NOT EXISTS automob_availabilities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_dates (user_id, start_date, end_date)
);
