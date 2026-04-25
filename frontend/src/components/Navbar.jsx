import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const handleLogout = () => { logout(); navigate("/"); close(); };

  const links = [
    { to: "/",        label: "Accueil",            show: !user || user.role === "usager" },
    { to: "/ticket",  label: "Prendre un Ticket",  show: !user || user.role === "usager" },
    { to: "/display", label: "File en Direct",     show: true },
    { to: "/dashboard",label: "Mon Ticket",        show: user?.role === "usager" },
    { to: "/bank",    label: "Ma Banque",          show: user?.role === "usager" },
    { to: "/agent",   label: "Mon Guichet",        show: user?.role === "agent" || user?.role === "admin" },
    { to: "/admin",   label: "Console Admin",      show: user?.role === "admin" },
  ];

  return (
    <nav className="navbar" role="navigation" aria-label="Navigation principale">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-brand" onClick={close} aria-label="Accueil">
          🏦 QueueFlow
        </NavLink>

        <button className="burger" onClick={() => setOpen(o => !o)}
          aria-expanded={open} aria-controls="nav-links" aria-label="Menu">
          <span className="burger-line" />
          <span className="burger-line" />
          <span className="burger-line" />
        </button>

        <div id="nav-links" className={`navbar-links ${open ? "open" : ""}`} role="menubar">
          {links.map(l => {
            if (!l.show) return null;
            return (
              <NavLink key={l.to} to={l.to} role="menuitem"
                className={({ isActive }) => isActive ? "active" : ""}
                onClick={close}>
                {l.label}
              </NavLink>
            );
          })}
          {user
            ? (
              <div style={{ display:"flex", alignItems:"center", gap:".75rem", marginLeft:".5rem" }}>
                <span style={{ fontSize:".8rem", color:"var(--muted)", fontWeight:500 }}>
                  {user.name}
                </span>
                <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                  Déconnexion
                </button>
              </div>
            )
            : <NavLink to="/login" className="btn btn-primary btn-sm" onClick={close}>Connexion</NavLink>
          }
        </div>
      </div>
    </nav>
  );
}
