CREATE DATABASE IF NOT EXISTS queue_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE queue_db;

-- ============================================================
-- 1. SYSTÈME DE RÔLES ET PERMISSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

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
) ENGINE=InnoDB;

INSERT IGNORE INTO permissions (code, name, module) VALUES
  ('ADMIN.VIEW_DASHBOARD', 'Voir tableau de bord admin', 'admin'),
  ('ADMIN.VIEW_USERS', 'Voir liste des utilisateurs', 'admin'),
  ('ADMIN.VIEW_TRANSACTIONS', 'Voir historique transactions', 'admin'),
  ('ADMIN.VIEW_ACCOUNTS', 'Voir tous les comptes', 'admin'),
  ('ADMIN.VIEW_LOGS', 'Voir logs d''activité', 'admin'),
  ('ADMIN.MANAGE_USERS', 'Gérer utilisateurs', 'admin'),
  ('ADMIN.MANAGE_AGENTS', 'Gérer les agents', 'admin'),
  ('AGENT.VIEW_CLIENTS', 'Voir ses clients', 'agent'),
  ('AGENT.DEPOSIT', 'Effectuer un dépôt', 'agent'),
  ('AGENT.WITHDRAW', 'Effectuer un retrait', 'agent'),
  ('AGENT.TRANSFER', 'Effectuer un virement', 'agent'),
  ('AGENT.OPEN_ACCOUNT', 'Ouvrir un compte', 'agent'),
  ('AGENT.VIEW_CLIENT_HISTORY', 'Voir historique client', 'agent'),
  ('CLIENT.VIEW_BALANCE', 'Consulter solde', 'client'),
  ('CLIENT.VIEW_HISTORY', 'Consulter historique', 'client'),
  ('CLIENT.TRANSFER', 'Effectuer un virement', 'client'),
  ('CLIENT.EDIT_PROFILE', 'Modifier profil', 'client'),
  ('QUEUE.MANAGE', 'Gérer files d''attente', 'queue');

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Assignation initiale des permissions
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

-- ============================================================
-- 2. UTILISATEURS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id               INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  role_id          INT             NOT NULL DEFAULT 3,
  name             VARCHAR(100)    NOT NULL,
  first_name       VARCHAR(100)    NULL,
  last_name        VARCHAR(100)    NULL,
  email            VARCHAR(150)    NOT NULL UNIQUE,
  password         VARCHAR(255)    NOT NULL,
  phone            VARCHAR(20),
  active           TINYINT(1)      NOT NULL DEFAULT 1,
  status           ENUM('ACTIVE', 'INACTIVE', 'BLOCKED') DEFAULT 'ACTIVE',
  is_verified      TINYINT(1)      NOT NULL DEFAULT 0,
  email_verification_token VARCHAR(255) NULL,
  email_verified_at TIMESTAMP      NULL,
  two_fa_enabled   BOOLEAN         DEFAULT FALSE,
  two_fa_token     VARCHAR(6)      NULL,
  two_fa_token_expires_at TIMESTAMP NULL,
  avatar_url       VARCHAR(255)    NULL,
  bio              TEXT            NULL,
  last_login       TIMESTAMP       NULL,
  login_attempts   INT             DEFAULT 0,
  locked_until     TIMESTAMP       NULL,
  created_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- Colonne héritée pour compatibilité avec le code existant si nécessaire
  role             ENUM('usager','agent','admin') NOT NULL DEFAULT 'usager',
  INDEX idx_email (email),
  INDEX idx_role  (role),
  INDEX idx_role_id (role_id),
  INDEX idx_status (status),
  FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB;

-- ============================================================
-- 3. SERVICES (guichets)
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
-- 4. TICKETS
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
  FOREIGN KEY (assigned_agent_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status  (status),
  INDEX idx_service (service_id),
  INDEX idx_created (created_at),
  INDEX idx_agent   (assigned_agent_id)
) ENGINE=InnoDB;

-- ============================================================
-- 5. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ticket_id           INT UNSIGNED NULL,
  user_id             INT UNSIGNED NULL,
  type                VARCHAR(50) NOT NULL, -- sms, push, email, app
  title               VARCHAR(255),
  message             TEXT,
  status              ENUM('sent','failed','pending') NOT NULL DEFAULT 'pending',
  is_read             BOOLEAN DEFAULT FALSE,
  read_at             TIMESTAMP NULL,
  related_entity_id   INT,
  related_entity_type VARCHAR(50),
  sent_at             TIMESTAMP NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ============================================================
-- 6. GESTION DES AGENTS
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

