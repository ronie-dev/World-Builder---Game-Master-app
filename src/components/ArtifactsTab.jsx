import { useState, useEffect, memo } from "react";
import { uid } from "../utils.jsx";
import { RARITIES, RARITY_COLORS, defaultArtifact, inputStyle, btnPrimary, btnSecondary, iconBtn } from "../constants.js";
import Avatar from "./Avatar.jsx";
import ImageUploadZone from "./ImageUploadZone.jsx";

function HolderPicker({ chars, holderId, onChange }) {
  const [search, setSearch] = useState("");
  const filtered = chars.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <div style={{ position:"relative", marginBottom:6 }}>
        <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#5a4a7a", fontSize:13 }}>🔍</span>
        <input placeholder="Search characters…" value={search} onChange={e => setSearch(e.target.value)} style={{...inputStyle, paddingLeft:30, fontSize:13}}/>
      </div>
      <div style={{ maxHeight:150, overflowY:"auto", border:"1px solid #2a1f3d", borderRadius:8 }}>
        <div onClick={() => onChange(null)}
          style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", cursor:"pointer", background:!holderId?"#2a1f3d":"transparent", borderBottom:"1px solid #1e1630" }}
          onMouseEnter={e => { if(holderId) e.currentTarget.style.background="#1e1630"; }}
          onMouseLeave={e => { if(holderId) e.currentTarget.style.background="transparent"; }}>
          <div style={{ width:28, height:28, borderRadius:"50%", background:"#1e1630", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>—</div>
          <span style={{ fontSize:13, color:"#9a7fa0", flex:1 }}>Unowned / Unknown</span>
          <div style={{ fontSize:15, color:!holderId?"#7c5cbf":"#3a2a5a" }}>{!holderId?"✓":"+"}</div>
        </div>
        {filtered.map(c => {
          const sel = holderId === c.id;
          return (
            <div key={c.id} onClick={() => onChange(c.id)}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", cursor:"pointer", background:sel?"#2a1f3d":"transparent", borderBottom:"1px solid #1e1630" }}
              onMouseEnter={e => { if(!sel) e.currentTarget.style.background="#1e1630"; }}
              onMouseLeave={e => { if(!sel) e.currentTarget.style.background="transparent"; }}>
              <Avatar src={c.image} name={c.name} size={28}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, color:"#e8d5b7" }}>{c.name}</div>
                <div style={{ fontSize:11, color:"#9a7fa0" }}>{c.type==="player"?"🎲":c.type==="main"?"⭐":"👤"} {c.type}</div>
              </div>
              <div style={{ fontSize:15, color:sel?"#7c5cbf":"#3a2a5a" }}>{sel?"✓":"+"}</div>
            </div>
          );
        })}
        {filtered.length === 0 && <div style={{ padding:"12px 16px", color:"#5a4a7a", fontSize:13 }}>No characters found.</div>}
      </div>
    </div>
  );
}

