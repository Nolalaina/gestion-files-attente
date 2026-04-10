const db = require("../config/db");
const { logActivity } = require("../utils/logger");
const pad = (n) => String(n).padStart(3, "0");

const nextNumber = async (serviceId, prefix) => {
  const [[r]] = await db.query(
    "SELECT COUNT(*) AS c FROM tickets WHERE service_id=? AND DATE(created_at)=CURDATE()",
    [serviceId]);
  return `${prefix}-${pad(r.c + 1)}`;
};

exports.getAll = async (req, res, next) => {
  try {
    const { status, service_id, date, search, time_from, time_to, min_wait } = req.query;
    let sql = "SELECT t.*, s.name AS service_name, s.prefix FROM tickets t JOIN services s ON t.service_id=s.id WHERE 1=1";
    const p = [];

    if (status)     { sql += " AND t.status=?";            p.push(status); }
    if (service_id) { sql += " AND t.service_id=?";        p.push(service_id); }
    if (date)       { sql += " AND DATE(t.created_at)=?";  p.push(date); }
    else             { sql += " AND DATE(t.created_at)=CURDATE()"; }

    if (search) {
      sql += " AND (t.user_name LIKE ? OR t.number LIKE ? OR t.phone LIKE ?)";
      const term = `%${search}%`;
      p.push(term, term, term);
    }

    if (time_from) { sql += " AND TIME(t.created_at) >= ?"; p.push(time_from); }
    if (time_to)   { sql += " AND TIME(t.created_at) <= ?"; p.push(time_to); }

    if (min_wait) {
      // Tickets dont l'attente dépasse X minutes (created_at vs called_at ou NOW() si waiting)
      sql += " AND (CASE WHEN t.called_at IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, t.created_at, t.called_at) ELSE TIMESTAMPDIFF(MINUTE, t.created_at, NOW()) END) >= ?";
      p.push(min_wait);
    }

    sql += " ORDER BY t.priority DESC, t.created_at ASC LIMIT 300";
    const [rows] = await db.query(sql, p);
    res.json({ success: true, data: rows, total: rows.length });
  } catch (e) { next(e); }
};

exports.getOne = async (req, res, next) => {
  try {
    const [[t]] = await db.query(
      "SELECT t.*, s.name AS service_name FROM tickets t JOIN services s ON t.service_id=s.id WHERE t.id=?",
      [req.params.id]);
    if (!t) return res.status(404).json({ error: "Ticket introuvable" });
    res.json({ success: true, data: t });
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const { service_id, user_name, phone, email, priority = 0 } = req.body;
    const [[svc]] = await db.query("SELECT * FROM services WHERE id=? AND active=1", [service_id]);
    if (!svc) return res.status(404).json({ error: "Service introuvable ou inactif" });
    const number = await nextNumber(service_id, svc.prefix);
    const [r] = await db.query(
      "INSERT INTO tickets (number,service_id,user_name,phone,email,priority) VALUES (?,?,?,?,?,?)",
      [number, service_id, user_name, phone||null, email||null, priority]);
    const [[{waiting}]] = await db.query(
      "SELECT COUNT(*) AS waiting FROM tickets WHERE service_id=? AND status='waiting'", [service_id]);
    const ticket = { id: r.insertId, number, service_id, user_name, status: "waiting",
      priority, estimated_wait: waiting * svc.avg_duration };
    
    // Log creation
    await logActivity({
      action: "TICKET_CREATED",
      entityType: "ticket",
      entityId: r.insertId,
      req,
      description: `Nouveau ticket ${number} pour ${user_name}`
    });

    req.app.get("io").to(`queue_${service_id}`).emit("ticket:created", ticket);
    req.app.get("io").to("admin").emit("ticket:created", ticket);
    res.status(201).json({ success: true, data: ticket });
  } catch (e) { next(e); }
};

exports.reassign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { new_service_id } = req.body;

    const [[ticket]] = await db.query("SELECT * FROM tickets WHERE id=?", [id]);
    if (!ticket) return res.status(404).json({ error: "Ticket introuvable" });

    const [[newSvc]] = await db.query("SELECT * FROM services WHERE id=?", [new_service_id]);
    if (!newSvc) return res.status(404).json({ error: "Service destination introuvable" });

    await db.query("UPDATE tickets SET service_id=?, status='waiting', assigned_agent_id=NULL WHERE id=?", [new_service_id, id]);
    const [[updated]] = await db.query("SELECT * FROM tickets WHERE id=?", [id]);

    await logActivity({
      userId: req.user ? req.user.id : null,
      action: "TICKET_REASSIGNED",
      entityType: "ticket",
      entityId: id,
      req,
      description: `Ticket ${ticket.number} réaffecté du service #${ticket.service_id} au service #${new_service_id}`
    });

    req.app.get("io").to(`queue_${ticket.service_id}`).emit("ticket:removed", id);
    req.app.get("io").to(`queue_${new_service_id}`).emit("ticket:created", updated);
    req.app.get("io").to("admin").emit("ticket:updated", updated);

    res.json({ success: true, data: updated });
  } catch (e) { next(e); }
};

const changeStatus = (newStatus, fromStatuses, event) => async (req, res, next) => {
  try {
    const { id } = req.params;
    const inList = fromStatuses.map(()=>"?").join(",");
    const [upd] = await db.query(
      `UPDATE tickets SET status=?${newStatus==="called"?", counter=?, called_at=NOW()":""}${newStatus==="serving"?", serving_at=NOW()":""}${newStatus==="done"?", done_at=NOW()":""} WHERE id=? AND status IN (${inList})`,
      newStatus==="called"
        ? [newStatus, req.body.counter||1, id, ...fromStatuses]
        : [newStatus, id, ...fromStatuses]);
    if (upd.affectedRows===0) return res.status(400).json({ error: "Transition invalide" });
    const [[t]] = await db.query("SELECT * FROM tickets WHERE id=?", [id]);

    // Log status change
    await logActivity({
      userId: req.user ? req.user.id : null,
      action: `TICKET_${newStatus.toUpperCase()}`,
      entityType: "ticket",
      entityId: id,
      req,
      description: `Ticket ${t.number} passé à l'état ${newStatus}`
    });

    req.app.get("io").to(`queue_${t.service_id}`).emit(event, t);
    req.app.get("io").to("admin").emit(event, t);
    res.json({ success: true, data: t });
  } catch (e) { next(e); }
};

exports.call     = changeStatus("called",    ["waiting"],          "ticket:called");
exports.serve    = changeStatus("serving",   ["called"],           "ticket:serving");
exports.complete = changeStatus("done",      ["called","serving"], "ticket:done");
exports.absent   = changeStatus("absent",    ["called"],           "ticket:absent");

exports.cancel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [upd] = await db.query("UPDATE tickets SET status='cancelled' WHERE id=? AND status IN ('waiting','called')", [id]);
    if (upd.affectedRows > 0) {
      await logActivity({
        userId: req.user ? req.user.id : null,
        action: "TICKET_CANCELLED",
        entityType: "ticket",
        entityId: id,
        req,
        description: `Ticket #${id} annulé`
      });
    }
    res.json({ success: true });
  } catch (e) { next(e); }
};

