import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";
import { useLanguage } from "../context/LanguageContext";

export default function HomePage() {
  const { t } = useLanguage();
  const [services, setServices] = useState([]);
  const [stats,    setStats]    = useState(null);

  useEffect(() => {
    api.get("/services").then(({ data }) => setServices(data.data)).catch(() => {});
    api.get("/stats").then(({ data }) => setStats(data.data)).catch(() => {});
  }, []);

  const features = [
    { icon: "🎫", title: t("feat_ticket_title") || "Ticket en ligne",     desc: t("feat_ticket_desc") || "Prenez votre tour sans faire la queue physique.",  link: "/ticket",  cta: t("feat_ticket_cta") || "Prendre un ticket" },
    { icon: "📺", title: t("feat_display_title") || "Affichage temps réel", desc: t("feat_display_desc") || "Suivez l'évolution sur grand écran ou mobile.",     link: "/display", cta: t("feat_display_cta") || "Voir l'affichage"  },
    { icon: "🔔", title: t("feat_notif_title") || "Notifications",        desc: t("feat_notif_desc") || "SMS ou push quand votre tour est proche.",          link: "/ticket",  cta: t("feat_notif_cta") || "S'inscrire"        },
    { icon: "📊", title: t("feat_admin_title") || "Tableau de bord",      desc: t("feat_admin_desc") || "Statistiques et gestion pour les administrateurs.", link: "/admin",   cta: t("feat_admin_cta") || "Accéder"            },
  ];

  return (
    <div className="fade-in">
      {/* Hero */}
      <div className="hero">
        <h1 className="hero-title" dangerouslySetInnerHTML={{ __html: t("home_hero_title") || "La file d'attente,<br /><span>réinventée</span>" }}>
        </h1>
        <p className="hero-sub">
          {t("home_hero_sub") || "Application intelligente de gestion des flux. Tickets en ligne, affichage temps réel, notifications automatiques — pour Madagascar."}
        </p>
        <div className="hero-actions">
          <Link to="/ticket"  className="btn btn-primary"  style={{ fontSize:"1rem", padding:".8rem 2rem" }}>
            🎫 {t("home_btn_ticket") || "Prendre un ticket"}
          </Link>
          <Link to="/display" className="btn btn-ghost" style={{ fontSize:"1rem", padding:".8rem 2rem", borderColor:"rgba(255,255,255,.4)", color:"#fff" }}>
            📺 {t("home_btn_display") || "Affichage live"}
          </Link>
        </div>
      </div>

      {/* Stat rapides */}
      {stats && (
        <div className="grid grid-4 stagger" style={{ marginBottom:"2.5rem" }}>
          {[
            { label: t("stat_tickets_today") || "Tickets aujourd'hui",  value: stats.global?.total   ?? 0, icon:"🎫", color:"var(--p)"      },
            { label: t("stat_waiting") || "En attente",             value: stats.global?.waiting ?? 0, icon:"⏳", color:"var(--warn)"   },
            { label: t("stat_done") || "Traités",                value: stats.global?.done    ?? 0, icon:"✅", color:"var(--acc)"    },
            { label: t("stat_avg_wait") || "Attente moy.",           value: `${stats.global?.avg_wait_min ?? 0} min`, icon:"⏱️", color:"#8b5cf6" },
          ].map(s => (
            <div key={s.label} className="card card-lift">
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-value" style={{ color:s.color, fontSize:"2.2rem" }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Services */}
      {services.length > 0 && (
        <div style={{ marginBottom:"2.5rem" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
            <h2 className="font-title" style={{ fontSize:"1.1rem", fontWeight:800, color:"var(--muted)" }}>
              {t("home_services_title") || "SERVICES DISPONIBLES"}
            </h2>
            <span className="badge badge-success">{services.length} {t("active_status") || "actifs"}</span>
          </div>
          <div className="grid grid-4 stagger">
            {services.map(s => (
              <Link key={s.id} to="/ticket" className="card card-lift" style={{ textDecoration:"none", color:"inherit" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div className="font-title" style={{ fontSize:"2rem", fontWeight:800, color:"var(--p)" }}>{s.prefix}</div>
                  {s.waiting_count > 0 && (
                    <span className="badge badge-waiting">{s.waiting_count}</span>
                  )}
                </div>
                <div style={{ fontWeight:700, marginTop:".5rem", fontSize:".95rem" }}>{s.name}</div>
                <div style={{ fontSize:".78rem", color:"var(--subtle)", marginTop:".2rem" }}>
                  ~{s.avg_duration} min / {t("ticket") || "ticket"}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Features */}
      <div className="grid grid-2 stagger">
        {features.map(f => (
          <Link key={f.title} to={f.link} className="card card-lift" style={{ textDecoration:"none", color:"inherit" }}>
            <div style={{ fontSize:"2.5rem", marginBottom:".75rem" }}>{f.icon}</div>
            <h3 className="font-title" style={{ marginBottom:".5rem", fontWeight:800, fontSize:"1.1rem" }}>{f.title}</h3>
            <p style={{ color:"var(--muted)", fontSize:".88rem", marginBottom:"1rem", lineHeight:1.6 }}>{f.desc}</p>
            <span style={{ color:"var(--p)", fontWeight:600, fontSize:".85rem" }}>{f.cta} →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