function ArtifactModal({ artifact, chars, stories, onClose, onSave }) {
  const [form, setForm] = useState({ ...defaultArtifact, ...artifact });
  const set = (k, v) => setForm(f => ({...f, [k]: v}));
  const toggleStory = id => set("storyIds", form.storyIds.includes(id) ? form.storyIds.filter(x => x !== id) : [...form.storyIds, id]);

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#1a1228", border:"1px solid #7c5cbf", borderRadius:12, padding:28, width:520, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 0 40px #7c5cbf44" }}>
        <h2 style={{ color:"#e8d5b7", margin:"0 0 20px", fontFamily:"Georgia,serif" }}>{form.id ? "Edit" : "New"} Item / Artifact</h2>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Image</label>
          <ImageUploadZone value={form.image} onChange={src=>set("image",src)}/>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Name *</label>
          <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Item name…" style={inputStyle}/>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:6, letterSpacing:1, textTransform:"uppercase" }}>Rarity</label>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {RARITIES.map(r => {
              const color = RARITY_COLORS[r];
              const sel = form.rarity === r;
              return (
                <div key={r} onClick={() => set("rarity", r)}
                  style={{ padding:"4px 12px", borderRadius:14, cursor:"pointer", fontSize:12, transition:"all .12s",
                    border:`1px solid ${sel ? color : "#3a2a5a"}`,
                    background: sel ? color + "33" : "transparent",
                    color: sel ? color : "#7a7a9a" }}>
                  {r}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Value</label>
          <input value={form.value} onChange={e => set("value", e.target.value)} placeholder="e.g. 500 gp, Priceless…" style={inputStyle}/>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Short Description</label>
          <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2} placeholder="Brief item description…" style={{...inputStyle, resize:"vertical"}}/>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Lore / History</label>
          <textarea value={form.lore} onChange={e => set("lore", e.target.value)} rows={4} placeholder="Origin, history, past owners, legends…" style={{...inputStyle, resize:"vertical"}}/>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:6, letterSpacing:1, textTransform:"uppercase" }}>Current Holder</label>
          {form.holderId && (() => {
            const c = chars.find(x => x.id === form.holderId);
            return c ? (
              <div style={{ display:"flex", alignItems:"center", gap:8, background:"#2a1f3d", border:"1px solid #7c5cbf", borderRadius:20, padding:"4px 10px 4px 6px", marginBottom:8, width:"fit-content" }}>
                <Avatar src={c.image} name={c.name} size={22}/>
                <span style={{ fontSize:13, color:"#e8d5b7" }}>{c.name}</span>
                <button onClick={() => set("holderId", null)} style={{ background:"none", border:"none", color:"#c06060", cursor:"pointer", fontSize:14, padding:0 }}>×</button>
              </div>
            ) : null;
          })()}
          <HolderPicker chars={chars} holderId={form.holderId} onChange={id => set("holderId", id)}/>
        </div>
        {stories.length > 0 && (
          <div style={{ marginBottom:20 }}>
            <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:6, letterSpacing:1, textTransform:"uppercase" }}>Linked Stories</label>
            <div style={{ display:"flex", flexDirection:"column", gap:4, maxHeight:140, overflowY:"auto" }}>
              {stories.map(s => {
                const checked = form.storyIds.includes(s.id);
                return (
                  <div key={s.id} onClick={() => toggleStory(s.id)}
                    style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 10px", borderRadius:6, cursor:"pointer", background:checked ? "#2a1f50" : "transparent", border:`1px solid ${checked ? "#7c5cbf" : "#2a1f3d"}`, transition:"all .12s" }}>
                    <div style={{ width:14, height:14, borderRadius:3, border:`2px solid ${checked ? "#7c5cbf" : "#5a4a7a"}`, background:checked ? "#7c5cbf" : "transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {checked && <span style={{ fontSize:9, color:"#fff", lineHeight:1 }}>✓</span>}
                    </div>
                    <span style={{ fontSize:13, color:checked ? "#e8d5b7" : "#9a7fa0" }}>{s.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={() => onSave(form)} disabled={!form.name.trim()} style={{...btnPrimary, flex:1}}>Save</button>
          <button onClick={onClose} style={{...btnSecondary, flex:1}}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function ArtifactDetail({ artifact, chars, stories, onEdit, onDelete, onClose, onOpenChar, onOpenStory }) {
  const [imgOpen, setImgOpen] = useState(false);
  if (!artifact) return null;
  const rarityColor = RARITY_COLORS[artifact.rarity] || "#9a9a9a";
  const holder = artifact.holderId ? chars.find(c => c.id === artifact.holderId) : null;
  const linkedStories = (artifact.storyIds || []).map(id => stories.find(s => s.id === id)).filter(Boolean);
  return (
    <div style={{ background:"#13101f", border:`1px solid ${rarityColor}66`, borderTop:`3px solid ${rarityColor}`, borderRadius:12, overflow:"hidden", boxShadow:"0 4px 32px #00000044" }}>
      {imgOpen && artifact.image && (
        <div onClick={() => setImgOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.92)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", cursor:"zoom-out" }}>
          <img src={artifact.image} alt="" style={{ maxWidth:"90vw", maxHeight:"90vh", borderRadius:10, boxShadow:"0 0 60px #000", objectFit:"contain" }}/>
        </div>
      )}
      <div style={{ padding:"18px 20px", borderBottom:"1px solid #1e1630", display:"flex", alignItems:"flex-start", gap:14 }}>
        {artifact.image
          ? <img src={artifact.image} alt="" onClick={() => setImgOpen(true)} style={{ width:72, height:72, borderRadius:8, objectFit:"cover", flexShrink:0, border:`1px solid ${rarityColor}44`, cursor:"zoom-in" }}/>
          : <div style={{ width:72, height:72, borderRadius:8, background:"#1e1630", border:`1px solid #2a1f3d`, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32 }}>⚗️</div>}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
            <span style={{ fontFamily:"Georgia,serif", fontWeight:700, fontSize:18, color:"#e8d5b7" }}>{artifact.name}</span>
            <span style={{ fontSize:11, color:rarityColor, background:rarityColor+"22", border:`1px solid ${rarityColor}44`, borderRadius:8, padding:"2px 8px" }}>{artifact.rarity}</span>
          </div>
          {artifact.value && <div style={{ fontSize:13, color:"#c8a96e", fontWeight:700 }}>🪙 {artifact.value}</div>}
        </div>
        <div style={{ display:"flex", gap:6, flexShrink:0 }}>
          <button onClick={onEdit} style={{...btnPrimary, fontSize:12, padding:"5px 12px"}}>✏️ Edit</button>
          <button onClick={onClose} style={{...btnSecondary, fontSize:18, padding:"2px 10px", lineHeight:1}}>×</button>
        </div>
      </div>
      <div>
        {artifact.description && (
          <div style={{ padding:"14px 20px", borderBottom:"1px solid #1e1630" }}>
            <div style={{ fontSize:11, color:"#7c5cbf", letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>Description</div>
            <div style={{ fontSize:13, color:"#b09080", lineHeight:1.6, whiteSpace:"pre-wrap" }}>{artifact.description}</div>
          </div>
        )}
        {artifact.lore && (
          <div style={{ padding:"14px 20px", borderBottom:"1px solid #1e1630" }}>
            <div style={{ fontSize:11, color:"#7c5cbf", letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>📖 Lore / History</div>
            <div style={{ fontSize:13, color:"#8a7a9a", lineHeight:1.7, fontStyle:"italic", whiteSpace:"pre-wrap" }}>{artifact.lore}</div>
          </div>
        )}
        <div style={{ display:"flex" }}>
          <div style={{ flex:1, padding:"14px 20px", borderRight:"1px solid #1e1630" }}>
            <div style={{ fontSize:11, color:"#7c5cbf", letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>👤 Holder</div>
            {holder ? (
              <div
                onClick={e=>{ if(e.ctrlKey||e.metaKey){e.preventDefault();onOpenChar&&onOpenChar(holder,{newTab:true});}else{onOpenChar&&onOpenChar(holder);} }}
                onAuxClick={e=>{ if(e.button===1){e.preventDefault();onOpenChar&&onOpenChar(holder,{newTab:true});} }}
                style={{ display:"flex", alignItems:"center", gap:8, background:"#1e1630", border:"1px solid #3a2a5a", borderRadius:8, padding:"8px 12px", cursor:"pointer", width:"fit-content", transition:"border-color .15s" }}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#7c5cbf"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="#3a2a5a"}>
                <Avatar src={holder.image} name={holder.name} size={30}/>
                <div>
                  <div style={{ fontSize:13, color:"#e8d5b7", fontWeight:600 }}>{holder.name} <span style={{ fontSize:10, color:"#7c5cbf" }}>↗</span></div>
                  <div style={{ fontSize:11, color:"#9a7fa0" }}>{holder.type}</div>
                </div>
              </div>
            ) : <span style={{ fontSize:13, color:"#4a3a5a" }}>Unowned</span>}
          </div>
          {linkedStories.length > 0 && (
            <div style={{ flex:1, padding:"14px 20px" }}>
              <div style={{ fontSize:11, color:"#7c5cbf", letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>📜 Linked Stories</div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {linkedStories.map(s => (
                  <div key={s.id}
                    onClick={e=>{ if(e.ctrlKey||e.metaKey){e.preventDefault();onOpenStory?.(s,null,{newTab:true});}else{onOpenStory?.(s);} }}
                    onAuxClick={e=>{ if(e.button===1){e.preventDefault();onOpenStory?.(s,null,{newTab:true});} }}
                    style={{ fontSize:12, color: onOpenStory ? "#c8b8e8" : "#9a7fa0", background:"#7c5cbf22", border:"1px solid #7c5cbf44", borderRadius:6, padding:"4px 10px", cursor: onOpenStory ? "pointer" : "default", transition:"border-color .12s, background .12s" }}
                    onMouseEnter={e => { if(onOpenStory){ e.currentTarget.style.borderColor="#7c5cbf99"; e.currentTarget.style.background="#7c5cbf33"; }}}
                    onMouseLeave={e => { if(onOpenStory){ e.currentTarget.style.borderColor="#7c5cbf44"; e.currentTarget.style.background="#7c5cbf22"; }}}>
                    {s.name} {onOpenStory && <span style={{ fontSize:10, opacity:.6 }}>↗</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={{ padding:"10px 20px", borderTop:"1px solid #1e1630", display:"flex", justifyContent:"flex-end" }}>
          <button onClick={onDelete} style={{...btnSecondary, fontSize:12, color:"#c06060", borderColor:"#6b1a1a"}}>🗑️ Delete</button>
        </div>
      </div>
    </div>
  );
}

function ArtifactsTab({ artifacts, onUpdateArtifacts, chars, stories, onOpenChar, onOpenStory, onAskConfirm, onCloseConfirm, navArtifactId }) {
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [rarityFilter, setRarityFilter] = useState("");

  useEffect(() => {
    if (!navArtifactId) return;
    const a = artifacts.find(x => x.id === navArtifactId);
    if (a) setSelected(a);
  }, [navArtifactId]); // eslint-disable-line

  const saveArtifact = form => {
    const updated = form.id
      ? artifacts.map(a => a.id === form.id ? form : a)
      : [{ ...form, id: uid() }, ...artifacts];
    onUpdateArtifacts(updated);
    if (form.id && selected?.id === form.id) setSelected(form);
    setModal(null);
  };

  const deleteArtifact = id => {
    const a = artifacts.find(x => x.id === id);
    onAskConfirm(`Delete "${a?.name || "this artifact"}"?`, () => {
      onUpdateArtifacts(artifacts.filter(x => x.id !== id));
      if (selected?.id === id) setSelected(null);
      onCloseConfirm();
    });
  };

  const q = search.trim().toLowerCase();
  const filtered = artifacts.filter(a =>
    (!q || a.name.toLowerCase().includes(q) || (a.description||"").toLowerCase().includes(q) || (a.lore||"").toLowerCase().includes(q)) &&
    (!rarityFilter || a.rarity === rarityFilter)
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", flex:1, overflow:"hidden", minHeight:0, padding:"28px 32px 0" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18, flexShrink:0 }}>
        <h1 style={{ fontFamily:"Georgia,serif", color:"#e8d5b7", margin:0, fontSize:26 }}>Items & Artifacts</h1>
        <button onClick={() => setModal({ ...defaultArtifact })} style={btnPrimary}>+ New Item</button>
      </div>

      <div style={{ flex:1, display:"flex", gap:24, overflow:"hidden", minHeight:0, paddingBottom:28 }}>
        {/* Left column */}
        <div style={{ flex:1, minWidth:0, overflowY:"auto", paddingRight:12 }}>
          {/* Search + rarity filters */}
          <div style={{ marginBottom:12 }}>
            <div style={{ position:"relative", marginBottom:8 }}>
              <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#5a4a7a", fontSize:13 }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items…"
                style={{...inputStyle, paddingLeft:30, fontSize:13}}/>
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              <div onClick={() => setRarityFilter("")}
                style={{ padding:"3px 10px", borderRadius:14, cursor:"pointer", fontSize:11, border:`1px solid ${!rarityFilter?"#7c5cbf":"#3a2a5a"}`, background:!rarityFilter?"#7c5cbf33":"transparent", color:!rarityFilter?"#c8b8e8":"#7a7a9a" }}>
                All
              </div>
              {RARITIES.map(r => {
                const color = RARITY_COLORS[r];
                const sel = rarityFilter === r;
                return (
                  <div key={r} onClick={() => setRarityFilter(sel ? "" : r)}
                    style={{ padding:"3px 10px", borderRadius:14, cursor:"pointer", fontSize:11, border:`1px solid ${sel ? color : "#3a2a5a"}`, background:sel ? color+"33" : "transparent", color:sel ? color : "#7a7a9a" }}>
                    {r}
                  </div>
                );
              })}
            </div>
          </div>

          {/* List */}
          {filtered.length === 0 ? (
            <div style={{ textAlign:"center", padding:"60px 0", color:"#5a4a7a", border:"1px dashed #2a1f3d", borderRadius:12 }}>
              <div style={{ fontSize:40, marginBottom:12 }}>⚗️</div>
              <div style={{ fontFamily:"Georgia,serif", fontSize:15 }}>{artifacts.length === 0 ? "No items yet" : "No matches"}</div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {filtered.map(a => {
                const rarityColor = RARITY_COLORS[a.rarity] || "#9a9a9a";
                const holder = a.holderId ? chars.find(c => c.id === a.holderId) : null;
                const isSel = selected?.id === a.id;
                return (
                  <div key={a.id} onClick={() => setSelected(prev => prev?.id === a.id ? null : a)}
                    style={{ background:isSel?"#1e1535":"#1a1228", border:`1px solid ${isSel?rarityColor:rarityColor+"44"}`, borderLeft:`3px solid ${rarityColor}`, borderRadius:10, padding:"10px 14px", display:"flex", gap:10, alignItems:"center", cursor:"pointer", transition:"border-color .15s, background .15s", userSelect:"none" }}
                    onMouseEnter={e=>{ if(!isSel){ e.currentTarget.style.borderColor=rarityColor+"99"; e.currentTarget.style.borderLeftColor=rarityColor; }}}
                    onMouseLeave={e=>{ if(!isSel){ e.currentTarget.style.borderColor=rarityColor+"44"; e.currentTarget.style.borderLeftColor=rarityColor; }}}>
                    {a.image
                      ? <img src={a.image} alt="" style={{ width:40, height:40, borderRadius:6, objectFit:"cover", flexShrink:0, border:`1px solid ${rarityColor}44` }}/>
                      : <div style={{ width:40, height:40, borderRadius:6, background:"#1e1630", border:`1px solid #2a1f3d`, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>⚗️</div>}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                        <span style={{ fontFamily:"Georgia,serif", fontWeight:700, fontSize:14, color:"#e8d5b7" }}>{a.name}</span>
                        <span style={{ fontSize:10, color:rarityColor, background:rarityColor+"22", borderRadius:6, padding:"1px 6px" }}>{a.rarity}</span>
                        {a.value && <span style={{ fontSize:11, color:"#c8a96e" }}>🪙 {a.value}</span>}
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        {holder
                          ? <div style={{ display:"flex", alignItems:"center", gap:4 }}><Avatar src={holder.image} name={holder.name} size={14}/><span style={{ fontSize:11, color:"#9a7fa0" }}>{holder.name}</span></div>
                          : <span style={{ fontSize:11, color:"#4a3a5a" }}>Unowned</span>}
                        {a.description && <span style={{ fontSize:11, color:"#6a5a7a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.description}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column — detail panel */}
        <div style={{ flex:1, minWidth:0, overflowY:"auto" }}>
          {selected ? (
            <ArtifactDetail
              artifact={selected}
              chars={chars}
              stories={stories}
              onEdit={() => setModal({...selected})}
              onDelete={() => deleteArtifact(selected.id)}
              onClose={() => setSelected(null)}
              onOpenChar={onOpenChar}
              onOpenStory={onOpenStory}
            />
          ) : (
            <div style={{ background:"#13101f", border:"1px dashed #2a1f3d", borderRadius:12, padding:"48px 24px", textAlign:"center", color:"#3a2a5a" }}>
              <div style={{ fontSize:40, marginBottom:12 }}>⚗️</div>
              <div style={{ fontSize:14, fontFamily:"Georgia,serif" }}>Select an item to view details</div>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <ArtifactModal artifact={modal} chars={chars} stories={stories} onClose={() => setModal(null)} onSave={saveArtifact}/>
      )}
    </div>
  );
}

export default memo(ArtifactsTab);
