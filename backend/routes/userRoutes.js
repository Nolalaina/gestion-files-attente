const router = require("express").Router();
const fs = require("fs");
const path = require("path");

router.use((req, res, next) => {
  const logPath = path.join(__dirname, "../debug_login.log");
  const time = new Date().toISOString();
  fs.appendFileSync(logPath, `[${time}] ROUTE AUTH DETECTEE: ${req.method} ${req.url}\n`);
  next();
});

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { body } = require("express-validator");
const db = require("../config/db");
const auth = require("../middleware/authMiddleware");
const val = require("../middleware/validateMiddleware");
const { sendTwoFAEmail } = require("../middleware/twoFAMiddleware");
const { logActivity } = require("../utils/logger");

// ============ AUTH (PUBLIC/USER) ============

router.post("/register",
  [
    body("firstName").isLength({ min: 2 }),
    body("lastName").isLength({ min: 2 }),
    body("email").isEmail(),
    body("phone").isMobilePhone("any"),
    body("password").isLength({ min: 6 }),
  ], val,
  async (req, res, next) => {
    try {
      const { firstName, lastName, email, phone, password } = req.body;
      const [[exists]] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
      if (exists) return res.status(409).json({ error: "Email déjà utilisé" });

      const passwordHash = await bcrypt.hash(password, 10);
      await db.query(
        "INSERT INTO users (name, email, password, role, role_id, phone, active, is_verified) VALUES (?, ?, ?, ?, ?, ?, 1, 1)",
        [`${firstName} ${lastName}`, email, passwordHash, 'usager', 3, phone]
      );

      await logActivity({ action: "USER_REGISTER", req, description: `Inscription de ${firstName} ${lastName} (${email})` });

      res.status(201).json({ success: true, message: "Inscription réussie" });
    } catch (e) { next(e); }
  }
);

router.post("/login",
  async (req, res, next) => {
    const fs = require("fs");
    const logPath = require("path").join(__dirname, "../debug_login.log");
    const log = (msg) => {
      const time = new Date().toISOString();
      fs.appendFileSync(logPath, `[${time}] ${msg}\n`);
      console.log(`[DEBUG_LOGIN] ${msg}`);
    };

    try {
      log(`REQUETE RECUE. Method: ${req.method}. Body: ${JSON.stringify(req.body)}`);
      const { email, password } = req.body;
      
      if (!email || !password) {
        log("Email ou password manquant dans le body.");
        return res.status(400).json({ error: "Email et mot de passe requis" });
      }

      const [[user]] = await db.query("SELECT * FROM users WHERE email=? AND active=1", [email.trim().toLowerCase()]);
      
      if (!user) {
        log(`Utilisateur non trouvé ou inactif: [${email}]`);
        return res.status(401).json({ error: "Identifiants incorrects" });
      }

      const isPassValid = await bcrypt.compare(password, user.password);
      if (!isPassValid) {
        log(`Mot de passe INCORRECT pour: ${email}`);
        return res.status(401).json({ error: "Identifiants incorrects" });
      }
      
      log(`Connexion REUSSIE pour: ${email}`);
      const token = jwt.sign(
        { id: user.id, role: user.role, name: user.name, email: user.email },
        process.env.JWT_SECRET || "dev_secret", { expiresIn: "10h" });

      res.json({ success: true, token, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
    } catch (e) { 
      log(`ERREUR CRITIQUE: ${e.message}`);
      next(e); 
    }
  }
);

router.get("/me", auth(), async (req, res, next) => {
  try {
    const [[u]] = await db.query("SELECT id,name,email,role,phone,created_at FROM users WHERE id=?", [req.user.id]);
    res.json({ success: true, data: u });
  } catch (e) { next(e); }
});

// ============ USER MANAGEMENT (ADMIN ONLY) ============

router.get("/", auth("admin"), async (req, res, next) => {
  try {
    const { search, role } = req.query;
    let sql = "SELECT id, name, email, role, phone, active, created_at FROM users WHERE 1=1";
    const p = [];
    if (search) { sql += " AND (name LIKE ? OR email LIKE ?)"; const t = `%${search}%`; p.push(t, t); }
    if (role) { sql += " AND role = ?"; p.push(role); }
    sql += " ORDER BY name ASC";
    const [rows] = await db.query(sql, p);
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
});

router.patch("/:id/toggle", auth("admin"), async (req, res, next) => {
  try {
    await db.query("UPDATE users SET active = NOT active WHERE id=?", [req.params.id]);
    res.json({ success: true });
  } catch (e) { next(e); }
});

module.exports = router;
