import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useTickets } from "../hooks/useTickets";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import StatCard from "../components/StatCard";
import Icon from "../components/Icon";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

const STATUS_LABELS = {
  waiting: "En attente",
  called: "Appelé",
  serving: "En service",
  done: "Terminé",
  absent: "Absent",
  cancelled: "Annulé",
};

function formatWait(createdAt) {
  if (!createdAt) return "-";
  const minutes = Math.round((Date.now() - new Date(createdAt)) / 60000);
  if (minutes < 1) return "moins d'une minute";
  return `${minutes} min`;
}

export default function AgentPage() {
  const { user } = useAuth();
  const { addToast } = useNotification();
  const {
    tickets,
    loading,
    error,
    setTickets,
    fetchAll,
    callTicket,
    completeTicket,
    absentTicket,
    recallTicket,
  } = useTickets();
  const [counter, setCounter] = useState(1);
  const [filter, setFilter] = useState("active");
  const socketRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAll({}).catch(() => {});
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    socket.emit("join_admin");
    socket.on("ticket:created", (ticket) => setTickets((current) => [ticket, ...current]));
    socket.on("ticket:called", (ticket) => setTickets((current) => current.map((item) => (item.id === ticket.id ? ticket : item))));
    socket.on("ticket:done", (ticket) => setTickets((current) => current.map((item) => (item.id === ticket.id ? ticket : item))));
    socket.on("ticket:absent", (ticket) => setTickets((current) => current.map((item) => (item.id === ticket.id ? ticket : item))));
    socket.on("ticket:removed", (id) => setTickets((current) => current.filter((item) => item.id !== parseInt(id))));
    return () => socket.disconnect();
  }, [fetchAll, setTickets]);

  const handle = (fn, message, type = "success") => async (...args) => {
    try {
      await fn(...args);
      addToast(message, type);
    } catch {
      addToast("Erreur lors de l'opération", "error");
    }
  };

  const doCall = handle((id) => callTicket(id, counter), "Ticket appelé.");
  const doComplete = handle(completeTicket, "Ticket terminé.", "info");
  const doAbsent = handle(absentTicket, "Ticket marqué absent.", "warning");
  const doRecall = handle(recallTicket, "Ticket rappelé.", "success");

  const displayed = tickets.filter((ticket) => {
    const matchesFilter =
      filter === "active"
        ? ["waiting", "called", "serving"].includes(ticket.status)
        : filter === "done"
          ? ["done", "absent"].includes(ticket.status)
          : true;

    const matchesSearch =
      searchTerm === "" ||
      ticket.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user_name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const current = tickets.find((ticket) => ticket.status === "called" || ticket.status === "serving");
  const waitingCount = tickets.filter((ticket) => ticket.status === "waiting").length;

  return (
    <div className="fade-in">
      <div className="page-header flex justify-between items-center wrap gap-md">
        <div>
          <h1>Console agent</h1>
          <p>{user?.name}, guichet {counter}</p>
        </div>
        <div className="counter-picker">
          <span className="text-muted">Guichet</span>
          <div className="tabs" role="group" aria-label="Choisir le guichet">
            {[1, 2, 3, 4, 5].map((number) => (
              <button
                key={number}
                onClick={() => setCounter(number)}
                className={`tab ${counter === number ? "active" : ""}`}
                aria-pressed={counter === number}
              >
                {number}
              </button>
            ))}
          </div>
          <button className="btn btn-secondary btn-icon" onClick={() => fetchAll({})} aria-label="Actualiser">
            <Icon name="refresh" size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-3 stagger">
        <StatCard label="Tickets en attente" value={waitingCount} icon="clock" tone="warning" />
        <StatCard
          label="Traités aujourd'hui"
          value={tickets.filter((ticket) => ticket.status === "done").length}
          icon="check-circle"
          tone="success"
        />
        <StatCard label="Guichet actif" value={counter} icon="bank" tone="accent" />
      </div>

      {current ? (
        <div className="agent-current scale-in">
          <div>
            <p className="agent-current-label">
              <span className="live-dot" aria-hidden="true" />
              {current.status === "serving" ? "Service en cours" : `Ticket appelé, guichet ${current.counter}`}
            </p>
            <div className="agent-number">{current.number}</div>
            <p className="agent-current-name">{current.user_name}</p>
            <div className="flex gap-md wrap agent-current-meta">
              <span className="badge badge-info">{current.service_name}</span>
              {current.phone ? (
                <span className="inline-meta">
                  <Icon name="phone" size={14} />
                  {current.phone}
                </span>
              ) : null}
            </div>
          </div>
          <div className="agent-actions">
            <button className="btn btn-success" onClick={() => doComplete(current.id)}>
              <Icon name="check" size={16} />
              Terminer le service
            </button>
            <button className="btn btn-danger" onClick={() => doAbsent(current.id)}>
              <Icon name="x" size={16} />
              Marquer absent
            </button>
            <button className="btn btn-outline" onClick={() => fetchAll({})}>
              <Icon name="refresh" size={16} />
              Actualiser
            </button>
          </div>
        </div>
      ) : (
        <div className="agent-current agent-idle">
          <div>
            <div className="empty-icon">
              <Icon name="queue" size={28} />
            </div>
            <h3>Aucun ticket en service</h3>
            <p>Appelez le prochain ticket de la liste.</p>
          </div>
        </div>
      )}

      <div className="filter-bar">
        <div className="tabs" role="group" aria-label="Filtrer les tickets">
          {[["active", "En cours"], ["done", "Terminés"], ["all", "Tous"]].map(([value, label]) => (
            <button
              key={value}
              className={`tab ${filter === value ? "active" : ""}`}
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
            >
              {label}
            </button>
          ))}
        </div>

        <label className="search-field">
          <Icon name="search" size={16} />
          <span className="sr-only">Rechercher un client ou un ticket</span>
          <input
            type="text"
            placeholder="Rechercher un client ou un ticket"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>

        <span className="filter-count">{displayed.length} tickets</span>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 300 }} />
      ) : error ? (
        <div className="inline-alert">{error}</div>
      ) : displayed.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Icon name="ticket" size={28} />
          </div>
          <h3>Aucun ticket dans cette catégorie</h3>
          <p>Modifiez le filtre ou la recherche.</p>
        </div>
      ) : (
        <div className="card table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Client</th>
                <th>Service</th>
                <th>Statut</th>
                <th>Attente</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((ticket) => {
                const wait = ticket.created_at
                  ? Math.round((Date.now() - new Date(ticket.created_at)) / 60000)
                  : 0;
                return (
                  <tr key={ticket.id}>
                    <td>
                      <span className="ticket-code">{ticket.number}</span>
                      {ticket.priority > 0 ? (
                        <span className="badge badge-warning" style={{ marginLeft: 6 }}>Prioritaire</span>
                      ) : null}
                    </td>
                    <td>
                      <strong>{ticket.user_name}</strong>
                    </td>
                    <td className="text-muted">{ticket.service_name}</td>
                    <td>
                      <span className={`badge badge-${ticket.status}`}>{STATUS_LABELS[ticket.status]}</span>
                    </td>
                    <td className={wait > 15 ? "text-danger" : ""}>{formatWait(ticket.created_at)}</td>
                    <td>
                      <div className="flex gap-sm wrap">
                        {ticket.status === "waiting" ? (
                          <button className="btn btn-primary btn-sm" onClick={() => doCall(ticket.id)}>
                            <Icon name="play" size={14} />
                            Appeler
                          </button>
                        ) : null}
                        {["called", "serving"].includes(ticket.status) ? (
                          <button className="btn btn-success btn-sm" onClick={() => doComplete(ticket.id)}>
                            Terminer
                          </button>
                        ) : null}
                        {ticket.status === "absent" ? (
                          <button className="btn btn-secondary btn-sm" onClick={() => doRecall(ticket.id)}>
                            <Icon name="refresh" size={14} />
                            Rappeler
                          </button>
                        ) : null}
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
