require("dotenv").config();
const bcrypt = require("bcryptjs");
const db     = require("./db");
const names  = [
  "Rakoto Jean","Razafy Marie","Andriantsoa Paul","Rasoamanarivo Hanta",
  "Randrianarisoa Fara","Rakotomalala Tojo","Raharison Lanto","Andriamasy Bako",
];
async function seed() {
  const hash = await bcrypt.hash("password123", 10);
  
  // Ensure default users exist or update them
  await db.query(`INSERT IGNORE INTO users (id, name, email, password, role, active, is_verified) VALUES 
    (1, 'Admin Principal', 'admin@queue.mg', ?, 'admin', 1, 1),
    (2, 'Agent Caisse 1', 'agent1@queue.mg', ?, 'agent', 1, 1),
    (3, 'Agent Caisse 2', 'agent2@queue.mg', ?, 'agent', 1, 1)
  `, [hash, hash, hash]);
  
  await db.query("UPDATE users SET password=? WHERE email LIKE '%@queue.mg'", [hash]);
  console.log("✅ Utilisateurs: admin@queue.mg, agent1@queue.mg (Pass: password123)");
  
  const [svcs] = await db.query("SELECT id,prefix FROM services WHERE active=1");
  let n = 0;
  
  // 1. Tickets pour AUJOURD'HUI (Queue en cours)
  for (const s of svcs) {
    for (let i = 0; i < 8; i++) {
      const num    = `${s.prefix}-${String(i + 1).padStart(3,"0")}`;
      const name   = names[Math.floor(Math.random()*names.length)];
      const status = i < 3 ? "waiting" : (i === 3 ? "called" : "done");
      const priority = i === 0 ? 50 : 0;
      await db.query(
        "INSERT INTO tickets (number, service_id, user_name, status, priority, created_at, called_at) VALUES (?,?,?,?,?, DATE_SUB(NOW(), INTERVAL ? MINUTE), ?)",
        [num, s.id, name, status, priority, i*12, status!=='waiting'?new Date():null]);
      n++;
    }
  }

  // 2. Tickets pour HIER (Historique)
  for (const s of svcs) {
    for (let i = 0; i < 15; i++) {
      const num = `${s.prefix}-H${i}`;
      await db.query(
        "INSERT INTO tickets (number, service_id, user_name, status, created_at, called_at, done_at) VALUES (?,?,?, 'done', DATE_SUB(CURDATE(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY))",
        [num, s.id, "Client Hier", "done"]);
      n++;
    }
  }

  console.log(`✅ ${n} tickets injectés (Historique + Aujourd'hui)`);
  process.exit(0);
}
seed().catch(e => { console.error(e); process.exit(1); });
