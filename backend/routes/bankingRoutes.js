const express = require('express');
const router = express.Router();
const bankingController = require('../controllers/bankingController');
const adminController = require('../controllers/adminController');
const auth = require('../middleware/authMiddleware');

// ============= ENDPOINTS CLIENT =============

// Comptes utilisateur
router.get('/accounts', auth(), bankingController.getUserAccounts);
router.get('/accounts/:accountId', auth(), bankingController.getAccountDetails);

// Historique transactions
router.get('/accounts/:accountId/transactions', auth(), bankingController.getTransactionHistory);

// Dépôt / Retrait / Virement
router.post('/accounts/:accountId/deposit',  auth(), bankingController.deposit);
router.post('/accounts/:accountId/withdraw', auth(), bankingController.withdraw);
router.post('/accounts/:accountId/transfer', auth(), bankingController.transfer);

// ============= ENDPOINTS AGENT =============
router.get('/agent/clients',        auth(["agent","admin"]), bankingController.agentGetAssignedClients);
router.post('/agent/accounts/open', auth(["agent","admin"]), bankingController.agentOpenAccount);

module.exports = router;
