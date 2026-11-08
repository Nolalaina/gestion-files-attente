import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import Icon from "../components/Icon";

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

  return (
    <div className="pw-strength" data-score={score}>
      <div className="pw-bars" aria-hidden="true">
        {[1, 2, 3, 4].map((index) => (
          <span key={index} className={`pw-bar ${index <= score ? "filled" : ""}`} />
        ))}
      </div>
      <span className="pw-label">Force du mot de passe : {labels[score]}</span>
    </div>
  );
}

function Field({ id, label, type = "text", value, onChange, error, placeholder, autoComplete }) {
  return (
    <div className={`form-group ${error ? "has-error" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
      {error ? <span className="error-msg">{error}</span> : null}
    </div>
  );
}

export default function RegisterPage() {
  const { register } = useAuth();
  const { addToast } = useNotification();
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
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);

  const set = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: null }));
  };

  const validateStep1 = () => {
    const nextErrors = {};
    if (!form.firstName.trim()) nextErrors.firstName = "Prénom requis";
    if (!form.lastName.trim()) nextErrors.lastName = "Nom requis";
    if (!form.email.trim()) nextErrors.email = "Email requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = "Email invalide";
    if (!form.phone.trim()) nextErrors.phone = "Téléphone requis";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStep2 = () => {
    const nextErrors = {};
    if (!form.password || form.password.length < 6) nextErrors.password = "Six caractères minimum";
    if (form.password !== form.confirmPassword) nextErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const goToStep2 = (event) => {
    event.preventDefault();
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateStep2()) return;
    setLoading(true);
    try {
      const response = await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      addToast(response.message || "Inscription réussie.", "success");
      navigate("/login");
    } catch (error) {
      const message = error.response?.data?.error || "Erreur d'inscription";
      addToast(message, "error");
      setErrors({ form: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in auth-shell auth-shell-narrow">
      <header className="auth-intro">
        <span className="brand-orb auth-intro-mark" aria-hidden="true">
          <Icon name="user" size={18} />
        </span>
        <h1>Créer un compte</h1>
        <p>Rejoignez QueueFlow et gardez la main sur vos files d’attente.</p>
      </header>

      <div className="step-track" aria-label={`Étape ${step} sur 2`}>
        {[1, 2].map((index) => (
          <div key={index} className="step-item">
            <span className={`step-dot ${step >= index ? "done" : ""}`}>
              {step > index ? <Icon name="check" size={14} /> : index}
            </span>
            <span className={`step-name ${step >= index ? "done" : ""}`}>
              {index === 1 ? "Informations" : "Sécurité"}
            </span>
            {index === 1 ? <span className={`step-line ${step >= 2 ? "done" : ""}`} /> : null}
          </div>
        ))}
      </div>

      <div className="card auth-card">
        {step === 1 ? (
          <form onSubmit={goToStep2} noValidate>
            <div className="field-row">
              <Field
                id="firstName"
                label="Prénom"
                value={form.firstName}
                onChange={set("firstName")}
                error={errors.firstName}
                placeholder="Jean"
                autoComplete="given-name"
              />
              <Field
                id="lastName"
                label="Nom"
                value={form.lastName}
                onChange={set("lastName")}
                error={errors.lastName}
                placeholder="Dupont"
                autoComplete="family-name"
              />
            </div>

            <Field
              id="email"
              label="Adresse email"
              type="email"
              value={form.email}
              onChange={set("email")}
              error={errors.email}
              placeholder="jean@example.mg"
              autoComplete="email"
            />

            <Field
              id="phone"
              label="Téléphone"
              type="tel"
              value={form.phone}
              onChange={set("phone")}
              error={errors.phone}
              placeholder="+261 34 00 000 00"
              autoComplete="tel"
            />

            <button className="btn btn-primary btn-full" type="submit">
              Continuer
              <Icon name="arrow" size={16} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="account-summary">
              <span className="summary-avatar" aria-hidden="true">
                <Icon name="user" size={18} />
              </span>
              <div className="summary-text">
                <strong>{form.firstName} {form.lastName}</strong>
                <span>{form.email}</span>
                <span>{form.phone}</span>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStep(1)}>
                Modifier
              </button>
            </div>

            <div className={`form-group ${errors.password ? "has-error" : ""}`}>
              <label htmlFor="password">Mot de passe</label>
              <div className="pw-field">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={set("password")}
                  autoFocus
                  placeholder="Au moins six caractères"
                  autoComplete="new-password"
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
              <PasswordStrength password={form.password} />
              {errors.password ? <span className="error-msg">{errors.password}</span> : null}
            </div>

            <Field
              id="confirmPassword"
              label="Confirmer le mot de passe"
              type={showPassword ? "text" : "password"}
              value={form.confirmPassword}
              onChange={set("confirmPassword")}
              error={errors.confirmPassword}
              placeholder="Répétez le mot de passe"
              autoComplete="new-password"
            />

            {errors.form ? (
              <div className="inline-alert">
                {errors.form}
              </div>
            ) : null}

            <p className="form-note">
              En vous inscrivant, vous acceptez nos conditions d’utilisation et notre politique de confidentialité.
            </p>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
                <Icon name="arrow-left" size={16} />
                Retour
              </button>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner spinner-sm" aria-hidden="true" />
                    Création en cours
                  </>
                ) : (
                  "Créer mon compte"
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      <p className="auth-footnote">
        Déjà un compte ? <Link to="/login">Se connecter</Link>
      </p>
    </div>
  );
}
