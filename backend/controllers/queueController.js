const db = require("../config/db");
const { logActivity } = require("../utils/logger");

// ============ PRIORITÉS & CLASSIFICATION ============

const getPriorityScore = (customerType, waitTimeSec) => {
  const basePriority = {
    urgent: 1000,
    vip: 100,
    senior: 50,
    disabled: 75,
    regular: 0,
  };
  
  const baseScore = basePriority[customerType] || 0;
  const waitBoost = Math.floor(waitTimeSec / 300); // +1 point tous les 5 min
  return baseScore + waitBoost;
};

// ============ ESTIMATION TEMPS D'ATTENTE ============

exports.estimateWaitTime = async (req, res, next) => {
  try {
    const serviceId = req.params.serviceId;
    const customerType = req.query.customerType || "regular";
    
    if (!serviceId) return res.status(400).json({ error: "serviceId requis" });

    // Récupérer info service
    const [[service]] = await db.query(
      "SELECT avg_duration, max_counters FROM services WHERE id=?",
      [serviceId]
    );
    if (!service) return res.status(404).json({ error: "Service inexistant" });

    // Compter tickets en attente
    const [[data]] = await db.query(
      `SELECT COUNT(*) as waiting_count 
       FROM tickets 
       WHERE service_id=? AND status='waiting' AND DATE(created_at)=CURDATE()`,
      [serviceId]
    );

    // Métriques historiques pour meilleure estimation
    const [[historics]] = await db.query(
      `SELECT 
        ROUND(AVG(TIMESTAMPDIFF(MINUTE, created_at, called_at)), 1) as avg_wait,
        MAX(TIMESTAMPDIFF(MINUTE, created_at, called_at)) as max_wait
       FROM tickets
       WHERE service_id=? AND status='done' 
       AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
      [serviceId]
    );

    // Récupérer agents actifs
    const [[agents]] = await db.query(
      `SELECT COUNT(*) as active_agents FROM agent_assignments 
       WHERE service_id=? AND status IN ('available', 'busy')`,
      [serviceId]
    );

    const activeAgents = agents.active_agents || 1;
    const avgHistoric = historics?.avg_wait || service.avg_duration;
    const ticketsPerAgent = Math.max(1, Math.ceil(data.waiting_count / activeAgents));

    // Calcul avec priorités
    let estimatedWait = ticketsPerAgent * avgHistoric;
    
    if (customerType === "vip") estimatedWait *= 0.5; // 50% réduction
    if (customerType === "senior") estimatedWait *= 0.7; // 30% réduction
    if (customerType === "disabled") estimatedWait *= 0.6; // 40% réduction
    if (customerType === "urgent") estimatedWait = Math.min(5, estimatedWait); // Max 5 min

    res.json({
      success: true,
      data: {
        estimated_wait_min: Math.ceil(estimatedWait),
        people_ahead: Math.max(0, ticketsPerAgent - 1),
        active_agents: activeAgents,
        avg_historic_min: Math.ceil(avgHistoric),
        service_name: service.name,
      },
    });
  } catch (e) {
    next(e);
  }
};

// ============ SÉLECTION AGENT INTELLIGENT ============

const findBestAgent = async (serviceId, ticketPriority) => {
  // Priorité: agents disponibles avec moins de charge
  const [[agentData]] = await db.query(
    `SELECT aa.agent_id, u.name,
      (SELECT COUNT(*) FROM tickets WHERE assigned_agent_id = aa.agent_id 
       AND status IN ('called', 'serving')) as current_load,
      ROUND(aa.cumulative_handling_time / NULLIF(aa.tickets_handled, 0) / 60, 1) as avg_time
     FROM agent_assignments aa
     JOIN users u ON aa.agent_id = u.id
     WHERE aa.service_id = ?
     ORDER BY 
       CASE 
         WHEN aa.status = 'available' THEN 0
         ELSE 1
       END,
       current_load ASC,
       aa.updated_at ASC
     LIMIT 1`,
    [serviceId]
  );

  return agentData;
};

// ============ ASSIGNATION INTELLIGENTE ============

exports.assignNextTicket = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const { agentId } = req.body;

    if (!serviceId) return res.status(400).json({ error: "serviceId requis" });

    // Trouver prochain ticket dans la queue
    const [[nextTicket]] = await db.query(
      `SELECT * FROM tickets 
       WHERE service_id=? AND status='waiting' AND DATE(created_at)=CURDATE()
       ORDER BY 
         CASE customer_type
           WHEN 'urgent' THEN 0
           WHEN 'vip' THEN 1
           WHEN 'disabled' THEN 2
           WHEN 'senior' THEN 3
           ELSE 4
         END,
         created_at ASC
       LIMIT 1`,
      [serviceId]
    );

    if (!nextTicket) {
      return res.status(200).json({ message: "Pas de ticket en attente" });
    }

    // Trouver agent
    let agent = agentId ? { agent_id: agentId } : await findBestAgent(serviceId, nextTicket.priority);
    
    if (!agent) {
      return res.status(503).json({ error: "Aucun agent disponible" });
    }

    // Assigner le ticket
    const [upd] = await db.query(
      `UPDATE tickets 
       SET assigned_agent_id=?, status='called', counter=?, called_at=NOW()
       WHERE id=?`,
      [agent.agent_id, req.body.counter || 1, nextTicket.id]
    );

    const [[ticket]] = await db.query("SELECT * FROM tickets WHERE id=?", [nextTicket.id]);

    // Log de la réassignation
    await db.query(
      `INSERT INTO ticket_reassignments (ticket_id, to_agent_id, reason)
       VALUES (?, ?, 'load_balancing')`,
      [nextTicket.id, agent.agent_id]
    );

    // Log assignment
    await logActivity({
      userId: agent.agent_id,
      action: "TICKET_ASSIGNED",
      entityType: "ticket",
      entityId: nextTicket.id,
      req,
      description: `Ticket ${ticket.number} assigné à l'agent ${agent.name || agent.agent_id}`
    });

    req.app.get("io").to(`queue_${serviceId}`).emit("ticket:assigned", ticket);
    req.app.get("io").to("admin").emit("ticket:assigned", ticket);

    res.json({ success: true, data: ticket });
  } catch (e) {
    next(e);
  }
};

