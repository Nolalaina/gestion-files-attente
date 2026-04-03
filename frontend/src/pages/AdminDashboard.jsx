import React, { useState, useEffect } from 'react';
import axios from '../services/api';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await axios.get('/api/bank/admin/dashboard');
      setDashboard(response.data);
      setError(null);
    } catch (err) {
      console.error('Erreur dashboard:', err);
      setError(err.response?.data?.error || 'Impossible de charger le tableau de bord');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Chargement tableau de bord...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!dashboard) return null;

  const { statistics, recent_transactions, users_by_role } = dashboard;

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Tableau de Bord Administrateur</h1>
        <p className="timestamp">Dernière mise à jour : {new Date().toLocaleString('fr-FR')}</p>
      </div>

      {/* Cartes statistiques */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon users">👥</div>
          <div className="stat-content">
            <h3>Utilisateurs Totaux</h3>
            <p className="stat-number">{statistics.total_users}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon accounts">🏦</div>
          <div className="stat-content">
            <h3>Comptes Bancaires</h3>
            <p className="stat-number">{statistics.total_accounts}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon transactions">💸</div>
          <div className="stat-content">
            <h3>Transactions</h3>
            <p className="stat-number">{statistics.total_transactions}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon balance">💰</div>
          <div className="stat-content">
            <h3>Balance Totale</h3>
            <p className="stat-number">${statistics.total_balance.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Utilisateurs par rôle */}
      <div className="dashboard-section">
        <h2>Répartition par Rôle</h2>
        <div className="roles-grid">
          {users_by_role.map(role => (
            <div key={role.code} className="role-card">
              <h3>{role.name}</h3>
              <p className="role-count">{role.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions récentes */}
      <div className="dashboard-section">
        <h2>Transactions Récentes</h2>
        <div className="transactions-table">
          <table>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Type</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recent_transactions.slice(0, 10).map(tx => (
                <tr key={tx.id}>
                  <td>{tx.reference_number}</td>
                  <td><span className={`badge ${tx.transaction_type}`}>{tx.transaction_type}</span></td>
                  <td>${tx.amount.toFixed(2)}</td>
                  <td><span className={`status ${tx.status}`}>{tx.status}</span></td>
                  <td>{new Date(tx.created_at).toLocaleString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
