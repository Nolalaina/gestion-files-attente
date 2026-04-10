const pool = require('../config/db');

// ============= TABLEAUX DE BORD ADMIN =============

exports.getDashboard = async (req, res) => {
  try {
    // Statistiques globales
    const [[totalUsers]] = await pool.query(`SELECT COUNT(*) as count FROM users`);
    
    // Try bank tables, fallback to 0 if they don't exist
    let totalAccounts = { count: 0 };
    let totalTransactions = { count: 0 };
    let totalBalance = { total: 0 };
    let recentTransactions = [];
    
    try {
      [[totalAccounts]] = await pool.query(`SELECT COUNT(*) as count FROM bank_accounts`);
      [[totalTransactions]] = await pool.query(`SELECT COUNT(*) as count FROM bank_transactions WHERE status = 'COMPLETED'`);
      [[totalBalance]] = await pool.query(`SELECT COALESCE(SUM(balance), 0) as total FROM bank_accounts`);
      [recentTransactions] = await pool.query(`
        SELECT bt.*, 
               ba1.account_number as from_account_number,
               ba2.account_number as to_account_number
        FROM bank_transactions bt
        LEFT JOIN bank_accounts ba1 ON bt.from_account_id = ba1.id
        LEFT JOIN bank_accounts ba2 ON bt.to_account_id = ba2.id
        ORDER BY bt.created_at DESC
        LIMIT 10
      `);
    } catch (e) {
      // Bank tables may not exist yet
    }

    // Utilisateurs par rôle (compatible avec le schéma de base qui utilise ENUM role)
    const [usersByRole] = await pool.query(`
      SELECT role as code, role as name, COUNT(*) as count
      FROM users
      GROUP BY role
    `);

    res.json({
      statistics: {
        total_users: totalUsers.count,
        total_accounts: totalAccounts.count,
        total_transactions: totalTransactions.count,
        total_balance: parseFloat(totalBalance.total || 0),
      },
      recent_transactions: recentTransactions,
      users_by_role: usersByRole,
    });
  } catch (error) {
    console.error('Erreur dashboard:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ============= TABLEAUX: UTILISATEURS =============

exports.getUsersTable = async (req, res) => {
  try {
    const { limit = 50, offset = 0, role = null, status = null, search = null } = req.query;

    let query = `
      SELECT u.id, u.name, u.email, u.phone,
             u.role, u.active, u.created_at,
             (SELECT COUNT(*) FROM tickets WHERE user_name = u.name AND DATE(created_at)=CURDATE()) as ticket_count
      FROM users u
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      query += ` AND u.role = ?`;
      params.push(role);
    }

    if (status !== null) {
      query += ` AND u.active = ?`;
      params.push(status === 'active' ? 1 : 0);
    }

    if (search) {
      query += ` AND (u.name LIKE ? OR u.email LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [users] = await pool.query(query, params);

    // Total pour pagination
    let countQuery = `SELECT COUNT(*) as total FROM users u WHERE 1=1`;
    const countParams = [];

    if (role) {
      countQuery += ` AND u.role = ?`;
      countParams.push(role);
    }
    if (status !== null) {
      countQuery += ` AND u.active = ?`;
      countParams.push(status === 'active' ? 1 : 0);
    }
    if (search) {
      countQuery += ` AND (u.name LIKE ? OR u.email LIKE ?)`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
    }

    const [[{ total }]] = await pool.query(countQuery, countParams);

    res.json({
      data: users,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Erreur tableau utilisateurs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ============= TABLEAUX: COMPTES BANCAIRES =============

exports.getAccountsTable = async (req, res) => {
  try {
    const { limit = 50, offset = 0, status = null, type = null, search = null } = req.query;

    let query = `
      SELECT ba.id, ba.account_number, ba.account_type, ba.balance, 
             ba.currency, ba.status, ba.created_at,
             u.name as owner_name, u.email, u.phone
      FROM bank_accounts ba
      LEFT JOIN users u ON ba.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND ba.status = ?`;
      params.push(status);
    }
    if (type) {
      query += ` AND ba.account_type = ?`;
      params.push(type);
    }
    if (search) {
      query += ` AND (ba.account_number LIKE ? OR u.email LIKE ? OR u.name LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ` ORDER BY ba.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [accounts] = await pool.query(query, params);

    let countQuery = `SELECT COUNT(*) as total FROM bank_accounts ba LEFT JOIN users u ON ba.user_id = u.id WHERE 1=1`;
    const countParams = [];
    if (status) { countQuery += ` AND ba.status = ?`; countParams.push(status); }
    if (type) { countQuery += ` AND ba.account_type = ?`; countParams.push(type); }
    if (search) {
      countQuery += ` AND (ba.account_number LIKE ? OR u.email LIKE ? OR u.name LIKE ?)`;
      const s = `%${search}%`;
      countParams.push(s, s, s);
    }

    const [[{ total }]] = await pool.query(countQuery, countParams);

    res.json({
      data: accounts,
      pagination: { total, limit: parseInt(limit), offset: parseInt(offset), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    console.error('Erreur tableau comptes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ============= TABLEAUX: TRANSACTIONS =============

exports.getTransactionsTable = async (req, res) => {
  try {
    const { limit = 50, offset = 0, status = null, type = null, dateFrom = null, dateTo = null } = req.query;

    let query = `
      SELECT bt.*, 
             ba1.account_number as from_account_number,
             ba2.account_number as to_account_number,
             u1.name as from_user_name,
             u2.name as to_user_name
      FROM bank_transactions bt
      LEFT JOIN bank_accounts ba1 ON bt.from_account_id = ba1.id
      LEFT JOIN bank_accounts ba2 ON bt.to_account_id = ba2.id
      LEFT JOIN users u1 ON ba1.user_id = u1.id
      LEFT JOIN users u2 ON ba2.user_id = u2.id
      WHERE 1=1
    `;
    const params = [];

    if (status) { query += ` AND bt.status = ?`; params.push(status); }
    if (type) { query += ` AND bt.transaction_type = ?`; params.push(type); }
    if (dateFrom) { query += ` AND DATE(bt.created_at) >= ?`; params.push(dateFrom); }
    if (dateTo) { query += ` AND DATE(bt.created_at) <= ?`; params.push(dateTo); }

    query += ` ORDER BY bt.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [transactions] = await pool.query(query, params);

    let countQuery = `SELECT COUNT(*) as total FROM bank_transactions bt WHERE 1=1`;
    const countParams = [];
    if (status) { countQuery += ` AND bt.status = ?`; countParams.push(status); }
    if (type) { countQuery += ` AND bt.transaction_type = ?`; countParams.push(type); }
    if (dateFrom) { countQuery += ` AND DATE(bt.created_at) >= ?`; countParams.push(dateFrom); }
    if (dateTo) { countQuery += ` AND DATE(bt.created_at) <= ?`; countParams.push(dateTo); }

    const [[{ total }]] = await pool.query(countQuery, countParams);

    res.json({
      data: transactions,
      pagination: { total, limit: parseInt(limit), offset: parseInt(offset), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    console.error('Erreur tableau transactions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ============= TABLEAUX: LOGS D'ACTIVITÉ =============

exports.getActivityLogsTable = async (req, res) => {
  try {
    const { limit = 50, offset = 0, action = null, user_id = null, dateFrom = null, dateTo = null } = req.query;

    let query = `
      SELECT al.*, u.name as user_name
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (action) { query += ` AND al.action LIKE ?`; params.push(`%${action}%`); }
    if (user_id) { query += ` AND al.user_id = ?`; params.push(user_id); }
    if (dateFrom) { query += ` AND DATE(al.created_at) >= ?`; params.push(dateFrom); }
    if (dateTo) { query += ` AND DATE(al.created_at) <= ?`; params.push(dateTo); }

    query += ` ORDER BY al.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [logs] = await pool.query(query, params);

    let countQuery = `SELECT COUNT(*) as total FROM activity_logs al WHERE 1=1`;
    const countParams = [];
    if (action) { countQuery += ` AND al.action LIKE ?`; countParams.push(`%${action}%`); }
    if (user_id) { countQuery += ` AND al.user_id = ?`; countParams.push(user_id); }
    if (dateFrom) { countQuery += ` AND DATE(al.created_at) >= ?`; countParams.push(dateFrom); }
    if (dateTo) { countQuery += ` AND DATE(al.created_at) <= ?`; countParams.push(dateTo); }

    const [[{ total }]] = await pool.query(countQuery, countParams);

    res.json({
      data: logs,
      pagination: { total, limit: parseInt(limit), offset: parseInt(offset), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    console.error('Erreur tableau logs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ============= GESTION AGENTS (CRUD) =============

const bcrypt = require('bcryptjs');

exports.createAgent = async (req, res) => {
  try {
    const { name, email, password, role = 'agent', phone } = req.body;
    const hash = await bcrypt.hash(password, 10);
    
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password, role, phone, active, is_verified) 
       VALUES (?, ?, ?, ?, ?, 1, 1)`,
      [name, email, hash, role, phone || null]
    );

    res.status(201).json({ success: true, id: result.insertId, message: "Agent créé avec succès" });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Email déjà utilisé' });
    console.error('Erreur création agent:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.updateAgent = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, phone, role, active } = req.body;
    
    const [result] = await pool.query(
      `UPDATE users SET name=?, email=?, phone=?, role=?, active=? WHERE id=?`,
      [name, email, phone, role, active, userId]
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: 'Agent non trouvé' });
    res.json({ success: true, message: "Agent mis à jour" });
  } catch (error) {
    console.error('Erreur mise à jour agent:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.resetAgentPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    
    await pool.query(`UPDATE users SET password=? WHERE id=?`, [hash, userId]);
    res.json({ success: true, message: "Mot de passe réinitialisé" });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

exports.deleteAgent = async (req, res) => {
  try {
    const { userId } = req.params;
    // On ne supprime pas vraiment, on désactive ou on vérifie s'il a des tickets
    const [[hasTickets]] = await pool.query(`SELECT COUNT(*) as count FROM tickets WHERE assigned_agent_id=?`, [userId]);
    
    if (hasTickets.count > 0) {
      await pool.query(`UPDATE users SET active=0 WHERE id=?`, [userId]);
      return res.json({ success: true, message: "Agent désactivé (historique conservé)" });
    }

    await pool.query(`DELETE FROM users WHERE id=?`, [userId]);
    res.json({ success: true, message: "Agent supprimé" });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ============= CONFIGURATION BANQUE & RESET =============

exports.updateBankConfig = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { max_counters, avg_duration, open_at, close_at } = req.body;
    
    await pool.query(
      `UPDATE services SET max_counters=?, avg_duration=?, open_at=?, close_at=? WHERE id=?`,
      [max_counters, avg_duration, open_at, close_at, serviceId]
    );

    res.json({ success: true, message: "Configuration mise à jour" });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

exports.resetBank = async (req, res) => {
  try {
    const { confirm } = req.body;
    if (confirm !== 'RESET_ALL') return res.status(400).json({ error: "Confirmation invalide" });

    // Purge des tickets et logs du jour (ou complet selon besoin)
    // Ici on vide tout pour simuler un "clean start"
    await pool.query(`DELETE FROM notifications`);
    await pool.query(`DELETE FROM ticket_reassignments`);
    await pool.query(`DELETE FROM customer_feedback`);
    await pool.query(`DELETE FROM tickets`);
    await pool.query(`DELETE FROM activity_logs`);
    
    // Réinitialiser les compteurs agents
    await pool.query(`UPDATE agent_assignments SET tickets_handled=0, cumulative_handling_time=0, status='available'`);

    res.json({ success: true, message: "Banque réinitialisée avec succès" });
  } catch (error) {
    console.error('Erreur reset bank:', error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
