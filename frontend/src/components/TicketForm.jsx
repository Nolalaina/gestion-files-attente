import { useState, useEffect } from "react";
import api from "../services/api";
import { useToast } from "../context/ToastContext";

export default function TicketForm({ onCreated }) {
  const { addToast } = useToast();
  const [step,     setStep]     = useState(1); // 1=infos, 2=service, 3=confirm
  const [form,     setForm]     = useState({ user_name:"", phone:"", email:"", service_id:"" });
  const [errors,   setErrors]   = useState({});
  const [services, setServices] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [ticket,   setTicket]   = useState(null);

  useEffect(() => {
    api.get("/services")
      .then(({ data }) => setServices(data.data))
      .catch(() => addToast("Impossible de charger les services", "error"));
  }, [addToast]);

  const selected = services.find(s => s.id == form.service_id);

  const validateStep1 = () => {
    const e = {};
    if (!form.user_name.trim()) e.user_name = "Nom requis";
    if (form.phone && !/^\+?[\d\s\-]{7,}$/.test(form.phone)) e.phone = "Numéro invalide";
    if (form.email && !/^[^@]+@[^@]+\.[^@]+$/.test(form.email)) e.email = "Email invalide";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (step === 1 && validateStep1()) setStep(2); };
  const back = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    if (!form.service_id) { setErrors({ service_id: "Veuillez choisir un service" }); return; }
    setLoading(true);
    try {
      const { data } = await api.post("/tickets", form);
      setTicket(data.data);
      onCreated?.(data.data);
      addToast("🎫 Ticket créé avec succès !", "success");
    } catch (err) {
      addToast(err.response?.data?.error || "Erreur lors de la création", "error");
    } finally { setLoading(false); }
  };

  const reset = () => { setTicket(null); setForm({ user_name:"", phone:"", email:"", service_id:"" }); setStep(1); setErrors({}); };
  const set = (field) => (e) => { setForm(f => ({...f, [field]: e.target.value})); setErrors(er => ({...er, [field]: undefined})); };

  // ── Ticket confirmé ───────────────────────────────────
  if (ticket) return (
    <div className="ticket-card scale-in">
      <div style={{ position:"relative" }}>
        <div style={{ fontSize:".8rem", fontWeight:700, opacity:.7, letterSpacing:".1em", marginBottom:".5rem", textTransform:"uppercase" }}>
          Votre numéro
        </div>
        <div className="ticket-number">{ticket.number}</div>
        <p className="ticket-service">{selected?.name || services.find(s=>s.id==ticket.service_id)?.name}</p>
        <p className="ticket-name">Bonjour, <strong>{ticket.user_name}</strong> 👋</p>
        {ticket.estimated_wait > 0 && (
          <p className="ticket-info">⏱ Attente estimée : ~{ticket.estimated_wait} min</p>
        )}
        <p className="ticket-info">Surveillez l'affichage ou attendez votre notification.</p>
        <button className="btn btn-ghost" onClick={reset}
          style={{ borderColor:"rgba(255,255,255,.5)", color:"#fff", width:"100%" }}>
          Nouveau ticket
        </button>
      </div>
    </div>
  );

  // ── Étapes ────────────────────────────────────────────
  return (
    <div className="ticket-form fade-in">
      {/* Progress */}
      <div style={{ display:"flex", gap:".5rem", marginBottom:"1.75rem" }}>
        {["Vos infos","Service","Confirmation"].map((label, i) => (
          <div key={label} style={{ flex:1, textAlign:"center" }}>
            <div style={{
              height:4, borderRadius:99, marginBottom:".5rem",
              background: step > i+1 ? "var(--acc)" : step === i+1 ? "var(--p)" : "var(--border)",
              transition: "background .3s"
            }} />
            <span style={{ fontSize:".72rem", color: step===i+1 ? "var(--p)" : "var(--muted)", fontWeight:600 }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      <h2 className="form-title">🎫 Prendre un ticket</h2>

      {/* Étape 1 : Infos */}
      {step === 1 && (
        <div>
          <div className={`form-group ${errors.user_name ? "has-error" : ""}`}>
            <label htmlFor="user_name">Nom complet *</label>
            <input id="user_name" type="text" className="input" value={form.user_name}
              onChange={set("user_name")} placeholder="Jean Rakoto" autoComplete="name" autoFocus />
            {errors.user_name && <span className="error-msg">{errors.user_name}</span>}
          </div>
          <div className={`form-group ${errors.phone ? "has-error" : ""}`}>
            <label htmlFor="phone">Téléphone <span className="optional">(optionnel)</span></label>
            <input id="phone" type="tel" className="input" value={form.phone}
              onChange={set("phone")} placeholder="+261 34 00 000 00" />
            {errors.phone && <span className="error-msg">{errors.phone}</span>}
          </div>
          <div className={`form-group ${errors.email ? "has-error" : ""}`}>
            <label htmlFor="email">Email <span className="optional">(optionnel)</span></label>
            <input id="email" type="email" className="input" value={form.email}
              onChange={set("email")} placeholder="jean@exemple.mg" />
            {errors.email && <span className="error-msg">{errors.email}</span>}
          </div>
          <button className="btn btn-primary btn-full" onClick={next}>Suivant →</button>
        </div>
      )}

      {/* Étape 2 : Service */}
      {step === 2 && (
        <div>
          <div className="grid grid-2" style={{ marginBottom:"1.25rem" }}>
            {services.map(s => {
              const sel = form.service_id == s.id;
              return (
                <button key={s.id} type="button"
                  onClick={() => { setForm(f=>({...f, service_id:s.id})); setErrors(e=>({...e,service_id:undefined})); }}
                  style={{
                    border: `2px solid ${sel ? "var(--p)" : "var(--border)"}`,
                    borderRadius:"var(--r)", padding:"1rem",
                    background: sel ? "var(--p-lt)" : "var(--surface)",
                    cursor:"pointer", textAlign:"left", transition:"all .15s",
                    color: "var(--text)"
                  }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:".5rem" }}>
                    <span style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.4rem", fontWeight:800, color: sel?"var(--p)":"var(--muted)" }}>
                      {s.prefix}
                    </span>
                    {s.waiting_count > 0 && (
                      <span className="badge badge-waiting">{s.waiting_count} att.</span>
                    )}
                  </div>
                  <div style={{ fontWeight:700, fontSize:".9rem" }}>{s.name}</div>
                  <div style={{ fontSize:".75rem", color:"var(--subtle)", marginTop:".25rem" }}>
                    ~{s.avg_duration} min · {s.max_counters} guichet{s.max_counters>1?"s":""}
                  </div>
                </button>
              );
            })}
          </div>
          {errors.service_id && <p className="error-msg" style={{ marginBottom:"1rem" }}>{errors.service_id}</p>}
          <div style={{ display:"flex", gap:".75rem" }}>
            <button className="btn btn-secondary" onClick={back} style={{ flex:1 }}>← Retour</button>
            <button className="btn btn-primary" onClick={() => { if(!form.service_id){setErrors({service_id:"Choisissez un service"}); return;} setStep(3); }} style={{ flex:2 }}>
              Continuer →
            </button>
          </div>
        </div>
      )}

      {/* Étape 3 : Confirmation */}
      {step === 3 && (
        <div>
          <div className="card-flat" style={{ marginBottom:"1.5rem" }}>
            <div style={{ fontSize:".78rem", textTransform:"uppercase", fontWeight:700, color:"var(--muted)", marginBottom:".75rem", letterSpacing:".05em" }}>
              Récapitulatif
            </div>
            {[
              { label:"Nom", value: form.user_name },
              form.phone && { label:"Téléphone", value: form.phone },
              form.email && { label:"Email",     value: form.email },
              { label:"Service", value: selected?.name },
              { label:"Attente estimée", value: `~${(selected?.waiting_count||0)*selected?.avg_duration||0} min` },
            ].filter(Boolean).map(r => (
              <div key={r.label} style={{ display:"flex", justifyContent:"space-between", padding:".45rem 0", borderBottom:"1px solid var(--border)" }}>
                <span style={{ color:"var(--muted)", fontSize:".85rem" }}>{r.label}</span>
                <span style={{ fontWeight:600, fontSize:".85rem" }}>{r.value}</span>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:".75rem" }}>
            <button className="btn btn-secondary" onClick={back} style={{ flex:1 }} disabled={loading}>← Retour</button>
            <button className="btn btn-primary" onClick={handleSubmit} style={{ flex:2 }} disabled={loading}>
              {loading ? <span className="spinner" /> : "Confirmer & Obtenir le ticket"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
