import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";
import { useLanguage } from "../context/LanguageContext";

/* ──────────────────────────────────────────
   Compteur animé
   ────────────────────────────────────────── */
function AnimatedCounter({ end, duration = 1400, suffix = "" }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!end) return;
    let start = 0;
    const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setVal(end); clearInterval(timer); }
      else setVal(start);
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);
  return <>{val}{suffix}</>;
}

/* ──────────────────────────────────────────
   Carte Service
   ────────────────────────────────────────── */
function ServiceCard({ s }) {
  return (
    <Link to="/ticket" className="card card-lift" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
      {/* Accent bar top */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, borderRadius: "var(--r) var(--r) 0 0", background: "linear-gradient(90deg, var(--p), var(--acc))", opacity: 0.6 }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: ".75rem" }}>
        <div className="font-title" style={{ fontSize: "2.25rem", fontWeight: 800, color: "var(--p-mid)", lineHeight: 1 }}>
          {s.prefix}
        </div>
        {s.waiting_count > 0 && (
          <span className="badge badge-waiting">{s.waiting_count} en attente</span>
        )}
      </div>

      <div style={{ fontWeight: 700, fontSize: ".95rem", marginBottom: ".25rem", color: "var(--text)" }}>{s.name}</div>
      <div style={{ fontSize: ".78rem", color: "var(--muted)" }}>~{s.avg_duration} min / ticket</div>

      <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: ".78rem", color: "var(--acc-mid)", fontWeight: 600 }}>Prendre un ticket</span>
        <span style={{ color: "var(--p-mid)", fontSize: "1.1rem" }}>→</span>
      </div>
    </Link>
  );
}

/* ──────────────────────────────────────────
   Carte Feature
   ────────────────────────────────────────── */
function FeatureCard({ icon, title, desc, link, cta, gradient }) {
  return (
    <Link to={link} className="card card-lift" style={{ textDecoration: "none", color: "inherit", display: "block", overflow: "hidden" }}>
      {/* Fond gradient discret */}
      <div style={{ position: "absolute", inset: 0, background: gradient, opacity: .05, pointerEvents: "none" }} />

      <div style={{ fontSize: "2.5rem", marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, background: "rgba(139, 92, 246, 0.1)", borderRadius: "var(--r-sm)", border: "1px solid rgba(139, 92, 246, 0.15)" }}>
        {icon}
      </div>

      <h3 className="font-title" style={{ fontWeight: 800, fontSize: "1.05rem", marginBottom: ".5rem", color: "var(--text)" }}>{title}</h3>
      <p style={{ color: "var(--muted)", fontSize: ".875rem", lineHeight: 1.6, marginBottom: "1.25rem" }}>{desc}</p>

      <span style={{ color: "var(--p-mid)", fontWeight: 600, fontSize: ".85rem", display: "flex", alignItems: "center", gap: ".4rem" }}>
        {cta} <span>→</span>
      </span>
    </Link>
  );
}

/* ──────────────────────────────────────────
   HomePage
   ────────────────────────────────────────── */
