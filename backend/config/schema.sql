-- ============================================================
-- schema.sql  -  Gestion de Files d'Attente v2
-- MySQL 8.0+  |  Usage: mysql -u root -p < config/schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS queue_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE queue_db;

CREATE TABLE IF NOT EXISTS users (
  id         INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100)    NOT NULL,
  email      VARCHAR(150)    NOT NULL UNIQUE,
  password   VARCHAR(255)    NOT NULL,
  role       ENUM('usager','agent','admin') NOT NULL DEFAULT 'agent',
  phone      VARCHAR(20),
  active     TINYINT(1)      NOT NULL DEFAULT 1,
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role  (role)
) ENGINE=InnoDB;

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

CREATE TABLE IF NOT EXISTS tickets (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  number     VARCHAR(10)  NOT NULL,
  service_id INT UNSIGNED NOT NULL,
  user_name  VARCHAR(100) NOT NULL,
  phone      VARCHAR(20),
  email      VARCHAR(150),
  status     ENUM('waiting','called','serving','done','absent','cancelled')
             NOT NULL DEFAULT 'waiting',
  counter    TINYINT UNSIGNED,
  priority   TINYINT      NOT NULL DEFAULT 0,
  notes      TEXT,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  called_at  TIMESTAMP    NULL,
  serving_at TIMESTAMP    NULL,
  done_at    TIMESTAMP    NULL,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
  INDEX idx_status  (status),
  INDEX idx_service (service_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB;

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

INSERT IGNORE INTO services (id,name,description,prefix,max_counters,avg_duration) VALUES
  (1,'Caisse principale', 'Paiements, virements, retraits',      'A',3,8),
  (2,'Renseignements',    'Informations et orientation',          'B',2,5),
  (3,'Depot de dossiers', 'Depot et retrait de documents',        'C',2,10),
  (4,'Guichet juridique', 'Questions legales et administratives', 'D',1,15);

-- Mot de passe : 'password123'
INSERT IGNORE INTO users (id,name,email,password,role) VALUES
  (1,'Administrateur', 'admin@queue.mg',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','admin'),
  (2,'Agent Caisse 1', 'agent1@queue.mg', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','agent'),
  (3,'Agent Caisse 2', 'agent2@queue.mg', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','agent');

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
