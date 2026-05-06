const router = require("express").Router();
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
        "INSERT INTO users (name, email, password, role, phone, active, is_verified) VALUES (?, ?, ?, ?, ?, 1, 1)",
        [`${firstName} ${lastName}`, email, passwordHash, 'usager', phone]
      );

      await logActivity({ action: "USER_REGISTER", req, description: `Inscription de ${firstName} ${lastName} (${email})` });

      res.status(201).json({ success: true, message: "Inscription réussie" });
    } catch (e) { next(e); }
  }
);

router.post("/login",
  [body("email").isEmail(), body("password").notEmpty()], val,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const [[user]] = await db.query("SELECT * FROM users WHERE email=? AND active=1", [email]);
      if (!user || !(await bcrypt.compare(password, user.password)))
        return res.status(401).json({ error: "Identifiants incorrects" });
      
      const token = jwt.sign(
        { id: user.id, role: user.role, name: user.name, email: user.email },
        process.env.JWT_SECRET || "dev_secret", { expiresIn: "10h" });

      await logActivity({ userId: user.id, action: "USER_LOGIN", req, description: `Connexion réussie : ${user.name}` });

      res.json({ success: true, token, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
    } catch (e) { next(e); }
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
