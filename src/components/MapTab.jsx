import { useState, useRef, useEffect, memo } from "react";
import { uid } from "../utils.jsx";
import { btnPrimary, btnSecondary, selStyle } from "../constants.js";

// ── helpers ───────────────────────────────────────────────────────────────────
const zoomBtnStyle = {
  background:"none", border:"none", color:"#9a7fa0", cursor:"pointer",
  fontSize:18, lineHeight:1, padding:"2px 7px", borderRadius:4,
};

const TYPE_ICONS = {
  "City":     "🏙️",
  "Town":     "🏘️",
  "Village":  "🏡",
  "Castle":   "🏰",
  "Keep":     "🏯",
  "Tower":    "🗼",
  "Dungeon":  "⛓️",
  "Cave":     "🪨",
  "Mine":     "⛏️",
  "Forest":   "🌲",
  "Mountain": "⛰️",
  "Ruin":     "🏚️",
  "Port":     "⚓",
  "Harbor":   "⚓",
  "Temple":   "⛪",
  "Shrine":   "⛩️",
  "Tavern":   "🍺",
  "Camp":     "⛺",
  "Outpost":  "🚩",
  "Island":   "🏝️",
  "Swamp":    "🌿",
  "Desert":   "🏜️",
  "Plains":   "🌾",
  "River":    "🌊",
  "Lake":     "💧",
  "Hamlet":   "🏡",
  "Fortress":  "🏰",
  "Ruins":     "🏚️",
  "Wasteland": "💀",
};
const locIcon = loc => TYPE_ICONS[loc.type] || "📍";

