import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import Icon from "../components/Icon";

const BENEFITS = [
  "Tickets en ligne, à toute heure",
  "Notifications à l'approche de votre tour",
  "Historique et statistiques réunis",
];

const DEMO_ACCOUNTS = [
  { email: "admin@queue.mg", role: "admin" },
  { email: "agent1@queue.mg", role: "agent" },
];

function LoginAside() {
  return (
    <aside className="auth-aside">
      <div className="auth-brand">
        <span className="brand-orb" aria-hidden="true">
          <Icon name="queue" size={18} />
        </span>
        <span>QueueFlow</span>
      </div>

      <div>
        <div className="auth-mark" aria-hidden="true">
          <Icon name="lock" size={26} />
        </div>
        <h2 className="auth-headline">Votre espace, vos tickets, votre banque.</h2>
        <p className="auth-copy">
          Retrouvez vos files d’attente et vos comptes dans une interface unique.
        </p>
        <ul className="auth-features">
          {BENEFITS.map((benefit) => (
            <li key={benefit}>
              <Icon name="check" size={16} />
              {benefit}
            </li>
          ))}
        </ul>
      </div>

      <div className="auth-demo">
        <p className="auth-demo-title">Comptes de démonstration</p>
        {DEMO_ACCOUNTS.map((account) => (
          <p key={account.email} className="auth-demo-row">
            <span>{account.email}</span>
            <span className="text-muted">{account.role}</span>
          </p>
        ))}
        <p className="auth-demo-row">
          <span className="text-muted">Mot de passe</span>
          <code>password123</code>
        </p>
      </div>
    </aside>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const { addToast } = useNotification();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!form.email) nextErrors.email = "Email requis";
    if (!form.password) nextErrors.password = "Mot de passe requis";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      addToast(`Bienvenue, ${user.name}.`, "success");
      navigate(user.role === "admin" ? "/admin" : user.role === "agent" ? "/agent" : "/");
    } catch {
      addToast("Email ou mot de passe incorrect", "error");
      setErrors({ password: "Identifiants invalides" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in auth-shell">
      <div className="auth-split">
        <LoginAside />

        <div className="auth-panel">
          <div className="auth-head">
            <h1>Connexion</h1>
            <p>Connectez-vous pour retrouver votre espace.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className={`form-group ${errors.email ? "has-error" : ""}`}>
              <label htmlFor="login-email">Adresse email</label>
              <input
                id="login-email"
                type="email"
                value={form.email}
                autoFocus
                onChange={(event) => {
                  setForm((current) => ({ ...current, email: event.target.value }));
                  setErrors((current) => ({ ...current, email: null }));
                }}
                placeholder="votre@email.mg"
                autoComplete="email"
              />
              {errors.email ? <span className="error-msg">{errors.email}</span> : null}
            </div>

            <div className={`form-group ${errors.password ? "has-error" : ""}`}>
              <label htmlFor="login-password">Mot de passe</label>
              <div className="pw-field">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, password: event.target.value }));
                    setErrors((current) => ({ ...current, password: null }));
                  }}
                  placeholder="Votre mot de passe"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="pw-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  <Icon name="eye" size={18} />
                </button>
              </div>
              {errors.password ? <span className="error-msg">{errors.password}</span> : null}
            </div>

            <button className="btn btn-primary btn-full auth-submit" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner spinner-sm" aria-hidden="true" />
                  Connexion en cours
                </>
              ) : (
                <>
                  Se connecter
                  <Icon name="arrow" size={16} />
                </>
              )}
            </button>
          </form>

          <div className="divider-label">ou</div>

          <div className="auth-links">
            <p>
              Pas encore de compte ? <Link to="/register">Créer un compte</Link>
            </p>
            <Link to="/" className="back-link">
              <Icon name="arrow-left" size={14} />
              Retour à l’accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
