const db = require("./config/db");
const bcrypt = require("bcryptjs");

async function test() {
  try {
    const [[user]] = await db.query("SELECT password FROM users WHERE email = ?", ["admin@queue.mg"]);
    console.log("Email found:", "admin@queue.mg");
    console.log("Hash in DB:", user.password);
    
    const isValid = await bcrypt.compare("password123", user.password);
    console.log("Is password123 valid?", isValid);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
