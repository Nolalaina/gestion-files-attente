const router = require("express").Router();
const db = require("../config/db");
const auth = require("../middleware/authMiddleware");
const { body } = require("express-validator");
const val = require("../middleware/validateMiddleware");
const adminController = require("../controllers/adminController");

// ============ DASHBOARD & GLOBAL ============
router.get("/dashboard", auth("admin"), adminController.getDashboard);
router.post("/reset", auth("admin"), adminController.resetBank);

// ============ USER & AGENT MANAGEMENT ============
router.get("/users", auth("admin"), adminController.getUsersTable);
router.patch("/users/:userId/status", auth("admin"), adminController.updateUserStatus);

router.get("/agents", auth("admin"), async (_req, res, next) => {
  try {
    const [agents] = await db.query(`
      SELECT 
        u.id, u.name, u.email, u.phone,
        GROUP_CONCAT(s.name SEPARATOR ', ') AS assigned_services,
        SUM(CASE WHEN DATE(t.created_at)=CURDATE() THEN 1 ELSE 0 END) AS tickets_today,
        ROUND(AVG(TIMESTAMPDIFF(MINUTE, t.serving_at, t.done_at)), 1) AS avg_handling_min,
        ROUND(AVG(t.satisfaction_score), 2) AS avg_satisfaction
       FROM users u
       LEFT JOIN agent_assignments aa ON u.id = aa.agent_id
       LEFT JOIN services s ON aa.service_id = s.id
       LEFT JOIN tickets t ON u.id = t.assigned_agent_id
       WHERE u.role='agent'
       GROUP BY u.id
       ORDER BY u.name`
    );
    res.json({ success: true, data: agents });
  } catch (e) { next(e); }
});

router.post("/agents", auth("admin"), adminController.createAgent);
router.put("/agents/:userId", auth("admin"), adminController.updateAgent);
router.patch("/agents/:userId/password", auth("admin"), adminController.resetAgentPassword);
router.delete("/agents/:userId", auth("admin"), adminController.deleteAgent);

router.post("/agents/:agentId/assign-service", auth("admin"), [
  body("service_id").isInt({ min: 1 }),
  body("status").optional().isIn(["available", "busy", "break", "offline"]),
], val, async (req, res, next) => {
  try {
    const { agentId } = req.params;
    const { service_id, status = "available" } = req.body;
    await db.query(
      `INSERT INTO agent_assignments (agent_id, service_id, status)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE status=VALUES(status)`,
      [agentId, service_id, status]
    );
    res.json({ success: true, message: "Agent assigné au service" });
  } catch (e) { next(e); }
});

// ============ SERVICES ============
router.get("/services", auth("admin"), async (_req, res, next) => {
  try {
    const [services] = await db.query(`
      SELECT s.*, COUNT(aa.agent_id) AS agents_count,
        (SELECT COUNT(*) FROM tickets WHERE service_id=s.id AND status='waiting' AND DATE(created_at)=CURDATE()) AS current_queue
       FROM services s
       LEFT JOIN agent_assignments aa ON aa.service_id = s.id
       GROUP BY s.id ORDER BY s.name`);
    res.json({ success: true, data: services });
  } catch (e) { next(e); }
});

router.post("/services", auth("admin"), [
  body("name").notEmpty().trim(),
  body("prefix").isLength({ min: 1, max: 2 }),
  body("max_counters").isInt({ min: 1, max: 10 }),
], val, async (req, res, next) => {
  try {
    const { name, prefix, max_counters, avg_duration, open_at, close_at } = req.body;
    const [result] = await db.query(
      "INSERT INTO services (name, prefix, max_counters, avg_duration, open_at, close_at) VALUES (?, ?, ?, ?, ?, ?)",
      [name, prefix, max_counters, avg_duration || 15, open_at || "08:00:00", close_at || "17:00:00"]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (e) { next(e); }
});

router.patch("/services/:id", auth("admin"), [
  body("name").optional().notEmpty().trim(),
], val, async (req, res, next) => {
  try {
    await db.query("UPDATE services SET ? WHERE id=?", [req.body, req.params.id]);
    res.json({ success: true, message: "Service mis à jour" });
  } catch (e) { next(e); }
});

// ============ BANKING ADMIN ============
router.get("/accounts", auth("admin"), adminController.getAccountsTable);
router.get("/transactions", auth("admin"), adminController.getTransactionsTable);

// ============ AUDIT & LOGS ============
router.get("/logs", auth("admin"), adminController.getActivityLogsTable);
router.get("/reassignments", auth("admin"), async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT tr.*, t.number AS ticket_number, u1.name AS from_agent, u2.name AS to_agent
      FROM ticket_reassignments tr
      LEFT JOIN tickets t ON tr.ticket_id = t.id
      LEFT JOIN users u1 ON tr.from_agent_id = u1.id
      LEFT JOIN users u2 ON tr.to_agent_id = u2.id
      ORDER BY tr.created_at DESC LIMIT ?`, [parseInt(req.query.limit) || 100]);
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
});

// ============ TICKETS ADMIN ============
router.get("/tickets", auth("admin"), async (req, res, next) => {
  try {
    const { status, service_id, date, limit = 100 } = req.query;
    let sql = "SELECT t.*, s.name AS service_name, u.name AS agent_name FROM tickets t JOIN services s ON t.service_id = s.id LEFT JOIN users u ON t.assigned_agent_id = u.id WHERE 1=1";
    const p = [];
    if (status) { sql += " AND t.status=?"; p.push(status); }
    if (service_id) { sql += " AND t.service_id=?"; p.push(service_id); }
    if (date) { sql += " AND DATE(t.created_at)=?"; p.push(date); }
    else { sql += " AND DATE(t.created_at)=CURDATE()"; }
    sql += " ORDER BY t.created_at DESC LIMIT ?";
    p.push(parseInt(limit));
    const [rows] = await db.query(sql, p);
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
});

router.delete("/tickets/:id", auth("admin"), async (req, res, next) => {
  try {
    await db.query("DELETE FROM tickets WHERE id=?", [req.params.id]);
    res.json({ success: true, message: "Ticket supprimé" });
  } catch (e) { next(e); }
});

module.exports = router;