// ============ GESTION ABSENCES & RÉASSIGNATION ============

exports.handleNoShow = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { reason = "not_present" } = req.body;

    const [[ticket]] = await db.query("SELECT * FROM tickets WHERE id=?", [ticketId]);
    if (!ticket) return res.status(404).json({ error: "Ticket inexistant" });

    // Marquer comme absent
    const [upd] = await db.query(
      `UPDATE tickets 
       SET status='absent', no_show_reason=?, served_at=NOW()
       WHERE id=?`,
      [reason, ticketId]
    );

    if (upd.affectedRows === 0) {
      return res.status(400).json({ error: "Transition invalide" });
    }

    // Offrir réassignation
    const nextSlot = req.body.reschedule_for ? 
      new Date(req.body.reschedule_for).toISOString().slice(0, 19).replace("T", " ") :
      null;

    if (nextSlot) {
      await db.query(
        `INSERT INTO notifications (ticket_id, type, message, status)
         VALUES (?, 'email', CONCAT('Vous avez manqué votre rendez-vous ', ?), 'pending')`,
        [ticketId, nextSlot]
      );
    }

    const [[updatedTicket]] = await db.query("SELECT * FROM tickets WHERE id=?", [ticketId]);
    
    // Log no-show
    await logActivity({
      userId: req.user ? req.user.id : null,
      action: "TICKET_NO_SHOW",
      entityType: "ticket",
      entityId: ticketId,
      req,
      description: `Absence signalée pour le ticket ${updatedTicket.number} (Raison: ${reason})`
    });

    req.app.get("io").to(`queue_${ticket.service_id}`).emit("ticket:no_show", updatedTicket);

    res.json({ success: true, data: updatedTicket });
  } catch (e) {
    next(e);
  }
};

// ============ ÉVALUATION SATISFACTION ============

