const db = require("./config/db");
const bcrypt = require("bcryptjs");

async function fix() {
  try {
    const hash = await bcrypt.hash("password123", 10);
    console.log("Nouveau hash généré:", hash);
    
    await db.query("UPDATE users SET password = ? WHERE email = ?", [hash, "admin@queue.mg"]);
    await db.query("UPDATE users SET password = ? WHERE email LIKE 'agent%'", [hash]);
    
    console.log("✅ Mots de passe mis à jour avec succès dans la base de données !");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fix();
