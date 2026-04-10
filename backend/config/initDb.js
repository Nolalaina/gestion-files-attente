const db = require("./db");

const initDb = async () => {
  try {
    console.log("🛠️  Vérification de la structure de la base de données...");

    // Vérifier si la table users existe
    const [tables] = await db.query("SHOW TABLES");
    const tableNames = tables.map(t => Object.values(t)[0]);

    // Si la table users n'existe pas, pas de migration possible
    if (!tableNames.includes("users")) {
      console.log("⚠️  Table 'users' absente — veuillez exécuter schema.sql d'abord.");
      return;
    }

    // Ajout des colonnes nécessaires si elles n'existent pas
    const [columns] = await db.query("SHOW COLUMNS FROM users");
    const columnNames = columns.map(c => c.Field);

    if (!columnNames.includes("is_verified")) {
      console.log("➕ Ajout de la colonne 'is_verified'...");
      await db.query("ALTER TABLE users ADD COLUMN is_verified TINYINT(1) DEFAULT 0");
    }

    if (!columnNames.includes("email_verification_token")) {
      console.log("➕ Ajout de la colonne 'email_verification_token'...");
      await db.query("ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(255) NULL");
    }

    if (!columnNames.includes("active")) {
      console.log("➕ Ajout de la colonne 'active'...");
      await db.query("ALTER TABLE users ADD COLUMN active TINYINT(1) DEFAULT 1");
    }

    // Colonnes avancées pour les tickets
    if (tableNames.includes("tickets")) {
      const [ticketCols] = await db.query("SHOW COLUMNS FROM tickets");
      const ticketColNames = ticketCols.map(c => c.Field);

      if (!ticketColNames.includes("customer_type")) {
        console.log("➕ Ajout colonne 'customer_type' à tickets...");
        await db.query("ALTER TABLE tickets ADD COLUMN customer_type ENUM('regular','vip','senior','disabled','urgent') DEFAULT 'regular'");
      }
      if (!ticketColNames.includes("visit_purpose")) {
        console.log("➕ Ajout colonne 'visit_purpose' à tickets...");
        await db.query("ALTER TABLE tickets ADD COLUMN visit_purpose VARCHAR(255) NULL");
      }
      if (!ticketColNames.includes("is_emergency")) {
        console.log("➕ Ajout colonne 'is_emergency' à tickets...");
        await db.query("ALTER TABLE tickets ADD COLUMN is_emergency TINYINT(1) DEFAULT 0");
      }
      if (!ticketColNames.includes("assigned_agent_id")) {
        console.log("➕ Ajout colonne 'assigned_agent_id' à tickets...");
        await db.query("ALTER TABLE tickets ADD COLUMN assigned_agent_id INT UNSIGNED NULL");
      }
      if (!ticketColNames.includes("no_show_reason")) {
        console.log("➕ Ajout colonne 'no_show_reason' à tickets...");
        await db.query("ALTER TABLE tickets ADD COLUMN no_show_reason VARCHAR(255) NULL");
      }
      if (!ticketColNames.includes("satisfaction_score")) {
        console.log("➕ Ajout colonne 'satisfaction_score' à tickets...");
        await db.query("ALTER TABLE tickets ADD COLUMN satisfaction_score TINYINT NULL");
      }
    }

    // Créer les tables avancées si elles n'existent pas
    if (!tableNames.includes("agent_assignments")) {
      console.log("➕ Création de la table 'agent_assignments'...");
      await db.query(`
        CREATE TABLE IF NOT EXISTS agent_assignments (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          agent_id INT UNSIGNED NOT NULL,
          service_id INT UNSIGNED NOT NULL,
          status ENUM('available','busy','break','offline') DEFAULT 'available',
          tickets_handled INT DEFAULT 0,
          cumulative_handling_time INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uk_agent_service (agent_id, service_id),
          FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
        ) ENGINE=InnoDB
      `);
    }

    if (!tableNames.includes("ticket_reassignments")) {
      console.log("➕ Création de la table 'ticket_reassignments'...");
      await db.query(`
        CREATE TABLE IF NOT EXISTS ticket_reassignments (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          ticket_id INT UNSIGNED NOT NULL,
          from_agent_id INT UNSIGNED NULL,
          to_agent_id INT UNSIGNED NOT NULL,
          reason VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
        ) ENGINE=InnoDB
      `);
    }

    if (!tableNames.includes("customer_feedback")) {
      console.log("➕ Création de la table 'customer_feedback'...");
      await db.query(`
        CREATE TABLE IF NOT EXISTS customer_feedback (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          ticket_id INT UNSIGNED NOT NULL,
          rating TINYINT NOT NULL,
          wait_time_satisfaction TINYINT NULL,
          agent_behavior TINYINT NULL,
          facility_cleanliness TINYINT NULL,
          comment TEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
        ) ENGINE=InnoDB
      `);
    }

    if (!tableNames.includes("activity_logs")) {
      console.log("➕ Création de la table 'activity_logs'...");
      await db.query(`
        CREATE TABLE IF NOT EXISTS activity_logs (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          user_id INT UNSIGNED NULL,
          action VARCHAR(100) NOT NULL,
          entity_type VARCHAR(50) NULL,
          entity_id INT UNSIGNED NULL,
          ip_address VARCHAR(45) NULL,
          user_agent VARCHAR(255) NULL,
          description TEXT NULL,
          status ENUM('SUCCESS','FAILURE') DEFAULT 'SUCCESS',
          error_message VARCHAR(500) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB
      `);
    }

    if (!tableNames.includes("bank_accounts")) {
      console.log("➕ Création de la table 'bank_accounts'...");
      await db.query(`
        CREATE TABLE IF NOT EXISTS bank_accounts (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          user_id INT UNSIGNED NOT NULL,
          account_number VARCHAR(50) NOT NULL UNIQUE,
          account_type ENUM('CURRENT','SAVINGS','BUSINESS') DEFAULT 'CURRENT',
          balance DECIMAL(15,2) DEFAULT 0.00,
          currency VARCHAR(3) DEFAULT 'MGA',
          status ENUM('ACTIVE','INACTIVE','BLOCKED') DEFAULT 'ACTIVE',
          agent_id INT UNSIGNED NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB
      `);
    }

    if (!tableNames.includes("bank_transactions")) {
      console.log("➕ Création de la table 'bank_transactions'...");
      await db.query(`
        CREATE TABLE IF NOT EXISTS bank_transactions (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          from_account_id INT UNSIGNED NULL,
          to_account_id INT UNSIGNED NULL,
          transaction_type ENUM('DEPOSIT','WITHDRAWAL','TRANSFER') NOT NULL,
          amount DECIMAL(15,2) NOT NULL,
          status ENUM('PENDING','COMPLETED','FAILED','CANCELLED') DEFAULT 'PENDING',
          reference_number VARCHAR(100) UNIQUE,
          description VARCHAR(255) NULL,
          initiated_by_user_id INT UNSIGNED NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          completed_at TIMESTAMP NULL,
          FOREIGN KEY (from_account_id) REFERENCES bank_accounts(id),
          FOREIGN KEY (to_account_id) REFERENCES bank_accounts(id)
        ) ENGINE=InnoDB
      `);
    }

    console.log("✅ Base de données à jour !");
  } catch (error) {
    console.error("❌ Erreur d'initialisation de la base de données:", error.message);
  }
};

module.exports = initDb;
