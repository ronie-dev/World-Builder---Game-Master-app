import { useState, useEffect, useRef, memo } from "react";
import { inputStyle, selStyle, btnPrimary, btnSecondary, iconBtn, ALIGNMENT_COLORS, FACTION_STATUS_COLORS, ALIGNMENTS, FACTION_STATUSES, FACTION_COLORS, defaultFaction } from "../constants.js";
import { getFactionColor, uid } from "../utils.jsx";
import Avatar from "./Avatar.jsx";
import Badge from "./Badge.jsx";

// ── Structure Tab ─────────────────────────────────────────────────────────────
function StructureTab({ faction, allMembers, onSave, onOpenChar }) {
  const tiers = faction.tiers || [{ id:"__default__", name:"Members" }];
  const [draggedCharId, setDraggedCharId] = useState(null);
  const [dragOverTier, setDragOverTier] = useState(null);
  const [editingTierId, setEditingTierId] = useState(null);
  const [editTierName, setEditTierName] = useState("");
  const [editTierDesc, setEditTierDesc] = useState("");
  const [newTierName, setNewTierName] = useState("");
  const [addingTier, setAddingTier] = useState(false);
  const [confirmDeleteTierId, setConfirmDeleteTierId] = useState(null);

  const getTierId = c => {
    const membership = (c.factions||[]).find(e=>e.factionId===faction.id);
    return membership?.tierId || tiers[tiers.length-1]?.id || "__default__";
  };

  const updateTiers = newTiers => onSave({ ...faction, tiers: newTiers });
  const moveMember = (charId, tierId) => {
    // Update tierId in the char's faction membership — persisted via onSave on faction
    // We store tierId on the faction's memberAssignments map for simplicity
    const assignments = { ...(faction.structureAssignments||{}) };
    assignments[charId] = tierId;
    onSave({ ...faction, tiers, structureAssignments: assignments });
  };

  const getAssignedTierId = c => {
    if (faction.structureAssignments?.[c.id]) return faction.structureAssignments[c.id];
    return tiers[tiers.length-1]?.id || "__default__";
  };

  const moveTier = (id, dir) => {
    const idx = tiers.findIndex(t => t.id === id);
    const j = dir === "up" ? idx - 1 : idx + 1;
    if (j < 0 || j >= tiers.length) return;
    // Snapshot all current assignments (including defaults) before reordering
    const assignments = { ...(faction.structureAssignments||{}) };
    allMembers.forEach(c => { if (!assignments[c.id]) assignments[c.id] = getAssignedTierId(c); });
    const next = [...tiers];
    [next[idx], next[j]] = [next[j], next[idx]];
    onSave({ ...faction, tiers: next, structureAssignments: assignments });
  };
  const addTier = () => {
    const n = newTierName.trim(); if (!n) return;
    updateTiers([...tiers, { id: uid(), name: n }]);
    setNewTierName(""); setAddingTier(false);
  };
  const renameTier = (id) => {
    const n = editTierName.trim(); if (!n) return;
    updateTiers(tiers.map(t => t.id===id ? {...t, name:n, description:editTierDesc} : t));
    setEditingTierId(null);
  };
  const deleteTier = (id) => {
    if (tiers.length <= 1) return;
    const fallback = tiers.find(t=>t.id!==id)?.id;
    const assignments = { ...(faction.structureAssignments||{}) };
    Object.keys(assignments).forEach(cid => { if (assignments[cid]===id) assignments[cid]=fallback; });
    onSave({ ...faction, tiers: tiers.filter(t=>t.id!==id), structureAssignments: assignments });
    setConfirmDeleteTierId(null);
  };

  return (
    <div style={{ padding:"16px 24px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div style={{ fontSize:11, color:"#7c5cbf", letterSpacing:1, textTransform:"uppercase" }}>🏗️ Faction Structure</div>
        {!addingTier && <button onClick={()=>setAddingTier(true)} style={{...btnPrimary,fontSize:12,padding:"5px 12px"}}>+ Add Tier</button>}
      </div>
      {addingTier && (
        <div style={{ display:"flex", gap:8, marginBottom:14 }}>
          <input value={newTierName} onChange={e=>setNewTierName(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter") addTier(); if(e.key==="Escape"){ setAddingTier(false); setNewTierName(""); }}} autoFocus placeholder="Tier name…" style={{...inputStyle,flex:1,fontSize:13}}/>
          <button onClick={addTier} style={{...btnPrimary,fontSize:12,padding:"5px 12px"}}>Add</button>
          <button onClick={()=>{ setAddingTier(false); setNewTierName(""); }} style={{...btnSecondary,fontSize:12,padding:"5px 10px"}}>✕</button>
        </div>
      )}
      {allMembers.length === 0 && <div style={{ color:"#5a4a7a", fontSize:13 }}>No members linked to this faction.</div>}
      <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
        {tiers.map((tier, ti) => {
          const tierMembers = allMembers.filter(c => getAssignedTierId(c) === tier.id);
          const isOver = dragOverTier === tier.id;
          return (
            <div key={tier.id}>
              {/* Tier header / divider */}
              <div style={{ display:"flex", alignItems:"center", gap:8, margin:"10px 0 6px", borderBottom:`2px solid ${isOver?"#7c5cbf":"#3a2a5a"}`, paddingBottom:4, transition:"border-color .15s" }}
                onDragOver={e=>{ e.preventDefault(); setDragOverTier(tier.id); }}
                onDragLeave={()=>setDragOverTier(null)}
                onDrop={e=>{ e.preventDefault(); if(draggedCharId) moveMember(draggedCharId, tier.id); setDraggedCharId(null); setDragOverTier(null); }}>
                {editingTierId === tier.id ? (
                  <>
                    <input value={editTierName} onChange={e=>setEditTierName(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter") renameTier(tier.id); if(e.key==="Escape") setEditingTierId(null); }} autoFocus placeholder="Tier name…" style={{...inputStyle,flex:"0 0 130px",fontSize:12,padding:"3px 8px"}}/>
                    <input value={editTierDesc} onChange={e=>setEditTierDesc(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter") renameTier(tier.id); if(e.key==="Escape") setEditingTierId(null); }} placeholder="Description… (optional)" style={{...inputStyle,flex:1,fontSize:12,padding:"3px 8px"}}/>
                    <button onClick={()=>renameTier(tier.id)} style={{...btnPrimary,fontSize:11,padding:"3px 10px"}}>Save</button>
                    <button onClick={()=>setEditingTierId(null)} style={{...btnSecondary,fontSize:11,padding:"3px 8px"}}>✕</button>
                  </>
                ) : confirmDeleteTierId === tier.id ? (
                  <>
                    <span style={{ flex:1, fontSize:12, color:"#c8b89a" }}>Delete tier <strong>"{tier.name}"</strong>? Members will move to another tier.</span>
                    <button onClick={()=>deleteTier(tier.id)} style={{ background:"#6b1a1a", color:"#e8d5b7", border:"none", borderRadius:4, padding:"3px 10px", cursor:"pointer", fontSize:11, fontWeight:700 }}>Delete</button>
                    <button onClick={()=>setConfirmDeleteTierId(null)} style={{...btnSecondary,fontSize:11,padding:"3px 8px"}}>Cancel</button>
                  </>
                ) : (
                  <>
                    <div style={{ display:"flex", flexDirection:"column", gap:1, flexShrink:0 }}>
                      <button onClick={()=>moveTier(tier.id,"up")} disabled={ti===0} style={{...iconBtn, fontSize:10, padding:"1px 4px", color:"#9a7fa0", opacity:ti===0?0.25:1}}>▲</button>
                      <button onClick={()=>moveTier(tier.id,"down")} disabled={ti===tiers.length-1} style={{...iconBtn, fontSize:10, padding:"1px 4px", color:"#9a7fa0", opacity:ti===tiers.length-1?0.25:1}}>▼</button>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <span style={{ fontSize:12, color:"#c8a96e", fontWeight:700, fontFamily:"Georgia,serif", letterSpacing:.5 }}>{tier.name}</span>
                      {tier.description && <span style={{ fontSize:13, color:"#7c5cbf", marginLeft:8 }}>{tier.description}</span>}
                    </div>
                    <span style={{ fontSize:11, color:"#5a4a7a" }}>({tierMembers.length})</span>
                    <button onClick={()=>{ setEditingTierId(tier.id); setEditTierName(tier.name); setEditTierDesc(tier.description||""); }} style={{...iconBtn,fontSize:12}}>✏️</button>
                    {tiers.length > 1 && <button onClick={()=>setConfirmDeleteTierId(tier.id)} style={{...iconBtn,fontSize:12,color:"#c06060"}}>🗑️</button>}
                  </>
                )}
              </div>
              {/* Drop zone + member cards */}
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, minHeight:44, padding:"4px 0 8px", background: isOver ? "#7c5cbf0a" : "transparent", borderRadius:6, transition:"background .15s" }}
                onDragOver={e=>{ e.preventDefault(); setDragOverTier(tier.id); }}
                onDragLeave={()=>setDragOverTier(null)}
                onDrop={e=>{ e.preventDefault(); if(draggedCharId) moveMember(draggedCharId, tier.id); setDraggedCharId(null); setDragOverTier(null); }}>
                {tierMembers.length === 0 && !isOver && <span style={{ color:"#3a2a5a", fontSize:12, alignSelf:"center" }}>— empty —</span>}
                {isOver && tierMembers.length === 0 && <span style={{ color:"#7c5cbf", fontSize:12, alignSelf:"center" }}>Drop here</span>}
                {tierMembers.map(c => (
                  <div key={c.id} draggable
                    onDragStart={()=>setDraggedCharId(c.id)}
                    onDragEnd={()=>{ setDraggedCharId(null); setDragOverTier(null); }}
                    onClick={e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();onOpenChar(c,{newTab:true});}else{onOpenChar(c);}}} onAuxClick={e=>{if(e.button===1){e.preventDefault();onOpenChar(c,{newTab:true});}}}
                    style={{ display:"flex", alignItems:"center", gap:8, background:"#1e1630", border:"1px solid #3a2a5a", borderRadius:8, padding:"6px 12px 6px 6px", cursor:"grab", userSelect:"none", transition:"border-color .15s, opacity .15s", opacity: draggedCharId===c.id ? 0.4 : 1 }}
                    onMouseEnter={e=>e.currentTarget.style.borderColor="#7c5cbf"}
                    onMouseLeave={e=>e.currentTarget.style.borderColor="#3a2a5a"}>
                    <span style={{ fontSize:10, color:"#5a4a7a", cursor:"grab" }}>⠿</span>
                    <Avatar src={c.image} name={c.name} size={28}/>
                    <span style={{ fontSize:12, color:"#e8d5b7", fontWeight:600 }}>{c.name}</span>
                    <span style={{ fontSize:10, color:"#7c5cbf", opacity:.7 }}>↗</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FactionDetailPanel({ faction, factions, chars, onClose, onSave, onDelete, onOpenChar, onCancelNew, isEditing, onSetEditing }) {
  const [editForm, setEditForm] = useState({ ...defaultFaction, ...faction });
  const [detailTab, setDetailTab] = useState("members");
  const colorRef = useRef();

  useEffect(() => { setEditForm({ ...defaultFaction, ...faction }); }, [faction?.id]); // eslint-disable-line

  if (!faction) return null;

  const set = (k, v) => setEditForm(f => ({ ...f, [k]: v }));
  const handleSave = () => { const {_isNew, ...clean} = {...faction, ...editForm}; onSave(clean); onSetEditing(false); };
  const handleCancelEdit = () => { if (faction._isNew) { onCancelNew?.(faction.id); return; } onSetEditing(false); setEditForm({ ...defaultFaction, ...faction }); };

  const allMembers = chars.filter(c => (c.factions || []).some(e => e.factionId === faction.id));
  const color = getFactionColor(factions, faction.id);

  return (
    <div style={{ background:"#13101f", border:"1px solid #7c5cbf", borderRadius:12, marginBottom:20, overflow:"hidden", boxShadow:"0 4px 32px #7c5cbf22", animation:"slideDown .18s ease" }}>
      <style>{`@keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ background:`linear-gradient(90deg,${color}aa,#13101f)`, padding:"18px 24px", display:"flex", alignItems:"flex-start", gap:20, borderBottom:"1px solid #2a1f3d" }}>
        <div style={{ flex:1 }}>
          {isEditing ? (
            <input value={editForm.name} onChange={e => set("name", e.target.value)} placeholder="Faction name…"
              style={{ ...inputStyle, fontSize:18, fontFamily:"Georgia,serif", fontWeight:700 }}/>
          ) : (
            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", marginBottom:6 }}>
              <span style={{ fontSize:22, fontFamily:"Georgia,serif", color:"#e8d5b7", fontWeight:700 }}>⚑ {faction.name}</span>
              {faction.alignment && <Badge label={faction.alignment} color={ALIGNMENT_COLORS[faction.alignment]}/>}
              {faction.status && <Badge label={faction.status} color={FACTION_STATUS_COLORS[faction.status] || "#3a3a3a"}/>}
            </div>
          )}
          {!isEditing && faction.location && <div style={{ color:"#9a7fa0", fontSize:13 }}>📍 {faction.location}</div>}
        </div>
        <div style={{ display:"flex", gap:8, flexShrink:0 }}>
          {isEditing ? (
            <>
              <button onClick={handleSave} disabled={!editForm.name.trim()} style={{ ...btnPrimary, fontSize:12, padding:"6px 14px" }}>💾 Save</button>
              <button onClick={handleCancelEdit} style={{ ...btnSecondary, fontSize:12, padding:"6px 14px" }}>{faction._isNew ? "Discard" : "Cancel"}</button>
            </>
          ) : (
            <>
              <button onClick={() => onSetEditing(true)} style={{ ...btnPrimary, fontSize:12, padding:"6px 14px" }}>✏️ Edit</button>
              {onDelete && <button onClick={() => onDelete(faction.id)} style={{ ...btnSecondary, fontSize:12, padding:"6px 14px", color:"#c06060", borderColor:"#6b1a1a" }}>🗑️ Delete</button>}
              <button onClick={onClose} style={{ ...btnSecondary, fontSize:18, padding:"2px 10px", lineHeight:1 }}>×</button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <div style={{ padding:"20px 24px" }}>
          <div style={{ display:"flex", gap:12, marginBottom:14 }}>
            <div style={{ flex:1 }}>
              <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Location</label>
              <input value={editForm.location} onChange={e => set("location", e.target.value)} style={inputStyle}/>
            </div>
          </div>
          <div style={{ display:"flex", gap:12, marginBottom:14 }}>
            <div style={{ flex:1 }}>
              <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Alignment</label>
              <select value={editForm.alignment} onChange={e => set("alignment", e.target.value)} style={selStyle}>
                <option value="">— Select —</option>
                {ALIGNMENTS.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div style={{ flex:1 }}>
              <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Status</label>
              <select value={editForm.status || ""} onChange={e => set("status", e.target.value)} style={selStyle}>
                <option value="">— Select —</option>
                {FACTION_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Faction Color</label>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div onClick={() => colorRef.current.click()} style={{ width:32, height:32, borderRadius:6, background:editForm.color || "#3a2a5a", border:"2px solid #3a2a5a", cursor:"pointer", flexShrink:0 }}/>
              <input ref={colorRef} type="color" value={editForm.color || FACTION_COLORS[0]} onChange={e => set("color", e.target.value)} style={{ position:"absolute", opacity:0, pointerEvents:"none", width:0, height:0 }}/>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {FACTION_COLORS.map(c => (
                  <div key={c} onClick={() => set("color", c)} style={{ width:22, height:22, borderRadius:4, background:c, cursor:"pointer", border:editForm.color === c ? "2px solid #e8d5b7" : "2px solid transparent", transition:"border .1s" }}/>
                ))}
                <div onClick={() => set("color", "")} style={{ width:22, height:22, borderRadius:4, background:"#1a1228", cursor:"pointer", border:!editForm.color ? "2px solid #7c5cbf" : "2px solid #3a2a5a", fontSize:10, color:"#5a4a7a", display:"flex", alignItems:"center", justifyContent:"center", transition:"border .1s" }} title="Auto (use default)">↺</div>
              </div>
            </div>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Description</label>
            <textarea value={editForm.description} onChange={e => set("description", e.target.value)} rows={4} style={{ ...inputStyle, resize:"vertical" }}/>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={handleSave} disabled={!editForm.name.trim()} style={{ ...btnPrimary, flex:1 }}>💾 Save Faction</button>
            <button onClick={handleCancelEdit} style={{ ...btnSecondary, flex:1 }}>{faction._isNew ? "Discard" : "Cancel"}</button>
          </div>
        </div>
      ) : (
        <div>
          {/* Tab bar */}
          <div style={{ display:"flex", borderBottom:"1px solid #2a1f3d", padding:"0 24px" }}>
            {[["description","📖 Description"],["members","👥 Members"]].map(([id,label])=>(
              <button key={id} onClick={()=>setDetailTab(id)}
                style={{ background:"none", border:"none", borderBottom:`2px solid ${detailTab===id?"#7c5cbf":"transparent"}`, color:detailTab===id?"#c8a96e":"#5a4a7a", cursor:"pointer", fontSize:12, fontWeight:700, letterSpacing:.5, padding:"10px 14px 8px", textTransform:"uppercase", transition:"color .15s" }}>
                {label}
              </button>
            ))}
          </div>
          {detailTab === "description" && (
            <div style={{ padding:"16px 24px" }}>
              {faction.description
                ? <div style={{ color:"#b09080", fontSize:14, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{faction.description}</div>
                : <div style={{ color:"#3a2a5a", fontSize:13, fontStyle:"italic" }}>No description yet. Click Edit to add one.</div>}
            </div>
          )}
          {detailTab === "members" && (
            <StructureTab faction={faction} allMembers={allMembers} onSave={onSave} onOpenChar={onOpenChar}/>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(FactionDetailPanel);
