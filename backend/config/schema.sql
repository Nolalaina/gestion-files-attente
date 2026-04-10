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
