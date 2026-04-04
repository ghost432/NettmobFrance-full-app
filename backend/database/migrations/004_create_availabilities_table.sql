-- Migration: Create availabilities table for multiple availability periods
-- Date: 2025-01-04

-- Create table for multiple availabilities
CREATE TABLE IF NOT EXISTS automob_availabilities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    automob_profile_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (automob_profile_id) REFERENCES automob_profiles(id) ON DELETE CASCADE,
    INDEX idx_automob_profile (automob_profile_id),
    INDEX idx_dates (start_date, end_date)
);

-- Note: Old availability column will be ignored if it exists