CREATE TABLE IF NOT EXISTS ticket_reassignments (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ticket_id     INT UNSIGNED NOT NULL,
  from_agent_id INT UNSIGNED NULL,
  to_agent_id   INT UNSIGNED NOT NULL,
  reason        VARCHAR(255),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (from_agent_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (to_agent_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

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
-- 7. LOGS D'ACTIVITÉ
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
  INDEX idx_user (user_id),
  INDEX idx_entity (entity_type, entity_id)
) ENGINE=InnoDB;

-- ============================================================
-- 8. BANQUE (Comptes et Transactions)
-- ============================================================
CREATE TABLE IF NOT EXISTS bank_accounts (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id        INT UNSIGNED NOT NULL,
  account_number VARCHAR(50) NOT NULL UNIQUE,
  account_type   ENUM('SAVING', 'CURRENT', 'FIXED_DEPOSIT', 'BUSINESS') DEFAULT 'CURRENT',
  balance        DECIMAL(15,2) DEFAULT 0.00,
  currency       VARCHAR(3) DEFAULT 'MGA',
  status         ENUM('ACTIVE','INACTIVE','BLOCKED', 'FROZEN', 'CLOSED') DEFAULT 'ACTIVE',
  iban           VARCHAR(34),
  swift_code     VARCHAR(11),
  agent_id       INT UNSIGNED NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_account_number (account_number)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bank_transactions (
  id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  from_account_id      INT UNSIGNED NULL,
  to_account_id        INT UNSIGNED NULL,
  transaction_type     ENUM('DEPOSIT','WITHDRAWAL','TRANSFER','FEE','INTEREST') NOT NULL,
  amount               DECIMAL(15,2) NOT NULL,
  status               ENUM('PENDING','COMPLETED','FAILED','CANCELLED') DEFAULT 'PENDING',
  reference_number     VARCHAR(100) UNIQUE,
  description          VARCHAR(255) NULL,
  initiated_by_user_id INT UNSIGNED NULL,
  processed_by_agent_id INT UNSIGNED NULL,
  failure_reason       VARCHAR(255),
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at         TIMESTAMP NULL,
  updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (from_account_id) REFERENCES bank_accounts(id) ON DELETE SET NULL,
  FOREIGN KEY (to_account_id) REFERENCES bank_accounts(id) ON DELETE SET NULL,
  FOREIGN KEY (initiated_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (processed_by_agent_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_type (transaction_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- ============================================================
-- 9. VUES ANALYTIQUES
-- ============================================================
CREATE OR REPLACE VIEW v_stats_today AS
SELECT
  s.id AS service_id, s.name AS service_name,
  COUNT(t.id) AS total,
  SUM(CASE WHEN t.status='waiting' THEN 1 ELSE 0 END)   AS waiting,
  SUM(CASE WHEN t.status='called' THEN 1 ELSE 0 END)    AS called,
  SUM(CASE WHEN t.status='done' THEN 1 ELSE 0 END)      AS done,
  SUM(CASE WHEN t.status='absent' THEN 1 ELSE 0 END)    AS absent,
  SUM(CASE WHEN t.status='cancelled' THEN 1 ELSE 0 END) AS cancelled,
  ROUND(AVG(TIMESTAMPDIFF(MINUTE,t.created_at,t.called_at)),1) AS avg_wait_min
FROM services s
LEFT JOIN tickets t ON t.service_id=s.id AND DATE(t.created_at)=CURDATE()
GROUP BY s.id, s.name;

CREATE OR REPLACE VIEW v_admin_users_summary AS
SELECT 
  u.id, u.name, u.email, r.name AS role_name, u.status, u.created_at, u.last_login,
  (SELECT COUNT(*) FROM bank_accounts WHERE user_id = u.id) AS account_count
FROM users u
LEFT JOIN roles r ON u.role_id = r.id;

-- ============================================================
-- 10. DONNÉES INITIALES
-- ============================================================

-- Services par défaut
INSERT IGNORE INTO services (id,name,description,prefix,max_counters,avg_duration) VALUES
  (1,'Caisse principale', 'Paiements, virements, retraits',      'A',3,8),
  (2,'Renseignements',    'Informations et orientation',          'B',2,5),
  (3,'Depot de dossiers', 'Depot et retrait de documents',        'C',2,10),
  (4,'Guichet juridique', 'Questions legales et administratives', 'D',1,15);

-- Utilisateurs par défaut (mot de passe : password123)
-- Admin
INSERT IGNORE INTO users (id,name,email,password,role_id,role,active,is_verified,status) VALUES
  (1,'Administrateur', 'admin@queue.mg',  '$2a$10$0fWAHhpqegHDEFTOK9rcjeV3PEr8M/yBx4EkT23x4p/C6QDzkRW1O',1,'admin',1,1,'ACTIVE');
-- Agents
INSERT IGNORE INTO users (id,name,email,password,role_id,role,active,is_verified,status) VALUES
  (2,'Agent Caisse 1', 'agent1@queue.mg', '$2a$10$0fWAHhpqegHDEFTOK9rcjeV3PEr8M/yBx4EkT23x4p/C6QDzkRW1O',2,'agent',1,1,'ACTIVE'),
  (3,'Agent Caisse 2', 'agent2@queue.mg', '$2a$10$0fWAHhpqegHDEFTOK9rcjeV3PEr8M/yBx4EkT23x4p/C6QDzkRW1O',2,'agent',1,1,'ACTIVE');

-- Assignation agents
INSERT IGNORE INTO agent_assignments (agent_id, service_id, status) VALUES
  (2, 1, 'available'),
  (3, 1, 'available'),
  (2, 2, 'available');

-- Comptes de test
INSERT IGNORE INTO bank_accounts (user_id, account_number, account_type, balance, currency) 
VALUES (1, 'ACC-ADMIN-001', 'CURRENT', 50000.00, 'MGA');
INSERT IGNORE INTO bank_accounts (user_id, account_number, account_type, balance, currency) 
VALUES (2, 'ACC-AGENT-001', 'SAVING', 10000.00, 'MGA');
