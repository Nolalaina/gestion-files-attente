import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import api      from "../services/api";
import StatCard from "../components/StatCard";
import { useNotification } from "../context/NotificationContext";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass" style={{ borderRadius:"var(--r-sm)", padding:".75rem 1rem" }}>
      <p style={{ fontWeight:700, marginBottom:".3rem", fontSize:".85rem" }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color:p.color, fontSize:".8rem" }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

export default function AdminPage() {
  const { addToast } = useNotification();
  const [stats,    setStats]    = useState(null);
  const [history,  setHistory]  = useState([]);
  const [users,    setUsers]    = useState([]);
  const [logs,     setLogs]     = useState([]);
  const [services, setServices] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [allTickets, setAllTickets] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState("overview");

  const [searchCriteria, setSearchCriteria] = useState({ status: "", search: "" });

  const reload = () => {
    setLoading(true);
    const searchParams = new URLSearchParams(searchCriteria).toString();
    Promise.all([
      api.get("/stats"),
      api.get("/stats/history?days=7"),
      api.get("/users?" + searchParams),
      api.get("/services"),
      api.get("/stats/logs?limit=50"),
      api.get("/tickets?limit=100"),
      api.get("/bank/admin/accounts?limit=100"),
    ]).then(([s,h,u,sv, l, tks, accountsRes]) => {
      setStats(s.data.data);
      setHistory(h.data.data.map(d => ({
        ...d,
        date: new Date(d.date).toLocaleDateString("fr-FR",{weekday:"short",day:"numeric"})
      })));
      setUsers(u.data.data);
      setServices(sv.data.data);
      setLogs(l.data.data);
      setAllTickets(tks.data.data);
      setAccounts(accountsRes.data.data || []);
    }).catch(() => addToast("Erreur de chargement", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, []);

  const toggleUser = async (id) => {
    try {
      await api.patch(`/users/${id}/toggle`);
      setUsers(u => u.map(x => x.id===id ? {...x, active: x.active ? 0 : 1} : x));
      addToast("Statut mis à jour", "success");
    } catch { addToast("Erreur", "error"); }
  };

  const simulateClient = async () => {
    try {
      if (services.length === 0) return;
      await api.post("/tickets", { service_id: services[0].id, user_name: "Client Simulé" });
      addToast("Nouveau client simulé", "success");
      reload();
    } catch { addToast("Erreur simulation", "error"); }
  };

  const resetBank = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir réinitialiser TOUTE la banque ?")) return;
    const confirmStr = window.prompt("Tapez 'RESET_ALL' pour confirmer");
    if (confirmStr !== "RESET_ALL") return;

    try {
      await api.post("/bank/reset", { confirm: "RESET_ALL" });
      addToast("Banque réinitialisée", "success");
      reload();
    } catch { addToast("Erreur reset", "error"); }
  };

  const doReassign = async (ticketId, newServiceId) => {
    try {
      await api.patch(`/tickets/${ticketId}/reassign`, { new_service_id: newServiceId });
      addToast("Ticket réaffecté", "success");
      reload();
    } catch { addToast("Erreur réaffectation", "error"); }
  };

  if (loading) return (
    <div style={{ textAlign:"center", padding:"5rem" }}>
      <span className="spinner spinner-dark" style={{ width:32, height:32, borderWidth:4 }} />
    </div>
  );

  const g = stats?.global;
  const TABS = [
    { id:"overview",  label:"📈 Aperçu"    },
    { id:"queue",     label:"🎫 File Globale" },
    { id:"history",   label:"📅 Historique" },
    { id:"services",  label:"⚙️ Services"   },
    { id:"users",     label:"👥 Agents"     },
    { id:"bank",      label:"🏦 Banque"     },
    { id:"logs",      label:"🔍 Logs"       },
  ];

  return (
    <div className="fade-in">
      <div className="app-header" style={{ paddingBottom: "7rem" }}>
        <div className="app-header-top">
          <div>
            <div className="app-header-welcome">Console <span>Admin</span> 📊</div>
            <div className="app-header-name">{new Date().toLocaleDateString("fr-FR", { dateStyle:"medium" })}</div>
          </div>
          <div className="flex gap-sm">
            <button className="btn btn-secondary btn-sm" onClick={simulateClient} 
              style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', fontWeight: 800 }}>➕ Simuler</button>
            <button className="btn btn-secondary btn-sm" onClick={reload}
              style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', fontWeight: 800 }}>🔄</button>
            <button className="btn btn-danger btn-sm" onClick={resetBank}
              style={{ fontWeight: 800, border: 'none', borderRadius: '12px' }}>Reset</button>
          </div>
        </div>
      </div>

      <div className="app-content-overlap">
        {/* KPIs Section */}
        <div className="grid grid-4 stagger" style={{ marginBottom:"1.5rem" }}>
          <StatCard label="Tickets" value={g?.total ?? 0} icon="🎫" color="var(--p)" />
          <StatCard label="Attente" value={g?.waiting ?? 0} icon="⏳" color="var(--warn)" />
          <StatCard label="Traités" value={g?.done ?? 0} icon="✅" color="var(--acc)" />
          <StatCard label="Moy. (min)" value={g?.avg_wait_min ?? 0} icon="⏱️" color="#8b5cf6" />
        </div>

        {/* Custom Tabs (Mobile Style) */}
        <div className="tabs glass slide-up" style={{ marginBottom:"1.5rem", padding: "0.5rem", borderRadius: "20px" }}>
          {TABS.map(t => (
            <button key={t.id} className={`tab ${tab===t.id?"active":""}`} onClick={() => setTab(t.id)}
              style={{ flex: 1, textAlign: "center", fontSize: "0.75rem" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Header Search Filter (Conditional) */}
        {["history","users","logs","queue", "bank"].includes(tab) && (
          <div className="card glass slide-up" style={{ marginBottom: "1.5rem", padding: "1rem", borderRadius: "20px" }}>
            <div className="flex wrap gap-md items-center">
              <div style={{ flex: 2 }}>
                <input type="text" className="input btn-sm" placeholder="🔍 Rechercher..." 
                  value={searchCriteria.search} onChange={e => setSearchCriteria({...searchCriteria, search: e.target.value})} 
                  style={{ width: "100%", borderRadius: "12px", background: "var(--surface2)" }} />
              </div>
              <button className="btn btn-primary btn-sm" onClick={reload}>OK</button>
            </div>
          </div>
        )}

      {/* Aperçu */}
      {tab==="overview" && (
        <div className="grid grid-2">
          <div className="card glass">
            <h3 className="font-title" style={{ fontWeight:800, marginBottom:"1.25rem" }}>Tickets par service</h3>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={stats?.by_service||[]} margin={{left:-20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{fontSize:11}} />
                <YAxis tick={{fontSize:11}} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Total"   fill="#7c3aed" radius={[6,6,0,0]} />
                <Bar dataKey="done"  name="Traités" fill="#10b981" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card glass">
            <h3 className="font-title" style={{ fontWeight:800, marginBottom:"1.25rem" }}>Flux horaire</h3>
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={stats?.hourly_distribution||[]} margin={{left:-20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="hour" tickFormatter={h=>`${h}h`} tick={{fontSize:11}} />
                <YAxis tick={{fontSize:11}} />
                <Tooltip content={<CustomTooltip />} labelFormatter={h=>`${h}h00`} />
                <Line type="monotone" dataKey="count" name="Tickets" stroke="#7c3aed" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* File Globale */}
      {tab === "queue" && (
        <div className="card glass" style={{ padding:0, overflow:"hidden" }}>
          <table className="data-table">
            <thead>
              <tr><th>Ticket</th><th>Client</th><th>Service Actuel</th><th>Statut</th><th>Réaffecter</th></tr>
            </thead>
            <tbody>
              {allTickets.map(tk => (
                <tr key={tk.id}>
                  <td><span className="fw-700 font-title" style={{ fontSize:"1.1rem" }}>{tk.number}</span></td>
                  <td>{tk.user_name}</td>
                  <td><span className="badge badge-info">{tk.service_name}</span></td>
                  <td><span className={`badge badge-${tk.status}`}>{tk.status}</span></td>
                  <td>
                    <select className="input btn-sm" onChange={(e) => doReassign(tk.id, e.target.value)} defaultValue="">
                      <option value="" disabled>Vers service...</option>
                      {services.filter(s => s.id !== tk.service_id).map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Historique */}
      {tab==="history" && (
        <div className="card glass">
          <h3 className="font-title" style={{ fontWeight:800, marginBottom:"1.25rem" }}>Performance Hebdomadaire</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={history} margin={{left:-20}}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{fontSize:11}} />
              <YAxis tick={{fontSize:11}} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" name="Total"   fill="#7c3aed" radius={[6,6,0,0]} />
              <Bar dataKey="done"  name="Traités" fill="#10b981" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Services */}
      {tab==="services" && (
        <div className="card glass" style={{ padding:0, overflow:"hidden" }}>
          <table className="data-table">
            <thead><tr><th>Service</th><th>Préfixe</th><th>Guichets</th><th>Durée Moy.</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {services.map(s => (
                <tr key={s.id}>
                  <td><div style={{ fontWeight:700 }}>{s.name}</div></td>
                  <td><span className="badge badge-info">{s.prefix}</span></td>
                  <td>{s.max_counters}</td>
                  <td>{s.avg_duration} min</td>
                  <td><span className={`badge ${s.active?"badge-success":"badge-cancelled"}`}>{s.active?"Ouvert":"Fermé"}</span></td>
                  <td><button className="btn btn-secondary btn-sm">⚙️</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Agents */}
      {tab==="users" && (
        <div className="card glass" style={{ padding:0, overflow:"hidden" }}>
          <div style={{ padding: "1rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "flex-end" }}>
            <button className="btn btn-primary btn-sm">➕ Ajouter Agent</button>
          </div>
          <table className="data-table">
            <thead><tr><th>Agent</th><th>Email</th><th>Rôle</th><th>Prise en charge</th><th>Statut</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight:700 }}>{u.name}</td>
                  <td style={{ fontSize:".85rem", color:"var(--muted)" }}>{u.email}</td>
                  <td><span className={`badge ${u.role==="admin"?"badge-serving":"badge-called"}`}>{u.role.toUpperCase()}</span></td>
                  <td style={{ fontWeight: 600 }}>{u.ticket_count || 0} tickets</td>
                  <td><span className={`badge ${u.active?"badge-success":"badge-cancelled"}`}>{u.active?"Actif":"Inactif"}</span></td>
                  <td>
                    <div className="flex gap-sm">
                      <button className="btn btn-secondary btn-sm" onClick={() => toggleUser(u.id)} title="Toggle Actif">
                        {u.active?"🛑":"✅"}
                      </button>
                      <button className="btn btn-secondary btn-sm">✏️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Comptes Bancaires */}
      {tab==="bank" && (
        <div className="card glass" style={{ padding:0, overflow:"hidden" }}>
          <div style={{ padding: "1rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Comptes Bancaires des Utilisateurs</h3>
            <button className="btn btn-primary btn-sm" onClick={() => reload()}>🔄 Actualiser</button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Propriétaire</th>
                <th>Type</th>
                <th style={{ textAlign: "right" }}>Solde</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(acc => (
                <tr key={acc.id}>
                  <td style={{ fontFamily: "monospace", fontWeight: 700, letterSpacing: 1 }}>{acc.account_number}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: "var(--text)" }}>{acc.owner_name}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{acc.email}</div>
                  </td>
                  <td><span className="badge badge-info">{acc.account_type}</span></td>
                  <td style={{ textAlign: "right", fontWeight: 800, color: "var(--primary)" }}>
                    {acc.balance?.toFixed(2)} {acc.currency || "$"}
                  </td>
                  <td>
                    <span className={`badge ${acc.status === "ACTIVE" ? "badge-success" : "badge-warn"}`}>
                      {acc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {accounts.length === 0 && (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted)" }}>
              Aucun compte bancaire trouvé.
            </div>
          )}
        </div>
      )}

      {/* Logs */}
      {tab==="logs" && (
        <div className="card glass" style={{ padding:0, overflow:"hidden" }}>
          <table className="data-table">
            <thead><tr><th>Date</th><th>Utilisateur</th><th>Action</th><th>Détails</th></tr></thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id}>
                  <td style={{ fontSize:".75rem", color:"var(--muted)" }}>
                    {new Date(l.created_at).toLocaleString("fr-FR", { dateStyle:"short", timeStyle:"short" })}
                  </td>
                  <td style={{ fontWeight:600 }}>{l.user_name || "Système"}</td>
                  <td><span className="badge badge-info">{l.action}</span></td>
                  <td style={{ fontSize:".85rem" }}>{l.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
  );
}
