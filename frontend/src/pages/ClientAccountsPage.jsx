import { useState, useEffect } from "react";
import api from "../services/api";
import Icon from "../components/Icon";

export default function ClientAccountsPage() {
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
      const response = await api.get("/bank/accounts");
      setAccounts(response.data);
      if (response.data.length > 0) {
        setSelectedAccount(response.data[0]);
        fetchTransactions(response.data[0].id);
      }
      setError(null);
    } catch (requestError) {
      console.error("Erreur comptes:", requestError);
      setError(requestError.response?.data?.error || "Impossible de charger les comptes");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (accountId) => {
    try {
      const response = await api.get(`/bank/accounts/${accountId}/transactions`);
      setTransactions(response.data.transactions || []);
    } catch (requestError) {
      console.error("Erreur transactions:", requestError);
    }
  };

  const handleAccountSelect = (account) => {
    setSelectedAccount(account);
    fetchTransactions(account.id);
  };

  if (loading) {
    return (
      <div className="loading-shell">
        <span className="spinner spinner-lg" aria-label="Chargement" />
      </div>
    );
  }

  if (error) {
    return <div className="inline-alert">{error}</div>;
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Mes comptes</h1>
        <p>Consultez vos soldes et l’historique de vos transactions.</p>
      </div>

      {accounts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Icon name="wallet" size={28} />
          </div>
          <h3>Aucun compte</h3>
          <p>Vous n’avez pas encore de compte bancaire.</p>
        </div>
      ) : (
        <>
          <div className="account-stack">
            {accounts.map((account) => (
              <button
                key={account.id}
                type="button"
                className={`account-card ${selectedAccount?.id === account.id ? "selected" : ""}`}
                onClick={() => handleAccountSelect(account)}
              >
                <div className="account-card-top">
                  <span className="badge badge-info">{account.account_type}</span>
                  <span className={`badge ${account.status === "ACTIVE" ? "badge-success" : "badge-warning"}`}>
                    {account.status}
                  </span>
                </div>
                <span className="account-number">{account.account_number}</span>
                <div className="account-card-bottom">
                  <span className="account-balance">
                    {Number(account.balance || 0).toFixed(2)}
                    <span>{account.currency || "MGA"}</span>
                  </span>
                </div>
              </button>
            ))}
          </div>

          {selectedAccount ? (
            <div className="card" style={{ marginTop: "var(--space-lg)" }}>
              <div className="section-head" style={{ marginTop: 0 }}>
                <h2>Dernières transactions</h2>
              </div>

              {transactions.length === 0 ? (
                <p className="text-muted">Aucune transaction.</p>
              ) : (
                <div className="list-stack">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="trx-row">
                      <div className="trx-main">
                        <strong>{transaction.transaction_type}</strong>
                        <span>
                          {new Date(transaction.created_at).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                      <span className={`badge ${transaction.status === "COMPLETED" ? "badge-success" : "badge-warning"}`}>
                        {transaction.status}
                      </span>
                      <span className={`trx-amount ${transaction.transaction_type === "DEPOSIT" ? "credit" : "debit"}`}>
                        {transaction.transaction_type === "DEPOSIT" ? "+" : "-"}
                        {Number(transaction.amount || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
