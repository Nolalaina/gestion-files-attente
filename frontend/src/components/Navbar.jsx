import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LanguageSelector from "./LanguageSelector";
import Icon from "./Icon";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const handleLogout = () => {
    logout();
    navigate("/");
    close();
  };

  const links = [
    { to: "/", label: "Accueil", show: !user || user.role === "usager" },
    { to: "/ticket", label: "Prendre un ticket", show: !user || user.role === "usager" },
    { to: "/display", label: "File en direct", show: true },
    { to: "/dashboard", label: "Mon espace", show: user?.role === "usager" },
    { to: "/bank", label: "Ma banque", show: user?.role === "usager" },
    { to: "/agent", label: "Mon guichet", show: user?.role === "agent" || user?.role === "admin" },
    { to: "/admin", label: "Console admin", show: user?.role === "admin" },
  ];

  return (
    <nav className="navbar" aria-label="Navigation principale">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-brand" onClick={close} aria-label="QueueFlow, accueil">
          <span className="brand-orb" aria-hidden="true">
            <Icon name="queue" size={18} />
          </span>
          <span className="brand-text">QueueFlow</span>
        </NavLink>

        <button
          className="burger"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="nav-links"
          aria-label="Ouvrir le menu"
        >
          <span className="burger-line" style={{ transform: open ? "rotate(45deg) translateY(7px)" : "" }} />
          <span className="burger-line" style={{ opacity: open ? 0 : 1 }} />
          <span className="burger-line" style={{ transform: open ? "rotate(-45deg) translateY(-7px)" : "" }} />
        </button>

        <div id="nav-links" className={`navbar-links ${open ? "open" : ""}`}>
          {links.map((link) => {
            if (!link.show) return null;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => (isActive ? "active" : "")}
                onClick={close}
              >
                {link.label}
              </NavLink>
            );
          })}

          <LanguageSelector />

          {user ? (
            <div className="navbar-session">
              <div className="navbar-user">
                <div className="navbar-user-role">{user.role}</div>
                <div className="navbar-user-name">{user.name}</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                <Icon name="logout" size={16} />
                Déconnexion
              </button>
            </div>
          ) : (
            <div className="navbar-auth">
              <NavLink to="/login" className="btn btn-ghost btn-sm" onClick={close}>
                Connexion
              </NavLink>
              <NavLink to="/register" className="btn btn-primary btn-sm" onClick={close}>
                Inscription
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
