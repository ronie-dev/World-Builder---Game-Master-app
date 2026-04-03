import { useState, useCallback, useRef } from "react";
import { ToastContext } from "./ToastContext.js";

const COLORS = {
  success: { bg:"#1a2e1a", border:"#2d6a4f", icon:"✓" },
  error:   { bg:"#2e1a1a", border:"#7a2020", icon:"✕" },
  info:    { bg:"#1a1630", border:"#5a3da0", icon:"ℹ" },
  undo:    { bg:"#1a1a2e", border:"#3a4a8a", icon:"↩" },
};

function createToastId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const showToast = useCallback((msg, type = "success") => {
    const id = createToastId();
    setToasts(prev => [...prev.slice(-2), { id, msg, type }]);
    timers.current[id] = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      delete timers.current[id];
    }, 2500);
  }, []);

  const dismiss = useCallback(id => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss}/>
    </ToastContext.Provider>
  );
}

export function ToastContainer({ toasts, dismiss }) {
  if (toasts.length === 0) return null;
  return (
    <div style={{ position:"fixed", bottom:24, right:24, display:"flex", flexDirection:"column", gap:8, zIndex:9999, pointerEvents:"none" }}>
      {toasts.map(t => {
        const c = COLORS[t.type] || COLORS.success;
        return (
          <div key={t.id} style={{ display:"flex", alignItems:"center", gap:10, background:c.bg, border:`1px solid ${c.border}`, borderRadius:8, padding:"10px 14px", color:"#e8d5b7", fontSize:13, fontWeight:500, boxShadow:"0 4px 16px #00000066", pointerEvents:"all", animation:"toast-in .18s ease", minWidth:180, maxWidth:300 }}>
            <span style={{ color:c.border, fontSize:15, flexShrink:0 }}>{c.icon}</span>
            <span style={{ flex:1 }}>{t.msg}</span>
            <button onClick={() => dismiss(t.id)} style={{ background:"none", border:"none", color:"#5a4a7a", cursor:"pointer", fontSize:14, padding:"0 0 0 6px", lineHeight:1 }}>×</button>
          </div>
        );
      })}
      <style>{`@keyframes toast-in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }`}</style>
    </div>
  );
}
