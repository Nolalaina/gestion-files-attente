import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.firstName) errs.firstName = "Prénom requis";
    if (!form.lastName) errs.lastName = "Nom requis";
    if (!form.email) errs.email = "Email requis";
    if (!form.phone) errs.phone = "Téléphone requis";
    if (!form.password || form.password.length < 6) errs.password = "Mot de passe (min 6 caractères)";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Les mots de passe ne correspondent pas";

    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);

    try {
      await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      addToast("Inscription réussie ! Vérifiez votre email pour validation.", "success");
      navigate("/login");
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.error || "Erreur d'inscription";
      addToast(message, "error");
      setErrors({ form: message });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  return (
    <div className="fade-in" style={{ maxWidth: 520, margin: "3rem auto", padding: "0 1rem" }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: ".5rem" }}>📝</div>
        <h1 style={{ fontSize: "1.7rem", fontWeight: 900, color: "var(--primary)" }}>Inscription</h1>
        <p style={{ color: "var(--text-muted)", marginTop: ".3rem" }}>Créez un compte client</p>
      </div>

      <form className="card" onSubmit={handleSubmit} noValidate style={{ padding: "2rem" }}>
        <div className={`form-group ${errors.firstName ? "has-error" : ""}`}>
          <label htmlFor="firstName">Prénom</label>
          <input id="firstName" type="text" value={form.firstName} onChange={handleChange("firstName")} autoComplete="given-name" />
          {errors.firstName && <span className="error-msg">{errors.firstName}</span>}
        </div>

        <div className={`form-group ${errors.lastName ? "has-error" : ""}`}>
          <label htmlFor="lastName">Nom</label>
          <input id="lastName" type="text" value={form.lastName} onChange={handleChange("lastName")} autoComplete="family-name" />
          {errors.lastName && <span className="error-msg">{errors.lastName}</span>}
        </div>

        <div className={`form-group ${errors.email ? "has-error" : ""}`}>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={form.email} onChange={handleChange("email")} autoComplete="email" />
          {errors.email && <span className="error-msg">{errors.email}</span>}
        </div>

        <div className={`form-group ${errors.phone ? "has-error" : ""}`}>
          <label htmlFor="phone">Téléphone</label>
          <input id="phone" type="tel" value={form.phone} onChange={handleChange("phone")} autoComplete="tel" />
          {errors.phone && <span className="error-msg">{errors.phone}</span>}
        </div>

        <div className={`form-group ${errors.password ? "has-error" : ""}`}>
          <label htmlFor="password">Mot de passe</label>
          <input id="password" type="password" value={form.password} onChange={handleChange("password")} autoComplete="new-password" />
          {errors.password && <span className="error-msg">{errors.password}</span>}
        </div>

        <div className={`form-group ${errors.confirmPassword ? "has-error" : ""}`}>
          <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
          <input id="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange("confirmPassword")} autoComplete="new-password" />
          {errors.confirmPassword && <span className="error-msg">{errors.confirmPassword}</span>}
        </div>

        {errors.form && <div className="error-msg" style={{ marginBottom: "1rem" }}>{errors.form}</div>}

        <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
          {loading ? <span className="spinner" /> : "S'inscrire"}
        </button>
      </form>

      <p style={{ textAlign: "center", marginTop: "1rem", color: "var(--text-muted)", fontSize: ".9rem" }}>
        <Link to="/login">Déjà un compte ? Connexion</Link>
      </p>
    </div>
  );
}
