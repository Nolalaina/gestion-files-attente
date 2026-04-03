import React, { useState, useEffect } from 'react';
import axios from '../services/api';
import '../styles/ClientAccounts.css';

const ClientAccountsPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await axios.get('/api/bank/accounts');
      setAccounts(response.data);
      if (response.data.length > 0) {
        setSelectedAccount(response.data[0]);
        fetchTransactions(response.data[0].id);
      }
      setError(null);
    } catch (err) {
      console.error('Erreur comptes:', err);
      setError(err.response?.data?.error || 'Impossible de charger les comptes');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (accountId) => {
    try {
      const response = await axios.get(`/api/bank/accounts/${accountId}/transactions`);
      setTransactions(response.data.transactions);
    } catch (err) {
      console.error('Erreur transactions:', err);
    }
  };

  const handleAccountSelect = (account) => {
    setSelectedAccount(account);
    fetchTransactions(account.id);
  };

  if (loading) return <div className="loading">Chargement des comptes...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="client-accounts-page">
      <h1>Mes Comptes</h1>

      {/* Cartes comptes */}
      <div className="accounts-grid">
        {accounts.map(account => (
          <div
            key={account.id}
            className={`account-card ${selectedAccount?.id === account.id ? 'active' : ''}`}
            onClick={() => handleAccountSelect(account)}
          >
            <div className="account-header">
              <h3>{account.account_type}</h3>
              <span className={`status ${account.status.toLowerCase()}`}>{account.status}</span>
            </div>
            <div className="account-number">
              {account.account_number}
            </div>
            <div className="account-balance">
              <p>Solde</p>
              <h2>${account.balance.toFixed(2)}</h2>
            </div>
            <p className="account-date">
              Créé le {new Date(account.created_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
        ))}
      </div>

      {/* Détails du compte sélectionné */}
      {selectedAccount && (
        <div className="account-details">
          <h2>Détails du Compte</h2>
          
          {/* Boutons d'actions */}
          <div className="action-buttons">
            <button className="btn btn-primary">💸 Virement</button>
            <button className="btn btn-default">📥 Dépôt</button>
            <button className="btn btn-default">📤 Retrait</button>
            <button className="btn btn-default">📄 Télécharger RIB</button>
          </div>

          {/* Historique transactions */}
          <div className="transactions-history">
            <h3>Historique des Transactions</h3>
            {transactions.length === 0 ? (
              <p className="no-data">Aucune transaction</p>
            ) : (
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Montant</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id}>
                      <td>{new Date(tx.created_at).toLocaleDateString('fr-FR')}</td>
                      <td><span className={`badge ${tx.transaction_type}`}>{tx.transaction_type}</span></td>
                      <td>{tx.description}</td>
                      <td className={tx.transaction_type === 'DEPOSIT' ? 'positive' : 'negative'}>
                        {tx.transaction_type === 'DEPOSIT' ? '+' : '-'}${tx.amount.toFixed(2)}
                      </td>
                      <td><span className={`status ${tx.status.toLowerCase()}`}>{tx.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {accounts.length === 0 && (
        <div className="no-accounts">
          <p>Vous n'avez pas encore de compte</p>
          <button className="btn btn-primary">Ouvrir un Compte</button>
        </div>
      )}
    </div>
  );
};

export default ClientAccountsPage;
