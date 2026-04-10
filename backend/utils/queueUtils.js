const db = require("../config/db");

// ============ UTILITAIRES GESTION QUEUES AVANCÉES ============

/**
 * Calcule temps d'attente estimé basé sur historique
 */
exports.calculateEstimatedWaitTime = async (serviceId, currentQueueLength) => {
  try {
    // Récupérer moyenne historique (derniers 7 jours)
    const [[historics]] = await db.query(
      `SELECT 
        ROUND(AVG(TIMESTAMPDIFF(MINUTE, created_at, called_at)), 1) as avg_wait,
        ROUND(STDDEV(TIMESTAMPDIFF(MINUTE, created_at, called_at)), 1) as stddev
       FROM tickets
       WHERE service_id=? AND status='done' 
       AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
      [serviceId]
    );

    // Récupérer agents actifs
    const [[agents]] = await db.query(
      `SELECT COUNT(*) as active 
       FROM agent_assignments 
       WHERE service_id=? AND status IN ('available', 'busy')`,
      [serviceId]
    );

    const baseTime = historics?.avg_wait || 5;
    const activeAgents = Math.max(1, agents?.active || 1);
    const timePerPerson = baseTime;
    
    // Formule: (queue length / agents) * average time
    const estimated = Math.ceil((currentQueueLength / activeAgents) * timePerPerson);
    
    return {
      estimated_minutes: Math.max(1, estimated),
      confidence: historics?.stddev ? (100 - Math.min(50, historics.stddev)) : 80,
    };
  } catch (error) {
    // Production logging
    return { estimated_minutes: 5, confidence: 50 };
  }
};

/**
 * Obtient la position dans la queue d'un ticket
 */
exports.getTicketPosition = async (ticketId) => {
  try {
    const [[ticket]] = await db.query(
      "SELECT service_id, customer_type, created_at FROM tickets WHERE id=?",
      [ticketId]
    );

    if (!ticket) return null;

    // Compter tickets prioritaires avant celui-ci
    const [[position]] = await db.query(
      `SELECT COUNT(*) + 1 as position
       FROM tickets t
       WHERE t.service_id = ? 
       AND t.status = 'waiting'
       AND DATE(t.created_at) = CURDATE()
       AND (
         CASE 
           WHEN t.customer_type = 'urgent' THEN 0
           WHEN ? = 'urgent' THEN 1
           WHEN t.customer_type = 'vip' THEN 1
           WHEN ? = 'vip' THEN 2
           WHEN t.customer_type = 'disabled' THEN 2
           WHEN ? = 'disabled' THEN 3
           WHEN t.customer_type = 'senior' THEN 3
           ELSE 4
         END
       ) <= (
         CASE
           WHEN ? = 'urgent' THEN 0
           WHEN ? = 'vip' THEN 1
           WHEN ? = 'disabled' THEN 2
           WHEN ? = 'senior' THEN 3
           ELSE 4
         END
       )
       AND t.created_at < ?`,
      [
        ticket.service_id, 
        ticket.customer_type, ticket.customer_type, ticket.customer_type,
        ticket.customer_type, ticket.customer_type, ticket.customer_type, ticket.customer_type,
        ticket.created_at
      ]
    );

    return position?.position || 1;
  } catch (error) {
    // Production logging
    return 1;
  }
};

/**
 * Balancer charge entre agents
 */
exports.balanceAgentLoad = async (serviceId) => {
  try {
    // Agents avec leur charge
    const [agents] = await db.query(
      `SELECT 
        aa.agent_id,
        COUNT(t.id) as current_load
       FROM agent_assignments aa
       LEFT JOIN tickets t ON t.assigned_agent_id = aa.agent_id 
         AND t.status IN ('called', 'serving')
       WHERE aa.service_id=? AND aa.status IN ('available', 'busy')
       GROUP BY aa.agent_id
       ORDER BY current_load ASC`,
      [serviceId]
    );

    if (agents.length < 2) return null;

    const loads = agents.map(a => a.current_load);
    const avgLoad = Math.ceil(loads.reduce((a, b) => a + b) / loads.length);
    const overloadedAgents = agents.filter(a => a.current_load > avgLoad + 2);
    const underloadedAgents = agents.filter(a => a.current_load < avgLoad - 1);

    if (overloadedAgents.length === 0 || underloadedAgents.length === 0) {
      return null; // Pas de rééquilibrage nécessaire
    }

    // Réassigner tickets des agents surchargés
    const reassignments = [];
    for (const overloaded of overloadedAgents) {
      const [excessTickets] = await db.query(
        `SELECT id FROM tickets 
         WHERE assigned_agent_id=? AND status IN ('called', 'serving')
         LIMIT 1`,
        [overloaded.agent_id]
      );

      for (const ticket of excessTickets) {
        const underloaded = underloadedAgents[0];
        await db.query(
          `UPDATE tickets SET assigned_agent_id=? WHERE id=?`,
          [underloaded.agent_id, ticket.id]
        );

        await db.query(
          `INSERT INTO ticket_reassignments (ticket_id, from_agent_id, to_agent_id, reason)
           VALUES (?, ?, ?, 'load_balancing')`,
          [ticket.id, overloaded.agent_id, underloaded.agent_id]
        );

        reassignments.push({
          ticket_id: ticket.id,
          from: overloaded.agent_id,
          to: underloaded.agent_id,
        });
      }
    }

    return reassignments;
  } catch (error) {
    // Production logging
    return null;
  }
};

/**
 * Déterminer type client (VIP, senior, etc)
 */
exports.determineCustomerType = (age, isHandicapped, isVip, isUrgent) => {
  if (isUrgent) return "urgent";
  if (isVip) return "vip";
  if (isHandicapped) return "disabled";
  if (age >= 60) return "senior";
  return "regular";
};

/**
 * Calcule score KPI service
 */
exports.calculateServiceKPI = async (serviceId, days = 1) => {
  try {
    const [[stats]] = await db.query(
      `SELECT
        COUNT(*) as total_tickets,
        SUM(status='done') as completed,
        SUM(status='absent') as no_shows,
        SUM(status='cancelled') as cancelled,
        ROUND(AVG(TIMESTAMPDIFF(MINUTE, created_at, called_at)), 1) as avg_wait_min,
        ROUND(MAX(TIMESTAMPDIFF(MINUTE, created_at, called_at)), 1) as max_wait_min,
        ROUND(AVG(TIMESTAMPDIFF(MINUTE, serving_at, done_at)), 1) as avg_handling_min,
        ROUND(AVG(satisfaction_score), 2) as satisfaction,
        ROUND(SUM(status='done') / COUNT(*) * 100, 1) as completion_rate
       FROM tickets
       WHERE service_id=? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [serviceId, days]
    );

    // Calculer score global (0-100)
    const completionScore = stats.completion_rate || 0;
    const waitScore = Math.max(0, 100 - (stats.avg_wait_min || 0) * 2);
    const satisfactionScore = (stats.satisfaction || 0) * 20;
    const globalScore = Math.round((completionScore * 0.4 + waitScore * 0.3 + satisfactionScore * 0.3) / 10);

    return {
      ...stats,
      kpi_score: Math.min(100, Math.max(0, globalScore)),
      performance_grade: globalScore >= 80 ? 'A' : globalScore >= 60 ? 'B' : globalScore >= 40 ? 'C' : 'D',
    };
  } catch (error) {
    // Production logging
    return null;
  }
};

