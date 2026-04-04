-- Mise à jour de la table notifications pour supporter les Web Push
-- Ce script ajoute les colonnes manquantes sans supprimer les données existantes

USE nettmobfrance;

-- Renommer read_status en is_read si nécessaire
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'nettmobfrance' 
AND TABLE_NAME = 'notifications' 
AND COLUMN_NAME = 'read_status';

SET @query = IF(@col_exists > 0, 
    'ALTER TABLE notifications CHANGE COLUMN read_status is_read BOOLEAN DEFAULT FALSE',
    'SELECT "read_status n\'existe pas ou is_read existe déjà"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter is_read si elle n'existe pas
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'nettmobfrance' 
AND TABLE_NAME = 'notifications' 
AND COLUMN_NAME = 'is_read';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE notifications ADD COLUMN is_read BOOLEAN DEFAULT FALSE AFTER type',
    'SELECT "is_read existe déjà"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter read_at si elle n'existe pas
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'nettmobfrance' 
AND TABLE_NAME = 'notifications' 
AND COLUMN_NAME = 'read_at';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE notifications ADD COLUMN read_at TIMESTAMP NULL AFTER is_read',
    'SELECT "read_at existe déjà"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter category si elle n'existe pas
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'nettmobfrance' 
AND TABLE_NAME = 'notifications' 
AND COLUMN_NAME = 'category';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE notifications ADD COLUMN category VARCHAR(50) DEFAULT ''system'' AFTER type',
    'SELECT "category existe déjà"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter action_url si elle n'existe pas
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'nettmobfrance' 
AND TABLE_NAME = 'notifications' 
AND COLUMN_NAME = 'action_url';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE notifications ADD COLUMN action_url VARCHAR(255) NULL AFTER category',
    'SELECT "action_url existe déjà"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Afficher la structure finale
SELECT 'Structure de la table notifications:' as Info;
DESCRIBE notifications;

-- Afficher le nombre de notifications
SELECT 'Nombre de notifications:' as Info, COUNT(*) as count FROM notifications;
