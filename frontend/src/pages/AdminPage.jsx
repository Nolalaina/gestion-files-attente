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
    ]).then(([s,h,u,sv, l, tks]) => {
      setStats(s.data.data);
      setHistory(h.data.data.map(d => ({
        ...d,
        date: new Date(d.date).toLocaleDateString("fr-FR",{weekday:"short",day:"numeric"})
      })));
      setUsers(u.data.data);
      setServices(sv.data.data);
      setLogs(l.data.data);
      setAllTickets(tks.data.data);
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
    { id:"logs",      label:"🔍 Logs"       },
  ];

  return (
    <div className="fade-in">
      <div className="page-header flex justify-between items-center wrap gap-md">
        <div>
          <h1>📊 Dashboard <span>Admin</span></h1>
          <p>{new Date().toLocaleDateString("fr-FR", { dateStyle:"full" })}</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-primary btn-sm" onClick={simulateClient}>➕ Simuler Client</button>
          <button className="btn btn-danger btn-sm" onClick={resetBank}>💣 Reset</button>
          <button className="btn btn-secondary btn-sm" onClick={reload}>🔄 Actualiser</button>
        </div>
      </div>

      {/* Advanced Search Bar (Visible in History/Agents/Logs) */}
      {["history","users","logs","queue"].includes(tab) && (
        <div className="card glass" style={{ marginBottom: "1.5rem", padding: "1rem" }}>
          <div className="flex wrap gap-md items-center">
            <div className="form-group" style={{ marginBottom: 0, flex: 2 }}>
              <input type="text" className="input" placeholder="🔍 Rechercher (nom, numéro...)" 
                value={searchCriteria.search} onChange={e => setSearchCriteria({...searchCriteria, search: e.target.value})} />
            </div>
            <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
              <select className="input" value={searchCriteria.status} onChange={e => setSearchCriteria({...searchCriteria, status: e.target.value})}>
                <option value="">Tous les statuts</option>
                <option value="waiting">En attente</option>
                <option value="called">Appelés</option>
                <option value="done">Terminés</option>
                <option value="absent">Absents</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={reload}>Filtrer</button>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-4 stagger" style={{ marginBottom:"2rem" }}>
        <StatCard label="Tickets aujourd'hui" value={g?.total   ?? 0} icon="🎫" />
        <StatCard label="En attente"           value={g?.waiting ?? 0} icon="⏳" color="var(--warn)" />
        <StatCard label="Traités"              value={g?.done    ?? 0} icon="✅" color="var(--acc)" />
        <StatCard label="Attente moy."   value={`${g?.avg_wait_min ?? 0} min`} icon="⏱️" color="#8b5cf6" />
      </div>

      {/* Onglets */}
      <div className="tabs glass" style={{ marginBottom:"1.5rem" }}>
        {TABS.map(t => (
          <button key={t.id} className={`tab ${tab===t.id?"active":""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

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
                <Bar dataKey="total" name="Total"   fill="#4f46e5" radius={[6,6,0,0]} />
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
                <Line type="monotone" dataKey="count" name="Tickets" stroke="#4f46e5" strokeWidth={2.5} dot={false} />
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
              <Bar dataKey="total" name="Total"   fill="#4f46e5" radius={[6,6,0,0]} />
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
  );
}
