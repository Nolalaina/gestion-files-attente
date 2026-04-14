-- ============================================================
-- schema.sql  -  Gestion de Files d'Attente v4 (UNIFIED)
-- MySQL 8.0+  |  Usage: mysql -u root -p < config/schema.sql
-- Base de données UNIQUE pour tout le projet
-- ============================================================

CREATE DATABASE IF NOT EXISTS queue_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE queue_db;

-- ============================================================
-- 1. UTILISATEURS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id         INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100)    NOT NULL,
  email      VARCHAR(150)    NOT NULL UNIQUE,
  password   VARCHAR(255)    NOT NULL,
  role       ENUM('usager','agent','admin') NOT NULL DEFAULT 'usager',
  phone      VARCHAR(20),
  active     TINYINT(1)      NOT NULL DEFAULT 1,
  is_verified TINYINT(1)     NOT NULL DEFAULT 0,
  email_verification_token VARCHAR(255) NULL,
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role  (role)
) ENGINE=InnoDB;

-- ============================================================
-- 2. SERVICES (guichets)
-- ============================================================
CREATE TABLE IF NOT EXISTS services (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  description  VARCHAR(255),
  prefix       CHAR(2)      NOT NULL DEFAULT 'A',
  max_counters TINYINT      NOT NULL DEFAULT 3,
  avg_duration INT          NOT NULL DEFAULT 5,
  open_at      TIME         NOT NULL DEFAULT '08:00:00',
  close_at     TIME         NOT NULL DEFAULT '17:00:00',
  active       TINYINT(1)   NOT NULL DEFAULT 1,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_active (active)
) ENGINE=InnoDB;

-- ============================================================
-- 3. TICKETS
-- ============================================================
CREATE TABLE IF NOT EXISTS tickets (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  number            VARCHAR(10)  NOT NULL,
  service_id        INT UNSIGNED NOT NULL,
  user_name         VARCHAR(100) NOT NULL,
  phone             VARCHAR(20),
  email             VARCHAR(150),
  status            ENUM('waiting','called','serving','done','absent','cancelled')
                    NOT NULL DEFAULT 'waiting',
  counter           TINYINT UNSIGNED,
  priority          TINYINT      NOT NULL DEFAULT 0,
  customer_type     ENUM('regular','vip','senior','disabled','urgent') DEFAULT 'regular',
  visit_purpose     VARCHAR(255) NULL,
  is_emergency      TINYINT(1)   DEFAULT 0,
  assigned_agent_id INT UNSIGNED NULL,
  no_show_reason    VARCHAR(255) NULL,
  satisfaction_score TINYINT     NULL,
  notes             TEXT,
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  called_at         TIMESTAMP    NULL,
  serving_at        TIMESTAMP    NULL,
  done_at           TIMESTAMP    NULL,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
  INDEX idx_status  (status),
  INDEX idx_service (service_id),
  INDEX idx_created (created_at),
  INDEX idx_agent   (assigned_agent_id)
) ENGINE=InnoDB;

