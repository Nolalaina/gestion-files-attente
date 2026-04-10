const router = require("express").Router();
const bcrypt = require("bcryptjs");
const { body } = require("express-validator");
const db   = require("../config/db");
const auth = require("../middleware/authMiddleware");
const val  = require("../middleware/validateMiddleware");

router.get("/", auth("admin"), async (req, res, next) => {
  try {
    const { search, role, active } = req.query;
    let sql = `
      SELECT u.id, u.name, u.email, u.role, u.phone, u.active, u.created_at,
             (SELECT COUNT(*) FROM tickets WHERE assigned_agent_id = u.id AND DATE(created_at) = CURDATE()) AS ticket_count
      FROM users u
      WHERE 1=1
    `;
    const p = [];

    if (search) {
      sql += " AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)";
      const term = `%${search}%`;
      p.push(term, term, term);
    }
    if (role) {
      sql += " AND u.role = ?";
      p.push(role);
    }
    if (active !== undefined && active !== "") {
      sql += " AND u.active = ?";
      p.push(active === "true" || active === "1" ? 1 : 0);
    }

    sql += " ORDER BY u.name ASC";
    const [rows] = await db.query(sql, p);
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
});

router.post("/", auth("admin"),
  [body("email").isEmail(), body("password").isLength({min:6}), body("role").isIn(["agent","admin"])], val,
  async (req, res, next) => {
    try {
      const { name, email, password, role, phone } = req.body;
      const hash = await bcrypt.hash(password, 10);
      const [r] = await db.query(
        "INSERT INTO users (name,email,password,role,phone,is_verified,active) VALUES (?,?,?,?,?,1,1)",
        [name, email, hash, role, phone||null]);
      res.status(201).json({ success: true, id: r.insertId });
    } catch (e) { next(e); }
  }
);

router.patch("/:id/toggle", auth("admin"), async (req, res, next) => {
  try {
    await db.query("UPDATE users SET active = NOT active WHERE id=?", [req.params.id]);
    res.json({ success: true });
  } catch (e) { next(e); }
});

module.exports = router;
