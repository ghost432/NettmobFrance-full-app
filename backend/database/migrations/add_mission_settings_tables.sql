-- Migration: Ajout des tables pour les paramètres de mission
-- Date: 2024-11-13

USE nettmobfrance;

-- Table pour les fréquences de facturation
CREATE TABLE IF NOT EXISTS billing_frequencies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    value VARCHAR(50) NOT NULL UNIQUE,
    label VARCHAR(100) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (active)
);

-- Table pour les types de lieux de mission
CREATE TABLE IF NOT EXISTS location_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    value VARCHAR(50) NOT NULL UNIQUE,
    label VARCHAR(100) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (active)
);

-- Table pour les tarifs horaires suggérés
CREATE TABLE IF NOT EXISTS hourly_rates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    rate DECIMAL(10, 2) NOT NULL,
    label VARCHAR(100) NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (active),
    INDEX idx_rate (rate)
);

-- Insertion des données par défaut pour les fréquences de facturation
INSERT INTO billing_frequencies (value, label) VALUES
('jour', 'Par jour'),
('semaine', 'Par semaine'),
('mois', 'Par mois'),
('mission', 'À la mission')
ON DUPLICATE KEY UPDATE label = VALUES(label);

-- Insertion des données par défaut pour les types de lieux
INSERT INTO location_types (value, label) VALUES
('sur_site', 'Sur site'),
('a_distance', 'À distance'),
('hybride', 'Hybride')
ON DUPLICATE KEY UPDATE label = VALUES(label);

-- Insertion des données par défaut pour les tarifs horaires
INSERT INTO hourly_rates (rate, label, description) VALUES
(15.00, 'Débutant', 'Pour les missions simples'),
(20.00, 'Standard', 'Tarif moyen du marché'),
(25.00, 'Intermédiaire', 'Pour les profils avec expérience'),
(30.00, 'Expert', 'Pour les profils hautement qualifiés'),
(35.00, 'Premium', 'Pour les missions spécialisées')
ON DUPLICATE KEY UPDATE label = VALUES(label), description = VALUES(description);