-- ============================================================
-- 4. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ticket_id  INT UNSIGNED NOT NULL,
  type       ENUM('sms','push','email') NOT NULL,
  status     ENUM('sent','failed','pending') NOT NULL DEFAULT 'pending',
  message    TEXT,
  sent_at    TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 5. ASSIGNATION DES AGENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_assignments (
  id                      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  agent_id                INT UNSIGNED NOT NULL,
  service_id              INT UNSIGNED NOT NULL,
  status                  ENUM('available','busy','break','offline') DEFAULT 'available',
  tickets_handled         INT DEFAULT 0,
  cumulative_handling_time INT DEFAULT 0,
  created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_agent_service (agent_id, service_id),
  FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 6. RÉASSIGNATION DE TICKETS
-- ============================================================
CREATE TABLE IF NOT EXISTS ticket_reassignments (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ticket_id     INT UNSIGNED NOT NULL,
  from_agent_id INT UNSIGNED NULL,
  to_agent_id   INT UNSIGNED NOT NULL,
  reason        VARCHAR(255),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 7. FEEDBACK CLIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS customer_feedback (
  id                     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ticket_id              INT UNSIGNED NOT NULL,
  rating                 TINYINT NOT NULL,
  wait_time_satisfaction TINYINT NULL,
  agent_behavior         TINYINT NULL,
  facility_cleanliness   TINYINT NULL,
  comment                TEXT NULL,
  created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 8. LOGS D'ACTIVITÉ
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       INT UNSIGNED NULL,
  action        VARCHAR(100) NOT NULL,
  entity_type   VARCHAR(50) NULL,
  entity_id     INT UNSIGNED NULL,
  ip_address    VARCHAR(45) NULL,
  user_agent    VARCHAR(255) NULL,
  description   TEXT NULL,
  status        ENUM('SUCCESS','FAILURE') DEFAULT 'SUCCESS',
  error_message VARCHAR(500) NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_action (action),
  INDEX idx_user (user_id)
) ENGINE=InnoDB;

-- ============================================================
-- 9. COMPTES BANCAIRES
-- ============================================================
CREATE TABLE IF NOT EXISTS bank_accounts (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id        INT UNSIGNED NOT NULL,
  account_number VARCHAR(50) NOT NULL UNIQUE,
  account_type   ENUM('CURRENT','SAVINGS','BUSINESS') DEFAULT 'CURRENT',
  balance        DECIMAL(15,2) DEFAULT 0.00,
  currency       VARCHAR(3) DEFAULT 'MGA',
  status         ENUM('ACTIVE','INACTIVE','BLOCKED') DEFAULT 'ACTIVE',
  agent_id       INT UNSIGNED NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
) ENGINE=InnoDB;

-- ============================================================
-- 10. TRANSACTIONS BANCAIRES
-- ============================================================
CREATE TABLE IF NOT EXISTS bank_transactions (
  id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  from_account_id      INT UNSIGNED NULL,
  to_account_id        INT UNSIGNED NULL,
  transaction_type     ENUM('DEPOSIT','WITHDRAWAL','TRANSFER') NOT NULL,
  amount               DECIMAL(15,2) NOT NULL,
  status               ENUM('PENDING','COMPLETED','FAILED','CANCELLED') DEFAULT 'PENDING',
  reference_number     VARCHAR(100) UNIQUE,
  description          VARCHAR(255) NULL,
  initiated_by_user_id INT UNSIGNED NULL,
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at         TIMESTAMP NULL,
  FOREIGN KEY (from_account_id) REFERENCES bank_accounts(id),
  FOREIGN KEY (to_account_id) REFERENCES bank_accounts(id),
  INDEX idx_status (status),
  INDEX idx_type (transaction_type)
) ENGINE=InnoDB;

-- ============================================================
-- DONNÉES INITIALES
-- ============================================================

-- Services par défaut
INSERT IGNORE INTO services (id,name,description,prefix,max_counters,avg_duration) VALUES
  (1,'Caisse principale', 'Paiements, virements, retraits',      'A',3,8),
  (2,'Renseignements',    'Informations et orientation',          'B',2,5),
  (3,'Depot de dossiers', 'Depot et retrait de documents',        'C',2,10),
  (4,'Guichet juridique', 'Questions legales et administratives', 'D',1,15);

-- Utilisateurs par défaut (mot de passe : password123)
INSERT IGNORE INTO users (id,name,email,password,role,active,is_verified) VALUES
  (1,'Administrateur', 'admin@queue.mg',  '$2a$10$3X9pKAbvh3NocqYJZJS/GOnj6FF0nWwLEfqaBk/cX71HeHdrOKaY6','admin',1,1),
  (2,'Agent Caisse 1', 'agent1@queue.mg', '$2a$10$3X9pKAbvh3NocqYJZJS/GOnj6FF0nWwLEfqaBk/cX71HeHdrOKaY6','agent',1,1),
  (3,'Agent Caisse 2', 'agent2@queue.mg', '$2a$10$3X9pKAbvh3NocqYJZJS/GOnj6FF0nWwLEfqaBk/cX71HeHdrOKaY6','agent',1,1);

-- Assignation agents aux services
INSERT IGNORE INTO agent_assignments (agent_id, service_id, status) VALUES
  (2, 1, 'available'),
  (3, 1, 'available'),
  (2, 2, 'available');

-- ============================================================
-- VUE STATISTIQUES DU JOUR
-- ============================================================
CREATE OR REPLACE VIEW v_stats_today AS
SELECT
  s.id AS service_id, s.name AS service_name,
  COUNT(t.id) AS total,
  SUM(t.status='waiting')   AS waiting,
  SUM(t.status='called')    AS called,
  SUM(t.status='done')      AS done,
  SUM(t.status='absent')    AS absent,
  SUM(t.status='cancelled') AS cancelled,
  ROUND(AVG(TIMESTAMPDIFF(MINUTE,t.created_at,t.called_at)),1) AS avg_wait_min
FROM services s
LEFT JOIN tickets t ON t.service_id=s.id AND DATE(t.created_at)=CURDATE()
GROUP BY s.id, s.name;
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

