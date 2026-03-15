import { useState, useEffect, useRef } from "react";
import { btnPrimary, btnSecondary, iconBtn } from "../constants.js";
import { formatEventDate, sortEventsDesc } from "../utils.jsx";
import Avatar from "./Avatar.jsx";
import Lightbox from "./Lightbox.jsx";

export default function Timeline({ events, chars, onAdd, onEdit, onDelete, onOpenChar, onMove, highlightEventId, onHighlightClear }) {
  const [collapsed, setCollapsed] = useState({});
  const [lightbox, setLightbox] = useState(null);
  const entryRefs = useRef({});
  const toggle = key => setCollapsed(c => ({...c, [key]: !c[key]}));

  // Build date groups in newest-first order
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

  useEffect(() => {
    if (!highlightEventId) return;
    const ev = events.find(e => e.id === highlightEventId);
    if (!ev) return;
    const key = `${ev.year||""}|${ev.month||""}|${ev.day||""}`;
    setCollapsed(c => { if (c[key]) { const next = {...c}; delete next[key]; return next; } return c; });
    const timer = setTimeout(() => {
      const el = entryRefs.current[highlightEventId];
      if (el) { el.scrollIntoView({ behavior:"smooth", block:"center" }); }
    }, 80);
    return () => clearTimeout(timer);
  }, [highlightEventId]); // eslint-disable-line

  const renderEntry = (ev, isFirst, isLast) => {
    const evChars = chars.filter(c => (ev.characterIds||[]).includes(c.id));
    const isHighlighted = ev.id === highlightEventId;
    return (
      <div key={ev.id} ref={el => { if(el) entryRefs.current[ev.id]=el; else delete entryRefs.current[ev.id]; }}
        onClick={isHighlighted && onHighlightClear ? onHighlightClear : undefined}
        style={{ borderBottom:"1px solid #1e1630", background: isHighlighted ? "#2a1f4a" : "#0d0b14", outline: isHighlighted ? "2px solid #7c5cbf" : "none", transition:"background .4s, outline .4s", cursor: isHighlighted ? "default" : undefined }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"11px 14px" }}>
        {onMove && (
          <div style={{ display:"flex", flexDirection:"column", gap:1, flexShrink:0, alignSelf:"center" }}>
            <button onClick={() => onMove(ev.id, "up")} disabled={isFirst} style={{ background:"none", border:"none", color:isFirst?"#2a1f3d":"#7c5cbf", cursor:isFirst?"default":"pointer", fontSize:16, lineHeight:1, padding:"2px 4px" }}>▲</button>
            <button onClick={() => onMove(ev.id, "down")} disabled={isLast} style={{ background:"none", border:"none", color:isLast?"#2a1f3d":"#7c5cbf", cursor:isLast?"default":"pointer", fontSize:16, lineHeight:1, padding:"2px 4px" }}>▼</button>
          </div>
        )}
        {ev.image && <img src={ev.image} alt="" onClick={() => setLightbox(ev.image)} style={{ width:56, height:56, objectFit:"cover", borderRadius:6, flexShrink:0, border:"1px solid #2a1f3d", cursor:"zoom-in" }}/>}
        <div style={{ flex:1, minWidth:0 }}>
          {ev.title && <div style={{ fontSize:14, color:"#e8d5b7", fontWeight:700, fontFamily:"Georgia,serif", marginBottom:ev.description?4:0 }}>{ev.title}</div>}
          {ev.description && <div style={{ fontSize:13, color:"#b09080", lineHeight:1.6, whiteSpace:"pre-wrap", marginBottom:evChars.length>0?6:0 }}>{ev.description}</div>}
          {evChars.length>0 && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
              {evChars.map(c => (
                <div key={c.id}
                  onClick={onOpenChar ? e => { if(e.ctrlKey||e.metaKey){e.preventDefault();onOpenChar(c,{newTab:true});}else{onOpenChar(c);} } : undefined}
                  onAuxClick={onOpenChar ? e => { if(e.button===1){e.preventDefault();onOpenChar(c,{newTab:true});} } : undefined}
                  style={{ display:"flex", alignItems:"center", gap:4, background:"#1e1630", borderRadius:12, padding:"2px 8px 2px 4px", cursor:onOpenChar?"pointer":"default", transition:"background .12s" }}
                  onMouseEnter={e => { if(onOpenChar) e.currentTarget.style.background="#2a1f50"; }}
                  onMouseLeave={e => { if(onOpenChar) e.currentTarget.style.background="#1e1630"; }}>
                  <Avatar src={c.image} name={c.name} size={16}/>
                  <span style={{ fontSize:11, color:"#9a7fa0" }}>{c.name}{onOpenChar&&<span style={{ fontSize:9, opacity:.6, marginLeft:2 }}>↗</span>}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display:"flex", gap:3, flexShrink:0 }}>
          <button onClick={() => onEdit(ev)} style={iconBtn}>✏️</button>
          <button onClick={() => onDelete(ev.id)} style={{...iconBtn, color:"#c06060"}}>🗑️</button>
        </div>
      </div>
      </div>
    );
  };

  const renderGroup = (group, labelOverride, dimmed) => {
    const isOpen = !collapsed[group.key];
    const label = labelOverride || formatEventDate({year:group.year, month:group.month, day:group.day}) || "No date";
    return (
      <div key={group.key} style={{ marginBottom:10, border:"1px solid #3a2a5a", borderRadius:10, overflow:"hidden" }}>
        {/* Date header */}
        <div onClick={() => toggle(group.key)}
          style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"#2a1f3d", cursor:"pointer", userSelect:"none" }}>
          <span style={{ fontSize:11, color:"#7c5cbf", flexShrink:0 }}>{isOpen ? "▼" : "▶"}</span>
          <span style={{ fontFamily:"Georgia,serif", fontWeight:700, fontSize:14, color: dimmed?"#6a5a8a":"#c8a96e", flex:1 }}>📅 {label}</span>
          <span style={{ fontSize:11, color:"#5a4a7a", marginRight:6 }}>{group.events.length} event{group.events.length!==1?"s":""}</span>
          <button
            onClick={e => { e.stopPropagation(); onAdd({ year:group.year, month:group.month, day:group.day }); }}
            style={{...btnSecondary, fontSize:11, padding:"3px 10px", flexShrink:0}}>
            + Add
          </button>
        </div>
        {/* Entries */}
        {isOpen && (
          <div>
            {group.events.map((ev, i) => renderEntry(ev, i===0, i===group.events.length-1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ fontSize:11, color:"#7c5cbf", letterSpacing:1, textTransform:"uppercase", fontWeight:700 }}>⏳ Timeline</div>
        <button onClick={() => onAdd(null)} style={{...btnPrimary, fontSize:12, padding:"5px 14px"}}>+ New Date</button>
      </div>

      {events.length === 0
        ? <div style={{ textAlign:"center", padding:"24px 0", color:"#5a4a7a", border:"1px dashed #2a1f3d", borderRadius:8, fontSize:13 }}>No events yet.</div>
        : (
          <div>
            {groupOrder.map(key => renderGroup(groupMap[key]))}
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
