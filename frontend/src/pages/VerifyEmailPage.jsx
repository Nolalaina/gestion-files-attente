import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useNotification } from "../context/NotificationContext";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useNotification();
  const [status, setStatus] = useState("loading"); // loading, success, error

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setStatus("error");
      return;
    }

    const verify = async () => {
      try {
        await api.post("/auth/verify-email", { token });
        setStatus("success");
        addToast("Email vérifié avec succès !", "success");
        setTimeout(() => navigate("/login"), 3000);
      } catch (err) {
        console.error(err);
        setStatus("error");
        addToast(err.response?.data?.error || "Erreur de vérification", "error");
      }
    };

    verify();
  }, [params, navigate, addToast]);

  return (
    <div className="fade-in" style={{ maxWidth: 450, margin: "5rem auto", textAlign: "center", padding: "2rem" }}>
      <div className="card" style={{ padding: "3rem" }}>
        {status === "loading" && (
          <>
            <div className="spinner" style={{ width: 50, height: 50, margin: "0 auto 1.5rem" }} />
            <h2>Vérification en cours...</h2>
            <p style={{ color: "var(--text-muted)" }}>Veuillez patienter pendant que nous validons votre compte.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>✅</div>
            <h2 style={{ color: "var(--success)" }}>Compte validé !</h2>
            <p>Votre email a été vérifié avec succès. Vous allez être redirigé vers la page de connexion.</p>
            <Link to="/login" className="btn btn-primary" style={{ marginTop: "1.5rem", display: "inline-block" }}>
              Se connecter maintenant
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>❌</div>
            <h2 style={{ color: "var(--error)" }}>Échec de la validation</h2>
            <p>Le lien est invalide ou a expiré.</p>
            <Link to="/register" className="btn btn-outline" style={{ marginTop: "1.5rem", display: "inline-block" }}>
              Réessayer l'inscription
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
