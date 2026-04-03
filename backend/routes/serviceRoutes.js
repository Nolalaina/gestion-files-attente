const router = require("express").Router();
const { body } = require("express-validator");
const db   = require("../config/db");
const auth = require("../middleware/authMiddleware");
const val  = require("../middleware/validateMiddleware");

router.get("/", async (_req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT s.*,
        (SELECT COUNT(*) FROM tickets t WHERE t.service_id=s.id AND t.status='waiting' AND DATE(t.created_at)=CURDATE()) AS waiting_count
      FROM services s WHERE s.active=1 ORDER BY s.name`);
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const [[svc]] = await db.query("SELECT * FROM services WHERE id=?", [req.params.id]);
    if (!svc) return res.status(404).json({ error: "Service introuvable" });
    res.json({ success: true, data: svc });
  } catch (e) { next(e); }
});

router.post("/", auth("admin"),
  [body("name").notEmpty().trim(), body("prefix").isLength({ min:1,max:2 })], val,
  async (req, res, next) => {
    try {
      const { name, description, prefix="A", max_counters=1, avg_duration=5 } = req.body;
      const [r] = await db.query(
        "INSERT INTO services (name,description,prefix,max_counters,avg_duration) VALUES (?,?,?,?,?)",
        [name, description||null, prefix, max_counters, avg_duration]);
      res.status(201).json({ success: true, id: r.insertId });
    } catch (e) { next(e); }
  }
);

router.put("/:id", auth("admin"), async (req, res, next) => {
  try {
    const { name, description, max_counters, avg_duration, active, open_at, close_at } = req.body;
    await db.query(
      "UPDATE services SET name=?,description=?,max_counters=?,avg_duration=?,active=?,open_at=?,close_at=? WHERE id=?",
      [name, description, max_counters, avg_duration, active, open_at, close_at, req.params.id]);
    res.json({ success: true });
  } catch (e) { next(e); }
});

module.exports = router;