/**
 * Détect tickets qui devraient être rappelés
 */
exports.detectAbandonedTickets = async (minutesThreshold = 30) => {
  try {
    const [tickets] = await db.query(
      `SELECT id, number, service_id, user_name, phone, email
       FROM tickets
       WHERE status='called' 
       AND called_at < DATE_SUB(NOW(), INTERVAL ? MINUTE)
       AND served_at IS NULL`,
      [minutesThreshold]
    );

    return tickets;
  } catch (error) {
    // Production logging
    return [];
  }
};

/**
 * Recommander le meilleur service pour une visite
 */
exports.recommendService = async (visitPurpose) => {
  try {
    const keywords = {
      caisse: ['paiement', 'virement', 'retrait', 'dépôt espèces', 'chèque'],
      renseignement: ['info', 'conseil', 'question', 'orientation', 'compte'],
      document: ['dossier', 'document', 'attestation', 'relevé'],
      juridique: ['légal', 'contrat', 'procuration', 'succession'],
    };

    const purpose = visitPurpose.toLowerCase();
    const scores = {
      caisse: 0,
      renseignement: 0,
      document: 0,
      juridique: 0,
    };

    Object.entries(keywords).forEach(([service, kws]) => {
      kws.forEach(kw => {
        if (purpose.includes(kw)) scores[service] += 2;
      });
    });

    const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    return best[1] > 0 ? best[0] : 'caisse'; // Défaut: caisse
  } catch (error) {
    // Production logging
    return 'caisse';
  }
};

/**
 * Export rapport queue par jour
 */
exports.generateDailyReport = async (serviceId, date) => {
  try {
    const [[report]] = await db.query(
      `SELECT
        DATE(created_at) as date,
        s.name as service,
        COUNT(*) as total,
        SUM(status='done') as completed,
        SUM(status='absent') as no_shows,
        SUM(status='cancelled') as cancelled,
        ROUND(AVG(TIMESTAMPDIFF(MINUTE, created_at, called_at)), 1) as avg_wait,
        MAX(TIMESTAMPDIFF(MINUTE, created_at, called_at)) as max_wait,
        ROUND(AVG(TIMESTAMPDIFF(MINUTE, serving_at, done_at)), 1) as avg_handling,
        ROUND(AVG(satisfaction_score), 2) as satisfaction
       FROM tickets t
       JOIN services s ON t.service_id = s.id
       WHERE t.service_id=? AND DATE(t.created_at)=?
       GROUP BY DATE(created_at), s.id`,
      [serviceId, date]
    );

    if (!report) return null;

    // Détails par heure
    const [hourly] = await db.query(
      `SELECT
        HOUR(created_at) as hour,
        COUNT(*) as tickets,
        ROUND(AVG(TIMESTAMPDIFF(MINUTE, created_at, called_at)), 1) as avg_wait
       FROM tickets
       WHERE service_id=? AND DATE(created_at)=?
       GROUP BY HOUR(created_at)
       ORDER BY hour`,
      [serviceId, date]
    );

    return { report, hourly_breakdown: hourly };
  } catch (error) {
    // Production logging
    return null;
  }
};

module.exports = exports;
