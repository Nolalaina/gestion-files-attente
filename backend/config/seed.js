require("dotenv").config();
const bcrypt = require("bcryptjs");
const db     = require("./db");

async function seed() {
  console.log("\n🚀 Lancement de l'injection massive de données...\n");
  const hash = await bcrypt.hash("password123", 10);

  // 1. NETTOYAGE
  console.log("🧹 Nettoyage des tables...");
  await db.query("SET FOREIGN_KEY_CHECKS = 0");
  await db.query("TRUNCATE TABLE bank_transactions");
  await db.query("TRUNCATE TABLE bank_accounts");
  await db.query("TRUNCATE TABLE customer_feedback");
  await db.query("TRUNCATE TABLE ticket_reassignments");
  await db.query("TRUNCATE TABLE activity_logs");
  await db.query("TRUNCATE TABLE tickets");
  await db.query("TRUNCATE TABLE agent_assignments");
  await db.query("TRUNCATE TABLE services");
  await db.query("DELETE FROM users WHERE email != 'admin@queue.mg'");
  await db.query("SET FOREIGN_KEY_CHECKS = 1");

  // 2. SERVICES
  const services = [
    ['Caisse Express', 'EXP', 2, 5],
    ['Ouverture de Compte', 'ACC', 1, 30],
    ['Prêts & Crédits', 'LOA', 1, 45],
    ['Support Technique', 'TEC', 1, 15],
    ['Virement International', 'INT', 1, 20]
  ];
  for (const s of services) {
    await db.query("INSERT INTO services (name, prefix, max_counters, avg_duration, active) VALUES (?,?,?,?,1)", s);
  }
  console.log("✅ Services créés.");

  // 3. UTILISATEURS / AGENTS
  const agents = [
    ['Tahina Rahar', 'tahina@queue.mg', 'agent'],
    ['Mialy Solo', 'mialy@queue.mg', 'agent'],
    ['Faly Ranto', 'faly@queue.mg', 'agent'],
    ['Lova Niry', 'lova@queue.mg', 'agent']
  ];
  for (const a of agents) {
    await db.query("INSERT INTO users (name, email, password, role, active, is_verified) VALUES (?,?,?,?,1,1)", [a[0], a[1], hash, a[2]]);
  }
  console.log("✅ Agents créés (Pass: password123).");

  // 4. TICKETS
  const [svcs] = await db.query("SELECT id, prefix FROM services");
  const names = ["Rabe", "Raza", "Hery", "Lita", "Noro", "Tita", "Fana", "Dera", "Sita", "Beby"];
  let tCount = 0;

  for (let day = 0; day <= 5; day++) {
    for (const s of svcs) {
      const dailyTickets = 3 + Math.floor(Math.random() * 8);
      for (let i = 0; i < dailyTickets; i++) {
        const hourOffset = 8 + Math.floor(Math.random() * 8);
        const dateExpr = `DATE_SUB(DATE_SUB(NOW(), INTERVAL ${day} DAY), INTERVAL ${hourOffset} HOUR)`;
        
        await db.query(`
          INSERT INTO tickets (number, service_id, user_name, status, created_at, called_at, done_at) 
          VALUES (?, ?, ?, 'done', ${dateExpr}, ${dateExpr}, ${dateExpr})`,
          [`${s.prefix}-${day}${i}`, s.id, names[Math.floor(Math.random()*names.length)], 'done']
        );
        tCount++;
      }
    }
  }
  console.log(`✅ ${tCount} Tickets générés.`);

  // 5. BANQUE
  const [[admin]] = await db.query("SELECT id FROM users WHERE email='admin@queue.mg'");
  if (admin) {
    await db.query("INSERT INTO bank_accounts (user_id, account_number, balance, account_type, status) VALUES (?, 'MG1000000001', 5000000, 'COURANT', 'ACTIVE')", [admin.id]);
  }
  
  console.log("\n✨ Injection terminée avec succès ! ✨\n");
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
