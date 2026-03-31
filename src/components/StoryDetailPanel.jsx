import { useState, useEffect, memo } from "react";
import ImageUploadZone from "./ImageUploadZone.jsx";
import PortraitZone from "./PortraitZone.jsx";
import { inputStyle, ghostTextarea, ghostInput, selStyle, btnPrimary, btnSecondary, STATUS_COLORS, DEFAULT_STORY_STATUSES, DEFAULT_HOOK_STATUSES, DEFAULT_RARITIES } from "../constants.js";
import { uid, sortEventsDesc } from "../utils.jsx";
import Avatar from "./Avatar.jsx";
import Timeline from "./Timeline.jsx";

// ── Story Hooks Tab ────────────────────────────────────────────────────────────
function HooksTab({ story, onUpdateStory, hookStatuses, onPinHook, pinnedHookIds }) {
  const statuses = hookStatuses || DEFAULT_HOOK_STATUSES;
  const colorMap = Object.fromEntries(statuses.map(s => [s.name, s.color]));
  const defaultStatus = statuses[0]?.name || "Potential";
  const [addingNew, setAddingNew] = useState(false);
  const [newForm, setNewForm] = useState({ title:"", description:"", status:defaultStatus });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const hooks = story.hooks || [];

  const saveNew = () => {
    if (!newForm.title.trim()) return;
    onUpdateStory({ ...story, hooks: [...hooks, { ...newForm, id: uid() }] });
    setNewForm({ title:"", description:"", status:"Potential" });
    setAddingNew(false);
  };
  const saveEdit = () => {
    onUpdateStory({ ...story, hooks: hooks.map(h => h.id === editingId ? { ...h, ...editForm } : h) });
    setEditingId(null);
  };
  const removeHook = id => onUpdateStory({ ...story, hooks: hooks.filter(h => h.id !== id) });

  return (
    <div style={{ padding:"16px 24px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div style={{ fontSize:11, color:"#7c5cbf", letterSpacing:1, textTransform:"uppercase" }}>🔮 Plot Hooks & Future Scenarios</div>
        {!addingNew && <button onClick={() => setAddingNew(true)} style={{...btnPrimary, fontSize:12, padding:"6px 14px"}}>+ Add Hook</button>}
      </div>

      {addingNew && (
        <div style={{ background:"#0f0c1a", border:"1px solid #7c5cbf", borderRadius:10, padding:16, marginBottom:14 }}>
          <input value={newForm.title} onChange={e => setNewForm(f => ({...f, title:e.target.value}))} placeholder="Hook title…" style={{...inputStyle, marginBottom:8}}/>
          <textarea value={newForm.description} onChange={e => setNewForm(f => ({...f, description:e.target.value}))} placeholder="What might happen? What choices could players face?…" rows={4} style={{...inputStyle, resize:"vertical", marginBottom:8}}/>
          <select value={newForm.status} onChange={e => setNewForm(f => ({...f, status:e.target.value}))} style={{...selStyle, marginBottom:12}}>
            {statuses.map(s => <option key={s.name}>{s.name}</option>)}
          </select>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={saveNew} disabled={!newForm.title.trim()} style={{...btnPrimary, flex:1, fontSize:12}}>Add Hook</button>
            <button onClick={() => { setAddingNew(false); setNewForm({title:"",description:"",status:"Potential"}); }} style={{...btnSecondary, flex:1, fontSize:12}}>Cancel</button>
          </div>
        </div>
      )}

      {hooks.length === 0 && !addingNew && (
        <div style={{ textAlign:"center", padding:"40px 0", color:"#5a4a7a" }}>
          <div style={{ fontSize:36, marginBottom:10 }}>🔮</div>
          <div style={{ fontSize:14, fontFamily:"Georgia,serif" }}>No hooks yet.</div>
          <div style={{ fontSize:12, marginTop:6 }}>Add potential scenarios, quest branches, or future plot threads.</div>
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {hooks.map(h => {
          const sc = colorMap[h.status] || "#7c5cbf";
          return (
            <div key={h.id} style={{ background:"#0f0c1a", border:`1px solid #2a1f3d`, borderLeft:`3px solid ${sc}`, borderRadius:10, padding:14 }}>
              {editingId === h.id ? (
                <>
                  <input value={editForm.title} onChange={e => setEditForm(f => ({...f, title:e.target.value}))} style={{...inputStyle, marginBottom:8}}/>
                  <textarea value={editForm.description||""} onChange={e => setEditForm(f => ({...f, description:e.target.value}))} rows={4} style={{...inputStyle, resize:"vertical", marginBottom:8}}/>
                  <select value={editForm.status||"Potential"} onChange={e => setEditForm(f => ({...f, status:e.target.value}))} style={{...selStyle, marginBottom:12}}>
                    {statuses.map(s => <option key={s.name}>{s.name}</option>)}
                  </select>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={saveEdit} disabled={!editForm.title.trim()} style={{...btnPrimary, flex:1, fontSize:12}}>💾 Save</button>
                    <button onClick={() => setEditingId(null)} style={{...btnSecondary, flex:1, fontSize:12}}>Cancel</button>
                  </div>
                </>
              ) : (
                <div>
                  {confirmDeleteId === h.id ? (
                    <div style={{ display:"flex", alignItems:"center", gap:10, background:"#1a0d0d", borderRadius:8, padding:"8px 12px" }}>
                      <span style={{ flex:1, fontSize:12, color:"#c8b89a" }}>Delete <strong>"{h.title.slice(0,40)}{h.title.length>40?"…":""}"</strong>?</span>
                      <button onClick={() => { removeHook(h.id); setConfirmDeleteId(null); }} style={{ background:"#6b1a1a", color:"#e8d5b7", border:"none", borderRadius:6, padding:"4px 12px", cursor:"pointer", fontWeight:700, fontSize:12 }}>Delete</button>
                      <button onClick={() => setConfirmDeleteId(null)} style={{ background:"transparent", color:"#9a7fa0", border:"1px solid #3a2a5a", borderRadius:6, padding:"4px 12px", cursor:"pointer", fontSize:12 }}>Cancel</button>
                    </div>
                  ) : (
                    <>
                      <div style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom: h.description ? 8 : 0 }}>
                        <span style={{ fontSize:10, color:sc, background:sc+"22", border:`1px solid ${sc}44`, borderRadius:8, padding:"2px 8px", flexShrink:0, marginTop:2 }}>{h.status}</span>
                        <span style={{ fontSize:14, color:"#e8d5b7", fontWeight:700, fontFamily:"Georgia,serif", flex:1 }}>{h.title}</span>
                        <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                          {onPinHook && (() => { const isPinned = pinnedHookIds?.has(`${story.id}::${h.id}`); return (
                            <button onClick={() => onPinHook(story.id, h.id)} style={{...btnSecondary, fontSize:12, padding:"4px 10px", display:"flex", alignItems:"center", gap:4, color: isPinned ? "#c8a96e" : "#9a7fa0", borderColor: isPinned ? "#c8a96e66" : undefined}}>
                              📌 <span>{isPinned ? "Pinned" : "Pin to reminders"}</span>
                            </button>
                          ); })()}
                          <button onClick={() => { setEditingId(h.id); setEditForm({title:h.title, description:h.description||"", status:h.status||"Potential"}); }} style={{...btnSecondary, fontSize:12, padding:"4px 10px"}}>✏️</button>
                          <button onClick={() => setConfirmDeleteId(h.id)} style={{...btnSecondary, fontSize:12, padding:"4px 10px", color:"#c06060", borderColor:"#6b1a1a"}}>🗑️</button>
                        </div>
                      </div>
                      {h.description && <div style={{ fontSize:13, color:"#b09080", lineHeight:1.6, whiteSpace:"pre-wrap", paddingLeft:2 }}>{h.description}</div>}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Story Loot Tab ─────────────────────────────────────────────────────────────
function LootTab({ story, onUpdateStory, artifacts, onUpdateArtifacts, chars, onOpenChar, onOpenArtifact }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [addingNew, setAddingNew] = useState(false);
  const [newForm, setNewForm] = useState({ name:"", description:"", value:"", image:null });
  const items = story.items || [];
  const linkedArtifacts = (artifacts || []).filter(a => (a.storyIds || []).includes(story.id));

  const saveNew = () => {
    if (!newForm.name.trim()) return;
    onUpdateStory({ ...story, items: [...items, { ...newForm, id: uid() }] });
    setNewForm({ name:"", description:"", value:"", image:null });
    setAddingNew(false);
  };
  const saveEdit = () => {
    onUpdateStory({ ...story, items: items.map(it => it.id === editingId ? { ...it, ...editForm } : it) });
    setEditingId(null);
  };
  const removeItem = id => onUpdateStory({ ...story, items: items.filter(it => it.id !== id) });

  return (
    <div style={{ padding:"16px 24px" }}>
      {/* Linked Artifacts */}
      {linkedArtifacts.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, color:"#c8a96e", letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>✨ Linked Artifacts</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {linkedArtifacts.map(a => {
              const rc = rarityColors[a.rarity] || "#9a9a9a";
              const holder = a.holderId ? (chars||[]).find(c => c.id === a.holderId) : null;
              return (
                <div key={a.id} onClick={() => onOpenArtifact?.(a)} style={{ background:"#0f0c1a", border:`1px solid ${rc}33`, borderLeft:`3px solid ${rc}`, borderRadius:10, padding:"10px 14px", display:"flex", gap:10, alignItems:"center", cursor: onOpenArtifact ? "pointer" : "default", transition:"border-color .15s" }}
                  onMouseEnter={e => { if(onOpenArtifact) e.currentTarget.style.borderColor = rc+"88"; }}
                  onMouseLeave={e => { if(onOpenArtifact) e.currentTarget.style.borderColor = rc+"33"; }}>
                  {a.image && <img src={a.image} alt="" style={{ width:40, height:40, borderRadius:6, objectFit:"cover", flexShrink:0 }}/>}
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                      <span style={{ fontSize:13, color:"#e8d5b7", fontWeight:700 }}>{a.name}</span>
                      <span style={{ fontSize:9, color:rc, background:rc+"22", border:`1px solid ${rc}44`, borderRadius:8, padding:"1px 6px" }}>{a.rarity}</span>
                      {onOpenArtifact && <span style={{ fontSize:10, color:"#7c5cbf", opacity:.7 }}>↗ Items</span>}
                    </div>
                    {a.description && <div style={{ fontSize:12, color:"#b09080" }}>{a.description}</div>}
                    {holder && (
                      <div onClick={e => { e.stopPropagation(); if(e.ctrlKey||e.metaKey){onOpenChar?.(holder,{newTab:true});}else{onOpenChar?.(holder);} }} onAuxClick={e=>{if(e.button===1){e.preventDefault();e.stopPropagation();onOpenChar?.(holder,{newTab:true});}}} style={{ display:"flex", alignItems:"center", gap:5, marginTop:5, cursor:"pointer", width:"fit-content" }}
                        onMouseEnter={e => e.currentTarget.querySelector("span").style.textDecorationColor="#7c5cbf"}
                        onMouseLeave={e => e.currentTarget.querySelector("span").style.textDecorationColor="transparent"}>
                        <Avatar src={holder.image} name={holder.name} size={18}/>
                        <span style={{ fontSize:11, color:"#7c5cbf", textDecoration:"underline", textDecorationStyle:"dotted", textDecorationColor:"transparent", transition:"text-decoration-color .15s" }}>
                          {holder.name} ↗
                        </span>
                      </div>
                    )}
                  </div>
                  {a.value && <span style={{ fontSize:12, color:"#c8a96e", fontWeight:700 }}>🪙 {a.value}</span>}
                </div>
              );
            })}
          </div>
          {items.length > 0 && <div style={{ borderTop:"1px solid #2a1f3d", marginTop:16, marginBottom:16 }}/>}
        </div>
      )}

      {/* Loot list */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div style={{ fontSize:11, color:"#7c5cbf", letterSpacing:1, textTransform:"uppercase" }}>🎒 Loot / Rewards</div>
        {!addingNew && <button onClick={() => setAddingNew(true)} style={{...btnPrimary, fontSize:12, padding:"6px 14px"}}>+ Add Item</button>}
      </div>

      {addingNew && (
        <div style={{ background:"#0f0c1a", border:"1px solid #7c5cbf", borderRadius:10, padding:16, marginBottom:14 }}>
          <div style={{ display:"flex", gap:12, marginBottom:10 }}>
            <ImageUploadZone value={newForm.image} onChange={src=>setNewForm(f=>({...f,image:src}))} size="sm"/>
            <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8 }}>
              <input value={newForm.name} onChange={e => setNewForm(f => ({...f, name:e.target.value}))} placeholder="Item name…" style={inputStyle}/>
              <textarea value={newForm.description} onChange={e => setNewForm(f => ({...f, description:e.target.value}))} placeholder="Description…" rows={2} style={{...inputStyle, resize:"vertical"}}/>
              <input value={newForm.value} onChange={e => setNewForm(f => ({...f, value:e.target.value}))} placeholder="Value (e.g. 50 gp)…" style={inputStyle}/>
            </div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={saveNew} disabled={!newForm.name.trim()} style={{...btnPrimary, flex:1, fontSize:12}}>Add Item</button>
            <button onClick={() => { setAddingNew(false); setNewForm({name:"",description:"",value:"",image:null}); }} style={{...btnSecondary, flex:1, fontSize:12}}>Cancel</button>
          </div>
        </div>
      )}

      {items.length === 0 && !addingNew && linkedArtifacts.length === 0 && (
        <div style={{ textAlign:"center", padding:"40px 0", color:"#5a4a7a" }}>
          <div style={{ fontSize:36, marginBottom:10 }}>🎒</div>
          <div style={{ fontSize:14, fontFamily:"Georgia,serif" }}>No loot or artifacts yet.</div>
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {items.map(it => (
          <div key={it.id} style={{ background:"#0f0c1a", border:"1px solid #2a1f3d", borderRadius:10, padding:14 }}>
            {editingId === it.id ? (
              <>
                <div style={{ display:"flex", gap:12, marginBottom:10 }}>
                  <ImageUploadZone value={editForm.image} onChange={src=>setEditForm(f=>({...f,image:src}))} size="sm"/>
                  <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8 }}>
                    <input value={editForm.name} onChange={e => setEditForm(f => ({...f, name:e.target.value}))} style={inputStyle}/>
                    <textarea value={editForm.description||""} onChange={e => setEditForm(f => ({...f, description:e.target.value}))} rows={2} style={{...inputStyle, resize:"vertical"}}/>
                    <input value={editForm.value||""} onChange={e => setEditForm(f => ({...f, value:e.target.value}))} placeholder="Value (e.g. 50 gp)…" style={inputStyle}/>
                  </div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={saveEdit} disabled={!editForm.name.trim()} style={{...btnPrimary, flex:1, fontSize:12}}>💾 Save</button>
                  <button onClick={() => setEditingId(null)} style={{...btnSecondary, flex:1, fontSize:12}}>Cancel</button>
                </div>
              </>
            ) : (
              <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                {it.image && <img src={it.image} style={{ width:56, height:56, borderRadius:8, objectFit:"cover", flexShrink:0, border:"1px solid #2a1f3d" }}/>}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, color:"#e8d5b7", fontWeight:700, fontFamily:"Georgia,serif", marginBottom:3 }}>{it.name}</div>
                  {it.description && <div style={{ fontSize:13, color:"#b09080", lineHeight:1.5, whiteSpace:"pre-wrap" }}>{it.description}</div>}
                </div>
                {it.value && <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:13, color:"#c8a96e", fontWeight:700, flexShrink:0, alignSelf:"center", background:"#c8a96e18", border:"1px solid #c8a96e44", borderRadius:6, padding:"3px 10px" }}>🪙 {it.value}</div>}
                <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                  <button onClick={() => { setEditingId(it.id); setEditForm({name:it.name, description:it.description||"", value:it.value||"", image:it.image}); }} style={{...btnSecondary, fontSize:12, padding:"4px 10px"}}>✏️</button>
                  <button onClick={() => removeItem(it.id)} style={{...btnSecondary, fontSize:12, padding:"4px 10px", color:"#c06060", borderColor:"#6b1a1a"}}>🗑️</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StoryDetailPanel({ story, chars, factions, locations, onClose, onDelete, onCancelNew, onSetMain, onSetPlayerStory, onOpenChar, onOpenFaction, onOpenLocation, onUpdateStory, onAskConfirm, onCloseConfirm, artifacts, onUpdateArtifacts, onOpenArtifact, currentTimelineDate, highlightEventId, onHighlightClear, subTab: subTabProp, onSubTabChange, storyStatuses, hookStatuses, onPinHook, pinnedHookIds, rarities }) {
  const storyStatusList = storyStatuses || DEFAULT_STORY_STATUSES;
  const rarityColors = Object.fromEntries((rarities || DEFAULT_RARITIES).map(r => [r.name, r.color]));
  const storyColorMap = Object.fromEntries(storyStatusList.map(s => [s.name, s.color]));
  const [subTabInternal, setSubTabInternal] = useState("details");
  const subTab = subTabProp ?? subTabInternal;
  const setSubTab = onSubTabChange ?? setSubTabInternal;
  const [playerPicker, setPlayerPicker] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [fieldVal, setFieldVal] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [facSearch, setFacSearch] = useState("");
  const [locSearch, setLocSearch] = useState("");
  const [sectionToggles, setSectionToggles] = useState({});
  const [addingToGroup, setAddingToGroup] = useState(null);
  const [groupAddSearch, setGroupAddSearch] = useState("");
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingGroupName, setEditingGroupName] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [addingGroup, setAddingGroup] = useState(false);
  const [dragCharId, setDragCharId] = useState(null);
  const [dragOverGroupId, setDragOverGroupId] = useState(null);
  const [dragGroupId, setDragGroupId] = useState(null);
  const [dragOverGroupRowId, setDragOverGroupRowId] = useState(null);

  useEffect(() => {
    setEditingField(null); setFieldVal(""); setConfirmDelete(false);
    setFacSearch(""); setLocSearch("");
    setSectionToggles({});
    setAddingToGroup(null); setGroupAddSearch(""); setEditingGroupId(null); setNewGroupName(""); setAddingGroup(false);
  }, [story?.id]); // eslint-disable-line
  useEffect(() => { if (highlightEventId) setSubTab("timeline"); }, [highlightEventId]);
  useEffect(() => {
    const handler = e => {
      if (e.key !== "Escape") return;
      if (editingField !== null) { setEditingField(null); return; }
      if (confirmDelete) { setConfirmDelete(false); return; }
      onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [editingField, confirmDelete]); // eslint-disable-line

  if (!story) return null;

  const commit = (field, val) => { onUpdateStory({...story, [field]: val}); setEditingField(null); };
  const startEdit = (field, val) => { setEditingField(field); setFieldVal(val||""); };
  const cancelEdit = () => setEditingField(null);
  const fh = {
    onMouseEnter: e => e.currentTarget.style.background = "#ffffff0a",
    onMouseLeave: e => e.currentTarget.style.background = "transparent",
  };
  const LABEL = { fontSize:11, color:"#7c5cbf", letterSpacing:1, textTransform:"uppercase", marginBottom:8 };

  const toggleFac  = id => onUpdateStory({...story, factionIds:(story.factionIds||[]).includes(id)?(story.factionIds||[]).filter(x=>x!==id):[...(story.factionIds||[]),id]});
  const toggleLoc  = id => onUpdateStory({...story, locationIds:(story.locationIds||[]).includes(id)?(story.locationIds||[]).filter(x=>x!==id):[...(story.locationIds||[]),id]});

  const events = story.events||[];

  const saveEvent = form => {
    const newCharIds = (form.characterIds||[]).filter(id => !(story.characterIds||[]).includes(id));
    const updatedStory = newCharIds.length > 0 ? {...story, characterIds:[...(story.characterIds||[]),...newCharIds]} : story;
    const updated = form.id ? events.map(e=>e.id===form.id?form:e) : [{ ...form, id:uid() }, ...events];
    onUpdateStory({...updatedStory, events:sortEventsDesc(updated)});
  };

  const reorderEvent = (fromId, toId) => {
    if (fromId === toId) return;
    const arr = [...events];
    const from = arr.findIndex(e => e.id === fromId);
    const to = arr.findIndex(e => e.id === toId);
    if (from === -1 || to === -1) return;
    arr.splice(to, 0, arr.splice(from, 1)[0]);
    onUpdateStory({...story, events: arr});
  };

  const deleteEvent = id => {
    const ev = events.find(e=>e.id===id);
    onAskConfirm(`Delete event "${ev?.title||"this event"}"?`, () => {
      onUpdateStory({...story, events:events.filter(e=>e.id!==id)});
      onCloseConfirm();
    });
  };

  const statusColor = storyColorMap[story.status] || STATUS_COLORS[story.status] || "#3a2a5a";
  const headerBg = `linear-gradient(90deg,${statusColor} 0%,#13101f 60%)`;

  const charGroups = story.charGroups || [];
  const charGroupAssignments = story.charGroupAssignments || {};
  const linkedCharIds = story.characterIds || [];
  const linkedCharsAll = chars.filter(c => linkedCharIds.includes(c.id));
  const linkedChars = linkedCharsAll;

  const addCharGroup = name => {
    const n = name.trim(); if (!n) return;
    onUpdateStory({ ...story, charGroups: [...charGroups, { id: uid(), name: n }] });
    setNewGroupName(""); setAddingGroup(false);
  };
  const deleteCharGroup = groupId => {
    const newAssign = { ...charGroupAssignments };
    Object.keys(newAssign).forEach(cid => { if (newAssign[cid] === groupId) delete newAssign[cid]; });
    onUpdateStory({ ...story, charGroups: charGroups.filter(g => g.id !== groupId), charGroupAssignments: newAssign });
  };
  const renameCharGroup = (groupId, name) => {
    onUpdateStory({ ...story, charGroups: charGroups.map(g => g.id === groupId ? {...g, name} : g) });
    setEditingGroupId(null);
  };
  const addCharToGroup = (char, groupId) => {
    const newIds = linkedCharIds.includes(char.id) ? linkedCharIds : [...linkedCharIds, char.id];
    const newAssign = { ...charGroupAssignments, [char.id]: groupId };
    onUpdateStory({ ...story, characterIds: newIds, charGroupAssignments: newAssign });
    setAddingToGroup(null); setGroupAddSearch("");
  };
  const removeCharFromStory = charId => {
    const newAssign = { ...charGroupAssignments };
    delete newAssign[charId];
    onUpdateStory({ ...story, characterIds: linkedCharIds.filter(id => id !== charId), charGroupAssignments: newAssign });
  };
  const moveGroup = (fromId, toId) => {
    if (fromId === toId) return;
    const arr = [...charGroups];
    const from = arr.findIndex(g => g.id === fromId);
    const to = arr.findIndex(g => g.id === toId);
    if (from === -1 || to === -1) return;
    arr.splice(to, 0, arr.splice(from, 1)[0]);
    onUpdateStory({ ...story, charGroups: arr });
  };
  const moveCharToGroup = (charId, groupId) => {
    const newAssign = { ...charGroupAssignments };
    if (groupId === null) delete newAssign[charId];
    else newAssign[charId] = groupId;
    onUpdateStory({ ...story, charGroupAssignments: newAssign });
  };

  const facSearchQ = facSearch.toLowerCase();
  const unlinkedFacs = (factions||[]).filter(f => !(story.factionIds||[]).includes(f.id) && (!facSearchQ || f.name.toLowerCase().includes(facSearchQ)));
  const locSearchQ = locSearch.toLowerCase();
  const unlinkedLocs = (locations||[]).filter(l => !(story.locationIds||[]).includes(l.id) && (!locSearchQ || l.name.toLowerCase().includes(locSearchQ)));

  const isSectionOpen = k => {
    if (k in sectionToggles) return sectionToggles[k];
    if (k === "characters") return (story.characterIds||[]).length > 0;
    if (k === "sideChars") return false;
    if (k === "description") return !!story.description;
    if (k === "rewards") return !!story.rewards;
    if (k === "factions") return (story.factionIds||[]).length > 0;
    if (k === "locations") return (story.locationIds||[]).length > 0;
    return true;
  };
  const toggleSection = k => setSectionToggles(t => ({...t, [k]: !isSectionOpen(k)}));

  return (
    <div style={{ background:"#13101f", border:"1px solid #7c5cbf", borderRadius:12, marginBottom:20, overflow:"visible", boxShadow:"0 4px 32px #7c5cbf22", animation:"slideDown .18s ease" }}>
      <style>{`@keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* ── Sticky header + sub-tabs wrapper ── */}
      <div style={{ position:"sticky", top:0, zIndex:10, borderRadius:"12px 12px 0 0", overflow:"hidden" }}>

      {/* ── Header ── */}
      <div style={{ background:headerBg, padding:"18px 24px", display:"flex", alignItems:"flex-start", gap:16, borderBottom:"1px solid #2a1f3d" }}>

        {/* Cover image */}
        <PortraitZone value={story.image} onChange={src=>onUpdateStory({...story,image:src})} size={80} emptyLabel="Add image"/>

        {/* Name + Summary + badges */}
        <div style={{ flex:1 }}>
          {editingField==="name"
            ? <input value={fieldVal} autoFocus
                onChange={e=>setFieldVal(e.target.value)}
                onBlur={()=>{ if(fieldVal.trim()) commit("name",fieldVal.trim()); else cancelEdit(); }}
                onKeyDown={e=>{ if(e.key==="Enter"&&fieldVal.trim()) commit("name",fieldVal.trim()); if(e.key==="Tab"){ e.preventDefault(); if(fieldVal.trim()) commit("name",fieldVal.trim()); startEdit("summary",story.summary||""); } if(e.key==="Escape") cancelEdit(); }}
                style={{...ghostInput, fontSize:20, fontFamily:"Georgia,serif", fontWeight:700, color:"#e8d5b7", marginBottom:6, display:"block", width:"100%", boxSizing:"border-box"}}/>
            : <div onClick={()=>startEdit("name",story.name||"")} {...fh} style={{ borderRadius:4, cursor:"text", marginBottom:6, display:"inline-block" }}>
                <span style={{ fontSize:22, fontFamily:"Georgia,serif", color:"#e8d5b7", fontWeight:700 }}>
                  {story.name||<span style={{ color:"#3a2a5a", fontStyle:"italic" }}>Untitled Story</span>}
                </span>
              </div>
          }
          {editingField==="summary"
            ? <input value={fieldVal} autoFocus
                onChange={e=>setFieldVal(e.target.value)}
                onBlur={()=>commit("summary",fieldVal)}
                onKeyDown={e=>{ if(e.key==="Enter"||e.key==="Tab") { e.preventDefault(); commit("summary",fieldVal); } if(e.key==="Escape") cancelEdit(); }}
                placeholder="Short summary…" style={{...ghostInput, fontSize:13, color:"#9a7fa0", fontStyle:"italic", width:"100%", boxSizing:"border-box", display:"block", marginBottom:6}}/>
            : <div onClick={()=>startEdit("summary",story.summary||"")} {...fh} style={{ borderRadius:4, cursor:"text", marginBottom:6 }}>
                {story.summary
                  ? <span style={{ color:"#9a7fa0", fontSize:13, fontStyle:"italic" }}>{story.summary}</span>
                  : <span style={{ color:"#3a2a5a", fontSize:12, fontStyle:"italic" }}>Add a summary…</span>}
              </div>
          }
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {story.isMain && <span style={{ fontSize:11, color:"#c8a96e", background:"#c8a96e22", borderRadius:4, padding:"2px 8px" }}>⭐ Main Story</span>}
            {story.playerId && <span style={{ fontSize:11, color:"#7c5cbf", background:"#7c5cbf22", borderRadius:4, padding:"2px 8px" }}>🎲 {chars.find(c=>c.id===story.playerId)?.name||"Player Story"}</span>}
          </div>
        </div>

        {/* Status + Actions */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8, flexShrink:0 }}>
          <div>
            {editingField==="status"
              ? <select value={fieldVal} autoFocus
                  onChange={e=>commit("status",e.target.value)}
                  onBlur={cancelEdit}
                  onKeyDown={e=>{ if(e.key==="Escape") cancelEdit(); }}
                  style={{...selStyle, fontSize:12, padding:"3px 8px"}}>
                  <option value="">— None —</option>
                  {storyStatusList.map(s=><option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
              : <div onClick={()=>startEdit("status",story.status||"")} style={{ borderRadius:4, cursor:"pointer" }}>
                  {story.status
                    ? <span style={{ background:statusColor, color:"#e8d5b7", borderRadius:4, padding:"3px 12px", fontSize:12, fontWeight:700, display:"inline-block" }}>{story.status}</span>
                    : <span style={{ color:"#3a2a5a", fontSize:12, fontStyle:"italic", border:"1px dashed #3a2a5a", borderRadius:4, padding:"3px 10px" }}>Set status…</span>}
                </div>
            }
          </div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", justifyContent:"flex-end" }}>
            {onSetMain && <button onClick={()=>onSetMain(story.id)} style={{...btnSecondary,fontSize:11,padding:"4px 10px",borderColor:story.isMain?"#c8a96e":"#3a2a5a",color:story.isMain?"#c8a96e":"#9a7fa0"}} title={story.isMain?"Main Story":"Set as Main"}>{story.isMain?"⭐":"☆"}</button>}
            {onSetPlayerStory && <button onClick={()=>setPlayerPicker(true)} style={{...btnSecondary,fontSize:11,padding:"4px 10px",borderColor:story.playerId?"#7c5cbf":"#3a2a5a",color:story.playerId?"#7c5cbf":"#9a7fa0"}} title="Link to Player">🎲</button>}
            {onDelete && (confirmDelete
              ? <>
                  <span style={{ fontSize:12, color:"#c8b89a", alignSelf:"center" }}>Delete?</span>
                  <button onClick={()=>{ setConfirmDelete(false); onDelete(story.id); }} style={{...btnSecondary,fontSize:12,padding:"4px 10px",color:"#c06060",borderColor:"#6b1a1a"}}>Yes</button>
                  <button onClick={()=>setConfirmDelete(false)} style={{...btnSecondary,fontSize:12,padding:"4px 10px"}}>No</button>
                </>
              : <button onClick={()=>setConfirmDelete(true)} style={{...btnSecondary,fontSize:12,padding:"4px 10px",color:"#c06060",borderColor:"#6b1a1a"}}>🗑️</button>
            )}
            <button onClick={onClose} style={{...btnSecondary,fontSize:18,padding:"2px 10px",lineHeight:1}}>×</button>
          </div>
        </div>
      </div>

      {/* ── Sub-tabs ── */}
      <div style={{ display:"flex", gap:8, padding:"12px 24px", borderBottom:"1px solid #1e1630", background:"#0f0c1a" }}>
        {[["details","📖 Details"],["items","🎒 Items"],["timeline","⏳ Timeline"],["hooks","🔮 Hooks"]].map(([id,label])=>(
          <button key={id} onClick={()=>setSubTab(id)} style={{ background:subTab===id?"#7c5cbf":"transparent", border:`1px solid ${subTab===id?"#7c5cbf":"#3a2a5a"}`, borderRadius:6, color:subTab===id?"#fff":"#9a7fa0", fontSize:12, fontWeight:600, padding:"5px 16px", cursor:"pointer", transition:"all .15s" }}>{label}</button>
        ))}
      </div>

      </div>{/* end sticky wrapper */}

      {/* ── Details tab ── */}
      {subTab==="details" && (
        <div style={{ display:"flex", flexWrap:"wrap" }}>

          {/* Characters — user-defined groups */}
          <div style={{ flex:"1 1 100%", borderBottom:"1px solid #1e1630" }}>
            <div onClick={()=>toggleSection("characters")} style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 24px", cursor:"pointer", userSelect:"none" }}
              onMouseEnter={e=>e.currentTarget.style.background="#ffffff07"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span style={{ fontSize:10, color:"#5a4a7a" }}>{isSectionOpen("characters")?"▼":"▶"}</span>
              <span style={{...LABEL, marginBottom:0}}>👥 Characters</span>
              {linkedChars.length > 0 && <span style={{ fontSize:11, color:"#5a4a7a", marginLeft:4 }}>({linkedChars.length})</span>}
              {linkedChars.length === 0 && !isSectionOpen("characters") && <span style={{ fontSize:11, color:"#3a2a5a", fontStyle:"italic", marginLeft:"auto" }}>empty</span>}
            </div>
            {isSectionOpen("characters") && <div style={{ padding:"0 24px 14px" }}>

              {/* Group rows */}
              <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:10 }}>
                {charGroups.map(group => {
                  const groupChars = linkedChars.filter(c => charGroupAssignments[c.id] === group.id);
                  const isAdding = addingToGroup === group.id;
                  const q = groupAddSearch.toLowerCase();
                  const suggestions = isAdding ? chars.filter(c => !linkedCharIds.includes(c.id) && (!q || c.name.toLowerCase().includes(q))) : [];
                  const isOver = dragOverGroupId === group.id;
                  const isRowOver = dragOverGroupRowId === group.id && dragGroupId && dragGroupId !== group.id;
                  return (
                    <div key={group.id}
                      onDragOver={e=>{ e.preventDefault(); if(dragGroupId) setDragOverGroupRowId(group.id); else setDragOverGroupId(group.id); }}
                      onDragLeave={e=>{ if(!e.currentTarget.contains(e.relatedTarget)){ setDragOverGroupId(null); setDragOverGroupRowId(null); } }}
                      onDrop={()=>{ if(dragGroupId){ moveGroup(dragGroupId, group.id); setDragGroupId(null); setDragOverGroupRowId(null); } else if(dragCharId){ moveCharToGroup(dragCharId, group.id); setDragCharId(null); setDragOverGroupId(null); } }}
                      style={{ background: isOver ? "#1a1228" : "#0d0b14", border:`1px solid ${isRowOver?"#c8a96e":isOver?"#7c5cbf":"#1e1630"}`, borderRadius:8, padding:"8px 10px", transition:"border-color .15s, background .15s", opacity: dragGroupId===group.id ? 0.4 : 1 }}>
                      {/* Row header */}
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom: groupChars.length > 0 || isAdding ? 8 : 0 }}>
                        {/* drag handle */}
                        <span draggable
                          onDragStart={e=>{ e.dataTransfer.effectAllowed="move"; setDragGroupId(group.id); }}
                          onDragEnd={()=>{ setDragGroupId(null); setDragOverGroupRowId(null); }}
                          style={{ color:"#3a2a5a", cursor:"grab", fontSize:12, lineHeight:1, flexShrink:0, userSelect:"none" }}
                          onMouseEnter={e=>e.currentTarget.style.color="#7c5cbf"} onMouseLeave={e=>e.currentTarget.style.color="#3a2a5a"}>⠿</span>
                        {editingGroupId === group.id
                          ? <input autoFocus value={editingGroupName}
                              onChange={e=>setEditingGroupName(e.target.value)}
                              onBlur={()=>renameCharGroup(group.id, editingGroupName||group.name)}
                              onKeyDown={e=>{ if(e.key==="Enter") renameCharGroup(group.id, editingGroupName||group.name); if(e.key==="Escape") setEditingGroupId(null); }}
                              style={{...ghostInput, fontSize:11, fontWeight:700, flex:1}}/>
                          : <span onClick={()=>{ setEditingGroupId(group.id); setEditingGroupName(group.name); }}
                              style={{ fontSize:11, color:"#c8a96e", fontWeight:700, letterSpacing:.5, textTransform:"uppercase", cursor:"text", flex:1 }}
                              title="Click to rename">{group.name}</span>
                        }
                        {groupChars.length > 0 && <span style={{ fontSize:10, color:"#5a4a7a" }}>({groupChars.length})</span>}
                        <button onClick={()=>deleteCharGroup(group.id)}
                          style={{ background:"none", border:"none", color:"#3a2a5a", cursor:"pointer", fontSize:12, padding:0, lineHeight:1 }}
                          onMouseEnter={e=>e.currentTarget.style.color="#c06060"} onMouseLeave={e=>e.currentTarget.style.color="#3a2a5a"}>✕</button>
                      </div>
                      {/* Cards row */}
                      <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                        {groupChars.map(c => (
                          <div key={c.id}
                            draggable
                            onDragStart={e=>{ e.dataTransfer.effectAllowed="move"; setDragCharId(c.id); }}
                            onDragEnd={()=>{ setDragCharId(null); setDragOverGroupId(null); }}
                            style={{ display:"flex", alignItems:"center", gap:6, background:"#13101f", border:"1px solid #2a1f3d", borderRadius:6, padding:"5px 8px", cursor:"grab", opacity: dragCharId===c.id ? 0.4 : 1, transition:"opacity .1s", maxWidth:220, minWidth:0 }}>
                            <Avatar src={c.image} name={c.name} size={26}/>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div onClick={()=>onOpenChar?.(c)} style={{ fontSize:12, color:"#c8a96e", fontWeight:600, cursor:"pointer", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}
                                onMouseEnter={e=>e.currentTarget.style.textDecoration="underline"} onMouseLeave={e=>e.currentTarget.style.textDecoration="none"}>
                                {c.type==="player"?"🎲":c.type==="main"?"⭐":"👤"} {c.name}
                              </div>
                              {c.shortDescription && <div style={{ fontSize:10, color:"#5a4a7a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.shortDescription}</div>}
                            </div>
                            <button onClick={()=>removeCharFromStory(c.id)}
                              style={{ background:"none", border:"none", color:"#5a4a7a", cursor:"pointer", fontSize:13, padding:0, lineHeight:1, flexShrink:0 }}
                              onMouseEnter={e=>e.currentTarget.style.color="#c06060"} onMouseLeave={e=>e.currentTarget.style.color="#5a4a7a"}>×</button>
                          </div>
                        ))}
                        {/* [+] add box */}
                        {!isAdding && (
                          <div onClick={()=>{ setAddingToGroup(group.id); setGroupAddSearch(""); }}
                            style={{ display:"flex", alignItems:"center", justifyContent:"center", width:80, height:42, border:"2px dashed #2a1f3d", borderRadius:6, cursor:"pointer", color:"#2a1f3d", fontSize:18, flexShrink:0, transition:"border-color .15s, color .15s" }}
                            onMouseEnter={e=>{ e.currentTarget.style.borderColor="#7c5cbf"; e.currentTarget.style.color="#7c5cbf"; }}
                            onMouseLeave={e=>{ e.currentTarget.style.borderColor="#2a1f3d"; e.currentTarget.style.color="#2a1f3d"; }}>+</div>
                        )}
                        {/* inline search when adding */}
                        {isAdding && (
                          <div style={{ position:"relative", minWidth:140 }}>
                            <input autoFocus value={groupAddSearch} onChange={e=>setGroupAddSearch(e.target.value)}
                              onKeyDown={e=>{ if(e.key==="Escape"){ setAddingToGroup(null); setGroupAddSearch(""); } }}
                              onBlur={e=>{ if(!e.currentTarget.parentElement?.contains(e.relatedTarget)){ setAddingToGroup(null); setGroupAddSearch(""); } }}
                              placeholder="Search…"
                              style={{...inputStyle, fontSize:12, padding:"5px 8px"}}/>
                            {suggestions.length > 0 && (
                              <div style={{ position:"absolute", top:"100%", left:0, right:0, zIndex:20, background:"#1a1228", border:"1px solid #3a2a5a", borderRadius:8, maxHeight:160, overflowY:"auto", marginTop:4, boxShadow:"0 4px 16px #00000066" }}>
                                {suggestions.map(c=>(
                                  <div key={c.id} onMouseDown={e=>{ e.preventDefault(); addCharToGroup(c, group.id); }}
                                    style={{ display:"flex", alignItems:"center", gap:7, padding:"7px 8px", cursor:"pointer", borderBottom:"1px solid #1e1630" }}
                                    onMouseEnter={e=>e.currentTarget.style.background="#1e1630"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                                    <Avatar src={c.image} name={c.name} size={22}/>
                                    <span style={{ fontSize:12, color:"#e8d5b7", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Unassigned row */}
                {linkedChars.filter(c=>!charGroupAssignments[c.id]).length > 0 && (
                  <div
                    onDragOver={e=>{ e.preventDefault(); setDragOverGroupId("__unassigned__"); }}
                    onDragLeave={e=>{ if(!e.currentTarget.contains(e.relatedTarget)) setDragOverGroupId(null); }}
                    onDrop={()=>{ if(dragCharId){ moveCharToGroup(dragCharId, null); setDragCharId(null); setDragOverGroupId(null); } }}
                    style={{ background: dragOverGroupId==="__unassigned__" ? "#1a1228" : "transparent", border:`1px dashed ${dragOverGroupId==="__unassigned__"?"#5a4a7a":"#2a1f3d"}`, borderRadius:8, padding:"8px 10px", transition:"border-color .15s, background .15s" }}>
                    <div style={{ fontSize:11, color:"#3a2a5a", fontWeight:700, letterSpacing:.5, textTransform:"uppercase", marginBottom:8 }}>Unassigned</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                      {linkedChars.filter(c=>!charGroupAssignments[c.id]).map(c=>(
                        <div key={c.id}
                          draggable
                          onDragStart={e=>{ e.dataTransfer.effectAllowed="move"; setDragCharId(c.id); }}
                          onDragEnd={()=>{ setDragCharId(null); setDragOverGroupId(null); }}
                          style={{ display:"flex", alignItems:"center", gap:6, background:"#13101f", border:"1px solid #2a1f3d", borderRadius:6, padding:"5px 8px", cursor:"grab", opacity: dragCharId===c.id ? 0.4 : 1, transition:"opacity .1s", maxWidth:220, minWidth:0 }}>
                          <Avatar src={c.image} name={c.name} size={26}/>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div onClick={()=>onOpenChar?.(c)} style={{ fontSize:12, color:"#c8a96e", fontWeight:600, cursor:"pointer", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}
                              onMouseEnter={e=>e.currentTarget.style.textDecoration="underline"} onMouseLeave={e=>e.currentTarget.style.textDecoration="none"}>
                              {c.type==="player"?"🎲":c.type==="main"?"⭐":"👤"} {c.name}
                            </div>
                            {c.shortDescription && <div style={{ fontSize:10, color:"#5a4a7a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.shortDescription}</div>}
                          </div>
                          <button onClick={()=>removeCharFromStory(c.id)}
                            style={{ background:"none", border:"none", color:"#5a4a7a", cursor:"pointer", fontSize:13, padding:0, lineHeight:1, flexShrink:0 }}
                            onMouseEnter={e=>e.currentTarget.style.color="#c06060"} onMouseLeave={e=>e.currentTarget.style.color="#5a4a7a"}>×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Add group */}
              {addingGroup
                ? <div style={{ display:"flex", gap:8, marginTop:4 }}>
                    <input autoFocus value={newGroupName} onChange={e=>setNewGroupName(e.target.value)}
                      onKeyDown={e=>{ if(e.key==="Enter") addCharGroup(newGroupName); if(e.key==="Escape"){ setAddingGroup(false); setNewGroupName(""); } }}
                      placeholder="Group name…" style={{...inputStyle, flex:1, fontSize:12, padding:"5px 10px"}}/>
                    <button onClick={()=>addCharGroup(newGroupName)} disabled={!newGroupName.trim()} style={{...btnPrimary, fontSize:12, padding:"5px 12px"}}>Add</button>
                    <button onClick={()=>{ setAddingGroup(false); setNewGroupName(""); }} style={{...btnSecondary, fontSize:12, padding:"5px 10px"}}>✕</button>
                  </div>
                : <button onClick={()=>setAddingGroup(true)} style={{...btnSecondary, fontSize:11, padding:"4px 12px", marginTop:4}}>+ Add Group</button>
              }
            </div>}
          </div>

          {/* Description */}
          <div style={{ flex:"1 1 55%", borderRight:"1px solid #1e1630", borderBottom:"1px solid #1e1630" }}>
            <div onClick={()=>toggleSection("description")} style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 24px", cursor:"pointer", userSelect:"none" }}
              onMouseEnter={e=>e.currentTarget.style.background="#ffffff07"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span style={{ fontSize:10, color:"#5a4a7a" }}>{isSectionOpen("description")?"▼":"▶"}</span>
              <span style={{...LABEL, marginBottom:0}}>📖 Description</span>
              {!story.description && !isSectionOpen("description") && <span style={{ fontSize:11, color:"#3a2a5a", fontStyle:"italic", marginLeft:"auto" }}>empty</span>}
            </div>
            {isSectionOpen("description") && <div style={{ padding:"0 24px 14px" }}>
              {editingField==="description"
                ? <textarea value={fieldVal} autoFocus
                    ref={el=>{ if(el){ el.style.height="auto"; el.style.height=el.scrollHeight+"px"; } }}
                    onChange={e=>setFieldVal(e.target.value)}
                    onInput={e=>{ e.target.style.height="auto"; e.target.style.height=e.target.scrollHeight+"px"; }}
                    onBlur={()=>commit("description",fieldVal)}
                    onKeyDown={e=>{ if(e.key==="Escape") commit("description",fieldVal); }}
                    style={ghostTextarea}/>
                : <div onClick={()=>startEdit("description",story.description||"")} {...fh} style={{ borderRadius:4, cursor:"text", minHeight:60, padding:"4px 2px" }}>
                    {story.description
                      ? <div style={{ color:"#b09080", fontSize:14, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{story.description}</div>
                      : <span style={{ color:"#3a2a5a", fontSize:13, fontStyle:"italic" }}>Click to add description…</span>}
                  </div>
              }
            </div>}
          </div>

          {/* Rewards / Stakes */}
          <div style={{ flex:"1 1 35%", borderBottom:"1px solid #1e1630" }}>
            <div onClick={()=>toggleSection("rewards")} style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 24px", cursor:"pointer", userSelect:"none" }}
              onMouseEnter={e=>e.currentTarget.style.background="#ffffff07"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span style={{ fontSize:10, color:"#5a4a7a" }}>{isSectionOpen("rewards")?"▼":"▶"}</span>
              <span style={{...LABEL, marginBottom:0}}>⚖️ Rewards / Stakes</span>
              {!story.rewards && !isSectionOpen("rewards") && <span style={{ fontSize:11, color:"#3a2a5a", fontStyle:"italic", marginLeft:"auto" }}>empty</span>}
            </div>
            {isSectionOpen("rewards") && <div style={{ padding:"0 24px 14px" }}>
              {editingField==="rewards"
                ? <textarea value={fieldVal} autoFocus
                    ref={el=>{ if(el){ el.style.height="auto"; el.style.height=el.scrollHeight+"px"; } }}
                    onChange={e=>setFieldVal(e.target.value)}
                    onInput={e=>{ e.target.style.height="auto"; e.target.style.height=e.target.scrollHeight+"px"; }}
                    onBlur={()=>commit("rewards",fieldVal)}
                    onKeyDown={e=>{ if(e.key==="Escape") commit("rewards",fieldVal); }}
                    style={ghostTextarea}/>
                : <div onClick={()=>startEdit("rewards",story.rewards||"")} {...fh} style={{ borderRadius:4, cursor:"text", minHeight:60, padding:"4px 2px" }}>
                    {story.rewards
                      ? <div style={{ color:"#b09080", fontSize:14, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{story.rewards}</div>
                      : <span style={{ color:"#3a2a5a", fontSize:13, fontStyle:"italic" }}>Click to add rewards/stakes…</span>}
                  </div>
              }
            </div>}
          </div>

          {/* Factions */}
          <div style={{ flex:"1 1 50%", borderRight:"1px solid #1e1630", borderBottom:"1px solid #1e1630" }}>
            <div onClick={()=>toggleSection("factions")} style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 24px", cursor:"pointer", userSelect:"none" }}
              onMouseEnter={e=>e.currentTarget.style.background="#ffffff07"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span style={{ fontSize:10, color:"#5a4a7a" }}>{isSectionOpen("factions")?"▼":"▶"}</span>
              <span style={{...LABEL, marginBottom:0}}>⚑ Factions Involved</span>
              {(story.factionIds||[]).length === 0 && !isSectionOpen("factions") && <span style={{ fontSize:11, color:"#3a2a5a", fontStyle:"italic", marginLeft:"auto" }}>empty</span>}
            </div>
            {isSectionOpen("factions") && <div style={{ padding:"0 24px 14px" }}>
              {(story.factionIds||[]).length > 0 && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:8 }}>
                  {(story.factionIds||[]).map(fid=>{ const f=(factions||[]).find(x=>x.id===fid); return f
                    ? <div key={fid} style={{ display:"flex", alignItems:"center", gap:4, background:"#5a3da022", border:"1px solid #5a3da066", borderRadius:6, padding:"2px 6px 2px 8px" }}>
                        <span onClick={()=>onOpenFaction?.(f)} style={{ fontSize:12, color:"#c8a96e", cursor:"pointer" }}
                          onMouseEnter={e=>e.currentTarget.style.textDecoration="underline"} onMouseLeave={e=>e.currentTarget.style.textDecoration="none"}>{f.name}</span>
                        <button onClick={()=>toggleFac(fid)} style={{ background:"none", border:"none", color:"#5a4a7a", cursor:"pointer", fontSize:13, padding:"0 2px", lineHeight:1 }}
                          onMouseEnter={e=>e.currentTarget.style.color="#c06060"} onMouseLeave={e=>e.currentTarget.style.color="#5a4a7a"}>×</button>
                      </div>
                    : null; })}
                </div>
              )}
              <div style={{ position:"relative", marginBottom: facSearch ? 6 : 0 }}>
                <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#5a4a7a", fontSize:12 }}>🔍</span>
                <input placeholder="Add faction…" value={facSearch} onChange={e=>setFacSearch(e.target.value)}
                  onKeyDown={e=>{ if(e.key==="Escape") setFacSearch(""); }}
                  style={{ ...inputStyle, paddingLeft:28, fontSize:12 }}/>
              </div>
              {facSearch && (
                <div style={{ maxHeight:120, overflowY:"auto", border:"1px solid #2a1f3d", borderRadius:8 }}>
                  {unlinkedFacs.length===0
                    ? <div style={{ padding:"8px 12px", color:"#5a4a7a", fontSize:12 }}>No factions found.</div>
                    : unlinkedFacs.map(f=>(
                        <div key={f.id} onClick={()=>{ toggleFac(f.id); setFacSearch(""); }}
                          style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 10px", cursor:"pointer", borderBottom:"1px solid #1e1630", fontSize:12, color:"#e8d5b7" }}
                          onMouseEnter={e=>e.currentTarget.style.background="#1e1630"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          <span style={{ flex:1 }}>{f.name}</span>
                          <span style={{ color:"#7c5cbf" }}>+ Add</span>
                        </div>
                      ))
                  }
                </div>
              )}
            </div>}
          </div>

          {/* Locations */}
          <div style={{ flex:"1 1 50%", borderBottom:"1px solid #1e1630" }}>
            <div onClick={()=>toggleSection("locations")} style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 24px", cursor:"pointer", userSelect:"none" }}
              onMouseEnter={e=>e.currentTarget.style.background="#ffffff07"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span style={{ fontSize:10, color:"#5a4a7a" }}>{isSectionOpen("locations")?"▼":"▶"}</span>
              <span style={{...LABEL, marginBottom:0}}>📍 Locations</span>
              {(story.locationIds||[]).length === 0 && !isSectionOpen("locations") && <span style={{ fontSize:11, color:"#3a2a5a", fontStyle:"italic", marginLeft:"auto" }}>empty</span>}
            </div>
            {isSectionOpen("locations") && <div style={{ padding:"0 24px 14px" }}>
              {(story.locationIds||[]).length > 0 && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:8 }}>
                  {(story.locationIds||[]).map(lid=>{ const l=(locations||[]).find(x=>x.id===lid); return l
                    ? <div key={lid} style={{ display:"flex", alignItems:"center", gap:4, background:"#1a4a6b22", border:"1px solid #1a4a6b66", borderRadius:6, padding:"2px 6px 2px 8px" }}>
                        <span onClick={()=>onOpenLocation?.(l)} style={{ fontSize:12, color:"#c8a96e", cursor:"pointer" }}
                          onMouseEnter={e=>e.currentTarget.style.textDecoration="underline"} onMouseLeave={e=>e.currentTarget.style.textDecoration="none"}>{l.region?`${l.name} (${l.region})`:l.name}</span>
                        <button onClick={()=>toggleLoc(lid)} style={{ background:"none", border:"none", color:"#5a4a7a", cursor:"pointer", fontSize:13, padding:"0 2px", lineHeight:1 }}
                          onMouseEnter={e=>e.currentTarget.style.color="#c06060"} onMouseLeave={e=>e.currentTarget.style.color="#5a4a7a"}>×</button>
                      </div>
                    : null; })}
                </div>
              )}
              <div style={{ position:"relative", marginBottom: locSearch ? 6 : 0 }}>
                <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#5a4a7a", fontSize:12 }}>🔍</span>
                <input placeholder="Add location…" value={locSearch} onChange={e=>setLocSearch(e.target.value)}
                  onKeyDown={e=>{ if(e.key==="Escape") setLocSearch(""); }}
                  style={{ ...inputStyle, paddingLeft:28, fontSize:12 }}/>
              </div>
              {locSearch && (
                <div style={{ maxHeight:120, overflowY:"auto", border:"1px solid #2a1f3d", borderRadius:8 }}>
                  {unlinkedLocs.length===0
                    ? <div style={{ padding:"8px 12px", color:"#5a4a7a", fontSize:12 }}>No locations found.</div>
                    : unlinkedLocs.map(l=>(
                        <div key={l.id} onClick={()=>{ toggleLoc(l.id); setLocSearch(""); }}
                          style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 10px", cursor:"pointer", borderBottom:"1px solid #1e1630", fontSize:12, color:"#e8d5b7" }}
                          onMouseEnter={e=>e.currentTarget.style.background="#1e1630"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          <span style={{ flex:1 }}>{l.region?`${l.name} (${l.region})`:l.name}</span>
                          <span style={{ color:"#7c5cbf" }}>+ Add</span>
                        </div>
                      ))
                  }
                </div>
              )}
            </div>}
          </div>

        </div>
      )}

      {subTab==="items" && <LootTab story={story} onUpdateStory={onUpdateStory} artifacts={artifacts||[]} onUpdateArtifacts={onUpdateArtifacts} chars={chars} onOpenChar={onOpenChar} onOpenArtifact={onOpenArtifact}/>}
      {subTab==="hooks" && <HooksTab story={story} onUpdateStory={onUpdateStory} hookStatuses={hookStatuses} onPinHook={onPinHook} pinnedHookIds={pinnedHookIds}/>}
      {subTab==="timeline" && (
        <div style={{ padding:"16px 24px" }}>
          <Timeline events={events} chars={chars}
            onSaveEvent={saveEvent} onDelete={deleteEvent} onOpenChar={onOpenChar} onReorder={reorderEvent}
            currentTimelineDate={currentTimelineDate}
            highlightEventId={highlightEventId} onHighlightClear={onHighlightClear}/>
        </div>
      )}
      {playerPicker&&(
        <div onClick={()=>setPlayerPicker(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.78)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"#1a1228", border:"1px solid #7c5cbf", borderRadius:12, padding:24, width:360, maxHeight:"70vh", overflowY:"auto", boxShadow:"0 0 40px #7c5cbf44" }}>
            <h3 style={{ color:"#e8d5b7", margin:"0 0 16px", fontFamily:"Georgia,serif", fontSize:17 }}>🎲 Link to Player</h3>
            {chars.filter(c=>c.type==="player").length===0
              ? <div style={{ color:"#5a4a7a", fontSize:13, textAlign:"center", padding:"20px 0" }}>No player characters found.</div>
              : <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
                  {chars.filter(c=>c.type==="player").map(p=>(
                    <div key={p.id} onClick={()=>{ onSetPlayerStory(story.id, p.id); setPlayerPicker(false); }}
                      style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:8, background:story.playerId===p.id?"#2a1f50":"#13101f", border:`1px solid ${story.playerId===p.id?"#7c5cbf":"#2a1f3d"}`, cursor:"pointer", transition:"border-color .12s" }}
                      onMouseEnter={e=>e.currentTarget.style.borderColor="#7c5cbf"}
                      onMouseLeave={e=>e.currentTarget.style.borderColor=story.playerId===p.id?"#7c5cbf":"#2a1f3d"}>
                      <Avatar src={p.image} name={p.name} size={30}/>
                      <span style={{ fontSize:14, color:"#e8d5b7", fontWeight:600, flex:1 }}>{p.name}</span>
                      {story.playerId===p.id&&<span style={{ fontSize:11, color:"#c8a96e" }}>✓ Linked</span>}
                    </div>
                  ))}
                </div>
            }
            {story.playerId&&<button onClick={()=>{ onSetPlayerStory(story.id,""); setPlayerPicker(false); }} style={{ width:"100%", background:"transparent", border:"1px solid #6b1a1a", borderRadius:6, color:"#c06060", padding:"8px", cursor:"pointer", fontSize:13, marginBottom:8 }}>Remove player link</button>}
            <button onClick={()=>setPlayerPicker(false)} style={{ width:"100%", background:"transparent", border:"1px solid #3a2a5a", borderRadius:6, color:"#9a7fa0", padding:"8px", cursor:"pointer", fontSize:13 }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(StoryDetailPanel);
