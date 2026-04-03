const express = require('express');
const router = express.Router();
const bankingController = require('../controllers/bankingController');
const adminController = require('../controllers/adminController');
const { checkPermission, checkRole, auditLog } = require('../middleware/roleMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

// ============= AUTHENTIFICATION REQUISE =============
router.use(authMiddleware);

// ============= ENDPOINTS CLIENT =============

// Comptes utilisateur
router.get(
  '/accounts',
  checkPermission('CLIENT.VIEW_BALANCE', 'AGENT.VIEW_CLIENTS', 'ADMIN.VIEW_ACCOUNTS'),
  auditLog('VIEW_ACCOUNTS', 'bank_account'),
  bankingController.getUserAccounts
);

router.get(
  '/accounts/:accountId',
  checkPermission('CLIENT.VIEW_BALANCE', 'AGENT.VIEW_CLIENTS', 'ADMIN.VIEW_ACCOUNTS'),
  bankingController.getAccountDetails
);

// Historique transactions
router.get(
  '/accounts/:accountId/transactions',
  checkPermission('CLIENT.VIEW_HISTORY', 'AGENT.VIEW_CLIENT_HISTORY', 'ADMIN.VIEW_TRANSACTIONS'),
  auditLog('VIEW_TRANSACTION_HISTORY', 'bank_transaction'),
  bankingController.getTransactionHistory
);

// Dépôt (client ou agent)
router.post(
  '/accounts/:accountId/deposit',
  checkPermission('CLIENT.VIEW_BALANCE', 'AGENT.DEPOSIT'),
  auditLog('DEPOSIT', 'bank_transaction'),
  bankingController.deposit
);

// Retrait (client ou agent)
router.post(
  '/accounts/:accountId/withdraw',
  checkPermission('CLIENT.VIEW_BALANCE', 'AGENT.WITHDRAW'),
  auditLog('WITHDRAW', 'bank_transaction'),
  bankingController.withdraw
);

// Virement (client ou agent)
router.post(
  '/accounts/:accountId/transfer',
  checkPermission('CLIENT.TRANSFER', 'AGENT.TRANSFER'),
  auditLog('TRANSFER', 'bank_transaction'),
  bankingController.transfer
);

// ============= ENDPOINTS AGENT =============

// Clients assignés
router.get(
  '/agent/clients',
  checkRole('AGENT'),
  checkPermission('AGENT.VIEW_CLIENTS'),
  auditLog('VIEW_CLIENTS', 'user'),
  bankingController.agentGetAssignedClients
);

// Ouvrir compte pour client
router.post(
  '/agent/accounts/open',
  checkRole('AGENT'),
  checkPermission('AGENT.OPEN_ACCOUNT'),
  auditLog('OPEN_ACCOUNT', 'bank_account'),
  bankingController.agentOpenAccount
);

// ============= ENDPOINTS ADMIN - TABLEAUX DE BORD =============

router.get(
  '/admin/dashboard',
  checkRole('ADMIN'),
  checkPermission('ADMIN.VIEW_DASHBOARD'),
  auditLog('VIEW_DASHBOARD', 'dashboard'),
  adminController.getDashboard
);

// Tableau utilisateurs
router.get(
  '/admin/users',
  checkRole('ADMIN'),
  checkPermission('ADMIN.VIEW_USERS'),
  auditLog('VIEW_USERS_TABLE', 'user'),
  adminController.getUsersTable
);

// Tableau comptes
router.get(
  '/admin/accounts',
  checkRole('ADMIN'),
  checkPermission('ADMIN.VIEW_ACCOUNTS'),
  auditLog('VIEW_ACCOUNTS_TABLE', 'bank_account'),
  adminController.getAccountsTable
);

// Tableau transactions
router.get(
  '/admin/transactions',
  checkRole('ADMIN'),
  checkPermission('ADMIN.VIEW_TRANSACTIONS'),
  auditLog('VIEW_TRANSACTIONS_TABLE', 'bank_transaction'),
  adminController.getTransactionsTable
);

// Tableau logs
router.get(
  '/admin/logs',
  checkRole('ADMIN'),
  checkPermission('ADMIN.VIEW_LOGS'),
  auditLog('VIEW_LOGS_TABLE', 'activity_log'),
  adminController.getActivityLogsTable
);

// Gestion utilisateurs
router.patch(
  '/admin/users/:userId/status',
  checkRole('ADMIN'),
  checkPermission('ADMIN.MANAGE_USERS'),
  auditLog('UPDATE_USER_STATUS', 'user'),
  adminController.updateUserStatus
);

module.exports = router;
