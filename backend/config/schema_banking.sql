-- ============================================================
-- schema_banking.sql - Plateforme Bancaire Intégrée
-- MySQL 8.0+  |  Usage: mysql -u root -p < config/schema_banking.sql
-- ============================================================

-- Utiliser la base existante
USE queue_db;

-- ============= SYSTÈME DE RÔLES ET PERMISSIONS =============
CREATE TABLE IF NOT EXISTS roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO roles (id, code, name, description) VALUES
  (1, 'ADMIN', 'Administrateur', 'Gestion complète - tableaux de bord, audit'),
  (2, 'AGENT', 'Agent Bancaire', 'Opérations courantes, gestion de clients'),
  (3, 'CLIENT', 'Client', 'Espace personnel - consultation solde, virements'),
  (4, 'SERVICE_MGR', 'Gestionnaire Files', 'Gestion des files d''attente');

CREATE TABLE IF NOT EXISTS permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  module VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO permissions (code, name, module) VALUES
  -- Admin
  ('ADMIN.VIEW_DASHBOARD', 'Voir tableau de bord admin', 'admin'),
  ('ADMIN.VIEW_USERS', 'Voir liste des utilisateurs', 'admin'),
  ('ADMIN.VIEW_TRANSACTIONS', 'Voir historique transactions', 'admin'),
  ('ADMIN.VIEW_ACCOUNTS', 'Voir tous les comptes', 'admin'),
  ('ADMIN.VIEW_LOGS', 'Voir logs d''activité', 'admin'),
  ('ADMIN.MANAGE_USERS', 'Gérer utilisateurs', 'admin'),
  ('ADMIN.MANAGE_AGENTS', 'Gérer les agents', 'admin'),
  
  -- Agent
  ('AGENT.VIEW_CLIENTS', 'Voir ses clients', 'agent'),
  ('AGENT.DEPOSIT', 'Effectuer un dépôt', 'agent'),
  ('AGENT.WITHDRAW', 'Effectuer un retrait', 'agent'),
  ('AGENT.TRANSFER', 'Effectuer un virement', 'agent'),
  ('AGENT.OPEN_ACCOUNT', 'Ouvrir un compte', 'agent'),
  ('AGENT.VIEW_CLIENT_HISTORY', 'Voir historique client', 'agent'),
  
  -- Client
  ('CLIENT.VIEW_BALANCE', 'Consulter solde', 'client'),
  ('CLIENT.VIEW_HISTORY', 'Consulter historique', 'client'),
  ('CLIENT.TRANSFER', 'Effectuer un virement', 'client'),
  ('CLIENT.EDIT_PROFILE', 'Modifier profil', 'client'),
  
  -- Queue Management
  ('QUEUE.MANAGE', 'Gérer files d''attente', 'queue');

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- Assigner permissions aux rôles
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'ADMIN' AND p.module = 'admin'
UNION ALL
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'AGENT' AND p.module = 'agent'
UNION ALL
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'CLIENT' AND p.module = 'client'
UNION ALL
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'SERVICE_MGR' AND p.code = 'QUEUE.MANAGE';

-- ============= EXTENSION TABLE USERS POUR BANKING =============
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INT DEFAULT 2;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS status ENUM('ACTIVE', 'INACTIVE', 'BLOCKED') DEFAULT 'ACTIVE';
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_fa_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_fa_token VARCHAR(6);
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_fa_token_expires_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_attempts INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP NULL;
ALTER TABLE users ADD FOREIGN KEY (role_id) REFERENCES roles(id);
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_role_id (role_id);
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_status (status);

-- ============= COMPTES BANCAIRES =============
CREATE TABLE IF NOT EXISTS bank_accounts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  account_number VARCHAR(20) UNIQUE NOT NULL,
  account_type ENUM('SAVING', 'CURRENT', 'FIXED_DEPOSIT') DEFAULT 'CURRENT',
  balance DECIMAL(15, 2) DEFAULT 0.00,
  currency VARCHAR(3) DEFAULT 'USD',
  
  status ENUM('ACTIVE', 'FROZEN', 'CLOSED') DEFAULT 'ACTIVE',
  iban VARCHAR(34),
  swift_code VARCHAR(11),
  
  -- Agent gestionnaire
  agent_id INT UNSIGNED,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_agent_id (agent_id),
  INDEX idx_account_number (account_number),
  INDEX idx_status (status)
);

