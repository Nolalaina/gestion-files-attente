import { useState, useEffect } from "react";
import api from "../services/api";
import { useNotification } from "../context/NotificationContext";
import Icon from "../components/Icon";

export default function BankPage() {
  const { addToast } = useNotification();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await api.get("/bank/accounts");
        setAccounts(response.data);
        if (response.data && response.data.length > 0) {
          setSelectedAccount(response.data[0]);
        }
      } catch {
        addToast("Erreur lors du chargement de vos comptes", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, [addToast]);

  useEffect(() => {
    if (!selectedAccount) return;
    const fetchTransactions = async () => {
      try {
        const response = await api.get(`/bank/accounts/${selectedAccount.id}/transactions`);
        setTransactions(response.data.transactions || []);
      } catch {
        setTransactions([]);
      }
    };
    fetchTransactions();
  }, [selectedAccount]);

  if (loading) {
    return (
      <div className="loading-shell">
        <span className="spinner spinner-lg" aria-label="Chargement" />
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="app-header">
        <div className="app-header-top">
          <div>
            <div className="app-header-welcome">Ma banque</div>
            <div className="app-header-name">Mes comptes</div>
          </div>
          <span className="badge badge-success">Session sécurisée</span>
        </div>
      </div>

      <div className="app-content-overlap">
        <div className="bank-layout">
          <section>
            <div className="section-head">
              <h2>Mes cartes</h2>
            </div>

            {accounts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <Icon name="wallet" size={28} />
                </div>
                <h3>Aucun compte associé</h3>
                <p>Votre compte bancaire apparaîtra ici une fois ouvert.</p>
              </div>
            ) : (
              <div className="account-stack stagger">
                {accounts.map((account) => {
                  const isSelected = selectedAccount?.id === account.id;
                  return (
                    <button
                      key={account.id}
                      type="button"
                      className={`account-card ${isSelected ? "selected" : ""}`}
                      onClick={() => setSelectedAccount(account)}
                      aria-pressed={isSelected}
                    >
                      <div className="account-card-top">
                        <span className="account-chip" aria-hidden="true" />
                        <span className="badge badge-info">{account.account_type}</span>
                      </div>

                      <span className="account-number">
                        {account.account_number?.match(/.{1,4}/g)?.join(" ") || account.account_number}
                      </span>

                      <div className="account-card-bottom">
                        <span className="account-balance">
                          {Number(account.balance || 0).toFixed(0)}
                          <span>{account.currency || "MGA"}</span>
                        </span>
                        <span className={`badge ${account.status === "ACTIVE" ? "badge-success" : "badge-warning"}`}>
                          {account.status}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <div className="section-head">
              <h2>Dernières transactions</h2>
            </div>

            {selectedAccount ? (
              transactions.length > 0 ? (
                <div className="list-stack stagger">
                  {transactions.slice(0, 8).map((transaction) => {
                    const isCredit =
                      transaction.to_account_id === selectedAccount.id ||
                      transaction.transaction_type === "DEPOSIT";
                    return (
                      <div key={transaction.id} className="trx-row">
                        <span className={`trx-icon ${isCredit ? "credit" : "debit"}`}>
                          <span aria-hidden="true">{isCredit ? "+" : "-"}</span>
                        </span>
                        <div className="trx-main">
                          <strong>{transaction.transaction_type}</strong>
                          <span>
                            {new Date(transaction.created_at).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>
                        <span className={`trx-amount ${isCredit ? "credit" : "debit"}`}>
                          {isCredit ? "+" : "-"}
                          {transaction.amount?.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  <h3>Aucune transaction récente</h3>
                  <p>Les mouvements de ce compte apparaîtront ici.</p>
                </div>
              )
            ) : (
              <div className="empty-state">
                <h3>Sélectionnez une carte</h3>
                <p>Choisissez un compte pour afficher ses transactions.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
