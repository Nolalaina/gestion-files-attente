import { useState, useEffect } from "react";
import api from "../services/api";
import { useNotification } from "../context/NotificationContext";

export default function BankPage() {
  const { addToast } = useNotification();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  // Charger les comptes
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await api.get("/bank/accounts");
        setAccounts(res.data);
        if (res.data && res.data.length > 0) {
          setSelectedAccount(res.data[0]);
        }
      } catch (err) {
        addToast("Erreur lors du chargement de vos comptes", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, [addToast]);

  // Charger les transactions du compte sélectionné
  useEffect(() => {
    if (!selectedAccount) return;
    const fetchTransactions = async () => {
      try {
        const res = await api.get(`/bank/accounts/${selectedAccount.id}/transactions`);
        setTransactions(res.data.transactions || []);
      } catch (err) {
        // Mute error, maybe account has no transactions or endpoint missing
        setTransactions([]);
      }
    };
    fetchTransactions();
  }, [selectedAccount]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "5rem" }}>
        <span className="spinner spinner-dark" style={{ width: 32, height: 32, borderWidth: 4 }} />
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="app-header">
        <div className="app-header-top">
          <div>
            <div className="app-header-welcome">Ma <span>Banque</span> 🏦</div>
            <div className="app-header-name">Mes Comptes</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.1)", padding: "0.5rem 1rem", borderRadius: "12px", fontSize: "0.8rem", fontWeight: 700 }}>
            Session Sécurisée
          </div>
        </div>
      </div>

      <div className="app-content-overlap">
        <div className="grid grid-2" style={{ gap: "2rem", alignItems: "start" }}>
          {/* Mes Comptes (Cartes style Premium) */}
          <div>
            <h3 style={{ fontSize: "0.75rem", fontWeight: 800, color: "rgba(255,255,255,0.8)", letterSpacing: "1.5px", marginBottom: "1rem", position: "relative", zIndex: 20 }}>MES CARTES</h3>
            {accounts.length === 0 ? (
              <div className="card glass text-center slide-up" style={{ padding: "3rem" }}>
                <span style={{ fontSize: "3rem", display: "block", marginBottom: "1rem" }}>📭</span>
                <p style={{ fontWeight: "600", color: "var(--muted)" }}>Aucun compte associé.</p>
              </div>
            ) : (
              <div className="flex column gap-md stagger" style={{ position: "relative", zIndex: 20 }}>
                {accounts.map(acc => {
                  const isSelected = selectedAccount?.id === acc.id;
                  return (
                    <div
                      key={acc.id}
                      className={`card slide-up ${isSelected ? "" : "glass"}`}
                      style={{
                        cursor: "pointer",
                        background: isSelected ? "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" : "",
                        color: isSelected ? "#fff" : "inherit",
                        border: isSelected ? "2px solid var(--p)" : "1px solid var(--border)",
                        padding: "1.75rem",
                        borderRadius: "24px",
                        position: "relative",
                        overflow: "hidden",
                        transition: "all 0.3s var(--ease)",
                        boxShadow: isSelected ? "0 10px 30px rgba(0,0,0,0.2)" : "var(--shadow-sm)",
                        transform: isSelected ? "scale(1.02)" : "scale(1)",
                      }}
                      onClick={() => setSelectedAccount(acc)}
                    >
                      {isSelected && (
                        <div style={{ position: "absolute", top: "-20%", right: "-10%", width: "120px", height: "120px", borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />
                      )}
                      
                      <div className="flex justify-between items-start" style={{ marginBottom: "2rem" }}>
                         <div style={{ width: "40px", height: "30px", background: "#f59e0b", borderRadius: "6px", opacity: 0.8 }} title="Card Chip" />
                         <span className="badge" style={{ background: isSelected ? "rgba(255,255,255,0.1)" : "var(--p-lt)", color: isSelected ? "#fff" : "var(--p)", fontSize: "0.65rem" }}>
                           {acc.account_type}
                         </span>
                      </div>

                      <div style={{ fontFamily: "monospace", fontSize: "1.2rem", letterSpacing: "2.5px", marginBottom: "1.5rem", opacity: 0.8 }}>
                        {acc.account_number?.match(/.{1,4}/g)?.join(' ') || acc.account_number}
                      </div>

                      <div className="flex justify-between items-end">
                        <div className="font-title" style={{ fontSize: "1.8rem", fontWeight: 900 }}>
                          {acc.balance?.toFixed(0)} <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>{acc.currency || "MGA"}</span>
                        </div>
                        <div style={{ fontSize: "0.7rem", fontWeight: 700, opacity: 0.5, textAlign: "right" }}>
                           STATUS<br/>
                           <span style={{ color: acc.status === "ACTIVE" ? "#10b981" : "#f59e0b" }}>{acc.status}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Transactions (Style Liste Mobile) */}
          <div>
            <h3 style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--muted)", letterSpacing: "1.5px", marginBottom: "1rem" }}>DERNIÈRES TRANSACTIONS</h3>
            
            <div className="flex column gap-sm stagger">
              {selectedAccount ? (
                transactions.length > 0 ? (
                  transactions.slice(0, 8).map(trx => {
                    const isCredit = trx.to_account_id === selectedAccount.id || trx.transaction_type === "DEPOSIT";
                    return (
                      <div key={trx.id} className="card glass slide-up" style={{ padding: "0.85rem 1.25rem", borderRadius: "18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div className="flex items-center gap-md">
                          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: isCredit ? "var(--acc-lt)" : "#fff1f2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>
                             {isCredit ? "📥" : "📤"}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{trx.transaction_type}</div>
                            <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                              {new Date(trx.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: "right", fontWeight: 800, fontSize: "0.95rem", color: isCredit ? "var(--acc)" : "var(--danger)" }}>
                          {isCredit ? "+" : "-"}{trx.amount?.toLocaleString()}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="card glass text-center" style={{ padding: "3rem", borderRadius: "24px" }}>
                    <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Aucune transaction récente.</p>
                  </div>
                )
              ) : (
                <div className="card glass text-center" style={{ padding: "3rem", borderRadius: "24px" }}>
                  <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Sélectionnez une carte.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
