import { useState, useEffect } from "react";
import api from "../services/api";
import { useQueue } from "../hooks/useQueue";
import Icon from "../components/Icon";

function ServiceQueue({ service }) {
  const { waiting, called, loading } = useQueue(service.id);
  const current = called[0];

  if (loading) {
    return (
      <div className="card">
        <div className="skeleton" style={{ height: 14, width: "60%", marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 120, marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 40 }} />
      </div>
    );
  }

  return (
    <div className="card card-lift fade-in">
      <div className="queue-card-head">
        <h2>
          {service.prefix} <span className="text-muted">{service.name}</span>
        </h2>
        <span className="badge badge-info">{waiting.length} en attente</span>
      </div>

      {current ? (
        <div className="queue-now">
          <div className="queue-now-label">
            <Icon name="bell" size={14} />
            Appelé, guichet {current.counter}
          </div>
          <div className="big-number">{current.number}</div>
          <div className="queue-now-name">{current.user_name}</div>
        </div>
      ) : (
        <div className="queue-idle">Aucun ticket en cours</div>
      )}

      {waiting.length > 0 ? (
        <>
          <p className="queue-next-label">Prochains tickets</p>
          <div className="chip-row">
            {waiting.slice(0, 10).map((ticket) => (
              <div key={ticket.id} className="queue-chip" title={ticket.user_name}>
                {ticket.number}
              </div>
            ))}
            {waiting.length > 10 ? (
              <div className="queue-chip queue-chip-more">+{waiting.length - 10}</div>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

export default function QueueDisplay() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/services")
      .then(({ data }) => {
        setServices(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="fade-in">
      <div className="app-header">
        <div className="app-header-top">
          <div>
            <div className="app-header-welcome">Affichage public</div>
            <div className="app-header-name">File en direct</div>
          </div>
          <span className="badge badge-success live-badge">
            <span className="live-dot" aria-hidden="true" />
            Mise à jour automatique
          </span>
        </div>
      </div>

      <div className="app-content-overlap">
        <div className="grid grid-2 stagger">
          {loading ? (
            [1, 2, 3, 4].map((item) => (
              <div key={item} className="card">
                <div className="skeleton" style={{ height: 200 }} />
              </div>
            ))
          ) : (
            services.map((service) => <ServiceQueue key={service.id} service={service} />)
          )}
        </div>
      </div>
    </div>
  );
}
