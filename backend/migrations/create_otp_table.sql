-- Table pour stocker les codes OTP
CREATE TABLE IF NOT EXISTS otp_codes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  email VARCHAR(255) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  type ENUM('verification', 'login') NOT NULL DEFAULT 'verification',
  expires_at DATETIME NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  attempts INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_email (user_id, email),
  INDEX idx_expiration (expires_at),
  INDEX idx_otp_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Nettoyer les OTP expirés (à exécuter périodiquement)
-- DELETE FROM otp_codes WHERE expires_at < NOW() OR verified = TRUE;
