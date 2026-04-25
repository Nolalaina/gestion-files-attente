const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// ============= GESTION DES COMPTES =============

exports.getUserAccounts = async (req, res) => {
  try {
    const userId = req.user.id;

    const [accounts] = await pool.query(
      `SELECT id, account_number, account_type, balance, currency, status, created_at
       FROM bank_accounts
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(accounts);
  } catch (error) {
    console.error('Erreur récupération comptes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getAccountDetails = async (req, res) => {
  try {
    const { accountId } = req.params;
    const userId = req.user.id;

    const [accounts] = await pool.query(
      `SELECT * FROM bank_accounts
       WHERE id = ? AND user_id = ?`,
      [accountId, userId]
    );

    if (!accounts.length) {
      return res.status(404).json({ error: 'Compte non trouvé' });
    }

    res.json(accounts[0]);
  } catch (error) {
    console.error('Erreur détails compte:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ============= TRANSACTIONS =============

exports.getTransactionHistory = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { limit = 50, offset = 0, status = null } = req.query;
    const userId = req.user.id;

    // Vérifier que le compte appartient à l'utilisateur
    const [accounts] = await pool.query(
      `SELECT id FROM bank_accounts WHERE id = ? AND user_id = ?`,
      [accountId, userId]
    );

    if (!accounts.length) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    let query = `
      SELECT 
        id, from_account_id, to_account_id, transaction_type,
        amount, status, reference_number, description,
        created_at, completed_at
      FROM bank_transactions
      WHERE (from_account_id = ? OR to_account_id = ?)
    `;
    const params = [accountId, accountId];

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [transactions] = await pool.query(query, params);

    res.json({
      transactions,
      pagination: { limit: parseInt(limit), offset: parseInt(offset) },
    });
  } catch (error) {
    console.error('Erreur historique transactions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.deposit = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { amount, description } = req.body;
    const { accountId } = req.params;
    const userId = req.user.id;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Montant invalide' });
    }

    await conn.beginTransaction();

    // Vérifier le compte (Statut doit être ACTIVE)
    const [accountRows] = await conn.query(
      `SELECT id, balance, status FROM bank_accounts WHERE id = ?`,
      [accountId]
    );
    const account = accountRows[0];

    if (!account) {
      await conn.rollback();
      return res.status(404).json({ error: 'Compte non trouvé' });
    }

    if (account.status !== 'ACTIVE') {
      await conn.rollback();
      return res.status(403).json({ error: `Dépôt refusé : le compte est ${account.status}` });
    }

    // Vérifier limite journalière de dépôt
    const [limitRows] = await conn.query(
      `SELECT SUM(amount) as daily_total FROM bank_transactions 
       WHERE to_account_id = ? 
       AND transaction_type = 'DEPOSIT'
       AND status = 'COMPLETED' 
       AND DATE(created_at) = CURDATE()`,
      [accountId]
    );
    const daily_total = limitRows[0]?.daily_total || 0;

    const LIMIT = 1000000;
    if ((Number(daily_total) || 0) + Number(amount) > LIMIT) {
      await conn.rollback();
      return res.status(400).json({ error: `Dépôt impossible : Limite journalière de 1M MGA atteinte.` });
    }

    const referenceNumber = `DEP-${Date.now()}-${uuidv4().substring(0, 8)}`;

    // Créer la transaction
    const [result] = await conn.query(
      `INSERT INTO bank_transactions 
       (to_account_id, transaction_type, amount, status, reference_number, description, initiated_by_user_id, completed_at)
       VALUES (?, 'DEPOSIT', ?, 'COMPLETED', ?, ?, ?, NOW())`,
      [accountId, amount, referenceNumber, description || 'Dépôt', userId]
    );

    // Mettre à jour le solde
    await conn.query(
      `UPDATE bank_accounts SET balance = balance + ? WHERE id = ?`,
      [amount, accountId]
    );

    await conn.commit();

    res.json({
      success: true,
      transaction: {
        id: result.insertId,
        reference_number: referenceNumber,
        amount,
        status: 'COMPLETED',
      },
    });
  } catch (error) {
    await conn.rollback();
    console.error('Erreur dépôt:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    conn.release();
  }
};

exports.withdraw = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { amount, description } = req.body;
    const { accountId } = req.params;
    const userId = req.user.id;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Montant invalide' });
    }

    await conn.beginTransaction();

    // Vérifier le compte (Statut doit être ACTIVE)
    const [accountRows] = await conn.query(
      `SELECT id, balance, status FROM bank_accounts WHERE id = ?`,
      [accountId]
    );
    const account = accountRows[0];

    if (!account) {
      await conn.rollback();
      return res.status(404).json({ error: 'Compte non trouvé' });
    }

    if (account.status !== 'ACTIVE') {
      await conn.rollback();
      return res.status(403).json({ error: `Opération refusée : le compte est ${account.status}` });
    }

    // Vérifier solde suffisant
    if (account.balance < amount) {
      await conn.rollback();
      return res.status(400).json({ error: 'Solde insuffisant pour ce retrait' });
    }

    // Vérifier limite journalière de retrait (Ex: 1 000 000 MGA par défaut)
    const [limitRows] = await conn.query(
      `SELECT SUM(amount) as daily_total FROM bank_transactions 
       WHERE from_account_id = ? 
       AND transaction_type = 'WITHDRAWAL'
       AND status = 'COMPLETED' 
       AND DATE(created_at) = CURDATE()`,
      [accountId]
    );
    const daily_total = limitRows[0]?.daily_total || 0;

    const LIMIT = 1000000;
    if ((Number(daily_total) || 0) + Number(amount) > LIMIT) {
      await conn.rollback();
      return res.status(400).json({ error: `Limite journalière dépassée (${LIMIT} MGA)` });
    }

    const referenceNumber = `WTH-${Date.now()}-${uuidv4().substring(0, 8)}`;

    // Créer la transaction
    const [result] = await conn.query(
      `INSERT INTO bank_transactions 
       (from_account_id, transaction_type, amount, status, reference_number, description, initiated_by_user_id, completed_at)
       VALUES (?, 'WITHDRAWAL', ?, 'COMPLETED', ?, ?, ?, NOW())`,
      [accountId, amount, referenceNumber, description || 'Retrait', userId]
    );

    // Mettre à jour le solde
    await conn.query(
      `UPDATE bank_accounts SET balance = balance - ? WHERE id = ?`,
      [amount, accountId]
    );

    await conn.commit();

    res.json({
      success: true,
      transaction: {
        id: result.insertId,
        reference_number: referenceNumber,
        amount,
        status: 'COMPLETED',
      },
    });
  } catch (error) {
    await conn.rollback();
    console.error('Erreur retrait:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    conn.release();
  }
};

exports.transfer = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { toAccountId, amount, description } = req.body;
    const { accountId } = req.params;
    const userId = req.user.id;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Montant invalide' });
    }

    if (!toAccountId) {
      return res.status(400).json({ error: 'Compte destinataire manquant' });
    }

    if (accountId === toAccountId) {
      return res.status(400).json({ error: 'Les comptes doivent être différents' });
    }

    await conn.beginTransaction();

    // Vérifier compte source (ACTIVE)
    const [fromAccountRows] = await conn.query(
      `SELECT id, balance, status FROM bank_accounts WHERE id = ?`,
      [accountId]
    );
    const fromAccount = fromAccountRows[0];

    if (!fromAccount) {
      await conn.rollback();
      return res.status(404).json({ error: 'Compte source non trouvé' });
    }

    if (fromAccount.status !== 'ACTIVE') {
      await conn.rollback();
      return res.status(403).json({ error: `Virement refusé : le compte source est ${fromAccount.status}` });
    }

    // Vérifier compte dest (ACTIVE)
    const [toAccountRows] = await conn.query(
      `SELECT id, status FROM bank_accounts WHERE id = ?`,
      [toAccountId]
    );
    const toAccount = toAccountRows[0];

    if (!toAccount) {
      await conn.rollback();
      return res.status(404).json({ error: 'Compte destinataire non trouvé' });
    }

    if (toAccount.status !== 'ACTIVE') {
      await conn.rollback();
      return res.status(403).json({ error: `Virement refusé : le compte destinataire est ${toAccount.status}` });
    }

    // Vérifier solde
    if (fromAccount.balance < amount) {
      await conn.rollback();
      return res.status(400).json({ error: 'Solde insuffisant' });
    }

    // Vérifier limite journalière de virement
    const [trLimitRows] = await conn.query(
      `SELECT SUM(amount) as daily_total FROM bank_transactions 
       WHERE from_account_id = ? 
       AND transaction_type = 'TRANSFER'
       AND status = 'COMPLETED' 
       AND DATE(created_at) = CURDATE()`,
      [accountId]
    );
    const daily_total = trLimitRows[0]?.daily_total || 0;

    const LIMIT = 1000000;
    if ((Number(daily_total) || 0) + Number(amount) > LIMIT) {
      await conn.rollback();
      return res.status(400).json({ error: `Virement impossible : Limite journalière dépassée (${LIMIT} MGA)` });
    }

    const referenceNumber = `TRF-${Date.now()}-${uuidv4().substring(0, 8)}`;

    // Créer la transaction
    const [result] = await conn.query(
      `INSERT INTO bank_transactions 
       (from_account_id, to_account_id, transaction_type, amount, status, reference_number, description, initiated_by_user_id, completed_at)
       VALUES (?, ?, 'TRANSFER', ?, 'COMPLETED', ?, ?, ?, NOW())`,
      [accountId, toAccountId, amount, referenceNumber, description || 'Virement', userId]
    );

    // Mettre à jour les soldes
    await conn.query(`UPDATE bank_accounts SET balance = balance - ? WHERE id = ?`, [amount, accountId]);
    await conn.query(`UPDATE bank_accounts SET balance = balance + ? WHERE id = ?`, [amount, toAccountId]);

    await conn.commit();

    res.json({
      success: true,
      transaction: {
        id: result.insertId,
        reference_number: referenceNumber,
        from_account: accountId,
        to_account: toAccountId,
        amount,
        status: 'COMPLETED',
      },
    });
  } catch (error) {
    await conn.rollback();
    console.error('Erreur virement:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    conn.release();
  }
};

// ============= CÔTÉ AGENT: GESTION CLIENTS =============

exports.agentGetAssignedClients = async (req, res) => {
  try {
    const agentId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    const [clients] = await pool.query(
      `SELECT DISTINCT u.id, u.name, u.email, u.phone, u.created_at
       FROM bank_accounts ba
       JOIN users u ON ba.user_id = u.id
       WHERE ba.agent_id = ?
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [agentId, parseInt(limit), parseInt(offset)]
    );

    res.json(clients);
  } catch (error) {
    console.error('Erreur récupération clients:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.agentOpenAccount = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { clientId, accountType = 'CURRENT' } = req.body;
    const agentId = req.user.id;

    if (!clientId) {
      return res.status(400).json({ error: 'Client ID manquant' });
    }

    await conn.beginTransaction();

    // Vérifier que le client existe
    const [clients] = await conn.query(`SELECT id FROM users WHERE id = ? AND role = 'usager'`, [clientId]);

    if (!clients.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    // Générer numéro de compte unique
    const accountNumber = `ACC-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Créer le compte
    const [result] = await conn.query(
      `INSERT INTO bank_accounts (user_id, account_number, account_type, balance, agent_id)
       VALUES (?, ?, ?, 0, ?)`,
      [clientId, accountNumber, accountType, agentId]
    );

    await conn.commit();

    res.json({
      success: true,
      account: {
        id: result.insertId,
        account_number: accountNumber,
        account_type: accountType,
        balance: 0,
      },
    });
  } catch (error) {
    await conn.rollback();
    console.error('Erreur ouverture compte:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    conn.release();
  }
};
