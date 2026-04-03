const router = require("express").Router();
const db   = require("../config/db");
const auth = require("../middleware/authMiddleware");

router.get("/", auth(["admin","agent"]), async (_req, res, next) => {
  try {
    const [[global]] = await db.query(`
      SELECT COUNT(*) AS total, SUM(status='waiting') AS waiting, SUM(status='called') AS called,
             SUM(status='done') AS done, SUM(status='absent') AS absent, SUM(status='cancelled') AS cancelled,
             ROUND(AVG(TIMESTAMPDIFF(MINUTE,created_at,called_at)),1) AS avg_wait_min
      FROM tickets WHERE DATE(created_at)=CURDATE()`);
    const [by_service] = await db.query("SELECT * FROM v_stats_today ORDER BY total DESC");
    const [hourly]     = await db.query(`
      SELECT HOUR(created_at) AS hour, COUNT(*) AS count FROM tickets
      WHERE DATE(created_at)=CURDATE() GROUP BY HOUR(created_at) ORDER BY hour`);
    res.json({ success: true, data: { global, by_service, hourly } });
  } catch (e) { next(e); }
});

router.get("/history", auth("admin"), async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const [rows] = await db.query(`
      SELECT DATE(created_at) AS date, COUNT(*) AS total, SUM(status='done') AS done,
             ROUND(AVG(TIMESTAMPDIFF(MINUTE,created_at,called_at)),1) AS avg_wait
      FROM tickets WHERE created_at >= DATE_SUB(CURDATE(),INTERVAL ? DAY)
      GROUP BY DATE(created_at) ORDER BY date`, [Number(days)]);
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
});

module.exports = router;