// ── component ─────────────────────────────────────────────────────────────────
function MapTab({ mapData, onUpdateMapData, locations, onOpenLocation, onAskConfirm, onCloseConfirm, navTarget }) {
  const maps = mapData?.maps || [];

  const [activeMapIdState, setActiveMapId] = useState(() => maps[0]?.id || null);
  const [placing, setPlacing]         = useState(false);
  const [pendingPin, setPendingPin]   = useState(null);
  const [pinSearch, setPinSearch]     = useState("");
  const [hovered, setHovered]         = useState(null);
  const [zoom, setZoom]               = useState(1);
  const [pan, setPan]                 = useState({ x: 0, y: 0 });
  const [dragging, setDragging]       = useState(false);
  const [dragStart, setDragStart]     = useState(null);
  const [addingMap, setAddingMap]     = useState(false);
  const [newMapName, setNewMapName]   = useState("");
  const [renamingId, setRenamingId]   = useState(null);
  const [renameVal, setRenameVal]     = useState("");
  const [typeFilter, setTypeFilter]   = useState("");
  const [showLabels, setShowLabels]   = useState(() => localStorage.getItem("map_showLabels") !== "false");
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [sidebarType, setSidebarType]     = useState("");
  const [confirmRemovePinId, setConfirmRemovePinId] = useState(null);
  const [sidebarTab, setSidebarTab]       = useState("pins"); // "pins" | "roads"
  const [roadMode, setRoadMode]           = useState(false);
  const [drawingRoad, setDrawingRoad]     = useState(null); // { editingId?:id, locationIds:[], name:"", color:"#c8a96e" }
  const [hoveredRoadId, setHoveredRoadId] = useState(null);
  const [confirmRemoveRoadId, setConfirmRemoveRoadId] = useState(null);
  const [editingRoadId, setEditingRoadId] = useState(null); // road open for inline name/color edit

  const viewportRef = useRef();
  const imgRef      = useRef();
  const fileRef     = useRef();
  const didDrag     = useRef(false);
  const zoomRef     = useRef(zoom);
  const panRef      = useRef(pan);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current  = pan;  }, [pan]);

  useEffect(() => {
    if (!navTarget) return;
    const pin = navTarget.pin;
    let t;
    const tryCenter = () => {
      const el = viewportRef.current;
      const img = imgRef.current;
      if (el && img && img.offsetWidth > 0 && el.getBoundingClientRect().width > 0) {
        const rect = el.getBoundingClientRect();
        const imgX = (pin.x / 100) * img.offsetWidth;
        const imgY = (pin.y / 100) * img.offsetHeight;
        setPan({ x: rect.width / 2 - imgX * zoomRef.current, y: rect.height / 2 - imgY * zoomRef.current });
      } else {
        t = setTimeout(tryCenter, 80);
      }
    };
    t = setTimeout(tryCenter, 80);
    return () => clearTimeout(t);
  }, [navTarget]);

  const activeMapId = navTarget?.mapId && maps.find(m => m.id === navTarget.mapId)
    ? navTarget.mapId
    : maps.find(m => m.id === activeMapIdState) ? activeMapIdState : (maps[0]?.id || null);
  const activeMap = maps.find(m => m.id === activeMapId) || null;
  const image     = activeMap?.image || null;
  const pins      = activeMap?.pins  || [];
  const roads     = activeMap?.roads || [];
  const usedIds   = new Set(pins.map(p => p.locationId));
  const available = locations.filter(l => !usedIds.has(l.id));
  const availableTypes = [...new Set(available.map(l => l.type).filter(Boolean))].sort();
  const filteredAvailable = available.filter(l => {
    const q = pinSearch.toLowerCase();
    const matchText = !q || l.name.toLowerCase().includes(q) || (l.region||"").toLowerCase().includes(q);
    const matchType = !typeFilter || l.type === typeFilter;
    return matchText && matchType;
  });

  // ── Map CRUD ─────────────────────────────────────────────────────────────────
  const updateMaps = updated => onUpdateMapData({ ...mapData, maps: updated });

  const updateActiveMap = patch =>
    updateMaps(maps.map(m => m.id === activeMapId ? { ...m, ...patch } : m));

  const addMap = () => {
    const name = newMapName.trim() || `Map ${maps.length + 1}`;
    const m = { id: uid(), name, image: null, pins: [] };
    updateMaps([...maps, m]);
    setActiveMapId(m.id);
    setNewMapName(""); setAddingMap(false); resetView();
  };

  const deleteMap = id => {
    const name = maps.find(m => m.id === id)?.name || "this map";
    onAskConfirm(`Delete "${name}"? All pins on this map will be lost.`, () => {
      const updated = maps.filter(m => m.id !== id);
      updateMaps(updated);
      if (activeMapId === id) setActiveMapId(updated[0]?.id || null);
      onCloseConfirm();
    });
  };

  const saveRename = () => {
    if (renameVal.trim()) updateMaps(maps.map(m => m.id === renamingId ? { ...m, name: renameVal.trim() } : m));
    setRenamingId(null);
  };

  // ── Zoom / pan ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = viewportRef.current;
    if (!el || !image) return;
    const handler = e => {
      e.preventDefault();
      const rect    = el.getBoundingClientRect();
      const mx      = e.clientX - rect.left;
      const my      = e.clientY - rect.top;
      const factor  = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      const newZoom = Math.min(10, Math.max(0.15, zoomRef.current * factor));
      const imgX    = (mx - panRef.current.x) / zoomRef.current;
      const imgY    = (my - panRef.current.y) / zoomRef.current;
      setZoom(newZoom);
      setPan({ x: mx - imgX * newZoom, y: my - imgY * newZoom });
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [image, activeMapId]);

  const zoomToCenter = factor => {
    const el = viewportRef.current;
    if (!el) return;
    const rect    = el.getBoundingClientRect();
    const mx      = rect.width  / 2;
    const my      = rect.height / 2;
    const newZoom = Math.min(10, Math.max(0.15, zoomRef.current * factor));
    const imgX    = (mx - panRef.current.x) / zoomRef.current;
    const imgY    = (my - panRef.current.y) / zoomRef.current;
    setZoom(newZoom);
    setPan({ x: mx - imgX * newZoom, y: my - imgY * newZoom });
  };

  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const onMouseDown = e => {
    if (e.button !== 0) return;
    didDrag.current = false;
    setDragging(true);
    setDragStart({ sx: e.clientX, sy: e.clientY, px: panRef.current.x, py: panRef.current.y });
  };
  const onMouseMove = e => {
    if (!dragging || !dragStart) return;
    const dx = e.clientX - dragStart.sx;
    const dy = e.clientY - dragStart.sy;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) didDrag.current = true;
    setPan({ x: dragStart.px + dx, y: dragStart.py + dy });
  };
  const onMouseUp = () => { setDragging(false); setDragStart(null); };

  // ── Pin placement ─────────────────────────────────────────────────────────────
  const onViewportClick = e => {
    if (!placing || didDrag.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const imgX = (e.clientX - rect.left - panRef.current.x) / zoomRef.current;
    const imgY = (e.clientY - rect.top  - panRef.current.y) / zoomRef.current;
    const iw   = imgRef.current?.offsetWidth;
    const ih   = imgRef.current?.offsetHeight;
    if (!iw || !ih) return;
    const x = (imgX / iw) * 100;
    const y = (imgY / ih) * 100;
    if (x < 0 || x > 100 || y < 0 || y > 100) return;
    setPendingPin({ x, y, locationId: "" });
    setPlacing(false);
    setPinSearch(""); setTypeFilter("");
  };

  // ── File upload ───────────────────────────────────────────────────────────────
  const [dragOver, setDragOver] = useState(false);

  const loadImageFile = file => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = ev => { updateActiveMap({ image: ev.target.result }); resetView(); };
    reader.readAsDataURL(file);
  };

  const handleUpload = e => {
    loadImageFile(e.target.files[0]);
    e.target.value = "";
  };

  const handleDrop = e => {
    e.preventDefault();
    setDragOver(false);
    loadImageFile(e.dataTransfer.files[0]);
  };

  const handleDragOver = e => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  const confirmPin = () => {
    if (!pendingPin?.locationId) return;
    updateActiveMap({ pins: [...pins, { id: uid(), locationId: pendingPin.locationId, x: pendingPin.x, y: pendingPin.y }] });
    setPendingPin(null); setPinSearch("");
  };

  const removePin = id => updateActiveMap({ pins: pins.filter(p => p.id !== id) });

  // ── Road drawing ──────────────────────────────────────────────────────────────
  const ROAD_STYLES = [
    { id:"solid",   label:"—",   dasharray: null },
    { id:"dashed",  label:"- -", dasharray: "10 5" },
    { id:"dotted",  label:"···", dasharray: "2 5" },
    { id:"striped", label:"═",   dasharray: "10 4 3 4" },
  ];
  const roadDash = style => ROAD_STYLES.find(s => s.id === style)?.dasharray || null;

  const startRoadMode = () => {
    setRoadMode(true);
    setPlacing(false);
    setPendingPin(null);
    setDrawingRoad({ locationIds: [], name: "", color: "#c8a96e", style: "solid" });
    setSidebarTab("roads");
  };
  const startEditPoints = road => {
    setRoadMode(true);
    setPlacing(false);
    setPendingPin(null);
    setDrawingRoad({ editingId: road.id, locationIds: [...road.locationIds], name: road.name, color: road.color, style: road.style || "solid" });
    setSidebarTab("roads");
  };
  const cancelRoadMode = () => { setRoadMode(false); setDrawingRoad(null); };
  const finishRoad = () => {
    if (!drawingRoad || drawingRoad.locationIds.length < 2) { cancelRoadMode(); return; }
    const name = drawingRoad.name.trim() || `Road ${roads.length + 1}`;
    const updated = { id: drawingRoad.editingId || uid(), name, color: drawingRoad.color, style: drawingRoad.style || "solid", locationIds: drawingRoad.locationIds };
    const newRoads = drawingRoad.editingId
      ? roads.map(r => r.id === drawingRoad.editingId ? updated : r)
      : [...roads, updated];
    updateActiveMap({ roads: newRoads });
    cancelRoadMode();
  };
  const togglePinInRoad = locationId => {
    setDrawingRoad(r => {
      const ids = r.locationIds;
      return ids.includes(locationId)
        ? { ...r, locationIds: ids.filter(id => id !== locationId) }
        : { ...r, locationIds: [...ids, locationId] };
    });
  };
  const deleteRoad = id => updateActiveMap({ roads: roads.filter(r => r.id !== id) });

  const centerOnPin = pin => {
    const el = viewportRef.current;
    const img = imgRef.current;
    if (!el || !img) return;
    const rect = el.getBoundingClientRect();
    const imgX = (pin.x / 100) * img.offsetWidth;
    const imgY = (pin.y / 100) * img.offsetHeight;
    setPan({ x: rect.width / 2 - imgX * zoomRef.current, y: rect.height / 2 - imgY * zoomRef.current });
  };

  // Escape cancels road mode or pin placement
  useEffect(() => {
    const handler = e => {
      if (e.key !== "Escape") return;
      if (roadMode) { cancelRoadMode(); return; }
      if (placing) { setPlacing(false); setPendingPin(null); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [roadMode, placing]);

  const cursor = placing ? "crosshair" : roadMode ? "crosshair" : dragging ? "grabbing" : "grab";

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", padding:"28px 32px 0" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12, flexShrink:0 }}>
        <h1 style={{ fontFamily:"Georgia,serif", color:"#e8d5b7", margin:0, fontSize:26 }}>World Map</h1>
        {activeMap && <span style={{ fontSize:12, color:"#5a4a7a", marginTop:4 }}>{pins.length} pin{pins.length!==1?"s":""}</span>}
        <div style={{ marginLeft:"auto", display:"flex", gap:8, alignItems:"center" }}>
          {image && (
            <>
              {/* Zoom controls */}
              <div style={{ display:"flex", alignItems:"center", gap:2, background:"#13101f", border:"1px solid #2a1f3d", borderRadius:6, padding:"2px 4px" }}>
                <button onClick={()=>zoomToCenter(1/1.35)} style={zoomBtnStyle}
                  onMouseEnter={e=>e.currentTarget.style.color="#e8d5b7"} onMouseLeave={e=>e.currentTarget.style.color="#9a7fa0"}>−</button>
                <span style={{ fontSize:12, color:"#9a7fa0", minWidth:44, textAlign:"center", userSelect:"none" }}>{Math.round(zoom*100)}%</span>
                <button onClick={()=>zoomToCenter(1.35)} style={zoomBtnStyle}
                  onMouseEnter={e=>e.currentTarget.style.color="#e8d5b7"} onMouseLeave={e=>e.currentTarget.style.color="#9a7fa0"}>+</button>
                <div style={{ width:1, height:16, background:"#2a1f3d", margin:"0 2px" }}/>
                <button onClick={resetView} title="Reset view" style={{ ...zoomBtnStyle, fontSize:13, color:"#5a4a7a" }}
                  onMouseEnter={e=>e.currentTarget.style.color="#9a7fa0"} onMouseLeave={e=>e.currentTarget.style.color="#5a4a7a"}>⟳</button>
              </div>

              <button onClick={()=>setShowLabels(v=>{ const next=!v; localStorage.setItem("map_showLabels",next); return next; })}
                style={{ ...btnSecondary, background: showLabels?"#2a1f3d":"transparent", borderColor: showLabels?"#7c5cbf":"#3a2a5a", color: showLabels?"#c8a96e":"#9a7fa0" }}>
                🏷️ {showLabels ? "Labels On" : "Labels Off"}
              </button>
              {roadMode ? (
                <button onClick={cancelRoadMode} style={btnSecondary}>✕ Cancel Road</button>
              ) : placing ? (
                <button onClick={()=>{ setPendingPin(null); setPlacing(false); }} style={btnSecondary}>✕ Cancel</button>
              ) : (
                <>
                  <button onClick={()=>{ setPendingPin(null); setPlacing(true); }} disabled={available.length===0}
                    title={available.length===0?"All locations already pinned":""}
                    style={{...btnPrimary, opacity:available.length===0?0.5:1, cursor:available.length===0?"default":"pointer"}}>
                    📍 Place Pin
                  </button>
                  <button onClick={startRoadMode} disabled={pins.length < 2}
                    title={pins.length < 2 ? "Place at least 2 pins first" : "Draw a road between pins"}
                    style={{...btnSecondary, opacity:pins.length<2?0.5:1, cursor:pins.length<2?"default":"pointer"}}>
                    🛤️ Draw Road
                  </button>
                </>
              )}
            </>
          )}
          {activeMap && (
            <button onClick={()=>fileRef.current.click()} style={btnSecondary}>
              {image ? "🖼️ Change Image" : "🖼️ Upload Image"}
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} style={{ display:"none" }}/>
        </div>
      </div>

      {/* Map tabs */}
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10, flexShrink:0, overflowX:"auto", paddingBottom:2 }}>
        {maps.map(m => (
          <div key={m.id} style={{ display:"flex", alignItems:"center", flexShrink:0, background:activeMapId===m.id?"#7c5cbf22":"#13101f", border:`1px solid ${activeMapId===m.id?"#7c5cbf":"#2a1f3d"}`, borderRadius:7, overflow:"hidden" }}>
            {renamingId===m.id ? (
              <input value={renameVal} onChange={e=>setRenameVal(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter") saveRename(); if(e.key==="Escape") setRenamingId(null); }}
                onBlur={saveRename} autoFocus
                style={{ background:"transparent", border:"none", color:"#e8d5b7", fontSize:13, padding:"6px 10px", outline:"none", width:130 }}/>
            ) : (
              <button
                onClick={()=>{ setActiveMapId(m.id); resetView(); }}
                style={{ background:"none", border:"none", color:activeMapId===m.id?"#e8d5b7":"#6a5a8a", cursor:"pointer", fontSize:13, padding:"6px 10px 6px 12px", fontWeight:activeMapId===m.id?700:400, whiteSpace:"nowrap" }}>
                🗺️ {m.name}
                {!m.image && <span style={{ fontSize:10, color:"#5a4a7a", marginLeft:4 }}>(no image)</span>}
              </button>
            )}
            {/* Rename button — always visible */}
            {renamingId!==m.id && (
              <button onClick={()=>{ setRenamingId(m.id); setRenameVal(m.name); }} title="Rename map"
                style={{ background:"none", border:"none", borderLeft:"1px solid #2a1f3d", color:"#4a3a6a", cursor:"pointer", fontSize:11, padding:"6px 7px", lineHeight:1 }}
                onMouseEnter={e=>e.currentTarget.style.color="#9a7fa0"}
                onMouseLeave={e=>e.currentTarget.style.color="#4a3a6a"}>✏️</button>
            )}
            <button onClick={()=>deleteMap(m.id)} title="Delete map"
              style={{ background:"none", border:"none", borderLeft:"1px solid #2a1f3d", color:"#5a3a3a", cursor:"pointer", fontSize:12, padding:"6px 8px", lineHeight:1 }}
              onMouseEnter={e=>e.currentTarget.style.color="#c06060"}
              onMouseLeave={e=>e.currentTarget.style.color="#5a3a3a"}>🗑️</button>
          </div>
        ))}

        {/* Add map */}
        {addingMap ? (
          <div style={{ display:"flex", alignItems:"center", gap:4, background:"#13101f", border:"1px solid #3a2a5a", borderRadius:7, padding:"3px 8px", flexShrink:0 }}>
            <input value={newMapName} onChange={e=>setNewMapName(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter") addMap(); if(e.key==="Escape") setAddingMap(false); }}
              placeholder="Map name…" autoFocus
              style={{ background:"transparent", border:"none", color:"#e8d5b7", fontSize:13, outline:"none", width:130 }}/>
            <button onClick={addMap} style={{ background:"none", border:"none", color:"#7c5cbf", cursor:"pointer", fontSize:14, padding:"0 3px" }}>✓</button>
            <button onClick={()=>setAddingMap(false)} style={{ background:"none", border:"none", color:"#5a4a7a", cursor:"pointer", fontSize:14, padding:"0 3px" }}>✕</button>
          </div>
        ) : (
          <button onClick={()=>setAddingMap(true)}
            style={{ background:"#13101f", border:"1px dashed #3a2a5a", borderRadius:7, color:"#5a4a7a", cursor:"pointer", fontSize:12, padding:"6px 12px", flexShrink:0, whiteSpace:"nowrap" }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor="#7c5cbf"; e.currentTarget.style.color="#9a7fa0"; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor="#3a2a5a"; e.currentTarget.style.color="#5a4a7a"; }}>
            + Add Map
          </button>
        )}
      </div>

      {placing && (
        <div style={{ background:"#7c5cbf18", border:"1px solid #7c5cbf55", borderRadius:8, padding:"8px 16px", marginBottom:8, fontSize:13, color:"#c8a96e", flexShrink:0 }}>
          🖱️ Click on the map to place a pin &nbsp;·&nbsp; Scroll to zoom &nbsp;·&nbsp; Drag to pan
        </div>
      )}
      {roadMode && drawingRoad && (
        <div style={{ background:"#1a3a1a", border:"1px solid #3a6a3a", borderRadius:8, padding:"8px 16px", marginBottom:8, flexShrink:0, display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:13, color:"#a8d8a8" }}>🛤️ Click location pins to add them to the road &nbsp;·&nbsp; Esc to cancel</span>
          <span style={{ fontSize:12, color:"#5a8a5a" }}>{drawingRoad.locationIds.length} point{drawingRoad.locationIds.length!==1?"s":""} selected</span>
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8 }}>
            <input value={drawingRoad.name} onChange={e=>setDrawingRoad(r=>({...r,name:e.target.value}))}
              placeholder="Road name…"
              style={{ background:"#0d1a0d", border:"1px solid #3a6a3a", borderRadius:5, color:"#e8d5b7", fontSize:12, padding:"4px 8px", outline:"none", width:120 }}/>
            <input type="color" value={drawingRoad.color}
              onChange={e=>setDrawingRoad(r=>({...r,color:e.target.value}))}
              title="Road color"
              style={{ width:28, height:28, padding:2, border:"1px solid #3a6a3a", borderRadius:4, background:"transparent", cursor:"pointer" }}/>
            {/* Style picker */}
            <div style={{ display:"flex", gap:3 }}>
              {ROAD_STYLES.map(s => {
                const sel = (drawingRoad.style||"solid") === s.id;
                return (
                  <button key={s.id} onClick={()=>setDrawingRoad(r=>({...r,style:s.id}))} title={s.id}
                    style={{ background:sel?"#2a4a2a":"transparent", border:`1px solid ${sel?"#5a9a5a":"#3a6a3a"}`, borderRadius:4, cursor:"pointer", padding:"3px 7px" }}>
                    <svg width="22" height="8" viewBox="0 0 22 8">
                      <line x1="1" y1="4" x2="21" y2="4" stroke={sel?"#a8d8a8":"#5a8a5a"} strokeWidth="2"
                        strokeDasharray={s.dasharray||undefined} strokeLinecap="round"/>
                    </svg>
                  </button>
                );
              })}
            </div>
            <button onClick={finishRoad} disabled={drawingRoad.locationIds.length < 2}
              style={{...btnPrimary, fontSize:12, padding:"4px 14px", opacity:drawingRoad.locationIds.length<2?0.5:1}}>
              ✓ Done
            </button>
          </div>
        </div>
      )}

      {/* No maps */}
      {maps.length === 0 && (
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:52, marginBottom:16 }}>🗺️</div>
            <div style={{ color:"#5a4a7a", fontSize:15, marginBottom:8 }}>No maps yet.</div>
            <div style={{ color:"#3a2a5a", fontSize:13 }}>Click "+ Add Map" above to get started.</div>
          </div>
        </div>
      )}

      {/* No image for active map */}
      {activeMap && !image && (
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}
          onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
          <div style={{ border:`2px dashed ${dragOver?"#7c5cbf":"#3a2a5a"}`, borderRadius:16, padding:"48px", textAlign:"center", background:dragOver?"#1a1228":"#0d0b14", transition:"border-color .15s, background .15s" }}>
            <div style={{ fontSize:48, marginBottom:14 }}>🖼️</div>
            <div style={{ color:"#5a4a7a", fontSize:15, marginBottom:20 }}>No image for <strong style={{ color:"#9a7fa0" }}>{activeMap.name}</strong></div>
            <button onClick={()=>fileRef.current.click()} style={btnPrimary}>Upload Map Image</button>
            <div style={{ color:"#3a2a5a", fontSize:12, marginTop:10 }}>PNG, JPG, WebP — drag & drop or click to upload</div>
          </div>
        </div>
      )}

      {/* Viewport + sidebar */}
      {activeMap && image && (
        <div style={{ flex:1, display:"flex", gap:0, overflow:"hidden", marginBottom:28, borderRadius:8, border:"1px solid #2a1f3d" }}>

        {/* Map viewport */}
        <div ref={viewportRef}
          style={{ flex:1, overflow:"hidden", position:"relative", cursor, background:"#080610", border:`1px solid ${dragOver?"#7c5cbf":"transparent"}`, borderRadius:"8px 0 0 8px", transition:"border-color .15s" }}
          onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
          onClick={onViewportClick}
          onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>

          {/* Pan + zoom transform */}
          <div style={{ position:"absolute", top:0, left:0, transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})`, transformOrigin:"0 0", userSelect:"none" }}>
            <div style={{ position:"relative", display:"inline-block", lineHeight:0 }}>
              <img ref={imgRef} src={image} alt={activeMap.name} draggable={false} style={{ display:"block", maxWidth:"none" }}/>

              {/* Roads SVG overlay */}
              <svg viewBox="0 0 100 100" preserveAspectRatio="none"
                style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none", zIndex:2, overflow:"visible" }}>
                {roads.map(road => {
                  const pts = road.locationIds
                    .map(lid => { const p = pins.find(pin => pin.locationId === lid); return p ? `${p.x},${p.y}` : null; })
                    .filter(Boolean);
                  if (pts.length < 2) return null;
                  const isHov = hoveredRoadId === road.id;
                  const dash = roadDash(road.style);
                  return (
                    <polyline key={road.id} points={pts.join(" ")}
                      stroke={road.color || "#c8a96e"} strokeWidth={isHov ? 3 : 2}
                      strokeDasharray={dash || undefined}
                      strokeLinecap="round" strokeLinejoin="round"
                      fill="none" vectorEffect="non-scaling-stroke"
                      opacity={isHov ? 1 : 0.75}
                      style={{ transition:"stroke-width .15s, opacity .15s" }}/>
                  );
                })}
                {/* Preview while drawing */}
                {roadMode && drawingRoad && drawingRoad.locationIds.length > 0 && (() => {
                  const pts = drawingRoad.locationIds
                    .map(lid => { const p = pins.find(pin => pin.locationId === lid); return p ? `${p.x},${p.y}` : null; })
                    .filter(Boolean);
                  if (pts.length < 1) return null;
                  const dash = roadDash(drawingRoad.style);
                  return (
                    <polyline points={pts.join(" ")}
                      stroke={drawingRoad.color || "#c8a96e"} strokeWidth={2}
                      strokeDasharray={dash || "4 3"} strokeLinecap="round" strokeLinejoin="round"
                      fill="none" vectorEffect="non-scaling-stroke" opacity={0.9}/>
                  );
                })()}
              </svg>

              {/* Pending pin */}
              {pendingPin && (
                <div style={{ position:"absolute", left:`${pendingPin.x}%`, top:`${pendingPin.y}%`, zIndex:20 }}
                  onClick={e=>e.stopPropagation()}>
                  {/* Anchor dot */}
                  <div style={{ position:"absolute", width:14, height:14, borderRadius:"50%", background:"#c8a96e", border:"2px solid #fff", boxShadow:"0 0 10px #0008", transform:`translate(-50%,-50%) scale(${1/zoom})`, transformOrigin:"center center" }}/>
                  {/* Popup — counter-scaled, flips side near edge */}
                  <div style={{ position:"absolute", top:0,
                      left:  pendingPin.x>70 ? undefined : 8,
                      right: pendingPin.x>70 ? 8 : undefined,
                      background:"#1a1228", border:"1px solid #7c5cbf", borderRadius:10,
                      padding:"12px 14px", width:240, boxShadow:"0 8px 32px #000a",
                      transform:`scale(${1/zoom})`,
                      transformOrigin: pendingPin.x>70 ? "top right" : "top left" }}>
                    <div style={{ fontSize:12, color:"#c8a96e", fontWeight:700, marginBottom:10 }}>📍 Assign location</div>

                    {/* Search + type filter */}
                    <div style={{ display:"flex", gap:6, marginBottom:8 }}>
                      <div style={{ position:"relative", flex:1 }}>
                        <span style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", color:"#5a4a7a", fontSize:12, pointerEvents:"none" }}>🔍</span>
                        <input value={pinSearch} onChange={e=>setPinSearch(e.target.value)}
                          placeholder="Search…" autoFocus
                          style={{ width:"100%", background:"#0d0b14", border:"1px solid #3a2a5a", borderRadius:6, padding:"6px 8px 6px 26px", color:"#e8d5b7", fontSize:12, outline:"none", boxSizing:"border-box" }}/>
                      </div>
                      {availableTypes.length > 0 && (
                        <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}
                          style={{...selStyle, fontSize:11, padding:"4px 6px", minWidth:0, width:90, flexShrink:0}}>
                          <option value="">All types</option>
                          {availableTypes.map(t => <option key={t} value={t}>{TYPE_ICONS[t]||"📍"} {t}</option>)}
                        </select>
                      )}
                    </div>

                    {/* Location list */}
                    <div style={{ maxHeight:170, overflowY:"auto", marginBottom:8, display:"flex", flexDirection:"column", gap:1 }}>
                      {filteredAvailable.length === 0 && (
                        <div style={{ color:"#5a4a7a", fontSize:12, textAlign:"center", padding:"16px 0" }}>
                          {available.length===0 ? "All locations are pinned" : "No matches"}
                        </div>
                      )}
                      {filteredAvailable.map(l => {
                        const sel = pendingPin.locationId === l.id;
                        const sub = [l.region, l.type].filter(Boolean).join(" · ");
                        return (
                          <div key={l.id} onClick={()=>setPendingPin(p=>({...p, locationId:l.id}))}
                            style={{ padding:"7px 8px", borderRadius:6, cursor:"pointer", background:sel?"#7c5cbf33":"transparent", border:`1px solid ${sel?"#7c5cbf":"transparent"}`, display:"flex", alignItems:"center", gap:8 }}>
                            <span style={{ fontSize:16, lineHeight:1, flexShrink:0 }}>{locIcon(l)}</span>
                            <div style={{ minWidth:0 }}>
                              <div style={{ fontSize:12, color:sel?"#e8d5b7":"#c8b89a", fontWeight:sel?700:400, lineHeight:1.3 }}>{l.name}</div>
                              {sub && <div style={{ fontSize:10, color:"#5a4a7a", marginTop:3 }}>{sub}</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ display:"flex", gap:6 }}>
                      <button onClick={confirmPin} disabled={!pendingPin.locationId}
                        style={{...btnPrimary, flex:1, fontSize:12, padding:"6px", opacity:pendingPin.locationId?1:0.5}}>Place</button>
                      <button onClick={()=>{ setPendingPin(null); setPinSearch(""); setTypeFilter(""); }} style={{...btnSecondary, fontSize:12, padding:"6px 10px"}}>✕</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Existing pins */}
              {pins.map(pin => {
                const loc   = locations.find(l => l.id === pin.locationId);
                if (!loc) return null;
                const isHov     = hovered === pin.id;
                const showRight = pin.x < 60;
                const s         = 1 / zoom;
                return (
                  <div key={pin.id}
                    style={{ position:"absolute", left:`${pin.x}%`, top:`${pin.y}%`, zIndex:isHov?10:3 }}
                    onMouseEnter={()=>setHovered(pin.id)} onMouseLeave={()=>setHovered(null)}
                    onClick={e=>e.stopPropagation()}>

                    {/* Icon marker — replaces dot, constant visual size */}
                    {(() => {
                      const inRoad = roadMode && drawingRoad?.locationIds.includes(pin.locationId);
                      return (
                        <div style={{ position:"absolute", transform:`translate(-50%,-50%) scale(${s})`, transformOrigin:"center center",
                            cursor: roadMode ? "pointer" : "pointer", fontSize:20, lineHeight:1,
                            filter:`drop-shadow(0 1px 4px #000b) drop-shadow(0 0 ${isHov||inRoad?8:3}px ${inRoad?"#a8d8a8":isHov?"#c8a96e":"#7c5cbf"})`,
                            transition:"filter .15s", outline: inRoad ? `${2/zoom}px solid #a8d8a8` : "none", borderRadius:"50%" }}
                          onClick={e=>{ e.stopPropagation(); if(roadMode && !didDrag.current){ togglePinInRoad(pin.locationId); } else if(!placing && !didDrag.current){ if(e.ctrlKey||e.metaKey){e.preventDefault();onOpenLocation(loc,{newTab:true});}else{onOpenLocation(loc);} } }}
                          onAuxClick={e=>{ if(e.button===1&&!roadMode&&!placing&&!didDrag.current){e.preventDefault();e.stopPropagation();onOpenLocation(loc,{newTab:true});} }}>
                          {locIcon(loc)}
                        </div>
                      );
                    })()}

                    {/* Label — always visible when showLabels, tooltip on hover otherwise */}
                    {(isHov || showLabels) && (
                      <div style={{ position:"absolute", top:0,
                          [showRight?"left":"right"]: 14,
                          transform:`translate(0,-50%) scale(${s})`,
                          transformOrigin: showRight ? "left center" : "right center",
                          background:"rgba(10,8,20,0.93)", border:`1px solid ${isHov?"#7c5cbf":"#3a2a5a"}`,
                          borderRadius:6, padding:"5px 10px", display:"flex", alignItems:"center", gap:5,
                          whiteSpace:"nowrap", boxShadow:"0 2px 10px #0007", pointerEvents:"auto", transition:"border-color .15s" }}>
                        <span style={{ fontSize:13, color:"#e8d5b7", cursor:"pointer" }}
                          onClick={e=>{ if(!placing && !didDrag.current){ if(e.ctrlKey||e.metaKey){e.preventDefault();onOpenLocation(loc,{newTab:true});}else{onOpenLocation(loc);} } }}
                          onAuxClick={e=>{ if(e.button===1&&!placing&&!didDrag.current){e.preventDefault();onOpenLocation(loc,{newTab:true});} }}>
                          {loc.name}
                        </span>
                        {isHov && (confirmRemovePinId === pin.id
                          ? <>
                              <button onClick={()=>{ removePin(pin.id); setConfirmRemovePinId(null); }} style={{ background:"none", border:"none", color:"#c06060", cursor:"pointer", fontSize:12, lineHeight:1, padding:"0 2px", fontWeight:700 }}>✓</button>
                              <button onClick={()=>setConfirmRemovePinId(null)} style={{ background:"none", border:"none", color:"#9a7fa0", cursor:"pointer", fontSize:12, lineHeight:1, padding:"0 2px" }}>✕</button>
                            </>
                          : <button onClick={()=>setConfirmRemovePinId(pin.id)}
                              style={{ background:"none", border:"none", color:"#c06060", cursor:"pointer", fontSize:14, lineHeight:1, padding:"0 0 0 2px" }}>×</button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pin list sidebar */}
        {(() => {
          const pinnedLocs = pins.map(pin => ({ pin, loc: locations.find(l => l.id === pin.locationId) })).filter(x => x.loc);
          const sidebarTypes = [...new Set(pinnedLocs.map(x => x.loc.type).filter(Boolean))].sort();
          const filtered = pinnedLocs.filter(({ loc }) => {
            const q = sidebarSearch.toLowerCase();
            const matchText = !q || loc.name.toLowerCase().includes(q) || (loc.region||"").toLowerCase().includes(q);
            const matchType = !sidebarType || loc.type === sidebarType;
            return matchText && matchType;
          });
          // group by type
          const groups = {};
          const groupOrder = [];
          filtered.forEach(({ pin, loc }) => {
            const key = loc.type || "Other";
            if (!groups[key]) { groups[key] = []; groupOrder.push(key); }
            groups[key].push({ pin, loc });
          });

          return (
            <div style={{ width:210, background:"#0d0b14", borderLeft:"1px solid #2a1f3d", display:"flex", flexDirection:"column", borderRadius:"0 8px 8px 0", flexShrink:0 }}>
              {/* Tab bar */}
              <div style={{ display:"flex", borderBottom:"1px solid #2a1f3d", flexShrink:0 }}>
                <button onClick={()=>setSidebarTab("pins")}
                  style={{ flex:1, background:"none", border:"none", borderBottom:`2px solid ${sidebarTab==="pins"?"#7c5cbf":"transparent"}`, color:sidebarTab==="pins"?"#e8d5b7":"#5a4a7a", cursor:"pointer", fontSize:11, fontWeight:700, letterSpacing:1, padding:"8px 0", textTransform:"uppercase", transition:"color .12s" }}>
                  📍 {pins.length}
                </button>
                <button onClick={()=>setSidebarTab("roads")}
                  style={{ flex:1, background:"none", border:"none", borderBottom:`2px solid ${sidebarTab==="roads"?"#7c5cbf":"transparent"}`, color:sidebarTab==="roads"?"#e8d5b7":"#5a4a7a", cursor:"pointer", fontSize:11, fontWeight:700, letterSpacing:1, padding:"8px 0", textTransform:"uppercase", transition:"color .12s" }}>
                  🛤️ {roads.length}
                </button>
              </div>

              {/* Pins tab */}
              {sidebarTab === "pins" && (
                <>
                  {pins.length > 0 && (
                    <div style={{ padding:"8px 10px", borderBottom:"1px solid #1e1630", display:"flex", flexDirection:"column", gap:6, flexShrink:0 }}>
                      <div style={{ position:"relative" }}>
                        <span style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", color:"#5a4a7a", fontSize:11, pointerEvents:"none" }}>🔍</span>
                        <input value={sidebarSearch} onChange={e=>setSidebarSearch(e.target.value)}
                          placeholder="Search pins…"
                          style={{ width:"100%", background:"#13101f", border:"1px solid #2a1f3d", borderRadius:5, padding:"5px 8px 5px 24px", color:"#e8d5b7", fontSize:11, outline:"none", boxSizing:"border-box" }}/>
                      </div>
                      {sidebarTypes.length > 1 && (
                        <select value={sidebarType} onChange={e=>setSidebarType(e.target.value)}
                          style={{ background:"#13101f", border:"1px solid #2a1f3d", borderRadius:5, color:sidebarType?"#c8a96e":"#5a4a7a", fontSize:11, padding:"4px 6px", outline:"none", width:"100%" }}>
                          <option value="">All types</option>
                          {sidebarTypes.map(t => <option key={t} value={t}>{TYPE_ICONS[t]||"📍"} {t}</option>)}
                        </select>
                      )}
                    </div>
                  )}
                  <div style={{ flex:1, overflowY:"auto" }}>
                    {pins.length === 0
                      ? <div style={{ padding:"20px 14px", color:"#3a2a5a", fontSize:12, textAlign:"center" }}>No pins yet.<br/>Click "📍 Place Pin" to start.</div>
                      : filtered.length === 0
                        ? <div style={{ padding:"16px 14px", color:"#3a2a5a", fontSize:12, textAlign:"center" }}>No pins match.</div>
                        : groupOrder.map(type => (
                            <div key={type}>
                              <div style={{ padding:"5px 12px", fontSize:10, color:"#5a4a7a", fontWeight:700, letterSpacing:1, textTransform:"uppercase", background:"#0a0814", borderBottom:"1px solid #1a1628", borderTop:"1px solid #1a1628" }}>
                                {TYPE_ICONS[type]||"📍"} {type}
                              </div>
                              {groups[type].map(({ pin, loc }) => (
                                <div key={pin.id} onClick={()=>centerOnPin(pin)}
                                  style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 12px", cursor:"pointer", borderBottom:"1px solid #1a1628", transition:"background .12s" }}
                                  onMouseEnter={e=>e.currentTarget.style.background="#1e1630"}
                                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                                  <div style={{ flex:1, minWidth:0 }}>
                                    <div style={{ fontSize:12, color:"#e8d5b7", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{loc.name}</div>
                                    {loc.region && <div style={{ fontSize:10, color:"#5a4a7a", marginTop:1 }}>{loc.region}</div>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))
                    }
                  </div>
                </>
              )}

              {/* Roads tab */}
              {sidebarTab === "roads" && (
                <div style={{ flex:1, overflowY:"auto" }}>
                  {roads.length === 0
                    ? <div style={{ padding:"20px 14px", color:"#3a2a5a", fontSize:12, textAlign:"center" }}>No roads yet.<br/>Click "🛤️ Draw Road" to start.</div>
                    : roads.map(road => {
                        const stops = road.locationIds.map(lid => locations.find(l => l.id === lid)?.name).filter(Boolean);
                        const isEditing = editingRoadId === road.id;
                        return (
                          <div key={road.id}
                            onMouseEnter={()=>setHoveredRoadId(road.id)}
                            onMouseLeave={()=>setHoveredRoadId(null)}
                            style={{ padding:"8px 12px", borderBottom:"1px solid #1a1628", background: isEditing ? "#1e1630" : "transparent" }}>
                            {isEditing ? (
                              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                                <input
                                  autoFocus
                                  defaultValue={road.name}
                                  onBlur={e => { const n=e.target.value.trim(); if(n&&n!==road.name) updateActiveMap({roads:roads.map(r=>r.id===road.id?{...r,name:n}:r)}); }}
                                  onKeyDown={e=>{ if(e.key==="Enter"||e.key==="Escape") setEditingRoadId(null); }}
                                  style={{ background:"#0d0b14", border:"1px solid #3a2a5a", borderRadius:4, color:"#e8d5b7", fontSize:12, padding:"4px 7px", outline:"none", width:"100%", boxSizing:"border-box" }}/>
                                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                  <input type="color" defaultValue={road.color||"#c8a96e"}
                                    onChange={e => updateActiveMap({roads:roads.map(r=>r.id===road.id?{...r,color:e.target.value}:r)})}
                                    style={{ width:24, height:24, padding:2, border:"1px solid #3a2a5a", borderRadius:4, background:"transparent", cursor:"pointer", flexShrink:0 }}/>
                                  {ROAD_STYLES.map(s => {
                                    const sel = (road.style||"solid") === s.id;
                                    return (
                                      <button key={s.id} onClick={()=>updateActiveMap({roads:roads.map(r=>r.id===road.id?{...r,style:s.id}:r)})} title={s.id}
                                        style={{ background:sel?"#2a1f3d":"transparent", border:`1px solid ${sel?"#7c5cbf":"#2a1f3d"}`, borderRadius:4, cursor:"pointer", padding:"2px 5px", flexShrink:0 }}>
                                        <svg width="18" height="7" viewBox="0 0 18 7">
                                          <line x1="1" y1="3.5" x2="17" y2="3.5" stroke={sel?"#c8b8e8":"#5a4a7a"} strokeWidth="2"
                                            strokeDasharray={s.dasharray||undefined} strokeLinecap="round"/>
                                        </svg>
                                      </button>
                                    );
                                  })}
                                </div>
                                <div style={{ display:"flex", gap:6 }}>
                                  <button onClick={()=>{ setEditingRoadId(null); startEditPoints(road); }}
                                    style={{ flex:1, background:"#1a2a3a", border:"1px solid #2a4a6a", borderRadius:4, color:"#7aafd4", cursor:"pointer", fontSize:11, padding:"3px 0" }}>
                                    ✎ Edit Points
                                  </button>
                                  <button onClick={()=>setEditingRoadId(null)}
                                    style={{ background:"none", border:"none", color:"#5a4a7a", cursor:"pointer", fontSize:14, padding:"0 2px" }}>✕</button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                                  <div style={{ width:10, height:10, borderRadius:"50%", background:road.color||"#c8a96e", flexShrink:0 }}/>
                                  <span style={{ fontSize:12, color:"#e8d5b7", fontWeight:600, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{road.name}</span>
                                  <button onClick={()=>{ setEditingRoadId(road.id); setConfirmRemoveRoadId(null); }}
                                    style={{ background:"none", border:"none", color:"#4a3a5a", cursor:"pointer", fontSize:12, padding:"0 2px", lineHeight:1 }}
                                    onMouseEnter={e=>e.currentTarget.style.color="#c8a96e"}
                                    onMouseLeave={e=>e.currentTarget.style.color="#4a3a5a"}>✏️</button>
                                  {confirmRemoveRoadId === road.id
                                    ? <>
                                        <button onClick={()=>{ deleteRoad(road.id); setConfirmRemoveRoadId(null); }} style={{ background:"none", border:"none", color:"#c06060", cursor:"pointer", fontSize:12, padding:"0 2px", fontWeight:700 }}>✓</button>
                                        <button onClick={()=>setConfirmRemoveRoadId(null)} style={{ background:"none", border:"none", color:"#9a7fa0", cursor:"pointer", fontSize:12, padding:"0 2px" }}>✕</button>
                                      </>
                                    : <button onClick={()=>setConfirmRemoveRoadId(road.id)} style={{ background:"none", border:"none", color:"#4a3a5a", cursor:"pointer", fontSize:13, padding:"0 2px", lineHeight:1 }}
                                        onMouseEnter={e=>e.currentTarget.style.color="#c06060"}
                                        onMouseLeave={e=>e.currentTarget.style.color="#4a3a5a"}>×</button>
                                  }
                                </div>
                                <div style={{ fontSize:10, color:"#5a4a7a", paddingLeft:16 }}>{stops.join(" → ")}</div>
                              </>
                            )}
                          </div>
                        );
                      })
                  }
                </div>
              )}
            </div>
          );
        })()}


        </div>
      )}
    </div>
  );
}

export default memo(MapTab);
