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
      <div className="app-header">
        <div className="app-header-top">
          <div>
            <div className="app-header-welcome">Service Ticket 🎫</div>
            <div className="app-header-name">Prendre un Ticket</div>
          </div>
        </div>
      </div>

      <div className="app-content-overlap">
        {/* Active Ticket Alert */}
        {activeTicket && (
          <div className="card glass slide-up" style={{ marginBottom: "2rem", borderTop: "6px solid var(--p)", padding: "1.5rem 2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>
                {activeTicket.status === "called" ? "🔊 VOTRE TOUR !" : "⏳ TICKET EN COURS"}
              </span>
              <span className={`badge badge-${activeTicket.status}`}>{STATUS_LABELS[activeTicket.status]}</span>
            </div>
            <div className="font-title text-center" style={{ fontSize: "5rem", fontWeight: 900, color: "var(--p)", margin: "0.5rem 0" }}>{activeTicket.number}</div>
            <p className="text-center" style={{ fontWeight: 700, color: "var(--text)" }}>
              {activeTicket.service_name} {activeTicket.counter && ` — Guichet ${activeTicket.counter}`}
            </p>
          </div>
        )}

        {/* Toggle between Form and History */}
        <div className="tabs glass slide-up" style={{ marginBottom: "1.5rem", padding: "0.4rem", borderRadius: "16px", width: "fit-content" }}>
          <button className={`tab ${showForm ? "active" : ""}`} onClick={() => setShowForm(true)}>🎫 Nouveau</button>
          {user && (
            <button className={`tab ${!showForm ? "active" : ""}`} onClick={() => setShowForm(false)}>📋 Historique</button>
          )}
        </div>

        {/* Ticket Form */}
        {showForm && <div className="slide-up"><TicketForm onCreated={handleCreated} /></div>}

        {/* My Tickets List */}
        {!showForm && user && (
          <div className="slide-up">
            <h3 style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--muted)", letterSpacing: "1.5px", marginBottom: "1rem" }}>MES TICKETS DU JOUR</h3>

            {loading ? (
              <div className="skeleton" style={{ height: "200px" }} />
            ) : myTickets.length > 0 ? (
              <div className="flex column gap-sm stagger">
                {myTickets.map(t => (
                  <div key={t.id} className="card glass slide-up" style={{ padding: "1rem 1.25rem", borderRadius: "18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div className="flex items-center gap-md">
                      <div className="font-title" style={{ fontSize: "1.4rem", fontWeight: 900, color: "var(--p)", minWidth: 60 }}>
                        {t.number}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{t.service_name || `Service #${t.service_id}`}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                          {new Date(t.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                    <span className={`badge badge-${t.status}`} style={{ fontSize: "0.65rem" }}>{STATUS_LABELS[t.status]}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card glass text-center" style={{ padding: "3rem", borderRadius: "24px" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📭</div>
                <p style={{ color: "var(--muted)" }}>Aucun ticket pour aujourd'hui</p>
                <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)} style={{ marginTop: "1rem" }}>
                  🎫 Prendre un ticket
                </button>
              </div>
            )}
          </div>
        )}

        {/* Non-connected notice */}
        {!showForm && !user && (
          <div className="card glass text-center slide-up" style={{ padding: "3rem", borderRadius: "24px" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🔑</div>
            <p style={{ color: "var(--muted)" }}>Connectez-vous pour voir vos tickets</p>
          </div>
        )}
      </div>
    </div>
  );
}
