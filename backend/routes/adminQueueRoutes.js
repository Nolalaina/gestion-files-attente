const router = require("express").Router();
const db = require("../config/db");
const auth = require("../middleware/authMiddleware");
const { body } = require("express-validator");
const val = require("../middleware/validateMiddleware");
const queueUtils = require("../utils/queueUtils");

// ============ SERVICES ============

// GET /api/admin/services - Voir tous les services
router.get("/services", auth(["admin"]), async (_req, res, next) => {
  try {
    const [services] = await db.query(`
      SELECT 
        s.*,
        COUNT(aa.agent_id) AS agents_count,
        (SELECT COUNT(*) FROM tickets WHERE service_id=s.id AND status='waiting' AND DATE(created_at)=CURDATE()) AS current_queue
       FROM services s
       LEFT JOIN agent_assignments aa ON aa.service_id = s.id
       GROUP BY s.id
       ORDER BY s.name`
    );

    res.json({ success: true, data: services });
  } catch (e) {
    next(e);
  }
});

// POST /api/admin/services - Créer service
router.post(
  "/services",
  auth(["admin"]),
  [
    body("name").notEmpty().trim(),
    body("prefix").isLength({ min: 1, max: 2 }),
    body("max_counters").isInt({ min: 1, max: 10 }),
    body("avg_duration").isInt({ min: 1, max: 60 }),
  ],
  val,
  async (req, res, next) => {
    try {
      const { name, prefix, max_counters, avg_duration, open_at, close_at } = req.body;

      const [result] = await db.query(
        `INSERT INTO services (name, prefix, max_counters, avg_duration, open_at, close_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, prefix, max_counters, avg_duration, open_at || "08:00:00", close_at || "17:00:00"]
      );

      // Créer règles par défaut
      await db.query(
        `INSERT INTO service_queue_rules (service_id, max_wait_time_min)
         VALUES (?, 30)`,
        [result.insertId]
      );

      res.status(201).json({ success: true, data: { id: result.insertId } });
    } catch (e) {
      next(e);
    }
  }
);

// PATCH /api/admin/services/:id - Mettre à jour service
router.patch(
  "/services/:id",
  auth(["admin"]),
  [
    body("name").optional().notEmpty().trim(),
    body("avg_duration").optional().isInt({ min: 1 }),
    body("active").optional().isBoolean(),
  ],
  val,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const [upd] = await db.query(
        "UPDATE services SET ? WHERE id=?",
        [updates, id]
      );

      if (upd.affectedRows === 0) {
        return res.status(404).json({ error: "Service inexistant" });
      }

      res.json({ success: true, message: "Service mis à jour" });
    } catch (e) {
      next(e);
    }
  }
);

// ============ AGENTS ============

// GET /api/admin/agents - Tous les agents
router.get("/agents", auth(["admin"]), async (_req, res, next) => {
  try {
    const [agents] = await db.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
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
  } catch (e) {
    next(e);
  }
});

// POST /api/admin/agents/:agentId/assign-service - Assigner service à agent
router.post(
  "/agents/:agentId/assign-service",
  auth(["admin"]),
  [
    body("service_id").isInt({ min: 1 }),
    body("status").optional().isIn(["available", "busy", "break", "offline"]),
  ],
  val,
  async (req, res, next) => {
    try {
      const { agentId } = req.params;
      const { service_id, status = "available" } = req.body;

      // Vérifier agent et service
      const [[agent]] = await db.query("SELECT id FROM users WHERE id=? AND role='agent'", [agentId]);
      const [[service]] = await db.query("SELECT id FROM services WHERE id=?", [service_id]);

      if (!agent || !service) {
        return res.status(404).json({ error: "Agent ou service inexistant" });
      }

      // Insérer ou mettre à jour
      await db.query(
        `INSERT INTO agent_assignments (agent_id, service_id, status)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE status=VALUES(status)`,
        [agentId, service_id, status]
      );

      res.json({ success: true, message: "Agent assigné au service" });
    } catch (e) {
      next(e);
    }
  }
);

// PUT /api/admin/agents/:agentId/config - Configurer agent (max concurrent, spécialité)
router.put(
  "/agents/:agentId/config",
  auth(["admin"]),
  [
    body("max_concurrent").optional().isInt({ min: 1, max: 5 }),
    body("specialty").optional().trim(),
  ],
  val,
  async (req, res, next) => {
    try {
      const { agentId } = req.params;
      const { max_concurrent, specialty } = req.body;

      const [upd] = await db.query(
        "UPDATE users SET max_concurrent=?, specialty=? WHERE id=? AND role='agent'",
        [max_concurrent, specialty, agentId]
      );

      if (upd.affectedRows === 0) {
        return res.status(404).json({ error: "Agent inexistant" });
      }

      res.json({ success: true, message: "Configuration agent mise à jour" });
    } catch (e) {
      next(e);
    }
  }
);

// ============ RÈGLES DE QUEUE ============

// GET /api/admin/queue-rules/:serviceId - Voir règles
router.get(
  "/queue-rules/:serviceId",
  auth(["admin"]),
  async (req, res, next) => {
    try {
      const { serviceId } = req.params;

      const [[rules]] = await db.query(
        "SELECT * FROM service_queue_rules WHERE service_id=?",
        [serviceId]
      );

      if (!rules) {
        return res.status(404).json({ error: "Règles inexistantes" });
      }

      res.json({ success: true, data: rules });
    } catch (e) {
      next(e);
    }
  }
);

// PUT /api/admin/queue-rules/:serviceId - Mettre à jour règles
router.put(
  "/queue-rules/:serviceId",
  auth(["admin"]),
  [
    body("max_wait_time_min").optional().isInt({ min: 5, max: 120 }),
    body("priority_boost_senior").optional().isInt({ min: 0 }),
    body("priority_boost_disabled").optional().isInt({ min: 0 }),
    body("enable_auto_routing").optional().isBoolean(),
  ],
  val,
  async (req, res, next) => {
    try {
      const { serviceId } = req.params;
      const updates = req.body;

      const [upd] = await db.query(
        "UPDATE service_queue_rules SET ? WHERE service_id=?",
        [updates, serviceId]
      );

      if (upd.affectedRows === 0) {
        return res.status(404).json({ error: "Règles inexistantes" });
      }

      res.json({ success: true, message: "Règles mises à jour" });
    } catch (e) {
      next(e);
    }
  }
);

// ============ HORAIRES SERVICES ============

// GET /api/admin/service-hours/:serviceId - Voir horaires
router.get(
  "/service-hours/:serviceId",
  auth(["admin"]),
  async (req, res, next) => {
    try {
      const { serviceId } = req.params;

      const [hours] = await db.query(
        `SELECT * FROM service_hours 
         WHERE service_id=?
         ORDER BY day_of_week`,
        [serviceId]
      );

      res.json({ success: true, data: hours });
    } catch (e) {
      next(e);
    }
  }
);

// PUT /api/admin/service-hours - Mettre à jour horaires
router.put(
  "/service-hours",
  auth(["admin"]),
  [
    body("service_id").isInt({ min: 1 }),
    body("hours").isArray(),
  ],
  val,
  async (req, res, next) => {
    try {
      const { service_id, hours } = req.body;

      // Supprimer anciens horaires
      await db.query("DELETE FROM service_hours WHERE service_id=?", [service_id]);

      // Insérer nouveaux
      for (const h of hours) {
        await db.query(
          `INSERT INTO service_hours (service_id, day_of_week, open_at, close_at, is_closed)
           VALUES (?, ?, ?, ?, ?)`,
          [service_id, h.day_of_week, h.open_at, h.close_at, h.is_closed]
        );
      }

      res.json({ success: true, message: "Horaires mises à jour" });
    } catch (e) {
      next(e);
    }
  }
);

// ============ TICKETS - GESTION ADMIN ============

// GET /api/admin/tickets - Voir tous tickets (filtrable)
router.get(
  "/tickets",
  auth(["admin"]),
  async (req, res, next) => {
    try {
      const { status, service_id, date, limit = 100 } = req.query;

      let sql = `SELECT t.*, s.name AS service_name, u.name AS agent_name
                 FROM tickets t
                 JOIN services s ON t.service_id = s.id
                 LEFT JOIN users u ON t.assigned_agent_id = u.id
                 WHERE 1=1`;
      const params = [];

      if (status) {
        sql += " AND t.status=?";
        params.push(status);
      }
      if (service_id) {
        sql += " AND t.service_id=?";
        params.push(service_id);
      }
      if (date) {
        sql += " AND DATE(t.created_at)=?";
        params.push(date);
      } else {
        sql += " AND DATE(t.created_at)=CURDATE()";
      }

      sql += " ORDER BY t.created_at DESC LIMIT ?";
      params.push(parseInt(limit) || 100);

      const [tickets] = await db.query(sql, params);
      res.json({ success: true, data: tickets });
    } catch (e) {
      next(e);
    }
  }
);

// DELETE /api/admin/tickets/:id - Supprimer ticket (admin only)
router.delete(
  "/tickets/:id",
  auth(["admin"]),
  async (req, res, next) => {
    try {
      const [del] = await db.query(
        "DELETE FROM tickets WHERE id=?",
        [req.params.id]
      );

      if (del.affectedRows === 0) {
        return res.status(404).json({ error: "Ticket inexistant" });
      }

      res.json({ success: true, message: "Ticket supprimé" });
    } catch (e) {
      next(e);
    }
  }
);

// ============ AUDIT & LOGS ============

// GET /api/admin/reassignments - Voir historique réassignations
router.get(
  "/reassignments",
  auth(["admin"]),
  async (req, res, next) => {
    try {
      const { limit = 100 } = req.query;

      const [reassignments] = await db.query(
        `SELECT 
          tr.id,
          t.number AS ticket_number,
          FROM_u.name AS from_agent,
          TO_u.name AS to_agent,
          tr.reason,
          tr.created_at
         FROM ticket_reassignments tr
         LEFT JOIN tickets t ON tr.ticket_id = t.id
         LEFT JOIN users FROM_u ON tr.from_agent_id = FROM_u.id
         LEFT JOIN users TO_u ON tr.to_agent_id = TO_u.id
         ORDER BY tr.created_at DESC
         LIMIT ?`,
        [parseInt(limit)]
      );

      res.json({ success: true, data: reassignments });
    } catch (e) {
      next(e);
    }
  }
);

// ============ IMPORTER/EXPORTER ============

// POST /api/admin/bulk-import - Importer clients
router.post(
  "/bulk-import",
  auth(["admin"]),
  [body("tickets").isArray()],
  val,
  async (req, res, next) => {
    try {
      const { tickets } = req.body;
      const results = [];

      for (const ticket of tickets) {
        try {
          const [[service]] = await db.query(
            "SELECT * FROM services WHERE id=? AND active=1",
            [ticket.service_id]
          );

          if (!service) continue;

          const [result] = await db.query(
            `INSERT INTO tickets 
             (number, service_id, user_name, phone, email, customer_type, visit_purpose)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              `${service.prefix}-${Date.now()}`,
              ticket.service_id,
              ticket.user_name,
              ticket.phone,
              ticket.email,
              ticket.customer_type || "regular",
              ticket.visit_purpose,
            ]
          );

          results.push({ success: true, ticket_id: result.insertId });
        } catch (err) {
          results.push({ success: false, error: err.message });
        }
      }

      res.json({ success: true, data: results, total_imported: results.filter(r => r.success).length });
    } catch (e) {
      next(e);
    }
  }
);

// ============ AGENTS GESTION COMPLETE ============

const adminCtrl = require("../controllers/adminController");

router.post("/agents", auth(["admin"]), adminCtrl.createAgent);
router.put("/agents/:userId", auth(["admin"]), adminCtrl.updateAgent);
router.patch("/agents/:userId/password", auth(["admin"]), adminCtrl.resetAgentPassword);
router.delete("/agents/:userId", auth(["admin"]), adminCtrl.deleteAgent);

// ============ CONFIGURATION & RESET ============

router.patch("/config/:serviceId", auth(["admin"]), adminCtrl.updateBankConfig);
router.post("/reset", auth(["admin"]), adminCtrl.resetBank);

module.exports = router;