exports.submitFeedback = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { rating, wait_satisfaction, agent_behavior, facility, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Note invalide (1-5)" });
    }

    const [[ticket]] = await db.query("SELECT * FROM tickets WHERE id=?", [ticketId]);
    if (!ticket) return res.status(404).json({ error: "Ticket inexistant" });

    // Insérer feedback
    const [feedback] = await db.query(
      `INSERT INTO customer_feedback 
       (ticket_id, rating, wait_time_satisfaction, agent_behavior, facility_cleanliness, comment)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [ticketId, rating, wait_satisfaction, agent_behavior, facility, comment]
    );

    // Mettre à jour le ticket
    await db.query(
      `UPDATE tickets SET satisfaction_score=? WHERE id=?`,
      [rating, ticketId]
    );

    // Log feedback
    await logActivity({
      action: "FEEDBACK_SUBMITTED",
      entityType: "feedback",
      entityId: feedback.insertId,
      req,
      description: `Feedback reçu pour le ticket #${ticketId} (Note: ${rating}/5)`
    });

    res.status(201).json({ success: true, data: { feedback_id: feedback.insertId } });
  } catch (e) {
    next(e);
  }
};

// ============ TABLEAU QUEUE EN TEMPS RÉEL ============

exports.getQueueStatus = async (req, res, next) => {
  try {
    const { serviceId } = req.params;

    const [[service]] = await db.query("SELECT * FROM services WHERE id=?", [serviceId]);
    if (!service) return res.status(404).json({ error: "Service inexistant" });

    // Queue en attente (triée par priorité)
    const [waiting] = await db.query(
      `SELECT 
        id, number, user_name, phone, email,
        customer_type, visit_purpose, created_at,
        (SELECT COUNT(*) FROM tickets t2 
         WHERE t2.service_id=? AND t2.status='waiting'
         AND t2.customer_type IN ('urgent','vip','disabled','senior')
         AND t2.created_at < t.created_at) +
        (SELECT COUNT(*) FROM tickets t3 
         WHERE t3.service_id=? AND t3.status='waiting'
         AND TIMESTAMPDIFF(MINUTE, t3.created_at, NOW()) > 15
         AND t3.created_at < t.created_at) AS position_in_queue,
        ROUND(TIMESTAMPDIFF(MINUTE, created_at, NOW()), 1) AS wait_time_min
       FROM tickets t
       WHERE service_id=? AND status='waiting' AND DATE(created_at)=CURDATE()
       ORDER BY
         CASE customer_type
           WHEN 'urgent' THEN 0
           WHEN 'vip' THEN 1
           WHEN 'disabled' THEN 2
           WHEN 'senior' THEN 3
           ELSE 4
         END,
         CASE WHEN TIMESTAMPDIFF(MINUTE, created_at, NOW()) > 15 THEN 0 ELSE 1 END,
         created_at ASC`,
      [serviceId, serviceId, serviceId]
    );

    // Tickets en cours
    const [serving] = await db.query(
      `SELECT 
        t.id, t.number, t.user_name, t.counter,
        u.name AS agent_name,
        ROUND(TIMESTAMPDIFF(MINUTE, t.serving_at || t.called_at, NOW()), 0) AS time_at_counter_min,
        t.status
       FROM tickets t
       LEFT JOIN users u ON t.assigned_agent_id = u.id
       WHERE t.service_id=? AND t.status IN ('called', 'serving') 
       AND DATE(t.created_at)=CURDATE()
       ORDER BY t.called_at ASC`,
      [serviceId]
    );

    // Agents et leur charge
    const [agents] = await db.query(
      `SELECT 
        aa.agent_id, u.name,
        aa.status,
        (SELECT COUNT(*) FROM tickets 
         WHERE assigned_agent_id=aa.agent_id AND status IN ('called', 'serving')) AS current_tickets,
        aa.tickets_handled
       FROM agent_assignments aa
       JOIN users u ON aa.agent_id = u.id
       WHERE aa.service_id=?
       ORDER BY aa.status, current_tickets ASC`,
      [serviceId]
    );

    res.json({
      success: true,
      data: {
        service: { id: service.id, name: service.name, max_counters: service.max_counters },
        waiting: waiting,
        serving: serving,
        agents: agents,
        summary: {
          total_waiting: waiting.length,
          total_serving: serving.length,
          agents_available: agents.filter(a => a.status === 'available').length,
          avg_wait_min: Math.ceil(
            waiting.reduce((sum, t) => sum + t.wait_time_min, 0) / Math.max(1, waiting.length)
          ),
        },
      },
    });
  } catch (e) {
    next(e);
  }
};

