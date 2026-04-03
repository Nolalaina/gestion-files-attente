import { createContext, useContext, useState, useCallback } from "react";

const ICONS = { success:"✅", error:"❌", info:"ℹ️", warning:"⚠️" };
const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration);
  }, []);

  const remove = (id) => setToasts(t => t.filter(x => x.id !== id));

  return (
    <ToastCtx.Provider value={{ addToast }}>
      {children}
      <div className="toast-container" role="alert" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}
            onClick={() => remove(t.id)} style={{ cursor:"pointer" }}>
            <span className="toast-icon">{ICONS[t.type]}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
