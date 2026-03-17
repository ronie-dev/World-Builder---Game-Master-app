import { useState, useEffect, memo } from "react";
import ImageUploadZone from "./ImageUploadZone.jsx";
import { inputStyle, selStyle, btnPrimary, btnSecondary, STORY_STATUSES, STATUS_COLORS, DEFAULT_STORY_STATUSES, DEFAULT_HOOK_STATUSES, defaultEvent, RARITY_COLORS } from "../constants.js";
import { uid, sortEventsDesc } from "../utils.jsx";
import Avatar from "./Avatar.jsx";
import Badge from "./Badge.jsx";
import LinkBadge from "./LinkBadge.jsx";
import CharLinker from "./CharLinker.jsx";
import FactionDropdown from "./FactionDropdown.jsx";
import LocationDropdown from "./LocationDropdown.jsx";
import Timeline from "./Timeline.jsx";
import EventModal from "./EventModal.jsx";

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
              const rc = RARITY_COLORS[a.rarity] || "#9a9a9a";
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

function StoryDetailPanel({ story, chars, factions, locations, onClose, onDelete, onSetMain, onSetPlayerStory, onOpenChar, onOpenFaction, onOpenLocation, onUpdateStory, onAskConfirm, onCloseConfirm, artifacts, onUpdateArtifacts, onOpenArtifact, currentTimelineDate, highlightEventId, onHighlightClear, subTab: subTabProp, onSubTabChange, storyStatuses, hookStatuses, onPinHook, pinnedHookIds }) {
  const storyStatusList = storyStatuses || DEFAULT_STORY_STATUSES;
  const storyColorMap = Object.fromEntries(storyStatusList.map(s => [s.name, s.color]));
  const [eventModal, setEventModal] = useState(null);
  const [subTabInternal, setSubTabInternal] = useState("details");
  const subTab = subTabProp ?? subTabInternal;
  const setSubTab = onSubTabChange ?? setSubTabInternal;
  const [sideOpen, setSideOpen] = useState(false);
  const [playerPicker, setPlayerPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({...story});

  useEffect(() => { setIsEditing(false); setEditForm({...story}); }, [story?.id]);
  useEffect(() => { if (highlightEventId) setSubTab("timeline"); }, [highlightEventId]);

  if (!story) return null;

  const set = (k, v) => setEditForm(f => ({...f, [k]:v}));
  const handleSave = () => { onUpdateStory(editForm); setIsEditing(false); };
  const handleCancelEdit = () => { setIsEditing(false); setEditForm({...story}); };

  const linkedChars = chars.filter(c=>story.characterIds.includes(c.id));
  const events = story.events||[];

  const saveEvent = form => {
    const newCharIds = (form.characterIds||[]).filter(id => !(story.characterIds||[]).includes(id));
    const updatedStory = newCharIds.length > 0 ? {...story, characterIds:[...(story.characterIds||[]),...newCharIds]} : story;
    const updated = form.id ? events.map(e=>e.id===form.id?form:e) : [{ ...form, id:uid() }, ...events];
    onUpdateStory({...updatedStory, events:sortEventsDesc(updated)});
    setEventModal(null);
  };

  const moveEvent = (id, dir) => {
    const ev = events.find(e => e.id === id);
    if (!ev) return;
    const key = `${ev.year||""}|${ev.month||""}|${ev.day||""}`;
    const groupIndices = events.map((e,i)=>({e,i})).filter(({e})=>`${e.year||""}|${e.month||""}|${e.day||""}`===key).map(({i})=>i);
    const pos = groupIndices.findIndex(i => events[i].id === id);
    const targetPos = dir==="up" ? pos-1 : pos+1;
    if (targetPos < 0 || targetPos >= groupIndices.length) return;
    const newEvents = [...events];
    [newEvents[groupIndices[pos]], newEvents[groupIndices[targetPos]]] = [newEvents[groupIndices[targetPos]], newEvents[groupIndices[pos]]];
    onUpdateStory({...story, events:newEvents});
  };

  const deleteEvent = id => {
    const ev = events.find(e=>e.id===id);
    onAskConfirm(`Delete event "${ev?.title||"this event"}"?`, () => {
      onUpdateStory({...story, events:events.filter(e=>e.id!==id)});
      onCloseConfirm();
    });
  };

  const headerBg = `linear-gradient(90deg,${storyColorMap[story.status]||STATUS_COLORS[story.status]||"#1a1228"}aa,#13101f)`;

  return (
    <div style={{ background:"#13101f", border:"1px solid #7c5cbf", borderRadius:12, marginBottom:20, overflow:"hidden", boxShadow:"0 4px 32px #7c5cbf22", animation:"slideDown .18s ease" }}>
      <style>{`@keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ background:headerBg, padding:"18px 24px", display:"flex", alignItems:"flex-start", gap:16, borderBottom:"1px solid #2a1f3d" }}>
        {isEditing ? (
          <>
            <ImageUploadZone value={editForm.image} onChange={src=>set("image",src)} size="md"/>
            <div style={{ flex:1 }}>
              <input value={editForm.name} onChange={e=>set("name",e.target.value)} placeholder="Story name…"
                style={{...inputStyle, fontSize:18, fontFamily:"Georgia,serif", fontWeight:700, marginBottom:8}}/>
            </div>
            <div style={{ display:"flex", gap:8, flexShrink:0 }}>
              <button onClick={handleSave} disabled={!editForm.name.trim()} style={{...btnPrimary,fontSize:12,padding:"6px 14px"}}>💾 Save</button>
              <button onClick={handleCancelEdit} style={{...btnSecondary,fontSize:12,padding:"6px 14px"}}>Cancel</button>
              <button onClick={onClose} style={{...btnSecondary,fontSize:18,padding:"2px 10px",lineHeight:1}}>×</button>
            </div>
          </>
        ) : (
          <>
            {story.image&&<div style={{ width:"15%", aspectRatio:"1/1", borderRadius:8, overflow:"hidden", flexShrink:0, border:"1px solid #3a2a5a" }}><img src={story.image} alt={story.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/></div>}
            <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", justifyContent:"flex-end" }}>
                {story.status&&<Badge label={story.status} color={storyColorMap[story.status]||STATUS_COLORS[story.status]}/>}
                {story.isMain&&<span style={{ fontSize:13, color:"#c8a96e" }}>⭐ Main Story</span>}
                <button onClick={()=>setIsEditing(true)} style={{...btnPrimary,fontSize:12,padding:"6px 14px"}}>✏️ Edit</button>
                {onSetMain&&<button onClick={()=>onSetMain(story.id)} style={{...btnSecondary,fontSize:12,padding:"6px 14px",borderColor:story.isMain?"#c8a96e":"#3a2a5a",color:story.isMain?"#c8a96e":"#9a7fa0"}}>{story.isMain?"⭐ Main":"☆ Set Main"}</button>}
                {onSetPlayerStory&&<button onClick={()=>setPlayerPicker(true)} style={{...btnSecondary,fontSize:12,padding:"6px 14px",borderColor:story.playerId?"#7c5cbf":"#3a2a5a",color:story.playerId?"#c8a96e":"#9a7fa0"}}>🎲 {story.playerId ? (chars.find(c=>c.id===story.playerId)?.name||"Player") : "Set Player Story"}</button>}
                {onDelete&&<button onClick={()=>onDelete(story.id)} style={{...btnSecondary,fontSize:12,padding:"6px 14px",color:"#c06060",borderColor:"#6b1a1a"}}>🗑️ Delete</button>}
                <button onClick={onClose} style={{...btnSecondary,fontSize:18,padding:"2px 10px",lineHeight:1}}>×</button>
              </div>
              <span style={{ fontSize:22, fontFamily:"Georgia,serif", color:"#e8d5b7", fontWeight:700 }}>{story.name}</span>
              {story.summary&&<div style={{ color:"#9a7fa0", fontSize:14, fontStyle:"italic" }}>{story.summary}</div>}
            </div>
          </>
        )}
      </div>

      {isEditing ? (
        <div style={{ padding:"20px 24px" }}>
          <div style={{ display:"flex", gap:12, marginBottom:14 }}>
            <div style={{ flex:1 }}>
              <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Status</label>
              <select value={editForm.status||""} onChange={e=>set("status",e.target.value)} style={selStyle}>
                <option value="">— Select —</option>
                {storyStatusList.map(s=><option key={s.name}>{s.name}</option>)}
              </select>
            </div>
          </div>
          {[["Summary","summary",false],["Full Description / Notes","description",true],["Rewards / Stakes","rewards",true]].map(([label,key,textarea])=>(
            <div key={key} style={{ marginBottom:14 }}>
              <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>{label}</label>
              {textarea
                ? <textarea value={editForm[key]||""} onChange={e=>set(key,e.target.value)} rows={key==="description"?8:4} style={{...inputStyle,resize:"vertical"}}/>
                : <input value={editForm[key]||""} onChange={e=>set(key,e.target.value)} style={inputStyle}/>}
            </div>
          ))}
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:8, letterSpacing:1, textTransform:"uppercase" }}>Linked Characters</label>
            <CharLinker linkedIds={editForm.characterIds||[]} chars={chars} onChange={v=>set("characterIds",v)}/>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:8, letterSpacing:1, textTransform:"uppercase" }}>Factions Involved</label>
            <FactionDropdown factions={factions||[]} selectedIds={editForm.factionIds||[]} onChange={v=>set("factionIds",v)}/>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:8, letterSpacing:1, textTransform:"uppercase" }}>Locations</label>
            <LocationDropdown locations={locations||[]} selectedIds={editForm.locationIds||[]} onChange={v=>set("locationIds",v)}/>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={handleSave} disabled={!editForm.name.trim()} style={{...btnPrimary,flex:1}}>💾 Save Story</button>
            <button onClick={handleCancelEdit} style={{...btnSecondary,flex:1}}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display:"flex", gap:8, padding:"12px 24px", borderBottom:"1px solid #1e1630" }}>
            {[["details","📖 Details"],["items","🎒 Items"],["timeline","⏳ Timeline"],["hooks","🔮 Hooks"]].map(([id,label])=>(
              <button key={id} onClick={()=>setSubTab(id)} style={{ background:subTab===id?"#7c5cbf":"transparent", border:`1px solid ${subTab===id?"#7c5cbf":"#3a2a5a"}`, borderRadius:6, color:subTab===id?"#fff":"#9a7fa0", fontSize:12, fontWeight:600, padding:"5px 16px", cursor:"pointer", transition:"all .15s" }}>{label}</button>
            ))}
          </div>
          {subTab==="details"&&(
            <div style={{ display:"flex", flexWrap:"wrap" }}>
              <div style={{ flex:"1 1 100%", padding:"16px 24px", borderBottom:"1px solid #1e1630" }}>
                {linkedChars.length===0
                  ? <>
                      <div style={{ fontSize:11, color:"#7c5cbf", letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>👥 Characters</div>
                      <span style={{ color:"#5a4a7a", fontSize:13 }}>No characters linked.</span>
                    </>
                  : (() => {
                      const mainChars = linkedChars.filter(c=>c.type==="main"||c.type==="player");
                      const sideChars = linkedChars.filter(c=>c.type==="side");
                      const otherChars = linkedChars.filter(c=>c.type!=="main"&&c.type!=="side"&&c.type!=="player");
                      const allSide = [...sideChars, ...otherChars];
                      const renderChip = c => (
                        <div key={c.id} onClick={e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();onOpenChar(c,{newTab:true});}else{onOpenChar(c);}}} onAuxClick={e=>{if(e.button===1){e.preventDefault();onOpenChar(c,{newTab:true});}}} style={{ display:"flex", alignItems:"center", gap:8, background:"#1e1630", border:"1px solid #3a2a5a", borderRadius:8, padding:"6px 14px 6px 6px", cursor:"pointer", transition:"border-color .15s" }}
                          onMouseEnter={e=>e.currentTarget.style.borderColor="#7c5cbf"}
                          onMouseLeave={e=>e.currentTarget.style.borderColor="#3a2a5a"}>
                          <Avatar src={c.image} name={c.name} size={34}/>
                          <div><div style={{ fontSize:13, color:"#e8d5b7", fontWeight:600 }}>{c.name} <span style={{ fontSize:10, color:"#7c5cbf", opacity:.8 }}>↗</span></div><div style={{ fontSize:11, color:"#9a7fa0" }}>{(c.type==="main"||c.type==="side")&&c.shortDescription ? c.shortDescription : c.type}</div></div>
                        </div>
                      );
                      return (
                        <>
                          <div style={{ fontSize:11, color:"#7c5cbf", letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>⭐ Main Characters {mainChars.length>0&&<span style={{ opacity:.5 }}>({mainChars.length})</span>}</div>
                          {mainChars.length===0
                            ? <div style={{ color:"#3a2a5a", fontSize:13, marginBottom:12 }}>None linked.</div>
                            : <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom:allSide.length>0?16:0 }}>{mainChars.map(renderChip)}</div>}
                          {allSide.length>0&&(
                            <>
                              <div onClick={()=>setSideOpen(v=>!v)} style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", userSelect:"none", marginBottom: sideOpen?10:0 }}>
                                <span style={{ fontSize:10, color:"#5a4a7a" }}>{sideOpen?"▼":"▶"}</span>
                                <span style={{ fontSize:11, color:"#5a4a7a", letterSpacing:1, textTransform:"uppercase" }}>👤 Side Characters ({allSide.length})</span>
                              </div>
                              {sideOpen&&<div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>{allSide.map(renderChip)}</div>}
                            </>
                          )}
                        </>
                      );
                    })()
                }
              </div>
              {(story.factionIds||[]).length>0&&(
                <div style={{ flex:"1 1 100%", padding:"16px 24px", borderBottom:"1px solid #1e1630" }}>
                  <div style={{ fontSize:11, color:"#7c5cbf", letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>⚑ Factions Involved</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                    {(story.factionIds||[]).map(fid=>{ const f=(factions||[]).find(x=>x.id===fid); return f?<LinkBadge key={fid} label={f.name} color="#5a3da0" onClick={()=>onOpenFaction?.(f)} onNewTab={()=>onOpenFaction?.(f,{newTab:true})}/>:null; })}
                  </div>
                </div>
              )}
              {(story.locationIds||[]).length>0&&(
                <div style={{ flex:"1 1 100%", padding:"16px 24px", borderBottom:"1px solid #1e1630" }}>
                  <div style={{ fontSize:11, color:"#7c5cbf", letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>📍 Locations</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                    {(story.locationIds||[]).map(lid=>{ const l=(locations||[]).find(x=>x.id===lid); return l?<LinkBadge key={lid} label={l.region?`${l.name} (${l.region})`:l.name} color="#1a4a6b" onClick={()=>onOpenLocation?.(l)} onNewTab={()=>onOpenLocation?.(l,{newTab:true})}/>:null; })}
                  </div>
                </div>
              )}
              {story.description&&<div style={{ flex:"1 1 55%", padding:"16px 24px", borderRight:"1px solid #1e1630", borderBottom:"1px solid #1e1630" }}><div style={{ fontSize:11, color:"#7c5cbf", letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>📖 Description</div><div style={{ color:"#b09080", fontSize:14, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{story.description}</div></div>}
              {story.rewards&&<div style={{ flex:"1 1 35%", padding:"16px 24px", borderBottom:"1px solid #1e1630" }}><div style={{ fontSize:11, color:"#7c5cbf", letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>⚖️ Rewards / Stakes</div><div style={{ color:"#b09080", fontSize:14, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{story.rewards}</div></div>}
            </div>
          )}
          {subTab==="items"&&(
            <LootTab story={story} onUpdateStory={onUpdateStory} artifacts={artifacts||[]} onUpdateArtifacts={onUpdateArtifacts} chars={chars} onOpenChar={onOpenChar} onOpenArtifact={onOpenArtifact}/>
          )}
          {subTab==="hooks"&&(
            <HooksTab story={story} onUpdateStory={onUpdateStory} hookStatuses={hookStatuses} onPinHook={onPinHook} pinnedHookIds={pinnedHookIds}/>
          )}
          {subTab==="timeline"&&(
            <div style={{ padding:"16px 24px" }}>
              <Timeline events={events} chars={chars} onAdd={prefill=>setEventModal({...defaultEvent,...(prefill||{})})} onEdit={ev=>setEventModal({...ev})} onDelete={deleteEvent} onOpenChar={onOpenChar} onMove={moveEvent} highlightEventId={highlightEventId} onHighlightClear={onHighlightClear}/>
            </div>
          )}
        </>
      )}
      {eventModal&&<EventModal event={eventModal} chars={chars} onClose={()=>setEventModal(null)} onSave={saveEvent} currentTimelineDate={currentTimelineDate}/>}
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
