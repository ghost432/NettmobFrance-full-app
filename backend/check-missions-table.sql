-- Vérifier la structure de la table missions
DESCRIBE missions;

-- Vérifier si les colonnes nécessaires existent
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'automob_db' AND TABLE_NAME = 'missions'
ORDER BY ORDINAL_POSITION;
