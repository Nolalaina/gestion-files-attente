import { useState, useEffect } from "react";
import api from "../services/api";
import { useQueue } from "../hooks/useQueue";

function ServiceQueue({ service }) {
  const { waiting, called, loading } = useQueue(service.id);
  const current = called[0];

  if (loading) return (
    <div className="card">
      <div className="skeleton" style={{ height:14, width:"60%", marginBottom:12 }} />
      <div className="skeleton" style={{ height:120, marginBottom:12 }} />
      <div className="skeleton" style={{ height:40 }} />
    </div>
  );

  return (
    <div className="card card-lift fade-in">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
        <h2 className="font-title" style={{ fontSize:"1rem", fontWeight:800, color:"var(--p)" }}>
          {service.prefix} — {service.name}
        </h2>
        <span className="badge badge-info">{waiting.length} en attente</span>
      </div>

      {current ? (
        <div className="queue-now">
          <div className="queue-now-label">🔔 Appelé — Guichet {current.counter}</div>
          <div className="big-number">{current.number}</div>
          <div style={{ opacity:.85, marginTop:".35rem", fontSize:".9rem" }}>{current.user_name}</div>
        </div>
      ) : (
        <div style={{ background:"var(--surface2)", borderRadius:"var(--r-sm)", padding:".9rem",
          textAlign:"center", color:"var(--subtle)", marginBottom:"1rem", fontSize:".85rem" }}>
          Aucun ticket en cours
        </div>
      )}

      {waiting.length > 0 && (
        <>
          <p style={{ fontWeight:700, marginBottom:".6rem", fontSize:".78rem", color:"var(--muted)", textTransform:"uppercase", letterSpacing:".05em" }}>
            Prochains
          </p>
          <div className="chip-row">
            {waiting.slice(0,10).map(t => (
              <div key={t.id} className="queue-chip" title={t.user_name}>{t.number}</div>
            ))}
            {waiting.length > 10 && (
              <div className="queue-chip" style={{ color:"var(--muted)" }}>+{waiting.length-10}</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function QueueDisplay() {
  const [services, setServices] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    api.get("/services")
      .then(({ data }) => { setServices(data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="fade-in">
      <div className="page-header flex justify-between items-center wrap gap-md">
        <div>
          <h1>📺 Affichage des files</h1>
          <p>Mise à jour en temps réel via Socket.IO</p>
        </div>
        <span className="badge badge-success">● Live</span>
      </div>
      <div className="grid grid-2">
        {loading
          ? [1,2,3,4].map(i => <div key={i} className="card"><div className="skeleton" style={{ height:200 }} /></div>)
          : services.map(s => <ServiceQueue key={s.id} service={s} />)
        }
      </div>
    </div>
  );
}