-- ============= TRANSACTIONS ÉTENDUES =============
CREATE TABLE IF NOT EXISTS bank_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  from_account_id INT,
  to_account_id INT,
  transaction_type ENUM('DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'FEE', 'INTEREST') NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  
  status ENUM('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED') DEFAULT 'PENDING',
  reference_number VARCHAR(50) UNIQUE,
  description VARCHAR(255),
  
  -- Qui a effectué l'opération
  initiated_by_user_id INT UNSIGNED,
  processed_by_agent_id INT UNSIGNED,
  
  -- Détails rejet
  failure_reason VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (from_account_id) REFERENCES bank_accounts(id) ON DELETE SET NULL,
  FOREIGN KEY (to_account_id) REFERENCES bank_accounts(id) ON DELETE SET NULL,
  FOREIGN KEY (initiated_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (processed_by_agent_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_from_account (from_account_id),
  INDEX idx_to_account (to_account_id),
  INDEX idx_status (status),
  INDEX idx_type (transaction_type),
  INDEX idx_created_at (created_at)
);

-- ============= LOGS D'ACTIVITÉ =============
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INT,
  
  ip_address VARCHAR(45),
  user_agent VARCHAR(255),
  
  description TEXT,
  status ENUM('SUCCESS', 'FAILURE') DEFAULT 'SUCCESS',
  error_message VARCHAR(500),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at),
  INDEX idx_entity (entity_type, entity_id)
);

-- ============= NOTIFICATIONS ÉTENDUES =============
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id INT UNSIGNED;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(50);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_entity_id INT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_entity_type VARCHAR(50);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMP NULL;
ALTER TABLE notifications MODIFY created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE notifications ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD INDEX IF NOT EXISTS idx_user_id (user_id);
ALTER TABLE notifications ADD INDEX IF NOT EXISTS idx_is_read (is_read);
ALTER TABLE notifications ADD INDEX IF NOT EXISTS idx_created_at (created_at);

-- ============= VUES ANALYTIQUES =============
CREATE OR REPLACE VIEW v_admin_users_summary AS
SELECT 
  u.id, 
  CONCAT(u.first_name, ' ', u.last_name) AS full_name,
  u.email,
  r.name AS role_name,
  u.status,
  u.created_at,
  u.last_login,
  (SELECT COUNT(*) FROM bank_accounts WHERE user_id = u.id) AS account_count
FROM users u
LEFT JOIN roles r ON u.role_id = r.id;

CREATE OR REPLACE VIEW v_admin_transactions_summary AS
SELECT
  ba.id AS account_id,
  ba.account_number,
  CONCAT(u.first_name, ' ', u.last_name) AS account_owner,
  COUNT(bt.id) AS transaction_count,
  SUM(CASE WHEN bt.transaction_type = 'DEPOSIT' THEN bt.amount ELSE 0 END) AS total_deposits,
  SUM(CASE WHEN bt.transaction_type = 'WITHDRAWAL' THEN bt.amount ELSE 0 END) AS total_withdrawals,
  MAX(bt.created_at) AS last_transaction_date
FROM bank_accounts ba
LEFT JOIN users u ON ba.user_id = u.id
LEFT JOIN bank_transactions bt ON bt.to_account_id = ba.id OR bt.from_account_id = ba.id
GROUP BY ba.id, ba.account_number, u.id;

CREATE OR REPLACE VIEW v_agent_clients_accounts AS
SELECT
  ba.id AS account_id,
  ba.account_number,
  ba.account_type,
  ba.balance,
  ba.currency,
  ba.status,
  CONCAT(u.first_name, ' ', u.last_name) AS client_name,
  u.email,
  u.phone,
  ba.created_at,
  (SELECT COUNT(*) FROM bank_transactions 
   WHERE from_account_id = ba.id OR to_account_id = ba.id) AS transaction_count
FROM bank_accounts ba
LEFT JOIN users u ON ba.user_id = u.id
ORDER BY ba.created_at DESC;

-- ============= DONNÉES INITIALES BANKING =============
UPDATE users SET role_id = 1 WHERE email = 'admin@queue.mg';
UPDATE users SET role_id = 2 WHERE email IN ('agent1@queue.mg', 'agent2@queue.mg');

-- Créer un compte de test pour admin
INSERT IGNORE INTO bank_accounts (user_id, account_number, account_type, balance, agent_id) 
VALUES (1, 'ACC-ADMIN-001', 'CURRENT', 50000.00, NULL);

-- Créer un compte de test pour agent1
INSERT IGNORE INTO bank_accounts (user_id, account_number, account_type, balance, agent_id) 
VALUES (2, 'ACC-AGENT-001', 'SAVING', 10000.00, NULL);
