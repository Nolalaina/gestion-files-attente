require("dotenv").config();
const bcrypt = require("bcryptjs");
const db     = require("./db");
const names  = [
  "Rakoto Jean","Razafy Marie","Andriantsoa Paul","Rasoamanarivo Hanta",
  "Randrianarisoa Fara","Rakotomalala Tojo","Raharison Lanto","Andriamasy Bako",
];
async function seed() {
  const hash = await bcrypt.hash("password123", 10);
  await db.query("UPDATE users SET password=? WHERE id IN (1,2,3)", [hash]);
  console.log("✅ Mots de passe: password123");
  const [svcs] = await db.query("SELECT id,prefix FROM services WHERE active=1");
  let n = 0;
  for (const s of svcs) {
    for (let i = 0; i < 6; i++) {
      const num    = `${s.prefix}-${String(100+n++).padStart(3,"0")}`;
      const name   = names[Math.floor(Math.random()*names.length)];
      const status = ["waiting","waiting","waiting","called","done","done"][i];
      await db.query(
        "INSERT INTO tickets (number,service_id,user_name,status,created_at) VALUES (?,?,?,?,DATE_SUB(NOW(),INTERVAL ? MINUTE))",
        [num, s.id, name, status, i*10]);
    }
  }
  console.log(`✅ ${n} tickets injectes`);
  process.exit(0);
}
seed().catch(e => { console.error(e); process.exit(1); });
