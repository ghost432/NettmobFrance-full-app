-- Migration pour le système de wallet et retraits

-- Table des wallets pour chaque automob
CREATE TABLE IF NOT EXISTS wallets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  automob_id INT NOT NULL UNIQUE,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  total_earned DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  total_withdrawn DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (automob_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_automob_id (automob_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des demandes de retrait
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  automob_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'completed') NOT NULL DEFAULT 'pending',
  payment_method ENUM('bank_transfer', 'paypal', 'other') NOT NULL DEFAULT 'bank_transfer',
  bank_details TEXT,
  notes TEXT,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_by INT,
  reviewed_at TIMESTAMP NULL,
  admin_notes TEXT,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (automob_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_automob_id (automob_id),
  INDEX idx_status (status),
  INDEX idx_requested_at (requested_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des transactions wallet (historique)
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  wallet_id INT NOT NULL,
  automob_id INT NOT NULL,
  type ENUM('credit', 'debit', 'adjustment') NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  balance_before DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  description VARCHAR(255),
  reference_type ENUM('invoice', 'withdrawal', 'manual_adjustment', 'other'),
  reference_id INT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
  FOREIGN KEY (automob_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_wallet_id (wallet_id),
  INDEX idx_automob_id (automob_id),
  INDEX idx_type (type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Créer automatiquement un wallet pour tous les automobs existants
INSERT INTO wallets (automob_id, balance, total_earned, total_withdrawn)
SELECT u.id, 0.00, 0.00, 0.00
FROM users u
WHERE u.role = 'automob' 
AND NOT EXISTS (SELECT 1 FROM wallets w WHERE w.automob_id = u.id);
