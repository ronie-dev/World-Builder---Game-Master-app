import { memo, useState, useRef, useEffect } from "react";
import { btnPrimary, inputStyle, defaultFilters } from "../../constants.js";
import { highlight } from "../../utils.jsx";
import CharDetailPanel from "../CharDetailPanel.jsx";
import Avatar from "../Avatar.jsx";
import { EmptyState } from "../ui.jsx";

// ── Column header with searchable filter dropdown ─────────────────────────────
function ColHeader({ id, label, value, onChange, opts, style, openId, onOpen, alignRight }) {
  const [q, setQ] = useState("");
  const open = openId === id;
  const active = !!value;
  const selected = opts?.find(o => o.value === value);
  const filteredOpts = opts?.filter(o => !q || o.label.toLowerCase().includes(q.toLowerCase()));

  useEffect(() => { if (!open) setQ(""); }, [open]);

  return (
    <div style={{ position:"relative", ...style }}>
      <div onClick={() => opts && onOpen(open ? null : id)}
        style={{ display:"flex", alignItems:"center", gap:3, padding:"5px 8px", fontSize:11, fontWeight:700, letterSpacing:.5, textTransform:"uppercase", cursor:opts?"pointer":"default", userSelect:"none", color:active?"#c8a96e":"#5a4a7a", borderBottom:`2px solid ${active?"#7c5cbf":"#2a1f3d"}`, whiteSpace:"nowrap", overflow:"hidden" }}>
        <span style={{ overflow:"hidden", textOverflow:"ellipsis" }}>{active ? `${label}: ${selected?.label||value}` : label}</span>
        {opts && <span style={{ fontSize:8, opacity:.6, flexShrink:0 }}>{open?"▴":"▾"}</span>}
      </div>
      {open && opts && (
        <div onMouseDown={e=>e.stopPropagation()} style={{ position:"absolute", top:"100%", [alignRight?"right":"left"]:0, zIndex:300, background:"#1a1228", border:"1px solid #3a2a5a", borderRadius:8, boxShadow:"0 6px 24px #00000099", minWidth:160, overflow:"hidden" }}>
          <div style={{ padding:"6px 8px", borderBottom:"1px solid #2a1f3d" }}>
            <input autoFocus placeholder="Search…" value={q} onChange={e=>setQ(e.target.value)}
              onKeyDown={e=>e.key==="Escape"&&onOpen(null)}
              style={{ ...inputStyle, fontSize:11, padding:"3px 8px", width:"100%", boxSizing:"border-box" }}/>
          </div>
          <div style={{ maxHeight:200, overflowY:"auto" }}>
            <div onMouseDown={() => { onChange(""); onOpen(null); }}
              style={{ padding:"6px 12px", fontSize:12, color:!value?"#c8a96e":"#9a7fa0", cursor:"pointer" }}
              onMouseEnter={e=>e.currentTarget.style.background="#1e1630"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              All
            </div>
            {filteredOpts.map(o => (
              <div key={o.value} onMouseDown={() => { onChange(o.value); onOpen(null); }}
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

// ── Table row ─────────────────────────────────────────────────────────────────
function TableRow({ char, races, factions, locations, charStatuses, isSelected, onSelect, query }) {
  const faction = factions.find(f => (char.factions||[]).some(e => e.factionId===f.id));
  const location = locations.find(l => l.id === char.locationId);
  const race = races?.find(r => r.id === char.raceId);
  const statusColor = charStatuses?.find(s => s.name === char.status)?.color;
  const typeLabel = char.type === "main" ? "⭐ Main" : "👤 Side";
  return (
    <div onClick={() => onSelect(char)}
      style={{ display:"flex", alignItems:"center", borderBottom:"1px solid #13101e", cursor:"pointer", background:isSelected?"#1e1535":"transparent", borderLeft:`2px solid ${isSelected?"#7c5cbf":"transparent"}`, transition:"background .08s" }}
      onMouseEnter={e=>{ if(!isSelected) e.currentTarget.style.background="#13101e"; }}
      onMouseLeave={e=>{ if(!isSelected) e.currentTarget.style.background="transparent"; }}>
      {/* Name */}
      <div style={{ flex:1, display:"flex", alignItems:"center", gap:6, padding:"5px 8px", minWidth:0 }}>
        <Avatar src={char.image} name={char.name} size={20}/>
        <span style={{ fontSize:13, color:"#e8d5b7", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flexShrink:0 }}>
          {highlight(char.name, query)}
        </span>
        {char.shortDescription && (
          <span style={{ fontSize:11, color:"#5a4a7a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontStyle:"italic" }}>
            {char.shortDescription}
          </span>
        )}
      </div>
      {/* Race */}
      <div style={{ width:80, padding:"5px 6px", fontSize:11, color:"#9a7fa0", flexShrink:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
        {race?.name||"—"}
      </div>
      {/* Status */}
      <div style={{ width:72, padding:"5px 6px", fontSize:11, color:statusColor||"#5a4a7a", flexShrink:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
        {char.status||"—"}
      </div>
      {/* Faction */}
      <div style={{ width:100, padding:"5px 6px", fontSize:11, color:"#7c5cbf", flexShrink:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
        {faction?.name||"—"}
      </div>
      {/* Location */}
      <div style={{ width:90, padding:"5px 6px", fontSize:11, color:"#5a8abf", flexShrink:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
        {location?.name||"—"}
      </div>
      {/* Type */}
      <div style={{ width:62, padding:"5px 6px", fontSize:11, color:"#9a7fa0", flexShrink:0 }}>
        {typeLabel}
      </div>
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
  mainCollapsed, sideCollapsed,
  updPg,
  onNewChar, onDeleteChar, onCancelNew,
  onOpenStory, onOpenFaction, onOpenChar, onOpenArtifact,
  onSaveChar, onSaveFaction, onUpdateArtifacts,
  onPinCharHook, pinnedCharHookIds, rarities,
}) {
  const [drawerOpen, setDrawerOpen] = useState(!selectedCharId);
  const [typeFilter, setTypeFilter] = useState("");
  const [openCol, setOpenCol] = useState(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!drawerOpen) return;
    const handler = e => {
      if (overlayRef.current && !overlayRef.current.contains(e.target)) setDrawerOpen(false);
      setOpenCol(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [drawerOpen]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length + (query ? 1 : 0) + (typeFilter ? 1 : 0);
  const allChars = [...main, ...side].filter(c => !typeFilter || c.type === typeFilter);

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minHeight:0, position:"relative" }}>

      {/* ── Detail panel ── */}
      <div style={{ position:"absolute", inset:0, overflowY:"auto", paddingTop:44 }}>
        {selectedChar
          ? <CharDetailPanel
              key={selectedChar.id}
              char={selectedChar} chars={chars} races={races} factions={factions}
              stories={stories} locations={locations} loreEvents={loreEvents}
              charStatuses={charStatuses} storyStatuses={storyStatuses}
              hookStatuses={hookStatuses} relationshipTypes={relationshipTypes}
              onClose={() => { updPg({ selectedCharId: null }); setDrawerOpen(true); }}
              onDelete={onDeleteChar} onCancelNew={onCancelNew} onOpenStory={onOpenStory}
              onOpenFaction={onOpenFaction} onOpenChar={onOpenChar}
              onUpdateChar={onSaveChar} onSaveFaction={onSaveFaction} artifacts={artifacts}
              onUpdateArtifacts={onUpdateArtifacts} onOpenArtifact={onOpenArtifact}
              onPinCharHook={onPinCharHook} pinnedCharHookIds={pinnedCharHookIds}
              rarities={rarities}/>
          : <EmptyState icon="👤" title="Select a character" subtitle="Search above or open the filter drawer"/>
        }
      </div>

      {/* ── Search overlay ── */}
      <div ref={overlayRef} style={{ position:"absolute", top:0, left:0, right:0, zIndex:10, background:"#0f0c1a", borderBottom: drawerOpen ? "1px solid #2a1f3d" : "none", boxShadow: drawerOpen ? "0 8px 32px #00000099" : "0 2px 12px #00000066" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 12px" }}>
          <div style={{ flex:1, position:"relative" }}>
            <span style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", color:"#5a4a7a", fontSize:13, pointerEvents:"none" }}>🔍</span>
            <input
              placeholder="Search characters…"
              value={query}
              onChange={e => { updPg({ query: e.target.value }); if (!drawerOpen) setDrawerOpen(true); }}
              onFocus={() => setDrawerOpen(true)}
              style={{ ...inputStyle, paddingLeft:30, fontSize:13, width:"100%", boxSizing:"border-box" }}/>
          </div>
          <button onClick={() => setDrawerOpen(o => !o)}
            style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 10px", borderRadius:6, border:`1px solid ${drawerOpen||activeFilterCount>0?"#7c5cbf":"#3a2a5a"}`, background:drawerOpen||activeFilterCount>0?"#2a1a4a":"transparent", color:drawerOpen||activeFilterCount>0?"#e8d5b7":"#6a5a8a", fontSize:12, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>
            {activeFilterCount > 0 ? `Filters · ${activeFilterCount}` : "Filters"} <span style={{ fontSize:9 }}>{drawerOpen?"▲":"▼"}</span>
          </button>
          {activeFilterCount > 0 && (
            <button onClick={() => { updPg({ query:"", filters: defaultFilters }); setTypeFilter(""); }}
              style={{ padding:"4px 8px", borderRadius:6, border:"1px solid #6b1a1a", background:"transparent", color:"#c06060", fontSize:12, cursor:"pointer", flexShrink:0 }}>✕</button>
          )}
          <button onClick={() => onNewChar("main")} style={{ ...btnPrimary, fontSize:12, padding:"4px 10px", flexShrink:0 }}>+ New</button>
        </div>

        {/* ── Drawer ── */}
        {drawerOpen && (
          <div style={{ borderTop:"1px solid #1e1630", maxHeight:360, display:"flex", flexDirection:"column" }}>

            {/* Player chips */}
            {allPlayers.length > 0 && (
              <div style={{ padding:"6px 12px", display:"flex", flexWrap:"wrap", gap:6, alignItems:"center", flexShrink:0, borderBottom:"1px solid #1e1630" }}>
                <span style={{ fontSize:11, color:"#5a4a7a", letterSpacing:1, textTransform:"uppercase", flexShrink:0 }}>Players:</span>
                {allPlayers.map(c => (
                  <button key={c.id} onClick={() => { updPg({ selectedCharId: c.id, charEditing: false }); setDrawerOpen(false); }}
                    style={{ display:"flex", alignItems:"center", gap:5, padding:"2px 8px 2px 3px", borderRadius:20, border:`1px solid ${selectedCharId===c.id?"#7c5cbf":"#2a1f3d"}`, background:selectedCharId===c.id?"#2a1a4a":"transparent", cursor:"pointer" }}>
                    <Avatar src={c.image} name={c.name} size={18}/>
                    <span style={{ fontSize:11, color:selectedCharId===c.id?"#e8d5b7":"#9a7fa0" }}>🎲 {c.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Table */}
            <div style={{ display:"flex", flexDirection:"column", flex:1, minHeight:0 }}>
              {/* Column headers — outside scroll so dropdowns aren't clipped */}
              <div style={{ display:"flex", alignItems:"stretch", background:"#0d0b17", flexShrink:0, borderBottom:"1px solid #1e1630" }}>
                <ColHeader id="name" label="Name" openId={openCol} onOpen={setOpenCol} style={{ flex:1, minWidth:0 }}/>
                <ColHeader id="race" label="Race" value={filters.raceId}
                  onChange={v => updPg({ filters: { ...filters, raceId: v } })}
                  opts={races.map(r => ({ value:r.id, label:r.name }))}
                  openId={openCol} onOpen={setOpenCol}
                  style={{ width:80, flexShrink:0 }}/>
                <ColHeader id="status" label="Status" value={filters.status}
                  onChange={v => updPg({ filters: { ...filters, status: v } })}
                  opts={charStatuses.map(s => ({ value:s.name, label:s.name }))}
                  openId={openCol} onOpen={setOpenCol}
                  style={{ width:72, flexShrink:0 }}/>
                <ColHeader id="faction" label="Faction" value={filters.factionId}
                  onChange={v => updPg({ filters: { ...filters, factionId: v } })}
                  opts={factions.map(f => ({ value:f.id, label:f.name }))}
                  openId={openCol} onOpen={setOpenCol}
                  style={{ width:100, flexShrink:0 }}/>
                <ColHeader id="location" label="Location" value={filters.locationId}
                  onChange={v => updPg({ filters: { ...filters, locationId: v } })}
                  opts={locations.map(l => ({ value:l.id, label:l.region?`${l.name} (${l.region})`:l.name }))}
                  openId={openCol} onOpen={setOpenCol} alignRight
                  style={{ width:90, flexShrink:0 }}/>
                <ColHeader id="type" label="Type" value={typeFilter}
                  onChange={setTypeFilter}
                  opts={[{ value:"main", label:"Main" }, { value:"side", label:"Side" }]}
                  openId={openCol} onOpen={setOpenCol} alignRight
                  style={{ width:62, flexShrink:0 }}/>
              </div>

              {/* Rows */}
              <div style={{ overflowY:"auto", flex:1 }}>
                {allChars.length === 0
                  ? <div style={{ padding:"12px 16px", fontSize:12, color:"#5a4a7a" }}>No characters match.</div>
                  : allChars.map(c => (
                      <TableRow key={c.id} char={c} races={races} factions={factions} locations={locations} charStatuses={charStatuses}
                        isSelected={selectedCharId===c.id} query={query}
                        onSelect={c => { updPg({ selectedCharId: c.id, charEditing: false }); setDrawerOpen(false); }}/>
                    ))
                }
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

export default memo(CharactersTabContent);
