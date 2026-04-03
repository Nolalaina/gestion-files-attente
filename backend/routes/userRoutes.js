const router = require("express").Router();
const bcrypt = require("bcryptjs");
const { body } = require("express-validator");
const db   = require("../config/db");
const auth = require("../middleware/authMiddleware");
const val  = require("../middleware/validateMiddleware");

router.get("/", auth("admin"), async (_req, res, next) => {
  try {
    const [rows] = await db.query("SELECT id,name,email,role,phone,active,created_at FROM users ORDER BY name");
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
        "INSERT INTO users (name,email,password,role,phone) VALUES (?,?,?,?,?)",
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
