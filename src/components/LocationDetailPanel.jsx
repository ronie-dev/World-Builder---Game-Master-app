import { useState, useEffect, memo } from "react";
import { inputStyle, selStyle, btnPrimary, btnSecondary, STATUS_COLORS, LOCATION_TYPES, defaultLocation } from "../constants.js";
import { getFactionColor } from "../utils.jsx";
import Avatar from "./Avatar.jsx";
import Badge from "./Badge.jsx";
import LinkBadge from "./LinkBadge.jsx";

function LocationDetailPanel({ location, chars, factions, stories, onClose, onSave, onDelete, onOpenChar, onOpenStory, onOpenFaction, onShowOnMap }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ ...defaultLocation, ...location });
  const [sideOpen, setSideOpen] = useState(false);

  useEffect(() => { setIsEditing(false); setEditForm({ ...defaultLocation, ...location }); }, [location?.id]);

  if (!location) return null;

  const set = (k, v) => setEditForm(f => ({ ...f, [k]: v }));
  const handleSave = () => { onSave(editForm); setIsEditing(false); };
  const handleCancelEdit = () => { setIsEditing(false); setEditForm({ ...defaultLocation, ...location }); };

  const residents = chars.filter(c => c.locationId === location.id);
  const mainResidents = residents.filter(c => c.type === "main" || c.type === "player");
  const sideResidents = residents.filter(c => c.type === "side");
  const linkedFactions = (factions || []).filter(f => f.location && f.location.toLowerCase() === location.name.toLowerCase());
  const linkedStories = (stories || []).filter(s => (s.locationIds || []).includes(location.id));

  const renderChip = c => (
    <div key={c.id} onClick={e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();onOpenChar?.(c,{newTab:true});}else{onOpenChar?.(c);}}} onAuxClick={e=>{if(e.button===1){e.preventDefault();onOpenChar?.(c,{newTab:true});}}} style={{ display:"flex", alignItems:"center", gap:8, background:"#1e1630", border:"1px solid #3a2a5a", borderRadius:8, padding:"6px 14px 6px 6px", cursor:"pointer", transition:"border-color .15s" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#7c5cbf"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#3a2a5a"}>
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
      <div style={{ background:"linear-gradient(90deg,#1a3a6baa,#13101f)", padding:"18px 24px", display:"flex", alignItems:"flex-start", gap:20, borderBottom:"1px solid #2a1f3d" }}>
        <div style={{ flex:1 }}>
          {isEditing ? (
            <input value={editForm.name} onChange={e => set("name", e.target.value)} placeholder="Location name…"
              style={{ ...inputStyle, fontSize:18, fontFamily:"Georgia,serif", fontWeight:700 }}/>
          ) : (
            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", marginBottom:6 }}>
              <span style={{ fontSize:22, fontFamily:"Georgia,serif", color:"#e8d5b7", fontWeight:700 }}>📍 {location.name}</span>
              {location.type && <span style={{ background:"#1a3a6b", color:"#e8d5b7", borderRadius:4, padding:"2px 8px", fontSize:11, fontWeight:700, letterSpacing:1 }}>{location.type}</span>}
            </div>
          )}
          {!isEditing && location.region && <div style={{ color:"#9a7fa0", fontSize:13 }}>🗺️ {location.region}</div>}
        </div>
        <div style={{ display:"flex", gap:8, flexShrink:0 }}>
          {isEditing ? (
            <>
              <button onClick={handleSave} disabled={!editForm.name.trim()} style={{ ...btnPrimary, fontSize:12, padding:"6px 14px" }}>💾 Save</button>
              <button onClick={handleCancelEdit} style={{ ...btnSecondary, fontSize:12, padding:"6px 14px" }}>Cancel</button>
            </>
          ) : (
            <>
              {onShowOnMap && <button onClick={onShowOnMap} style={{ ...btnSecondary, fontSize:12, padding:"6px 14px" }}>🗺️ Map</button>}
              <button onClick={() => setIsEditing(true)} style={{ ...btnPrimary, fontSize:12, padding:"6px 14px" }}>✏️ Edit</button>
              {onDelete && <button onClick={() => onDelete(location.id)} style={{ ...btnSecondary, fontSize:12, padding:"6px 14px", color:"#c06060", borderColor:"#6b1a1a" }}>🗑️ Delete</button>}
            </>
          )}
          <button onClick={onClose} style={{ ...btnSecondary, fontSize:18, padding:"2px 10px", lineHeight:1 }}>×</button>
        </div>
      </div>

      {isEditing ? (
        <div style={{ padding:"20px 24px" }}>
          <div style={{ display:"flex", gap:12, marginBottom:14 }}>
            <div style={{ flex:1 }}>
              <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Region</label>
              <input value={editForm.region} onChange={e => set("region", e.target.value)} style={inputStyle}/>
            </div>
            <div style={{ flex:1 }}>
              <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Type</label>
              <select value={editForm.type} onChange={e => set("type", e.target.value)} style={selStyle}>
                <option value="">— Select —</option>
                {LOCATION_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Description</label>
            <textarea value={editForm.description} onChange={e => set("description", e.target.value)} rows={5} style={{ ...inputStyle, resize:"vertical" }}/>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={handleSave} disabled={!editForm.name.trim()} style={{ ...btnPrimary, flex:1 }}>💾 Save Location</button>
            <button onClick={handleCancelEdit} style={{ ...btnSecondary, flex:1 }}>Cancel</button>
          </div>
        </div>
      ) : (
        <div>
          {location.description && (
            <div style={{ padding:"16px 24px", borderBottom:"1px solid #1e1630" }}>
              <div style={{ fontSize:11, color:"#7c5cbf", letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>📖 Description</div>
              <div style={{ color:"#b09080", fontSize:14, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{location.description}</div>
            </div>
          )}

          {linkedFactions.length > 0 && (
            <div style={{ padding:"16px 24px", borderBottom:"1px solid #1e1630" }}>
              <div style={{ fontSize:11, color:"#7c5cbf", letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>⚑ Factions</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {linkedFactions.map(f => {
                  const color = f.color || "#5a3da0";
                  return (
                    <div key={f.id} onClick={e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();onOpenFaction?.(f,{newTab:true});}else{onOpenFaction?.(f);}}} onAuxClick={e=>{if(e.button===1){e.preventDefault();onOpenFaction?.(f,{newTab:true});}}}
                      style={{ display:"flex", alignItems:"center", gap:6, background:`${color}22`, border:`1px solid ${color}`, borderRadius:8, padding:"6px 14px", fontSize:13, color:"#e8d5b7", cursor: onOpenFaction ? "pointer" : "default", transition:"filter .15s" }}
                      onMouseEnter={e => { if (onOpenFaction) e.currentTarget.style.filter = "brightness(1.3)"; }}
                      onMouseLeave={e => { e.currentTarget.style.filter = "none"; }}>
                      <span style={{ color, fontSize:15 }}>⚑</span>
                      <span style={{ fontWeight:600 }}>{f.name}</span>
                      {f.alignment && <span style={{ fontSize:11, color:"#9a7fa0" }}>· {f.alignment}</span>}
                      {onOpenFaction && <span style={{ fontSize:10, color, opacity:.7 }}>↗</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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

          {linkedStories.length > 0 && (
            <div style={{ padding:"16px 24px" }}>
              <div style={{ fontSize:11, color:"#7c5cbf", letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>📜 Linked Stories</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {linkedStories.map(s => (
                  <LinkBadge key={s.id} label={s.name} color={STATUS_COLORS[s.status] || "#3a2a5a"} onClick={()=>onOpenStory?.(s)} onNewTab={()=>onOpenStory?.(s,null,{newTab:true})}/>
                ))}
              </div>
            </div>
          )}

          {residents.length === 0 && linkedFactions.length === 0 && linkedStories.length === 0 && !location.description && (
            <div style={{ padding:"16px 24px", color:"#5a4a7a", fontSize:13 }}>No details added yet.</div>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(LocationDetailPanel);
