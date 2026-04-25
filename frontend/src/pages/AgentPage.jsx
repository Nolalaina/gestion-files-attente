import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useTickets } from "../hooks/useTickets";
import { useAuth }    from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

const STATUS_LABELS = {
  waiting: "En attente", called: "Appelé", serving: "En service",
  done: "Terminé", absent: "Absent", cancelled: "Annulé"
};

function formatWait(created_at) {
  if (!created_at) return "—";
  const min = Math.round((Date.now() - new Date(created_at)) / 60000);
  if (min < 1) return "< 1 min";
  return `${min} min`;
}

export default function AgentPage() {
  const { user }     = useAuth();
  const { addToast } = useNotification();
  const { tickets, loading, error, setTickets, fetchAll, callTicket, completeTicket, absentTicket } = useTickets();
  const [counter, setCounter] = useState(1);
  const [filter,  setFilter]  = useState("active");
  const socketRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [timeFilter, setSearchTime] = useState("");

  useEffect(() => {
    fetchAll({}).catch(() => {});
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    socket.emit("join_admin");
    socket.on("ticket:created", t => setTickets(p => [t, ...p]));
    socket.on("ticket:called",  t => setTickets(p => p.map(x => x.id===t.id ? t : x)));
    socket.on("ticket:done",    t => setTickets(p => p.map(x => x.id===t.id ? t : x)));
    socket.on("ticket:absent",  t => setTickets(p => p.map(x => x.id===t.id ? t : x)));
    socket.on("ticket:removed", id => setTickets(p => p.filter(x => x.id !== parseInt(id))));
    return () => socket.disconnect();
  }, []);

  const handle = (fn, msg, type="success") => async (...args) => {
    try { await fn(...args); addToast(msg, type); }
    catch { addToast("Erreur lors de l'opération", "error"); }
  };

  const doCall     = handle((id) => callTicket(id, counter),  "📢 Ticket appelé !");
  const doComplete = handle(completeTicket, "✅ Ticket terminé", "info");
  const doAbsent   = handle(absentTicket,   "⚠️ Marqué absent",  "warning");

  const displayed = tickets.filter(t => {
    const matchesFilter = filter === "active" ? ["waiting","called","serving"].includes(t.status) :
                        filter === "done"   ? ["done","absent"].includes(t.status) : true;
    
    const matchesSearch = searchTerm === "" || 
                        t.number.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        t.user_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const current = tickets.find(t => t.status==="called" || t.status==="serving");
  const waitingCount = tickets.filter(t => t.status==="waiting").length;

  return (
    <div className="fade-in">
      <div className="page-header flex justify-between items-center wrap gap-md">
        <div>
          <h1>🖥️ Console <span>Agent</span></h1>
          <p>{user?.name} · Guichet {counter}</p>
        </div>
        <div style={{ display:"flex", gap:".6rem", alignItems:"center" }}>
          <span style={{ fontSize:".82rem", color:"var(--muted)", fontWeight:600 }}>Guichet :</span>
          <div className="tabs glass" style={{ padding: "0.2rem" }}>
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setCounter(n)}
                className={`tab ${counter===n ? "active" : ""}`}
                style={{ minWidth:36, padding:".4rem" }}>
                {n}
              </button>
            ))}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => fetchAll({})}>🔄</button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-3 stagger" style={{ marginBottom:"2rem" }}>
        <div className="card glass">
          <div className="stat-value" style={{ color: "var(--warn)" }}>{waitingCount}</div>
          <div className="stat-label">Tickets en attente</div>
        </div>
        <div className="card glass">
          <div className="stat-value" style={{ color: "var(--acc)" }}>{tickets.filter(t=>t.status==="done").length}</div>
          <div className="stat-label">Traités aujourd'hui</div>
        </div>
        <div className="card glass card-primary">
          <div className="stat-value" style={{ color: "#fff" }}>{counter}</div>
          <div className="stat-label" style={{ color: "rgba(255,255,255,0.7)" }}>Guichet Actif</div>
        </div>
      </div>

      {/* Poste de Commandement - Ticket Actuel (Premium Highlight) */}
      {current ? (
        <div className="agent-current scale-in glass slide-up" style={{ 
          padding: "3rem", 
          borderRadius: "32px",
          border: "2px solid rgba(245, 158, 11, 0.2)",
          background: "linear-gradient(135deg, rgba(8, 7, 24, 0.9) 0%, rgba(28, 24, 54, 0.9) 100%)",
          boxShadow: "0 0 50px rgba(245, 158, 11, 0.1), 0 20px 40px rgba(0,0,0,0.5)"
        }}>
          <div>
            <p style={{ color: "var(--acc)", fontSize:".85rem", fontWeight:900, textTransform:"uppercase", letterSpacing:".2em", marginBottom:"1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--acc)", boxShadow: "0 0 10px var(--acc)" }} />
              {current.status==="serving" ? "Service en cours" : "Ticket appelé · Guichet " + current.counter}
            </p>
            <div className="agent-number" style={{ 
              fontSize: "7rem", 
              fontWeight: 900, 
              color: "#fff", 
              lineHeight: 1, 
              letterSpacing: "-6px", 
              textShadow: "0 0 30px rgba(245, 158, 11, 0.4)" 
            }}>
              {current.number}
            </div>
            <p style={{ marginTop:"1.5rem", fontSize:"1.8rem", fontWeight:800, color: "#fff" }}>{current.user_name}</p>
            <div className="flex gap-md" style={{ marginTop: "1rem" }}>
              <span className="badge badge-info" style={{ fontSize: "0.8rem", padding: "6px 12px" }}>{current.service_name}</span>
              {current.phone && <span style={{ color: "var(--muted)", fontWeight: 600 }}>📱 {current.phone}</span>}
            </div>
          </div>
          <div style={{ display:"flex", gap:"1rem", flexDirection: "column", minWidth: "240px" }}>
            <button className="btn btn-success" style={{ padding: "1.25rem", borderRadius: "16px", fontSize: "1rem" }} onClick={() => doComplete(current.id)}>
              ✅ TERMINER LE SERVICE
            </button>
            <button className="btn btn-danger" style={{ padding: "1rem", borderRadius: "16px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)" }}
              onClick={() => doAbsent(current.id)}>⚠️ MARQUER ABSENT</button>
            <button className="btn btn-outline" style={{ padding: "1rem", borderRadius: "16px" }} onClick={() => fetchAll({})}>
              🔄 ACTUALISER
            </button>
          </div>
        </div>
      ) : (
        <div className="agent-current glass slide-up" style={{ padding: "3rem", textAlign: "center", justifyContent: "center", border: "1px dashed var(--border)" }}>
           <div>
              <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>😴</div>
              <h3 style={{ fontWeight: 800, color: "#fff" }}>Aucun ticket en service</h3>
              <p style={{ color: "var(--muted)" }}>Appelez le prochain ticket de la liste ci-dessous.</p>
           </div>
        </div>
      )}

      {/* Gestion de la Queue */}
      <div className="flex justify-between items-center wrap gap-md" style={{ marginBottom:"1.25rem" }}>
        <div style={{ display: "flex", gap: "1rem", flex: 1, minWidth: "300px" }}>
          <div className="tabs glass" style={{ width:"fit-content" }}>
            {[["active","En cours"],["done","Terminés"],["all","Tous"]].map(([f,l]) => (
              <button key={f} className={`tab ${filter===f?"active":""}`} onClick={() => setFilter(f)}>{l}</button>
            ))}
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <input 
              className="input glass" 
              placeholder="🔍 Rechercher client ou ticket..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ borderRadius: "12px", padding: "0.6rem 1rem", border: "1px solid var(--border)" }}
            />
          </div>
        </div>
        <div className="text-muted font-title" style={{ fontSize: ".85rem", fontWeight: 700 }}>
          {displayed.length} TICKETS TROUVÉS
        </div>
      </div>

      {/* Table Section */}
      {loading ? (
        <div className="skeleton" style={{ height: "300px" }}></div>
      ) : error ? (
        <div className="card glass" style={{ color:"var(--danger)", textAlign:"center" }}>{error}</div>
      ) : displayed.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📭</div><p>Aucun ticket dans cette catégorie</p></div>
      ) : (
        <div className="card glass" style={{ padding:0, overflow:"hidden" }}>
          <table className="data-table">
            <thead>
              <tr><th>Ticket</th><th>Client</th><th>Service</th><th>Statut</th><th>Attente</th><th>Action</th></tr>
            </thead>
            <tbody>
              {displayed.map(t => {
                const wait = t.created_at ? Math.round((Date.now()-new Date(t.created_at))/60000) : 0;
                return (
                  <tr key={t.id}>
                    <td>
                      <span className="font-title" style={{ fontSize:"1.1rem", fontWeight:800, color:"var(--p)" }}>{t.number}</span>
                      {t.priority > 0 && <span className="badge badge-warning" style={{ marginLeft:6 }}>PRIO</span>}
                    </td>
                    <td>
                      <div style={{ fontWeight:700 }}>{t.user_name}</div>
                    </td>
                    <td style={{ fontSize:".82rem", color:"var(--muted)" }}>{t.service_name}</td>
                    <td><span className={`badge badge-${t.status}`}>{STATUS_LABELS[t.status]}</span></td>
                    <td style={{ fontWeight: 600, color: wait > 15 ? "var(--danger)" : "inherit" }}>
                      {formatWait(t.created_at)}
                    </td>
                    <td>
                      <div style={{ display:"flex", gap:".4rem" }}>
                        {t.status==="waiting" && (
                          <button className="btn btn-primary btn-sm" onClick={() => doCall(t.id)}>📢 Appeler</button>
                        )}
                        {["called","serving"].includes(t.status) && (
                          <button className="btn btn-success btn-sm" onClick={() => doComplete(t.id)}>✅</button>
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
