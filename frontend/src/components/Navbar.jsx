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
    { to: "/",         label: "Accueil",          show: !user || user.role === "usager" },
    { to: "/ticket",   label: "Prendre un Ticket", show: !user || user.role === "usager" },
    { to: "/display",  label: "File en Direct",    show: true },
    { to: "/dashboard",label: "Mon Espace",        show: user?.role === "usager" },
    { to: "/bank",     label: "Ma Banque",         show: user?.role === "usager" },
    { to: "/agent",    label: "Mon Guichet",       show: user?.role === "agent" || user?.role === "admin" },
    { to: "/admin",    label: "Console Admin",     show: user?.role === "admin" },
  ];

  return (
    <nav className="navbar" role="navigation" aria-label="Navigation principale">
      <div className="navbar-inner">
        {/* Logo */}
        <NavLink to="/" className="navbar-brand" onClick={close} aria-label="Accueil">
          <div className="brand-orb">🏦</div>
          <span className="brand-text">QueueFlow</span>
        </NavLink>

        {/* Burger Mobile */}
        <button
          className="burger" onClick={() => setOpen(o => !o)}
          aria-expanded={open} aria-controls="nav-links" aria-label="Menu"
        >
          <span className="burger-line" style={{ transform: open ? "rotate(45deg) translateY(7px)" : "" }} />
          <span className="burger-line" style={{ opacity: open ? 0 : 1 }} />
          <span className="burger-line" style={{ transform: open ? "rotate(-45deg) translateY(-7px)" : "" }} />
        </button>

        {/* Links */}
        <div id="nav-links" className={`navbar-links ${open ? "open" : ""}`} role="menubar">
          {links.map(l => {
            if (!l.show) return null;
            return (
              <NavLink
                key={l.to} to={l.to} role="menuitem"
                className={({ isActive }) => isActive ? "active" : ""}
                onClick={close}
              >
                {l.label}
              </NavLink>
            );
          })}

          {/* Auth Section */}
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: ".6rem", marginLeft: ".25rem", paddingLeft: ".75rem", borderLeft: "1px solid var(--border)" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: ".78rem", color: "var(--p-mid)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>
                  {user.role}
                </div>
                <div style={{ fontSize: ".82rem", color: "var(--text)", fontWeight: 600, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.name}
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={handleLogout} style={{ gap: ".4rem" }}>
                <span>⏏</span> Déconnexion
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: ".5rem", marginLeft: ".25rem", paddingLeft: ".75rem", borderLeft: "1px solid var(--border)" }}>
              <NavLink to="/login"    className="btn btn-ghost btn-sm"   onClick={close}>Connexion</NavLink>
              <NavLink to="/register" className="btn btn-primary btn-sm" onClick={close}>Inscription</NavLink>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
