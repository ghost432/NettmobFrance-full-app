-- Ajouter la colonne related_id à la table notifications
ALTER TABLE notifications 
ADD COLUMN related_id INT NULL AFTER type,
ADD INDEX idx_related_id (related_id);
