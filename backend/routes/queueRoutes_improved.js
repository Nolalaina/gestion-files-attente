const router = require("express").Router();
const db = require("../config/db");
const queueCtrl = require("../controllers/queueController");
const auth = require("../middleware/authMiddleware");
const val = require("../middleware/validateMiddleware");
const { body, query } = require("express-validator");

// ============ ENDPOINTS CLIENTS ============

// GET /api/queues/:serviceId - Voir queue en temps réel
router.get("/:serviceId", async (req, res, next) => {
  try {
    const id = req.params.serviceId;
    
    // Queue en attente triée par priorité
    const [waiting] = await db.query(
      `SELECT t.*, s.name AS service_name, s.prefix
       FROM tickets t
       JOIN services s ON t.service_id=s.id
       WHERE t.service_id=? AND t.status='waiting' AND DATE(t.created_at)=CURDATE()
       ORDER BY 
         CASE t.customer_type
           WHEN 'urgent' THEN 0
           WHEN 'vip' THEN 1
           WHEN 'disabled' THEN 2
           WHEN 'senior' THEN 3
           ELSE 4
         END,
         t.created_at ASC`
      , [id]
    );

    // Tickets actuellement servis
    const [called] = await db.query(
      `SELECT t.*, s.name AS service_name, u.name AS agent_name
       FROM tickets t
       JOIN services s ON t.service_id=s.id
       LEFT JOIN users u ON t.assigned_agent_id=u.id
       WHERE t.service_id=? AND t.status IN ('called','serving') AND DATE(t.created_at)=CURDATE()
       ORDER BY t.called_at ASC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        waiting,
        called,
        total_waiting: waiting.length,
        total_being_served: called.length,
      },
    });
  } catch (e) {
    next(e);
  }
});

// GET /api/queues/:serviceId/estimate - Estimer temps d'attente
router.get("/:serviceId/estimate", queueCtrl.estimateWaitTime);

// ============ ENDPOINTS AGENT & GESTION ============

// POST /api/queues/:serviceId/create-ticket - Créer ticket avancé avec priorités
router.post(
  "/:serviceId/create-ticket",
  [
    body("user_name").notEmpty().trim(),
    body("service_id").isInt({ min: 1 }),
    body("customer_type").optional().isIn(["regular", "vip", "senior", "disabled", "urgent"]),
    body("visit_purpose").optional().trim(),
  ],
  val,
  queueCtrl.createTicketAdvanced
);

// GET /api/queues/:serviceId/status - Tableau queue temps réel (Agent view)
router.get(
  "/:serviceId/status",
  auth(["agent", "admin"]),
  queueCtrl.getQueueStatus
);

// PATCH /api/queues/:ticketId/assign - Assigner ticket à agent
router.patch(
  "/:serviceId/assign",
  auth(["agent", "admin"]),
  [body("counter").optional().isInt({ min: 1, max: 10 })],
  val,
  queueCtrl.assignNextTicket
);

// PATCH /api/queues/:ticketId/no-show - Marquer ticket comme absent
router.patch(
  "/:ticketId/no-show",
  auth(["agent", "admin"]),
  [body("reason").optional().trim()],
  val,
  queueCtrl.handleNoShow
);

// POST /api/queues/:ticketId/feedback - Soumettre feedback client
router.post(
  "/:ticketId/feedback",
  [
    body("rating").isInt({ min: 1, max: 5 }),
    body("wait_satisfaction").optional().isInt({ min: 1, max: 5 }),
    body("agent_behavior").optional().isInt({ min: 1, max: 5 }),
    body("facility").optional().isInt({ min: 1, max: 5 }),
    body("comment").optional().trim(),
  ],
  val,
  queueCtrl.submitFeedback
);

// ============ ENDPOINTS ADMIN ============

// GET /api/queues/:serviceId/analytics - Statistiques détaillées
router.get(
  "/:serviceId/analytics",
  auth(["admin"]),
  [query("days").optional().isInt({ min: 1, max: 365 })],
  val,
  queueCtrl.getQueueAnalytics
);

// GET /api/queues - Vue d'ensemble toutes les queues
router.get(
  "/",
  auth(["admin"]),
  async (req, res, next) => {
    try {
      const [services] = await db.query(
        `SELECT s.*, 
          (SELECT COUNT(*) FROM tickets WHERE service_id=s.id AND status='waiting' AND DATE(created_at)=CURDATE()) AS waiting,
          (SELECT COUNT(*) FROM tickets WHERE service_id=s.id AND status IN ('called','serving') AND DATE(created_at)=CURDATE()) AS serving,
          ROUND(AVG(TIMESTAMPDIFF(MINUTE, t.created_at, t.called_at)), 1) AS avg_wait
         FROM services s
         LEFT JOIN tickets t ON t.service_id=s.id AND DATE(t.created_at)=CURDATE()
         WHERE s.active=1
         GROUP BY s.id`
      );

      res.json({ success: true, data: services });
    } catch (e) {
      next(e);
    }
  }
);

// POST /api/queues/:serviceId/agent-status - Mettre à jour agent status
router.post(
  "/:serviceId/agent-status",
  auth(["agent", "admin"]),
  [
    body("agent_id").isInt({ min: 1 }),
    body("status").isIn(["available", "busy", "break", "offline"]),
  ],
  val,
  async (req, res, next) => {
    try {
      const { agent_id, status } = req.body;
      const { serviceId } = req.params;

      const [upd] = await db.query(
        `UPDATE agent_assignments 
         SET status = ? 
         WHERE agent_id=? AND service_id=?`,
        [status, agent_id, serviceId]
      );

      if (upd.affectedRows === 0) {
        // Créer s'il n'existe pas
        await db.query(
          `INSERT INTO agent_assignments (agent_id, service_id, status)
           VALUES (?, ?, ?)`,
          [agent_id, serviceId, status]
        );
      }

      res.json({ success: true, message: "Statut mis à jour" });
    } catch (e) {
      next(e);
    }
  }
);

// GET /api/queues/:serviceId/agents - Voir agents et leur charge
router.get(
  "/:serviceId/agents",
  auth(["agent", "admin"]),
  async (req, res, next) => {
    try {
      const { serviceId } = req.params;

      const [agents] = await db.query(
        `SELECT 
          aa.agent_id,
          u.name,
          aa.status,
          (SELECT COUNT(*) FROM tickets WHERE assigned_agent_id=aa.agent_id AND status IN ('called', 'serving')) AS current_load,
          aa.tickets_handled,
          ROUND(aa.cumulative_handling_time / NULLIF(aa.tickets_handled, 0) / 60, 1) AS avg_handling_min
         FROM agent_assignments aa
         JOIN users u ON aa.agent_id = u.id
         WHERE aa.service_id=?
         ORDER BY aa.status, current_load ASC`,
        [serviceId]
      );

      res.json({ success: true, data: agents });
    } catch (e) {
      next(e);
    }
  }
);

// DELETE /api/queues/:ticketId - Annuler ticket
router.delete("/:ticketId", auth(), async (req, res, next) => {
  try {
    const [upd] = await db.query(
      "UPDATE tickets SET status='cancelled' WHERE id=? AND status IN ('waiting','called')",
      [req.params.ticketId]
    );

    if (upd.affectedRows === 0) {
      return res.status(400).json({ error: "Ticket ne peut pas être annulé" });
    }

    res.json({ success: true, message: "Ticket annulé" });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
