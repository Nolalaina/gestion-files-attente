import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import api from "../services/api";

const STATUS_LABELS = {
  waiting: "En attente", called: "Appelé", serving: "En service",
  done: "Terminé", absent: "Absent", cancelled: "Annulé"
};

export default function UsagerDashboard() {
  const { user } = useAuth();
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
  }, [user]);

  const activeTicket = myTickets.find(t => ["waiting", "called", "serving"].includes(t.status));
  const doneToday = myTickets.filter(t => t.status === "done").length;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Mon Espace <span>Personnel</span></h1>
        <p>Bienvenue, {user?.name}. Suivez vos tickets et gérez vos rendez-vous.</p>
      </div>

      {/* Active Ticket */}
      {activeTicket && (
        <div className="card glass card-primary" style={{ marginBottom: "2rem", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,.08)" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <p style={{ opacity: .8, fontSize: ".75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: ".5rem" }}>
                {activeTicket.status === "called" ? "🔊 C'EST VOTRE TOUR !" : "⏳ EN ATTENTE"}
              </p>
              <div className="font-title" style={{ fontSize: "4.5rem", fontWeight: 800, lineHeight: 1 }}>{activeTicket.number}</div>
              <p style={{ marginTop: ".5rem", fontSize: "1rem", fontWeight: 600 }}>
                {activeTicket.service_name}
                {activeTicket.counter && ` — Guichet ${activeTicket.counter}`}
              </p>
            </div>
            <span className={`badge badge-${activeTicket.status}`} style={{ fontSize: ".85rem", padding: ".4rem 1rem" }}>
              {STATUS_LABELS[activeTicket.status]}
            </span>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-3 stagger" style={{ marginBottom: "2rem" }}>
        <div className="card glass">
          <div className="stat-icon">🎫</div>
          <div className="stat-value" style={{ color: "var(--p)" }}>{myTickets.length}</div>
          <div className="stat-label">Mes tickets aujourd'hui</div>
        </div>
        <div className="card glass">
          <div className="stat-icon">✅</div>
          <div className="stat-value" style={{ color: "var(--acc)" }}>{doneToday}</div>
          <div className="stat-label">Terminés</div>
        </div>
        <div className="card glass">
          <div className="stat-icon">⏱️</div>
          <div className="stat-value" style={{ color: "#8b5cf6" }}>{stats?.global?.avg_wait_min || 0}m</div>
          <div className="stat-label">Attente moyenne</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-2" style={{ marginBottom: "2rem" }}>
        <div className="card card-lift glass" style={{ cursor: "pointer" }} onClick={() => window.location.href = '/ticket'}>
          <div style={{ fontSize: "2rem", marginBottom: ".5rem" }}>🎫</div>
          <div style={{ fontWeight: 800, fontSize: "1rem" }}>Prendre un ticket</div>
          <div style={{ fontSize: ".82rem", color: "var(--muted)", marginTop: ".25rem" }}>Réservez votre place en ligne</div>
        </div>
        <div className="card card-lift glass" style={{ cursor: "pointer" }} onClick={() => window.location.href = '/display'}>
          <div style={{ fontSize: "2rem", marginBottom: ".5rem" }}>📺</div>
          <div style={{ fontWeight: 800, fontSize: "1rem" }}>File en direct</div>
          <div style={{ fontSize: ".82rem", color: "var(--muted)", marginTop: ".25rem" }}>Voir l'état des files</div>
        </div>
      </div>

      {/* Tickets History */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 className="font-title" style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--muted)" }}>
            MES TICKETS DU JOUR
          </h2>
          <span className="badge badge-info">{myTickets.length} tickets</span>
        </div>

        {loading ? (
          <div className="skeleton" style={{ height: "200px" }} />
        ) : myTickets.length > 0 ? (
          <div className="grid grid-1 stagger" style={{ gap: ".75rem" }}>
            {myTickets.map(t => (
              <div key={t.id} className="card card-lift glass" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                  <div className="font-title" style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--p)", minWidth: 80 }}>
                    {t.number}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{t.service_name}</div>
                    <div style={{ fontSize: ".78rem", color: "var(--muted)" }}>
                      Créé à {new Date(t.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
                <span className={`badge badge-${t.status}`}>{STATUS_LABELS[t.status]}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>Vous n'avez pas encore de ticket pour aujourd'hui.</p>
            <button className="btn btn-primary" onClick={() => window.location.href = '/ticket'} style={{ marginTop: "1rem" }}>
              🎫 Prendre un ticket
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
