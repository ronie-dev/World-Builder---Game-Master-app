import { useState, useEffect, memo } from "react";
import ImageUploadZone from "./ImageUploadZone.jsx";
import { inputStyle, ghostTextarea, ghostInput, selStyle, btnPrimary, btnSecondary, CHAR_STATUSES, CHAR_STATUS_COLORS, STATUS_COLORS, RELATIONSHIP_COLORS, RARITY_COLORS } from "../constants.js";
import { getRaceLabel, getFactionColor, uid, formatEventDate, sortEventsDesc } from "../utils.jsx";
import Avatar from "./Avatar.jsx";
import LinkBadge from "./LinkBadge.jsx";
import FilesPanel from "./FilesPanel.jsx";
import RelationshipLinker from "./RelationshipLinker.jsx";
import Lightbox from "./Lightbox.jsx";
import PortraitZone from "./PortraitZone.jsx";

// ── Faction Role Row ───────────────────────────────────────────────────────────
function FactionRoleRow({ entry, i, allFactions, entries, setEntries, onSaveFaction, onOpenFaction }) {
  const [addingRole, setAddingRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [factionSearch, setFactionSearch] = useState("");
  const [factionOpen, setFactionOpen] = useState(false);
  const [editing, setEditing] = useState(!entry.factionId);

  const faction = allFactions.find(f => f.id === entry.factionId);
  const tiers = faction?.tiers || [];

  const updateEntries = patch => {
    const updated = [...entries];
    updated[i] = { ...entry, ...patch };
    setEntries(updated);
  };

  const handleFactionChange = val => {
    updateEntries({ factionId: val, tierId: "", role: "" });
    setAddingRole(false);
    setNewRoleName("");
    setFactionOpen(false);
    setFactionSearch("");
  };

  const handleTierChange = val => {
    if (val === "__new__") { setAddingRole(true); return; }
    const tier = tiers.find(t => t.id === val);
    updateEntries({ tierId: val, role: tier?.name || "" });
    setEditing(false);
  };

  const confirmNewRole = () => {
    const n = newRoleName.trim();
    if (!n || !faction) return;
    const newTier = { id: uid(), name: n };
    onSaveFaction({ ...faction, tiers: [...tiers, newTier] });
    updateEntries({ tierId: newTier.id, role: n });
    setNewRoleName("");
    setAddingRole(false);
    setEditing(false);
  };

  const filteredFactions = allFactions.filter(f =>
    !factionSearch || f.name.toLowerCase().includes(factionSearch.toLowerCase())
  );

  // ── Compact pill (faction already chosen, not editing) ──────────────────────
  if (faction && !editing) {
    const fcolor = getFactionColor(allFactions, entry.factionId);
    return (
      <div style={{ display:"flex", alignItems:"center", gap:8, background:"#0f0c1a", border:"1px solid #2a1f3d", borderRadius:8, padding:"8px 12px", marginBottom:6 }}>
        <span style={{ color:fcolor||"#7c5cbf", fontSize:16, flexShrink:0 }}>⚑</span>
        <span
          onClick={()=>onOpenFaction&&onOpenFaction(faction)}
          style={{ fontSize:14, color:onOpenFaction?"#c8a96e":"#e8d5b7", flex:1, cursor:onOpenFaction?"pointer":"default", fontWeight:600 }}
          onMouseEnter={e=>{ if(onOpenFaction) e.currentTarget.style.textDecoration="underline"; }}
          onMouseLeave={e=>{ e.currentTarget.style.textDecoration="none"; }}>
          {faction.name}
        </span>
        {entry.role
          ? <span style={{ fontSize:12, color:"#9a7fa0", background:"#1a1228", borderRadius:4, padding:"2px 10px", flexShrink:0 }}>{entry.role}</span>
          : <span style={{ fontSize:12, color:"#5a4a7a", fontStyle:"italic", flexShrink:0 }}>No role</span>}
        <button onClick={()=>setEditing(true)} title="Edit"
          style={{ background:"none", border:"none", color:"#7c5cbf", cursor:"pointer", fontSize:12, padding:"0 4px", opacity:.7, flexShrink:0 }}>✏️</button>
        <button onClick={()=>setEntries(entries.filter((_,j)=>j!==i))}
          style={{ background:"none", border:"none", color:"#c06060", cursor:"pointer", fontSize:16, padding:"0 2px", lineHeight:1, flexShrink:0 }}>×</button>
      </div>
    );
  }

  // ── Edit mode: full dropdowns ───────────────────────────────────────────────
  return (
    <div style={{ display:"flex", gap:6, marginBottom:8, alignItems:"flex-start", flexWrap:"wrap" }}>
      {/* Faction searchable dropdown */}
      <div style={{ flex:"1 1 140px", position:"relative", minWidth:120 }}>
        <div onClick={()=>setFactionOpen(o=>!o)}
          style={{ ...selStyle, display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", userSelect:"none" }}>
          <span style={{ color: faction ? "#e8d5b7" : "#5a4a7a" }}>{faction ? faction.name : "— Select Faction —"}</span>
          <span style={{ fontSize:10, color:"#5a4a7a" }}>{factionOpen ? "▲" : "▼"}</span>
        </div>
        {factionOpen && (
          <div style={{ position:"absolute", top:"100%", left:0, right:0, zIndex:50, background:"#1a1228", border:"1px solid #3a2a5a", borderRadius:8, marginTop:2, boxShadow:"0 4px 20px #00000088" }}>
            <div style={{ padding:"6px 8px", borderBottom:"1px solid #2a1f3d" }}>
              <input autoFocus value={factionSearch} onChange={e=>setFactionSearch(e.target.value)}
                placeholder="Search factions…" style={{...inputStyle, fontSize:12, padding:"4px 8px", width:"100%"}}
                onClick={e=>e.stopPropagation()}/>
            </div>
            <div style={{ maxHeight:160, overflowY:"auto" }}>
              <div onClick={()=>handleFactionChange("")}
                style={{ padding:"7px 12px", cursor:"pointer", fontSize:13, color:"#5a4a7a", borderBottom:"1px solid #1e1630" }}
                onMouseEnter={e=>e.currentTarget.style.background="#2a1f3d"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                — None —
              </div>
              {filteredFactions.map(f => (
                <div key={f.id} onClick={()=>handleFactionChange(f.id)}
                  style={{ padding:"7px 12px", cursor:"pointer", fontSize:13, color: entry.factionId===f.id?"#c8a96e":"#e8d5b7", background: entry.factionId===f.id?"#2a1f50":"transparent", borderBottom:"1px solid #1e1630" }}
                  onMouseEnter={e=>{ if(entry.factionId!==f.id) e.currentTarget.style.background="#1e1630"; }}
                  onMouseLeave={e=>{ if(entry.factionId!==f.id) e.currentTarget.style.background="transparent"; }}>
                  {f.name}
                </div>
              ))}
              {filteredFactions.length === 0 && <div style={{ padding:"8px 12px", color:"#5a4a7a", fontSize:12 }}>No factions found</div>}
            </div>
          </div>
        )}
      </div>

      {/* Role / tier selector */}
      {entry.factionId && (
        addingRole ? (
          <div style={{ display:"flex", gap:4, flex:"0 0 200px" }}>
            <input value={newRoleName} onChange={e=>setNewRoleName(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter") confirmNewRole(); if(e.key==="Escape") setAddingRole(false); }}
              autoFocus placeholder="New role name…" style={{...inputStyle,flex:1,fontSize:12,padding:"4px 8px"}}/>
            <button onClick={confirmNewRole} style={{...btnPrimary,fontSize:11,padding:"3px 8px"}}>✓</button>
            <button onClick={()=>{ setAddingRole(false); setNewRoleName(""); }} style={{...btnSecondary,fontSize:11,padding:"3px 6px"}}>✕</button>
          </div>
        ) : (
          <select value={entry.tierId||""} onChange={e=>handleTierChange(e.target.value)} style={{...selStyle,flex:"0 0 140px"}}>
            <option value="">— Select Role —</option>
            {tiers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
            <option value="__new__">➕ New role…</option>
          </select>
        )
      )}

      <div style={{ display:"flex", gap:4 }}>
        {faction && <button onClick={()=>setEditing(false)} style={{...btnSecondary,fontSize:11,padding:"4px 8px"}}>Done</button>}
        <button onClick={()=>setEntries(entries.filter((_,j)=>j!==i))} style={{...btnSecondary,padding:"0 10px",color:"#c06060",flexShrink:0}}>✕</button>
      </div>
    </div>
  );
}

// ── Char Hooks Tab ─────────────────────────────────────────────────────────────
const DEFAULT_HOOK_STATUSES = [
  { name:"Potential", color:"#7c5cbf" },
  { name:"Active", color:"#4a9a6a" },
  { name:"Resolved", color:"#9a7fa0" },
  { name:"Abandoned", color:"#6a4a4a" },
];

function CharHooksTab({ char, onUpdateChar, hookStatuses, onPinHook, pinnedHookIds }) {
  const statuses = hookStatuses || DEFAULT_HOOK_STATUSES;
  const colorMap = Object.fromEntries(statuses.map(s => [s.name, s.color]));
  const defaultStatus = statuses[0]?.name || "Potential";
  const [addingNew, setAddingNew] = useState(false);
  const [newForm, setNewForm] = useState({ title:"", description:"", status:defaultStatus });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const hooks = char.hooks || [];

  const saveNew = () => {
    if (!newForm.title.trim()) return;
    onUpdateChar({ ...char, hooks: [...hooks, { ...newForm, id: uid() }] });
    setNewForm({ title:"", description:"", status: defaultStatus });
    setAddingNew(false);
  };
  const saveEdit = () => {
    onUpdateChar({ ...char, hooks: hooks.map(h => h.id === editingId ? { ...h, ...editForm } : h) });
    setEditingId(null);
  };
  const removeHook = id => onUpdateChar({ ...char, hooks: hooks.filter(h => h.id !== id) });

  return (
    <div style={{ padding:"16px 24px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div style={{ fontSize:11, color:"#7c5cbf", letterSpacing:1, textTransform:"uppercase" }}>🔮 Character Hooks & Story Threads</div>
        {!addingNew && <button onClick={() => setAddingNew(true)} style={{...btnPrimary, fontSize:12, padding:"6px 14px"}}>+ Add Hook</button>}
      </div>

      {addingNew && (
        <div style={{ background:"#0f0c1a", border:"1px solid #7c5cbf", borderRadius:10, padding:16, marginBottom:14 }}>
          <input value={newForm.title} onChange={e => setNewForm(f => ({...f, title:e.target.value}))} placeholder="Hook title…" style={{...inputStyle, marginBottom:8}}/>
          <textarea value={newForm.description} onChange={e => setNewForm(f => ({...f, description:e.target.value}))} placeholder="Potential story thread, character goal, secret agenda…" rows={4} style={{...inputStyle, resize:"vertical", marginBottom:8}}/>
          <select value={newForm.status} onChange={e => setNewForm(f => ({...f, status:e.target.value}))} style={{...selStyle, marginBottom:12}}>
            {statuses.map(s => <option key={s.name}>{s.name}</option>)}
          </select>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={saveNew} disabled={!newForm.title.trim()} style={{...btnPrimary, flex:1, fontSize:12}}>Add Hook</button>
            <button onClick={() => { setAddingNew(false); setNewForm({title:"",description:"",status:defaultStatus}); }} style={{...btnSecondary, flex:1, fontSize:12}}>Cancel</button>
          </div>
        </div>
      )}

      {hooks.length === 0 && !addingNew && (
        <div style={{ textAlign:"center", padding:"40px 0", color:"#5a4a7a" }}>
          <div style={{ fontSize:36, marginBottom:10 }}>🔮</div>
          <div style={{ fontSize:14, fontFamily:"Georgia,serif" }}>No hooks yet.</div>
          <div style={{ fontSize:12, marginTop:6 }}>Add story threads, character goals, or secret agendas.</div>
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {hooks.map(h => {
          const sc = colorMap[h.status] || "#7c5cbf";
          return (
            <div key={h.id} style={{ background:"#0f0c1a", border:"1px solid #2a1f3d", borderLeft:`3px solid ${sc}`, borderRadius:10, padding:14 }}>
              {editingId === h.id ? (
                <>
                  <input value={editForm.title} onChange={e => setEditForm(f => ({...f, title:e.target.value}))} style={{...inputStyle, marginBottom:8}}/>
                  <textarea value={editForm.description||""} onChange={e => setEditForm(f => ({...f, description:e.target.value}))} rows={4} style={{...inputStyle, resize:"vertical", marginBottom:8}}/>
                  <select value={editForm.status||defaultStatus} onChange={e => setEditForm(f => ({...f, status:e.target.value}))} style={{...selStyle, marginBottom:12}}>
                    {statuses.map(s => <option key={s.name}>{s.name}</option>)}
                  </select>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={saveEdit} disabled={!editForm.title.trim()} style={{...btnPrimary, flex:1, fontSize:12}}>💾 Save</button>
                    <button onClick={() => setEditingId(null)} style={{...btnSecondary, flex:1, fontSize:12}}>Cancel</button>
                  </div>
                </>
              ) : confirmDeleteId === h.id ? (
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
                      {onPinHook && (() => { const isPinned = pinnedHookIds?.has(`${char.id}::${h.id}`); return (
                        <button onClick={() => onPinHook(char.id, h.id)} style={{...btnSecondary, fontSize:12, padding:"4px 10px", display:"flex", alignItems:"center", gap:4, color: isPinned ? "#c8a96e" : "#9a7fa0", borderColor: isPinned ? "#c8a96e66" : undefined}}>
                          📌 <span>{isPinned ? "Pinned" : "Pin to reminders"}</span>
                        </button>
                      ); })()}
                      <button onClick={() => { setEditingId(h.id); setEditForm({title:h.title, description:h.description||"", status:h.status||defaultStatus}); }} style={{...btnSecondary, fontSize:12, padding:"4px 10px"}}>✏️</button>
                      <button onClick={() => setConfirmDeleteId(h.id)} style={{...btnSecondary, fontSize:12, padding:"4px 10px", color:"#c06060", borderColor:"#6b1a1a"}}>🗑️</button>
                    </div>
                  </div>
                  {h.description && <div style={{ fontSize:13, color:"#b09080", lineHeight:1.6, whiteSpace:"pre-wrap", paddingLeft:2 }}>{h.description}</div>}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Char Timeline ─────────────────────────────────────────────────────────────
function CharTimeline({ evGroupMap, evGroupOrder, evUndated, stories, onOpenStory }) {
  const [collapsed, setCollapsed] = useState({});
  const toggle = key => setCollapsed(c => ({...c, [key]: !c[key]}));

  const renderEntry = (ev, isFirst, isLast) => {
    const isLore = ev.storyId === "__lore__";
    const story = isLore ? null : stories.find(s => s.id === ev.storyId);
    return (
      <div key={ev.id} style={{ display:"flex", gap:0, position:"relative" }}>
        {/* Rail + dot */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:32, flexShrink:0 }}>
          <div style={{ width:2, flex:1, background: isFirst ? "transparent" : "#2a1f3d" }}/>
          <div style={{ width:10, height:10, borderRadius:"50%", background:"#3a2a5a", border:"2px solid #5a4a7a", flexShrink:0 }}/>
          <div style={{ width:2, flex:1, background: isLast ? "transparent" : "#2a1f3d" }}/>
        </div>
        {/* Card */}
        <div style={{ flex:1, minWidth:0, margin:"6px 0", background:"#0f0c1a", border:"1px solid #1e1630", borderLeft:"3px solid #2a1f3d", borderRadius:8, padding:"10px 12px" }}>
          <div style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
            <div style={{ flex:1, minWidth:0 }}>
              {ev.title && <div style={{ fontSize:14, color:"#e8d5b7", fontWeight:700, fontFamily:"Georgia,serif", marginBottom:ev.description?5:0 }}>{ev.title}</div>}
              {ev.description && <div style={{ fontSize:13, color:"#9a8070", lineHeight:1.65, whiteSpace:"pre-wrap" }}>{ev.description}</div>}
            </div>
            <div style={{ flexShrink:0 }}>
              {isLore && <span style={{ fontSize:11, color:"#c8a96e", background:"#c8a96e18", border:"1px solid #c8a96e44", borderRadius:8, padding:"2px 8px" }}>📜 Lore</span>}
              {story && <LinkBadge label={story.name} color={STATUS_COLORS[story.status]||"#333"} onClick={()=>onOpenStory(story)} onNewTab={()=>onOpenStory(story,null,{newTab:true})}/>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGroup = (group, labelOverride, dimmed) => {
    const isOpen = !collapsed[group.key];
    const label = labelOverride || formatEventDate({year:group.year, month:group.month, day:group.day}) || "No date";
    return (
      <div key={group.key} style={{ marginBottom:18 }}>
        <div onClick={() => toggle(group.key)}
          style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 14px 8px 10px", background:"#1a1228", border:"1px solid #3a2a5a", borderRadius:8, cursor:"pointer", userSelect:"none" }}>
          <span style={{ fontSize:10, color:"#7c5cbf", flexShrink:0 }}>{isOpen ? "▼" : "▶"}</span>
          <span style={{ fontFamily:"Georgia,serif", fontWeight:700, fontSize:15, color: dimmed?"#6a5a8a":"#c8a96e", flex:1 }}>📅 {label}</span>
          <span style={{ fontSize:11, color:"#5a4a7a" }}>{group.events.length} event{group.events.length!==1?"s":""}</span>
        </div>
        {isOpen && (
          <div style={{ paddingLeft:14 }}>
            {group.events.map((ev, i) => renderEntry(ev, i===0, i===group.events.length-1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {evGroupOrder.map(key => renderGroup(evGroupMap[key]))}
      {evUndated.length > 0 && renderGroup(
        { key:"__undated__", year:"", month:"", day:"", events: evUndated },
        "No date set", true
      )}
    </div>
  );
}

// ── Items Tab ─────────────────────────────────────────────────────────────────
function ItemsTab({ char, onUpdateChar, artifacts, onUpdateArtifacts, onOpenArtifact }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [addingNew, setAddingNew] = useState(false);
  const [newForm, setNewForm] = useState({ name:"", description:"", value:"", image:null });
  const [lightbox, setLightbox] = useState(null);

  const items = char.items||[];

  const saveNew = () => {
    if (!newForm.name.trim()) return;
    onUpdateChar({...char, items:[...items, {...newForm, id:uid()}]});
    setNewForm({ name:"", description:"", value:"", image:null });
    setAddingNew(false);
  };

  const saveEdit = () => {
    onUpdateChar({...char, items:items.map(it=>it.id===editingId?{...it,...editForm}:it)});
    setEditingId(null);
  };

  const removeItem = id => onUpdateChar({...char, items:items.filter(it=>it.id!==id)});

  const startEdit = it => { setEditingId(it.id); setEditForm({name:it.name,description:it.description,value:it.value||"",image:it.image}); };

  return (
    <div style={{ padding:"16px 24px" }}>
      <Lightbox src={lightbox} onClose={()=>setLightbox(null)}/>
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:14 }}>
        {!addingNew&&<button onClick={()=>setAddingNew(true)} style={{...btnPrimary,fontSize:12,padding:"6px 14px"}}>+ Add Item</button>}
      </div>

      {/* New item form */}
      {addingNew&&(
        <div style={{ background:"#0f0c1a", border:"1px solid #7c5cbf", borderRadius:10, padding:16, marginBottom:14 }}>
          <div style={{ display:"flex", gap:12, marginBottom:10 }}>
            <ImageUploadZone value={newForm.image} onChange={src=>setNewForm(f=>({...f,image:src}))} size="sm"/>
            <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8 }}>
              <input value={newForm.name} onChange={e=>setNewForm(f=>({...f,name:e.target.value}))} placeholder="Item name…" style={inputStyle}/>
              <textarea value={newForm.description} onChange={e=>setNewForm(f=>({...f,description:e.target.value}))} placeholder="Short description…" rows={2} style={{...inputStyle,resize:"vertical"}}/>
              <input value={newForm.value} onChange={e=>setNewForm(f=>({...f,value:e.target.value}))} placeholder="Value (e.g. 50 gp)…" style={inputStyle}/>
            </div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={saveNew} disabled={!newForm.name.trim()} style={{...btnPrimary,flex:1,fontSize:12}}>Add Item</button>
            <button onClick={()=>{ setAddingNew(false); setNewForm({name:"",description:"",image:null}); }} style={{...btnSecondary,flex:1,fontSize:12}}>Cancel</button>
          </div>
        </div>
      )}

      {items.length===0&&!addingNew&&(
        <div style={{ textAlign:"center", padding:"40px 0", color:"#5a4a7a" }}>
          <div style={{ fontSize:36, marginBottom:10 }}>🎒</div>
          <div style={{ fontSize:14, fontFamily:"Georgia,serif" }}>No items yet.</div>
        </div>
      )}

      {/* Held Artifacts from global tracker */}
      {artifacts && artifacts.filter(a => a.holderId === char.id).length > 0 && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, color:"#c8a96e", letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>✨ Notable Artifacts</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {artifacts.filter(a => a.holderId === char.id).map(a => {
              const rc = RARITY_COLORS[a.rarity] || "#9a9a9a";
              return (
                <div key={a.id}
                  onClick={onOpenArtifact ? ()=>onOpenArtifact(a) : undefined}
                  style={{ background:"#0f0c1a", border:`1px solid ${rc}33`, borderLeft:`3px solid ${rc}`, borderRadius:10, padding:"10px 14px", display:"flex", gap:10, alignItems:"center", cursor: onOpenArtifact ? "pointer" : "default", transition:"border-color .15s" }}
                  onMouseEnter={e=>{ if(onOpenArtifact) e.currentTarget.style.borderColor=rc+"88"; }}
                  onMouseLeave={e=>{ if(onOpenArtifact) e.currentTarget.style.borderColor=rc+"33"; }}>
                  {a.image && <img src={a.image} alt="" style={{ width:40, height:40, borderRadius:6, objectFit:"cover", flexShrink:0 }}/>}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                      <span style={{ fontSize:13, color:"#e8d5b7", fontWeight:700 }}>{a.name}</span>
                      <span style={{ fontSize:9, color:rc, background:rc+"22", border:`1px solid ${rc}44`, borderRadius:8, padding:"1px 6px" }}>{a.rarity}</span>
                      {onOpenArtifact && <span style={{ fontSize:10, color:"#7c5cbf", opacity:.7 }}>↗ Items</span>}
                    </div>
                    {a.description && <div style={{ fontSize:12, color:"#b09080" }}>{a.description}</div>}
                  </div>
                  {a.value && <span style={{ fontSize:12, color:"#c8a96e", fontWeight:700, flexShrink:0 }}>🪙 {a.value}</span>}
                  <button onClick={e=>{ e.stopPropagation(); onUpdateArtifacts(artifacts.map(x => x.id===a.id ? {...x, holderId:null} : x)); }}
                    style={{...btnSecondary, fontSize:11, padding:"3px 8px", flexShrink:0}}>Unassign</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Personal inventory */}
      {items.length > 0 && <div style={{ fontSize:11, color:"#7c5cbf", letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>🎒 Inventory</div>}

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {items.map(it=>(
          <div key={it.id} style={{ background:"#0f0c1a", border:"1px solid #2a1f3d", borderRadius:10, padding:14 }}>
            {editingId===it.id ? (
              <>
                <div style={{ display:"flex", gap:12, marginBottom:10 }}>
                  <ImageUploadZone value={editForm.image} onChange={src=>setEditForm(f=>({...f,image:src}))} size="sm"/>
                  <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8 }}>
                    <input value={editForm.name} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))} style={inputStyle}/>
                    <textarea value={editForm.description||""} onChange={e=>setEditForm(f=>({...f,description:e.target.value}))} rows={2} style={{...inputStyle,resize:"vertical"}}/>
                    <input value={editForm.value||""} onChange={e=>setEditForm(f=>({...f,value:e.target.value}))} placeholder="Value (e.g. 50 gp)…" style={inputStyle}/>
                  </div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={saveEdit} disabled={!editForm.name.trim()} style={{...btnPrimary,flex:1,fontSize:12}}>💾 Save</button>
                  <button onClick={()=>setEditingId(null)} style={{...btnSecondary,flex:1,fontSize:12}}>Cancel</button>
                </div>
              </>
            ) : (
              <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                {it.image&&<img src={it.image} onClick={()=>setLightbox(it.image)} style={{ width:56, height:56, borderRadius:8, objectFit:"cover", flexShrink:0, border:"1px solid #2a1f3d", cursor:"zoom-in" }}/>}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, color:"#e8d5b7", fontWeight:700, fontFamily:"Georgia,serif", marginBottom:3 }}>{it.name}</div>
                  {it.description&&<div style={{ fontSize:13, color:"#b09080", lineHeight:1.5, whiteSpace:"pre-wrap" }}>{it.description}</div>}
                </div>
                {it.value&&<div style={{ display:"flex", alignItems:"center", gap:5, fontSize:13, color:"#c8a96e", fontWeight:700, flexShrink:0, alignSelf:"center", background:"#c8a96e18", border:"1px solid #c8a96e44", borderRadius:6, padding:"3px 10px" }}><span style={{ fontSize:15 }}>🪙</span>{it.value}</div>}
                <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                  <button onClick={()=>startEdit(it)} style={{...btnSecondary,fontSize:12,padding:"4px 10px"}}>✏️</button>
                  <button onClick={()=>removeItem(it.id)} style={{...btnSecondary,fontSize:12,padding:"4px 10px",color:"#c06060",borderColor:"#6b1a1a"}}>🗑️</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CharDetailPanel({ char, chars, races, factions, stories, locations, loreEvents, charStatuses, hookStatuses, relationshipTypes, onClose, onDelete, onCancelNew, onOpenStory, onOpenFaction, onOpenChar, onUpdateChar, onSaveFaction, artifacts, onUpdateArtifacts, onOpenArtifact, onPinCharHook, pinnedCharHookIds, subTab: subTabProp, onSubTabChange }) {
  const [subTabInternal, setSubTabInternal] = useState("details");
  const subTab = subTabProp ?? subTabInternal;
  const setSubTab = onSubTabChange ?? setSubTabInternal;
  const [lightbox, setLightbox] = useState(null);
  const [activeTextTab, setActiveTextTab] = useState("biography");
  const [descExpanded, setDescExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // Per-field inline editing
  const [editingField, setEditingField] = useState(null);
  const [fieldVal, setFieldVal] = useState("");
  // Type-change confirmation
  const [pendingType, setPendingType] = useState(null);
  // Text-tab management (always visible controls)
  const [renamingTabId, setRenamingTabId] = useState(null);
  const [renameVal, setRenameVal] = useState("");
  const [confirmDeleteTabId, setConfirmDeleteTabId] = useState(null);
  const [sectionToggles, setSectionToggles] = useState({});

  useEffect(() => {
    setEditingField(null);
    setFieldVal("");
    setPendingType(null);
    setActiveTextTab("biography");
    setDescExpanded(false);
    setConfirmDelete(false);
    setSectionToggles({});
  }, [char?.id]); // eslint-disable-line

  if (!char) return null;

  // Commit a single field and exit edit mode
  const commit = (field, val) => { onUpdateChar({...char, [field]: val}); setEditingField(null); };
  // Start editing a field (stores current value locally)
  const startEdit = (field, val) => { setEditingField(field); setFieldVal(val ?? ""); setDescExpanded(false); };
  const cancelEdit = () => setEditingField(null);

  const handleClose = () => {
    if (char._isNew && !char.name?.trim()) { onCancelNew?.(char.id); return; }
    onClose();
  };

  // Section collapse helpers — empty sections start collapsed, user can toggle
  const isSectionOpen = k => {
    if (k in sectionToggles) return sectionToggles[k];
    if (k === "secret") return !!char.secret;
    if (k === "factions") return (char.factions||[]).filter(e=>e.factionId).length > 0;
    if (k === "appearsIn") return linkedStories.length > 0;
    if (k === "relationships") return (char.relationships||[]).filter(r=>r.charId).length > 0;
    if (k === "links") return (char.links||[]).length > 0;
    return true;
  };
  const toggleSection = k => setSectionToggles(t => ({...t, [k]: !isSectionOpen(k)}));

  // Keyboard nav — Escape closes/cancels; handled globally so it works even when focus is outside inputs
  useEffect(() => {
    const handler = e => {
      if (e.key !== "Escape") return;
      if (editingField !== null) { setEditingField(null); return; }
      if (pendingType !== null) { setPendingType(null); return; }
      if (confirmDelete) { setConfirmDelete(false); return; }
      if (char?._isNew && !char.name?.trim()) { onCancelNew?.(char.id); return; }
      onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [editingField, pendingType, confirmDelete]); // eslint-disable-line

  // Derived values from char (always from saved prop, not a draft)
  const linkedStories = stories.filter(s => (s.characterIds||[]).includes(char.id));
  const relationships = char.relationships || [];
  const raceLabel = getRaceLabel(races, char.raceId, char.subraceId);
  const raceIcon = (races||[]).find(r => r.id===char.raceId)?.icon || null;
  const locationObj = (char.type==="main"||char.type==="side") ? (locations||[]).find(l => l.id===char.locationId) : null;
  const locationName = locationObj ? (locationObj.region ? `${locationObj.name} (${locationObj.region})` : locationObj.name) : null;
  const isPlayer = char.type === "player";
  const statusColor = (charStatuses||[]).find(s => s.name===char.status)?.color || CHAR_STATUS_COLORS[char.status] || "#4a4a6a";
  const selectedRace = races.find(r => r.id===char.raceId);
  const subraces = selectedRace?.subraces || [];

  const charEvents = [];
  stories.forEach(s => { (s.events||[]).forEach(ev => { if((ev.characterIds||[]).includes(char.id)) charEvents.push({...ev, storyId:s.id, storyName:s.name, storyStatus:s.status}); }); });
  (loreEvents||[]).forEach(ev => { if((ev.characterIds||[]).includes(char.id)) charEvents.push({...ev, storyId:"__lore__"}); });
  const evGroupMap = {};
  const evGroupOrder = [];
  const evUndated = [];
  sortEventsDesc(charEvents).forEach(ev => {
    const hasDate = ev.year || ev.month || ev.day;
    if (!hasDate) { evUndated.push(ev); return; }
    const key = `${ev.year||""}|${ev.month||""}|${ev.day||""}`;
    if (!evGroupMap[key]) { evGroupMap[key] = { key, year:ev.year||"", month:ev.month||"", day:ev.day||"", events:[] }; evGroupOrder.push(key); }
    evGroupMap[key].events.push(ev);
  });

  // Subtle hover affordance for clickable fields
  const fh = { onMouseEnter: e=>e.currentTarget.style.background="#ffffff09", onMouseLeave: e=>e.currentTarget.style.background="transparent" };
  const LABEL = { fontSize:11, color:"#7c5cbf", letterSpacing:1, textTransform:"uppercase", marginBottom:6 };

  // Bio/custom tab helpers
  const allTextTabs = [{id:"biography", name:isPlayer?"Biography":"Description", content:char.description||""}, ...(char.textTabs||[])];
  const activeTabContent = allTextTabs.find(t=>t.id===activeTextTab)?.content || "";
  const PREVIEW = 500;
  const needsFold = activeTabContent.length > PREVIEW;
  const visibleText = needsFold && !descExpanded ? activeTabContent.slice(0,PREVIEW).trimEnd()+"…" : activeTabContent;

  const updateTextTab = (tabId, content) => {
    if (tabId==="biography") onUpdateChar({...char, description:content});
    else onUpdateChar({...char, textTabs:(char.textTabs||[]).map(t=>t.id===tabId?{...t,content}:t)});
  };
  const updateFactions = v => onUpdateChar({...char, factions:v});
  const updateRelationships = v => onUpdateChar({...char, relationships:v});
  const updateLinks = v => onUpdateChar({...char, links:v});
  const addTextTab = () => { const id=uid(); onUpdateChar({...char, textTabs:[...(char.textTabs||[]),{id,name:"New Tab",content:""}]}); setActiveTextTab(id); setRenamingTabId(id); setRenameVal("New Tab"); };
  const renameTab = (tabId, name) => { onUpdateChar({...char, textTabs:(char.textTabs||[]).map(t=>t.id===tabId?{...t,name:name.trim()||t.name}:t)}); setRenamingTabId(null); };
  const deleteTab = tabId => { if(activeTextTab===tabId) setActiveTextTab("biography"); onUpdateChar({...char, textTabs:(char.textTabs||[]).filter(t=>t.id!==tabId)}); setConfirmDeleteTabId(null); };

  return (
    <div style={{ background:"#13101f", border:"1px solid #7c5cbf", borderRadius:12, marginBottom:20, overflow:"visible", boxShadow:"0 4px 32px #7c5cbf22", animation:"slideDown .18s ease" }}>
      <Lightbox src={lightbox} onClose={()=>setLightbox(null)}/>

      {/* ── Sticky header + sub-tabs wrapper ── */}
      <div style={{ position:"sticky", top:0, zIndex:10, borderRadius:"12px 12px 0 0", overflow:"hidden" }}>

      {/* ── Header ── */}
      <div style={{ background:`linear-gradient(90deg,#2a1f3d,#13101f)`, padding:"18px 24px", display:"flex", alignItems:"center", gap:20, borderBottom:"1px solid #2a1f3d" }}>

        {/* Portrait */}
        <PortraitZone value={char.image} onChange={src=>onUpdateChar({...char,image:src})} size={80}/>

        {/* Name + meta — all badges are clickable to edit */}
        <div style={{ flex:1 }}>

          {/* Name */}
          {editingField==="name"
            ? <input value={fieldVal} autoFocus
                onChange={e=>setFieldVal(e.target.value)}
                onBlur={()=>commit("name",fieldVal)}
                onKeyDown={e=>{ if(e.key==="Enter") commit("name",fieldVal); if(e.key==="Escape") cancelEdit(); if(e.key==="Tab"){ e.preventDefault(); commit("name",fieldVal); if(!isPlayer) startEdit("shortDescription",char.shortDescription||""); } }}
                style={{...inputStyle, fontSize:20, fontFamily:"Georgia,serif", fontWeight:700, marginBottom:6, display:"block", width:"100%", boxSizing:"border-box"}}/>
            : <div onClick={()=>startEdit("name", char.name||"")} {...fh} style={{ borderRadius:4, cursor:"text", display:"inline-block", marginBottom:6 }}>
                <span style={{ fontSize:22, fontFamily:"Georgia,serif", color:"#e8d5b7", fontWeight:700 }}>
                  {char.name || <span style={{ color:"#3a2a5a", fontStyle:"italic" }}>Unnamed Character</span>}
                </span>
              </div>
          }

          {/* Type + Race + Location/Class row */}
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>

            {/* TYPE — click to open select; selecting a different type triggers confirm */}
            {pendingType
              ? <div style={{ display:"flex", alignItems:"center", gap:6, background:"#1a1228", border:"1px solid #7c5cbf55", borderRadius:6, padding:"4px 10px" }}>
                  <span style={{ fontSize:12, color:"#c8b89a" }}>Change to {pendingType==="player"?"Player":pendingType==="main"?"Main":"Side"}?</span>
                  <button onClick={()=>{ onUpdateChar({...char,type:pendingType}); setPendingType(null); }}
                    style={{ background:"#7c5cbf", color:"#fff", border:"none", borderRadius:4, cursor:"pointer", fontSize:11, padding:"2px 10px", fontWeight:700 }}>Yes</button>
                  <button onClick={()=>setPendingType(null)}
                    style={{ background:"transparent", color:"#9a7fa0", border:"1px solid #3a2a5a", borderRadius:4, cursor:"pointer", fontSize:11, padding:"2px 8px" }}>No</button>
                </div>
              : editingField==="type"
                ? <select value={char.type} autoFocus
                    onChange={e=>{ const t=e.target.value; setEditingField(null); if(t!==char.type) setPendingType(t); }}
                    onBlur={()=>setEditingField(null)}
                    style={{...selStyle, fontSize:12, padding:"3px 8px"}}>
                    <option value="player">🎲 Player</option>
                    <option value="main">⭐ Main</option>
                    <option value="side">👤 Side</option>
                  </select>
                : <div onClick={()=>startEdit("type",char.type)} {...fh} style={{ borderRadius:4, cursor:"pointer" }}>
                    <span style={{ fontSize:12, color:"#7c5cbf", background:"#7c5cbf22", borderRadius:4, padding:"3px 10px" }}>
                      {isPlayer?"🎲 Player":char.type==="main"?"⭐ Main":"👤 Side"} ▾
                    </span>
                  </div>
            }

            {/* RACE */}
            {editingField==="raceId"
              ? <select value={fieldVal} autoFocus
                  onChange={e=>{ onUpdateChar({...char,raceId:e.target.value,subraceId:""}); setEditingField(null); }}
                  onBlur={()=>setEditingField(null)}
                  style={{...selStyle, fontSize:12, padding:"3px 8px"}}>
                  <option value="">— None —</option>
                  {races.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              : <div onClick={()=>startEdit("raceId",char.raceId||"")} {...fh} style={{ borderRadius:4, cursor:"pointer" }}>
                  {raceLabel
                    ? <span style={{ color:"#9a7fa0", fontSize:13, display:"flex", alignItems:"center", gap:4 }}>{raceIcon?<img src={raceIcon} alt="" style={{ width:14,height:14,objectFit:"cover",borderRadius:2 }}/>:"🧬"} {raceLabel}</span>
                    : <span style={{ color:"#3a2a5a", fontSize:12, fontStyle:"italic" }}>🧬 Set race…</span>}
                </div>
            }

            {/* SUBRACE — only shown when race has subraces */}
            {subraces.length>0 && (editingField==="subraceId"
              ? <select value={fieldVal} autoFocus
                  onChange={e=>{ onUpdateChar({...char,subraceId:e.target.value}); setEditingField(null); }}
                  onBlur={()=>setEditingField(null)}
                  style={{...selStyle, fontSize:12, padding:"3px 8px"}}>
                  <option value="">— None —</option>
                  {subraces.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              : <div onClick={()=>startEdit("subraceId",char.subraceId||"")} {...fh} style={{ borderRadius:4, cursor:"pointer" }}>
                  {(() => { const sub=subraces.find(s=>s.id===char.subraceId); return <span style={{ color:"#9a7fa0", fontSize:13 }}>· {sub?sub.name:<span style={{ color:"#3a2a5a", fontStyle:"italic" }}>subrace</span>}</span>; })()}
                </div>
            )}

            {/* LOCATION (main+side) */}
            {!isPlayer && (editingField==="locationId"
              ? <div style={{ position:"relative" }}>
                  <input autoFocus value={fieldVal}
                    onChange={e=>setFieldVal(e.target.value)}
                    onKeyDown={e=>{ if(e.key==="Escape") setEditingField(null); }}
                    onBlur={e=>{ if(!e.currentTarget.parentElement?.contains(e.relatedTarget)) setEditingField(null); }}
                    placeholder="Search location…"
                    style={{...ghostInput, fontSize:12, width:160}}/>
                  <div style={{ position:"absolute", top:"100%", left:0, zIndex:30, background:"#1a1228", border:"1px solid #3a2a5a", borderRadius:8, minWidth:200, maxHeight:180, overflowY:"auto", marginTop:4, boxShadow:"0 4px 16px #00000066" }}>
                    <div onMouseDown={()=>{ onUpdateChar({...char,locationId:""}); setEditingField(null); }}
                      style={{ padding:"6px 10px", fontSize:12, color:"#5a4a7a", cursor:"pointer", borderBottom:"1px solid #1e1630", fontStyle:"italic" }}
                      onMouseEnter={e=>e.currentTarget.style.background="#1e1630"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      — None —
                    </div>
                    {(locations||[]).filter(l=>!fieldVal||l.name.toLowerCase().includes(fieldVal.toLowerCase())).map(l=>(
                      <div key={l.id} onMouseDown={()=>{ onUpdateChar({...char,locationId:l.id}); setEditingField(null); }}
                        style={{ padding:"6px 10px", fontSize:12, color:"#e8d5b7", cursor:"pointer", borderBottom:"1px solid #1e1630" }}
                        onMouseEnter={e=>e.currentTarget.style.background="#1e1630"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        📍 {l.name}{l.region?` (${l.region})`:""}
                      </div>
                    ))}
                  </div>
                </div>
              : <div onClick={()=>startEdit("locationId", locationName||"")} {...fh} style={{ borderRadius:4, cursor:"pointer" }}>
                  {locationName
                    ? <span style={{ color:"#9a7fa0", fontSize:13 }}>📍 {locationName}</span>
                    : <span style={{ color:"#3a2a5a", fontSize:12, fontStyle:"italic" }}>📍 Set location…</span>}
                </div>
            )}

            {/* ORIGIN (player) */}
            {isPlayer && (editingField==="origin"
              ? <div style={{ position:"relative" }}>
                  <input autoFocus value={fieldVal}
                    onChange={e=>setFieldVal(e.target.value)}
                    onKeyDown={e=>{ if(e.key==="Enter") commit("origin",fieldVal); if(e.key==="Escape") cancelEdit(); }}
                    onBlur={e=>{ if(!e.currentTarget.parentElement?.contains(e.relatedTarget)) commit("origin",fieldVal); }}
                    placeholder="Search or type origin…"
                    style={{...ghostInput, width:180}}/>
                  {(locations||[]).filter(l=>!fieldVal||l.name.toLowerCase().includes(fieldVal.toLowerCase())).length > 0 && (
                    <div style={{ position:"absolute", top:"100%", left:0, zIndex:30, background:"#1a1228", border:"1px solid #3a2a5a", borderRadius:8, minWidth:200, maxHeight:180, overflowY:"auto", marginTop:4, boxShadow:"0 4px 16px #00000066" }}>
                      <div onMouseDown={()=>commit("origin","")}
                        style={{ padding:"6px 10px", fontSize:12, color:"#5a4a7a", cursor:"pointer", borderBottom:"1px solid #1e1630", fontStyle:"italic" }}
                        onMouseEnter={e=>e.currentTarget.style.background="#1e1630"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        — None —
                      </div>
                      {(locations||[]).filter(l=>!fieldVal||l.name.toLowerCase().includes(fieldVal.toLowerCase())).map(l=>(
                        <div key={l.id} onMouseDown={()=>commit("origin", l.name+(l.region?` (${l.region})`:""))}
                          style={{ padding:"6px 10px", fontSize:12, color:"#e8d5b7", cursor:"pointer", borderBottom:"1px solid #1e1630" }}
                          onMouseEnter={e=>e.currentTarget.style.background="#1e1630"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          📍 {l.name}{l.region?` (${l.region})`:""}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              : <div onClick={()=>startEdit("origin",char.origin||"")} {...fh} style={{ borderRadius:4, cursor:"text" }}>
                  {char.origin
                    ? <span style={{ color:"#9a7fa0", fontSize:13 }}>📍 {char.origin}</span>
                    : <span style={{ color:"#3a2a5a", fontSize:12, fontStyle:"italic" }}>📍 Origin…</span>}
                </div>
            )}

            {/* CLASS + LEVEL (player) */}
            {isPlayer && <>
              {editingField==="class"
                ? <input value={fieldVal} autoFocus
                    onChange={e=>setFieldVal(e.target.value)}
                    onBlur={()=>commit("class",fieldVal)}
                    onKeyDown={e=>{ if(e.key==="Enter") commit("class",fieldVal); if(e.key==="Escape") cancelEdit(); }}
                    placeholder="Class…" style={{...ghostInput, width:110}}/>
                : <div onClick={()=>startEdit("class",char.class||"")} {...fh} style={{ borderRadius:4, cursor:"text" }}>
                    {char.class
                      ? <span style={{ color:"#9a7fa0", fontSize:13 }}>⚔️ {char.class}</span>
                      : <span style={{ color:"#3a2a5a", fontSize:12, fontStyle:"italic" }}>⚔️ Class…</span>}
                  </div>
              }
              {editingField==="level"
                ? <input value={fieldVal} autoFocus
                    onChange={e=>setFieldVal(e.target.value)}
                    onBlur={()=>commit("level",fieldVal)}
                    onKeyDown={e=>{ if(e.key==="Enter") commit("level",fieldVal); if(e.key==="Escape") cancelEdit(); }}
                    placeholder="Lvl" style={{...ghostInput, color:"#c8a96e", width:60}}/>
                : <div onClick={()=>startEdit("level",char.level||"")} {...fh} style={{ borderRadius:4, cursor:"text" }}>
                    {char.level
                      ? <span style={{ color:"#c8a96e", fontSize:13, fontWeight:700 }}>Lvl {char.level}</span>
                      : <span style={{ color:"#3a2a5a", fontSize:12, fontStyle:"italic" }}>Lvl…</span>}
                  </div>
              }
            </>}

          </div>

          {/* SHORT DESCRIPTION (main+side) */}
          {(char.type==="main"||char.type==="side") && (
            <div style={{ marginTop:6 }}>
              {editingField==="shortDescription"
                ? <input value={fieldVal} autoFocus
                    onChange={e=>setFieldVal(e.target.value)}
                    onBlur={()=>commit("shortDescription",fieldVal)}
                    onKeyDown={e=>{ if(e.key==="Enter"||e.key==="Tab") { e.preventDefault(); commit("shortDescription",fieldVal); } if(e.key==="Escape") cancelEdit(); }}
                    placeholder="Short description…" style={{...ghostInput, fontSize:13, color:"#8a7090", width:"100%", boxSizing:"border-box"}}/>
                : <div onClick={()=>startEdit("shortDescription",char.shortDescription||"")} {...fh} style={{ borderRadius:4, cursor:"text" }}>
                    {char.shortDescription
                      ? <span style={{ color:"#8a7090", fontSize:13, fontStyle:"italic" }}>{char.shortDescription}</span>
                      : <span style={{ color:"#3a2a5a", fontSize:12, fontStyle:"italic" }}>Add a short description…</span>}
                  </div>
              }
            </div>
          )}

        </div>

        {/* Status + Actions — top right */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8, flexShrink:0 }}>
          {/* Status badge — click to edit */}
          <div>
            {editingField==="status"
              ? <select value={fieldVal} autoFocus
                  onChange={e=>{ commit("status", e.target.value); }}
                  onBlur={()=>cancelEdit()}
                  onKeyDown={e=>{ if(e.key==="Escape") cancelEdit(); }}
                  style={{...selStyle, fontSize:12, padding:"3px 8px"}}>
                  <option value="">— None —</option>
                  {(charStatuses||CHAR_STATUSES).map(s=><option key={s.name||s} value={s.name||s}>{s.name||s}</option>)}
                </select>
              : <div onClick={()=>startEdit("status", char.status||"")} {...fh} style={{ borderRadius:4, cursor:"pointer" }}>
                  {char.status
                    ? <span style={{ background:statusColor, color:"#e8d5b7", borderRadius:4, padding:"3px 12px", fontSize:12, fontWeight:700, display:"inline-block" }}>{char.status}</span>
                    : <span style={{ color:"#3a2a5a", fontSize:12, fontStyle:"italic", border:"1px dashed #3a2a5a", borderRadius:4, padding:"3px 10px" }}>Set status…</span>}
                </div>
            }
          </div>
          <div style={{ display:"flex", gap:8 }}>
          {onDelete && (confirmDelete
            ? <>
                <span style={{ fontSize:12, color:"#c8b89a", alignSelf:"center" }}>Delete?</span>
                <button onClick={()=>{ setConfirmDelete(false); onDelete(char.id); }} style={{...btnSecondary,fontSize:12,padding:"6px 12px",color:"#c06060",borderColor:"#6b1a1a"}}>Yes</button>
                <button onClick={()=>setConfirmDelete(false)} style={{...btnSecondary,fontSize:12,padding:"6px 12px"}}>No</button>
              </>
            : <button onClick={()=>setConfirmDelete(true)} style={{...btnSecondary,fontSize:12,padding:"6px 12px",color:"#c06060",borderColor:"#6b1a1a"}}>🗑️</button>
          )}
          <button onClick={handleClose} style={{...btnSecondary,fontSize:18,padding:"2px 10px",lineHeight:1}}>×</button>
        </div>
      </div>

      </div>{/* ── end header ── */}

      {/* ── Sub-tabs ── */}
      <div style={{ display:"flex", borderBottom:"1px solid #2a1f3d", background:"#0f0c1a" }}>
        {[["details","📋 Details",0],["items","🎒 Items",(char.items||[]).length],["timeline","⏳ Timeline",charEvents.length],["hooks","🔮 Hooks",(char.hooks||[]).length],["files","📁 Files",(char.files||[]).length]].map(([key,label,count])=>(
          <button key={key} onClick={()=>setSubTab(key)}
            style={{ padding:"10px 24px", border:"none", background:"transparent", color:subTab===key?"#e8d5b7":"#5a4a7a", cursor:"pointer", fontSize:13, fontWeight:subTab===key?700:400, borderBottom:subTab===key?"2px solid #7c5cbf":"2px solid transparent", letterSpacing:.5 }}>
            {label}{count>0&&<span style={{ marginLeft:6, background:"#7c5cbf", color:"#fff", borderRadius:10, padding:"1px 6px", fontSize:10 }}>{count}</span>}
          </button>
        ))}
      </div>

      </div>{/* ── end sticky wrapper ── */}

      {/* ── Details tab ── */}
      {subTab==="details" && (
        <div style={{ display:"flex", flexWrap:"wrap" }}>

          {/* Biography / Custom Text Tabs */}
          <div style={{ flex:"1 1 100%", padding:"14px 24px", borderBottom:"1px solid #1e1630" }}>
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
                      <button onClick={()=>{ setActiveTextTab(t.id); setEditingField(null); setDescExpanded(false); }}
                        style={{ padding:"3px 10px", borderRadius:6, border:"1px solid", borderColor:activeTextTab===t.id?"#7c5cbf":"#3a2a5a", background:activeTextTab===t.id?"#2a1f3d":"transparent", color:activeTextTab===t.id?"#e8d5b7":"#6a5a8a", cursor:"pointer", fontSize:11, fontWeight:700 }}>
                        {t.name}
                      </button>
                      {t.id!=="biography" && <>
                        <button onClick={()=>{ setRenamingTabId(t.id); setRenameVal(t.name); }} style={{ padding:"1px 4px", border:"none", background:"transparent", color:"#5a4a7a", cursor:"pointer", fontSize:11 }} onMouseEnter={e=>e.currentTarget.style.color="#c8a96e"} onMouseLeave={e=>e.currentTarget.style.color="#5a4a7a"}>✏️</button>
                        <button onClick={()=>setConfirmDeleteTabId(t.id)} style={{ padding:"1px 4px", border:"none", background:"transparent", color:"#5a4a7a", cursor:"pointer", fontSize:11 }} onMouseEnter={e=>e.currentTarget.style.color="#c06060"} onMouseLeave={e=>e.currentTarget.style.color="#5a4a7a"}>✕</button>
                      </>}
                    </>
                  )}
                </div>
              ))}
              <button onClick={addTextTab} style={{ padding:"3px 10px", borderRadius:6, border:"1px dashed #3a2a5a", background:"transparent", color:"#5a4a7a", cursor:"pointer", fontSize:11 }}>+ Tab</button>
            </div>
            {/* Content — click text to edit, textarea on click */}
            {editingField==="__text__"+activeTextTab
              ? <textarea value={fieldVal} autoFocus
                  ref={el=>{ if(el){ el.style.height="auto"; el.style.height=el.scrollHeight+"px"; } }}
                  onChange={e=>setFieldVal(e.target.value)}
                  onInput={e=>{ e.target.style.height="auto"; e.target.style.height=e.target.scrollHeight+"px"; }}
                  onBlur={()=>{ updateTextTab(activeTextTab, fieldVal); setEditingField(null); }}
                  onKeyDown={e=>{ if(e.key==="Escape") { setEditingField(null); setFieldVal(""); } }}
                  style={ghostTextarea}/>
              : <div onClick={()=>startEdit("__text__"+activeTextTab, activeTabContent)} {...fh}
                  style={{ borderRadius:4, cursor:"text", minHeight:40, padding:"4px 2px" }}>
                  {activeTabContent
                    ? <>
                        <div style={{ color:"#b09080", fontSize:14, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{visibleText}</div>
                        {needsFold&&<button onClick={e=>{ e.stopPropagation(); setDescExpanded(v=>!v); }}
                          style={{ marginTop:8, background:"transparent", border:"1px solid #3a2a5a", borderRadius:6, padding:"3px 12px", color:"#7c5cbf", cursor:"pointer", fontSize:12 }}
                          onMouseEnter={e=>{ e.currentTarget.style.borderColor="#7c5cbf"; e.currentTarget.style.color="#c8a96e"; }}
                          onMouseLeave={e=>{ e.currentTarget.style.borderColor="#3a2a5a"; e.currentTarget.style.color="#7c5cbf"; }}>
                          {descExpanded?"▲ Show less":"▼ Show more"}
                        </button>}
                      </>
                    : <span style={{ color:"#3a2a5a", fontSize:13, fontStyle:"italic" }}>Click to add {allTextTabs.find(t=>t.id===activeTextTab)?.name||"text"}…</span>}
                </div>
            }
          </div>

          {/* Secret (main only) */}
          {char.type==="main" && (
            <div style={{ flex:"1 1 100%", borderBottom:"1px solid #1e1630", background:"#0d0a18" }}>
              <div onClick={()=>toggleSection("secret")} style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 24px", cursor:"pointer", userSelect:"none" }}
                onMouseEnter={e=>e.currentTarget.style.background="#ffffff07"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <span style={{ fontSize:10, color:"#5a4a7a" }}>{isSectionOpen("secret")?"▼":"▶"}</span>
                <span style={{...LABEL, marginBottom:0, color:"#7c3a7a"}}>🔒 Secret</span>
                {!char.secret && !isSectionOpen("secret") && <span style={{ fontSize:11, color:"#4a2a5a", fontStyle:"italic", marginLeft:"auto" }}>empty</span>}
              </div>
              {isSectionOpen("secret") && (
                <div style={{ padding:"0 24px 14px" }}>
                  {editingField==="secret"
                    ? <textarea value={fieldVal} autoFocus
                        ref={el=>{ if(el){ el.style.height="auto"; el.style.height=el.scrollHeight+"px"; } }}
                        onChange={e=>setFieldVal(e.target.value)}
                        onInput={e=>{ e.target.style.height="auto"; e.target.style.height=e.target.scrollHeight+"px"; }}
                        onBlur={()=>commit("secret",fieldVal)}
                        onKeyDown={e=>{ if(e.key==="Escape") cancelEdit(); }}
                        style={{...ghostTextarea,color:"#a07898"}}/>
                    : <div onClick={()=>startEdit("secret",char.secret||"")} {...fh} style={{ borderRadius:4, cursor:"text", padding:"2px 0" }}>
                        {char.secret
                          ? <div style={{ color:"#a07898", fontSize:14, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{char.secret}</div>
                          : <span style={{ color:"#4a2a5a", fontSize:13, fontStyle:"italic" }}>Click to add secret notes…</span>}
                      </div>
                  }
                </div>
              )}
            </div>
          )}

          {/* Factions */}
          <div style={{ flex:"1 1 50%", borderRight:"1px solid #1e1630", borderBottom:"1px solid #1e1630" }}>
            <div onClick={()=>toggleSection("factions")} style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 24px", cursor:"pointer", userSelect:"none" }}
              onMouseEnter={e=>e.currentTarget.style.background="#ffffff07"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span style={{ fontSize:10, color:"#5a4a7a" }}>{isSectionOpen("factions")?"▼":"▶"}</span>
              <span style={{...LABEL, marginBottom:0}}>⚑ Factions</span>
              {!(char.factions||[]).filter(e=>e.factionId).length && !isSectionOpen("factions") && <span style={{ fontSize:11, color:"#3a2a5a", fontStyle:"italic", marginLeft:"auto" }}>empty</span>}
            </div>
            {isSectionOpen("factions") && (
              <div style={{ padding:"0 24px 14px" }}>
                {(char.factions||[]).map((entry,i)=>(
                  <FactionRoleRow key={entry.id} entry={entry} i={i} allFactions={factions} entries={char.factions||[]} setEntries={updateFactions} onSaveFaction={onSaveFaction} onOpenFaction={onOpenFaction}/>
                ))}
                <button onClick={()=>updateFactions([...(char.factions||[]),{id:uid(),factionId:"",tierId:"",role:""}])} style={{...btnSecondary,fontSize:12,padding:"4px 12px"}}>+ Add Faction</button>
              </div>
            )}
          </div>

          {/* Appears In */}
          <div style={{ flex:"1 1 50%", borderBottom:"1px solid #1e1630" }}>
            <div onClick={()=>toggleSection("appearsIn")} style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 24px", cursor:"pointer", userSelect:"none" }}
              onMouseEnter={e=>e.currentTarget.style.background="#ffffff07"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span style={{ fontSize:10, color:"#5a4a7a" }}>{isSectionOpen("appearsIn")?"▼":"▶"}</span>
              <span style={{...LABEL, marginBottom:0}}>📜 Appears In</span>
              {linkedStories.length > 0 && <span style={{ fontSize:10, color:"#5a4a7a", marginLeft:4 }}>({linkedStories.length})</span>}
              {!linkedStories.length && !isSectionOpen("appearsIn") && <span style={{ fontSize:11, color:"#3a2a5a", fontStyle:"italic", marginLeft:"auto" }}>empty</span>}
            </div>
            {isSectionOpen("appearsIn") && (
              <div style={{ padding:"0 24px 14px" }}>
                {linkedStories.length===0
                  ? <span style={{ color:"#5a4a7a", fontSize:13 }}>Not linked to any stories.</span>
                  : <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                      {linkedStories.map(s=>{
                        const groupId = (s.charGroupAssignments||{})[char.id];
                        const group = groupId && (s.charGroups||[]).find(g=>g.id===groupId);
                        return (
                          <div key={s.id} style={{ display:"flex", flexDirection:"column", alignItems:"flex-start", gap:2 }}>
                            <LinkBadge label={s.name} color={STATUS_COLORS[s.status]||"#333"} onClick={()=>onOpenStory(s)} onNewTab={()=>onOpenStory(s,null,{newTab:true})}/>
                            {group && <span style={{ fontSize:10, color:"#7c5cbf", paddingLeft:4 }}>↳ {group.name}</span>}
                          </div>
                        );
                      })}
                    </div>}
              </div>
            )}
          </div>

          {/* Relationships */}
          <div style={{ flex:"1 1 100%", borderBottom:"1px solid #1e1630" }}>
            <div onClick={()=>toggleSection("relationships")} style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 24px", cursor:"pointer", userSelect:"none" }}
              onMouseEnter={e=>e.currentTarget.style.background="#ffffff07"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span style={{ fontSize:10, color:"#5a4a7a" }}>{isSectionOpen("relationships")?"▼":"▶"}</span>
              <span style={{...LABEL, marginBottom:0}}>🔗 Relationships</span>
              {relationships.filter(r=>r.charId).length > 0 && <span style={{ fontSize:10, color:"#5a4a7a", marginLeft:4 }}>({relationships.filter(r=>r.charId).length})</span>}
              {!relationships.filter(r=>r.charId).length && !isSectionOpen("relationships") && <span style={{ fontSize:11, color:"#3a2a5a", fontStyle:"italic", marginLeft:"auto" }}>empty</span>}
            </div>
            {isSectionOpen("relationships") && (
              <div style={{ padding:"0 24px 14px" }}>
                <RelationshipLinker relationships={relationships} chars={chars.filter(c=>c.id!==char.id)} relationshipTypes={relationshipTypes} onChange={updateRelationships} onOpenChar={onOpenChar}/>
              </div>
            )}
          </div>

          {/* External Links */}
          <div style={{ flex:"1 1 100%" }}>
            <div onClick={()=>toggleSection("links")} style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 24px", cursor:"pointer", userSelect:"none" }}
              onMouseEnter={e=>e.currentTarget.style.background="#ffffff07"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span style={{ fontSize:10, color:"#5a4a7a" }}>{isSectionOpen("links")?"▼":"▶"}</span>
              <span style={{...LABEL, marginBottom:0}}>🔗 External Links</span>
              {(char.links||[]).length > 0 && <span style={{ fontSize:10, color:"#5a4a7a", marginLeft:4 }}>({(char.links||[]).length})</span>}
              {!(char.links||[]).length && !isSectionOpen("links") && <span style={{ fontSize:11, color:"#3a2a5a", fontStyle:"italic", marginLeft:"auto" }}>empty</span>}
            </div>
            {isSectionOpen("links") && (
              <div style={{ padding:"0 24px 14px" }}>
                {(char.links||[]).map((lnk,i)=>(
                  <div key={lnk.id} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                    {editingField===`link-${lnk.id}`
                      ? <>
                          <input value={lnk.label} onChange={e=>{ const l=[...(char.links||[])]; l[i]={...l[i],label:e.target.value}; updateLinks(l); }} placeholder="Label" style={{...inputStyle,flex:"0 0 130px"}}/>
                          <input autoFocus value={lnk.url} onChange={e=>{ const l=[...(char.links||[])]; l[i]={...l[i],url:e.target.value}; updateLinks(l); }} placeholder="https://..." style={{...inputStyle,flex:1}}
                            onBlur={()=>setEditingField(null)} onKeyDown={e=>{ if(e.key==="Escape"||e.key==="Enter") setEditingField(null); }}/>
                        </>
                      : <>
                          <a href={lnk.url} target="_blank" rel="noreferrer"
                            style={{ flex:1, fontSize:13, color:"#c8a96e", textDecoration:"none", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}
                            onMouseEnter={e=>e.currentTarget.style.textDecoration="underline"}
                            onMouseLeave={e=>e.currentTarget.style.textDecoration="none"}>
                            🔗 {lnk.label||lnk.url||"Untitled link"}
                          </a>
                          <button onClick={()=>setEditingField(`link-${lnk.id}`)} style={{...btnSecondary,fontSize:11,padding:"3px 8px",flexShrink:0}}>✏️</button>
                        </>
                    }
                    <button onClick={()=>updateLinks((char.links||[]).filter((_,j)=>j!==i))} style={{...btnSecondary,padding:"0 10px",color:"#c06060",flexShrink:0}}>✕</button>
                  </div>
                ))}
                <button onClick={()=>{ updateLinks([...(char.links||[]),{id:uid(),label:"",url:""}]); if(!isSectionOpen("links")) setSectionToggles(t=>({...t,links:true})); }} style={{...btnSecondary,fontSize:12,padding:"4px 12px"}}>+ Add Link</button>
              </div>
            )}
          </div>

        </div>
      )}

      {subTab==="items" && <ItemsTab char={char} onUpdateChar={onUpdateChar} artifacts={artifacts||[]} onUpdateArtifacts={onUpdateArtifacts} onOpenArtifact={onOpenArtifact}/>}
      {subTab==="timeline" && (
        <div style={{ padding:"20px 24px" }}>
          {charEvents.length===0
            ? <div style={{ textAlign:"center", padding:"40px 0", color:"#5a4a7a" }}><div style={{ fontSize:36, marginBottom:10 }}>⏳</div><div style={{ fontSize:14, fontFamily:"Georgia,serif" }}>No events linked to this character.</div></div>
            : <CharTimeline evGroupMap={evGroupMap} evGroupOrder={evGroupOrder} evUndated={evUndated} stories={stories} onOpenStory={onOpenStory}/>
          }
        </div>
      )}
      {subTab==="hooks" && <CharHooksTab char={char} onUpdateChar={onUpdateChar} hookStatuses={hookStatuses} onPinHook={onPinCharHook} pinnedHookIds={pinnedCharHookIds}/>}
      {subTab==="files" && onUpdateChar && <FilesPanel char={char} onUpdateChar={onUpdateChar}/>}
    </div>
  );
}

export default memo(CharDetailPanel);
