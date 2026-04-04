-- Migration pour supporter plusieurs automobs par mission

-- Ajouter le champ automobs_needed à la table missions
ALTER TABLE missions 
ADD COLUMN automobs_needed INT DEFAULT 1 AFTER assigned_automob_id,
ADD COLUMN max_applications INT DEFAULT NULL AFTER automobs_needed;

-- Créer une table pour gérer les automobs assignés (relation many-to-many)
CREATE TABLE IF NOT EXISTS mission_automobs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    mission_id INT NOT NULL,
    automob_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('actif', 'termine', 'annule') DEFAULT 'actif',
    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
    FOREIGN KEY (automob_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_mission_automob (mission_id, automob_id),
    INDEX idx_mission (mission_id),
    INDEX idx_automob (automob_id)
);

-- Migrer les données existantes (assigned_automob_id vers mission_automobs)
INSERT INTO mission_automobs (mission_id, automob_id, status)
SELECT id, assigned_automob_id, 'actif'
FROM missions
WHERE assigned_automob_id IS NOT NULL;

-- Note: On garde assigned_automob_id pour compatibilité mais on utilisera mission_automobs
