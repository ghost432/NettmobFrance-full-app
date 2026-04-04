-- NettmobFrance Database Schema avec Chat et Géolocalisation
DROP DATABASE IF EXISTS nettmobfrance;
CREATE DATABASE nettmobfrance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nettmobfrance;

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('automob', 'client', 'admin') NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- Secteurs d'activité
CREATE TABLE secteurs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Compétences liées aux secteurs
CREATE TABLE competences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    secteur_id INT NOT NULL,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (secteur_id) REFERENCES secteurs(id) ON DELETE CASCADE,
    INDEX idx_secteur (secteur_id)
);

-- Automob profiles avec géolocalisation
CREATE TABLE automob_profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    siret VARCHAR(14),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    phone_country_code VARCHAR(5) DEFAULT '+33',
    experience VARCHAR(50),
    secteur_id INT,
    address TEXT,
    city VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    availability_start_date DATE NULL,
    availability_end_date DATE NULL,
    wallet_balance DECIMAL(10, 2) DEFAULT 0.00,
    vehicle_type VARCHAR(50),
    hourly_rate DECIMAL(10, 2),
    profile_picture VARCHAR(255),
    cover_picture VARCHAR(255),
    id_document_path VARCHAR(255),
    id_verified BOOLEAN DEFAULT FALSE,
    web_push_enabled BOOLEAN DEFAULT FALSE,
    web_push_subscription TEXT,
    email_notifications BOOLEAN DEFAULT TRUE,
    privacy_policy_accepted BOOLEAN DEFAULT FALSE,
    billing_mandate_accepted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (secteur_id) REFERENCES secteurs(id) ON DELETE SET NULL,
    INDEX idx_city (city),
    INDEX idx_location (latitude, longitude),
    INDEX idx_secteur (secteur_id)
);

-- Table de liaison automob-compétences
CREATE TABLE automob_competences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    automob_profile_id INT NOT NULL,
    competence_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (automob_profile_id) REFERENCES automob_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (competence_id) REFERENCES competences(id) ON DELETE CASCADE,
    UNIQUE KEY unique_automob_competence (automob_profile_id, competence_id)
);

-- Client profiles avec géolocalisation
CREATE TABLE client_profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    phone_country_code VARCHAR(5) DEFAULT '+33',
    address TEXT,
    city VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    siret VARCHAR(14),
    secteur_id INT,
    representative_id_path VARCHAR(255),
    representative_id_verified BOOLEAN DEFAULT FALSE,
    profile_picture VARCHAR(255),
    cover_picture VARCHAR(255),
    web_push_enabled BOOLEAN DEFAULT FALSE,
    web_push_subscription TEXT,
    email_notifications BOOLEAN DEFAULT TRUE,
    privacy_policy_accepted BOOLEAN DEFAULT FALSE,
    billing_mandate_accepted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (secteur_id) REFERENCES secteurs(id) ON DELETE SET NULL,
    INDEX idx_location (latitude, longitude),
    INDEX idx_secteur (secteur_id)
);

-- Table de liaison client-profils recherchés (compétences)
CREATE TABLE client_profils_recherches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_profile_id INT NOT NULL,
    competence_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_profile_id) REFERENCES client_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (competence_id) REFERENCES competences(id) ON DELETE CASCADE,
    UNIQUE KEY unique_client_competence (client_profile_id, competence_id)
);

-- Missions avec géolocalisation
CREATE TABLE missions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    budget DECIMAL(10, 2) NOT NULL,
    start_date DATE,
    end_date DATE,
    status ENUM('ouvert', 'en_cours', 'termine', 'annule') DEFAULT 'ouvert',
    assigned_automob_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_automob_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_location (latitude, longitude)
);

-- Mission applications
CREATE TABLE mission_applications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    mission_id INT NOT NULL,
    automob_id INT NOT NULL,
    status ENUM('en_attente', 'accepte', 'refuse') DEFAULT 'en_attente',
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
    FOREIGN KEY (automob_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_application (mission_id, automob_id)
);

