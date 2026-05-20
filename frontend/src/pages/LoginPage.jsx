import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth }  from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { useLanguage } from "../context/LanguageContext";

/* Panneau illustration gauche */
function LoginIllustration() {
  return (
    <div style={{
      background: "linear-gradient(135deg, #060b1a 0%, #0d0d1a 40%, #120e28 100%)",
      borderRadius: "var(--r-xl) 0 0 var(--r-xl)",
      padding: "3rem",
      display: "flex", flexDirection: "column", justifyContent: "space-between",
      position: "relative", overflow: "hidden",
      minHeight: 560,
    }}>
      {/* Halo décoratif */}
      <div style={{ position: "absolute", top: -80, left: -80, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -40, right: -40, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: ".75rem", position: "relative", zIndex: 1 }}>
        <div style={{ width: 38, height: 38, background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem", boxShadow: "0 0 20px rgba(139,92,246,0.4)" }}>🏦</div>
        <span className="font-title" style={{ fontSize: "1.25rem", fontWeight: 800, background: "linear-gradient(90deg,#fff,#a78bfa)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>QueueFlow</span>
      </div>

      {/* Centre */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: "4rem", marginBottom: "1.5rem", filter: "drop-shadow(0 0 20px rgba(139,92,246,0.5))" }}>🔑</div>
        <h2 className="font-title" style={{ fontSize: "1.75rem", fontWeight: 800, color: "#fff", marginBottom: "1rem", lineHeight: 1.2 }}>
          Bienvenue sur<br />
          <span style={{ background: "linear-gradient(90deg, #a78bfa, #22d3ee)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>QueueFlow</span>
        </h2>
        <p style={{ color: "var(--muted)", fontSize: ".9rem", lineHeight: 1.7, maxWidth: 280 }}>
          Gérez votre file d'attente intelligemment. Tickets en ligne, affichage temps réel et notifications automatiques.
        </p>

        {/* Features liste */}
        <div style={{ marginTop: "1.75rem", display: "flex", flexDirection: "column", gap: ".6rem" }}>
          {["Tickets en ligne 24h/24", "Notifications en temps réel", "Tableau de bord analytique"].map(f => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: ".6rem", fontSize: ".82rem", color: "#a1b4c8" }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".6rem", color: "var(--p-mid)", flexShrink: 0 }}>✓</div>
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Comptes test */}
      <div style={{ position: "relative", zIndex: 1, background: "rgba(255,255,255,0.04)", borderRadius: "var(--r-sm)", padding: "1rem", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ fontSize: ".7rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: ".5rem" }}>Comptes de démonstration</div>
        <div style={{ fontSize: ".78rem", color: "#a1b4c8", lineHeight: 1.7 }}>
          <div><span style={{ color: "var(--p-mid)" }}>admin@queue.mg</span> — admin</div>
          <div><span style={{ color: "var(--acc-mid)" }}>agent1@queue.mg</span> — agent</div>
          <div style={{ color: "var(--subtle)", marginTop: ".25rem" }}>Mot de passe : <code style={{ color: "var(--text)", background: "rgba(0,0,0,0.3)", padding: "0 .4em", borderRadius: 4 }}>password123</code></div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { t } = useLanguage();
  const { login }    = useAuth();
  const { addToast } = useNotification();
  const navigate     = useNavigate();
  const [form,    setForm]    = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});
  const [showPw,  setShowPw]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.email)    errs.email    = "Email requis";
    if (!form.password) errs.password = "Mot de passe requis";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      addToast(`Bienvenue, ${user.name} ! 👋`, "success");
      navigate(user.role === "admin" ? "/admin" : user.role === "agent" ? "/agent" : "/");
    } catch {
      addToast("Email ou mot de passe incorrect", "error");
      setErrors({ password: "Identifiants invalides" });
    } finally { setLoading(false); }
  };

  return (
    <div className="fade-in" style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1rem" }}>
      {/* Carte principale split */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderRadius: "var(--r-xl)", overflow: "hidden", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg), 0 0 0 1px rgba(139,92,246,0.08)" }}>

        {/* Gauche illustration */}
        <div className="login-illustration" style={{ display: window.innerWidth < 700 ? "none" : "block" }}>
          <LoginIllustration />
        </div>

        {/* Droite formulaire */}
        <div style={{ background: "var(--surface)", padding: "3rem" }}>
          {/* Header */}
          <div style={{ marginBottom: "2.5rem" }}>
            <div style={{ fontSize: ".75rem", color: "var(--p-mid)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: ".5rem" }}>
              Étape 1 sur 1
            </div>
            <h1 className="font-title" style={{ fontSize: "1.75rem", fontWeight: 800, color: "#fff", marginBottom: ".4rem" }}>
              Connexion
            </h1>
            <p style={{ color: "var(--muted)", fontSize: ".875rem" }}>
              Connectez-vous pour accéder à votre espace
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} noValidate>
            <div className={`form-group ${errors.email ? "has-error" : ""}`}>
              <label htmlFor="login-email">Adresse email</label>
              <input
                id="login-email" type="email" value={form.email} autoFocus
                onChange={e => { setForm(f => ({...f, email: e.target.value})); setErrors(er => ({...er, email: null})); }}
                placeholder="votre@email.mg" autoComplete="email"
                style={{ fontSize: ".9rem" }}
              />
              {errors.email && <span className="error-msg">{errors.email}</span>}
            </div>

            <div className={`form-group ${errors.password ? "has-error" : ""}`}>
              <label htmlFor="login-password">Mot de passe</label>
              <div style={{ position: "relative" }}>
                <input
                  id="login-password" type={showPw ? "text" : "password"} value={form.password}
                  onChange={e => { setForm(f => ({...f, password: e.target.value})); setErrors(er => ({...er, password: null})); }}
                  placeholder="••••••••" autoComplete="current-password"
                  style={{ width: "100%", paddingRight: "3rem", fontSize: ".9rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{ position: "absolute", right: ".75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "1rem", padding: ".2rem" }}
                  tabIndex={-1}
                >
                  {showPw ? "🙈" : "👁️"}
                </button>
              </div>
              {errors.password && <span className="error-msg">{errors.password}</span>}
            </div>

            <button
              className="btn btn-primary btn-full" type="submit" disabled={loading}
              style={{ marginTop: ".75rem", padding: "1rem", fontSize: ".95rem" }}
            >
              {loading
                ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Connexion...</>
                : "Se connecter →"
              }
            </button>
          </form>

          {/* Divider */}
          <div className="divider-label" style={{ margin: "1.75rem 0" }}>ou</div>

          {/* Links */}
          <div style={{ display: "flex", flexDirection: "column", gap: ".65rem", textAlign: "center" }}>
            <p style={{ fontSize: ".875rem", color: "var(--muted)" }}>
              Pas encore de compte ?{" "}
              <Link to="/register" style={{ color: "var(--p-mid)", fontWeight: 600 }}>
                Créer un compte
              </Link>
            </p>
            <Link to="/" style={{ fontSize: ".82rem", color: "var(--subtle)" }}>← Retour à l'accueil</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
