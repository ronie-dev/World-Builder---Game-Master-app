import { memo, useState, useRef, useEffect } from "react";
import { btnPrimary, btnSecondary, inputStyle, defaultFilters } from "../../constants.js";
import { getRaceLabel, highlight } from "../../utils.jsx";
import CharDetailPanel from "../CharDetailPanel.jsx";
import Avatar from "../Avatar.jsx";
import { EmptyState } from "../ui.jsx";

// ── Compact filter pill dropdown ──────────────────────────────────────────────
function FilterPill({ label, value, onChange, opts }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const filtered = opts.filter(o => !q || o.label.toLowerCase().includes(q.toLowerCase()));
  const selected = opts.find(o => o.value === value);
  const active = !!value;
  const pick = val => { onChange(val); setOpen(false); setQ(""); };
  return (
    <div style={{ position:"relative", flexShrink:0 }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display:"flex", alignItems:"center", gap:4, padding:"3px 9px", borderRadius:20, border:`1px solid ${active?"#7c5cbf":"#3a2a5a"}`, background:active?"#2a1a4a":"transparent", color:active?"#e8d5b7":"#6a5a8a", fontSize:12, cursor:"pointer", whiteSpace:"nowrap", transition:"all .12s" }}>
        {label}{active ? `: ${selected?.label||value}` : ""} <span style={{ fontSize:9, opacity:.6 }}>▾</span>
      </button>
      {open && (
        <div onMouseLeave={() => { setOpen(false); setQ(""); }}
          style={{ position:"absolute", top:"calc(100% + 4px)", left:0, zIndex:200, background:"#1a1228", border:"1px solid #3a2a5a", borderRadius:8, boxShadow:"0 6px 24px #00000088", minWidth:160, overflow:"hidden" }}>
          <div style={{ padding:"6px 8px", borderBottom:"1px solid #2a1f3d" }}>
            <input autoFocus placeholder="Search…" value={q} onChange={e => setQ(e.target.value)}
              onKeyDown={e => e.key==="Escape" && setOpen(false)}
              style={{ ...inputStyle, fontSize:12, padding:"3px 8px", width:"100%", boxSizing:"border-box" }}/>
          </div>
          <div style={{ maxHeight:160, overflowY:"auto" }}>
            <div onMouseDown={() => pick("")}
              style={{ padding:"6px 12px", fontSize:12, color:!value?"#c8a96e":"#9a7fa0", cursor:"pointer" }}
              onMouseEnter={e=>e.currentTarget.style.background="#1e1630"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              All
            </div>
            {filtered.map(o => (
              <div key={o.value} onMouseDown={() => pick(o.value)}
                style={{ padding:"6px 12px", fontSize:12, color:value===o.value?"#c8a96e":"#9a7fa0", cursor:"pointer", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}
                onMouseEnter={e=>e.currentTarget.style.background="#1e1630"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                {o.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Compact character row ─────────────────────────────────────────────────────
function CharRow({ char, races, factions, isSelected, onSelect, query }) {
  const race = getRaceLabel(races, char.raceId, char.subraceId);
  const faction = factions.find(f => (char.factions||[]).some(e => e.factionId===f.id));
  const typeIcon = char.type==="player" ? "🎲" : char.type==="main" ? "⭐" : "👤";
  return (
    <div onClick={() => onSelect(char)}
      style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 10px", borderRadius:6, cursor:"pointer", background:isSelected?"#1e1535":"transparent", borderLeft:`2px solid ${isSelected?"#7c5cbf":"transparent"}`, transition:"background .1s" }}
      onMouseEnter={e=>{ if(!isSelected) e.currentTarget.style.background="#13101e"; }}
      onMouseLeave={e=>{ if(!isSelected) e.currentTarget.style.background="transparent"; }}>
      <Avatar src={char.image} name={char.name} size={22}/>
      <span style={{ fontSize:13, color:"#e8d5b7", flex:1, minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
        {highlight(char.name, query)}
      </span>
      <span style={{ fontSize:11, flexShrink:0 }}>{typeIcon}</span>
      {race && <span style={{ fontSize:11, color:"#5a4a7a", flexShrink:0, maxWidth:70, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{race}</span>}
      {faction && <span style={{ fontSize:11, color:"#7c5cbf", flexShrink:0, maxWidth:80, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{faction.name}</span>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
function CharactersTabContent({
  chars, races, factions, locations, stories, loreEvents, artifacts,
  charStatuses, storyStatuses, hookStatuses, relationshipTypes,
  allPlayers, main, side,
  query, filters,
  selectedChar, selectedCharId,
  charSubTab, mainCollapsed, sideCollapsed,
  updPg,
  onNewChar, onDeleteChar, onCancelNew,
  onOpenStory, onOpenFaction, onOpenChar, onOpenArtifact,
  onSaveChar, onSaveFaction, onUpdateArtifacts,
  onPinCharHook, pinnedCharHookIds, rarities,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!drawerOpen) return;
    const handler = e => { if (overlayRef.current && !overlayRef.current.contains(e.target)) setDrawerOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [drawerOpen]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length + (query ? 1 : 0);
  const allChars = [...allPlayers, ...main, ...side];

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minHeight:0, position:"relative" }}>

      {/* ── Detail: fills full height, sits behind overlay ── */}
      <div style={{ position:"absolute", inset:0, overflowY:"auto", paddingTop:44 }}>
        {selectedChar
          ? <CharDetailPanel
              key={selectedChar.id}
              char={selectedChar} chars={chars} races={races} factions={factions}
              stories={stories} locations={locations} loreEvents={loreEvents}
              charStatuses={charStatuses} storyStatuses={storyStatuses}
              hookStatuses={hookStatuses} relationshipTypes={relationshipTypes}
              onClose={() => updPg({ selectedCharId: null })}
              onDelete={onDeleteChar} onCancelNew={onCancelNew} onOpenStory={onOpenStory}
              onOpenFaction={onOpenFaction} onOpenChar={onOpenChar}
              onUpdateChar={onSaveChar} onSaveFaction={onSaveFaction} artifacts={artifacts}
              onUpdateArtifacts={onUpdateArtifacts} onOpenArtifact={onOpenArtifact}
              onPinCharHook={onPinCharHook} pinnedCharHookIds={pinnedCharHookIds}
              subTab={charSubTab} onSubTabChange={v => updPg({ charSubTab: v })} rarities={rarities}/>
          : <EmptyState icon="👤" title="Select a character" subtitle="Search above or open the filter drawer"/>
        }
      </div>

      {/* ── Search overlay: floats on top ── */}
      <div ref={overlayRef} style={{ position:"absolute", top:0, left:0, right:0, zIndex:10, background:"#0f0c1a", borderBottom: drawerOpen ? "1px solid #2a1f3d" : "none", boxShadow: drawerOpen ? "0 8px 32px #00000099" : "0 2px 12px #00000066" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 12px" }}>
          {/* Search input */}
          <div style={{ flex:1, position:"relative" }}>
            <span style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", color:"#5a4a7a", fontSize:13, pointerEvents:"none" }}>🔍</span>
            <input
              placeholder="Search characters…"
              value={query}
              onChange={e => { updPg({ query: e.target.value }); if (!drawerOpen) setDrawerOpen(true); }}
              onFocus={() => setDrawerOpen(true)}
              style={{ ...inputStyle, paddingLeft:30, fontSize:13, width:"100%", boxSizing:"border-box" }}/>
          </div>
          {/* Filters toggle */}
          <button onClick={() => setDrawerOpen(o => !o)}
            style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 10px", borderRadius:6, border:`1px solid ${drawerOpen||activeFilterCount>0?"#7c5cbf":"#3a2a5a"}`, background:drawerOpen||activeFilterCount>0?"#2a1a4a":"transparent", color:drawerOpen||activeFilterCount>0?"#e8d5b7":"#6a5a8a", fontSize:12, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>
            {activeFilterCount > 0 ? `Filters · ${activeFilterCount}` : "Filters"} <span style={{ fontSize:9 }}>{drawerOpen?"▲":"▼"}</span>
          </button>
          {/* Clear */}
          {activeFilterCount > 0 && (
            <button onClick={() => { updPg({ query:"", filters: defaultFilters }); }}
              style={{ padding:"4px 8px", borderRadius:6, border:"1px solid #6b1a1a", background:"transparent", color:"#c06060", fontSize:12, cursor:"pointer", flexShrink:0 }}>✕</button>
          )}
          {/* New */}
          <button onClick={() => onNewChar("main")} style={{ ...btnPrimary, fontSize:12, padding:"4px 10px", flexShrink:0 }}>+ New</button>
        </div>

        {/* ── Drawer: filters + list ── */}
        {drawerOpen && (
          <div style={{ borderTop:"1px solid #1e1630", maxHeight:320, display:"flex", flexDirection:"column" }}>
            {/* Filter pills + player chips */}
            <div style={{ padding:"8px 12px", display:"flex", flexWrap:"wrap", gap:6, flexShrink:0, borderBottom:"1px solid #1e1630" }}>
              {/* Player chips */}
              {allPlayers.map(c => (
                <button key={c.id} onClick={() => { updPg({ selectedCharId: c.id, charEditing: false }); setDrawerOpen(false); }}
                  style={{ display:"flex", alignItems:"center", gap:5, padding:"2px 8px 2px 3px", borderRadius:20, border:`1px solid ${selectedCharId===c.id?"#7c5cbf":"#2a1f3d"}`, background:selectedCharId===c.id?"#2a1a4a":"transparent", cursor:"pointer" }}>
                  <Avatar src={c.image} name={c.name} size={18}/>
                  <span style={{ fontSize:11, color:selectedCharId===c.id?"#e8d5b7":"#9a7fa0" }}>🎲 {c.name}</span>
                </button>
              ))}
              {/* Filter pills */}
              <FilterPill label="Race" value={filters.raceId} onChange={v => updPg({ filters: { ...filters, raceId: v } })}
                opts={races.map(r => ({ value:r.id, label:r.name }))}/>
              <FilterPill label="Status" value={filters.status} onChange={v => updPg({ filters: { ...filters, status: v } })}
                opts={charStatuses.map(s => ({ value:s.name, label:s.name }))}/>
              <FilterPill label="Faction" value={filters.factionId} onChange={v => updPg({ filters: { ...filters, factionId: v } })}
                opts={factions.map(f => ({ value:f.id, label:f.name }))}/>
              <FilterPill label="Location" value={filters.locationId} onChange={v => updPg({ filters: { ...filters, locationId: v } })}
                opts={locations.map(l => ({ value:l.id, label:l.region?`${l.name} (${l.region})`:l.name }))}/>
              <button onClick={() => onNewChar("side")} style={{ ...btnSecondary, fontSize:11, padding:"3px 9px" }}>+ Side</button>
              <button onClick={() => onNewChar("player")} style={{ ...btnSecondary, fontSize:11, padding:"3px 9px" }}>+ Player</button>
            </div>
            {/* Compact list */}
            <div style={{ overflowY:"auto", flex:1 }}>
              {allChars.length === 0
                ? <div style={{ padding:"12px 16px", fontSize:12, color:"#5a4a7a" }}>No characters match.</div>
                : allChars.map(c => (
                    <CharRow key={c.id} char={c} races={races} factions={factions}
                      isSelected={selectedCharId===c.id} query={query}
                      onSelect={c => { updPg({ selectedCharId: c.id, charEditing: false }); setDrawerOpen(false); }}/>
                  ))
              }
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

export default memo(CharactersTabContent);
