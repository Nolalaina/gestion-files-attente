import { useState, useEffect } from "react";
import api from "../services/api";
import { useNotification } from "../context/NotificationContext";
import Icon from "./Icon";

const STEPS = ["Vos informations", "Service", "Confirmation"];

export default function TicketForm({ onCreated }) {
  const { addToast } = useNotification();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ user_name: "", phone: "", email: "", service_id: "" });
  const [errors, setErrors] = useState({});
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState(null);

  useEffect(() => {
    api.get("/services")
      .then(({ data }) => setServices(data.data || []))
      .catch(() => addToast("Impossible de charger les services", "error"));
  }, [addToast]);

  const selected = services.find((service) => service.id == form.service_id);

  const validateStep1 = () => {
    const nextErrors = {};
    if (!form.user_name.trim()) nextErrors.user_name = "Nom requis";
    if (form.phone && !/^\+?[\d\s-]{7,}$/.test(form.phone)) nextErrors.phone = "Numéro invalide";
    if (form.email && !/^[^@]+@[^@]+\.[^@]+$/.test(form.email)) nextErrors.email = "Email invalide";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const next = () => {
    if (step === 1 && validateStep1()) setStep(2);
  };

  const back = () => setStep((current) => current - 1);

  const handleSubmit = async () => {
    if (!form.service_id) {
      setErrors({ service_id: "Veuillez choisir un service" });
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/tickets", form);
      setTicket(data.data);
      onCreated?.(data.data);
      addToast("Ticket créé.", "success");
    } catch (error) {
      addToast(error.response?.data?.error || "Erreur lors de la création", "error");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setTicket(null);
    setForm({ user_name: "", phone: "", email: "", service_id: "" });
    setStep(1);
    setErrors({});
  };

  const set = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  if (ticket) {
    return (
      <div className="ticket-card scale-in">
        <p className="ticket-card-label">Votre numéro</p>
        <div className="ticket-number">{ticket.number}</div>
        <p className="ticket-service">
          {selected?.name || services.find((service) => service.id == ticket.service_id)?.name}
        </p>
        <p className="ticket-name">Bonjour, {ticket.user_name}</p>
        {ticket.estimated_wait > 0 ? (
          <p className="ticket-info">
            <Icon name="clock" size={15} />
            Attente estimée : {ticket.estimated_wait} min
          </p>
        ) : null}
        <p className="ticket-info">Surveillez l’affichage ou attendez votre notification.</p>
        <button className="btn btn-secondary btn-full" onClick={reset}>
          Prendre un autre ticket
        </button>
      </div>
    );
  }

  return (
    <div className="ticket-form fade-in">
      <div className="form-progress" aria-label={`Étape ${step} sur 3`}>
        {STEPS.map((label, index) => {
          const number = index + 1;
          return (
            <div key={label} className="form-progress-item">
              <span className={`form-progress-bar ${step > index ? "done" : ""}`} />
              <span className={`form-progress-label ${step === number ? "current" : ""}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <h2 className="form-title">
        <Icon name="ticket" size={20} />
        Prendre un ticket
      </h2>

      {step === 1 ? (
        <div>
          <div className={`form-group ${errors.user_name ? "has-error" : ""}`}>
            <label htmlFor="user_name">Nom complet</label>
            <input
              id="user_name"
              type="text"
              className="input"
              value={form.user_name}
              onChange={set("user_name")}
              placeholder="Jean Rakoto"
              autoComplete="name"
              autoFocus
            />
            {errors.user_name ? <span className="error-msg">{errors.user_name}</span> : null}
          </div>

          <div className={`form-group ${errors.phone ? "has-error" : ""}`}>
            <label htmlFor="phone">
              Téléphone <span className="optional">(optionnel)</span>
            </label>
            <input
              id="phone"
              type="tel"
              className="input"
              value={form.phone}
              onChange={set("phone")}
              placeholder="+261 34 00 000 00"
            />
            {errors.phone ? <span className="error-msg">{errors.phone}</span> : null}
          </div>

          <div className={`form-group ${errors.email ? "has-error" : ""}`}>
            <label htmlFor="email">
              Email <span className="optional">(optionnel)</span>
            </label>
            <input
              id="email"
              type="email"
              className="input"
              value={form.email}
              onChange={set("email")}
              placeholder="jean@exemple.mg"
            />
            {errors.email ? <span className="error-msg">{errors.email}</span> : null}
          </div>

          <button className="btn btn-primary btn-full" onClick={next}>
            Continuer
            <Icon name="arrow" size={16} />
          </button>
        </div>
      ) : null}

      {step === 2 ? (
        <div>
          <div className="choice-grid">
            {services.map((service) => {
              const isSelected = form.service_id == service.id;
              return (
                <button
                  key={service.id}
                  type="button"
                  className={`choice-card ${isSelected ? "selected" : ""}`}
                  onClick={() => {
                    setForm((current) => ({ ...current, service_id: service.id }));
                    setErrors((current) => ({ ...current, service_id: undefined }));
                  }}
                  aria-pressed={isSelected}
                >
                  <span className="choice-top">
                    <span className="service-prefix">{service.prefix}</span>
                    {service.waiting_count > 0 ? (
                      <span className="badge badge-waiting">{service.waiting_count} en attente</span>
                    ) : null}
                  </span>
                  <span className="choice-name">{service.name}</span>
                  <span className="choice-meta">
                    Environ {service.avg_duration} min, {service.max_counters} guichet
                    {service.max_counters > 1 ? "s" : ""}
                  </span>
                </button>
              );
            })}
          </div>

          {errors.service_id ? (
            <p className="error-msg" style={{ marginBottom: "var(--space-md)" }}>{errors.service_id}</p>
          ) : null}

          <div className="form-actions">
            <button className="btn btn-secondary" onClick={back}>
              <Icon name="arrow-left" size={16} />
              Retour
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (!form.service_id) {
                  setErrors({ service_id: "Choisissez un service" });
                  return;
                }
                setStep(3);
              }}
            >
              Continuer
              <Icon name="arrow" size={16} />
            </button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div>
          <div className="card-flat summary">
            <p className="summary-title">Récapitulatif</p>
            {[
              { label: "Nom", value: form.user_name },
              form.phone ? { label: "Téléphone", value: form.phone } : null,
              form.email ? { label: "Email", value: form.email } : null,
              { label: "Service", value: selected?.name },
              {
                label: "Attente estimée",
                value: `${(selected?.waiting_count || 0) * (selected?.avg_duration || 0)} min`,
              },
            ].filter(Boolean).map((row) => (
              <div key={row.label} className="summary-row">
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button className="btn btn-secondary" onClick={back} disabled={loading}>
              <Icon name="arrow-left" size={16} />
              Retour
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <span className="spinner spinner-sm" aria-hidden="true" />
              ) : (
                "Confirmer le ticket"
              )}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
