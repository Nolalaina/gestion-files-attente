import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { io } from "socket.io-client";

const NotificationCtx = createContext(null);

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [toasts, setToasts] = useState([]);
  const [megaNotif, setMegaNotif] = useState(null);

  // ✅ Déclaré AVANT useEffect pour que les handlers socket aient une référence valide
  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration);
  }, []);

  const showMega = useCallback((data) => {
    setMegaNotif(data);
  }, []);

  const closeMega = () => setMegaNotif(null);

  // Socket connection — dépend de addToast et user
  useEffect(() => {
    const s = io(SOCKET_URL);

    if (user?.role === "admin") s.emit("join_admin");

    s.on("ticket:called", (ticket) => {
      setMegaNotif({
        icon: "🔊",
        title: "TICKET APPELÉ !",
        text: `Le ticket ${ticket.number} est appelé au guichet ${ticket.counter || 1}.`,
        type: "success"
      });
      addToast(`Le ticket ${ticket.number} est appelé !`, "success");
    });

    s.on("ticket:done", (ticket) => {
      addToast(`Service terminé pour le ticket ${ticket.number}`, "info");
    });

    return () => s.disconnect();
  }, [user, addToast]);

  return (
    <NotificationCtx.Provider value={{ addToast, showMega }}>
      {children}

      {/* Toast Container */}
      <div className="toast-container" role="alert" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type} glass`}>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Mega Notification Overlay */}
      {megaNotif && (
        <div className="mega-notif-overlay" onClick={closeMega}>
          <div className="mega-notif glass scale-in" onClick={e => e.stopPropagation()}>
            <span className="mega-notif-icon">{megaNotif.icon}</span>
            <h2 className="mega-notif-title">{megaNotif.title}</h2>
            <p className="mega-notif-text">{megaNotif.text}</p>
            <button className="btn btn-primary btn-full" onClick={closeMega}>Compris</button>
          </div>
        </div>
      )}
    </NotificationCtx.Provider>
  );
}

export const useNotification = () => useContext(NotificationCtx);