export default function HomePage() {
  const { t } = useLanguage();
  const [services, setServices] = useState([]);
  const [stats,    setStats]    = useState(null);

  useEffect(() => {
    api.get("/services").then(({ data }) => { if (data.success) setServices(data.data || []); }).catch(() => {});
    api.get("/stats").then(({ data }) => { if (data.success) setStats(data.data); }).catch(() => {});
  }, []);

  const features = [
    {
      icon: "🎫", title: "Ticket en ligne",
      desc: "Prenez votre tour sans faire la queue physiquement, depuis votre téléphone ou ordinateur.",
      link: "/ticket", cta: "Prendre un ticket",
      gradient: "linear-gradient(135deg, #8b5cf6, #06b6d4)"
    },
    {
      icon: "📺", title: "Affichage temps réel",
      desc: "Suivez l'évolution de la file d'attente sur grand écran ou depuis votre mobile.",
      link: "/display", cta: "Voir l'affichage",
      gradient: "linear-gradient(135deg, #06b6d4, #10b981)"
    },
    {
      icon: "🔔", title: "Notifications",
      desc: "Recevez une alerte automatique quand votre tour approche — SMS ou notification push.",
      link: "/ticket", cta: "S'inscrire",
      gradient: "linear-gradient(135deg, #f59e0b, #f43f5e)"
    },
    {
      icon: "📊", title: "Tableau de bord",
      desc: "Statistiques et gestion complète pour les administrateurs et agents de guichet.",
      link: "/admin", cta: "Accéder",
      gradient: "linear-gradient(135deg, #8b5cf6, #f59e0b)"
    },
  ];

  const statItems = stats ? [
    { label: "Tickets aujourd'hui", value: stats.global?.total   ?? 0, icon: "🎫", color: "var(--p-mid)",  suffix: "" },
    { label: "En attente",          value: stats.global?.waiting ?? 0, icon: "⏳", color: "var(--warn)",   suffix: "" },
    { label: "Traités",             value: stats.global?.done    ?? 0, icon: "✅", color: "#34d399",       suffix: "" },
    { label: "Attente moy.",        value: stats.global?.avg_wait_min ?? 0, icon: "⏱️", color: "var(--acc-mid)", suffix: "m" },
  ] : [];

  return (
    <div className="fade-in">

      {/* ── HERO ── */}
      <div className="hero">
        {/* Badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: ".5rem", padding: ".35rem 1rem", background: "rgba(139, 92, 246, 0.12)", border: "1px solid rgba(139, 92, 246, 0.25)", borderRadius: 99, fontSize: ".78rem", color: "var(--p-mid)", fontWeight: 700, letterSpacing: ".05em", marginBottom: "1.5rem", position: "relative", zIndex: 1 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--acc)", boxShadow: "0 0 8px var(--acc)", display: "inline-block", animation: "orb-pulse 2s ease-in-out infinite" }} />
          Système de gestion de file d'attente
        </div>

        <h1 className="hero-title">
          La file d'attente,<br />
          <span>réinventée ✦</span>
        </h1>

        <p className="hero-sub">
          Application intelligente pour Madagascar. Tickets en ligne, affichage temps réel
          et notifications automatiques — pour une expérience client sans stress.
        </p>

        <div className="hero-actions">
          <Link to="/ticket" className="btn btn-primary" style={{ fontSize: "1rem", padding: ".9rem 2.25rem" }}>
            🎫 Prendre un ticket
          </Link>
          <Link to="/display" className="btn btn-glass" style={{ fontSize: "1rem", padding: ".9rem 2.25rem", color: "#fff" }}>
            📺 File en direct
          </Link>
          <Link to="/login" className="btn btn-ghost" style={{ fontSize: "1rem", padding: ".9rem 2.25rem" }}>
            Connexion →
          </Link>
        </div>
      </div>

      {/* ── STATISTIQUES ── */}
      {stats && (
        <div className="grid grid-4 stagger" style={{ marginBottom: "3rem" }}>
          {statItems.map(s => (
            <div key={s.label} className="card" style={{ textAlign: "center", padding: "1.5rem", background: "var(--surface2)" }}>
              <div style={{ fontSize: "1.75rem", marginBottom: ".5rem" }}>{s.icon}</div>
              <div className="font-title" style={{ fontSize: "2.25rem", fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: ".35rem" }}>
                <AnimatedCounter end={s.value} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: ".75rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── SERVICES DISPONIBLES ── */}
      {services.length > 0 && (
        <section style={{ marginBottom: "3rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <div>
              <h2 className="font-title" style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text)" }}>
                Services disponibles
              </h2>
              <p style={{ color: "var(--muted)", fontSize: ".82rem", marginTop: ".2rem" }}>
                Cliquez sur un service pour prendre votre ticket
              </p>
            </div>
            <span className="badge badge-success">{services.length} actif{services.length > 1 ? "s" : ""}</span>
          </div>

          <div className="grid grid-4 stagger">
            {services.map(s => <ServiceCard key={s.id} s={s} />)}
          </div>
        </section>
      )}

      {/* ── FEATURES ── */}
      <section style={{ marginBottom: "2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h2 className="font-title" style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)", marginBottom: ".5rem" }}>
            Tout ce dont vous avez besoin
          </h2>
          <p style={{ color: "var(--muted)", fontSize: ".9rem" }}>
            Une plateforme complète pour gérer vos files d'attente efficacement
          </p>
        </div>

        <div className="grid grid-2 stagger">
          {features.map(f => <FeatureCard key={f.title} {...f} />)}
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <div className="card card-nexus" style={{ textAlign: "center", padding: "3rem 2rem", marginTop: "1rem" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🚀</div>
        <h2 className="font-title" style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: ".75rem" }}>
          Prêt à commencer ?
        </h2>
        <p style={{ color: "var(--muted)", marginBottom: "1.75rem", maxWidth: 400, margin: "0 auto 1.75rem" }}>
          Créez votre compte gratuitement et profitez d'un système de gestion de file d'attente moderne.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", position: "relative", zIndex: 2 }}>
          <Link to="/register" className="btn btn-primary">✨ Créer un compte</Link>
          <Link to="/ticket"   className="btn btn-outline">🎫 Prendre un ticket</Link>
        </div>
      </div>
    </div>
  );
}
