import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useTickets } from "../hooks/useTickets";
import { useAuth }    from "../context/AuthContext";
import { useToast }   from "../context/ToastContext";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

const STATUS_LABELS = {
  waiting:"En attente", called:"Appelé", serving:"En service",
  done:"Terminé", absent:"Absent", cancelled:"Annulé"
};

function formatWait(created_at) {
  if (!created_at) return "—";
  const min = Math.round((Date.now() - new Date(created_at)) / 60000);
  if (min < 1) return "< 1 min";
  return `${min} min`;
}

export default function AgentPage() {
  const { user }     = useAuth();
  const { addToast } = useToast();
  const { tickets, loading, error, setTickets, fetchAll, callTicket, completeTicket, absentTicket } = useTickets();
  const [counter, setCounter] = useState(1);
  const [filter,  setFilter]  = useState("active");
  const socketRef = useRef(null);

  useEffect(() => {
    fetchAll({}).catch(() => {});
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    socket.emit("join_admin");
    socket.on("ticket:created", t => setTickets(p => [t, ...p]));
    socket.on("ticket:called",  t => setTickets(p => p.map(x => x.id===t.id ? t : x)));
    socket.on("ticket:done",    t => setTickets(p => p.map(x => x.id===t.id ? t : x)));
    socket.on("ticket:absent",  t => setTickets(p => p.map(x => x.id===t.id ? t : x)));
    return () => socket.disconnect();
  }, []);

  const handle = (fn, msg, type="success") => async (...args) => {
    try { await fn(...args); addToast(msg, type); }
    catch { addToast("Erreur lors de l'opération", "error"); }
  };

  const doCall     = handle((id) => callTicket(id, counter),  "📢 Ticket appelé !");
  const doComplete = handle(completeTicket, "✅ Ticket terminé", "info");
  const doAbsent   = handle(absentTicket,   "⚠️ Marqué absent",  "warning");

  const displayed = tickets.filter(t =>
    filter === "active" ? ["waiting","called","serving"].includes(t.status) :
    filter === "done"   ? ["done","absent"].includes(t.status) : true
  );
  const current = tickets.find(t => t.status==="called" || t.status==="serving");
  const waitingCount = tickets.filter(t => t.status==="waiting").length;

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header flex justify-between items-center wrap gap-md">
        <div>
          <h1>🖥️ Interface Agent</h1>
          <p>{user?.name} · {new Date().toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long" })}</p>
        </div>
        <div style={{ display:"flex", gap:".6rem", alignItems:"center" }}>
          <span style={{ fontSize:".82rem", color:"var(--muted)", fontWeight:600 }}>Guichet :</span>
          <div style={{ display:"flex", gap:".3rem" }}>
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setCounter(n)}
                className={`btn btn-sm ${counter===n ? "btn-primary" : "btn-secondary"}`}
                style={{ minWidth:36, padding:".42rem" }}>
                {n}
              </button>
            ))}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => fetchAll({})}>🔄</button>
        </div>
      </div>

      {/* Compteurs rapides */}
      <div className="grid grid-3" style={{ marginBottom:"1.5rem" }}>
        {[
          { label:"En attente", value:waitingCount, color:"var(--warn)" },
          { label:"Traités aujourd'hui", value:tickets.filter(t=>t.status==="done").length, color:"var(--acc)" },
          { label:"Guichet actif", value:counter, color:"var(--p)" },
        ].map(s => (
          <div key={s.label} className="card-flat" style={{ textAlign:"center", padding:"1rem" }}>
            <div className="font-title" style={{ fontSize:"2rem", fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:".78rem", color:"var(--muted)", fontWeight:600, textTransform:"uppercase" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Ticket en cours */}
      {current && (
        <div className="agent-current scale-in">
          <div>
            <p style={{ opacity:.75, fontSize:".8rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".08em", marginBottom:".35rem" }}>
              {current.status==="serving" ? "EN SERVICE" : "APPELÉ — GUICHET " + current.counter}
            </p>
            <div className="agent-number">{current.number}</div>
            <p style={{ marginTop:".4rem", fontSize:"1.05rem", fontWeight:600 }}>{current.user_name}</p>
            {current.phone && <p style={{ opacity:.7, fontSize:".85rem" }}>📞 {current.phone}</p>}
          </div>
          <div style={{ display:"flex", gap:".75rem", flexWrap:"wrap" }}>
            <button className="btn btn-success" onClick={() => doComplete(current.id)}>✅ Terminer</button>
            <button className="btn btn-secondary" style={{ background:"rgba(255,255,255,.2)", color:"#fff" }}
              onClick={() => doAbsent(current.id)}>⚠️ Absent</button>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="tabs" style={{ marginBottom:"1.25rem", width:"fit-content" }}>
        {[["active","En cours"],["done","Terminés"],["all","Tous"]].map(([f,l]) => (
          <button key={f} className={`tab ${filter===f?"active":""}`} onClick={() => setFilter(f)}>{l}</button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign:"center", padding:"3rem" }}><span className="spinner spinner-dark" /></div>
      ) : error ? (
        <div style={{ color:"var(--danger)", padding:"2rem", textAlign:"center", background:"#fff1f2", borderRadius:"var(--r)", border:"1px solid #fecdd3" }}>{error}</div>
      ) : displayed.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">🎉</div><p>Aucun ticket dans cette catégorie</p></div>
      ) : (
        <div className="card" style={{ padding:0, overflow:"hidden" }}>
          <table className="data-table">
            <thead>
              <tr><th>N°</th><th>Client</th><th>Service</th><th>Statut</th><th>Attente</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {displayed.map(t => {
                const wait = t.created_at ? Math.round((Date.now()-new Date(t.created_at))/60000) : 0;
                return (
                  <tr key={t.id}>
                    <td>
                      <span className="font-title" style={{ fontSize:"1.1rem", fontWeight:800, color:"var(--p)" }}>{t.number}</span>
                      {t.priority > 0 && <span className="badge badge-warning" style={{ marginLeft:6 }}>Priorité</span>}
                    </td>
                    <td>
                      <div style={{ fontWeight:600 }}>{t.user_name}</div>
                      {t.phone && <div style={{ fontSize:".78rem", color:"var(--subtle)" }}>📞 {t.phone}</div>}
                    </td>
                    <td style={{ fontSize:".85rem", color:"var(--muted)" }}>{t.service_name}</td>
                    <td><span className={`badge badge-${t.status}`}>{STATUS_LABELS[t.status]}</span></td>
                    <td>
                      <span style={{ fontSize:".85rem", fontWeight:600, color: wait > 15 ? "var(--danger)" : "var(--muted)" }}>
                        {formatWait(t.created_at)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display:"flex", gap:".4rem" }}>
                        {t.status==="waiting" && (
                          <button className="btn btn-primary btn-sm" onClick={() => doCall(t.id)}>📢 Appeler</button>
                        )}
                        {["called","serving"].includes(t.status) && (
                          <>
                            <button className="btn btn-success btn-sm" onClick={() => doComplete(t.id)}>✅</button>
                            <button className="btn btn-secondary btn-sm" onClick={() => doAbsent(t.id)}>⚠️</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
