import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import TicketForm from "../components/TicketForm";
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

export default function TicketPage() {
  const { user } = useAuth();
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
      // Non blocking for the ticket form.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTickets();
    const id = setInterval(fetchMyTickets, 15000);
    return () => clearInterval(id);
  }, [user]);

  const handleCreated = (ticket) => {
    setMyTickets((current) => [ticket, ...current]);
    setShowForm(false);
  };

  const activeTicket = myTickets.find((ticket) => ["waiting", "called", "serving"].includes(ticket.status));

  return (
    <div className="fade-in">
      <div className="app-header">
        <div className="app-header-top">
          <div>
            <div className="app-header-welcome">Espace usager</div>
            <div className="app-header-name">Prendre un ticket</div>
          </div>
          <Icon name="ticket" size={28} />
        </div>
      </div>

      <div className="app-content-overlap">
        {activeTicket ? (
          <div className="ticket-alert slide-up">
            <div className="ticket-alert-head">
              <span className="ticket-status">
                {activeTicket.status === "called" ? "Votre tour est appelé" : "Ticket en cours"}
              </span>
              <span className={`badge badge-${activeTicket.status}`}>
                {STATUS_LABELS[activeTicket.status]}
              </span>
            </div>
            <div className="ticket-alert-number">{activeTicket.number}</div>
            <p className="ticket-alert-meta">
              {activeTicket.service_name}
              {activeTicket.counter ? `, guichet ${activeTicket.counter}` : ""}
            </p>
          </div>
        ) : null}

        <div className="tabs" role="tablist" aria-label="Tickets">
          <button
            className={`tab ${showForm ? "active" : ""}`}
            onClick={() => setShowForm(true)}
            role="tab"
            aria-selected={showForm}
          >
            <Icon name="plus" size={15} />
            Nouveau
          </button>
          {user ? (
            <button
              className={`tab ${!showForm ? "active" : ""}`}
              onClick={() => setShowForm(false)}
              role="tab"
              aria-selected={!showForm}
            >
              <Icon name="list" size={15} />
              Historique
            </button>
          ) : null}
        </div>

        {showForm ? (
          <div className="slide-up">
            <TicketForm onCreated={handleCreated} />
          </div>
        ) : null}

        {!showForm && user ? (
          <div className="slide-up">
            <div className="section-head">
              <h2>Mes tickets du jour</h2>
            </div>

            {loading ? (
              <div className="skeleton" style={{ height: 200 }} />
            ) : myTickets.length > 0 ? (
              <div className="list-stack stagger">
                {myTickets.map((ticket) => (
                  <div key={ticket.id} className="ticket-row">
                    <span className="ticket-row-number">{ticket.number}</span>
                    <div className="ticket-row-main">
                      <strong>{ticket.service_name || `Service ${ticket.service_id}`}</strong>
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
                <h3>Aucun ticket aujourd’hui</h3>
                <p>Prenez votre premier ticket pour suivre votre place en direct.</p>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                  Prendre un ticket
                </button>
              </div>
            )}
          </div>
        ) : null}

        {!showForm && !user ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Icon name="lock" size={28} />
            </div>
            <h3>Connectez-vous</h3>
            <p>Votre historique de tickets est lié à votre compte.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
