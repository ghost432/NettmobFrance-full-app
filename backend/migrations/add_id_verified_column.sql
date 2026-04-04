-- Migration: Ajout de la colonne id_verified à la table users
-- Date: 2025-11-13
-- Description: Ajoute une colonne pour suivre la vérification d'identité des utilisateurs

-- Vérifier si la colonne existe déjà
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'nettmobfrance'
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'id_verified'
);

-- Ajouter la colonne si elle n'existe pas
SET @sql = IF(
    @column_exists = 0,
    'ALTER TABLE users ADD COLUMN id_verified TINYINT(1) DEFAULT 0 AFTER verified',
    'SELECT "La colonne id_verified existe déjà" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Afficher la structure de la table
DESCRIBE users;
