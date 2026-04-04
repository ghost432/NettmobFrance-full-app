-- Script SQL pour créer une diversité d'utilisateurs avec différents statuts de vérification
-- À exécuter manuellement si vous souhaitez avoir plus d'utilisateurs de test

-- Mettre à jour un automob pour avoir l'identité vérifiée (pour la diversité)
UPDATE users 
SET id_verified = 1 
WHERE email = 'ulrichthierry47@gmail.com';

-- Créer quelques utilisateurs de test supplémentaires si nécessaire
-- (décommenter si vous voulez plus d'utilisateurs)

/*
-- Client vérifié
INSERT INTO users (email, password, role, verified, id_verified, created_at, updated_at)
VALUES ('client.verified@test.com', '$2a$10$YourHashedPasswordHere', 'client', 1, 1, NOW(), NOW());

SET @client_verified_id = LAST_INSERT_ID();
INSERT INTO client_profiles (user_id, company_name, phone, created_at, updated_at)
VALUES (@client_verified_id, 'Entreprise Vérifiée SARL', '+33 1 23 45 67 89', NOW(), NOW());

-- Client non vérifié
INSERT INTO users (email, password, role, verified, id_verified, created_at, updated_at)
VALUES ('client.notverified@test.com', '$2a$10$YourHashedPasswordHere', 'client', 1, 0, NOW(), NOW());

SET @client_not_verified_id = LAST_INSERT_ID();
INSERT INTO client_profiles (user_id, company_name, phone, created_at, updated_at)
VALUES (@client_not_verified_id, 'Entreprise Test SARL', '+33 1 98 76 54 32', NOW(), NOW());

-- Automob vérifié supplémentaire
INSERT INTO users (email, password, role, verified, id_verified, created_at, updated_at)
VALUES ('automob.verified@test.com', '$2a$10$YourHashedPasswordHere', 'automob', 1, 1, NOW(), NOW());

SET @automob_verified_id = LAST_INSERT_ID();
INSERT INTO automob_profiles (user_id, first_name, last_name, phone, created_at, updated_at)
VALUES (@automob_verified_id, 'Jean', 'Vérifié', '+33 6 11 22 33 44', NOW(), NOW());

-- Automob non vérifié email
INSERT INTO users (email, password, role, verified, id_verified, created_at, updated_at)
VALUES ('automob.notverified@test.com', '$2a$10$YourHashedPasswordHere', 'automob', 0, 0, NOW(), NOW());

SET @automob_not_verified_id = LAST_INSERT_ID();
INSERT INTO automob_profiles (user_id, first_name, last_name, phone, created_at, updated_at)
VALUES (@automob_not_verified_id, 'Marie', 'NonVérifiée', '+33 6 55 66 77 88', NOW(), NOW());
*/
