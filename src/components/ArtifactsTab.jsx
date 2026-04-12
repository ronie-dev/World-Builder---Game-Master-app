import { useState, useEffect, useRef, memo } from "react";
import { uid } from "../utils.jsx";
import { DEFAULT_RARITIES, defaultArtifact, inputStyle, ghostInput, ghostTextarea, btnPrimary, btnSecondary } from "../constants.js";
import Avatar from "./Avatar.jsx";
import ImageUploadZone from "./ImageUploadZone.jsx";

// ── Holder Picker ──────────────────────────────────────────────────────────────
function HolderPicker({ chars, holderId, onChange }) {
  const [search, setSearch] = useState("");
  const filtered = chars.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <div style={{ position:"relative", marginBottom:6 }}>
        <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#5a4a7a", fontSize:13 }}>🔍</span>
        <input placeholder="Search characters…" value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, paddingLeft:30, fontSize:13 }}/>
      </div>
      <div style={{ maxHeight:150, overflowY:"auto", border:"1px solid #2a1f3d", borderRadius:8 }}>
        <div onClick={() => onChange(null)}
          style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", cursor:"pointer", background:!holderId?"#2a1f3d":"transparent", borderBottom:"1px solid #1e1630" }}
          onMouseEnter={e => { if (holderId) e.currentTarget.style.background="#1e1630"; }}
          onMouseLeave={e => { if (holderId) e.currentTarget.style.background="transparent"; }}>
          <div style={{ width:28, height:28, borderRadius:"50%", background:"#1e1630", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>—</div>
          <span style={{ fontSize:13, color:"#9a7fa0", flex:1 }}>Unowned / Unknown</span>
          <div style={{ fontSize:15, color:!holderId?"#7c5cbf":"#3a2a5a" }}>{!holderId?"✓":"+"}</div>
        </div>
        {filtered.map(c => {
          const sel = holderId === c.id;
          return (
            <div key={c.id} onClick={() => onChange(c.id)}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", cursor:"pointer", background:sel?"#2a1f3d":"transparent", borderBottom:"1px solid #1e1630" }}
              onMouseEnter={e => { if (!sel) e.currentTarget.style.background="#1e1630"; }}
              onMouseLeave={e => { if (!sel) e.currentTarget.style.background="transparent"; }}>
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

// ── Artifact Detail Panel ──────────────────────────────────────────────────────
function ArtifactDetailPanel({ artifact, chars, stories, onSave, onDelete, onClose, onCancelNew, onOpenChar, onOpenStory, rarities }) {
  const [form, setForm] = useState({ ...defaultArtifact, ...artifact });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [holderPickerOpen, setHolderPickerOpen] = useState(false);
  const [storyPickerOpen, setStoryPickerOpen] = useState(false);
  const [storySearch, setStorySearch] = useState("");
  const [imgOpen, setImgOpen] = useState(false);
  const [prevId, setPrevId] = useState(artifact?.id);
  const descRef = useRef(null);
  const loreRef = useRef(null);

  if (artifact?.id !== prevId) {
    setPrevId(artifact?.id);
    setForm({ ...defaultArtifact, ...artifact });
    setConfirmDelete(false);
    setHolderPickerOpen(false);
    setStoryPickerOpen(false);
  }

  const rList = rarities || DEFAULT_RARITIES;
  const rarityColors = Object.fromEntries(rList.map(r => [r.name, r.color]));

  // Auto-expand textareas
  useEffect(() => {
    for (const ref of [descRef, loreRef]) {
      const el = ref.current;
      if (!el) continue;
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  }, [form.description, form.lore]);

  if (!artifact) return null;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const saveImmediate = (k, v) => { set(k, v); onSave({ ...artifact, ...form, [k]: v }); };
  const saveForm = () => onSave({ ...artifact, ...form });

  const rarityColor = rarityColors[form.rarity] || "#9a9a9a";
  const holder = form.holderId ? chars.find(c => c.id === form.holderId) : null;
  const linkedStories = (form.storyIds||[]).map(id => stories.find(s => s.id === id)).filter(Boolean);
  const toggleStory = id => {
    const ids = (form.storyIds||[]).includes(id)
      ? (form.storyIds||[]).filter(x => x !== id)
      : [...(form.storyIds||[]), id];
    saveImmediate("storyIds", ids);
  };

  return (
    <div style={{ background:"#13101f", border:`1px solid ${rarityColor}88`, borderTop:`3px solid ${rarityColor}`, borderRadius:12, overflow:"hidden", boxShadow:"0 4px 32px #7c5cbf22", animation:"slideDown .18s ease" }}>
      <style>{`@keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Image lightbox */}
      {imgOpen && form.image && (
        <div onClick={() => setImgOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.92)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", cursor:"zoom-out" }}>
          <img src={form.image} alt="" style={{ maxWidth:"90vw", maxHeight:"90vh", borderRadius:10, boxShadow:"0 0 60px #000", objectFit:"contain" }}/>
        </div>
      )}

      {/* Header */}
      <div style={{ background:`linear-gradient(90deg,${rarityColor}33,#13101f)`, padding:"18px 24px", borderBottom:"1px solid #2a1f3d" }}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:16 }}>
          {/* Image */}
          <div style={{ flexShrink:0 }}>
            <ImageUploadZone value={form.image} onChange={src => saveImmediate("image", src)} size="sm"/>
            {form.image && (
              <button onClick={() => setImgOpen(true)}
                style={{ display:"block", marginTop:4, width:"100%", fontSize:10, color:"#5a4a7a", background:"none", border:"none", cursor:"pointer", padding:0 }}>
                zoom
              </button>
            )}
          </div>

          {/* Name + rarity + value */}
          <div style={{ flex:1, minWidth:0 }}>
            <input value={form.name}
              onChange={e => set("name", e.target.value)}
              onBlur={e => { e.target.style.borderColor="transparent"; e.target.style.background="transparent"; saveForm(); }}
              placeholder="Item name…"
              autoFocus={artifact._isNew}
              style={{ ...ghostInput, fontSize:18, fontFamily:"Georgia,serif", fontWeight:700, color:"#e8d5b7", width:"100%", marginBottom:8, borderColor:"transparent" }}
              onMouseEnter={e => { if (document.activeElement!==e.target) e.target.style.background="#ffffff0a"; }}
              onMouseLeave={e => { if (document.activeElement!==e.target) e.target.style.background="transparent"; }}
              onFocus={e => { e.target.style.borderColor="#3a2a5a"; e.target.style.background="transparent"; }}
            />
            {/* Rarity pills */}
            <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:8 }}>
              {rList.map(r => {
                const rc = rarityColors[r.name];
                const sel = form.rarity === r.name;
                return (
                  <div key={r.name} onClick={() => saveImmediate("rarity", r.name)}
                    style={{ padding:"3px 10px", borderRadius:14, cursor:"pointer", fontSize:11, transition:"all .12s",
                      border:`1px solid ${sel ? rc : "#3a2a5a"}`,
                      background: sel ? rc+"33" : "transparent",
                      color: sel ? rc : "#7a7a9a" }}>
                    {r.name}
                  </div>
                );
              })}
            </div>
            {/* Value */}
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:13, color:"#5a4a7a" }}>🪙</span>
              <input value={form.value}
                onChange={e => set("value", e.target.value)}
                onBlur={e => { e.target.style.borderColor="transparent"; e.target.style.background="transparent"; saveForm(); }}
                placeholder="Value (e.g. 500 gp)…"
                style={{ ...ghostInput, flex:1, borderColor:"transparent", color:"#c8a96e" }}
                onMouseEnter={e => { if (document.activeElement!==e.target) e.target.style.background="#ffffff0a"; }}
                onMouseLeave={e => { if (document.activeElement!==e.target) e.target.style.background="transparent"; }}
                onFocus={e => { e.target.style.borderColor="#3a2a5a"; e.target.style.background="transparent"; }}
              />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display:"flex", gap:8, flexShrink:0 }}>
            {artifact._isNew && (
              <button onClick={onCancelNew} style={{ ...btnSecondary, fontSize:12, padding:"6px 14px" }}>Discard</button>
            )}
            {!artifact._isNew && (confirmDelete ? (
              <>
                <span style={{ fontSize:12, color:"#c8b89a", alignSelf:"center" }}>Delete?</span>
                <button onClick={() => { setConfirmDelete(false); onDelete(); }} style={{ ...btnSecondary, fontSize:12, padding:"4px 10px", color:"#c06060", borderColor:"#6b1a1a" }}>Yes</button>
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
        <div style={{ padding:"14px 24px", borderBottom:"1px solid #1e1630" }}>
          <div style={{ fontSize:11, color:"#7c5cbf", letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>Description</div>
          <textarea ref={descRef} value={form.description}
            onChange={e => { set("description", e.target.value); e.target.style.height="auto"; e.target.style.height=e.target.scrollHeight+"px"; }}
            onBlur={e => { e.target.style.borderColor="transparent"; e.target.style.background="transparent"; saveForm(); }}
            onMouseEnter={e => { if (document.activeElement!==e.target) e.target.style.background="#ffffff0a"; }}
            onMouseLeave={e => { if (document.activeElement!==e.target) e.target.style.background="transparent"; }}
            onFocus={e => { e.target.style.borderColor="#3a2a5a"; e.target.style.background="transparent"; }}
            placeholder="Brief item description…"
            style={{ ...ghostTextarea, minHeight:40, borderColor:"transparent" }}
          />
        </div>

        {/* Lore */}
        <div style={{ padding:"14px 24px", borderBottom:"1px solid #1e1630" }}>
          <div style={{ fontSize:11, color:"#7c5cbf", letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>📖 Lore / History</div>
          <textarea ref={loreRef} value={form.lore}
            onChange={e => { set("lore", e.target.value); e.target.style.height="auto"; e.target.style.height=e.target.scrollHeight+"px"; }}
            onBlur={e => { e.target.style.borderColor="transparent"; e.target.style.background="transparent"; saveForm(); }}
            onMouseEnter={e => { if (document.activeElement!==e.target) e.target.style.background="#ffffff0a"; }}
            onMouseLeave={e => { if (document.activeElement!==e.target) e.target.style.background="transparent"; }}
            onFocus={e => { e.target.style.borderColor="#3a2a5a"; e.target.style.background="transparent"; }}
            placeholder="Origin, history, past owners, legends…"
            style={{ ...ghostTextarea, minHeight:60, color:"#8a7a9a", fontStyle:"italic", borderColor:"transparent" }}
          />
        </div>

        {/* Holder + Stories */}
        <div style={{ display:"flex", borderBottom:"1px solid #1e1630" }}>
          {/* Holder */}
          <div style={{ flex:1, padding:"14px 24px", borderRight:"1px solid #1e1630" }}>
            <div style={{ fontSize:11, color:"#7c5cbf", letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>👤 Holder</div>
            {holder ? (
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <div
                  onClick={e => { if (e.ctrlKey||e.metaKey) { e.preventDefault(); onOpenChar?.(holder,{newTab:true}); } else { onOpenChar?.(holder); } }}
                  onAuxClick={e => { if (e.button===1) { e.preventDefault(); onOpenChar?.(holder,{newTab:true}); } }}
                  style={{ display:"flex", alignItems:"center", gap:8, background:"#1e1630", border:"1px solid #3a2a5a", borderRadius:8, padding:"6px 10px", cursor:"pointer", flex:1, transition:"border-color .15s" }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor="#7c5cbf"}
                  onMouseLeave={e=>e.currentTarget.style.borderColor="#3a2a5a"}>
                  <Avatar src={holder.image} name={holder.name} size={28}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, color:"#e8d5b7", fontWeight:600 }}>{holder.name} <span style={{ fontSize:10, color:"#7c5cbf" }}>↗</span></div>
                    <div style={{ fontSize:11, color:"#9a7fa0" }}>{holder.type}</div>
                  </div>
                </div>
                <button onClick={() => saveImmediate("holderId", null)}
                  style={{ background:"none", border:"none", color:"#4a3a6a", cursor:"pointer", fontSize:16, padding:"0 4px", lineHeight:1 }}
                  onMouseEnter={e=>e.currentTarget.style.color="#c06060"}
                  onMouseLeave={e=>e.currentTarget.style.color="#4a3a6a"}>×</button>
              </div>
            ) : (
              <span style={{ fontSize:13, color:"#4a3a5a" }}>Unowned</span>
            )}
            <button onClick={() => setHolderPickerOpen(v => !v)}
              style={{ fontSize:11, color:"#5a4a7a", background:"none", border:"none", cursor:"pointer", padding:0, marginTop:6 }}
              onMouseEnter={e=>e.currentTarget.style.color="#9a7fa0"}
              onMouseLeave={e=>e.currentTarget.style.color="#5a4a7a"}>
              {holderPickerOpen ? "▲ close" : "▼ change holder"}
            </button>
            {holderPickerOpen && (
              <div style={{ marginTop:8 }}>
                <HolderPicker chars={chars} holderId={form.holderId} onChange={id => { saveImmediate("holderId", id); setHolderPickerOpen(false); }}/>
              </div>
            )}
          </div>

          {/* Stories */}
          <div style={{ flex:1, padding:"14px 24px" }}>
            <div style={{ fontSize:11, color:"#7c5cbf", letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>📜 Linked Stories</div>
            {linkedStories.length > 0 && (
              <div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:8 }}>
                {linkedStories.map(s => (
                  <div key={s.id} style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <div
                      onClick={e => { if (e.ctrlKey||e.metaKey) { e.preventDefault(); onOpenStory?.(s,null,{newTab:true}); } else { onOpenStory?.(s); } }}
                      onAuxClick={e => { if (e.button===1) { e.preventDefault(); onOpenStory?.(s,null,{newTab:true}); } }}
                      style={{ fontSize:12, color:"#c8b8e8", background:"#7c5cbf22", border:"1px solid #7c5cbf44", borderRadius:6, padding:"3px 10px", cursor:"pointer", flex:1, transition:"border-color .12s" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor="#7c5cbf99"}
                      onMouseLeave={e => e.currentTarget.style.borderColor="#7c5cbf44"}>
                      {s.name} <span style={{ fontSize:10, opacity:.6 }}>↗</span>
                    </div>
                    <button onClick={() => toggleStory(s.id)}
                      style={{ background:"none", border:"none", color:"#4a3a6a", cursor:"pointer", fontSize:14, padding:"0 3px", lineHeight:1, flexShrink:0 }}
                      onMouseEnter={e=>e.currentTarget.style.color="#c06060"}
                      onMouseLeave={e=>e.currentTarget.style.color="#4a3a6a"}>×</button>
                  </div>
                ))}
              </div>
            )}
            {stories.length > 0 && (
              <>
                <button onClick={() => setStoryPickerOpen(v => !v)}
                  style={{ fontSize:11, color:"#5a4a7a", background:"none", border:"none", cursor:"pointer", padding:0 }}
                  onMouseEnter={e=>e.currentTarget.style.color="#9a7fa0"}
                  onMouseLeave={e=>e.currentTarget.style.color="#5a4a7a"}>
                  {storyPickerOpen ? "▲ close" : "＋ link story"}
                </button>
                {storyPickerOpen && (
                  <div style={{ marginTop:8 }}>
                    <div style={{ position:"relative", marginBottom:6 }}>
                      <span style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", color:"#5a4a7a", fontSize:12 }}>🔍</span>
                      <input value={storySearch} onChange={e=>setStorySearch(e.target.value)} placeholder="Search stories…"
                        style={{ ...inputStyle, paddingLeft:26, fontSize:12, padding:"5px 8px 5px 26px" }}/>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:4, maxHeight:140, overflowY:"auto" }}>
                      {stories.filter(s => !storySearch || s.name.toLowerCase().includes(storySearch.toLowerCase())).map(s => {
                        const checked = (form.storyIds||[]).includes(s.id);
                        return (
                          <div key={s.id} onClick={() => toggleStory(s.id)}
                            style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 8px", borderRadius:6, cursor:"pointer", background:checked?"#2a1f50":"transparent", border:`1px solid ${checked?"#7c5cbf":"#2a1f3d"}`, transition:"all .12s" }}>
                            <div style={{ width:13, height:13, borderRadius:3, border:`2px solid ${checked?"#7c5cbf":"#5a4a7a"}`, background:checked?"#7c5cbf":"transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                              {checked && <span style={{ fontSize:9, color:"#fff", lineHeight:1 }}>✓</span>}
                            </div>
                            <span style={{ fontSize:12, color:checked?"#e8d5b7":"#9a7fa0" }}>{s.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
            {linkedStories.length === 0 && !storyPickerOpen && (
              <span style={{ fontSize:13, color:"#4a3a5a" }}>None linked.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Compact artifact row ───────────────────────────────────────────────────────
// ── Column header with searchable filter dropdown ─────────────────────────────
function ColHeader({ id, label, value, onChange, opts, style, openId, onOpen, alignRight }) {
  const [q, setQ] = useState("");
  const open = openId === id;
  const active = !!value;
  const selected = opts?.find(o => o.value === value);
  const filteredOpts = opts?.filter(o => !q || o.label.toLowerCase().includes(q.toLowerCase()));
  useEffect(() => { if (!open) setQ(""); }, [open]);
  return (
    <div style={{ position:"relative", ...style }}>
      <div onClick={() => opts && onOpen(open ? null : id)}
        style={{ display:"flex", alignItems:"center", gap:3, padding:"5px 8px", fontSize:11, fontWeight:700, letterSpacing:.5, textTransform:"uppercase", cursor:opts?"pointer":"default", userSelect:"none", color:active?"#c8a96e":"#5a4a7a", borderBottom:`2px solid ${active?"#7c5cbf":"#2a1f3d"}`, whiteSpace:"nowrap", overflow:"hidden" }}>
        <span style={{ overflow:"hidden", textOverflow:"ellipsis" }}>{active ? `${label}: ${selected?.label||value}` : label}</span>
        {opts && <span style={{ fontSize:8, opacity:.6, flexShrink:0 }}>{open?"▴":"▾"}</span>}
      </div>
      {open && opts && (
        <div onMouseDown={e=>e.stopPropagation()} style={{ position:"absolute", top:"100%", [alignRight?"right":"left"]:0, zIndex:300, background:"#1a1228", border:"1px solid #3a2a5a", borderRadius:8, boxShadow:"0 6px 24px #00000099", minWidth:160, overflow:"hidden" }}>
          <div style={{ padding:"6px 8px", borderBottom:"1px solid #2a1f3d" }}>
            <input autoFocus placeholder="Search…" value={q} onChange={e=>setQ(e.target.value)}
              onKeyDown={e=>e.key==="Escape"&&onOpen(null)}
              style={{ ...inputStyle, fontSize:11, padding:"3px 8px", width:"100%", boxSizing:"border-box" }}/>
          </div>
          <div style={{ maxHeight:200, overflowY:"auto" }}>
            <div onMouseDown={() => { onChange(""); onOpen(null); }}
              style={{ padding:"6px 12px", fontSize:12, color:!value?"#c8a96e":"#9a7fa0", cursor:"pointer" }}
              onMouseEnter={e=>e.currentTarget.style.background="#1e1630"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              All
            </div>
            {filteredOpts.map(o => (
              <div key={o.value} onMouseDown={() => { onChange(o.value); onOpen(null); }}
                style={{ padding:"6px 12px", fontSize:12, color:value===o.value?"#c8a96e":"#9a7fa0", cursor:"pointer", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}
                onMouseEnter={e=>e.currentTarget.style.background="#1e1630"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                {o.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Table row ─────────────────────────────────────────────────────────────────
function ArtifactRow({ artifact, chars, rarityColors, isSelected, onSelect, query }) {
  const rarityColor = rarityColors[artifact.rarity] || "#9a9a9a";
  const holder = artifact.holderId ? chars.find(c => c.id === artifact.holderId) : null;
  return (
    <div onClick={() => onSelect(artifact)}
      style={{ display:"flex", alignItems:"center", borderBottom:"1px solid #13101e", cursor:"pointer", background:isSelected?"#1e1535":"transparent", borderLeft:`2px solid ${isSelected?rarityColor:"transparent"}`, transition:"background .08s" }}
      onMouseEnter={e=>{ if(!isSelected) e.currentTarget.style.background="#13101e"; }}
      onMouseLeave={e=>{ if(!isSelected) e.currentTarget.style.background="transparent"; }}>
      {/* Name */}
      <div style={{ flex:1, display:"flex", alignItems:"center", gap:6, padding:"5px 8px", minWidth:0 }}>
        {artifact.image
          ? <img src={artifact.image} alt="" style={{ width:20, height:20, borderRadius:3, objectFit:"cover", flexShrink:0 }}/>
          : <span style={{ fontSize:13, flexShrink:0 }}>⚗️</span>}
        <span style={{ fontSize:13, color:"#e8d5b7", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {artifact.name || <span style={{ color:"#5a4a7a", fontStyle:"italic" }}>Unnamed</span>}
        </span>
      </div>
      {/* Rarity */}
      <div style={{ width:90, padding:"5px 6px", flexShrink:0 }}>
        {artifact.rarity && <span style={{ fontSize:11, color:rarityColor, background:rarityColor+"22", borderRadius:4, padding:"1px 6px" }}>{artifact.rarity}</span>}
      </div>
      {/* Holder */}
      <div style={{ width:110, padding:"5px 6px", fontSize:11, color:"#c8a96e", flexShrink:0, display:"flex", alignItems:"center", gap:4, overflow:"hidden" }}>
        {holder ? <><Avatar src={holder.image} name={holder.name} size={16}/><span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{holder.name}</span></> : <span style={{ color:"#3a2a5a" }}>—</span>}
      </div>
    </div>
  );
}

// ── Main Tab ───────────────────────────────────────────────────────────────────
function ArtifactsTab({ artifacts, onUpdateArtifacts, chars, stories, onOpenChar, onOpenStory, onAskConfirm, onCloseConfirm, navArtifactId, rarities }) {
  const rList = rarities || DEFAULT_RARITIES;
  const rarityColors = Object.fromEntries(rList.map(r => [r.name, r.color]));
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [rarityFilter, setRarityFilter] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [holderFilter, setHolderFilter] = useState("");
  const [openCol, setOpenCol] = useState(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!drawerOpen) return;
    const handler = e => {
      if (overlayRef.current && !overlayRef.current.contains(e.target)) setDrawerOpen(false);
      setOpenCol(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [drawerOpen]);

  const effectiveSelectedId = navArtifactId && artifacts.some(a => a.id === navArtifactId) ? navArtifactId : selectedId;
  const selected = artifacts.find(a => a.id === effectiveSelectedId) || null;

  const handleNew = () => {
    const newId = uid();
    onUpdateArtifacts([{ ...defaultArtifact, id: newId, _isNew: true }, ...artifacts]);
    setSelectedId(newId);
    setDrawerOpen(false);
  };

  const handleSave = updated => {
    const { _isNew, ...clean } = updated;
    onUpdateArtifacts(artifacts.map(a => a.id === clean.id ? clean : a));
  };

  const handleCancelNew = () => {
    onUpdateArtifacts(artifacts.filter(a => a.id !== selectedId));
    setSelectedId(null);
  };

  const deleteArtifact = id => {
    const a = artifacts.find(x => x.id === id);
    onAskConfirm(`Delete "${a?.name || "this item"}"?`, () => {
      onUpdateArtifacts(artifacts.filter(x => x.id !== id));
      if (effectiveSelectedId === id) setSelectedId(null);
      onCloseConfirm();
    });
  };

  const q = search.trim().toLowerCase();
  const filtered = artifacts.filter(a =>
    (!q || a.name.toLowerCase().includes(q) || (a.description||"").toLowerCase().includes(q) || (a.lore||"").toLowerCase().includes(q)) &&
    (!rarityFilter || a.rarity === rarityFilter) &&
    (!holderFilter || a.holderId === holderFilter)
  );

  const hasFilter = !!(search || rarityFilter || holderFilter);
  const filterCount = (search?1:0) + (rarityFilter?1:0) + (holderFilter?1:0);

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minHeight:0, position:"relative" }}>

      {/* ── Detail: fills full height ── */}
      <div style={{ position:"absolute", inset:0, overflowY:"auto", paddingTop:44 }}>
        {selected
          ? <ArtifactDetailPanel
              artifact={selected} chars={chars} stories={stories}
              onSave={handleSave}
              onDelete={() => deleteArtifact(selected.id)}
              onClose={() => { setSelectedId(null); setDrawerOpen(true); }}
              onCancelNew={handleCancelNew}
              onOpenChar={onOpenChar} onOpenStory={onOpenStory}
              rarities={rarities}/>
          : <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", color:"#3a2a5a", textAlign:"center" }}>
              <div style={{ fontSize:44, opacity:.18, marginBottom:14 }}>⚗️</div>
              <div style={{ fontSize:14, fontFamily:"Georgia,serif", color:"#3a2a5a" }}>Select an item to view details</div>
              <div style={{ fontSize:12, color:"#2a1f3d", marginTop:6 }}>Search above or open the list</div>
            </div>
        }
      </div>

      {/* ── Search overlay ── */}
      <div ref={overlayRef} style={{ position:"absolute", top:0, left:0, right:0, zIndex:10, background:"#0f0c1a", borderBottom: drawerOpen ? "1px solid #2a1f3d" : "none", boxShadow: drawerOpen ? "0 8px 32px #00000099" : "0 2px 12px #00000066" }}>
        {/* Top bar */}
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 12px" }}>
          <div style={{ flex:1, position:"relative" }}>
            <span style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", color:"#5a4a7a", fontSize:13, pointerEvents:"none" }}>🔍</span>
            <input
              placeholder="Search items…"
              value={search}
              onChange={e => { setSearch(e.target.value); if (!drawerOpen) setDrawerOpen(true); }}
              onFocus={() => setDrawerOpen(true)}
              style={{ ...inputStyle, paddingLeft:30, fontSize:13, width:"100%", boxSizing:"border-box" }}/>
          </div>
          <button onClick={() => setDrawerOpen(o => !o)}
            style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 10px", borderRadius:6, border:`1px solid ${drawerOpen||hasFilter?"#7c5cbf":"#3a2a5a"}`, background:drawerOpen||hasFilter?"#2a1a4a":"transparent", color:drawerOpen||hasFilter?"#e8d5b7":"#6a5a8a", fontSize:12, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>
            {filterCount > 0 ? `Filters · ${filterCount}` : "Filters"} <span style={{ fontSize:9 }}>{drawerOpen?"▲":"▼"}</span>
          </button>
          {hasFilter && (
            <button onClick={() => { setSearch(""); setRarityFilter(""); setHolderFilter(""); }}
              style={{ padding:"4px 8px", borderRadius:6, border:"1px solid #6b1a1a", background:"transparent", color:"#c06060", fontSize:12, cursor:"pointer", flexShrink:0 }}>✕</button>
          )}
          <button onClick={handleNew} style={{ ...btnPrimary, fontSize:12, padding:"4px 10px", flexShrink:0 }}>+ New</button>
        </div>

        {/* Drawer */}
        {drawerOpen && (
          <div style={{ borderTop:"1px solid #1e1630", maxHeight:360, display:"flex", flexDirection:"column" }}>
            <div style={{ display:"flex", flexDirection:"column", flex:1, minHeight:0 }}>
              {/* Column headers */}
              <div style={{ display:"flex", alignItems:"stretch", background:"#0d0b17", flexShrink:0, borderBottom:"1px solid #1e1630" }}>
                <ColHeader id="name" label="Name" openId={openCol} onOpen={setOpenCol} style={{ flex:1, minWidth:0 }}/>
                <ColHeader id="rarity" label="Rarity" value={rarityFilter}
                  onChange={setRarityFilter}
                  opts={rList.map(r => ({ value:r.name, label:r.name }))}
                  openId={openCol} onOpen={setOpenCol}
                  style={{ width:90, flexShrink:0 }}/>
                <ColHeader id="holder" label="Holder" value={holderFilter}
                  onChange={setHolderFilter}
                  opts={chars.filter(c => artifacts.some(a => a.holderId === c.id)).map(c => ({ value:c.id, label:c.name }))}
                  openId={openCol} onOpen={setOpenCol} alignRight
                  style={{ width:110, flexShrink:0 }}/>
              </div>
              {/* Rows */}
              <div style={{ overflowY:"auto", flex:1 }}>
                {filtered.length === 0
                  ? <div style={{ padding:"12px 16px", fontSize:12, color:"#5a4a7a" }}>No items match.</div>
                  : filtered.map(a => (
                      <ArtifactRow key={a.id} artifact={a} chars={chars} rarityColors={rarityColors}
                        isSelected={effectiveSelectedId===a.id} query={search}
                        onSelect={a => { setSelectedId(a.id); setDrawerOpen(false); }}/>
                    ))
                }
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(ArtifactsTab);