// ============ CRÉER TICKET AVEC PRIORITÉS ============

exports.createTicketAdvanced = async (req, res, next) => {
  try {
    const { 
      service_id, 
      user_name, 
      phone, 
      email, 
      customer_type = "regular",
      visit_purpose,
      is_emergency = false 
    } = req.body;

    const [[service]] = await db.query(
      "SELECT * FROM services WHERE id=? AND active=1",
      [service_id]
    );
    if (!service) return res.status(404).json({ error: "Service inexistant" });

    // Générer number
    const [[count]] = await db.query(
      `SELECT COUNT(*) as c FROM tickets 
       WHERE service_id=? AND DATE(created_at)=CURDATE()`,
      [service_id]
    );
    const number = `${service.prefix}-${String(count.c + 1).padStart(3, "0")}`;

    // Déterminer priorité
    let priority = 0;
    if (is_emergency) priority = 1000;
    else if (customer_type === "urgent") priority = 100;
    else if (customer_type === "vip") priority = 50;
    else if (customer_type === "disabled") priority = 25;
    else if (customer_type === "senior") priority = 15;

    // Insérer ticket
    const [result] = await db.query(
      `INSERT INTO tickets 
       (number, service_id, user_name, phone, email, customer_type, visit_purpose, priority, is_emergency)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [number, service_id, user_name, phone||null, email||null, customer_type, visit_purpose, priority, is_emergency]
    );

    // Estimer temps d'attente
    const [[estimate]] = await db.query(
      `SELECT COUNT(*) as waiting FROM tickets 
       WHERE service_id=? AND status='waiting'`,
      [service_id]
    );

    const peopleAhead = Math.max(0, estimate.waiting - 1);
    const ticket = {
      id: result.insertId,
      number,
      service_id,
      user_name,
      status: "waiting",
      customer_type,
      priority,
      estimated_wait: peopleAhead * service.avg_duration,
    };

    req.app.get("io").to(`queue_${service_id}`).emit("ticket:created", ticket);
    req.app.get("io").to("admin").emit("ticket:created", ticket);

    res.status(201).json({ success: true, data: ticket });
  } catch (e) {
    next(e);
  }
};

// ============ STATISTIQUES TEMPS RÉEL ============

exports.getQueueAnalytics = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const { days = 7 } = req.query;

    // Tendance
    const [trends] = await db.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_tickets,
        SUM(status='done') as completed,
        SUM(status='absent') as no_shows,
        ROUND(AVG(TIMESTAMPDIFF(MINUTE, created_at, called_at)), 1) as avg_wait_min,
        ROUND(AVG(TIMESTAMPDIFF(MINUTE, serving_at, done_at)), 1) as avg_handling_min,
        ROUND(AVG(satisfaction_score), 2) as avg_satisfaction
       FROM tickets
       WHERE service_id=? AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [serviceId, days]
    );

    // Types clients
    const [byType] = await db.query(
      `SELECT 
        customer_type,
        COUNT(*) as count,
        SUM(status='done') as completed,
        ROUND(AVG(TIMESTAMPDIFF(MINUTE, created_at, called_at)), 1) as avg_wait_min
       FROM tickets
       WHERE service_id=? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
       GROUP BY customer_type`,
      [serviceId]
    );

    // Performance agents
    const [agents] = await db.query(
      `SELECT 
        u.id,
        u.name,
        COUNT(t.id) as tickets_handled,
        ROUND(AVG(TIMESTAMPDIFF(MINUTE, t.serving_at, t.done_at)), 1) as avg_handling_min,
        ROUND(AVG(t.satisfaction_score), 2) as avg_satisfaction
       FROM agent_assignments aa
       JOIN users u ON aa.agent_id = u.id
       LEFT JOIN tickets t ON t.assigned_agent_id = u.id 
         AND t.created_at >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
       WHERE aa.service_id=?
       GROUP BY u.id, u.name
       ORDER BY tickets_handled DESC`,
      [serviceId]
    );

    res.json({
      success: true,
      data: { trends, by_type: byType, top_agents: agents },
    });
  } catch (e) {
    next(e);
  }
};

module.exports = exports;
