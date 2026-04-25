require("dotenv").config();
const bcrypt = require("bcryptjs");
const db     = require("./db");

async function seed() {
  console.log("🚀 Lancement de l'injection massive de données...");
  const hash = await bcrypt.hash("password123", 10);

  // 1. NETTOYAGE (Ordre important pour les clés étrangères)
  await db.query("DELETE FROM tickets");
  await db.query("DELETE FROM services");
  
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
  const [[{count: svcCount}]] = await db.query("SELECT COUNT(*) as count FROM services");
  console.log(`✅ ${svcCount} Services créés.`);

  // 2. UTILISATEURS / AGENTS
  await db.query("DELETE FROM users WHERE email NOT LIKE 'admin@queue.mg'");
  const agents = [
    ['Tahina Rahar', 'tahina@queue.mg', 'agent'],
    ['Mialy Solo', 'mialy@queue.mg', 'agent'],
    ['Faly Ranto', 'faly@queue.mg', 'agent'],
    ['Lova Niry', 'lova@queue.mg', 'agent']
  ];
  for (const a of agents) {
    await db.query("INSERT INTO users (name, email, password, role, active, is_verified) VALUES (?,?,?,?,1,1)", [...a, hash]);
  }
  console.log("✅ Agents créés (Pass: password123).");

  // 3. TICKETS HISTORIQUES (SUR 7 JOURS)
  await db.query("DELETE FROM tickets");
  const [svcs] = await db.query("SELECT id, prefix FROM services");
  const names = ["Rabe", "Raza", "Hery", "Lita", "Noro", "Tita", "Fana", "Dera", "Sita", "Beby"];
  let ticketCount = 0;

  for (let day = 0; day <= 7; day++) {
    for (const s of svcs) {
      const dailyTickets = 5 + Math.floor(Math.random() * 15);
      for (let i = 0; i < dailyTickets; i++) {
        const hour = 8 + Math.floor(Math.random() * 9); // De 8h à 17h
        const min  = Math.floor(Math.random() * 60);
        const dateStr = `DATE_SUB(DATE_SUB(NOW(), INTERVAL ${day} DAY), INTERVAL ${24 - hour} HOUR)`;
        
        await db.query(`
          INSERT INTO tickets (number, service_id, user_name, status, created_at, called_at, done_at) 
          VALUES (?, ?, ?, 'done', ${dateStr}, ${dateStr}, ${dateStr})`,
          [`${s.prefix}-${day}${i}`, s.id, names[Math.floor(Math.random()*names.length)], 'done']
        );
        ticketCount++;
      }
    }
  }
  console.log(`✅ ${ticketCount} Tickets historiques générés.`);

  // 4. COMPTES BANCAIRES
  await db.query("DELETE FROM bank_accounts");
  const [[{id: adminId}]] = await db.query("SELECT id FROM users WHERE email='admin@queue.mg'");
  await db.query("INSERT INTO bank_accounts (user_id, account_number, balance, account_type, status) VALUES (?, 'MG1234567890', 150000.50, 'COURANT', 'ACTIVE')", [adminId]);
  
  console.log("✨ Injection terminée avec succès !");
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
