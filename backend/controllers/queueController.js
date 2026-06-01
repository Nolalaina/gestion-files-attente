const db = require("../config/db");
const { logActivity } = require("../utils/logger");

const pad = (n) => String(n).padStart(3, "0");

// ============ HELPERS ============

const getNextNumber = async (serviceId, prefix) => {
  const [[r]] = await db.query(
    `SELECT COUNT(*) AS count 
     FROM tickets 
     WHERE service_id=? AND DATE(created_at)=CURDATE()`,
    [serviceId]
  );
  const nextVal = (r.count || 0) + 1;
  return `${prefix}-${pad(nextVal)}`;
};

const changeTicketStatus = (newStatus, fromStatuses, event) => async (req, res, next) => {
  try {
    const { id } = req.params;
    const inList = fromStatuses.map(() => "?").join(",");
    const params = [newStatus];
    
    let sql = "UPDATE tickets SET status=?";
    if (newStatus === "called") {
      sql += ", counter=?, called_at=NOW(), assigned_agent_id=?";
      params.push(req.body.counter || 1, req.user ? req.user.id : null);
    } else if (newStatus === "serving") {
      sql += ", serving_at=NOW()";
    } else if (newStatus === "done") {
      sql += ", done_at=NOW()";
    } else if (newStatus === "absent") {
      sql += ", done_at=NOW(), no_show_reason=?";
      params.push(req.body.reason || "Client non présent");
    }
    
    sql += ` WHERE id=? AND status IN (${inList})`;
    params.push(id, ...fromStatuses);

    const [upd] = await db.query(sql, params);
    if (upd.affectedRows === 0) return res.status(400).json({ error: "Transition invalide" });

    const [[t]] = await db.query("SELECT t.*, s.prefix FROM tickets t JOIN services s ON t.service_id = s.id WHERE t.id=?", [id]);

    await logActivity({
      userId: req.user ? req.user.id : null,
      action: `TICKET_${newStatus.toUpperCase()}`,
      entityType: "ticket",
      entityId: id,
      req,
      description: `Ticket ${t.number} passé à l'état ${newStatus}`
    });

    const io = req.app.get("io");
    if (io) {
      io.to(`queue_${t.service_id}`).emit(event, t);
      io.to("admin").emit(event, t);
    }

    res.json({ success: true, data: t });
  } catch (e) { next(e); }
};

// ============ CONTROLLERS ============

exports.getAll = async (req, res, next) => {
  try {
    const { status, service_id, date, search } = req.query;
    let sql = "SELECT t.*, s.name AS service_name, s.prefix FROM tickets t JOIN services s ON t.service_id=s.id WHERE 1=1";
    const p = [];
    if (status) { sql += " AND t.status=?"; p.push(status); }
    if (service_id) { sql += " AND t.service_id=?"; p.push(service_id); }
    if (date) { sql += " AND DATE(t.created_at)=?"; p.push(date); }
    else { sql += " AND DATE(t.created_at)=CURDATE()"; }
    if (search) {
      sql += " AND (t.user_name LIKE ? OR t.number LIKE ? OR t.phone LIKE ?)";
      const term = `%${search}%`;
      p.push(term, term, term);
    }
    sql += " ORDER BY t.priority DESC, t.created_at ASC";
    const [rows] = await db.query(sql, p);
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
};

exports.getOne = async (req, res, next) => {
  try {
    const [[t]] = await db.query("SELECT t.*, s.name AS service_name FROM tickets t JOIN services s ON t.service_id=s.id WHERE t.id=?", [req.params.id]);
    if (!t) return res.status(404).json({ error: "Ticket introuvable" });
    res.json({ success: true, data: t });
  } catch (e) { next(e); }
};

exports.getNextSuggestion = async (req, res, next) => {
  try {
    const { service_id } = req.query;
    const [rows] = await db.query(
      "SELECT id, number, user_name, priority FROM tickets WHERE service_id=? AND status='waiting' AND DATE(created_at)=CURDATE() ORDER BY priority DESC, created_at ASC LIMIT 1",
      [service_id]
    );
    res.json({ success: true, data: rows[0] || null });
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const { service_id, user_name, phone, email, customer_type = "regular", visit_purpose, is_emergency = false } = req.body;
    const [[svc]] = await db.query("SELECT * FROM services WHERE id=? AND active=1", [service_id || req.params.serviceId]);
    if (!svc) return res.status(404).json({ error: "Service introuvable" });

    let priority = 0;
    if (is_emergency) priority = 1000;
    else if (customer_type === "urgent") priority = 100;
    else if (customer_type === "vip") priority = 50;
    else if (customer_type === "disabled") priority = 25;
    else if (customer_type === "senior") priority = 15;

    const number = await getNextNumber(svc.id, svc.prefix);
    const [r] = await db.query(
      "INSERT INTO tickets (number,service_id,user_name,phone,email,priority,customer_type,visit_purpose,is_emergency) VALUES (?,?,?,?,?,?,?,?,?)",
      [number, svc.id, user_name, phone || null, email || null, priority, customer_type, visit_purpose || null, is_emergency ? 1 : 0]
    );

    const ticket = { id: r.insertId, number, service_id: svc.id, user_name, status: "waiting", priority };
    const io = req.app.get("io");
    if (io) io.to(`queue_${svc.id}`).emit("ticket:created", ticket);

    res.status(201).json({ success: true, data: ticket });
  } catch (e) { next(e); }
};

exports.createTicketAdvanced = exports.create;

exports.call     = changeTicketStatus("called",    ["waiting"],          "ticket:called");
exports.serve    = changeTicketStatus("serving",   ["called"],           "ticket:serving");
exports.complete = changeTicketStatus("done",      ["called","serving"], "ticket:done");
exports.absent   = changeTicketStatus("absent",    ["called"],           "ticket:absent");
exports.handleNoShow = exports.absent;

exports.reassign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { new_service_id } = req.body;
    await db.query("UPDATE tickets SET service_id=?, status='waiting', assigned_agent_id=NULL WHERE id=?", [new_service_id, id]);
    const [[t]] = await db.query("SELECT * FROM tickets WHERE id=?", [id]);
    res.json({ success: true, data: t });
  } catch (e) { next(e); }
};

