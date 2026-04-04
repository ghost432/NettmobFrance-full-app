-- Table pour les feuilles de temps (timesheets)
CREATE TABLE IF NOT EXISTS timesheets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    mission_id INT NOT NULL,
    automob_id INT NOT NULL,
    period_type ENUM('jour', 'semaine', 'mois') NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_hours DECIMAL(6, 2) NOT NULL DEFAULT 0,
    status ENUM('brouillon', 'soumis', 'approuve', 'rejete') DEFAULT 'brouillon',
    submitted_at TIMESTAMP NULL,
    reviewed_at TIMESTAMP NULL,
    reviewed_by INT NULL,
    rejection_reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
    FOREIGN KEY (automob_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_mission (mission_id),
    INDEX idx_automob (automob_id),
    INDEX idx_status (status),
    INDEX idx_period (period_start, period_end)
);

-- Table pour les entrées de temps détaillées
CREATE TABLE IF NOT EXISTS timesheet_entries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    timesheet_id INT NOT NULL,
    work_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_duration DECIMAL(4, 2) DEFAULT 0,
    hours_worked DECIMAL(5, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (timesheet_id) REFERENCES timesheets(id) ON DELETE CASCADE,
    INDEX idx_timesheet (timesheet_id),
    INDEX idx_date (work_date)
);
