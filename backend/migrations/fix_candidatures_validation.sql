-- Fix: Validation des candidatures
-- Date: 9 novembre 2025
-- Problème: Les candidatures ne se valident pas correctement

USE nettmobfrance;

-- ============================================
-- 1. VÉRIFIER LA STRUCTURE DE LA TABLE MISSIONS
-- ============================================

-- Vérifier si mission_name existe
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'nettmobfrance' 
AND TABLE_NAME = 'missions'
AND COLUMN_NAME IN ('mission_name', 'title', 'nb_automobs', 'automobs_needed');

-- ============================================
-- 2. AJOUTER LES COLONNES MANQUANTES
-- ============================================

-- Ajouter mission_name si elle n'existe pas
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'nettmobfrance' 
AND TABLE_NAME = 'missions' 
AND COLUMN_NAME = 'mission_name';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE missions ADD COLUMN mission_name VARCHAR(255) AFTER client_id',
    'SELECT "mission_name existe déjà" as info');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter nb_automobs si elle n'existe pas
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'nettmobfrance' 
AND TABLE_NAME = 'missions' 
AND COLUMN_NAME = 'nb_automobs';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE missions ADD COLUMN nb_automobs INT DEFAULT 1 AFTER hourly_rate',
    'SELECT "nb_automobs existe déjà" as info');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 3. MIGRER LES DONNÉES SI NÉCESSAIRE
-- ============================================

-- Copier title dans mission_name si mission_name est vide
UPDATE missions 
SET mission_name = title 
WHERE (mission_name IS NULL OR mission_name = '') 
AND title IS NOT NULL AND title != '';

-- Mettre nb_automobs à 1 par défaut si NULL
UPDATE missions 
SET nb_automobs = 1 
WHERE nb_automobs IS NULL OR nb_automobs = 0;

-- ============================================
-- 4. VÉRIFIER LA TABLE MISSION_APPLICATIONS
-- ============================================

SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'nettmobfrance' 
AND TABLE_NAME = 'mission_applications';

-- Vérifier les statuts possibles
SELECT COLUMN_TYPE
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'nettmobfrance' 
AND TABLE_NAME = 'mission_applications'
AND COLUMN_NAME = 'status';

-- ============================================
-- 5. VÉRIFIER LES DONNÉES
-- ============================================

-- Compter les candidatures par statut
SELECT 
    status,
    COUNT(*) as count
FROM mission_applications
GROUP BY status;

-- Vérifier les missions avec leurs candidatures
SELECT 
    m.id,
    COALESCE(m.mission_name, m.title) as mission_title,
    m.client_id,
    m.nb_automobs,
    m.status as mission_status,
    COUNT(ma.id) as total_applications,
    SUM(CASE WHEN ma.status = 'en_attente' THEN 1 ELSE 0 END) as pending,
    SUM(CASE WHEN ma.status = 'accepte' THEN 1 ELSE 0 END) as accepted,
    SUM(CASE WHEN ma.status = 'refuse' THEN 1 ELSE 0 END) as rejected
FROM missions m
LEFT JOIN mission_applications ma ON m.id = ma.mission_id
GROUP BY m.id
HAVING total_applications > 0;

-- ============================================
-- 6. VÉRIFIER LES FOREIGN KEYS
-- ============================================

SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'nettmobfrance'
AND TABLE_NAME = 'mission_applications'
AND REFERENCED_TABLE_NAME IS NOT NULL;

-- ============================================
-- 7. TEST DE MISE À JOUR (COMMENTÉ)
-- ============================================

-- NE PAS EXÉCUTER EN PRODUCTION SANS VÉRIFICATION
-- SELECT * FROM mission_applications WHERE id = 1;
-- UPDATE mission_applications SET status = 'accepte' WHERE id = 1;
-- SELECT * FROM mission_applications WHERE id = 1;

-- ============================================
-- 8. RÉSUMÉ
-- ============================================

SELECT '✅ Vérification terminée' as status;
SELECT 'Vérifiez les résultats ci-dessus' as info;
SELECT 'Si tout est OK, testez l\'acceptation/refus depuis l\'interface' as next_step;
