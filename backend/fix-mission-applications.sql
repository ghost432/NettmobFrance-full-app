-- Corriger la table mission_applications
-- Ajouter la colonne updated_at qui manque

USE nettmobfrance;

-- Ajouter updated_at (ignorer si existe déjà)
ALTER TABLE mission_applications 
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- Vérifier la structure finale
DESCRIBE mission_applications;

-- Afficher un résumé
SELECT 'Table mission_applications corrigée avec succès !' as message;
