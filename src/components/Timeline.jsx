import { useState, useEffect, useRef } from "react";
import { btnSecondary, btnPrimary, ghostInput, ghostTextarea, defaultEvent } from "../constants.js";
import { formatEventDate, sortEventsDesc } from "../utils.jsx";
import Avatar from "./Avatar.jsx";
import Lightbox from "./Lightbox.jsx";
import ImageUploadZone from "./ImageUploadZone.jsx";
import { useGallery } from "../GalleryContext.js";

// Shared inline form for both creating and editing events
function EventForm({ draft, setDraft, chars, currentTimelineDate, onSave, onCancel, isNew }) {
  const [charAdding, setCharAdding] = useState(false);
  const [charSearch, setCharSearch] = useState("");

  const insertDate = () => {
    const [y, m, d] = (currentTimelineDate || "").split(" / ");
    setDraft(f => ({ ...f, year: y||"", month: m||"", day: d||"" }));
  };

  const evChars = chars.filter(c => (draft.characterIds||[]).includes(c.id));
  const canSave = draft.title?.trim() || draft.year || draft.month || draft.day;

  return (
    <div style={{ display:"flex", gap:14 }}>
      {/* Left — image */}
      <div style={{ flexShrink:0 }}>
        <ImageUploadZone value={draft.image} onChange={src=>setDraft(f=>({...f,image:src}))} size="sm"/>
      </div>

      {/* Right — fields */}
      <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", gap:8 }}>

        {/* Date row */}
        <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
          {currentTimelineDate && <>
            <span style={{ fontSize:11, color:"#7c5cbf", whiteSpace:"nowrap" }}>📅 {currentTimelineDate}</span>
            <button onClick={insertDate}
              style={{ background:"#2a1f3d", border:"1px solid #3a2a5a", borderRadius:4, color:"#c8a96e", cursor:"pointer", fontSize:11, padding:"2px 8px", fontWeight:600, whiteSpace:"nowrap" }}>Insert</button>
            <span style={{ color:"#2a1f3d" }}>|</span>
          </>}
          <input placeholder="Year" value={draft.year||""} onChange={e=>setDraft(f=>({...f,year:e.target.value}))}
            style={{...ghostInput, flex:2, minWidth:50}}/>
          <input placeholder="Mo" value={draft.month||""} onChange={e=>setDraft(f=>({...f,month:e.target.value}))}
            style={{...ghostInput, flex:1, minWidth:36}}/>
          <input placeholder="Day" value={draft.day||""} onChange={e=>setDraft(f=>({...f,day:e.target.value}))}
            style={{...ghostInput, flex:1, minWidth:36}}/>
        </div>

        {/* Title */}
        <input placeholder="Event title…" value={draft.title||""}
          onChange={e=>setDraft(f=>({...f,title:e.target.value}))}
          onKeyDown={e=>{ if(e.key==="Escape") onCancel(); }}
          style={{...ghostInput, width:"100%", fontSize:14, color:"#e8d5b7", fontWeight:700}}/>

        {/* Description */}
        <textarea placeholder="What happened?" value={draft.description||""}
          onChange={e=>{ setDraft(f=>({...f,description:e.target.value})); e.target.style.height="auto"; e.target.style.height=e.target.scrollHeight+"px"; }}
          ref={el=>{ if(el){ el.style.height="auto"; el.style.height=el.scrollHeight+"px"; } }}
          onKeyDown={e=>{ if(e.key==="Escape") onCancel(); }}
          style={{...ghostTextarea, minHeight:100}}/>

        {/* Characters */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:6, alignItems:"center" }}>
          {evChars.map(c => (
            <div key={c.id} style={{ display:"flex", alignItems:"center", gap:5, background:"#1e1630", border:"1px solid #2a1f3d", borderRadius:20, padding:"4px 10px 4px 5px" }}>
              <Avatar src={c.image} name={c.name} size={22}/>
              <span style={{ fontSize:12, color:"#e8d5b7" }}>{c.name}</span>
              <button onMouseDown={()=>setDraft(f=>({...f,characterIds:(f.characterIds||[]).filter(x=>x!==c.id)}))}
                style={{ background:"none", border:"none", color:"#5a4a7a", cursor:"pointer", fontSize:13, padding:0, lineHeight:1, marginLeft:2 }}
                onMouseEnter={e=>e.currentTarget.style.color="#c06060"} onMouseLeave={e=>e.currentTarget.style.color="#5a4a7a"}>×</button>
            </div>
          ))}
          {charAdding ? (
            <div style={{ position:"relative" }}>
              <input autoFocus value={charSearch} onChange={e=>setCharSearch(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Escape"){ setCharAdding(false); setCharSearch(""); } }}
                onBlur={e=>{ if(!e.currentTarget.parentElement?.contains(e.relatedTarget)){ setCharAdding(false); setCharSearch(""); } }}
                placeholder="Search…" style={{...ghostInput, width:120, fontSize:12}}/>
              {(() => { const q=charSearch.toLowerCase(); const sugg=chars.filter(c=>!(draft.characterIds||[]).includes(c.id)&&(!q||c.name.toLowerCase().includes(q))); return sugg.length>0&&(
                <div style={{ position:"absolute", top:"100%", left:0, zIndex:30, background:"#1a1228", border:"1px solid #3a2a5a", borderRadius:8, minWidth:180, maxHeight:150, overflowY:"auto", marginTop:3, boxShadow:"0 4px 16px #00000066" }}>
                  {sugg.map(c=>(
                    <div key={c.id} onMouseDown={e=>{ e.preventDefault(); setDraft(f=>({...f,characterIds:[...(f.characterIds||[]),c.id]})); setCharSearch(""); }}
                      style={{ display:"flex", alignItems:"center", gap:7, padding:"7px 8px", cursor:"pointer", borderBottom:"1px solid #1e1630" }}
                      onMouseEnter={e=>e.currentTarget.style.background="#1e1630"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <Avatar src={c.image} name={c.name} size={22}/>
                      <span style={{ fontSize:12, color:"#e8d5b7" }}>{c.name}</span>
                    </div>
                  ))}
                </div>
              ); })()}
            </div>
          ) : (
            <div onClick={()=>setCharAdding(true)}
              style={{ display:"flex", alignItems:"center", justifyContent:"center", width:32, height:30, border:"2px dashed #2a1f3d", borderRadius:20, cursor:"pointer", color:"#2a1f3d", fontSize:18, transition:"border-color .15s, color .15s" }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor="#7c5cbf"; e.currentTarget.style.color="#7c5cbf"; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor="#2a1f3d"; e.currentTarget.style.color="#2a1f3d"; }}>+</div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display:"flex", gap:6 }}>
          <button onClick={()=>onSave(draft)} disabled={!canSave}
            style={{...btnPrimary, fontSize:12, padding:"5px 16px"}}>
            {isNew ? "✨ Add Event" : "💾 Save"}
          </button>
          <button onClick={onCancel} style={{ background:"transparent", color:"#9a7fa0", border:"1px solid #3a2a5a", borderRadius:6, padding:"5px 12px", cursor:"pointer", fontSize:12 }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function EraSeparator({ era }) {
  const ac = era.color || "#7c5cbf";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, margin:"10px 0 6px", padding:"9px 16px",
      background:`${ac}18`, border:`1px solid ${ac}44`, borderLeft:`4px solid ${ac}`, borderRadius:8 }}>
      <span style={{ fontFamily:"Georgia,serif", fontWeight:700, fontSize:14, color:ac }}>{era.name}</span>
      {(era.startYear || era.endYear) && (
        <span style={{ fontSize:11, color:"#9a8ab0" }}>{era.startYear}{era.endYear ? ` — ${era.endYear}` : ""}</span>
      )}
    </div>
  );
}

export default function Timeline({ events, chars, eras, onSaveEvent, onDelete, onOpenChar, onReorder, currentTimelineDate, highlightEventId, onHighlightClear }) {
  const { openGallery } = useGallery();
  const [collapsed, setCollapsed] = useState({});
  const [lightbox, setLightbox] = useState(null);
  const [dragEvId, setDragEvId] = useState(null);
  const [dragOverEvId, setDragOverEvId] = useState(null);
  const [editingEvId, setEditingEvId] = useState(null);
  const [editDraft, setEditDraft] = useState({});
  const [addingGroupKey, setAddingGroupKey] = useState(null); // "__top__" or a date group key
  const [addDraft, setAddDraft] = useState({});
  const entryRefs = useRef({});
  const groupRefs = useRef({});
  const eraRefs = useRef({});
  const [activeKey, setActiveKey] = useState(null);
  const toggle = key => setCollapsed(c => ({...c, [key]: !c[key]}));
  const highlightedEvent = highlightEventId ? events.find(e => e.id === highlightEventId) : null;
  const highlightedGroupKey = highlightedEvent
    ? `${highlightedEvent.year||""}|${highlightedEvent.month||""}|${highlightedEvent.day||""}`
    : null;

  const jumpTo = key => {
    setActiveKey(key);
    const el = groupRefs.current[key];
    if (el) el.scrollIntoView({ behavior:"smooth", block:"center" });
  };
  const jumpToEra = eraId => {
    const el = eraRefs.current[eraId];
    if (el) el.scrollIntoView({ behavior:"smooth", block:"center" });
  };

  const groupMap = {};
  const groupOrder = [];
  const undated = [];

  sortEventsDesc(events).forEach(ev => {
    const hasDate = ev.year || ev.month || ev.day;
    if (!hasDate) { undated.push(ev); return; }
    const key = `${ev.year||""}|${ev.month||""}|${ev.day||""}`;
    if (!groupMap[key]) {
      groupMap[key] = { key, year:ev.year||"", month:ev.month||"", day:ev.day||"", events:[] };
      groupOrder.push(key);
    }
    groupMap[key].events.push(ev);
  });

  const minEventYear = groupOrder.length > 0 ? parseInt(groupMap[groupOrder[groupOrder.length - 1]].year) : null;
  const tailEras = (eras || [])
    .filter(era => {
      const sy = parseInt(era.startYear);
      return !isNaN(sy) && era.startYear && minEventYear !== null && sy <= minEventYear;
    })
    .sort((a, b) => parseInt(b.startYear) - parseInt(a.startYear));

  useEffect(() => {
    if (!highlightEventId) return;
    const timer = setTimeout(() => {
      const el = entryRefs.current[highlightEventId];
      if (el) { el.scrollIntoView({ behavior:"smooth", block:"center" }); }
    }, 80);
    return () => clearTimeout(timer);
  }, [highlightEventId]);

  const startAdd = (prefill) => {
    const key = prefill ? `${prefill.year||""}|${prefill.month||""}|${prefill.day||""}` : "__top__";
    setAddingGroupKey(key);
    setAddDraft({ ...defaultEvent, ...(prefill||{}) });
    setEditingEvId(null);
  };

  const cancelAdd = () => { setAddingGroupKey(null); setAddDraft({}); };
  const commitAdd = (draft) => { onSaveEvent(draft); setAddingGroupKey(null); setAddDraft({}); };

  const startEdit = ev => { setEditingEvId(ev.id); setEditDraft({...ev}); setAddingGroupKey(null); };
  const cancelEdit = () => { setEditingEvId(null); setEditDraft({}); };
  const commitEdit = (draft) => { onSaveEvent(draft); setEditingEvId(null); setEditDraft({}); };

  const renderNewCard = (prefill) => {
    const key = prefill ? `${prefill.year||""}|${prefill.month||""}|${prefill.day||""}` : "__top__";
    if (addingGroupKey !== key) return null;
    return (
      <div style={{ display:"flex", gap:0, position:"relative" }}>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:32, flexShrink:0 }}>
          <div style={{ width:2, flex:1, background:"transparent" }}/>
          <div style={{ width:10, height:10, borderRadius:"50%", background:"#c8a96e", border:"2px solid #c8a96e", flexShrink:0 }}/>
          <div style={{ width:2, flex:1, background:"#2a1f3d" }}/>
        </div>
        <div style={{ flex:1, minWidth:0, margin:"6px 0", background:"#131020", border:"1px solid #c8a96e44", borderLeft:"3px solid #c8a96e", borderRadius:8, padding:"12px 12px" }}>
          <EventForm draft={addDraft} setDraft={setAddDraft} chars={chars}
            currentTimelineDate={currentTimelineDate} onSave={commitAdd} onCancel={cancelAdd} isNew/>
        </div>
      </div>
    );
  };

  const renderEntry = (ev, isFirst, isLast) => {
    const evChars = chars.filter(c => (ev.characterIds||[]).includes(c.id));
    const isHighlighted = ev.id === highlightEventId;
    const isDragging = dragEvId === ev.id;
    const isOver = dragOverEvId === ev.id && dragEvId !== ev.id;
    const isEditing = editingEvId === ev.id;

    return (
      <div key={ev.id} ref={el => { if(el) entryRefs.current[ev.id]=el; else delete entryRefs.current[ev.id]; }}
        onDragOver={onReorder ? e=>{ e.preventDefault(); setDragOverEvId(ev.id); } : undefined}
        onDragLeave={onReorder ? e=>{ if(!e.currentTarget.contains(e.relatedTarget)) setDragOverEvId(null); } : undefined}
        onDrop={onReorder ? ()=>{ if(dragEvId){ onReorder(dragEvId, ev.id); setDragEvId(null); setDragOverEvId(null); } } : undefined}
        onClick={isHighlighted && onHighlightClear ? onHighlightClear : undefined}
        style={{ display:"flex", gap:0, position:"relative", opacity: isDragging ? 0.4 : 1, transition:"opacity .1s" }}>

        {/* Rail + dot */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:32, flexShrink:0 }}>
          <div style={{ width:2, flex:1, background: isFirst ? "transparent" : "#2a1f3d" }}/>
          <div style={{ width:10, height:10, borderRadius:"50%", background: isEditing ? "#c8a96e" : isHighlighted ? "#7c5cbf" : "#3a2a5a", border:`2px solid ${isEditing?"#c8a96e":isHighlighted?"#c8a96e":"#5a4a7a"}`, flexShrink:0, transition:"background .3s, border-color .3s" }}/>
          <div style={{ width:2, flex:1, background: isLast ? "transparent" : "#2a1f3d" }}/>
        </div>

        {/* Card */}
        <div style={{
          flex:1, minWidth:0, margin:"6px 0",
          background: isEditing ? "#131020" : isHighlighted ? "#1e1640" : "#0f0c1a",
          border:`1px solid ${isEditing?"#c8a96e44":isOver?"#7c5cbf":isHighlighted?"#7c5cbf":"#1e1630"}`,
          borderLeft:`3px solid ${isEditing?"#c8a96e":isOver?"#7c5cbf":isHighlighted?"#7c5cbf":"#2a1f3d"}`,
          borderRadius:8, padding:"10px 12px",
          transition:"background .3s, border-color .15s",
        }}>
          {isEditing ? (
            <EventForm draft={editDraft} setDraft={setEditDraft} chars={chars}
              currentTimelineDate={currentTimelineDate} onSave={commitEdit} onCancel={cancelEdit}/>
          ) : (
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              {/* Drag handle — centered across full card height */}
              {onReorder && (
                <div draggable
                  onDragStart={e=>{ e.dataTransfer.effectAllowed="move"; setDragEvId(ev.id); }}
                  onDragEnd={()=>{ setDragEvId(null); setDragOverEvId(null); }}
                  style={{ color:"#3a2a5a", cursor:"grab", fontSize:14, flexShrink:0, userSelect:"none", lineHeight:1, alignSelf:"center" }}
                  onMouseEnter={e=>e.currentTarget.style.color="#7c5cbf"} onMouseLeave={e=>e.currentTarget.style.color="#3a2a5a"}>⠿</div>
              )}
              {/* Content column */}
              <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", gap:6 }}>
                {/* Top row: image + title + buttons */}
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  {ev.image ? (
                    <div style={{ flexShrink:0, display:"flex", flexDirection:"column", gap:4, alignItems:"stretch" }}>
                      <img src={ev.image} alt="" onClick={() => setLightbox(ev.image)} style={{ width:52, height:52, objectFit:"cover", borderRadius:6, border:"1px solid #2a1f3d", cursor:"zoom-in", display:"block" }}/>
                      <button onClick={() => openGallery(src => onSaveEvent({...ev, image:src}))}
                        style={{ fontSize:10, background:"transparent", border:"1px solid #2a1f3d", borderRadius:4, color:"#5a4a7a", cursor:"pointer", padding:"2px 0", lineHeight:1.4, transition:"all .12s" }}
                        onMouseEnter={e=>{ e.currentTarget.style.borderColor="#7c5cbf"; e.currentTarget.style.color="#9a7fe0"; }}
                        onMouseLeave={e=>{ e.currentTarget.style.borderColor="#2a1f3d"; e.currentTarget.style.color="#5a4a7a"; }}>Gallery</button>
                      <button onClick={() => onSaveEvent({...ev, image:null})}
                        style={{ fontSize:10, background:"transparent", border:"1px solid #2a1f3d", borderRadius:4, color:"#5a4a7a", cursor:"pointer", padding:"2px 0", lineHeight:1.4, transition:"all .12s" }}
                        onMouseEnter={e=>{ e.currentTarget.style.borderColor="#c06060"; e.currentTarget.style.color="#c06060"; }}
                        onMouseLeave={e=>{ e.currentTarget.style.borderColor="#2a1f3d"; e.currentTarget.style.color="#5a4a7a"; }}>Remove</button>
                    </div>
                  ) : null}
                  <div style={{ flex:1, minWidth:0 }}>
                    {ev.title
                      ? <div onClick={()=>startEdit(ev)} style={{ fontSize:14, color:"#e8d5b7", fontWeight:700, fontFamily:"Georgia,serif", cursor:"text", lineHeight:1.4 }}
                          onMouseEnter={e=>e.currentTarget.style.opacity=.75} onMouseLeave={e=>e.currentTarget.style.opacity=1}>{ev.title}</div>
                      : <div onClick={()=>startEdit(ev)} style={{ fontSize:12, color:"#3a2a5a", cursor:"text", fontStyle:"italic" }}>Click to edit…</div>
                    }
                  </div>
                  <div style={{ display:"flex", gap:3, flexShrink:0, opacity:0.35, transition:"opacity .15s" }}
                    onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.35}>
                    <button onClick={()=>startEdit(ev)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:14, padding:4, borderRadius:4 }}>✏️</button>
                    <button onClick={() => onDelete(ev.id)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:14, padding:4, borderRadius:4, color:"#c06060" }}>🗑️</button>
                  </div>
                </div>
                {/* Description — full width */}
                {ev.description && (
                  <div onClick={()=>startEdit(ev)} style={{ fontSize:13, color:"#9a7fa0", lineHeight:1.6, cursor:"text" }}
                    onMouseEnter={e=>e.currentTarget.style.opacity=.75} onMouseLeave={e=>e.currentTarget.style.opacity=1}>
                    {ev.description}
                  </div>
                )}
                {/* Character chips — full width */}
                {evChars.length > 0 && (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {evChars.map(c => (
                      <div key={c.id}
                        onClick={e=>{ if(!onOpenChar) return; if(e.ctrlKey||e.metaKey){e.preventDefault();onOpenChar(c,{newTab:true});}else{onOpenChar(c);} }}
                        onAuxClick={e=>{ if(e.button===1&&onOpenChar){e.preventDefault();onOpenChar(c,{newTab:true});} }}
                        style={{ display:"flex", alignItems:"center", gap:7, background:"#13101f", border:"1px solid #2a1f3d", borderRadius:6, padding:"5px 10px 5px 6px", cursor: onOpenChar?"pointer":"default" }}
                        onMouseEnter={e=>{ if(onOpenChar) e.currentTarget.style.borderColor="#5a3da0"; }}
                        onMouseLeave={e=>{ if(onOpenChar) e.currentTarget.style.borderColor="#2a1f3d"; }}>
                        <Avatar src={c.image} name={c.name} size={26}/>
                        <div style={{ display:"flex", flexDirection:"column", gap:1 }}>
                          <span style={{ fontSize:12, color:"#c8b89a", fontWeight:700, lineHeight:1.2 }}>{c.name}</span>
                          {c.shortDescription && <span style={{ fontSize:10, color:"#7c5cbf", lineHeight:1.2 }}>{c.shortDescription}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderJumpBar = () => {
    if (groupOrder.length === 0) return null;
    const items = [];
    groupOrder.forEach((key, i) => {
      const group = groupMap[key];
      const prevKey = groupOrder[i - 1];
      const prevYear = prevKey ? parseInt(groupMap[prevKey].year) : null;
      const currYear = parseInt(group.year);
      // Era markers (approach 1: startYear between groups)
      if (group.year) {
        (eras || [])
          .filter(era => {
            const sy = parseInt(era.startYear);
            return !isNaN(sy) && era.startYear && sy > currYear && prevYear !== null && prevYear >= sy;
          })
          .sort((a, b) => parseInt(b.startYear) - parseInt(a.startYear))
          .forEach(era => {
            const ac = era.color || "#7c5cbf";
            items.push(
              <div key={`era-jump-${era.id}`} onClick={() => jumpToEra(era.id)}
                style={{ position:"relative", zIndex:2, display:"flex", flexDirection:"column", alignItems:"center", padding:"0 10px", flexShrink:0, cursor:"pointer" }}
                onMouseEnter={e => e.currentTarget.style.opacity="0.75"} onMouseLeave={e => e.currentTarget.style.opacity="1"}>
                <div style={{ fontSize:10, fontFamily:"Georgia,serif", fontWeight:700, color:ac, marginBottom:4, whiteSpace:"nowrap", letterSpacing:.5 }}>✦ {era.name}</div>
                <div style={{ width:3, height:14, background:ac, borderRadius:2, flexShrink:0 }}/>
                <div style={{ fontSize:9, color:ac+"99", marginTop:3, whiteSpace:"nowrap" }}>{era.startYear}</div>
              </div>
            );
          });
      }
      // Group dot
      const isActive = activeKey === key;
      const showLabel = i === 0 || groupMap[groupOrder[i-1]]?.year !== group.year;
      items.push(
        <div key={key} onClick={() => jumpTo(key)}
          style={{ position:"relative", zIndex:1, display:"flex", flexDirection:"column", alignItems:"center", cursor:"pointer", padding:"0 6px", flexShrink:0 }}>
          <div style={{ fontSize:10, fontFamily:"Georgia,serif", fontWeight:700, color:isActive?"#c8a96e":"#7c5cbf", marginBottom:4, letterSpacing:.5, opacity:showLabel?1:0, pointerEvents:"none", whiteSpace:"nowrap" }}>{group.year || "?"}</div>
          <div style={{ width:isActive?14:9, height:isActive?14:9, borderRadius:"50%", background:isActive?"#c8a96e":"#7c5cbf", border:`2px solid ${isActive?"#c8a96e":"#5a3da0"}`, boxShadow:isActive?"0 0 10px #c8a96e88":"none", transition:"all .15s", flexShrink:0 }}/>
          <div style={{ fontSize:9, color:isActive?"#c8a96e99":"#4a3a6a", marginTop:3, whiteSpace:"nowrap" }}>{group.events.length}</div>
        </div>
      );
    });
    // Tail era markers
    tailEras.forEach(era => {
      const ac = era.color || "#7c5cbf";
      items.push(
        <div key={`era-jump-tail-${era.id}`} onClick={() => jumpToEra(era.id)}
          style={{ position:"relative", zIndex:2, display:"flex", flexDirection:"column", alignItems:"center", padding:"0 10px", flexShrink:0, cursor:"pointer" }}
          onMouseEnter={e => e.currentTarget.style.opacity="0.75"} onMouseLeave={e => e.currentTarget.style.opacity="1"}>
          <div style={{ fontSize:10, fontFamily:"Georgia,serif", fontWeight:700, color:ac, marginBottom:4, whiteSpace:"nowrap", letterSpacing:.5 }}>✦ {era.name}</div>
          <div style={{ width:3, height:14, background:ac, borderRadius:2, flexShrink:0 }}/>
          <div style={{ fontSize:9, color:ac+"99", marginTop:3, whiteSpace:"nowrap" }}>{era.startYear}</div>
        </div>
      );
    });
    return (
      <div style={{ borderBottom:"1px solid #2a1f3d", paddingBottom:10, marginBottom:16 }}>
        <div style={{ overflowX:"auto", display:"flex", alignItems:"center", paddingBottom:4, scrollbarWidth:"thin", scrollbarColor:"#3a2a5a transparent" }}>
          <div style={{ position:"relative", display:"flex", alignItems:"center", gap:0, minWidth:"max-content" }}>
            <div style={{ position:"absolute", top:"50%", left:0, right:0, height:2, background:"linear-gradient(90deg,transparent,#3a2a5a 5%,#3a2a5a 95%,transparent)", transform:"translateY(-50%)", zIndex:0 }}/>
            {items}
          </div>
        </div>
      </div>
    );
  };

  const renderGroup = (group, labelOverride, dimmed) => {
    const isOpen = group.key === highlightedGroupKey || !collapsed[group.key];
    const label = labelOverride || formatEventDate({year:group.year, month:group.month, day:group.day}) || "No date";
    const groupAddKey = `${group.year||""}|${group.month||""}|${group.day||""}`;
    const isActive = activeKey === group.key;
    return (
      <div key={group.key} ref={el => { groupRefs.current[group.key] = el; }} style={{ marginBottom:18, scrollMargin:"40%" }}>
        <div onClick={() => toggle(group.key)}
          style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 14px 8px 10px", background:"#1a1228", border:`1px solid ${isActive?"#c8a96e44":"#3a2a5a"}`, borderRadius:8, cursor:"pointer", userSelect:"none", transition:"border-color .15s" }}>
          <span style={{ fontSize:10, color:"#7c5cbf", flexShrink:0 }}>{isOpen ? "▼" : "▶"}</span>
          <span style={{ fontFamily:"Georgia,serif", fontWeight:700, fontSize:15, color: dimmed?"#6a5a8a":"#c8a96e", flex:1 }}>📅 {label}</span>
          <span style={{ fontSize:11, color:"#5a4a7a", marginRight:6 }}>{group.events.length} event{group.events.length!==1?"s":""}</span>
          <button onClick={e => { e.stopPropagation(); startAdd({ year:group.year, month:group.month, day:group.day }); }}
            style={{...btnSecondary, fontSize:11, padding:"3px 10px", flexShrink:0}}>+ Add</button>
        </div>
        {isOpen && (
          <div style={{ paddingLeft:14 }}>
            {renderNewCard({ year:group.year, month:group.month, day:group.day })}
            {group.events.map((ev, i) => renderEntry(ev, i===0 && addingGroupKey!==groupAddKey, i===group.events.length-1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {renderJumpBar()}
      {/* Top new event */}
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom: addingGroupKey==="__top__" ? 0 : 12 }}>
        {addingGroupKey !== "__top__" && (
          <button onClick={()=>startAdd(null)} style={{...btnPrimary, fontSize:12, padding:"5px 14px"}}>+ New Event</button>
        )}
      </div>
      {addingGroupKey === "__top__" && (
        <div style={{ background:"#131020", border:"1px solid #c8a96e44", borderLeft:"3px solid #c8a96e", borderRadius:8, padding:"12px 14px", marginBottom:16 }}>
          <EventForm draft={addDraft} setDraft={setAddDraft} chars={chars}
            currentTimelineDate={currentTimelineDate} onSave={commitAdd} onCancel={cancelAdd} isNew/>
        </div>
      )}

      {events.length === 0 && addingGroupKey !== "__top__"
        ? <div style={{ textAlign:"center", padding:"24px 0", color:"#5a4a7a", border:"1px dashed #2a1f3d", borderRadius:8, fontSize:13 }}>No events yet.</div>
        : (
          <div>
            {groupOrder.map((key, idx) => {
              const group = groupMap[key];
              const prevKey = groupOrder[idx - 1];
              const prevYear = prevKey ? parseInt(groupMap[prevKey].year) : null;
              const currYear = parseInt(group.year);
              const separators = (eras || [])
                .filter(era => {
                  const sy = parseInt(era.startYear);
                  return !isNaN(sy) && era.startYear && sy > currYear && prevYear !== null && prevYear >= sy;
                })
                .sort((a, b) => parseInt(b.startYear) - parseInt(a.startYear));
              return [
                ...separators.map(era => (
                  <div key={`sep-${era.id}-${key}`} ref={el => { if (el) eraRefs.current[era.id] = el; }}>
                    <EraSeparator era={era}/>
                  </div>
                )),
                renderGroup(group),
              ];
            })}
            {tailEras.map(era => (
              <div key={`tail-sep-${era.id}`} ref={el => { if (el) eraRefs.current[era.id] = el; }}>
                <EraSeparator era={era}/>
              </div>
            ))}
            {undated.length > 0 && renderGroup(
              { key:"__undated__", year:"", month:"", day:"", events: undated },
              "No date set", true
            )}
          </div>
        )
      }
      <Lightbox src={lightbox} onClose={()=>setLightbox(null)}/>
    </div>
  );
}
