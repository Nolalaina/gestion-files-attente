const router = require("express").Router();
const db = require("../config/db");
const auth = require("../middleware/authMiddleware");
const queueUtils = require("../utils/queueUtils");

// ============ STATISTIQUES GÉNÉRALES ============

// GET /api/stats - Vue d'ensemble stats (public pour la page d'accueil)
router.get("/", async (_req, res, next) => {
  try {
    // Stats globales
    const [[global]] = await db.query(`
      SELECT 
        COUNT(*) AS total, 
        SUM(status='waiting') AS waiting, 
        SUM(status='called') AS called,
        SUM(status='done') AS done, 
        SUM(status='absent') AS absent, 
        SUM(status='cancelled') AS cancelled,
        ROUND(AVG(TIMESTAMPDIFF(MINUTE,created_at,called_at)),1) AS avg_wait_min,
        MAX(TIMESTAMPDIFF(MINUTE,created_at,called_at)) AS max_wait_min,
        ROUND(AVG(TIMESTAMPDIFF(MINUTE,serving_at,done_at)),1) AS avg_handling_min
      FROM tickets 
      WHERE DATE(created_at)=CURDATE()`
    );

    // Stats par service
    const [by_service] = await db.query(`
      SELECT 
        s.id,
        s.name,
        COUNT(t.id) AS total,
        SUM(t.status='waiting') AS waiting,
        SUM(t.status='done') AS done,
        ROUND(AVG(TIMESTAMPDIFF(MINUTE,t.created_at,t.called_at)),1) AS avg_wait_min,
        ROUND(AVG(t.satisfaction_score), 2) AS satisfaction
      FROM services s
      LEFT JOIN tickets t ON t.service_id=s.id AND DATE(t.created_at)=CURDATE()
      WHERE s.active=1
      GROUP BY s.id
      ORDER BY total DESC`
    );

    // Stats par type client
    const [by_customer_type] = await db.query(`
      SELECT 
        customer_type,
        COUNT(*) AS count,
        SUM(status='done') AS completed,
        ROUND(AVG(TIMESTAMPDIFF(MINUTE,created_at,called_at)),1) AS avg_wait_min,
        ROUND(AVG(TIMESTAMPDIFF(MINUTE,serving_at,done_at)),1) AS avg_handling_min
      FROM tickets
      WHERE DATE(created_at)=CURDATE()
      GROUP BY customer_type`
    );

    // Distrib horaire
    const [hourly] = await db.query(`
      SELECT 
        HOUR(created_at) AS hour, 
        COUNT(*) AS count,
        SUM(status='done') AS completed
      FROM tickets
      WHERE DATE(created_at)=CURDATE() 
      GROUP BY HOUR(created_at) 
      ORDER BY hour`
    );

    res.json({
      success: true,
      data: {
        global,
        by_service,
        by_customer_type,
        hourly_distribution: hourly,
      },
    });
  } catch (e) {
    next(e);
  }
});

// ============ STATISTIQUES HISTORIQUES ============

// GET /api/stats/history - Historique par jour
router.get("/history", auth(["admin"]), async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const [rows] = await db.query(`
      SELECT 
        DATE(created_at) AS date, 
        COUNT(*) AS total, 
        SUM(status='done') AS completed,
        SUM(status='absent') AS no_shows,
        ROUND(AVG(TIMESTAMPDIFF(MINUTE,created_at,called_at)),1) AS avg_wait,
        ROUND(AVG(TIMESTAMPDIFF(MINUTE,serving_at,done_at)),1) AS avg_handling,
        ROUND(AVG(satisfaction_score), 2) AS satisfaction
      FROM tickets 
      WHERE created_at >= DATE_SUB(CURDATE(),INTERVAL ? DAY)
      GROUP BY DATE(created_at) 
      ORDER BY date DESC`, [Number(days)]
    );

    res.json({ success: true, data: rows });
  } catch (e) {
    next(e);
  }
});

// ============ LOGS D'ACTIVITÉ ============

