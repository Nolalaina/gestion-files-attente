import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import api from "../services/api";

export default function UsagerDashboard() {
  const { user } = useAuth();
  const { addToast } = useNotification();
  const [myTickets, setMyTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, we'd fetch tickets by user email or ID
    // For now, we fetch current day tickets
    api.get("/tickets?date=" + new Date().toISOString().split('T')[0])
      .then(({ data }) => {
        // Filter those matching user name or email if possible
        const filtered = data.data.filter(t => t.user_name === user.name || t.email === user.email);
        setMyTickets(filtered);
      })
      .catch(() => addToast("Erreur de chargement", "error"))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Mon Espace <span>Personnel</span></h1>
        <p>Bienvenue, {user.name}. Suivez vos tickets et gérez vos rendez-vous.</p>
      </div>

      <div className="grid grid-2">
        {/* Statistics or Status */}
        <div className="card glass card-accent">
          <div className="font-title" style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
            {myTickets.length} Tickets
          </div>
          <p style={{ opacity: 0.8 }}>Tickets enregistrés pour aujourd'hui.</p>
        </div>

        <div className="card glass">
          <div className="font-title" style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Actions Rapides</div>
          <button className="btn btn-primary btn-full" onClick={() => window.location.href='/ticket'}>
            🎫 Prendre un nouveau ticket
          </button>
        </div>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h2 className="font-title" style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Mes Tickets du jour</h2>
        {loading ? (
          <div className="skeleton" style={{ height: "200px" }}></div>
        ) : myTickets.length > 0 ? (
          <div className="grid grid-1 gap-md">
            {myTickets.map(t => (
              <div key={t.id} className="card card-lift glass flex items-center justify-between">
                <div>
                  <div className="badge badge-info">{t.service_name}</div>
                  <div className="font-title" style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0.5rem 0" }}>
                    #{t.number}
                  </div>
                  <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                    Créé à {new Date(t.created_at).toLocaleTimeString([], { hour: '2h-digit', minute: '2h-digit' })}
                  </div>
                </div>
                <div>
                  <span className={`badge badge-${t.status}`}>{t.status.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>Vous n'avez pas encore de ticket pour aujourd'hui.</p>
          </div>
        )}
      </div>
    </div>
  );
}
