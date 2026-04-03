import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import api      from "../services/api";
import StatCard from "../components/StatCard";
import { useToast } from "../context/ToastContext";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", padding:".75rem 1rem", boxShadow:"var(--shadow-sm)" }}>
      <p style={{ fontWeight:700, marginBottom:".3rem", fontSize:".85rem" }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color:p.color, fontSize:".8rem" }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

export default function AdminPage() {
  const { addToast } = useToast();
  const [stats,    setStats]    = useState(null);
  const [history,  setHistory]  = useState([]);
  const [users,    setUsers]    = useState([]);
  const [services, setServices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState("overview");

  const reload = () => {
    setLoading(true);
    Promise.all([
      api.get("/stats"),
      api.get("/stats/history?days=7"),
      api.get("/users"),
      api.get("/services"),
    ]).then(([s,h,u,sv]) => {
      setStats(s.data.data);
      setHistory(h.data.data.map(d => ({
        ...d,
        date: new Date(d.date).toLocaleDateString("fr-FR",{weekday:"short",day:"numeric"})
      })));
      setUsers(u.data.data);
      setServices(sv.data.data);
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

  if (loading) return (
    <div style={{ textAlign:"center", padding:"5rem" }}>
      <span className="spinner spinner-dark" style={{ width:32, height:32, borderWidth:4 }} />
    </div>
  );

  const g = stats?.global;
  const TABS = [
    { id:"overview",  label:"📈 Aperçu"    },
    { id:"history",   label:"📅 Historique" },
    { id:"services",  label:"⚙️ Services"   },
    { id:"users",     label:"👥 Agents"     },
  ];

  return (
    <div className="fade-in">
      <div className="page-header flex justify-between items-center wrap gap-md">
        <div>
          <h1>📊 Tableau de bord</h1>
          <p>{new Date().toLocaleDateString("fr-FR", { dateStyle:"full" })}</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={reload}>🔄 Actualiser</button>
      </div>

      {/* KPIs */}
      <div className="grid grid-4 stagger" style={{ marginBottom:"2rem" }}>
        <StatCard label="Tickets aujourd'hui" value={g?.total   ?? 0} icon="🎫" />
        <StatCard label="En attente"           value={g?.waiting ?? 0} icon="⏳" color="var(--warn)" />
        <StatCard label="Traités"              value={g?.done    ?? 0} icon="✅" color="var(--acc)" />
        <StatCard label="Attente moy."   value={`${g?.avg_wait_min ?? 0} min`} icon="⏱️" color="#8b5cf6" />
      </div>

      {/* Onglets */}
      <div className="tabs" style={{ marginBottom:"1.5rem" }}>
        {TABS.map(t => (
          <button key={t.id} className={`tab ${tab===t.id?"active":""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Aperçu */}
      {tab==="overview" && (
        <div className="grid grid-2">
          <div className="card">
            <h3 className="font-title" style={{ fontWeight:800, marginBottom:"1.25rem" }}>Tickets par service</h3>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={stats?.by_service||[]} margin={{left:-20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="service_name" tick={{fontSize:11}} />
                <YAxis tick={{fontSize:11}} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Total"   fill="#4f46e5" radius={[6,6,0,0]} />
                <Bar dataKey="done"  name="Traités" fill="#10b981" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3 className="font-title" style={{ fontWeight:800, marginBottom:"1.25rem" }}>Flux horaire</h3>
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={stats?.hourly||[]} margin={{left:-20}}>
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

      {/* Historique */}
      {tab==="history" && (
        <div className="card">
          <h3 className="font-title" style={{ fontWeight:800, marginBottom:"1.25rem" }}>Historique 7 jours</h3>
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
        <div className="card" style={{ padding:0, overflow:"hidden" }}>
          <table className="data-table">
            <thead><tr><th>Service</th><th>Préfixe</th><th>Guichets</th><th>Durée moy.</th><th>Horaires</th><th>Statut</th></tr></thead>
            <tbody>
              {services.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight:700 }}>{s.name}</div>
                    {s.description && <div style={{ fontSize:".75rem", color:"var(--subtle)" }}>{s.description}</div>}
                  </td>
                  <td><span className="font-title" style={{ fontSize:"1.3rem", fontWeight:800, color:"var(--p)" }}>{s.prefix}</span></td>
                  <td>{s.max_counters}</td>
                  <td>{s.avg_duration} min</td>
                  <td style={{ fontSize:".82rem" }}>{s.open_at?.slice(0,5)} – {s.close_at?.slice(0,5)}</td>
                  <td><span className={`badge ${s.active?"badge-success":"badge-cancelled"}`}>{s.active?"Actif":"Inactif"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Agents */}
      {tab==="users" && (
        <div className="card" style={{ padding:0, overflow:"hidden" }}>
          <table className="data-table">
            <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Statut</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight:700 }}>{u.name}</td>
                  <td style={{ fontSize:".85rem", color:"var(--muted)" }}>{u.email}</td>
                  <td><span className={`badge ${u.role==="admin"?"badge-serving":"badge-called"}`}>{u.role}</span></td>
                  <td><span className={`badge ${u.active?"badge-success":"badge-cancelled"}`}>{u.active?"Actif":"Inactif"}</span></td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => toggleUser(u.id)}>
                      {u.active?"Désactiver":"Activer"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
