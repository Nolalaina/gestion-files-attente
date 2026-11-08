import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import api from "../services/api";
import StatCard from "../components/StatCard";
import Icon from "../components/Icon";
import { useNotification } from "../context/NotificationContext";

const CHART_COLORS = {
  accent: "var(--color-accent)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: <strong>{entry.value}</strong>
        </p>
      ))}
    </div>
  );
};

export default function AdminPage() {
  const { addToast, socket } = useNotification();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [services, setServices] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [allTickets, setAllTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [searchCriteria, setSearchCriteria] = useState({ status: "", search: "" });

  const reload = () => {
    setLoading(true);
    const searchParams = new URLSearchParams(searchCriteria).toString();
    Promise.all([
      api.get("/stats"),
      api.get("/stats/history?days=7"),
      api.get(`/admin/users?${searchParams}`),
      api.get("/admin/services"),
      api.get("/admin/logs?limit=50"),
      api.get("/admin/tickets?limit=100"),
      api.get("/admin/accounts?limit=100"),
    ])
      .then(([statsResponse, historyResponse, usersResponse, servicesResponse, logsResponse, ticketsResponse, accountsResponse]) => {
        setStats(statsResponse?.data?.data);
        setHistory(
          Array.isArray(historyResponse?.data?.data)
            ? historyResponse.data.data.map((entry) => {
                try {
                  return {
                    ...entry,
                    date: entry.date
                      ? new Date(entry.date).toLocaleDateString("fr-FR", {
                          weekday: "short",
                          day: "numeric",
                        })
                      : "N/A",
                  };
                } catch {
                  return { ...entry, date: "Erreur" };
                }
              })
            : []
        );
        setUsers(usersResponse?.data?.data || []);
        setServices(servicesResponse?.data?.data || []);
        setLogs(logsResponse?.data?.data || []);
        setAllTickets(ticketsResponse?.data?.data || []);
        setAccounts(accountsResponse?.data?.data || []);
      })
      .catch((error) => {
        console.error("ADMIN_LOAD_ERROR:", error);
        addToast(`Erreur ${error.response?.status || "réseau"}: ${error.message}`, "error");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
    if (socket) {
      socket.emit("join_admin");
      socket.on("ticket:created", reload);
      socket.on("ticket:called", reload);
      socket.on("ticket:done", reload);
      socket.on("ticket:absent", reload);
    }
    return () => {
      if (socket) {
        socket.off("ticket:created", reload);
        socket.off("ticket:called", reload);
        socket.off("ticket:done", reload);
        socket.off("ticket:absent", reload);
      }
    };
  }, [socket]);

  const toggleUser = async (id) => {
    try {
      await api.patch(`/users/${id}/toggle`);
      setUsers((current) => current.map((user) => (user.id === id ? { ...user, active: user.active ? 0 : 1 } : user)));
      addToast("Statut mis à jour", "success");
    } catch {
      addToast("Erreur", "error");
    }
  };

  const simulateClient = async () => {
    try {
      if (services.length === 0) return;
      await api.post("/tickets", { service_id: services[0].id, user_name: "Client simulé" });
      addToast("Nouveau client simulé", "success");
      reload();
    } catch {
      addToast("Erreur de simulation", "error");
    }
  };

  const resetBank = async () => {
    if (!window.confirm("Voulez-vous réinitialiser toute la banque ?")) return;
    const confirmation = window.prompt("Tapez RESET_ALL pour confirmer");
    if (confirmation !== "RESET_ALL") return;

    try {
      await api.post("/admin/reset", { confirm: "RESET_ALL" });
      addToast("Banque réinitialisée", "success");
      reload();
    } catch {
      addToast("Erreur de réinitialisation", "error");
    }
  };

  const doReassign = async (ticketId, newServiceId) => {
    try {
      await api.patch(`/tickets/${ticketId}/reassign`, { new_service_id: newServiceId });
      addToast("Ticket réaffecté", "success");
      reload();
    } catch {
      addToast("Erreur de réaffectation", "error");
    }
  };

  if (loading) {
    return (
      <div className="loading-shell">
        <span className="spinner spinner-lg" aria-label="Chargement" />
      </div>
    );
  }

  const global = stats?.global;
  const TABS = [
    { id: "overview", label: "Aperçu", icon: "chart" },
    { id: "queue", label: "File globale", icon: "ticket" },
    { id: "agent_view", label: "Assistant agent", icon: "settings" },
    { id: "history", label: "Historique", icon: "calendar" },
    { id: "services", label: "Services", icon: "list" },
    { id: "users", label: "Agents", icon: "users" },
    { id: "bank", label: "Banque", icon: "wallet" },
    { id: "logs", label: "Journaux", icon: "logs" },
  ];

  return (
    <div className="fade-in">
      <div className="app-header">
        <div className="app-header-top">
          <div>
            <div className="app-header-welcome">Console admin</div>
            <div className="app-header-name">
              {new Date().toLocaleDateString("fr-FR", { dateStyle: "medium" })}
            </div>
          </div>
          <div className="flex gap-sm wrap">
            <button className="btn btn-secondary btn-sm" onClick={simulateClient}>
              <Icon name="plus" size={15} />
              Simuler
            </button>
            <button className="btn btn-secondary btn-icon" onClick={reload} aria-label="Actualiser">
              <Icon name="refresh" size={17} />
            </button>
            <button className="btn btn-danger btn-sm" onClick={resetBank}>
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      <div className="app-content-overlap">
        <div className="grid grid-4 stagger">
          <StatCard label="Tickets au total" value={global?.total ?? 0} icon="ticket" tone="accent" />
          <StatCard label="Clients en attente" value={global?.waiting ?? 0} icon="clock" tone="warning" />
          <StatCard label="Services terminés" value={global?.done ?? 0} icon="check-circle" tone="success" />
          <StatCard
            label="Temps moyen"
            value={`${global?.avg_wait_min ?? 0} min`}
            icon="clock"
            tone="info"
          />
        </div>

        <div className="tabs admin-tabs">
          {TABS.map((item) => (
            <button
              key={item.id}
              className={`tab ${tab === item.id ? "active" : ""}`}
              onClick={() => setTab(item.id)}
              aria-pressed={tab === item.id}
            >
              <Icon name={item.icon} size={15} />
              {item.label}
            </button>
          ))}
        </div>

        {["history", "users", "logs", "queue", "bank"].includes(tab) ? (
          <div className="filter-bar">
            <label className="search-field">
              <Icon name="search" size={16} />
              <span className="sr-only">Rechercher</span>
              <input
                type="text"
                placeholder="Rechercher"
                value={searchCriteria.search}
                onChange={(event) =>
                  setSearchCriteria({ ...searchCriteria, search: event.target.value })
                }
              />
            </label>
            <button className="btn btn-primary btn-sm" onClick={reload}>Rechercher</button>
          </div>
        ) : null}

        {tab === "overview" ? (
          <div className="grid grid-2 stagger">
            <div className="card">
              <h3 className="chart-title">Répartition par service</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats?.by_service || []} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-rule)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "var(--color-muted)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "var(--color-muted)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-wash)" }} />
                  <Bar
                    dataKey="total"
                    name="Total"
                    fill={CHART_COLORS.accent}
                    radius={[6, 6, 0, 0]}
                    barSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="chart-title">Activité horaire</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={stats?.hourly_distribution || []} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-rule)" vertical={false} />
                  <XAxis
                    dataKey="hour"
                    tickFormatter={(hour) => `${hour}h`}
                    tick={{ fontSize: 10, fill: "var(--color-muted)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "var(--color-muted)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} labelFormatter={(hour) => `${hour}h00`} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Tickets"
                    stroke={CHART_COLORS.accent}
                    strokeWidth={3}
                    dot={{ r: 3, fill: CHART_COLORS.accent }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : null}

        {tab === "queue" ? (
          <div className="card table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Client</th>
                  <th>Service actuel</th>
                  <th>Statut</th>
                  <th>Réaffecter</th>
                </tr>
              </thead>
              <tbody>
                {allTickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td><span className="ticket-code">{ticket.number}</span></td>
                    <td>{ticket.user_name}</td>
                    <td><span className="badge badge-info">{ticket.service_name}</span></td>
                    <td><span className={`badge badge-${ticket.status}`}>{ticket.status}</span></td>
                    <td>
                      <select
                        className="input"
                        onChange={(event) => doReassign(ticket.id, event.target.value)}
                        defaultValue=""
                      >
                        <option value="" disabled>Choisir un service</option>
                        {services
                          .filter((service) => service.id !== ticket.service_id)
                          .map((service) => (
                            <option key={service.id} value={service.id}>{service.name}</option>
                          ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {tab === "agent_view" ? (
          <div className="card">
            <div className="empty-icon">
              <Icon name="settings" size={28} />
            </div>
            <h2 className="chart-title">Outils de guichet</h2>
            <p className="text-muted" style={{ marginBottom: "var(--space-lg)" }}>
              Visualisez et pilotez les tickets en cours comme depuis un guichet.
            </p>
            <div className="grid grid-2">
              <div className="card-flat">
                <h4>Appeler le suivant</h4>
                <p className="text-muted">Force l’appel du prochain ticket en attente.</p>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: "var(--space-md)" }}
                  onClick={() => {
                    if (services.length > 0) {
                      api.patch(`/queues/${services[0].id}/assign`, { counter: 1 })
                        .then(() => {
                          addToast("Appel forcé", "success");
                          reload();
                        })
                        .catch(() => addToast("Impossible d'appeler le ticket", "error"));
                    }
                  }}
                >
                  Appeler maintenant
                </button>
              </div>
              <div className="card-flat">
                <h4>Gestion des guichets</h4>
                <p className="text-muted">Affectez les agents aux guichets actifs.</p>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: "var(--space-md)" }}
                >
                  Gérer
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {tab === "history" ? (
          <div className="card">
            <h3 className="chart-title">Performance hebdomadaire</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={history} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-rule)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--color-muted)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--color-muted)" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Total" fill={CHART_COLORS.accent} radius={[6, 6, 0, 0]} />
                <Bar dataKey="done" name="Traités" fill={CHART_COLORS.success} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : null}

        {tab === "services" ? (
          <div className="card table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Préfixe</th>
                  <th>Guichets</th>
                  <th>Durée moyenne</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id}>
                    <td><strong>{service.name}</strong></td>
                    <td><span className="badge badge-info">{service.prefix}</span></td>
                    <td>{service.max_counters}</td>
                    <td>{service.avg_duration} min</td>
                    <td>
                      <span className={`badge ${service.active ? "badge-success" : "badge-cancelled"}`}>
                        {service.active ? "Ouvert" : "Fermé"}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-icon" aria-label="Modifier le service">
                        <Icon name="settings" size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {tab === "users" ? (
          <div className="card table-card">
            <div className="table-toolbar">
              <button className="btn btn-primary btn-sm">
                <Icon name="plus" size={15} />
                Ajouter un agent
              </button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Prise en charge</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td><strong>{user.name}</strong></td>
                    <td className="text-muted">{user.email}</td>
                    <td>
                      <span className={`badge ${user.role === "admin" ? "badge-serving" : "badge-called"}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>{user.ticket_count || 0} tickets</td>
                    <td>
                      <span className={`badge ${user.active ? "badge-success" : "badge-cancelled"}`}>
                        {user.active ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-sm">
                        <button
                          className="btn btn-secondary btn-icon"
                          onClick={() => toggleUser(user.id)}
                          aria-label={user.active ? "Désactiver l'agent" : "Activer l'agent"}
                        >
                          <Icon name={user.active ? "x-circle" : "check-circle"} size={16} />
                        </button>
                        <button className="btn btn-secondary btn-icon" aria-label="Modifier l'agent">
                          <Icon name="settings" size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {tab === "bank" ? (
          <div className="card table-card">
            <div className="table-toolbar table-toolbar-between">
              <h3 className="chart-title">Comptes bancaires</h3>
              <button className="btn btn-secondary btn-sm" onClick={reload}>
                <Icon name="refresh" size={15} />
                Actualiser
              </button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Numéro</th>
                  <th>Propriétaire</th>
                  <th>Type</th>
                  <th className="text-right">Solde</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id}>
                    <td><span className="account-number table-number">{account.account_number}</span></td>
                    <td>
                      <strong>{account.owner_name}</strong>
                      <div className="text-muted">{account.email}</div>
                    </td>
                    <td><span className="badge badge-info">{account.account_type}</span></td>
                    <td className="text-right">
                      <strong>{Number(account.balance || 0).toFixed(2)} {account.currency || "MGA"}</strong>
                    </td>
                    <td>
                      <span className={`badge ${account.status === "ACTIVE" ? "badge-success" : "badge-warning"}`}>
                        {account.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {accounts.length === 0 ? (
              <div className="empty-state">
                <h3>Aucun compte bancaire</h3>
                <p>Les comptes des utilisateurs apparaîtront ici.</p>
              </div>
            ) : null}
          </div>
        ) : null}

        {tab === "logs" ? (
          <div className="card table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Utilisateur</th>
                  <th>Action</th>
                  <th>Détails</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="text-muted">
                      {new Date(log.created_at).toLocaleString("fr-FR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td><strong>{log.user_name || "Système"}</strong></td>
                    <td><span className="badge badge-info">{log.action}</span></td>
                    <td>{log.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
