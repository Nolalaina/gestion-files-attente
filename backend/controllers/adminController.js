const pool = require('../config/db');

// ============= TABLEAUX DE BORD ADMIN =============

exports.getDashboard = async (req, res) => {
  try {
    // Statistiques globales
    const [[totalUsers]] = await pool.query(`SELECT COUNT(*) as count FROM users`);
    const [[totalAccounts]] = await pool.query(`SELECT COUNT(*) as count FROM bank_accounts`);
    const [[totalTransactions]] = await pool.query(`SELECT COUNT(*) as count FROM bank_transactions WHERE status = 'COMPLETED'`);
    const [[totalBalance]] = await pool.query(`SELECT COALESCE(SUM(balance), 0) as total FROM bank_accounts`);

    // Transactions récentes
    const [recentTransactions] = await pool.query(`
      SELECT bt.*, 
             ba1.account_number as from_account_number,
             ba2.account_number as to_account_number
      FROM bank_transactions bt
      LEFT JOIN bank_accounts ba1 ON bt.from_account_id = ba1.id
      LEFT JOIN bank_accounts ba2 ON bt.to_account_id = ba2.id
      ORDER BY bt.created_at DESC
      LIMIT 10
    `);

    // Activité par rôle
    const [usersByRole] = await pool.query(`
      SELECT r.code, r.name, COUNT(u.id) as count
      FROM roles r
      LEFT JOIN users u ON r.id = u.role_id
      GROUP BY r.id
    `);

    res.json({
      statistics: {
        total_users: totalUsers.count,
        total_accounts: totalAccounts.count,
        total_transactions: totalTransactions.count,
        total_balance: parseFloat(totalBalance.total),
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
    const { limit = 50, offset = 0, role_id = null, status = null, search = null } = req.query;

    let query = `
      SELECT u.id, u.first_name, u.last_name, u.email, u.phone,
             r.name as role_name, r.code as role_code,
             u.status, u.created_at, u.last_login,
             (SELECT COUNT(*) FROM bank_accounts WHERE user_id = u.id) as account_count
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (role_id) {
      query += ` AND u.role_id = ?`;
      params.push(role_id);
    }

    if (status) {
      query += ` AND u.status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [users] = await pool.query(query, params);

    // Total pour pagination
    let countQuery = `SELECT COUNT(*) as total FROM users u WHERE 1=1`;
    const countParams = [];

    if (role_id) {
      countQuery += ` AND u.role_id = ?`;
      countParams.push(role_id);
    }
    if (status) {
      countQuery += ` AND u.status = ?`;
      countParams.push(status);
    }
    if (search) {
      countQuery += ` AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
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
      SELECT ba.id, ba.account_number, ba.account_type, ba.balance, ba.currency, ba.status, ba.created_at,
             CONCAT(u.first_name, ' ', u.last_name) as owner_name,
             u.email, u.phone,
             CONCAT(a.first_name, ' ', a.last_name) as agent_name
      FROM bank_accounts ba
      LEFT JOIN users u ON ba.user_id = u.id
      LEFT JOIN users a ON ba.agent_id = a.id
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
      query += ` AND (ba.account_number LIKE ? OR u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += ` ORDER BY ba.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [accounts] = await pool.query(query, params);

    // Total
    let countQuery = `SELECT COUNT(*) as total FROM bank_accounts ba LEFT JOIN users u ON ba.user_id = u.id WHERE 1=1`;
    const countParams = [];

    if (status) {
      countQuery += ` AND ba.status = ?`;
      countParams.push(status);
    }
    if (type) {
      countQuery += ` AND ba.account_type = ?`;
      countParams.push(type);
    }
    if (search) {
      countQuery += ` AND (ba.account_number LIKE ? OR u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const [[{ total }]] = await pool.query(countQuery, countParams);

    res.json({
      data: accounts,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(total / parseInt(limit)),
      },
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
             CONCAT(u1.first_name, ' ', u1.last_name) as from_user_name,
             CONCAT(u2.first_name, ' ', u2.last_name) as to_user_name
      FROM bank_transactions bt
      LEFT JOIN bank_accounts ba1 ON bt.from_account_id = ba1.id
      LEFT JOIN bank_accounts ba2 ON bt.to_account_id = ba2.id
      LEFT JOIN users u1 ON ba1.user_id = u1.id
      LEFT JOIN users u2 ON ba2.user_id = u2.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND bt.status = ?`;
      params.push(status);
    }

    if (type) {
      query += ` AND bt.transaction_type = ?`;
      params.push(type);
    }

    if (dateFrom) {
      query += ` AND DATE(bt.created_at) >= ?`;
      params.push(dateFrom);
    }

    if (dateTo) {
      query += ` AND DATE(bt.created_at) <= ?`;
      params.push(dateTo);
    }

    query += ` ORDER BY bt.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [transactions] = await pool.query(query, params);

    // Total
    let countQuery = `SELECT COUNT(*) as total FROM bank_transactions bt WHERE 1=1`;
    const countParams = [];

    if (status) {
      countQuery += ` AND bt.status = ?`;
      countParams.push(status);
    }
    if (type) {
      countQuery += ` AND bt.transaction_type = ?`;
      countParams.push(type);
    }
    if (dateFrom) {
      countQuery += ` AND DATE(bt.created_at) >= ?`;
      countParams.push(dateFrom);
    }
    if (dateTo) {
      countQuery += ` AND DATE(bt.created_at) <= ?`;
      countParams.push(dateTo);
    }

    const [[{ total }]] = await pool.query(countQuery, countParams);

    res.json({
      data: transactions,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(total / parseInt(limit)),
      },
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
      SELECT al.*, 
             CONCAT(u.first_name, ' ', u.last_name) as user_name
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (action) {
      query += ` AND al.action LIKE ?`;
      params.push(`%${action}%`);
    }

    if (user_id) {
      query += ` AND al.user_id = ?`;
      params.push(user_id);
    }

    if (dateFrom) {
      query += ` AND DATE(al.created_at) >= ?`;
      params.push(dateFrom);
    }

    if (dateTo) {
      query += ` AND DATE(al.created_at) <= ?`;
      params.push(dateTo);
    }

    query += ` ORDER BY al.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [logs] = await pool.query(query, params);

    // Total
    let countQuery = `SELECT COUNT(*) as total FROM activity_logs al WHERE 1=1`;
    const countParams = [];

    if (action) {
      countQuery += ` AND al.action LIKE ?`;
      countParams.push(`%${action}%`);
    }
    if (user_id) {
      countQuery += ` AND al.user_id = ?`;
      countParams.push(user_id);
    }
    if (dateFrom) {
      countQuery += ` AND DATE(al.created_at) >= ?`;
      countParams.push(dateFrom);
    }
    if (dateTo) {
      countQuery += ` AND DATE(al.created_at) <= ?`;
      countParams.push(dateTo);
    }

    const [[{ total }]] = await pool.query(countQuery, countParams);

    res.json({
      data: logs,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Erreur tableau logs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ============= GESTION UTILISATEURS =============

exports.updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'INACTIVE', 'BLOCKED'].includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    const [result] = await pool.query(
      `UPDATE users SET status = ? WHERE id = ?`,
      [status, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({ success: true, message: `Utilisateur ${status}` });
  } catch (error) {
    console.error('Erreur mise à jour utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
