import { useState, createContext, useContext, useCallback } from "react";

// ─── Toast context ────────────────────────────────────────────────────────────
export const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="toast-wrap">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <i className={`fa-solid fa-${t.type === "success" ? "circle-check" : "circle-xmark"}`} />
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
