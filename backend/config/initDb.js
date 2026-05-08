const db = require("./db");

const initDb = async () => {
  try {
    console.log("🛠️  Optimisation de la structure de la base de données...");

    // 1. Vérifier les tables de base
    const [tables] = await db.query("SHOW TABLES");
    const tableNames = tables.map(t => Object.values(t)[0]);

    if (!tableNames.includes("roles")) {
      console.log("⚠️  Table 'roles' absente — veuillez vérifier votre schéma SQL.");
    }

    // 2. Migration du système de rôles si nécessaire
    if (tableNames.includes("users")) {
      const [columns] = await db.query("SHOW COLUMNS FROM users");
      const columnNames = columns.map(c => c.Field);

      // Assurer que role_id existe
      if (!columnNames.includes("role_id")) {
        console.log("➕ Migration : Ajout de 'role_id' à la table users...");
        await db.query("ALTER TABLE users ADD COLUMN role_id INT DEFAULT 3");
        await db.query("ALTER TABLE users ADD FOREIGN KEY (role_id) REFERENCES roles(id)");
        
        // Synchroniser role_id basé sur l'ancien ENUM role
        await db.query("UPDATE users SET role_id = 1 WHERE role = 'admin'");
        await db.query("UPDATE users SET role_id = 2 WHERE role = 'agent'");
        await db.query("UPDATE users SET role_id = 3 WHERE role = 'usager'");
      }

      // Ajouter first_name et last_name si absents
      if (!columnNames.includes("first_name")) {
        await db.query("ALTER TABLE users ADD COLUMN first_name VARCHAR(100) NULL");
      }
      if (!columnNames.includes("last_name")) {
        await db.query("ALTER TABLE users ADD COLUMN last_name VARCHAR(100) NULL");
      }
      
      // Assurer status existe
      if (!columnNames.includes("status")) {
        await db.query("ALTER TABLE users ADD COLUMN status ENUM('ACTIVE', 'INACTIVE', 'BLOCKED') DEFAULT 'ACTIVE'");
      }
    }

    // 3. Vérification des tables bancaires consolidées
    if (tableNames.includes("bank_accounts")) {
      const [accCols] = await db.query("SHOW COLUMNS FROM bank_accounts");
      const accColNames = accCols.map(c => c.Field);
      
      if (!accColNames.includes("iban")) {
        console.log("➕ Mise à jour de 'bank_accounts'...");
        await db.query("ALTER TABLE bank_accounts ADD COLUMN iban VARCHAR(34) NULL, ADD COLUMN swift_code VARCHAR(11) NULL");
      }
    }

    // 4. Verification de la table tickets (champs Aurora Premium)
    if (tableNames.includes("tickets")) {
        const [ticketCols] = await db.query("SHOW COLUMNS FROM tickets");
        const ticketColNames = ticketCols.map(c => c.Field);

        const neededCols = [
            { name: "customer_type", def: "ENUM('regular','vip','senior','disabled','urgent') DEFAULT 'regular'" },
            { name: "visit_purpose", def: "VARCHAR(255) NULL" },
            { name: "is_emergency", def: "TINYINT(1) DEFAULT 0" },
            { name: "assigned_agent_id", def: "INT UNSIGNED NULL" },
            { name: "no_show_reason", def: "VARCHAR(255) NULL" },
            { name: "satisfaction_score", def: "TINYINT NULL" }
        ];

        for (const col of neededCols) {
            if (!ticketColNames.includes(col.name)) {
                console.log(`➕ Ticket-Fix : Ajout de ${col.name}...`);
                await db.query(`ALTER TABLE tickets ADD COLUMN ${col.name} ${col.def}`);
            }
        }
    }

    // 5. Nettoyage des doublons si initDb est lancé après un vieux schema.sql
    // (Cette partie est préventive pour éviter les erreurs de "table already exists" lors des migrations manuelles)
    
    console.log("✅ Base de données synchronisée avec le standard Aurora V8 !");
  } catch (error) {
    console.error("❌ Erreur d'initialisation de la base de données:", error.message);
  }
};

module.exports = initDb;

