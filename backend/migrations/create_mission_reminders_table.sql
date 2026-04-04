-- Table pour stocker les rappels envoyés aux automobs
CREATE TABLE IF NOT EXISTS mission_reminders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  mission_id INT NOT NULL,
  automob_id INT NOT NULL,
  reminder_type ENUM('mission_start', 'timesheet') NOT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_mission_automob (mission_id, automob_id),
  INDEX idx_reminder_type (reminder_type),
  INDEX idx_sent_at (sent_at),
  
  FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
  FOREIGN KEY (automob_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