-- Time logs
CREATE TABLE time_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    mission_id INT NOT NULL,
    automob_id INT NOT NULL,
    date DATE NOT NULL,
    hours DECIMAL(5, 2) NOT NULL,
    description TEXT,
    validated BOOLEAN DEFAULT FALSE,
    validated_by INT,
    validated_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
    FOREIGN KEY (automob_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (validated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Invoices
CREATE TABLE invoices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    mission_id INT NOT NULL,
    automob_id INT NOT NULL,
    client_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    pdf_path VARCHAR(255),
    status ENUM('en_attente', 'payee', 'annulee') DEFAULT 'en_attente',
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP NULL,
    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
    FOREIGN KEY (automob_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Withdrawals
CREATE TABLE withdrawals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    automob_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('en_attente', 'approuve', 'refuse') DEFAULT 'en_attente',
    iban VARCHAR(34),
    processed_by INT,
    processed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (automob_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Reviews
CREATE TABLE reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    mission_id INT NOT NULL,
    automob_id INT NOT NULL,
    client_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
    FOREIGN KEY (automob_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_review (mission_id, client_id)
);

-- Notifications
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    read_status BOOLEAN DEFAULT FALSE,
    related_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
);

-- Transactions
CREATE TABLE transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    automob_id INT NOT NULL,
    type ENUM('credit', 'debit') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    reference_type VARCHAR(50),
    reference_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (automob_id) REFERENCES users(id) ON DELETE CASCADE
);

-- NOUVEAU: Chat conversations
CREATE TABLE chat_conversations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    mission_id INT NOT NULL,
    client_id INT NOT NULL,
    automob_id INT NOT NULL,
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (automob_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_conversation (mission_id, client_id, automob_id),
    INDEX idx_participants (client_id, automob_id)
);

-- NOUVEAU: Chat messages
CREATE TABLE chat_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    conversation_id INT NOT NULL,
    sender_id INT NOT NULL,
    message TEXT NOT NULL,
    read_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_conversation (conversation_id),
    INDEX idx_created (created_at)
);

-- Insert default admin
INSERT INTO users (email, password, role, verified) VALUES 
('noreply@nettmobfrance.fr', '$2b$10$YourHashedPasswordHere', 'admin', TRUE);

-- Insert secteurs d'activité
INSERT INTO secteurs (nom, description) VALUES
('Logistique – Grande Surface', 'Travail en grande surface avec gestion de stocks et rayons'),
('Logistique – Entrepôt', 'Manutention et gestion d\'entrepôt'),
('Hôtellerie', 'Services hôteliers et accueil clientèle'),
('Nettoyage professionnel', 'Nettoyage de locaux et entretien');

-- Insert compétences pour Logistique – Grande Surface (id 1)
INSERT INTO competences (secteur_id, nom) VALUES
(1, 'Préparation de commandes en magasin ou rayons'),
(1, 'Réassortiment, gestion des stocks, mise en rayon'),
(1, 'Utilisation de transpalette, chariot élévateur (souhaitable)'),
(1, 'Respect des consignes de sécurité, bonnes conditions physiques');

-- Insert compétences pour Logistique – Entrepôt (id 2)
INSERT INTO competences (secteur_id, nom) VALUES
(2, 'Manutention de marchandises, chargement/déchargement'),
(2, 'Conditionnement, rangement, gestion d\'inventaire'),
(2, 'Utilisation de matériel (chariot, transpalette)'),
(2, 'Respect des normes et procédures d\'entrepôt');

-- Insert compétences pour Hôtellerie (id 3)
INSERT INTO competences (secteur_id, nom) VALUES
(3, 'Accueil clientèle ou services hôteliers (ménage, petit-déjeuner, réception)'),
(3, 'Qualité de service, relation client, polyvalence'),
(3, 'Gestion des urgences, disponibilité (week-ends/soirées)');

-- Insert compétences pour Nettoyage professionnel (id 4)
INSERT INTO competences (secteur_id, nom) VALUES
(4, 'Nettoyage de locaux, bâtiments, entretien industriel ou tertiaire'),
(4, 'Respect des protocoles d\'hygiène et de sécurité'),
(4, 'Autonomie, ponctualité, rigueur');
