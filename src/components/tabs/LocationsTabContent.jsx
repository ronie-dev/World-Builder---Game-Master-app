import { memo, useState, useRef, useEffect } from "react";
import { btnPrimary, inputStyle } from "../../constants.js";
import LocationDetailPanel from "../LocationDetailPanel.jsx";
import { EmptyState } from "../ui.jsx";

// ── Compact location row ──────────────────────────────────────────────────────
function LocationRow({ location, isSelected, onSelect }) {
  return (
    <div onClick={() => onSelect(location)}
      style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 10px", borderRadius:6, cursor:"pointer", background:isSelected?"#1e1535":"transparent", borderLeft:`2px solid ${isSelected?"#7c5cbf":"transparent"}`, transition:"background .1s" }}
      onMouseEnter={e=>{ if(!isSelected) e.currentTarget.style.background="#13101e"; }}
      onMouseLeave={e=>{ if(!isSelected) e.currentTarget.style.background="transparent"; }}>
      <span style={{ fontSize:14, flexShrink:0 }}>📍</span>
      <span style={{ fontSize:13, color:"#e8d5b7", flex:1, minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
        {location.name}
      </span>
      {location.type && <span style={{ fontSize:10, color:"#7c5cbf", background:"#1a3a6b", borderRadius:4, padding:"1px 5px", flexShrink:0 }}>{location.type}</span>}
      {location.region && <span style={{ fontSize:10, color:"#5a4a7a", flexShrink:0, maxWidth:80, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{location.region}</span>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
function LocationsTabContent({
  locations, chars, factions, stories, mapData,
  locationQuery, locationTypeFilter, collapsedLocTypes,
  selectedLocation, selectedLocationId,
  updPg,
  onNewLocation, onSaveLocation, onDeleteLocation,
  onOpenChar, onOpenStory, onOpenFaction, onSaveFaction, onShowOnMap,
  locationTypes,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!drawerOpen) return;
    const handler = e => { if (overlayRef.current && !overlayRef.current.contains(e.target)) setDrawerOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [drawerOpen]);

  const hasFilter = !!(locationQuery || locationTypeFilter);

  const q = locationQuery.toLowerCase();
  const filtered = locations.filter(l =>
    (!q || l.name?.toLowerCase().includes(q) || l.region?.toLowerCase().includes(q) || l.description?.toLowerCase().includes(q)) &&
    (!locationTypeFilter || l.type === locationTypeFilter)
  );

  // Group filtered locations by type for the drawer
  const lt = locationTypes || [];
  const groups = lt.reduce((acc, t) => {
    const items = filtered.filter(l => l.type === t);
    if (items.length) acc.push({ type: t, items });
    return acc;
  }, []);
  const ungrouped = filtered.filter(l => !l.type || !lt.includes(l.type));
  if (ungrouped.length) groups.push({ type: "Other", items: ungrouped });

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minHeight:0, position:"relative" }}>

      {/* ── Detail: fills full height ── */}
      <div style={{ position:"absolute", inset:0, overflowY:"auto", paddingTop:44 }}>
        {selectedLocation
          ? <LocationDetailPanel
              location={selectedLocation} chars={chars} factions={factions} stories={stories}
              onClose={() => updPg({ selectedLocationId: null })}
              onSave={onSaveLocation}
              onDelete={id => { onDeleteLocation(id); updPg({ selectedLocationId: null }); }}
              onOpenChar={onOpenChar} onOpenStory={onOpenStory} onOpenFaction={onOpenFaction}
              onSaveFaction={onSaveFaction}
              onShowOnMap={(mapData?.maps||[]).some(m=>(m.pins||[]).some(p=>p.locationId===selectedLocation.id)) ? ()=>onShowOnMap(selectedLocation) : undefined}
              locationTypes={locationTypes}/>
          : <EmptyState icon="📍" title="Select a location" subtitle="Search above or open the filter drawer"/>
        }
      </div>

      {/* ── Search overlay ── */}
      <div ref={overlayRef} style={{ position:"absolute", top:0, left:0, right:0, zIndex:10, background:"#0f0c1a", borderBottom: drawerOpen ? "1px solid #2a1f3d" : "none", boxShadow: drawerOpen ? "0 8px 32px #00000099" : "0 2px 12px #00000066" }}>
        {/* Top bar */}
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 12px" }}>
          <div style={{ flex:1, position:"relative" }}>
            <span style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", color:"#5a4a7a", fontSize:13, pointerEvents:"none" }}>🔍</span>
            <input
              placeholder="Search locations…"
              value={locationQuery}
              onChange={e => { updPg({ locationQuery: e.target.value }); if (!drawerOpen) setDrawerOpen(true); }}
              onFocus={() => setDrawerOpen(true)}
              style={{ ...inputStyle, paddingLeft:30, fontSize:13, width:"100%", boxSizing:"border-box" }}/>
          </div>
          <button onClick={() => setDrawerOpen(o => !o)}
            style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 10px", borderRadius:6, border:`1px solid ${drawerOpen||hasFilter?"#7c5cbf":"#3a2a5a"}`, background:drawerOpen||hasFilter?"#2a1a4a":"transparent", color:drawerOpen||hasFilter?"#e8d5b7":"#6a5a8a", fontSize:12, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>
            Filters{hasFilter ? " · 1" : ""} <span style={{ fontSize:9 }}>{drawerOpen?"▲":"▼"}</span>
          </button>
          {hasFilter && (
            <button onClick={() => updPg({ locationQuery:"", locationTypeFilter:"" })}
              style={{ padding:"4px 8px", borderRadius:6, border:"1px solid #6b1a1a", background:"transparent", color:"#c06060", fontSize:12, cursor:"pointer", flexShrink:0 }}>✕</button>
          )}
          <button onClick={onNewLocation} style={{ ...btnPrimary, fontSize:12, padding:"4px 10px", flexShrink:0 }}>+ New</button>
        </div>

        {/* Drawer */}
        {drawerOpen && (
          <div style={{ borderTop:"1px solid #1e1630", maxHeight:320, display:"flex", flexDirection:"column" }}>
            {/* Type filter pills */}
            {lt.length > 0 && (
              <div style={{ padding:"8px 12px", display:"flex", flexWrap:"wrap", gap:6, flexShrink:0, borderBottom:"1px solid #1e1630" }}>
                <button onClick={() => updPg({ locationTypeFilter:"" })}
                  style={{ padding:"3px 10px", borderRadius:20, border:`1px solid ${!locationTypeFilter?"#7c5cbf":"#3a2a5a"}`, background:!locationTypeFilter?"#2a1a4a":"transparent", color:!locationTypeFilter?"#e8d5b7":"#6a5a8a", fontSize:12, cursor:"pointer" }}>
                  All
                </button>
                {lt.map(t => (
                  <button key={t} onClick={() => updPg({ locationTypeFilter: locationTypeFilter===t ? "" : t })}
                    style={{ padding:"3px 10px", borderRadius:20, border:`1px solid ${locationTypeFilter===t?"#7c5cbf":"#3a2a5a"}`, background:locationTypeFilter===t?"#2a1a4a":"transparent", color:locationTypeFilter===t?"#e8d5b7":"#6a5a8a", fontSize:12, cursor:"pointer" }}>
                    {t}
                  </button>
                ))}
              </div>
            )}
            {/* Grouped list */}
            <div style={{ overflowY:"auto", flex:1 }}>
              {filtered.length === 0
                ? <div style={{ padding:"12px 16px", fontSize:12, color:"#5a4a7a" }}>No locations match.</div>
                : groups.map(({ type, items }) => (
                    <div key={type}>
                      <div style={{ padding:"5px 12px 2px", fontSize:10, color:"#5a4a7a", fontWeight:700, letterSpacing:.5, textTransform:"uppercase" }}>{type}</div>
                      {items.map(l => (
                        <LocationRow key={l.id} location={l}
                          isSelected={selectedLocationId===l.id}
                          onSelect={l => { updPg({ selectedLocationId: l.id }); setDrawerOpen(false); }}/>
                      ))}
                    </div>
                  ))
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(LocationsTabContent);
