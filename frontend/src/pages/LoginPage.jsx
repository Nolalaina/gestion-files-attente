import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth }  from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";

export default function LoginPage() {
  const { login }    = useAuth();
  const { addToast } = useNotification();
  const navigate     = useNavigate();
  const [form,    setForm]    = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

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
    <div className="fade-in" style={{ maxWidth:420, margin:"3rem auto", padding:"0 1rem" }}>
      <div style={{ textAlign:"center", marginBottom:"2rem" }}>
        <div style={{ fontSize:"3rem", marginBottom:".5rem" }}>🔑</div>
        <h1 style={{ fontSize:"1.7rem", fontWeight:900, color:"var(--primary)" }}>Connexion</h1>
        <p style={{ color:"var(--text-muted)", marginTop:".3rem" }}>Espace agent et administrateur</p>
      </div>
      <form className="card" onSubmit={handleSubmit} noValidate style={{ padding:"2rem" }}>
        <div className={`form-group ${errors.email ? "has-error" : ""}`}>
          <label htmlFor="email">Adresse email</label>
          <input id="email" type="email" value={form.email} autoFocus
            onChange={e => { setForm(f => ({...f, email: e.target.value})); setErrors(er => ({...er, email: null})); }}
            placeholder="agent@queue.mg" autoComplete="email" />
          {errors.email && <span className="error-msg">{errors.email}</span>}
        </div>
        <div className={`form-group ${errors.password ? "has-error" : ""}`}>
          <label htmlFor="password">Mot de passe</label>
          <input id="password" type="password" value={form.password}
            onChange={e => { setForm(f => ({...f, password: e.target.value})); setErrors(er => ({...er, password: null})); }}
            placeholder="••••••••" autoComplete="current-password" />
          {errors.password && <span className="error-msg">{errors.password}</span>}
        </div>
        <button className="btn btn-primary btn-full" type="submit" disabled={loading} style={{ marginTop:".5rem" }}>
          {loading ? <span className="spinner" /> : "Se connecter"}
        </button>
      </form>
      <p style={{ textAlign:"center", marginTop:"1.2rem", color:"var(--text-muted)", fontSize:".9rem" }}>
        Pas encore de compte ? <Link to="/register">Inscription</Link><br/>
        <Link to="/">← Retour à l'accueil</Link>
      </p>
      <div className="card-flat" style={{ marginTop:"1rem", padding:"1rem", fontSize:".8rem", color:"var(--text-muted)" }}>
        <strong>Comptes de test :</strong><br />
        admin@queue.mg / agent1@queue.mg — mot de passe : <code>password123</code>
      </div>
    </div>
  );
}
