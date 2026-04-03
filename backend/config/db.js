const mysql = require("mysql2/promise");
require("dotenv").config();

const dbHost = (process.env.DB_HOST || "localhost").replace(/^@+/, "");
const dbUser = (process.env.DB_USER || "root").replace(/^@+/, "");
let dbPass = process.env.DB_PASS || "";

if (dbPass === "votre_mot_de_passe") {
  console.warn("⚠️  ATTENTION : DB_PASS est encore le placeholder 'votre_mot_de_passe' - remplacez par le mot de passe MySQL réel.");
  dbPass = "";
}

const pool = mysql.createPool({
  host:               dbHost,
  port:               Number(process.env.DB_PORT) || 3306,
  user:               dbUser,
  password:           dbPass,
  database:           process.env.DB_NAME || "queue_db",
  waitForConnections: true,
  connectionLimit:    15,
  queueLimit:         0,
  enableKeepAlive:    true,
  timezone:           "+03:00",
});

pool.getConnection()
  .then(conn => { console.log("✅ MySQL connecté"); conn.release(); })
  .catch(err  => console.error("❌ MySQL:", err.message));

module.exports = pool;
