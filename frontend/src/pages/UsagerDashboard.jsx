import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import StatCard from "../components/StatCard";
import Icon from "../components/Icon";
import api from "../services/api";

const STATUS_LABELS = {
  waiting: "En attente",
  called: "Appelé",
  serving: "En service",
  done: "Terminé",
  absent: "Absent",
  cancelled: "Annulé",
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
        const [ticketResponse, statsResponse] = await Promise.all([
          api.get("/tickets/my"),
          api.get("/stats"),
        ]);
        setMyTickets(ticketResponse.data.data || []);
        setStats(statsResponse.data.data);
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

  const activeTicket = myTickets.find((ticket) => ["waiting", "called", "serving"].includes(ticket.status));
  const doneToday = myTickets.filter((ticket) => ticket.status === "done").length;

  return (
    <div className="fade-in">
      <div className="app-header">
        <div className="app-header-top">
          <div>
            <div className="app-header-welcome">Mon espace</div>
            <div className="app-header-name">{user?.name || "Visiteur"}</div>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              logout();
              window.location.href = "/";
            }}
          >
            <Icon name="logout" size={16} />
            Sortir
          </button>
        </div>
      </div>

      <div className="app-content-overlap">
        {activeTicket ? (
          <div className="ticket-alert slide-up">
            <div className="ticket-alert-head">
              <span className="ticket-status">Ticket actif</span>
              <span className={`badge badge-${activeTicket.status}`}>
                {STATUS_LABELS[activeTicket.status]}
              </span>
            </div>
            <div className="ticket-alert-number">{activeTicket.number}</div>
            <p className="ticket-alert-meta">{activeTicket.service_name}</p>
            {activeTicket.counter ? (
              <p className="ticket-alert-meta">Guichet {activeTicket.counter}</p>
            ) : null}
            {activeTicket.status === "waiting" ? (
              <div className="wait-block">
                <div className="wait-head">
                  <span>Attente estimée</span>
                  <span>{activeTicket.estimated_wait || 5} min</span>
                </div>
                <div className="wait-track">
                  <span className="wait-fill" />
                </div>
                <p className="wait-note">Restez à proximité du guichet.</p>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="grid grid-3 stagger">
          <StatCard label="Tickets du jour" value={myTickets.length} icon="ticket" tone="accent" />
          <StatCard label="Terminés" value={doneToday} icon="check-circle" tone="success" />
          <StatCard
            label="Attente moyenne"
            value={`${stats?.global?.avg_wait_min || 0} min`}
            icon="clock"
            tone="info"
          />
        </div>

        <div className="section-head">
          <h2>Raccourcis</h2>
        </div>
        <div className="quick-grid">
          <Link to="/ticket" className="quick-card">
            <span className="quick-icon"><Icon name="ticket" size={20} /></span>
            <span>
              <strong>Prendre un ticket</strong>
              <span>Réservez votre place en ligne.</span>
            </span>
          </Link>
          <Link to="/display" className="quick-card">
            <span className="quick-icon"><Icon name="queue" size={20} /></span>
            <span>
              <strong>File en direct</strong>
              <span>Suivez le prochain numéro appelé.</span>
            </span>
          </Link>
        </div>

        <div className="section-head">
          <h2>Mes tickets du jour</h2>
        </div>

        {loading ? (
          <div className="skeleton" style={{ height: 150 }} />
        ) : myTickets.length > 0 ? (
          <div className="list-stack stagger">
            {myTickets.map((ticket) => (
              <div key={ticket.id} className="ticket-row">
                <span className="ticket-row-number">{ticket.number}</span>
                <div className="ticket-row-main">
                  <strong>{ticket.service_name}</strong>
                  <span>
                    {new Date(ticket.created_at).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <span className={`badge badge-${ticket.status}`}>
                  {STATUS_LABELS[ticket.status]}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <Icon name="ticket" size={28} />
            </div>
            <h3>Aucun ticket</h3>
            <p>Prenez votre premier ticket du jour.</p>
            <Link to="/ticket" className="btn btn-primary">Prendre un ticket</Link>
          </div>
        )}
      </div>
    </div>
  );
}
