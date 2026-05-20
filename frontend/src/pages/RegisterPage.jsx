import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";

/* ── Indicateur de force du mot de passe ── */
function PasswordStrength({ password }) {
  if (!password) return null;
  const checks = [
    password.length >= 6,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ["", "Faible", "Moyen", "Fort", "Très fort"];
  const colors = ["", "#f43f5e", "#f59e0b", "#10b981", "#06b6d4"];
  return (
    <div style={{ marginTop: ".5rem" }}>
      <div style={{ display: "flex", gap: ".3rem", marginBottom: ".25rem" }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 99,
            background: i <= score ? colors[score] : "var(--border)",
            transition: "background .3s ease"
          }} />
        ))}
      </div>
      {score > 0 && (
        <div style={{ fontSize: ".72rem", color: colors[score], fontWeight: 600 }}>
          Force : {labels[score]}
        </div>
      )}
    </div>
  );
}

/* ── Champ de formulaire réutilisable ── */
function Field({ id, label, type = "text", value, onChange, error, placeholder, autoComplete, children }) {
  return (
    <div className={`form-group ${error ? "has-error" : ""}`}>
      <label htmlFor={id}>{label}</label>
      {children || (
        <input
          id={id} type={type} value={value}
          onChange={onChange} placeholder={placeholder}
          autoComplete={autoComplete}
        />
      )}
      {error && <span className="error-msg">{error}</span>}
    </div>
  );
}

