const db = require("./backend/config/db");

async function seedToday() {
  try {
    console.log("Démarrage injection tickets actifs...");
    // Trouver les services disponibles
    const [svcs] = await db.query("SELECT id, prefix FROM services WHERE active=1");
    if (!svcs.length) throw new Error("Aucun service actif trouvé");

    const names = ["Rabe", "Rakoto", "Rasoa", "Noro", "Hery", "Lita", "Fana", "Tsiry", "Aina"]; 
    let count = 0;

    for (const s of svcs) {
      // 1 ticket "serving" par service
      const servingName = names[Math.floor(Math.random() * names.length)];
      await db.query(
        "INSERT INTO tickets (number, service_id, user_name, customer_type, visit_purpose, status, priority, created_at, called_at, serving_at) VALUES (?, ?, ?, 'regular', 'Test consultation', 'serving', 0, DATE_SUB(NOW(), INTERVAL 15 MINUTE), DATE_SUB(NOW(), INTERVAL 5 MINUTE), DATE_SUB(NOW(), INTERVAL 4 MINUTE))",
        [`${s.prefix}-900`, s.id, servingName]
      );
      count++;

      // 3 tickets "waiting" par service
      for (let i = 1; i <= 3; i++) {
        const user = names[Math.floor(Math.random() * names.length)];
        const priority = i === 1 ? 50 : 0; // VIP ou normal
        const cType = i === 1 ? 'vip' : 'regular';
        await db.query(
          "INSERT INTO tickets (number, service_id, user_name, customer_type, visit_purpose, status, priority, created_at) VALUES (?, ?, ?, ?, 'Test attente', 'waiting', ?, DATE_SUB(NOW(), INTERVAL ? MINUTE))",
          [`${s.prefix}-90${i}`, s.id, user, cType, priority, i * 5]
        );
        count++;
      }
    }

    console.log(`✅ ${count} tickets actifs créés pour aujourd'hui ! Les files sont pleines.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedToday();
