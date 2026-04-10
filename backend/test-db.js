const mysql = require("mysql2/promise");
require("dotenv").config();

async function test() {
  try {
    console.log("Testing connection to:", process.env.DB_HOST || "localhost");
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASS || "",
      database: process.env.DB_NAME || "queue_db",
      connectTimeout: 10000
    });
    console.log("✅ SUCCESS!");
    await conn.end();
  } catch (e) {
    console.error("❌ FAILED:", e.message);
    console.error(e);
  }
}

test();
