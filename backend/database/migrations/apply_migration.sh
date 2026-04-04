#!/bin/bash

# Script pour appliquer la migration des champs automob_profiles

echo "Application de la migration..."
echo "Veuillez entrer le mot de passe MySQL root:"

mysql -u root -p automob_app << 'EOF'
-- Ajouter nouveaux champs au profil automob (si non existants)
ALTER TABLE automob_profiles
ADD COLUMN IF NOT EXISTS gender ENUM('homme', 'femme', '') DEFAULT '' AFTER last_name,
ADD COLUMN IF NOT EXISTS iban VARCHAR(34) AFTER phone_country_code,
ADD COLUMN IF NOT EXISTS bic_swift VARCHAR(11) AFTER iban,
ADD COLUMN IF NOT EXISTS years_of_experience ENUM('junior', 'intermediaire', 'senior', 'expert', '') DEFAULT '' AFTER experience,
ADD COLUMN IF NOT EXISTS about_me TEXT AFTER secteur_id,
ADD COLUMN IF NOT EXISTS work_areas JSON AFTER city;

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

-- Vérifier les colonnes créées
DESCRIBE automob_profiles;

-- Vérifier la table des disponibilités
DESCRIBE automob_availabilities;

SELECT 'Migration terminée avec succès!' AS status;
EOF

echo "Migration appliquée!"
