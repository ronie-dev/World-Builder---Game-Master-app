import { useState, useEffect, useRef, memo } from "react";
import { ghostInput, ghostTextarea, btnSecondary, STATUS_COLORS, defaultLocation } from "../constants.js";
import Avatar from "./Avatar.jsx";
import LinkBadge from "./LinkBadge.jsx";

function LocationDetailPanel({ location, chars, factions, stories, onClose, onSave, onDelete, onOpenChar, onOpenStory, onOpenFaction, onSaveFaction, onShowOnMap, locationTypes }) {
  const [form, setForm] = useState({ ...defaultLocation, ...location });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sideOpen, setSideOpen] = useState(false);
  const [factionSearch, setFactionSearch] = useState("");
  const [showFactionPicker, setShowFactionPicker] = useState(false);
  const [prevId, setPrevId] = useState(location?.id);
  const descRef = useRef(null);

  if (location?.id !== prevId) {
    setPrevId(location?.id);
    setForm({ ...defaultLocation, ...location });
    setConfirmDelete(false);
  }

  // Auto-expand description textarea
  useEffect(() => {
    const el = descRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [form.description]);

  if (!location) return null;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const saveField = (k, v) => {
    const updated = { ...location, ...form, [k]: v };
    set(k, v);
    onSave(updated);
  };
  const saveForm = () => onSave({ ...location, ...form });

  const residents = chars.filter(c => c.locationId === location.id);
  const mainResidents = residents.filter(c => c.type === "main" || c.type === "player");
  const sideResidents = residents.filter(c => c.type === "side");
  const linkedFactions = (factions || []).filter(f => f.location && f.location.toLowerCase() === location.name.toLowerCase());
  const linkedStories = (stories || []).filter(s => (s.locationIds || []).includes(location.id));

  const linkableFactions = (factions || []).filter(f =>
    !linkedFactions.some(lf => lf.id === f.id) &&
    (!factionSearch || f.name.toLowerCase().includes(factionSearch.toLowerCase()))
  );

  const linkFaction = f => {
    onSaveFaction?.({ ...f, location: location.name });
    setShowFactionPicker(false);
    setFactionSearch("");
  };
  const unlinkFaction = f => {
    onSaveFaction?.({ ...f, location: "" });
  };

  // Ghost input style — border only on focus
  const ghostFocus = e => e.target.style.borderColor = "#3a2a5a";
  const ghostBlur  = e => { e.target.style.borderColor = "transparent"; saveForm(); };

  const renderChip = c => (
    <div key={c.id}
      onClick={e => { if (e.ctrlKey||e.metaKey) { e.preventDefault(); onOpenChar?.(c,{newTab:true}); } else { onOpenChar?.(c); } }}
      onAuxClick={e => { if (e.button===1) { e.preventDefault(); onOpenChar?.(c,{newTab:true}); } }}
      style={{ display:"flex", alignItems:"center", gap:8, background:"#1e1630", border:"1px solid #3a2a5a", borderRadius:8, padding:"6px 14px 6px 6px", cursor:"pointer", transition:"border-color .15s" }}
      onMouseEnter={e => e.currentTarget.style.borderColor="#7c5cbf"}
      onMouseLeave={e => e.currentTarget.style.borderColor="#3a2a5a"}>
      <Avatar src={c.image} name={c.name} size={34}/>
      <div>
        <div style={{ fontSize:13, color:"#e8d5b7", fontWeight:600 }}>{c.name} <span style={{ fontSize:10, color:"#7c5cbf", opacity:.8 }}>↗</span></div>
        <div style={{ fontSize:11, color:"#9a7fa0" }}>{c.shortDescription || c.type}</div>
      </div>
    </div>
  );

  return (
    <div style={{ background:"#13101f", border:"1px solid #7c5cbf", borderRadius:12, overflow:"hidden", boxShadow:"0 4px 32px #7c5cbf22", animation:"slideDown .18s ease" }}>
      <style>{`@keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ background:"linear-gradient(90deg,#1a3a6baa,#13101f)", padding:"18px 24px", borderBottom:"1px solid #2a1f3d" }}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
          <div style={{ flex:1, minWidth:0 }}>
            {/* Name */}
            <input value={form.name}
              onChange={e => set("name", e.target.value)}
              onBlur={ghostBlur}
              onFocus={ghostFocus}
              placeholder="Location name…"
              style={{ ...ghostInput, fontSize:20, fontFamily:"Georgia,serif", fontWeight:700, color:"#e8d5b7", width:"100%", marginBottom:8, borderColor:"transparent" }}
            />
            {/* Region + Type row */}
            <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:8 }}>
              <span style={{ fontSize:13, color:"#5a4a7a", flexShrink:0 }}>🗺️</span>
              <input value={form.region}
                onChange={e => set("region", e.target.value)}
                onBlur={ghostBlur}
                onFocus={ghostFocus}
                placeholder="Region…"
                style={{ ...ghostInput, flex:1, borderColor:"transparent" }}
              />
              <select value={form.type} onChange={e => saveField("type", e.target.value)}
                style={{ background:"#1a1228", border:"1px solid #2a1f3d", borderRadius:6, color: form.type ? "#e8d5b7" : "#5a4a7a", fontSize:12, padding:"3px 8px", cursor:"pointer", outline:"none" }}>
                <option value="">— Type —</option>
                {(locationTypes||[]).map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            {/* Stats badges */}
            {(mainResidents.length > 0 || sideResidents.length > 0 || linkedFactions.length > 0 || linkedStories.length > 0) && (
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {mainResidents.length > 0 && <span style={{ display:"inline-flex", alignItems:"center", fontSize:10, color:"#c8b89a", background:"#c8b89a18", borderRadius:8, padding:"1px 7px", border:"1px solid #c8b89a33" }}>⭐ {mainResidents.length} resident{mainResidents.length!==1?"s":""}</span>}
                {sideResidents.length > 0 && <span style={{ display:"inline-flex", alignItems:"center", fontSize:10, color:"#9a7fa0", background:"#9a7fa018", borderRadius:8, padding:"1px 7px", border:"1px solid #9a7fa033" }}>👤 {sideResidents.length} side</span>}
                {linkedFactions.length > 0 && <span style={{ display:"inline-flex", alignItems:"center", fontSize:10, color:"#7c9abf", background:"#7c9abf18", borderRadius:8, padding:"1px 7px", border:"1px solid #7c9abf33" }}>⚑ {linkedFactions.length} faction{linkedFactions.length!==1?"s":""}</span>}
                {linkedStories.length > 0 && <span style={{ display:"inline-flex", alignItems:"center", fontSize:10, color:"#7c5cbf", background:"#7c5cbf18", borderRadius:8, padding:"1px 7px", border:"1px solid #7c5cbf33" }}>📜 {linkedStories.length} stor{linkedStories.length!==1?"ies":"y"}</span>}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display:"flex", gap:8, flexShrink:0 }}>
            {onShowOnMap && <button onClick={onShowOnMap} style={{ ...btnSecondary, fontSize:12, padding:"6px 14px" }}>🗺️ Map</button>}
            {onDelete && (confirmDelete ? (
              <>
                <span style={{ fontSize:12, color:"#c8b89a", alignSelf:"center" }}>Delete?</span>
                <button onClick={() => { setConfirmDelete(false); onDelete(location.id); }} style={{ ...btnSecondary, fontSize:12, padding:"4px 10px", color:"#c06060", borderColor:"#6b1a1a" }}>Yes</button>
                <button onClick={() => setConfirmDelete(false)} style={{ ...btnSecondary, fontSize:12, padding:"4px 10px" }}>No</button>
              </>
            ) : (
              <button onClick={() => setConfirmDelete(true)} style={{ ...btnSecondary, fontSize:12, padding:"6px 14px", color:"#c06060", borderColor:"#6b1a1a" }}>🗑️ Delete</button>
            ))}
            <button onClick={onClose} style={{ ...btnSecondary, fontSize:18, padding:"2px 10px", lineHeight:1 }}>×</button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div>
        {/* Description */}
        <div style={{ padding:"16px 24px", borderBottom:"1px solid #1e1630" }}>
          <div style={{ fontSize:11, color:"#7c5cbf", letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>📖 Description</div>
          <textarea
            ref={descRef}
            value={form.description}
            onChange={e => { set("description", e.target.value); e.target.style.height="auto"; e.target.style.height=e.target.scrollHeight+"px"; }}
            onFocus={e => e.target.style.borderColor="#3a2a5a"}
            onBlur={e => { e.target.style.borderColor="transparent"; saveForm(); }}
            placeholder="Add a description…"
            style={{ ...ghostTextarea, minHeight:60, borderColor:"transparent" }}
          />
        </div>

        {/* Factions */}
        <div style={{ padding:"16px 24px", borderBottom:"1px solid #1e1630" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: linkedFactions.length > 0 || showFactionPicker ? 10 : 0 }}>
            <div style={{ fontSize:11, color:"#7c5cbf", letterSpacing:1, textTransform:"uppercase" }}>⚑ Factions {linkedFactions.length > 0 && <span style={{ opacity:.5 }}>({linkedFactions.length})</span>}</div>
            {onSaveFaction && (
              <button onClick={() => setShowFactionPicker(v => !v)}
                style={{ ...btnSecondary, fontSize:11, padding:"3px 10px" }}>
                {showFactionPicker ? "✕ Close" : "＋ Link faction"}
              </button>
            )}
          </div>

          {linkedFactions.length > 0 && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom: showFactionPicker ? 12 : 0 }}>
              {linkedFactions.map(f => {
                const color = f.color || "#5a3da0";
                return (
                  <div key={f.id} style={{ display:"flex", alignItems:"center", gap:6, background:`${color}22`, border:`1px solid ${color}`, borderRadius:8, padding:"6px 14px", fontSize:13, color:"#e8d5b7", transition:"filter .15s" }}>
                    <span onClick={e => { if (e.ctrlKey||e.metaKey) { e.preventDefault(); onOpenFaction?.(f,{newTab:true}); } else { onOpenFaction?.(f); } }}
                      onAuxClick={e => { if (e.button===1) { e.preventDefault(); onOpenFaction?.(f,{newTab:true}); } }}
                      style={{ display:"flex", alignItems:"center", gap:6, cursor: onOpenFaction ? "pointer" : "default" }}
                      onMouseEnter={e => { if (onOpenFaction) e.currentTarget.parentElement.style.filter="brightness(1.3)"; }}
                      onMouseLeave={e => e.currentTarget.parentElement.style.filter="none"}>
                      <span style={{ color, fontSize:15 }}>⚑</span>
                      <span style={{ fontWeight:600 }}>{f.name}</span>
                      {f.alignment && <span style={{ fontSize:11, color:"#9a7fa0" }}>· {f.alignment}</span>}
                      {onOpenFaction && <span style={{ fontSize:10, color, opacity:.7 }}>↗</span>}
                    </span>
                    {onSaveFaction && (
                      <span onClick={() => unlinkFaction(f)}
                        style={{ marginLeft:4, color:"#7c5cbf", cursor:"pointer", fontSize:13, opacity:.6, lineHeight:1 }}
                        title="Unlink faction"
                        onMouseEnter={e => e.target.style.opacity="1"}
                        onMouseLeave={e => e.target.style.opacity=".6"}>×</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {linkedFactions.length === 0 && !showFactionPicker && (
            <div style={{ color:"#3a2a5a", fontSize:13 }}>None linked.</div>
          )}

          {showFactionPicker && (
            <div style={{ background:"#1a1228", border:"1px solid #3a2a5a", borderRadius:8, padding:10 }}>
              <input
                value={factionSearch}
                onChange={e => setFactionSearch(e.target.value)}
                placeholder="Search factions…"
                autoFocus
                style={{ ...ghostInput, width:"100%", marginBottom:8, borderColor:"#3a2a5a" }}
              />
              <div style={{ maxHeight:160, overflowY:"auto", display:"flex", flexDirection:"column", gap:4 }}>
                {linkableFactions.length === 0
                  ? <div style={{ color:"#5a4a7a", fontSize:12, padding:"4px 0" }}>No factions to link.</div>
                  : linkableFactions.map(f => (
                    <div key={f.id}
                      onClick={() => linkFaction(f)}
                      style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 10px", borderRadius:6, cursor:"pointer", background:"transparent", transition:"background .15s" }}
                      onMouseEnter={e => e.currentTarget.style.background="#2a1f3d"}
                      onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                      <span style={{ color: f.color || "#5a3da0", fontSize:14 }}>⚑</span>
                      <span style={{ fontSize:13, color:"#e8d5b7" }}>{f.name}</span>
                      {f.alignment && <span style={{ fontSize:11, color:"#9a7fa0" }}>· {f.alignment}</span>}
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>

        {/* Characters */}
        <div style={{ padding:"16px 24px", borderBottom: linkedStories.length > 0 ? "1px solid #1e1630" : "none" }}>
          <div style={{ fontSize:11, color:"#7c5cbf", letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>
            ⭐ Characters {mainResidents.length > 0 && <span style={{ opacity:.5 }}>({mainResidents.length})</span>}
          </div>
          {mainResidents.length === 0
            ? <div style={{ color:"#3a2a5a", fontSize:13, marginBottom: sideResidents.length > 0 ? 12 : 0 }}>None linked.</div>
            : <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom: sideResidents.length > 0 ? 16 : 0 }}>{mainResidents.map(renderChip)}</div>}
          {sideResidents.length > 0 && (
            <>
              <div onClick={() => setSideOpen(v => !v)} style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", userSelect:"none", marginBottom: sideOpen ? 10 : 0 }}>
                <span style={{ fontSize:10, color:"#5a4a7a" }}>{sideOpen ? "▼" : "▶"}</span>
                <span style={{ fontSize:11, color:"#5a4a7a", letterSpacing:1, textTransform:"uppercase" }}>👤 Side Characters ({sideResidents.length})</span>
              </div>
              {sideOpen && <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>{sideResidents.map(renderChip)}</div>}
            </>
          )}
        </div>

        {/* Stories */}
        {linkedStories.length > 0 && (
          <div style={{ padding:"16px 24px" }}>
            <div style={{ fontSize:11, color:"#7c5cbf", letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>📜 Linked Stories</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {linkedStories.map(s => (
                <LinkBadge key={s.id} label={s.name} color={STATUS_COLORS[s.status] || "#3a2a5a"}
                  onClick={() => onOpenStory?.(s)}
                  onNewTab={() => onOpenStory?.(s, null, {newTab:true})}/>
              ))}
            </div>
          </div>
        )}

        {residents.length === 0 && linkedFactions.length === 0 && linkedStories.length === 0 && !form.description && (
          <div style={{ padding:"16px 24px", color:"#5a4a7a", fontSize:13 }}>No details added yet.</div>
        )}
      </div>
    </div>
  );
}

export default memo(LocationDetailPanel);
