import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";
import StatCard from "../components/StatCard";
import Icon from "../components/Icon";

function AnimatedCounter({ end, duration = 1200, suffix = "" }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!end) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setValue(end);
      return;
    }
    let current = 0;
    const step = Math.max(1, Math.ceil(end / (duration / 16)));
    const timer = setInterval(() => {
      current += step;
      if (current >= end) {
        setValue(end);
        clearInterval(timer);
      } else {
        setValue(current);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);

  return (
    <>
      {value}
      {suffix}
    </>
  );
}

function ServiceCard({ service }) {
  return (
    <Link to="/ticket" className="service-card">
      <div className="service-card-top">
        <span className="service-prefix">{service.prefix}</span>
        {service.waiting_count > 0 ? (
          <span className="badge badge-waiting">{service.waiting_count} en attente</span>
        ) : (
          <span className="badge badge-done">Disponible</span>
        )}
      </div>
      <span className="service-name">{service.name}</span>
      <span className="service-meta">Environ {service.avg_duration} min par ticket</span>
      <span className="service-foot">
        Prendre un ticket
        <Icon name="arrow" size={16} />
      </span>
    </Link>
  );
}

function FeatureCard({ icon, title, description, to, cta }) {
  return (
    <Link to={to} className="feature-card">
      <span className="feature-icon">
        <Icon name={icon} size={20} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      <span className="feature-link">
        {cta}
        <Icon name="arrow" size={16} />
      </span>
    </Link>
  );
}

export default function HomePage() {
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/services").then(({ data }) => {
      if (data.success) setServices(data.data || []);
    }).catch(() => {});
    api.get("/stats").then(({ data }) => {
      if (data.success) setStats(data.data);
    }).catch(() => {});
  }, []);

  const features = [
    {
      icon: "ticket",
      title: "Ticket en ligne",
      description: "Prenez votre tour depuis votre téléphone, sans passer par la salle d'attente.",
      to: "/ticket",
      cta: "Prendre un ticket",
    },
    {
      icon: "queue",
      title: "File en direct",
      description: "Suivez le numéro appelé et la file restante sur grand écran ou sur mobile.",
      to: "/display",
      cta: "Voir la file",
    },
    {
      icon: "bell",
      title: "Notifications",
      description: "Recevez une alerte quand votre tour approche, par notification ou par SMS.",
      to: "/ticket",
      cta: "S'inscrire",
    },
    {
      icon: "chart",
      title: "Pilotage",
      description: "Statistiques, guichets et comptes réunis dans une console pour l'équipe.",
      to: "/admin",
      cta: "Ouvrir la console",
    },
  ];

  const statItems = stats ? [
    { label: "Tickets aujourd'hui", value: stats.global?.total ?? 0, icon: "ticket", tone: "accent" },
    { label: "En attente", value: stats.global?.waiting ?? 0, icon: "clock", tone: "warning" },
    { label: "Traités", value: stats.global?.done ?? 0, icon: "check-circle", tone: "success" },
    { label: "Attente moyenne", value: stats.global?.avg_wait_min ?? 0, icon: "clock", tone: "info", suffix: " min" },
  ] : [];

  return (
    <div className="fade-in">
      <section className="hero">
        <h1 className="hero-title">
          Votre tour, <span>sans la file.</span>
        </h1>
        <p className="hero-sub">
          Prenez un ticket en ligne, suivez la file en direct et présentez-vous au bon moment.
        </p>
        <div className="hero-actions">
          <Link to="/ticket" className="btn btn-primary">
            <Icon name="ticket" size={18} />
            Prendre un ticket
          </Link>
          <Link to="/display" className="btn btn-secondary">
            <Icon name="queue" size={18} />
            Voir la file en direct
          </Link>
        </div>
        <p className="hero-note">Gratuit pour les usagers, sans installation.</p>
      </section>

      {stats ? (
        <section aria-label="Statistiques du jour">
          <div className="grid grid-4 stagger">
            {statItems.map((item) => (
              <StatCard
                key={item.label}
                label={item.label}
                icon={item.icon}
                tone={item.tone}
                value={<AnimatedCounter end={item.value} suffix={item.suffix || ""} />}
              />
            ))}
          </div>
        </section>
      ) : null}

      {services.length > 0 ? (
        <section>
          <div className="section-head">
            <div>
              <h2>Services disponibles</h2>
              <p>Choisissez un service pour prendre votre ticket.</p>
            </div>
            <span className="badge badge-success">
              {services.length} actif{services.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="grid grid-4 stagger">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <div className="section-head">
          <div>
            <h2>Une plateforme complète</h2>
            <p>Du ticket usager au pilotage des guichets.</p>
          </div>
        </div>
        <div className="grid grid-2 stagger">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      <section className="closing-card">
        <h2>Créez votre espace</h2>
        <p>Suivez vos tickets, consultez votre historique et gérez vos comptes bancaires au même endroit.</p>
        <div className="hero-actions">
          <Link to="/register" className="btn btn-primary">Créer un compte</Link>
          <Link to="/ticket" className="btn btn-outline">Prendre un ticket</Link>
        </div>
      </section>
    </div>
  );
}
