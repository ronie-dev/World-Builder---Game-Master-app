// Shared UI primitives — reused across tab content and detail panels.
// Keep this file focused: only add components used in 2+ places.

// ── EmptyState ───────────────────────────────────────────────────────────────
// "Select X to view details" placeholder shown in the detail column.
export function EmptyState({ icon, title }) {
  return (
    <div style={{ background:"#13101f", border:"1px dashed #2a1f3d", borderRadius:12, padding:"48px 24px", textAlign:"center", color:"#3a2a5a" }}>
      <div style={{ fontSize:40, marginBottom:12 }}>{icon}</div>
      <div style={{ fontSize:14, fontFamily:"Georgia,serif" }}>{title}</div>
    </div>
  );
}

// ── CardRow ──────────────────────────────────────────────────────────────────
// List card with selected/hover state. Used in faction, story, location lists.
export function CardRow({ isSelected, onClick, children, style }) {
  return (
    <div onClick={onClick}
      style={{ background:isSelected?"#1e1535":"#1a1228", border:`1px solid ${isSelected?"#7c5cbf":"#3a2a5a"}`, borderRadius:10, padding:16, cursor:"pointer", transition:"border-color .15s, background .15s", userSelect:"none", ...style }}
      onMouseEnter={e=>{ if(!isSelected){ e.currentTarget.style.borderColor="#5a3da0"; e.currentTarget.style.background="#1d1430"; } }}
      onMouseLeave={e=>{ if(!isSelected){ e.currentTarget.style.borderColor="#3a2a5a"; e.currentTarget.style.background="#1a1228"; } }}>
      {children}
    </div>
  );
}

// ── MiniChip ─────────────────────────────────────────────────────────────────
// Small avatar + name pill used in list cards to show linked characters.
export function MiniChip({ children }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:4, background:"#1e1630", borderRadius:12, padding:"2px 8px" }}>
      {children}
    </div>
  );
}

// ── SectionLabel ─────────────────────────────────────────────────────────────
// Uppercase purple label used as a section divider inside detail panels.
export function SectionLabel({ children }) {
  return (
    <div style={{ fontSize:11, color:"#7c5cbf", letterSpacing:1, textTransform:"uppercase", marginBottom:10, fontWeight:700 }}>
      {children}
    </div>
  );
}
