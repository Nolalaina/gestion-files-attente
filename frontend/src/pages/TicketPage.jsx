import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import TicketForm from "../components/TicketForm";
import api from "../services/api";

const STATUS_LABELS = {
  waiting: "En attente", called: "Appelé", serving: "En service",
  done: "Terminé", absent: "Absent", cancelled: "Annulé"
};

export default function TicketPage() {
  const { user } = useAuth();
  const { addToast } = useNotification();
  const [myTickets, setMyTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(true);

  const fetchMyTickets = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await api.get("/tickets/my");
      setMyTickets(data.data || []);
    } catch {
      // Non bloquant
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTickets();
    // Refresh toutes les 15s
    const id = setInterval(fetchMyTickets, 15000);
    return () => clearInterval(id);
  }, [user]);

  const handleCreated = (ticket) => {
    setMyTickets(prev => [ticket, ...prev]);
    setShowForm(false);
  };

  const activeTicket = myTickets.find(t => ["waiting", "called", "serving"].includes(t.status));

  return (
    <div className="fade-in">
      {/* Active Ticket Alert */}
      {activeTicket && (
        <div className="card glass card-primary" style={{ marginBottom: "2rem", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,.08)" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <p style={{ opacity: .8, fontSize: ".75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: ".5rem" }}>
                {activeTicket.status === "called" ? "🔊 C'EST VOTRE TOUR !" : activeTicket.status === "serving" ? "🔴 EN SERVICE" : "⏳ EN ATTENTE"}
              </p>
              <div className="font-title" style={{ fontSize: "4rem", fontWeight: 800, lineHeight: 1 }}>{activeTicket.number}</div>
              <p style={{ marginTop: ".5rem", fontSize: "1rem", fontWeight: 600 }}>
                {activeTicket.service_name}
                {activeTicket.counter && ` — Guichet ${activeTicket.counter}`}
              </p>
            </div>
            <div>
              <span className={`badge badge-${activeTicket.status}`} style={{ fontSize: ".85rem", padding: ".4rem 1rem" }}>
                {STATUS_LABELS[activeTicket.status]}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Toggle between Form and History */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", alignItems: "center" }}>
        <div className="tabs glass" style={{ width: "fit-content" }}>
          <button className={`tab ${showForm ? "active" : ""}`} onClick={() => setShowForm(true)}>🎫 Nouveau Ticket</button>
          {user && (
            <button className={`tab ${!showForm ? "active" : ""}`} onClick={() => setShowForm(false)}>📋 Mes Tickets</button>
          )}
        </div>
      </div>

      {/* Ticket Form */}
      {showForm && <TicketForm onCreated={handleCreated} />}

      {/* My Tickets List */}
      {!showForm && user && (
        <div>
          <div className="page-header" style={{ marginBottom: "1.5rem" }}>
            <h2>📋 Mes Tickets du Jour</h2>
            <p>Historique de vos tickets pour aujourd'hui</p>
          </div>

          {loading ? (
            <div className="skeleton" style={{ height: "200px" }} />
          ) : myTickets.length > 0 ? (
            <div className="grid grid-1 stagger" style={{ gap: "1rem" }}>
              {myTickets.map(t => (
                <div key={t.id} className="card card-lift glass" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                    <div className="font-title" style={{ fontSize: "2rem", fontWeight: 800, color: "var(--p)", minWidth: 80 }}>
                      {t.number}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{t.service_name || `Service #${t.service_id}`}</div>
                      <div style={{ fontSize: ".82rem", color: "var(--muted)" }}>
                        {new Date(t.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        {t.user_name && ` · ${t.user_name}`}
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
              <p>Aucun ticket pour aujourd'hui</p>
              <button className="btn btn-primary" onClick={() => setShowForm(true)} style={{ marginTop: "1rem" }}>
                🎫 Prendre un ticket
              </button>
            </div>
          )}
        </div>
      )}

      {/* Non-connected notice */}
      {!showForm && !user && (
        <div className="empty-state">
          <div className="empty-icon">🔑</div>
          <p>Connectez-vous pour voir vos tickets</p>
        </div>
      )}
    </div>
  );
}