// GET /api/stats/logs - Logs d'activité récents
router.get("/logs", auth(["admin"]), async (req, res, next) => {
  try {
    const { limit = 100 } = req.query;
    const [rows] = await db.query(`
      SELECT al.*, u.name AS user_name
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT ?`, [Number(limit)]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    next(e);
  }
});

// ============ KPIs DÉTAILLÉS ============

// GET /api/stats/:serviceId/kpi - KPI détaillé service
router.get(
  "/:serviceId/kpi",
  auth(["admin"]),
  async (req, res, next) => {
    try {
      const { serviceId } = req.params;
      const { days = 7 } = req.query;

      const kpi = await queueUtils.calculateServiceKPI(serviceId, days);

      if (!kpi) {
        return res.status(404).json({ error: "Service inexistant" });
      }

      res.json({ success: true, data: kpi });
    } catch (e) {
      next(e);
    }
  }
);

// ============ PERFORMANCE AGENTS ============

// GET /api/stats/agents/performance - Performance agents
router.get(
  "/agents/performance",
  auth(["admin"]),
  async (req, res, next) => {
    try {
      const { days = 7 } = req.query;

      const [agents] = await db.query(`
        SELECT 
          u.id,
          u.name,
          s.name AS service,
          COUNT(t.id) AS tickets_handled,
          ROUND(AVG(TIMESTAMPDIFF(MINUTE, t.serving_at, t.done_at)), 1) AS avg_handling_min,
          ROUND(AVG(t.satisfaction_score), 2) AS avg_satisfaction,
          ROUND(SUM(t.status='done') / COUNT(t.id) * 100, 1) AS completion_rate
         FROM agent_assignments aa
         JOIN users u ON aa.agent_id = u.id
         JOIN services s ON aa.service_id = s.id
         LEFT JOIN tickets t ON t.assigned_agent_id = u.id
           AND t.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
         GROUP BY u.id, u.name, s.id
         ORDER BY tickets_handled DESC`, [days]
      );

      res.json({ success: true, data: agents });
    } catch (e) {
      next(e);
    }
  }
);

// ============ SATISFACTION CLIENTS ============

// GET /api/stats/satisfaction - Scores satisfaction
router.get(
  "/satisfaction",
  auth(["admin"]),
  async (req, res, next) => {
    try {
      const [[overall]] = await db.query(`
        SELECT 
          COUNT(*) AS total_feedback,
          ROUND(AVG(rating), 2) AS overall_rating,
          ROUND(AVG(wait_time_satisfaction), 2) AS wait_satisfaction,
          ROUND(AVG(agent_behavior), 2) AS agent_behavior,
          ROUND(AVG(facility_cleanliness), 2) AS facility_rating
         FROM customer_feedback
         WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`
      );

      const [by_service] = await db.query(`
        SELECT 
          s.name,
          COUNT(cf.id) AS feedback_count,
          ROUND(AVG(cf.rating), 2) AS avg_rating
         FROM services s
         LEFT JOIN tickets t ON t.service_id = s.id
         LEFT JOIN customer_feedback cf ON t.id = cf.ticket_id
           AND cf.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
         WHERE s.active = 1
         GROUP BY s.id`
      );

      res.json({
        success: true,
        data: { overall, by_service },
      });
    } catch (e) {
      next(e);
    }
  }
);

// ============ RAPPORT DÉTAILLÉ ============

// GET /api/stats/:serviceId/report - Rapport complet service
router.get(
  "/:serviceId/report",
  auth(["admin"]),
  async (req, res, next) => {
    try {
      const { serviceId } = req.params;
      const { date = new Date().toISOString().split("T")[0] } = req.query;

      const report = await queueUtils.generateDailyReport(serviceId, date);

      if (!report) {
        return res.status(404).json({ error: "Pas de données pour cette date" });
      }

      res.json({ success: true, data: report });
    } catch (e) {
      next(e);
    }
  }
);

// ============ ANOMALIES & ALERTES ============

// GET /api/stats/alerts - Tickets abandonnés, long attente
router.get(
  "/alerts",
  auth(["admin"]),
  async (req, res, next) => {
    try {
      // Tickets abandonnés
      const [abandoned] = await db.query(`
        SELECT id, number, user_name, service_id,
          TIMESTAMPDIFF(MINUTE, called_at, NOW()) AS time_without_service_min
        FROM tickets
        WHERE status='called' AND called_at < DATE_SUB(NOW(), INTERVAL 20 MINUTE)`
      );

      // Queues trop longues
      const [long_queues] = await db.query(`
        SELECT 
          s.id,
          s.name,
          COUNT(t.id) AS waiting_count,
          ROUND(AVG(TIMESTAMPDIFF(MINUTE, t.created_at, NOW())), 1) AS avg_wait_min
        FROM services s
        LEFT JOIN tickets t ON t.service_id = s.id AND t.status='waiting'
        WHERE s.active=1
        GROUP BY s.id
        HAVING waiting_count > 10`
      );

      // Agents inactifs
      const [inactive_agents] = await db.query(`
        SELECT 
          u.id,
          u.name,
          s.name AS service,
          aa.status,
          aa.updated_at
        FROM agent_assignments aa
        JOIN users u ON aa.agent_id = u.id
        JOIN services s ON aa.service_id = s.id
        WHERE aa.status = 'offline' AND aa.updated_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)`
      );

      res.json({
        success: true,
        data: {
          abandoned_tickets: abandoned,
          long_queues,
          inactive_agents,
          alerts_count: abandoned.length + long_queues.length + inactive_agents.length,
        },
      });
    } catch (e) {
      next(e);
    }
  }
);

// ============ EXPORT DONNÉES ============

// GET /api/stats/export/csv - Export CSV
router.get(
  "/export/csv",
  auth(["admin"]),
  async (req, res, next) => {
    try {
      const { startDate, endDate, serviceId } = req.query;

      const [tickets] = await db.query(`
        SELECT 
          t.number,
          s.name AS service,
          t.user_name,
          t.customer_type,
          t.visit_purpose,
          t.status,
          TIMESTAMPDIFF(MINUTE, t.created_at, t.called_at) AS wait_time_min,
          TIMESTAMPDIFF(MINUTE, t.serving_at, t.done_at) AS handling_time_min,
          t.satisfaction_score,
          t.created_at
         FROM tickets t
         JOIN services s ON t.service_id = s.id
         WHERE 1=1
         ${startDate ? "AND DATE(t.created_at) >= ?" : ""}
         ${endDate ? "AND DATE(t.created_at) <= ?" : ""}
         ${serviceId ? "AND t.service_id = ?" : ""}
         ORDER BY t.created_at DESC
         LIMIT 10000`,
        [
          ...(startDate ? [startDate] : []),
          ...(endDate ? [endDate] : []),
          ...(serviceId ? [serviceId] : []),
        ]
      );

      // Vérifier s'il y a des données
      if (!tickets.length) {
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=queue_data.csv");
        return res.send("Aucune donnée");
      }

      // Générer CSV
      const headers = Object.keys(tickets[0]);
      const csv = [
        headers.join(","),
        ...tickets.map(row =>
          headers.map(h => JSON.stringify(row[h] ?? "")).join(",")
        ),
      ].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=queue_data.csv");
      res.send(csv);
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;
