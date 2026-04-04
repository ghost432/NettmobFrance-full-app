-- Script d'initialisation du système de support
-- Exécuter ce script pour créer les tables nécessaires

USE nettmobfrance;

-- Table des tickets de support
CREATE TABLE IF NOT EXISTS support_tickets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  subject VARCHAR(255) NOT NULL,
  status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
  priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
  category ENUM('technical', 'account', 'payment', 'mission', 'other') DEFAULT 'other',
  assigned_admin_id INT NULL,
  last_message_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_admin_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_assigned_admin (assigned_admin_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des messages de support
CREATE TABLE IF NOT EXISTS support_messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ticket_id INT NOT NULL,
  sender_id INT NOT NULL,
  message TEXT NOT NULL,
  is_admin TINYINT(1) DEFAULT 0,
  is_read TINYINT(1) DEFAULT 0,
  attachments JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_ticket_id (ticket_id),
  INDEX idx_sender_id (sender_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Supprimer le trigger existant s'il existe
DROP TRIGGER IF EXISTS update_ticket_last_message;

-- Trigger pour mettre à jour last_message_at
DELIMITER $$
CREATE TRIGGER update_ticket_last_message
AFTER INSERT ON support_messages
FOR EACH ROW
BEGIN
  UPDATE support_tickets 
  SET last_message_at = NEW.created_at 
  WHERE id = NEW.ticket_id;
END$$
DELIMITER ;

-- Vérifier les tables créées
SELECT 'Tables de support créées avec succès !' as message;
SELECT COUNT(*) as support_tickets_count FROM support_tickets;
SELECT COUNT(*) as support_messages_count FROM support_messages;