export default function RegisterPage() {
  const { register } = useAuth();
  const { addToast } = useNotification();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "",
    phone: "", password: "", confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});
  const [showPw,  setShowPw]  = useState(false);
  const [step,    setStep]    = useState(1); // 2-step UX

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(p => ({ ...p, [field]: null }));
  };

  /* Validation étape 1 */
  const validateStep1 = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = "Prénom requis";
    if (!form.lastName.trim())  errs.lastName  = "Nom requis";
    if (!form.email.trim())     errs.email     = "Email requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Email invalide";
    if (!form.phone.trim())     errs.phone     = "Téléphone requis";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* Validation étape 2 */
  const validateStep2 = () => {
    const errs = {};
    if (!form.password || form.password.length < 6) errs.password = "Mot de passe (min. 6 caractères)";
    if (form.password !== form.confirmPassword)      errs.confirmPassword = "Les mots de passe ne correspondent pas";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goToStep2 = (e) => {
    e.preventDefault();
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;
    setLoading(true);
    try {
      const response = await register({
        firstName: form.firstName, lastName: form.lastName,
        email: form.email, phone: form.phone,
        password: form.password, confirmPassword: form.confirmPassword,
      });
      addToast(response.message || "Inscription réussie ! 🎉", "success");
      navigate("/login");
    } catch (err) {
      const message = err.response?.data?.error || "Erreur d'inscription";
      addToast(message, "error");
      setErrors({ form: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: 560, margin: "2rem auto", padding: "0 1rem" }}>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: ".75rem", marginBottom: "1rem" }}>
          <div style={{ width: 44, height: 44, background: "linear-gradient(135deg, var(--p), var(--acc))", borderRadius: "var(--r-sm)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", boxShadow: "0 0 24px var(--p-glow)" }}>
            📝
          </div>
        </div>
        <h1 className="font-title" style={{ fontSize: "1.8rem", fontWeight: 800, color: "#fff", marginBottom: ".4rem" }}>
          Créer un compte
        </h1>
        <p style={{ color: "var(--muted)", fontSize: ".875rem" }}>
          Rejoignez QueueFlow et gérez vos files d'attente
        </p>
      </div>

      {/* Indicateur d'étape */}
      <div style={{ display: "flex", alignItems: "center", gap: ".75rem", marginBottom: "2rem" }}>
        {[1, 2].map((s, i) => (
          <>
            <div
              key={s}
              style={{
                display: "flex", alignItems: "center", gap: ".5rem",
                color: step >= s ? "var(--p-mid)" : "var(--subtle)",
                fontWeight: 600, fontSize: ".82rem", transition: "color .3s"
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: step >= s ? "linear-gradient(135deg, var(--p), var(--acc))" : "var(--surface2)",
                border: step >= s ? "none" : "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: ".75rem", fontWeight: 800, color: "#fff",
                boxShadow: step >= s ? "0 0 12px var(--p-glow)" : "none",
                transition: "all .3s"
              }}>
                {step > s ? "✓" : s}
              </div>
              {s === 1 ? "Informations" : "Sécurité"}
            </div>
            {i === 0 && (
              <div style={{ flex: 1, height: 1, background: step >= 2 ? "linear-gradient(90deg, var(--p), var(--acc))" : "var(--border)", transition: "background .4s" }} />
            )}
          </>
        ))}
      </div>

      {/* Formulaire */}
      <div className="card" style={{ padding: "2.25rem", boxShadow: "var(--shadow-lg), 0 0 0 1px rgba(139,92,246,0.08)" }}>

        {/* ── ÉTAPE 1 : Infos personnelles ── */}
        {step === 1 && (
          <form onSubmit={goToStep2} noValidate>
            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Field id="firstName" label="Prénom" value={form.firstName} onChange={set("firstName")} error={errors.firstName} placeholder="Jean" autoComplete="given-name" />
              <Field id="lastName"  label="Nom"    value={form.lastName}  onChange={set("lastName")}  error={errors.lastName}  placeholder="Dupont" autoComplete="family-name" />
            </div>

            <Field id="email" label="Adresse email" type="email" value={form.email} onChange={set("email")} error={errors.email} placeholder="jean@example.mg" autoComplete="email" />

            <Field id="phone" label="Téléphone" type="tel" value={form.phone} onChange={set("phone")} error={errors.phone} placeholder="+261 34 00 000 00" autoComplete="tel" />

            <button className="btn btn-primary btn-full" type="submit" style={{ marginTop: ".5rem", padding: "1rem" }}>
              Continuer →
            </button>
          </form>
        )}

        {/* ── ÉTAPE 2 : Sécurité ── */}
        {step === 2 && (
          <form onSubmit={handleSubmit} noValidate>
            {/* Récapitulatif */}
            <div style={{ background: "var(--surface2)", borderRadius: "var(--r-sm)", padding: "1rem", marginBottom: "1.5rem", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, var(--p), var(--acc))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>
                👤
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "var(--text)", fontSize: ".9rem" }}>{form.firstName} {form.lastName}</div>
                <div style={{ fontSize: ".78rem", color: "var(--muted)" }}>{form.email} · {form.phone}</div>
              </div>
              <button type="button" onClick={() => setStep(1)} style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--p-mid)", cursor: "pointer", fontSize: ".8rem", fontWeight: 600 }}>
                ✏️ Modifier
              </button>
            </div>

            <div className={`form-group ${errors.password ? "has-error" : ""}`}>
              <label htmlFor="password">Mot de passe</label>
              <div style={{ position: "relative" }}>
                <input
                  id="password" type={showPw ? "text" : "password"} value={form.password}
                  onChange={set("password")} autoFocus
                  placeholder="Au moins 6 caractères" autoComplete="new-password"
                  style={{ width: "100%", paddingRight: "3rem" }}
                />
                <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}
                  style={{ position: "absolute", right: ".75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "1rem" }}>
                  {showPw ? "🙈" : "👁️"}
                </button>
              </div>
              <PasswordStrength password={form.password} />
              {errors.password && <span className="error-msg">{errors.password}</span>}
            </div>

            <Field id="confirmPassword" label="Confirmer le mot de passe" type={showPw ? "text" : "password"} value={form.confirmPassword} onChange={set("confirmPassword")} error={errors.confirmPassword} placeholder="••••••••" autoComplete="new-password" />

            {errors.form && (
              <div className="error-msg" style={{ marginBottom: "1rem", padding: ".75rem", background: "rgba(244,63,94,0.08)", borderRadius: "var(--r-sm)", border: "1px solid rgba(244,63,94,0.15)" }}>
                {errors.form}
              </div>
            )}

            {/* Conditions */}
            <p style={{ fontSize: ".75rem", color: "var(--subtle)", marginBottom: "1.25rem", lineHeight: 1.5 }}>
              En vous inscrivant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
            </p>

            <div style={{ display: "flex", gap: ".75rem" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setStep(1)} style={{ flex: "0 0 auto" }}>
                ← Retour
              </button>
              <button className="btn btn-primary btn-full" type="submit" disabled={loading} style={{ padding: "1rem" }}>
                {loading
                  ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Création...</>
                  : "✨ Créer mon compte"
                }
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Lien connexion */}
      <p style={{ textAlign: "center", marginTop: "1.25rem", color: "var(--muted)", fontSize: ".875rem" }}>
        Déjà un compte ?{" "}
        <Link to="/login" style={{ color: "var(--p-mid)", fontWeight: 600 }}>
          Se connecter
        </Link>
      </p>
    </div>
  );
}
