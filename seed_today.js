const db = require("./backend/config/db");

async function seedToday() {
  try {
    const services = [1, 2, 3, 10]; // IDs des services existants
    for (let i = 0; i < 5; i++) {
        const sid = services[Math.floor(Math.random() * services.length)];
        const num = "S" + Math.floor(Math.random() * 100);
        await db.query(
            "INSERT INTO tickets (number, service_id, user_name, customer_type, visit_purpose, status, created_at) VALUES (?, ?, ?, 'standard', 'Test', 'waiting', NOW())",
            [num, sid, "Utilisateur Test " + i]
        );
    }
    console.log("✅ 5 tickets créés pour aujourd'hui !");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedToday();
