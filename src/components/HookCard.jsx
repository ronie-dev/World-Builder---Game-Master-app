import { useState, useMemo, useRef } from "react";
import { ghostInput, ghostTextarea } from "../constants.js";
import Avatar from "./Avatar.jsx";

const ENTITY_ICON = { character:"👤", faction:"⚑", location:"📍", story:"📜", artifact:"⚗️" };
const mkId = () => Math.random().toString(36).slice(2, 9);

// ── Migration: any old format → rows ─────────────────────────────────────────
// Row shape: { id, text: string, entities: [{id, entityType, entityId, name}] }
function toRows(hook) {
  if (hook.rows) return hook.rows;

  // blocks model (previous version)
  if (hook.blocks) {
    const texts    = hook.blocks.filter(b => b.type === "text");
    const entities = hook.blocks.filter(b => b.type === "entity")
                       .map(b => ({ id:b.id, entityType:b.entityType, entityId:b.entityId, name:b.name }));
    if (!texts.length) return entities.length ? [{ id:mkId(), text:"", entities }] : [];
    const rows = [{ id:mkId(), text:texts[0].content||"", entities }];
    for (let i = 1; i < texts.length; i++) rows.push({ id:mkId(), text:texts[i].content||"", entities:[] });
    return rows;
  }

  // original description + linkedEntities
  const text     = hook.description || "";
  const entities = (hook.linkedEntities||[]).map(e => ({ id:mkId(), entityType:e.type, entityId:e.id, name:e.name }));
  return (text || entities.length) ? [{ id:mkId(), text, entities }] : [];
}

// ── Entity data resolver ──────────────────────────────────────────────────────
function resolveEntity(entity, chars, factions, locations, stories, artifacts) {
  if (entity.entityType === "character") {
    const c = (chars||[]).find(x=>x.id===entity.entityId);
    if (!c) return { image:null, sub:"" };
    const icon = c.type==="player"?"🎲":c.type==="main"?"⭐":"";
    return { image:c.image, sub:[icon, c.shortDescription].filter(Boolean).join(" ") };
  }
  if (entity.entityType === "faction")  { const f=(factions||[]).find(x=>x.id===entity.entityId); return {image:null, sub:f?.alignment||""}; }
  if (entity.entityType === "location") { const l=(locations||[]).find(x=>x.id===entity.entityId); return {image:null, sub:l?.region||l?.type||""}; }
  if (entity.entityType === "story")    { const s=(stories||[]).find(x=>x.id===entity.entityId);   return {image:null, sub:s?.status||""}; }
  if (entity.entityType === "artifact") { const a=(artifacts||[]).find(x=>x.id===entity.entityId); return {image:a?.image||null, sub:a?.rarity||""}; }
  return { image:null, sub:"" };
}

// ── Row text (auto-expand, syncs from prop) ───────────────────────────────────
function RowText({ text, onChange }) {
  const [editing, setEditing]   = useState(!text);
  const [val, setVal]           = useState(text || "");
  const [prevText, setPrevText] = useState(text);

  // Sync from prop when not mid-edit
  if (text !== prevText && !editing) { setPrevText(text); setVal(text || ""); }

  const commit = () => { setEditing(false); onChange(val); };

  if (editing) return (
    <textarea autoFocus value={val} placeholder="Add description…"
      onChange={e => { setVal(e.target.value); e.target.style.height="auto"; e.target.style.height=e.target.scrollHeight+"px"; }}
      onBlur={commit}
      onKeyDown={e => { if (e.key==="Escape") { setVal(text||""); setEditing(false); } }}
      ref={el => { if (el) { el.style.height="auto"; el.style.height=el.scrollHeight+"px"; } }}
      style={{ ...ghostTextarea, resize:"none", overflow:"hidden" }}
    />
  );

  return (
    <div onClick={()=>setEditing(true)} style={{ cursor:"text", padding:"4px 6px", borderRadius:4, minHeight:28 }}
      onMouseEnter={e=>e.currentTarget.style.background="#ffffff08"}
      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
      {val
        ? <span style={{ fontSize:13, color:"#b09080", lineHeight:1.7, whiteSpace:"pre-wrap" }}>{val}</span>
        : <span style={{ fontSize:13, color:"#2a1f3d", fontStyle:"italic" }}>Add description…</span>
      }
    </div>
  );
}

