import { useState, useEffect, memo } from "react";
import ImageUploadZone from "./ImageUploadZone.jsx";
import { inputStyle, selStyle, btnPrimary, btnSecondary, CHAR_STATUSES, CHAR_STATUS_COLORS, STATUS_COLORS, RELATIONSHIP_COLORS, RARITY_COLORS } from "../constants.js";
import { getRaceLabel, getFactionColor, uid, formatEventDate, sortEventsDesc } from "../utils.jsx";
import Avatar from "./Avatar.jsx";
import Badge from "./Badge.jsx";
import LinkBadge from "./LinkBadge.jsx";
import FilesPanel from "./FilesPanel.jsx";
import RelationshipLinker from "./RelationshipLinker.jsx";
import Lightbox from "./Lightbox.jsx";

// ── Char Timeline ─────────────────────────────────────────────────────────────
function CharTimeline({ evGroupMap, evGroupOrder, evUndated, stories, onOpenStory }) {
  const [collapsed, setCollapsed] = useState({});
  const toggle = key => setCollapsed(c => ({...c, [key]: !c[key]}));

  const renderEntry = ev => {
    const isLore = ev.storyId === "__lore__";
    const story = isLore ? null : stories.find(s => s.id === ev.storyId);
    return (
      <div key={ev.id} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"11px 14px", borderBottom:"1px solid #1e1630", background:"#0d0b14" }}>
        <div style={{ flex:1, minWidth:0 }}>
          {ev.title && <div style={{ fontSize:14, color:"#e8d5b7", fontWeight:700, fontFamily:"Georgia,serif", marginBottom:ev.description?4:0 }}>{ev.title}</div>}
          {ev.description && <div style={{ fontSize:13, color:"#b09080", lineHeight:1.6, whiteSpace:"pre-wrap" }}>{ev.description}</div>}
        </div>
        {isLore && <span style={{ fontSize:11, color:"#c8a96e", background:"#c8a96e18", border:"1px solid #c8a96e44", borderRadius:8, padding:"2px 8px", flexShrink:0 }}>📜 Lore</span>}
        {story && <LinkBadge label={story.name} color={STATUS_COLORS[story.status]||"#333"} onClick={()=>onOpenStory(story)} onNewTab={()=>onOpenStory(story,null,{newTab:true})}/>}
      </div>
    );
  };

  const renderGroup = (group, labelOverride, dimmed) => {
    const isOpen = !collapsed[group.key];
    const label = labelOverride || formatEventDate({year:group.year, month:group.month, day:group.day}) || "No date";
    return (
      <div key={group.key} style={{ marginBottom:10, border:"1px solid #3a2a5a", borderRadius:10, overflow:"hidden" }}>
        <div onClick={() => toggle(group.key)}
          style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"#2a1f3d", cursor:"pointer", userSelect:"none" }}>
          <span style={{ fontSize:11, color:"#7c5cbf", flexShrink:0 }}>{isOpen ? "▼" : "▶"}</span>
          <span style={{ fontFamily:"Georgia,serif", fontWeight:700, fontSize:14, color: dimmed?"#6a5a8a":"#c8a96e", flex:1 }}>📅 {label}</span>
          <span style={{ fontSize:11, color:"#5a4a7a" }}>{group.events.length} event{group.events.length!==1?"s":""}</span>
        </div>
        {isOpen && <div>{group.events.map(ev => renderEntry(ev))}</div>}
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
function ItemsTab({ char, onUpdateChar, artifacts, onUpdateArtifacts }) {
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
                <div key={a.id} style={{ background:"#0f0c1a", border:`1px solid ${rc}33`, borderLeft:`3px solid ${rc}`, borderRadius:10, padding:"10px 14px", display:"flex", gap:10, alignItems:"center" }}>
                  {a.image && <img src={a.image} alt="" style={{ width:40, height:40, borderRadius:6, objectFit:"cover", flexShrink:0 }}/>}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                      <span style={{ fontSize:13, color:"#e8d5b7", fontWeight:700 }}>{a.name}</span>
                      <span style={{ fontSize:9, color:rc, background:rc+"22", border:`1px solid ${rc}44`, borderRadius:8, padding:"1px 6px" }}>{a.rarity}</span>
                    </div>
                    {a.description && <div style={{ fontSize:12, color:"#b09080" }}>{a.description}</div>}
                  </div>
                  {a.value && <span style={{ fontSize:12, color:"#c8a96e", fontWeight:700, flexShrink:0 }}>🪙 {a.value}</span>}
                  <button onClick={() => onUpdateArtifacts(artifacts.map(x => x.id===a.id ? {...x, holderId:null} : x))}
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

function CharDetailPanel({ char, chars, races, factions, stories, locations, loreEvents, charStatuses, relationshipTypes, onClose, onDelete, onOpenStory, onOpenFaction, onOpenChar, onUpdateChar, artifacts, onUpdateArtifacts, subTab: subTabProp, onSubTabChange }) {
  const [subTabInternal, setSubTabInternal] = useState("details");
  const subTab = subTabProp ?? subTabInternal;
  const setSubTab = onSubTabChange ?? setSubTabInternal;
  const [descExpanded, setDescExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({...char});
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => { setIsEditing(false); setEditForm({...char}); setDescExpanded(false); }, [char?.id]);

  if (!char) return null;

  const set = (k, v) => setEditForm(f => ({...f, [k]:v}));
  const handleSave = () => { onUpdateChar(editForm); setIsEditing(false); };
  const handleCancelEdit = () => { setIsEditing(false); setEditForm({...char}); };

  const linkedStories = stories.filter(s=>s.characterIds.includes(char.id));
  const linkedFactions = factions.filter(f=>(char.factions||[]).some(e=>e.factionId===f.id));
  const relationships = char.relationships||[];
  const raceLabel = getRaceLabel(races, char.raceId, char.subraceId);
  const raceIcon = (races||[]).find(r=>r.id===char.raceId)?.icon||null;
  const locationObj = (char.type==="main"||char.type==="side") ? (locations||[]).find(l=>l.id===char.locationId) : null;
  const locationName = locationObj ? (locationObj.region ? `${locationObj.name} (${locationObj.region})` : locationObj.name) : null;
  const isPlayer = char.type==="player";

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
    if (!evGroupMap[key]) {
      evGroupMap[key] = { key, year:ev.year||"", month:ev.month||"", day:ev.day||"", events:[] };
      evGroupOrder.push(key);
    }
    evGroupMap[key].events.push(ev);
  });

  const selectedRace = races.find(r=>r.id===editForm.raceId);
  const subraces = selectedRace?.subraces||[];

  return (
    <div style={{ background:"#13101f", border:"1px solid #7c5cbf", borderRadius:12, marginBottom:20, overflow:"hidden", boxShadow:"0 4px 32px #7c5cbf22", animation:"slideDown .18s ease" }}>
      <div style={{ background:`linear-gradient(90deg,#2a1f3daa,#13101f)`, padding:"18px 24px", display:"flex", alignItems:"center", gap:20, borderBottom:"1px solid #2a1f3d" }}>
        {isEditing ? (
          <div style={{ display:"flex", alignItems:"center", gap:16, flex:1 }}>
            <div onClick={()=>{}} style={{ flexShrink:0 }}>
              <Avatar src={editForm.image} name={editForm.name} size={72}/>
            </div>
            <div style={{ flex:1 }}>
              <input value={editForm.name} onChange={e=>set("name",e.target.value)} style={{...inputStyle, fontSize:18, fontFamily:"Georgia,serif", fontWeight:700, marginBottom:8}} placeholder="Name..."/>
              <ImageUploadZone value={editForm.image} onChange={src=>set("image",src)} size="full"/>
            </div>
          </div>
        ) : (
          <>
            <div onClick={char.image ? () => setLightbox(char.image) : undefined} style={{ cursor: char.image ? "zoom-in" : "default", flexShrink:0 }}>
              <Avatar src={char.image} name={char.name} size={80}/>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                <span style={{ fontSize:22, fontFamily:"Georgia,serif", color:"#e8d5b7", fontWeight:700 }}>{char.name}</span>
                <span style={{ fontSize:12, color:"#7c5cbf", background:"#7c5cbf22", borderRadius:4, padding:"2px 8px" }}>{isPlayer?"🎲 Player":char.type==="main"?"⭐ Main":"👤 Side"}</span>
              </div>
              {raceLabel&&<div style={{ color:"#9a7fa0", fontSize:13, marginTop:4, display:"flex", alignItems:"center", gap:4 }}>{raceIcon ? <img src={raceIcon} alt="" style={{ width:14, height:14, objectFit:"cover", borderRadius:2 }}/> : "🧬"} {raceLabel}</div>}
              {isPlayer&&<div style={{ display:"flex", gap:16, marginTop:4 }}>
                {char.class&&<div style={{ color:"#9a7fa0", fontSize:13 }}>⚔️ {char.class}</div>}
                {char.level&&<div style={{ color:"#c8a96e", fontSize:13, fontWeight:700 }}>Lvl {char.level}</div>}
              </div>}
            </div>
          </>
        )}
        <div style={{ display:"flex", gap:8, flexShrink:0 }}>
          {isEditing ? (
            <>
              <button onClick={handleSave} disabled={!editForm.name.trim()} style={{...btnPrimary,fontSize:12,padding:"6px 14px"}}>💾 Save</button>
              <button onClick={handleCancelEdit} style={{...btnSecondary,fontSize:12,padding:"6px 14px"}}>Cancel</button>
            </>
          ) : (
            <>
              <button onClick={()=>setIsEditing(true)} style={{...btnPrimary,fontSize:12,padding:"6px 14px"}}>✏️ Edit</button>
              {onDelete&&<button onClick={()=>onDelete(char.id)} style={{...btnSecondary,fontSize:12,padding:"6px 14px",color:"#c06060",borderColor:"#6b1a1a"}}>🗑️ Delete</button>}
            </>
          )}
          <button onClick={onClose} style={{...btnSecondary,fontSize:18,padding:"2px 10px",lineHeight:1}}>×</button>
        </div>
      </div>

      {isEditing ? (
        <div style={{ padding:"20px 24px" }}>
          {/* Type toggle */}
          <div style={{ display:"flex", gap:8, marginBottom:18 }}>
            {["player","main","side"].map(t=>(
              <button key={t} onClick={()=>set("type",t)} style={{ flex:1, padding:"8px 0", borderRadius:6, border:`1px solid ${editForm.type===t?"#7c5cbf":"#333"}`, background:editForm.type===t?"#7c5cbf33":"transparent", color:editForm.type===t?"#e8d5b7":"#888", cursor:"pointer", fontWeight:700 }}>
                {t==="player"?"🎲 Player":t==="main"?"⭐ Main":"👤 Side"}
              </button>
            ))}
          </div>
          {/* Class + Level (player only) */}
          {editForm.type==="player"&&(
            <div style={{ display:"flex", gap:12, marginBottom:14 }}>
              <div style={{ flex:1 }}>
                <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Class</label>
                <input value={editForm.class||""} onChange={e=>set("class",e.target.value)} placeholder="e.g. Ranger…" style={inputStyle}/>
              </div>
              <div style={{ flex:"0 0 100px" }}>
                <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Level</label>
                <input value={editForm.level||""} onChange={e=>set("level",e.target.value)} placeholder="e.g. 5" style={inputStyle}/>
              </div>
            </div>
          )}
          {/* Short Description (main + side) */}
          {(editForm.type==="main"||editForm.type==="side")&&(
            <div style={{ marginBottom:14 }}>
              <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Short Description</label>
              <input value={editForm.shortDescription||""} onChange={e=>set("shortDescription",e.target.value)} placeholder="One-line summary visible on the character card…" style={inputStyle}/>
            </div>
          )}
          {/* Race + Subrace */}
          <div style={{ display:"flex", gap:12, marginBottom:14 }}>
            <div style={{ flex:1 }}>
              <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Race</label>
              <select value={editForm.raceId} onChange={e=>{ set("raceId",e.target.value); set("subraceId",""); }} style={selStyle}>
                <option value="">— Select Race —</option>
                {races.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div style={{ flex:1 }}>
              <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Subrace</label>
              <select value={editForm.subraceId} onChange={e=>set("subraceId",e.target.value)} style={{...selStyle,opacity:subraces.length===0?0.4:1}} disabled={subraces.length===0}>
                <option value="">— None —</option>
                {subraces.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          {/* Origin (player) / Location (main+side) */}
          {editForm.type==="player"&&(
            <div style={{ marginBottom:14 }}>
              <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Origin</label>
              <input value={editForm.origin||""} onChange={e=>set("origin",e.target.value)} style={inputStyle}/>
            </div>
          )}
          {(editForm.type==="main"||editForm.type==="side")&&(
            <div style={{ marginBottom:14 }}>
              <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Location</label>
              <select value={editForm.locationId||""} onChange={e=>set("locationId",e.target.value)} style={selStyle}>
                <option value="">— None —</option>
                {(locations||[]).map(l=><option key={l.id} value={l.id}>{l.name}{l.region?` (${l.region})`:""}</option>)}
              </select>
            </div>
          )}
          {/* Status */}
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Status</label>
            <select value={editForm.status||""} onChange={e=>set("status",e.target.value)} style={selStyle}>
              <option value="">— Select —</option>
              {(charStatuses||CHAR_STATUSES).map(s=><option key={s.name||s} value={s.name||s}>{s.name||s}</option>)}
            </select>
          </div>
          {/* Factions with roles */}
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:8, letterSpacing:1, textTransform:"uppercase" }}>Factions</label>
            {(editForm.factions||[]).map((entry,i)=>(
              <div key={entry.id} style={{ display:"flex", gap:8, marginBottom:8 }}>
                <select value={entry.factionId} onChange={e=>{ const f=[...(editForm.factions||[])]; f[i]={...f[i],factionId:e.target.value}; set("factions",f); }} style={{...selStyle,flex:1}}>
                  <option value="">— Select Faction —</option>
                  {factions.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
                <input value={entry.role} onChange={e=>{ const f=[...(editForm.factions||[])]; f[i]={...f[i],role:e.target.value}; set("factions",f); }} placeholder="Role (e.g. Leader)" style={{...inputStyle,flex:"0 0 150px"}}/>
                <button onClick={()=>set("factions",(editForm.factions||[]).filter((_,j)=>j!==i))} style={{...btnSecondary,padding:"0 10px",color:"#c06060",flexShrink:0}}>✕</button>
              </div>
            ))}
            <button onClick={()=>set("factions",[...(editForm.factions||[]),{id:uid(),factionId:"",role:""}])} style={{...btnSecondary,fontSize:12,padding:"5px 14px"}}>+ Add Faction</button>
          </div>
          {/* Description / Biography */}
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>{editForm.type==="player"?"Biography":"Description"}</label>
            <textarea value={editForm.description||""} onChange={e=>set("description",e.target.value)} rows={8} style={{...inputStyle,resize:"vertical"}}/>
          </div>
          {/* Secret (main only) */}
          {editForm.type==="main"&&(
            <div style={{ marginBottom:14 }}>
              <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>🔒 Secret</label>
              <textarea value={editForm.secret||""} onChange={e=>set("secret",e.target.value)} rows={4} placeholder="Hidden notes, secret agenda, true identity…" style={{...inputStyle,resize:"vertical",borderColor:"#4a2a5a"}}/>
            </div>
          )}
          {/* Relationships */}
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:8, letterSpacing:1, textTransform:"uppercase" }}>Relationships</label>
            <RelationshipLinker relationships={editForm.relationships||[]} chars={chars.filter(c=>c.id!==editForm.id)} relationshipTypes={relationshipTypes} onChange={v=>set("relationships",v)}/>
          </div>
          {/* External Links */}
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:8, letterSpacing:1, textTransform:"uppercase" }}>External Links</label>
            {(editForm.links||[]).map((lnk,i)=>(
              <div key={lnk.id} style={{ display:"flex", gap:8, marginBottom:8 }}>
                <input value={lnk.label} onChange={e=>{ const l=[...(editForm.links||[])]; l[i]={...l[i],label:e.target.value}; set("links",l); }} placeholder="Label (optional)" style={{...inputStyle,flex:"0 0 160px"}}/>
                <input value={lnk.url} onChange={e=>{ const l=[...(editForm.links||[])]; l[i]={...l[i],url:e.target.value}; set("links",l); }} placeholder="https://..." style={{...inputStyle,flex:1}}/>
                <button onClick={()=>set("links",(editForm.links||[]).filter((_,j)=>j!==i))} style={{...btnSecondary,padding:"0 10px",color:"#c06060",flexShrink:0}}>✕</button>
              </div>
            ))}
            <button onClick={()=>set("links",[...(editForm.links||[]),{id:uid(),label:"",url:""}])} style={{...btnSecondary,fontSize:12,padding:"5px 14px"}}>+ Add Link</button>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={handleSave} disabled={!editForm.name.trim()} style={{...btnPrimary,flex:1}}>💾 Save Character</button>
            <button onClick={handleCancelEdit} style={{...btnSecondary,flex:1}}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display:"flex", borderBottom:"1px solid #2a1f3d", background:"#0f0c1a" }}>
            <button onClick={()=>setSubTab("details")} style={{ padding:"10px 24px", border:"none", background:"transparent", color:subTab==="details"?"#e8d5b7":"#5a4a7a", cursor:"pointer", fontSize:13, fontWeight:subTab==="details"?700:400, borderBottom:subTab==="details"?"2px solid #7c5cbf":"2px solid transparent", letterSpacing:.5 }}>📋 Details</button>
            <button onClick={()=>setSubTab("items")} style={{ padding:"10px 24px", border:"none", background:"transparent", color:subTab==="items"?"#e8d5b7":"#5a4a7a", cursor:"pointer", fontSize:13, fontWeight:subTab==="items"?700:400, borderBottom:subTab==="items"?"2px solid #7c5cbf":"2px solid transparent", letterSpacing:.5 }}>
              🎒 Items{(char.items||[]).length>0&&<span style={{ marginLeft:6, background:"#7c5cbf", color:"#fff", borderRadius:10, padding:"1px 6px", fontSize:10 }}>{(char.items||[]).length}</span>}
            </button>
            <button onClick={()=>setSubTab("timeline")} style={{ padding:"10px 24px", border:"none", background:"transparent", color:subTab==="timeline"?"#e8d5b7":"#5a4a7a", cursor:"pointer", fontSize:13, fontWeight:subTab==="timeline"?700:400, borderBottom:subTab==="timeline"?"2px solid #7c5cbf":"2px solid transparent", letterSpacing:.5 }}>
              ⏳ Timeline{charEvents.length>0&&<span style={{ marginLeft:6, background:"#7c5cbf", color:"#fff", borderRadius:10, padding:"1px 6px", fontSize:10 }}>{charEvents.length}</span>}
            </button>
            {isPlayer&&<button onClick={()=>setSubTab("files")} style={{ padding:"10px 24px", border:"none", background:"transparent", color:subTab==="files"?"#e8d5b7":"#5a4a7a", cursor:"pointer", fontSize:13, fontWeight:subTab==="files"?700:400, borderBottom:subTab==="files"?"2px solid #7c5cbf":"2px solid transparent", letterSpacing:.5 }}>
              📁 Files{(char.files||[]).length>0&&<span style={{ marginLeft:6, background:"#7c5cbf", color:"#fff", borderRadius:10, padding:"1px 6px", fontSize:10 }}>{(char.files||[]).length}</span>}
            </button>}
          </div>
          {subTab==="details"&&(
            <div style={{ display:"flex", flexWrap:"wrap" }}>
              {(isPlayer?char.origin:locationName)&&<div style={{ flex:"1 1 200px", padding:"14px 24px", borderRight:"1px solid #1e1630", borderBottom:"1px solid #1e1630" }}><div style={{ fontSize:11, color:"#7c5cbf", letterSpacing:1, textTransform:"uppercase", marginBottom:4 }}>📍 {isPlayer?"Origin":"Location"}</div><div style={{ color:"#c8b89a", fontSize:14 }}>{isPlayer?char.origin:locationName}</div></div>}
              {char.status&&<div style={{ flex:"1 1 200px", padding:"14px 24px", borderBottom:"1px solid #1e1630" }}><div style={{ fontSize:11, color:"#7c5cbf", letterSpacing:1, textTransform:"uppercase", marginBottom:4 }}>💀 Status</div><div style={{ display:"inline-block", background:(charStatuses||[]).find(s=>s.name===char.status)?.color||CHAR_STATUS_COLORS[char.status]||"#4a4a6a", color:"#e8d5b7", borderRadius:4, padding:"2px 10px", fontSize:13, fontWeight:700 }}>{char.status}</div></div>}
              {char.description&&(()=>{
                const PREVIEW = 500;
                const needsFold = char.description.length > PREVIEW;
                const visible = needsFold && !descExpanded ? char.description.slice(0, PREVIEW).trimEnd() + "…" : char.description;
                return (
                  <div style={{ flex:"1 1 100%", padding:"14px 24px", borderBottom:"1px solid #1e1630" }}>
                    <div style={{ fontSize:11, color:"#7c5cbf", letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>{isPlayer?"📖 Biography":"📖 Description"}</div>
                    <div style={{ color:"#b09080", fontSize:14, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{visible}</div>
                    {needsFold&&(
                      <button onClick={()=>setDescExpanded(v=>!v)}
                        style={{ marginTop:10, background:"transparent", border:"1px solid #3a2a5a", borderRadius:6, padding:"4px 14px", color:"#7c5cbf", cursor:"pointer", fontSize:12, transition:"border-color .15s, color .15s" }}
                        onMouseEnter={e=>{ e.currentTarget.style.borderColor="#7c5cbf"; e.currentTarget.style.color="#c8a96e"; }}
                        onMouseLeave={e=>{ e.currentTarget.style.borderColor="#3a2a5a"; e.currentTarget.style.color="#7c5cbf"; }}>
                        {descExpanded ? "▲ Show less" : "▼ Show more"}
                      </button>
                    )}
                  </div>
                );
              })()}
              {char.type==="main"&&char.secret&&<div style={{ flex:"1 1 100%", padding:"14px 24px", borderBottom:"1px solid #1e1630", background:"#0d0a18" }}><div style={{ fontSize:11, color:"#7c3a7a", letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>🔒 Secret</div><div style={{ color:"#a07898", fontSize:14, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{char.secret}</div></div>}
              <div style={{ flex:"1 1 50%", padding:"14px 24px", borderRight:"1px solid #1e1630", borderBottom:"1px solid #1e1630" }}>
                <div style={{ fontSize:11, color:"#7c5cbf", letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>⚑ Factions</div>
                {linkedFactions.length===0
                  ? <span style={{ color:"#5a4a7a", fontSize:13 }}>Not in any faction.</span>
                  : <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
                      {(char.factions||[]).filter(e=>e.factionId).map(entry=>{
                        const f = factions.find(x=>x.id===entry.factionId);
                        if (!f) return null;
                        return (
                          <div key={entry.id} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                            <LinkBadge label={f.name} color={getFactionColor(factions,f.id)} onClick={()=>onOpenFaction(f)} onNewTab={()=>onOpenFaction(f,{newTab:true})}/>
                            {entry.role&&<span style={{ fontSize:11, color:"#9a7fa0" }}>{entry.role}</span>}
                          </div>
                        );
                      })}
                    </div>}
              </div>
              <div style={{ flex:"1 1 50%", padding:"14px 24px", borderBottom:"1px solid #1e1630" }}>
                <div style={{ fontSize:11, color:"#7c5cbf", letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>📜 Appears In</div>
                {linkedStories.length===0
                  ? <span style={{ color:"#5a4a7a", fontSize:13 }}>Not linked to any stories.</span>
                  : <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>{linkedStories.map(s=><LinkBadge key={s.id} label={s.name} color={STATUS_COLORS[s.status]||"#333"} onClick={()=>onOpenStory(s)} onNewTab={()=>onOpenStory(s,null,{newTab:true})}/>)}</div>}
              </div>
              {relationships.filter(r=>r.charId).length>0&&(
                <div style={{ flex:"1 1 100%", padding:"14px 24px", borderTop:"1px solid #1e1630" }}>
                  <div style={{ fontSize:11, color:"#7c5cbf", letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>🔗 Relationships</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
                    {relationships.filter(r=>r.charId).map(rel=>{
                      const c = chars.find(x=>x.id===rel.charId);
                      if (!c) return null;
                      const relColor = (relationshipTypes||[]).find(t=>t.name===rel.type)?.color||RELATIONSHIP_COLORS[rel.type]||"#3a4a6a";
                      return (
                        <div key={rel.id} onClick={e=>{ if(e.ctrlKey||e.metaKey){e.preventDefault();onOpenChar(c,{newTab:true});}else{onOpenChar(c);} }} onAuxClick={e=>{if(e.button===1){e.preventDefault();onOpenChar(c,{newTab:true});}}} style={{ display:"flex", alignItems:"center", gap:8, background:"#1e1630", border:`1px solid ${relColor}66`, borderRadius:8, padding:"6px 14px 6px 6px", cursor:"pointer", transition:"border-color .15s" }}
                          onMouseEnter={e=>e.currentTarget.style.borderColor=relColor}
                          onMouseLeave={e=>e.currentTarget.style.borderColor=`${relColor}66`}>
                          <Avatar src={c.image} name={c.name} size={34}/>
                          <div>
                            <div style={{ fontSize:13, color:"#e8d5b7", fontWeight:600 }}>{c.name} <span style={{ fontSize:10, color:"#7c5cbf", opacity:.8 }}>↗</span></div>
                            <div style={{ fontSize:11, color:relColor, fontWeight:700 }}>{rel.type}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {(char.links||[]).filter(l=>l.url).length>0&&(
                <div style={{ flex:"1 1 100%", padding:"14px 24px", borderTop:"1px solid #1e1630" }}>
                  <div style={{ fontSize:11, color:"#7c5cbf", letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>🔗 External Links</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {(char.links||[]).filter(l=>l.url).map(lnk=>(
                      <a key={lnk.id} href={lnk.url} target="_blank" rel="noopener noreferrer"
                        style={{ display:"inline-flex", alignItems:"center", gap:6, color:"#7c9cbf", fontSize:13, textDecoration:"none", width:"fit-content" }}
                        onMouseEnter={e=>e.currentTarget.style.textDecoration="underline"}
                        onMouseLeave={e=>e.currentTarget.style.textDecoration="none"}>
                        <span style={{ fontSize:11 }}>↗</span>
                        {lnk.label||lnk.url}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {subTab==="items"&&<ItemsTab char={char} onUpdateChar={onUpdateChar} artifacts={artifacts||[]} onUpdateArtifacts={onUpdateArtifacts}/>}
          {subTab==="timeline"&&(
            <div style={{ padding:"20px 24px" }}>
              {charEvents.length===0 ? (
                <div style={{ textAlign:"center", padding:"40px 0", color:"#5a4a7a" }}>
                  <div style={{ fontSize:36, marginBottom:10 }}>⏳</div>
                  <div style={{ fontSize:14, fontFamily:"Georgia,serif" }}>No events linked to this character.</div>
                </div>
              ) : (
                <CharTimeline evGroupMap={evGroupMap} evGroupOrder={evGroupOrder} evUndated={evUndated} stories={stories} onOpenStory={onOpenStory}/>
              )}
            </div>
          )}
          {isPlayer&&subTab==="files"&&onUpdateChar&&<FilesPanel char={char} onUpdateChar={onUpdateChar}/>}
        </>
      )}
      <Lightbox src={lightbox} onClose={()=>setLightbox(null)}/>
    </div>
  );
}

export default memo(CharDetailPanel);
