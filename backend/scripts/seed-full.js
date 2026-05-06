const db = require("../config/db");
const bcrypt = require("bcryptjs");

async function seed() {
  try {
    console.log("🚀 Lancement du seeding complet...");

    // 1. S'assurer que les services existent
    const [existingServices] = await db.query("SELECT id FROM services");
    if (existingServices.length === 0) {
      console.log("📦 Création des services de base...");
      await db.query(`
        INSERT INTO services (name, description, prefix, active) VALUES 
        ('Caisse', 'Retraits et dépôts', 'A', 1),
        ('Accueil', 'Renseignements', 'B', 1),
        ('Crédit', 'Prêts et épargne', 'C', 1)
      `);
    }

    const [services] = await db.query("SELECT id FROM services");
    const [agents]   = await db.query("SELECT id FROM users WHERE role='agent'");
    
    if (agents.length === 0) {
        console.log("👤 Création d'un agent de test...");
        const pass = await bcrypt.hash("password123", 10);
        await db.query("INSERT INTO users (name, email, password, role, active) VALUES (?,?,?,?,?)",
            ["Agent Test", "agent@queue.mg", pass, "agent", 1]);
    }

    console.log("🎟️ Création des tickets (historique + aujourd'hui)...");
    
    // Vider les tickets existants pour repartir à propre si besoin ? 
    // Non, on ajoute juste.

    const now = new Date();
    
    // Pour chaque jour sur les 7 derniers jours
    for (let day = 0; day <= 7; day++) {
        const date = new Date();
        date.setDate(now.getDate() - day);
        const dateStr = date.toISOString().split('T')[0];

        // Créer 10-20 tickets par jour
        const count = Math.floor(Math.random() * 15) + 5;
        for (let i = 0; i < count; i++) {
            const sid = services[Math.floor(Math.random() * services.length)].id;
            const hour = Math.floor(Math.random() * 8) + 8; // 8h à 16h
            const min  = Math.floor(Math.random() * 60);
            const created = `${dateStr} ${hour}:${min}:00`;
            
            // Status aléatoire (plus de 'done' pour le passé)
            let status = 'done';
            if (day === 0) {
                const r = Math.random();
                if (r < 0.3) status = 'waiting';
                else if (r < 0.5) status = 'called';
                else status = 'done';
            }

            const num = String.fromCharCode(65 + Math.floor(Math.random() * 3)) + (i + 100);
            
            await db.query(`
                INSERT INTO tickets (number, service_id, user_name, status, created_at, called_at, done_at, satisfaction_score)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [num, sid, "Client " + i, status, created, 
                 status !== 'waiting' ? created : null,
                 status === 'done' ? created : null,
                 status === 'done' ? Math.floor(Math.random() * 2) + 4 : null]
            );
        }
    }

    console.log("✅ Seeding terminé avec succès !");
    process.exit(0);
  } catch (err) {
    console.error("❌ Erreur pendant le seeding:", err);
    process.exit(1);
  }
}

seed();
