-- Migration: Ajouter work_time aux tarifs horaires
-- Date: 2024-11-13

-- Ajouter la colonne work_time
ALTER TABLE hourly_rates 
ADD COLUMN work_time ENUM('jour', 'nuit', 'both') DEFAULT 'both' AFTER rate;

-- Mettre à jour les tarifs existants en fonction du montant
-- Tarifs de jour (généralement plus bas)
UPDATE hourly_rates SET work_time = 'jour' WHERE rate <= 25.00;

-- Tarifs de nuit (généralement plus élevés)
UPDATE hourly_rates SET work_time = 'nuit' WHERE rate > 25.00;

-- Mettre à jour les labels pour plus de clarté
UPDATE hourly_rates SET label = 'Débutant (Jour)', description = 'Pour les missions simples en journée' WHERE id = 1;
UPDATE hourly_rates SET label = 'Standard (Jour)', description = 'Tarif moyen du marché pour le jour' WHERE id = 2;
UPDATE hourly_rates SET label = 'Intermédiaire (Jour)', description = 'Pour les profils avec expérience (jour)' WHERE id = 3;
UPDATE hourly_rates SET label = 'Standard (Nuit)', description = 'Tarif de nuit standard', work_time = 'nuit' WHERE id = 4;
UPDATE hourly_rates SET label = 'Expert (Nuit)', description = 'Pour les missions de nuit qualifiées', work_time = 'nuit' WHERE id = 5;

-- Ajouter des tarifs supplémentaires pour avoir plus d'options
INSERT INTO hourly_rates (rate, work_time, label, description, active) VALUES
(18.00, 'jour', 'Intermédiaire Plus (Jour)', 'Tarif intermédiaire amélioré pour le jour', 1),
(22.00, 'nuit', 'Débutant (Nuit)', 'Pour les missions simples de nuit', 1),
(28.00, 'nuit', 'Intermédiaire (Nuit)', 'Pour les profils avec expérience (nuit)', 1),
(40.00, 'nuit', 'Premium (Nuit)', 'Pour les missions spécialisées de nuit', 1);

-- Vérifier les données
SELECT id, rate, work_time, label, description FROM hourly_rates ORDER BY work_time, rate;
