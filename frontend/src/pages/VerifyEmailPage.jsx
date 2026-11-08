import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useNotification } from "../context/NotificationContext";
import Icon from "../components/Icon";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useNotification();
  const [status, setStatus] = useState("loading");

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
        addToast("Email vérifié.", "success");
        setTimeout(() => navigate("/login"), 3000);
      } catch (error) {
        console.error(error);
        setStatus("error");
        addToast(error.response?.data?.error || "Erreur de vérification", "error");
      }
    };

    verify();
  }, [params, navigate, addToast]);

  return (
    <div className="verify-shell fade-in">
      <div className="card verify-card">
        {status === "loading" ? (
          <>
            <span className="spinner spinner-lg verify-icon" aria-hidden="true" />
            <h1>Vérification en cours</h1>
            <p>Nous validons votre compte, un instant.</p>
          </>
        ) : null}

        {status === "success" ? (
          <>
            <span className="verify-icon verify-success">
              <Icon name="check-circle" size={34} />
            </span>
            <h1>Compte validé</h1>
            <p>Votre email est vérifié. Vous allez être redirigé vers la connexion.</p>
            <Link to="/login" className="btn btn-primary">Se connecter</Link>
          </>
        ) : null}

        {status === "error" ? (
          <>
            <span className="verify-icon verify-error">
              <Icon name="x-circle" size={34} />
            </span>
            <h1>Validation impossible</h1>
            <p>Le lien est invalide ou a expiré.</p>
            <Link to="/register" className="btn btn-outline">Reprendre l’inscription</Link>
          </>
        ) : null}
      </div>
    </div>
  );
}
