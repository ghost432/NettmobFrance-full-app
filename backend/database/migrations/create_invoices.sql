-- Table pour les factures
CREATE TABLE IF NOT EXISTS invoices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_type ENUM('automob', 'client', 'admin_summary') NOT NULL,
  
  -- Relations
  mission_id INT NOT NULL,
  automob_id INT,
  client_id INT,
  
  -- Période de facturation
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Détails financiers
  total_hours DECIMAL(10, 2) NOT NULL DEFAULT 0,
  hourly_rate DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  commission_rate DECIMAL(5, 2) DEFAULT 20.00,
  commission_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  
  -- Statut
  status ENUM('draft', 'issued', 'paid', 'cancelled') DEFAULT 'draft',
  
  -- Dates
  issue_date DATE,
  due_date DATE,
  paid_date DATE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
  FOREIGN KEY (automob_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE SET NULL,
  
  INDEX idx_invoice_number (invoice_number),
  INDEX idx_mission (mission_id),
  INDEX idx_automob (automob_id),
  INDEX idx_client (client_id),
  INDEX idx_status (status),
  INDEX idx_dates (issue_date, due_date)
);

-- Table pour les lignes de facture (détails)
CREATE TABLE IF NOT EXISTS invoice_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_id INT NOT NULL,
  
  -- Description
  description TEXT NOT NULL,
  timesheet_id INT,
  
  -- Quantité et prix
  quantity DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  
  -- Heures supplémentaires
  is_overtime BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (timesheet_id) REFERENCES timesheets(id) ON DELETE SET NULL,
  
  INDEX idx_invoice (invoice_id),
  INDEX idx_timesheet (timesheet_id)
);

-- Table pour les factures récapitulatives admin (plusieurs automobs)
CREATE TABLE IF NOT EXISTS admin_invoice_summary (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_id INT NOT NULL,
  automob_id INT NOT NULL,
  
  total_hours DECIMAL(10, 2) NOT NULL,
  amount_to_pay DECIMAL(10, 2) NOT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (automob_id) REFERENCES users(id) ON DELETE CASCADE,
  
  INDEX idx_invoice (invoice_id),
  INDEX idx_automob (automob_id)
);
