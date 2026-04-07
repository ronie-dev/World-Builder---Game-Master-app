import { memo, useState, useRef, useEffect } from "react";
import { ALIGNMENT_COLORS, FACTION_STATUS_COLORS, btnPrimary, inputStyle } from "../../constants.js";
import Badge from "../Badge.jsx";
import Avatar from "../Avatar.jsx";
import FactionDetailPanel from "../FactionDetailPanel.jsx";
import { EmptyState } from "../ui.jsx";

// ── Compact faction row ───────────────────────────────────────────────────────
function FactionRow({ faction, chars, isSelected, onSelect }) {
  const memberCount = chars.filter(c => (c.factions||[]).some(e => e.factionId===faction.id) && c.type !== "side").length;
  return (
    <div onClick={() => onSelect(faction)}
      style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 10px", borderRadius:6, cursor:"pointer", background:isSelected?"#1e1535":"transparent", borderLeft:`2px solid ${isSelected?"#7c5cbf":"transparent"}`, transition:"background .1s" }}
      onMouseEnter={e=>{ if(!isSelected) e.currentTarget.style.background="#13101e"; }}
      onMouseLeave={e=>{ if(!isSelected) e.currentTarget.style.background="transparent"; }}>
      {faction.image
        ? <img src={faction.image} alt="" style={{ width:22, height:22, borderRadius:4, objectFit:"cover", flexShrink:0 }}/>
        : <span style={{ fontSize:14, flexShrink:0 }}>⚑</span>}
      <span style={{ fontSize:13, color:"#e8d5b7", flex:1, minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
        {faction.name}
      </span>
      {faction.alignment && <Badge label={faction.alignment} color={ALIGNMENT_COLORS[faction.alignment]} small/>}
      {faction.status && <Badge label={faction.status} color={FACTION_STATUS_COLORS[faction.status]||"#3a3a3a"} small/>}
      {memberCount > 0 && <span style={{ fontSize:10, color:"#5a4a7a", flexShrink:0 }}>👤{memberCount}</span>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
function FactionsTabContent({
  factions, filteredFactions, chars, locations,
  factionQuery,
  selectedFaction, selectedFactionId,
  updPg,
  onNewFaction, onCancelNew, onSaveFaction, onDeleteFaction, onOpenChar, onSaveChar,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!drawerOpen) return;
    const handler = e => { if (overlayRef.current && !overlayRef.current.contains(e.target)) setDrawerOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [drawerOpen]);

  const hasFilter = !!factionQuery;

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minHeight:0, position:"relative" }}>

      {/* ── Detail: fills full height ── */}
      <div style={{ position:"absolute", inset:0, overflowY:"auto", paddingTop:44 }}>
        {selectedFaction
          ? <FactionDetailPanel
              key={selectedFaction.id}
              faction={selectedFaction} factions={factions} chars={chars} locations={locations}
              onClose={() => updPg({ selectedFactionId: null })}
              onSave={onSaveFaction} onDelete={onDeleteFaction}
              onOpenChar={onOpenChar} onSaveChar={onSaveChar}
              onCancelNew={onCancelNew}/>
          : <EmptyState icon="⚑" title="Select a faction" subtitle="Search above or open the filter drawer"/>
        }
      </div>

      {/* ── Search overlay ── */}
      <div ref={overlayRef} style={{ position:"absolute", top:0, left:0, right:0, zIndex:10, background:"#0f0c1a", borderBottom: drawerOpen ? "1px solid #2a1f3d" : "none", boxShadow: drawerOpen ? "0 8px 32px #00000099" : "0 2px 12px #00000066" }}>
        {/* Top bar */}
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 12px" }}>
          <div style={{ flex:1, position:"relative" }}>
            <span style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", color:"#5a4a7a", fontSize:13, pointerEvents:"none" }}>🔍</span>
            <input
              placeholder="Search factions…"
              value={factionQuery}
              onChange={e => { updPg({ factionQuery: e.target.value }); if (!drawerOpen) setDrawerOpen(true); }}
              onFocus={() => setDrawerOpen(true)}
              style={{ ...inputStyle, paddingLeft:30, fontSize:13, width:"100%", boxSizing:"border-box" }}/>
          </div>
          <button onClick={() => setDrawerOpen(o => !o)}
            style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 10px", borderRadius:6, border:`1px solid ${drawerOpen||hasFilter?"#7c5cbf":"#3a2a5a"}`, background:drawerOpen||hasFilter?"#2a1a4a":"transparent", color:drawerOpen||hasFilter?"#e8d5b7":"#6a5a8a", fontSize:12, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>
            List{hasFilter ? " · 1" : ""} <span style={{ fontSize:9 }}>{drawerOpen?"▲":"▼"}</span>
          </button>
          {hasFilter && (
            <button onClick={() => updPg({ factionQuery: "" })}
              style={{ padding:"4px 8px", borderRadius:6, border:"1px solid #6b1a1a", background:"transparent", color:"#c06060", fontSize:12, cursor:"pointer", flexShrink:0 }}>✕</button>
          )}
          <button onClick={onNewFaction} style={{ ...btnPrimary, fontSize:12, padding:"4px 10px", flexShrink:0 }}>+ New</button>
        </div>

        {/* Drawer */}
        {drawerOpen && (
          <div style={{ borderTop:"1px solid #1e1630", maxHeight:320, display:"flex", flexDirection:"column" }}>
            <div style={{ overflowY:"auto", flex:1 }}>
              {filteredFactions.length === 0
                ? <div style={{ padding:"12px 16px", fontSize:12, color:"#5a4a7a" }}>No factions match.</div>
                : filteredFactions.map(f => (
                    <FactionRow key={f.id} faction={f} chars={chars}
                      isSelected={selectedFactionId===f.id}
                      onSelect={f => { updPg({ selectedFactionId: f.id, factionEditing: false }); setDrawerOpen(false); }}/>
                  ))
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(FactionsTabContent);