exports.cancel = async (req, res, next) => {
  try {
    await db.query("UPDATE tickets SET status='cancelled' WHERE id=? AND status IN ('waiting','called')", [req.params.id]);
    res.json({ success: true });
  } catch (e) { next(e); }
};

exports.assignNextTicket = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const [rows] = await db.query(
      "SELECT id FROM tickets WHERE service_id=? AND status='waiting' AND DATE(created_at)=CURDATE() ORDER BY priority DESC, created_at ASC LIMIT 1",
      [serviceId]
    );
    if (!rows[0]) return res.json({ success: false, message: "No tickets in queue" });
    
    req.params.id = rows[0].id;
    return exports.call(req, res, next);
  } catch (e) { next(e); }
};

exports.estimateWaitTime = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const [[svc]] = await db.query("SELECT avg_duration FROM services WHERE id=?", [serviceId]);
    const [[wt]] = await db.query("SELECT COUNT(*) as c FROM tickets WHERE service_id=? AND status='waiting'", [serviceId]);
    const [[ag]] = await db.query("SELECT COUNT(*) as c FROM agent_assignments WHERE service_id=? AND status='available'", [serviceId]);
    const est = Math.ceil((wt.c * (svc?.avg_duration || 10)) / (ag.c || 1));
    res.json({ success: true, data: { estimated_wait_min: est, people_ahead: wt.c } });
  } catch (e) { next(e); }
};

exports.getQueueStatus = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const [waiting] = await db.query("SELECT * FROM tickets WHERE service_id=? AND status='waiting'", [serviceId]);
    const [serving] = await db.query("SELECT t.*, u.name as agent_name FROM tickets t LEFT JOIN users u ON t.assigned_agent_id=u.id WHERE t.service_id=? AND t.status IN ('called','serving')", [serviceId]);
    res.json({ success: true, data: { waiting, serving } });
  } catch (e) { next(e); }
};

exports.submitFeedback = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    await db.query("INSERT INTO customer_feedback (ticket_id, rating, comment) VALUES (?,?,?)", [req.params.ticketId, rating, comment]);
    res.json({ success: true });
  } catch (e) { next(e); }
};

exports.getQueueAnalytics = async (req, res, next) => {
  try {
    const [stats] = await db.query("SELECT DATE(created_at) as date, COUNT(*) as count FROM tickets WHERE service_id=? GROUP BY DATE(created_at) LIMIT 7", [req.params.serviceId]);
    res.json({ success: true, data: stats });
  } catch (e) { next(e); }
};
