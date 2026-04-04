import { useState, useEffect, useRef, memo } from "react";
import { inputStyle, ghostInput, ghostTextarea, selStyle, btnPrimary, btnSecondary, iconBtn, ALIGNMENT_COLORS, FACTION_STATUS_COLORS, ALIGNMENTS, FACTION_STATUSES, FACTION_COLORS } from "../constants.js";
import { getFactionColor, uid } from "../utils.jsx";
import Avatar from "./Avatar.jsx";
import PortraitZone from "./PortraitZone.jsx";

// ── Structure Tab ─────────────────────────────────────────────────────────────
function StructureTab({ faction, allMembers, chars, onSave, onOpenChar, onSaveChar }) {
  const tiers = faction.tiers || [{ id:"__default__", name:"Members" }];
  const [draggedCharId, setDraggedCharId] = useState(null);
  const [dragOverTier, setDragOverTier] = useState(null);
  const [editingTierId, setEditingTierId] = useState(null);
  const [editTierName, setEditTierName] = useState("");
  const [editTierDesc, setEditTierDesc] = useState("");
  const [newTierName, setNewTierName] = useState("");
  const [addingTier, setAddingTier] = useState(false);
  const [confirmDeleteTierId, setConfirmDeleteTierId] = useState(null);
  const [confirmRemoveMemberId, setConfirmRemoveMemberId] = useState(null);
  const [addingToTierId, setAddingToTierId] = useState(null);
  const [addSearch, setAddSearch] = useState("");

  const updateTiers = newTiers => onSave({ ...faction, tiers: newTiers });
  const moveMember = (charId, tierId) => {
    const assignments = { ...(faction.structureAssignments||{}) };
    assignments[charId] = tierId;
    onSave({ ...faction, tiers, structureAssignments: assignments });
    // Sync tierId + role back to the character
    if (onSaveChar) {
      const c = allMembers.find(m => m.id === charId);
      if (c) {
        const tier = tiers.find(t => t.id === tierId);
        const updated = { ...c, factions: (c.factions||[]).map(e => e.factionId===faction.id ? {...e, tierId, role: tier?.name||e.role} : e) };
        onSaveChar(updated);
      }
    }
  };

  const getAssignedTierId = c => {
    const membership = (c.factions||[]).find(e=>e.factionId===faction.id);
    if (membership?.tierId && tiers.some(t=>t.id===membership.tierId)) return membership.tierId;
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

  const removeMember = (charId) => {
    const c = allMembers.find(m => m.id === charId);
    if (c && onSaveChar) {
      onSaveChar({ ...c, factions: (c.factions||[]).filter(e => e.factionId !== faction.id) });
    }
    const assignments = { ...(faction.structureAssignments||{}) };
    delete assignments[charId];
    onSave({ ...faction, tiers, structureAssignments: assignments });
  };

  const addMember = (char, tierId) => {
    const tier = tiers.find(t => t.id === tierId);
    // Link char to faction
    const updatedChar = { ...char, factions: [...(char.factions||[]).filter(e=>e.factionId!==faction.id), { factionId: faction.id, role: tier?.name||"", tierId }] };
    onSaveChar(updatedChar);
    // Assign to tier
    const assignments = { ...(faction.structureAssignments||{}), [char.id]: tierId };
    onSave({ ...faction, tiers, structureAssignments: assignments });
    setAddingToTierId(null); setAddSearch("");
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
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, minHeight:44, padding:"4px 0 8px", background: isOver ? "#7c5cbf0a" : "transparent", borderRadius:6, transition:"background .15s", alignItems:"center" }}
                onDragOver={e=>{ e.preventDefault(); setDragOverTier(tier.id); }}
                onDragLeave={()=>setDragOverTier(null)}
                onDrop={e=>{ e.preventDefault(); if(draggedCharId) moveMember(draggedCharId, tier.id); setDraggedCharId(null); setDragOverTier(null); }}>
                {tierMembers.length === 0 && !isOver && addingToTierId !== tier.id && <span style={{ color:"#3a2a5a", fontSize:12 }}>— empty —</span>}
                {isOver && tierMembers.length === 0 && <span style={{ color:"#7c5cbf", fontSize:12 }}>Drop here</span>}
                {tierMembers.map(c => (
                  <div key={c.id} draggable
                    onDragStart={()=>setDraggedCharId(c.id)}
                    onDragEnd={()=>{ setDraggedCharId(null); setDragOverTier(null); }}
                    onClick={e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();onOpenChar(c,{newTab:true});}else{onOpenChar(c);}}}
                    onAuxClick={e=>{if(e.button===1){e.preventDefault();onOpenChar(c,{newTab:true});}}}
                    style={{ display:"flex", alignItems:"center", gap:8, background:"#1e1630", border:"1px solid #3a2a5a", borderRadius:8, padding:"6px 12px 6px 6px", cursor:"grab", userSelect:"none", transition:"border-color .15s, opacity .15s", opacity: draggedCharId===c.id ? 0.4 : 1 }}
                    onMouseEnter={e=>e.currentTarget.style.borderColor="#7c5cbf"}
                    onMouseLeave={e=>e.currentTarget.style.borderColor="#3a2a5a"}>
                    <span style={{ fontSize:10, color:"#5a4a7a", cursor:"grab" }}>⠿</span>
                    <Avatar src={c.image} name={c.name} size={28}/>
                    <span style={{ fontSize:12, color:"#e8d5b7", fontWeight:600 }}>{c.name}</span>
                    <span style={{ fontSize:10, color:"#7c5cbf", opacity:.7 }}>↗</span>
                    {confirmRemoveMemberId === c.id
                      ? <>
                          <button onClick={e=>{ e.stopPropagation(); removeMember(c.id); setConfirmRemoveMemberId(null); }} style={{ background:"none", border:"none", color:"#c06060", cursor:"pointer", fontSize:12, padding:"0 2px", lineHeight:1, marginLeft:2, flexShrink:0, fontWeight:700 }}>✓</button>
                          <button onClick={e=>{ e.stopPropagation(); setConfirmRemoveMemberId(null); }} style={{ background:"none", border:"none", color:"#5a4a7a", cursor:"pointer", fontSize:12, padding:"0 2px", lineHeight:1, flexShrink:0 }}>✕</button>
                        </>
                      : <button onClick={e=>{ e.stopPropagation(); setConfirmRemoveMemberId(c.id); }}
                          style={{ background:"none", border:"none", color:"#5a4a7a", cursor:"pointer", fontSize:14, padding:"0 2px", lineHeight:1, marginLeft:2, flexShrink:0 }}
                          onMouseEnter={e=>e.currentTarget.style.color="#c06060"} onMouseLeave={e=>e.currentTarget.style.color="#5a4a7a"}>×</button>
                    }
                  </div>
                ))}
                {/* Add character box */}
                {addingToTierId === tier.id ? (
                  <div style={{ position:"relative" }}>
                    <input autoFocus value={addSearch} onChange={e=>setAddSearch(e.target.value)}
                      onKeyDown={e=>{ if(e.key==="Escape"){ setAddingToTierId(null); setAddSearch(""); } }}
                      placeholder="Search character…"
                      style={{...inputStyle, fontSize:12, padding:"5px 10px", width:160}}/>
                    {(() => {
                      const q = addSearch.toLowerCase();
                      const results = (chars||[]).filter(c => !allMembers.some(m=>m.id===c.id) && (!q || c.name.toLowerCase().includes(q)));
                      if (!results.length) return null;
                      return (
                        <div style={{ position:"absolute", top:"100%", left:0, zIndex:20, background:"#1a1228", border:"1px solid #3a2a5a", borderRadius:8, width:200, maxHeight:180, overflowY:"auto", marginTop:4, boxShadow:"0 4px 16px #00000066" }}>
                          {results.map(c => (
                            <div key={c.id} onMouseDown={e=>{ e.preventDefault(); addMember(c, tier.id); }}
                              style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 10px", cursor:"pointer", borderBottom:"1px solid #1e1630" }}
                              onMouseEnter={e=>e.currentTarget.style.background="#1e1630"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                              <Avatar src={c.image} name={c.name} size={22}/>
                              <span style={{ fontSize:12, color:"#e8d5b7", flex:1 }}>{c.name}</span>
                              <span style={{ fontSize:10, color:"#7c5cbf" }}>+ Add</span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div onClick={()=>{ setAddingToTierId(tier.id); setAddSearch(""); }}
                    style={{ display:"flex", alignItems:"center", justifyContent:"center", width:44, height:44, border:"2px dashed #3a2a5a", borderRadius:8, cursor:"pointer", color:"#3a2a5a", fontSize:20, flexShrink:0, transition:"border-color .15s, color .15s" }}
                    onMouseEnter={e=>{ e.currentTarget.style.borderColor="#7c5cbf"; e.currentTarget.style.color="#7c5cbf"; }}
                    onMouseLeave={e=>{ e.currentTarget.style.borderColor="#3a2a5a"; e.currentTarget.style.color="#3a2a5a"; }}>
                    +
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FactionDetailPanel({ faction, factions, chars, locations, onClose, onSave, onDelete, onOpenChar, onSaveChar, onCancelNew }) {
  const colorTimerRef = useRef(null);
  const [colorDraft, setColorDraft] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [fieldVal, setFieldVal] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [activeTextTab, setActiveTextTab] = useState("description");
  const [renamingTabId, setRenamingTabId] = useState(null);
  const [renameVal, setRenameVal] = useState("");
  const [confirmDeleteTabId, setConfirmDeleteTabId] = useState(null);

  useEffect(() => {
    const handler = e => {
      if (e.key !== "Escape") return;
      if (editingField !== null) { setEditingField(null); return; }
      if (confirmDelete) { setConfirmDelete(false); return; }
      if (faction?._isNew) { onCancelNew?.(faction.id); return; }
      onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [editingField, confirmDelete]); // eslint-disable-line

  if (!faction) return null;

  const commit = (field, val) => { onSave({...faction, [field]: val}); setEditingField(null); };
  const startEdit = (field, val) => { setEditingField(field); setFieldVal(val||""); };
  const fh = {
    onMouseEnter: e => e.currentTarget.style.background = "#ffffff0a",
    onMouseLeave: e => e.currentTarget.style.background = "transparent",
  };
  const allTextTabs = [{ id:"description", name:"Description", content:faction.description||"" }, ...(faction.textTabs||[])];
  const activeTabContent = allTextTabs.find(t => t.id === activeTextTab)?.content || "";
  const updateTextTab = (tabId, content) => {
    if (tabId === "description") onSave({...faction, description: content});
    else onSave({...faction, textTabs:(faction.textTabs||[]).map(t => t.id===tabId ? {...t,content} : t)});
  };
  const addTextTab = () => { const id=uid(); onSave({...faction, textTabs:[...(faction.textTabs||[]),{id,name:"New Tab",content:""}]}); setActiveTextTab(id); setRenamingTabId(id); setRenameVal("New Tab"); };
  const renameTab = (tabId, name) => { onSave({...faction, textTabs:(faction.textTabs||[]).map(t => t.id===tabId?{...t,name:name.trim()||t.name}:t)}); setRenamingTabId(null); };
  const deleteTab = tabId => { if(activeTextTab===tabId) setActiveTextTab("description"); onSave({...faction, textTabs:(faction.textTabs||[]).filter(t=>t.id!==tabId)}); setConfirmDeleteTabId(null); };

  const allMembers = chars.filter(c => (c.factions || []).some(e => e.factionId === faction.id));
  const color = getFactionColor(factions, faction.id);

  return (
    <div style={{ background:"#13101f", border:"1px solid #7c5cbf", borderRadius:12, marginBottom:20, overflow:"visible", boxShadow:"0 4px 32px #7c5cbf22", animation:"slideDown .18s ease" }}>
      <style>{`@keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* ── Sticky header ── */}
      <div style={{ position:"sticky", top:0, zIndex:20, borderRadius:"12px 12px 0 0", background:"#13101f", overflow:"hidden" }}>
      <div style={{ background:`linear-gradient(90deg,#13101f,${color}cc)`, padding:"18px 24px", display:"flex", alignItems:"flex-start", gap:16, borderBottom:"1px solid #2a1f3d" }}>

        {/* Portrait */}
        <PortraitZone value={faction.image} onChange={src=>onSave({...faction,image:src})} size={72} emptyIcon="🏴" emptyLabel="Add logo"/>

        {/* Left: name + badges + location */}
        <div style={{ flex:1 }}>
          {/* Name */}
          {editingField==="name"
            ? <input value={fieldVal} autoFocus
                onChange={e=>setFieldVal(e.target.value)}
                onBlur={()=>{ if(fieldVal.trim()) commit("name",fieldVal.trim()); else setEditingField(null); }}
                onKeyDown={e=>{ if(e.key==="Enter"&&fieldVal.trim()) commit("name",fieldVal.trim()); if(e.key==="Tab"){ e.preventDefault(); if(fieldVal.trim()) commit("name",fieldVal.trim()); startEdit("locationId",""); } if(e.key==="Escape") setEditingField(null); }}
                style={{...inputStyle, fontSize:18, fontFamily:"Georgia,serif", fontWeight:700, marginBottom:6, display:"block", width:"100%", boxSizing:"border-box"}}/>
            : <div onClick={()=>startEdit("name",faction.name||"")} {...fh} style={{ borderRadius:4, cursor:"text", marginBottom:6, display:"inline-block" }}>
                <span style={{ fontSize:22, fontFamily:"Georgia,serif", color:"#e8d5b7", fontWeight:700 }}>⚑ {faction.name||<span style={{color:"#3a2a5a",fontStyle:"italic"}}>Unnamed Faction</span>}</span>
              </div>
          }
          {/* Alignment + Status */}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:6 }}>
            {editingField==="alignment"
              ? <select value={fieldVal} autoFocus onChange={e=>commit("alignment",e.target.value)} onBlur={()=>setEditingField(null)} onKeyDown={e=>{ if(e.key==="Escape") setEditingField(null); }} style={{...selStyle,fontSize:12,padding:"3px 8px"}}>
                  <option value="">— None —</option>
                  {ALIGNMENTS.map(a=><option key={a}>{a}</option>)}
                </select>
              : <div onClick={()=>startEdit("alignment",faction.alignment||"")} style={{ borderRadius:4, cursor:"pointer" }}>
                  {faction.alignment
                    ? <span style={{ fontSize:11, color:ALIGNMENT_COLORS[faction.alignment]||"#e8d5b7", background:"#13101f", border:`1px solid ${ALIGNMENT_COLORS[faction.alignment]||"#3a3a3a"}`, borderRadius:8, padding:"2px 8px" }}>{faction.alignment}</span>
                    : <span style={{ fontSize:11, color:"#3a2a5a", border:"1px dashed #3a2a5a", borderRadius:8, padding:"2px 8px" }}>Set alignment…</span>}
                </div>
            }
            {editingField==="status"
              ? <select value={fieldVal} autoFocus onChange={e=>commit("status",e.target.value)} onBlur={()=>setEditingField(null)} onKeyDown={e=>{ if(e.key==="Escape") setEditingField(null); }} style={{...selStyle,fontSize:12,padding:"3px 8px"}}>
                  <option value="">— None —</option>
                  {FACTION_STATUSES.map(s=><option key={s}>{s}</option>)}
                </select>
              : <div onClick={()=>startEdit("status",faction.status||"")} style={{ borderRadius:4, cursor:"pointer" }}>
                  {faction.status
                    ? <span style={{ fontSize:11, color:"#e8d5b7", background:"#13101f", border:`1px solid ${FACTION_STATUS_COLORS[faction.status]||"#3a3a3a"}`, borderRadius:8, padding:"2px 8px" }}>{faction.status}</span>
                    : <span style={{ fontSize:11, color:"#3a2a5a", border:"1px dashed #3a2a5a", borderRadius:8, padding:"2px 8px" }}>Set status…</span>}
                </div>
            }
          </div>
          {/* Location — searchbox linked to locations list */}
          {(() => {
            const locObj = (locations||[]).find(l => l.id === faction.locationId);
            const locName = locObj ? (locObj.region ? `${locObj.name} (${locObj.region})` : locObj.name) : null;
            return editingField==="locationId"
              ? <div style={{ position:"relative" }}>
                  <input autoFocus value={fieldVal}
                    onChange={e=>setFieldVal(e.target.value)}
                    onKeyDown={e=>{ if(e.key==="Escape") setEditingField(null); }}
                    onBlur={e=>{ if(!e.currentTarget.parentElement?.contains(e.relatedTarget)) setEditingField(null); }}
                    placeholder="Search location…"
                    style={{...ghostInput, fontSize:13, width:200}}/>
                  <div style={{ position:"absolute", top:"100%", left:0, zIndex:30, background:"#1a1228", border:"1px solid #3a2a5a", borderRadius:8, minWidth:220, maxHeight:180, overflowY:"auto", marginTop:4, boxShadow:"0 4px 16px #00000066" }}>
                    <div onMouseDown={()=>{ onSave({...faction, locationId:""}); setEditingField(null); }}
                      style={{ padding:"6px 10px", fontSize:12, color:"#5a4a7a", cursor:"pointer", borderBottom:"1px solid #1e1630", fontStyle:"italic" }}
                      onMouseEnter={e=>e.currentTarget.style.background="#1e1630"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      — None —
                    </div>
                    {(locations||[]).filter(l=>!fieldVal||l.name.toLowerCase().includes(fieldVal.toLowerCase())).map(l=>(
                      <div key={l.id} onMouseDown={()=>{ onSave({...faction, locationId:l.id}); setEditingField(null); }}
                        style={{ padding:"6px 10px", fontSize:12, color:"#e8d5b7", cursor:"pointer", borderBottom:"1px solid #1e1630" }}
                        onMouseEnter={e=>e.currentTarget.style.background="#1e1630"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        📍 {l.name}{l.region?` (${l.region})`:""}
                      </div>
                    ))}
                  </div>
                </div>
              : <div onClick={()=>startEdit("locationId", "")} {...fh} style={{ borderRadius:4, cursor:"pointer" }}>
                  {locName
                    ? <span style={{ color:"#9a7fa0", fontSize:13 }}>📍 {locName}</span>
                    : <span style={{ color:"#3a2a5a", fontSize:12, fontStyle:"italic" }}>📍 Set location…</span>}
                </div>;
          })()}
          {/* Summary strip */}
          {(allMembers.length > 0 || (faction.tiers||[]).length > 1) && (
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:8 }}>
              {allMembers.length > 0 && <span style={{ display:"inline-flex", alignItems:"center", fontSize:10, color:"#c8b89a", background:"#c8b89a18", borderRadius:8, padding:"1px 7px", border:"1px solid #c8b89a33" }}>👥 {allMembers.length} member{allMembers.length!==1?"s":""}</span>}
              {(faction.tiers||[]).length > 1 && <span style={{ display:"inline-flex", alignItems:"center", fontSize:10, color:"#7c5cbf", background:"#7c5cbf18", borderRadius:8, padding:"1px 7px", border:"1px solid #7c5cbf33" }}>🏗️ {(faction.tiers||[]).length} tiers</span>}
            </div>
          )}
        </div>

        {/* Right: color swatches + actions */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8, flexShrink:0 }}>
          {showColors && (
            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
              {/* Preset swatches */}
              {FACTION_COLORS.map(c=>(
                <div key={c} onClick={()=>{ clearTimeout(colorTimerRef.current); onSave({...faction,color:c}); setColorDraft(null); }}
                  style={{ width:20, height:20, borderRadius:4, background:c, cursor:"pointer", border:(colorDraft||faction.color)===c?"2px solid #e8d5b7":"2px solid transparent", transition:"border .1s", flexShrink:0 }}/>
              ))}
              {/* Auto (reset) */}
              <div onClick={()=>{ clearTimeout(colorTimerRef.current); onSave({...faction,color:""}); setColorDraft(null); }}
                style={{ width:20, height:20, borderRadius:4, background:"#1a1228", cursor:"pointer", border:!faction.color&&!colorDraft?"2px solid #7c5cbf":"2px solid #3a2a5a", fontSize:9, color:"#5a4a7a", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }} title="Auto">↺</div>
              {/* Custom color — visible input styled as swatch, debounced save */}
              <input type="color" value={colorDraft||faction.color||FACTION_COLORS[0]}
                onChange={e=>{ const v=e.target.value; setColorDraft(v); clearTimeout(colorTimerRef.current); colorTimerRef.current=setTimeout(()=>{ onSave({...faction,color:v}); setColorDraft(null); },600); }}
                title="Custom color"
                style={{ width:20, height:20, borderRadius:4, padding:1, border:"2px solid #3a2a5a", background:"transparent", cursor:"pointer", flexShrink:0 }}/>
            </div>
          )}
          <div style={{ display:"flex", gap:6 }}>
            <button onClick={()=>setShowColors(v=>!v)} style={{...btnSecondary, fontSize:14, padding:"4px 10px", lineHeight:1, background: showColors?"#2a1f3d":"transparent" }} title="Change color">🎨</button>
            {onDelete && (confirmDelete
              ? <>
                  <span style={{ fontSize:12, color:"#c8b89a", alignSelf:"center" }}>Delete?</span>
                  <button onClick={()=>{ setConfirmDelete(false); onDelete(faction.id); }} style={{...btnSecondary,fontSize:12,padding:"4px 10px",color:"#c06060",borderColor:"#6b1a1a"}}>Yes</button>
                  <button onClick={()=>setConfirmDelete(false)} style={{...btnSecondary,fontSize:12,padding:"4px 10px"}}>No</button>
                </>
              : <button onClick={()=>setConfirmDelete(true)} style={{...btnSecondary,fontSize:12,padding:"4px 10px",color:"#c06060",borderColor:"#6b1a1a"}}>🗑️</button>
            )}
            <button onClick={onClose} style={{...btnSecondary,fontSize:18,padding:"2px 10px",lineHeight:1}}>×</button>
          </div>
        </div>
      </div>
      </div>{/* end sticky */}

      {/* ── Body: Description (left) + Members (right) ── */}
      <div style={{ display:"flex", alignItems:"flex-start" }}>

        {/* Description tabs */}
        <div style={{ flex:"1 1 38%", padding:"16px 24px", borderRight:"1px solid #1e1630", minWidth:0 }}>
          {/* Tab bar */}
          <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:10, flexWrap:"wrap" }}>
            {allTextTabs.map(t=>(
              <div key={t.id} style={{ display:"flex", alignItems:"center", gap:1 }}>
                {confirmDeleteTabId===t.id ? (
                  <div style={{ display:"flex", alignItems:"center", gap:4, background:"#1a0f0f", border:"1px solid #6b1a1a", borderRadius:6, padding:"3px 8px" }}>
                    <span style={{ fontSize:11, color:"#c06060" }}>Delete "{t.name}"?</span>
                    <button onClick={()=>deleteTab(t.id)} style={{ background:"#6b1a1a", border:"none", borderRadius:4, color:"#e8d5b7", cursor:"pointer", fontSize:11, padding:"2px 8px" }}>Delete</button>
                    <button onClick={()=>setConfirmDeleteTabId(null)} style={{ background:"none", border:"1px solid #3a2a5a", borderRadius:4, color:"#9a7fa0", cursor:"pointer", fontSize:11, padding:"2px 8px" }}>Cancel</button>
                  </div>
                ) : renamingTabId===t.id ? (
                  <input autoFocus value={renameVal} onChange={e=>setRenameVal(e.target.value)}
                    onBlur={()=>renameTab(t.id,renameVal)}
                    onKeyDown={e=>{ if(e.key==="Enter"||e.key==="Escape") renameTab(t.id,renameVal); }}
                    style={{ width:90, padding:"3px 6px", fontSize:12, background:"#0d0b14", border:"1px solid #7c5cbf", borderRadius:4, color:"#e8d5b7", outline:"none" }}/>
                ) : (
                  <>
                    <button onClick={()=>{ setActiveTextTab(t.id); setEditingField(null); }}
                      style={{ padding:"3px 10px", borderRadius:6, border:"1px solid", borderColor:activeTextTab===t.id?"#7c5cbf":"#3a2a5a", background:activeTextTab===t.id?"#2a1f3d":"transparent", color:activeTextTab===t.id?"#e8d5b7":"#6a5a8a", cursor:"pointer", fontSize:11, fontWeight:700 }}>
                      {t.name}
                    </button>
                    {t.id!=="description" && <>
                      <button onClick={()=>{ setRenamingTabId(t.id); setRenameVal(t.name); }} style={{ padding:"1px 4px", border:"none", background:"transparent", color:"#5a4a7a", cursor:"pointer", fontSize:11 }} onMouseEnter={e=>e.currentTarget.style.color="#c8a96e"} onMouseLeave={e=>e.currentTarget.style.color="#5a4a7a"}>✏️</button>
                      <button onClick={()=>setConfirmDeleteTabId(t.id)} style={{ padding:"1px 4px", border:"none", background:"transparent", color:"#5a4a7a", cursor:"pointer", fontSize:11 }} onMouseEnter={e=>e.currentTarget.style.color="#c06060"} onMouseLeave={e=>e.currentTarget.style.color="#5a4a7a"}>✕</button>
                    </>}
                  </>
                )}
              </div>
            ))}
            <button onClick={addTextTab} style={{ padding:"3px 10px", borderRadius:6, border:"1px dashed #3a2a5a", background:"transparent", color:"#5a4a7a", cursor:"pointer", fontSize:11 }}>+ Tab</button>
          </div>
          {/* Content */}
          {editingField==="__text__"+activeTextTab
            ? <textarea value={fieldVal} autoFocus
                ref={el=>{ if(el){ el.style.height="auto"; el.style.height=el.scrollHeight+"px"; } }}
                onChange={e=>setFieldVal(e.target.value)}
                onInput={e=>{ e.target.style.height="auto"; e.target.style.height=e.target.scrollHeight+"px"; }}
                onBlur={()=>{ updateTextTab(activeTextTab, fieldVal); setEditingField(null); }}
                onKeyDown={e=>{ if(e.key==="Escape") { setEditingField(null); setFieldVal(""); } }}
                onMouseEnter={e=>{ if(document.activeElement!==e.target) e.target.style.background="#ffffff0a"; }}
                onMouseLeave={e=>{ if(document.activeElement!==e.target) e.target.style.background="transparent"; }}
                onFocus={e=>{ e.target.style.borderColor="#3a2a5a"; e.target.style.background="transparent"; }}
                style={{ ...ghostTextarea, borderColor:"transparent" }}/>
            : <div onClick={()=>startEdit("__text__"+activeTextTab, activeTabContent)}
                onMouseEnter={e=>{ e.currentTarget.style.background="#ffffff0a"; e.currentTarget.style.outline="1px solid #2a1f3d"; }}
                onMouseLeave={e=>{ e.currentTarget.style.background="transparent"; e.currentTarget.style.outline="none"; }}
                style={{ borderRadius:4, cursor:"text", minHeight:60, padding:"4px 2px" }}>
                {activeTabContent
                  ? <div style={{ color:"#b09080", fontSize:14, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{activeTabContent}</div>
                  : <span style={{ color:"#3a2a5a", fontSize:13, fontStyle:"italic" }}>Click to add {allTextTabs.find(t=>t.id===activeTextTab)?.name||"text"}…</span>}
              </div>
          }
        </div>

        {/* Members / Structure */}
        <div style={{ flex:"1 1 62%", minWidth:0 }}>
          <StructureTab faction={faction} allMembers={allMembers} chars={chars} onSave={onSave} onOpenChar={onOpenChar} onSaveChar={onSaveChar}/>
        </div>

      </div>
    </div>
  );
}

export default memo(FactionDetailPanel);
