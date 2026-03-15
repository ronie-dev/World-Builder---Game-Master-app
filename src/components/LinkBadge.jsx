import React from "react";

const LinkBadge = React.memo(function LinkBadge({ label, color, onClick, onNewTab }) {
  const handleClick = e => {
    if (e.ctrlKey || e.metaKey) { e.preventDefault(); onNewTab?.(); return; }
    onClick?.(e);
  };
  const handleAuxClick = e => {
    if (e.button === 1) { e.preventDefault(); onNewTab?.(); }
  };
  return (
    <span
      onClick={handleClick}
      onAuxClick={handleAuxClick}
      title={onNewTab ? "Click to open · Middle-click or Ctrl+click to open in new tab" : undefined}
      style={{ background:color||"#333", color:"#e8d5b7", borderRadius:4, padding:"2px 10px", fontSize:11, fontWeight:700, letterSpacing:1, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:4 }}
      onMouseEnter={e=>e.currentTarget.style.filter="brightness(1.3)"}
      onMouseLeave={e=>e.currentTarget.style.filter="brightness(1)"}
    >
      {label} <span style={{ fontSize:10, opacity:.7 }}>↗</span>
    </span>
  );
});

export default LinkBadge;
