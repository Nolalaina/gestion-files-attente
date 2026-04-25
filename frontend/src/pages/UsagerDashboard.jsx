import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import api from "../services/api";

const STATUS_LABELS = {
  waiting: "En attente", called: "Appelé", serving: "En service",
  done: "Terminé", absent: "Absent", cancelled: "Annulé"
};

export default function UsagerDashboard() {
  const { user, logout } = useAuth();
  const { addToast } = useNotification();
  const [myTickets, setMyTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ticketRes, statsRes] = await Promise.all([
          api.get("/tickets/my"),
          api.get("/stats"),
        ]);
        setMyTickets(ticketRes.data.data || []);
        setStats(statsRes.data.data);
      } catch {
        addToast("Erreur de chargement", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const id = setInterval(fetchData, 20000);
    return () => clearInterval(id);
  }, [user, addToast]);

  const activeTicket = myTickets.find(t => ["waiting", "called", "serving"].includes(t.status));
  const doneToday = myTickets.filter(t => t.status === "done").length;

  return (
    <div className="fade-in">
      {/* Header Style Mobile */}
      <div className="app-header">
        <div className="app-header-top">
          <div>
            <div className="app-header-welcome">Mon Espace ✨</div>
            <div className="app-header-name">{user?.name || 'Visiteur'}</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => { logout(); window.location.href='/'; }} 
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 800 }}>
            Sortir
          </button>
        </div>
      </div>

      <div className="app-content-overlap">
        {/* Active Ticket (Style Premium Zen) */}
        {activeTicket && (
          <div className="card glass slide-up" style={{ 
            marginBottom: "2rem", 
            padding: "2rem", 
            borderRadius: "32px",
            background: "linear-gradient(145deg, var(--surface) 0%, var(--surface2) 100%)",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.4), 0 0 20px rgba(16, 185, 129, 0.1)"
          }}>
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <span className="badge badge-info" style={{ padding: "6px 12px", borderRadius: "10px" }}>TICKET ACTIF</span>
                <span className={`badge badge-${activeTicket.status}`} style={{ padding: "6px 12px", borderRadius: "10px", fontWeight: 800 }}>
                  {STATUS_LABELS[activeTicket.status].toUpperCase()}
                </span>
             </div>
             
             <div className="text-center">
                <div className="font-title" style={{ fontSize: "6rem", fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: "-4px", textShadow: "0 0 20px rgba(16, 185, 129, 0.3)" }}>
                   {activeTicket.number}
                </div>
                <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--p)", marginTop: "1rem", letterSpacing: "1px" }}>
                  {activeTicket.service_name.toUpperCase()}
                </div>
                {activeTicket.counter && (
                  <div style={{ fontSize: "1rem", fontWeight: 600, color: "var(--acc)", marginTop: "0.5rem" }}>
                    GUICHET {activeTicket.counter}
                  </div>
                )}
             </div>

             {/* Barre de progression d'attente (Uniquement si en attente) */}
             {activeTicket.status === "waiting" && (
               <div style={{ marginTop: "2.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 700, color: "var(--muted)", marginBottom: "0.5rem" }}>
                    <span>Progression</span>
                    <span>~{activeTicket.estimated_wait || "5"} min</span>
                  </div>
                  <div style={{ height: "8px", background: "rgba(0,0,0,0.3)", borderRadius: "10px", overflow: "hidden" }}>
                    <div className="fade-in" style={{ width: "65%", height: "100%", background: "linear-gradient(90deg, var(--p) 0%, var(--p-mid) 100%)", boxShadow: "0 0 10px var(--p)" }} />
                  </div>
                  <p style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--muted)", marginTop: "1rem" }}>
                    Merci de rester à proximité du guichet.
                  </p>
               </div>
             )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-3 stagger" style={{ marginBottom: "2rem" }}>
          <div className="card glass text-center">
            <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🎫</div>
            <div className="font-title" style={{ fontSize: "1.8rem", fontWeight: 900 }}>{myTickets.length}</div>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Tickets</div>
          </div>
          <div className="card glass text-center">
            <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>✅</div>
            <div className="font-title" style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--acc)" }}>{doneToday}</div>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Terminés</div>
          </div>
          <div className="card glass text-center">
            <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>⏱️</div>
            <div className="font-title" style={{ fontSize: "1.8rem", fontWeight: 900, color: "#8b5cf6" }}>{stats?.global?.avg_wait_min || 0}m</div>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Moy. attente</div>
          </div>
        </div>

        {/* Quick Actions (Mobile Style) */}
        <div style={{ marginBottom: "2rem" }}>
          <h3 style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--muted)", letterSpacing: "1.5px", marginBottom: "1rem" }}>RACCOURCIS</h3>
          <div className="grid grid-2">
            <div className="card card-lift glass" style={{ cursor: "pointer", display: "flex", flexDirecton: "column", alignItems: "center", padding: "1.5rem" }} onClick={() => window.location.href = '/ticket'}>
              <div style={{ width: "48px", height: "48px", borderRadius: "16px", background: "var(--p-lt)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                <span style={{ fontSize: "1.5rem" }}>🎫</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>Prendre un Ticket</div>
            </div>
            <div className="card card-lift glass" style={{ cursor: "pointer", display: "flex", flexDirecton: "column", alignItems: "center", padding: "1.5rem" }} onClick={() => window.location.href = '/display'}>
              <div style={{ width: "48px", height: "48px", borderRadius: "16px", background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                <span style={{ fontSize: "1.5rem" }}>📱</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>File en Direct</div>
            </div>
          </div>
        </div>

        {/* Tickets History List (Mobile Style) */}
        <div>
          <h3 style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--muted)", letterSpacing: "1.5px", marginBottom: "1rem" }}>MES TICKETS DU JOUR</h3>
          {loading ? (
            <div className="skeleton" style={{ height: "150px" }} />
          ) : myTickets.length > 0 ? (
            <div className="flex column gap-sm">
              {myTickets.map(t => (
                <div key={t.id} className="card glass slide-up" style={{ padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: "18px" }}>
                  <div>
                    <div className="font-title" style={{ fontSize: "1.2rem", fontWeight: 900, color: "var(--p)" }}>{t.number}</div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text)", marginTop: "2px" }}>{t.service_name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "2px" }}>
                      {new Date(t.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <div className={`badge badge-${t.status}`} style={{ padding: "4px 10px", borderRadius: "10px" }}>
                    <span style={{ fontSize: "0.65rem", fontWeight: 800 }}>{STATUS_LABELS[t.status]}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card glass text-center" style={{ padding: "3rem", borderRadius: "28px" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📭</div>
              <div style={{ fontWeight: 800, color: "var(--text)" }}>Aucun ticket</div>
              <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.5rem" }}>Prenez votre premier ticket du jour</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

}
