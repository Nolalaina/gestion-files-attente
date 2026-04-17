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
    { to: "/",        label: "Accueil",            always: true },
    { to: "/ticket",  label: "Prendre un Ticket",  always: true },
    { to: "/display", label: "File en Direct",     always: true },
    { to: "/dashboard",label: "Mon Espace",        roles: ["usager"] },
    { to: "/bank",    label: "Banque",           roles: ["usager"] },
    { to: "/agent",   label: "Espace Agent",       roles: ["agent","admin"] },
    { to: "/admin",   label: "Console Admin",      roles: ["admin"] },
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
            if (l.roles && (!user || !l.roles.includes(user.role))) return null;
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