// ── Entity card ───────────────────────────────────────────────────────────────
function EntityCard({ entity, chars, factions, locations, stories, artifacts, onRemove }) {
  const [hovered, setHovered] = useState(false);
  const { image, sub } = resolveEntity(entity, chars, factions, locations, stories, artifacts);
  return (
    <div onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
      style={{ display:"flex", alignItems:"center", gap:8, background:"#1a1230",
        border:`1px solid ${hovered?"#7c5cbf":"#3a2a5a"}`, borderRadius:8,
        padding:"6px 10px 6px 8px", transition:"border-color .12s", boxSizing:"border-box", width:"100%" }}>
      {image
        ? <Avatar src={image} name={entity.name} size={28}/>
        : <span style={{ fontSize:15, width:26, textAlign:"center", flexShrink:0 }}>{ENTITY_ICON[entity.entityType]}</span>
      }
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12, color:"#e8d5b7", fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{entity.name}</div>
        {sub && <div style={{ fontSize:10, color:"#7c5cbf", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{sub}</div>}
      </div>
      <button onClick={onRemove}
        style={{ background:"none", border:"none", color:"#4a3a6a", cursor:"pointer", fontSize:14, padding:"0 2px", lineHeight:1, flexShrink:0 }}
        onMouseEnter={e=>e.currentTarget.style.color="#c06060"}
        onMouseLeave={e=>e.currentTarget.style.color="#4a3a6a"}>×</button>
    </div>
  );
}

// ── Entity picker (+ entity button per row) ───────────────────────────────────
function AddEntityPicker({ onAdd, chars, factions, locations, stories, artifacts, existingEntities }) {
  const [open, setOpen]     = useState(false);
  const [query, setQuery]   = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef();

  const isLinked = (type, id) => (existingEntities||[]).some(e => e.entityType===type && e.entityId===id);

  const results = useMemo(() => {
    if (!open) return [];
    const q = query.toLowerCase();
    const out = [];
    for (const c of (chars||[]))
      if (!isLinked("character",c.id) && (!q||c.name.toLowerCase().includes(q)||c.shortDescription?.toLowerCase().includes(q)))
        out.push({ type:"character", id:c.id, name:c.name, sub:[c.type==="player"?"🎲":c.type==="main"?"⭐":"",c.shortDescription].filter(Boolean).join(" "), image:c.image });
    for (const f of (factions||[]))
      if (!isLinked("faction",f.id) && (!q||f.name.toLowerCase().includes(q)))
        out.push({ type:"faction", id:f.id, name:f.name, sub:f.alignment||"", image:null });
    for (const l of (locations||[]))
      if (!isLinked("location",l.id) && (!q||l.name.toLowerCase().includes(q)))
        out.push({ type:"location", id:l.id, name:l.name, sub:l.region||l.type||"", image:null });
    for (const s of (stories||[]))
      if (!isLinked("story",s.id) && (!q||s.name.toLowerCase().includes(q)))
        out.push({ type:"story", id:s.id, name:s.name, sub:s.status||"", image:null });
    for (const a of (artifacts||[]))
      if (!isLinked("artifact",a.id) && (!q||a.name.toLowerCase().includes(q)))
        out.push({ type:"artifact", id:a.id, name:a.name, sub:a.rarity||"", image:null });
    return out.slice(0,24);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, query, chars, factions, locations, stories, artifacts, existingEntities]);

  const close = () => { setOpen(false); setQuery(""); setCursor(0); };
  const pick  = r  => { onAdd(r); close(); };

  const handleKey = e => {
    if (e.key==="Escape")                        { close(); return; }
    if (e.key==="ArrowDown") { e.preventDefault(); setCursor(c=>Math.min(c+1,results.length-1)); }
    if (e.key==="ArrowUp")   { e.preventDefault(); setCursor(c=>Math.max(c-1,0)); }
    if (e.key==="Enter"&&results[cursor])         { pick(results[cursor]); }
  };

  return (
    <div style={{ position:"relative" }}>
      <button onClick={()=>{ setOpen(true); setTimeout(()=>inputRef.current?.focus(),30); }}
        style={{ fontSize:11, color:"#5a4a7a", background:"transparent", border:"1px dashed #2a1f3d", borderRadius:6, padding:"4px 10px", cursor:"pointer", whiteSpace:"nowrap" }}
        onMouseEnter={e=>{ e.currentTarget.style.borderColor="#7c5cbf"; e.currentTarget.style.color="#9a7fa0"; }}
        onMouseLeave={e=>{ e.currentTarget.style.borderColor="#2a1f3d"; e.currentTarget.style.color="#5a4a7a"; }}>
        ＋ entity
      </button>
      {open && (
        <div style={{ position:"absolute", right:0, top:"calc(100% + 4px)", width:260, zIndex:50,
          background:"#0d0b14", border:"1px solid #3a2a5a", borderRadius:10, overflow:"hidden", boxShadow:"0 4px 24px #000000cc" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", borderBottom:"1px solid #1e1630" }}>
            <span style={{ color:"#5a4a7a", fontSize:13, flexShrink:0 }}>🔍</span>
            <input ref={inputRef} value={query} placeholder="Search…"
              onChange={e=>{ setQuery(e.target.value); setCursor(0); }}
              onBlur={()=>setTimeout(close,180)}
              onKeyDown={handleKey}
              style={{ flex:1, background:"none", border:"none", outline:"none", color:"#e8d5b7", fontSize:13 }}
            />
            <button onClick={close} style={{ background:"none", border:"none", color:"#5a4a7a", cursor:"pointer", fontSize:15, lineHeight:1, padding:"0 2px" }}
              onMouseEnter={e=>e.currentTarget.style.color="#e8d5b7"} onMouseLeave={e=>e.currentTarget.style.color="#5a4a7a"}>✕</button>
          </div>
          <div style={{ maxHeight:200, overflowY:"auto" }}>
            {results.length===0 && <div style={{ padding:"12px 14px", color:"#3a2a5a", fontSize:12, textAlign:"center" }}>{query?"No results":"Type to search…"}</div>}
            {results.map((r,i) => (
              <div key={r.type+r.id} onMouseDown={()=>pick(r)} onMouseEnter={()=>setCursor(i)}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 14px", cursor:"pointer", background:i===cursor?"#1e1535":"transparent", borderBottom:"1px solid #15111f" }}>
                {r.image ? <Avatar src={r.image} name={r.name} size={24}/> : <span style={{ fontSize:14, width:24, textAlign:"center", flexShrink:0 }}>{ENTITY_ICON[r.type]}</span>}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, color:"#e8d5b7", fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.name}</div>
                  {r.sub && <div style={{ fontSize:10, color:"#6a5a8a" }}>{r.sub}</div>}
                </div>
                <span style={{ fontSize:10, color:"#3a2a5a", flexShrink:0, textTransform:"capitalize" }}>{r.type}</span>
              </div>
            ))}
          </div>
          {results.length>0 && (
            <div style={{ padding:"4px 14px", borderTop:"1px solid #15111f", fontSize:10, color:"#2a1f3d", display:"flex", gap:12 }}>
              <span>↑↓ navigate</span><span>↵ add</span><span>ESC close</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Story link picker ─────────────────────────────────────────────────────────
function StoryLinkPicker({ stories, onSelect, onClose }) {
  const [q, setQ] = useState("");
  const filtered = (stories||[]).filter(s=>!q||s.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={{ background:"#0d0b14", border:"1px solid #3a2a5a", borderRadius:8, overflow:"hidden", boxShadow:"0 4px 20px #00000099", marginTop:6 }}>
      <input autoFocus value={q} placeholder="Search stories…"
        onChange={e=>setQ(e.target.value)}
        onBlur={()=>setTimeout(onClose,160)}
        onKeyDown={e=>{ if(e.key==="Escape") onClose(); }}
        style={{ width:"100%", background:"none", border:"none", borderBottom:"1px solid #1e1630", outline:"none", color:"#e8d5b7", fontSize:12, padding:"7px 12px", boxSizing:"border-box" }}
      />
      <div style={{ maxHeight:140, overflowY:"auto" }}>
        {filtered.length===0
          ? <div style={{ padding:"10px 12px", color:"#3a2a5a", fontSize:12 }}>No stories found.</div>
          : filtered.map(s=>(
              <div key={s.id} onMouseDown={()=>onSelect(s.id)}
                style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 12px", cursor:"pointer", borderBottom:"1px solid #15111f", fontSize:12, color:"#e8d5b7" }}
                onMouseEnter={e=>e.currentTarget.style.background="#1e1535"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <span style={{ flexShrink:0 }}>📜</span>
                <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.name}</span>
              </div>
            ))
        }
      </div>
    </div>
  );
}

// ── Main HookCard ─────────────────────────────────────────────────────────────
export default function HookCard({ hook, onUpdate, onRemove, onPin, isPinned, statuses, colorMap, chars, factions, locations, stories, artifacts, onLinkStory, onUnlinkStory, onOpenLinkedStory, sourceName, onOpenSource }) {
  const [title, setTitle]               = useState(hook.title);
  const [prevTitle, setPrevTitle]       = useState(hook.title);
  const [confirmDelete, setConfirmDelete]       = useState(false);
  const [storyPicker, setStoryPicker]           = useState(false);
  const [hoveredRowId, setHoveredRowId]         = useState(null);
  const [confirmDeleteRowId, setConfirmDeleteRowId] = useState(null);

  // Row drag
  const dragRowRef = useRef(null);
  const [draggingRowId, setDraggingRowId] = useState(null);
  const [dragOverRowId, setDragOverRowId] = useState(null);

  // Entity drag (within a row)
  const dragEntityRef = useRef(null); // { rowId, entityId }
  const [draggingEntityId, setDraggingEntityId] = useState(null);
  const [dragOverEntityId, setDragOverEntityId] = useState(null);

  const rows = toRows(hook);

  // Sync title from prop (derived state — no effect needed)
  if (hook.title !== prevTitle) { setPrevTitle(hook.title); setTitle(hook.title); }

  const sc = colorMap[hook.status] || "#7c5cbf";
  const applyRows = nr => onUpdate({ ...hook, rows: nr });

  const saveTitle = () => {
    const t = title.trim();
    if (!t) { setTitle(hook.title); return; }
    if (t !== hook.title) onUpdate({ ...hook, title: t });
  };

  const cycleStatus = () => {
    const idx = statuses.findIndex(s => s.name === hook.status);
    onUpdate({ ...hook, status: statuses[(idx+1) % statuses.length].name });
  };

  // Row operations
  const addRow            = ()               => applyRows([...rows, { id:mkId(), text:"", entities:[] }]);
  const updateRowText     = (rowId, text)    => applyRows(rows.map(r => r.id===rowId ? {...r, text} : r));
  const removeRow         = rowId            => applyRows(rows.filter(r => r.id!==rowId));
  const addEntityToRow    = (rowId, e)       => applyRows(rows.map(r => r.id===rowId
    ? {...r, entities:[...r.entities, {id:mkId(), entityType:e.type, entityId:e.id, name:e.name}]}
    : r));
  const removeEntityFromRow = (rowId, eid)   => applyRows(rows.map(r => r.id===rowId
    ? {...r, entities:r.entities.filter(e=>e.id!==eid)}
    : r));

  const reorderRows = (fromId, toId) => {
    const rs = toRows(hook);
    const fi = rs.findIndex(r=>r.id===fromId), ti = rs.findIndex(r=>r.id===toId);
    if (fi===-1||ti===-1||fi===ti) return;
    const next=[...rs]; const[item]=next.splice(fi,1); next.splice(ti,0,item);
    applyRows(next);
  };

  const reorderEntities = (rowId, fromId, toId) => {
    if (fromId===toId) return;
    applyRows(rows.map(r => {
      if (r.id!==rowId) return r;
      const fi=r.entities.findIndex(e=>e.id===fromId), ti=r.entities.findIndex(e=>e.id===toId);
      if (fi===-1||ti===-1) return r;
      const next=[...r.entities]; const[item]=next.splice(fi,1); next.splice(ti,0,item);
      return {...r, entities:next};
    }));
  };

  const allLinkedEntities = rows.flatMap(r => r.entities);

  return (
    <div style={{ background:"#0f0c1a", border:"1px solid #2a1f3d", borderLeft:`3px solid ${sc}`, borderRadius:10, padding:14 }}>

      {/* Top bar */}
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
        <button onClick={cycleStatus} title="Click to change status"
          style={{ fontSize:10, color:sc, background:sc+"22", border:`1px solid ${sc}44`, borderRadius:8, padding:"2px 8px", cursor:"pointer", flexShrink:0 }}>
          {hook.status}
        </button>
        <input value={title} placeholder="Hook title…"
          onChange={e=>setTitle(e.target.value)}
          onMouseEnter={e=>{ if(document.activeElement!==e.target) e.target.style.background="#ffffff0a"; }}
          onMouseLeave={e=>{ if(document.activeElement!==e.target) e.target.style.background="transparent"; }}
          onFocus={e=>{ e.target.style.background="#ffffff0a"; e.target.style.borderColor="#3a2a5a"; }}
          onBlur={e=>{ e.target.style.background="transparent"; e.target.style.borderColor="transparent"; saveTitle(); }}
          style={{ ...ghostInput, flex:1, minWidth:0, fontWeight:700, fontFamily:"Georgia,serif", fontSize:14, color:"#e8d5b7", borderColor:"transparent" }}
        />
        {sourceName && (
          <span onClick={onOpenSource}
            style={{ fontSize:11, color:"#c8a96e", cursor:"pointer", fontWeight:700, flexShrink:0, whiteSpace:"nowrap" }}
            onMouseEnter={e=>e.currentTarget.style.opacity=".7"}
            onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
            {sourceName} ↗
          </span>
        )}
        {/* Story link — Notes GM hooks */}
        {(onLinkStory||onUnlinkStory) && (
          hook.linkedStoryId ? (
            <div style={{ display:"flex", alignItems:"center", gap:4, flexShrink:0 }}>
              <span
                onClick={e=>{ const s=(stories||[]).find(x=>x.id===hook.linkedStoryId); if(s&&onOpenLinkedStory){ if(e.ctrlKey||e.metaKey){e.preventDefault();onOpenLinkedStory(s,{newTab:true});}else{onOpenLinkedStory(s);} } }}
                onAuxClick={e=>{ if(e.button===1){ const s=(stories||[]).find(x=>x.id===hook.linkedStoryId); if(s&&onOpenLinkedStory){e.preventDefault();onOpenLinkedStory(s,{newTab:true});} } }}
                style={{ fontSize:11, color:"#c8a96e", fontWeight:700, whiteSpace:"nowrap", cursor: onOpenLinkedStory?"pointer":"default" }}
                onMouseEnter={e=>{ if(onOpenLinkedStory) e.currentTarget.style.textDecoration="underline"; }}
                onMouseLeave={e=>e.currentTarget.style.textDecoration="none"}>
                {(stories||[]).find(s=>s.id===hook.linkedStoryId)?.name || "Story"} ↗
              </span>
              <button onClick={onUnlinkStory}
                style={{ background:"none", border:"none", color:"#5a4a7a", cursor:"pointer", fontSize:11, padding:"0 2px", lineHeight:1 }}
                onMouseEnter={e=>e.currentTarget.style.color="#c06060"}
                onMouseLeave={e=>e.currentTarget.style.color="#5a4a7a"}>× unlink</button>
            </div>
          ) : (
            <div style={{ position:"relative", flexShrink:0 }}>
              <button onClick={()=>setStoryPicker(v=>!v)}
                style={{ fontSize:11, color:"#5a4a7a", background:"none", border:"none", cursor:"pointer", padding:0, display:"flex", alignItems:"center", gap:4, whiteSpace:"nowrap" }}
                onMouseEnter={e=>e.currentTarget.style.color="#9a7fa0"}
                onMouseLeave={e=>e.currentTarget.style.color="#5a4a7a"}>🔗 Link story</button>
              {storyPicker && (
                <StoryLinkPicker stories={stories}
                  onSelect={id=>{ onLinkStory(id); setStoryPicker(false); }}
                  onClose={()=>setStoryPicker(false)}
                />
              )}
            </div>
          )
        )}
        {onPin && (
          <button onClick={onPin}
            style={{ display:"flex", alignItems:"center", gap:4, background:"none", border:`1px solid ${isPinned?"#c8a96e44":"transparent"}`, borderRadius:6, cursor:"pointer", fontSize:12, padding:"2px 8px", color:isPinned?"#c8a96e":"#5a4a7a", flexShrink:0 }}
            onMouseEnter={e=>e.currentTarget.style.color="#c8a96e"}
            onMouseLeave={e=>e.currentTarget.style.color=isPinned?"#c8a96e":"#5a4a7a"}>
            📌 <span>{isPinned?"Pinned":"Pin"}</span>
          </button>
        )}
        {onRemove && (confirmDelete ? (
          <>
            <button onClick={onRemove} style={{ background:"#6b1a1a", color:"#e8d5b7", border:"none", borderRadius:6, padding:"2px 10px", cursor:"pointer", fontSize:11, fontWeight:700 }}>Delete</button>
            <button onClick={()=>setConfirmDelete(false)} style={{ background:"transparent", color:"#9a7fa0", border:"1px solid #3a2a5a", borderRadius:6, padding:"2px 8px", cursor:"pointer", fontSize:11 }}>✕</button>
          </>
        ) : (
          <button onClick={()=>setConfirmDelete(true)}
            style={{ background:"none", border:"none", color:"#4a3a6a", cursor:"pointer", fontSize:13, padding:"2px 4px", flexShrink:0 }}
            onMouseEnter={e=>e.currentTarget.style.color="#c06060"}
            onMouseLeave={e=>e.currentTarget.style.color="#4a3a6a"}>🗑️</button>
        ))}
      </div>

      {/* Rows */}
      <div style={{ display:"flex", flexDirection:"column", marginBottom:8 }}>
        {rows.map((row, rowIdx) => {
          const hasContent = row.text.trim() || row.entities.length > 0;
          return (
            <div key={row.id}
              style={{ display:"flex", alignItems:"flex-start", gap:6,
                opacity: draggingRowId===row.id ? 0.35 : 1,
                outline: dragOverRowId===row.id ? "2px solid #5a3a8a" : "none",
                borderRadius:4, padding:"6px 0",
                borderTop: rowIdx > 0 ? "1px solid #1e1630" : "none" }}
              onMouseEnter={()=>setHoveredRowId(row.id)}
              onMouseLeave={()=>setHoveredRowId(null)}
              onDragOver={e=>{ e.preventDefault(); if(dragRowRef.current) setDragOverRowId(row.id); }}
              onDragLeave={()=>setDragOverRowId(null)}
              onDrop={e=>{ e.preventDefault(); if(dragRowRef.current) { reorderRows(dragRowRef.current, row.id); setDragOverRowId(null); } }}
            >
              {/* Left gutter: drag handle only */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, alignSelf:"stretch" }}>
                <span draggable
                  onDragStart={()=>{ dragRowRef.current=row.id; setDraggingRowId(row.id); }}
                  onDragEnd={()=>{ dragRowRef.current=null; setDraggingRowId(null); setDragOverRowId(null); }}
                  style={{ fontSize:21, color:"#3a2a5a", cursor:"grab", userSelect:"none", lineHeight:1 }}
                  onMouseEnter={e=>e.currentTarget.style.color="#9a7fa0"}
                  onMouseLeave={e=>e.currentTarget.style.color="#3a2a5a"}>⠿</span>
              </div>

              {/* Text */}
              <div style={{ flex:1, minWidth:0 }}>
                <RowText text={row.text} onChange={text=>updateRowText(row.id, text)} />
              </div>

              {/* Entity column: stacked vertically, + entity at bottom */}
              <div style={{ flexShrink:0, display:"flex", flexDirection:"column", gap:5,
                width: row.entities.length > 0 ? 200 : "auto", alignItems:"flex-end" }}>
                {row.entities.map(entity => (
                  <div key={entity.id}
                    style={{ width:"100%", display:"flex", alignItems:"center", gap:4,
                      opacity: draggingEntityId===entity.id ? 0.35 : 1,
                      outline: dragOverEntityId===entity.id ? "2px solid #5a3a8a" : "none",
                      borderRadius:6 }}
                    onDragOver={e=>{ e.preventDefault(); e.stopPropagation(); if(dragEntityRef.current) setDragOverEntityId(entity.id); }}
                    onDragLeave={e=>{ e.stopPropagation(); setDragOverEntityId(null); }}
                    onDrop={e=>{ e.preventDefault(); e.stopPropagation();
                      if(dragEntityRef.current?.rowId===row.id) {
                        reorderEntities(row.id, dragEntityRef.current.entityId, entity.id);
                        setDragOverEntityId(null);
                      }
                    }}
                  >
                    <span draggable
                      onDragStart={()=>{ dragEntityRef.current={rowId:row.id, entityId:entity.id}; setDraggingEntityId(entity.id); }}
                      onDragEnd={()=>{ dragEntityRef.current=null; setDraggingEntityId(null); setDragOverEntityId(null); }}
                      style={{ fontSize:12, color:"#3a2a5a", cursor:"grab", userSelect:"none", flexShrink:0 }}
                      onMouseEnter={e=>e.currentTarget.style.color="#9a7fa0"}
                      onMouseLeave={e=>e.currentTarget.style.color="#3a2a5a"}>⠿</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <EntityCard entity={entity}
                        chars={chars} factions={factions} locations={locations} stories={stories} artifacts={artifacts}
                        onRemove={()=>removeEntityFromRow(row.id, entity.id)}
                      />
                    </div>
                  </div>
                ))}
                <AddEntityPicker onAdd={e=>addEntityToRow(row.id, e)}
                  chars={chars} factions={factions} locations={locations} stories={stories} artifacts={artifacts}
                  existingEntities={allLinkedEntities}
                />
                {/* Remove row — shown on hover, only when multiple rows exist */}
                {hoveredRowId===row.id && rows.length > 1 && (
                  confirmDeleteRowId===row.id ? (
                    <div style={{ display:"flex", gap:4, alignItems:"center", marginTop:2 }}>
                      <button onClick={()=>{ removeRow(row.id); setConfirmDeleteRowId(null); }}
                        style={{ background:"#6b1a1a", color:"#e8d5b7", border:"none", borderRadius:5, padding:"2px 10px", cursor:"pointer", fontSize:11, fontWeight:700 }}>Delete row</button>
                      <button onClick={()=>setConfirmDeleteRowId(null)}
                        style={{ background:"transparent", color:"#9a7fa0", border:"1px solid #3a2a5a", borderRadius:5, padding:"2px 8px", cursor:"pointer", fontSize:11 }}>Cancel</button>
                    </div>
                  ) : (
                    <button onClick={()=>hasContent ? setConfirmDeleteRowId(row.id) : removeRow(row.id)}
                      style={{ background:"none", border:"1px solid transparent", borderRadius:5, color:"#4a3a6a", cursor:"pointer", fontSize:11, padding:"2px 8px", marginTop:2, alignSelf:"flex-end" }}
                      onMouseEnter={e=>{ e.currentTarget.style.color="#c06060"; e.currentTarget.style.borderColor="#6b1a1a"; }}
                      onMouseLeave={e=>{ e.currentTarget.style.color="#4a3a6a"; e.currentTarget.style.borderColor="transparent"; }}>
                      × Remove row
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add row */}
      <button onClick={addRow}
        style={{ fontSize:12, color:"#5a4a7a", background:"transparent", border:"1px dashed #2a1f3d", borderRadius:8, padding:"5px 16px", cursor:"pointer" }}
        onMouseEnter={e=>{ e.currentTarget.style.borderColor="#7c5cbf"; e.currentTarget.style.color="#9a7fa0"; }}
        onMouseLeave={e=>{ e.currentTarget.style.borderColor="#2a1f3d"; e.currentTarget.style.color="#5a4a7a"; }}>
        ＋ row
      </button>

    </div>
  );
}
