import { useState } from "react";
import { STATUS_COLORS } from "../constants.js";
import { formatEventDate, sortEventsDesc } from "../utils.jsx";
import Avatar from "./Avatar.jsx";
import LinkBadge from "./LinkBadge.jsx";
import Lightbox from "./Lightbox.jsx";

export default function GlobalTimeline({ stories, chars, loreEvents, onOpenStory, onOpenChar }) {
  const [collapsed, setCollapsed] = useState({});
  const [lightbox, setLightbox] = useState(null);
  const toggle = key => setCollapsed(c => ({...c, [key]: !c[key]}));

  const allEvents = [];
  stories.forEach(s => {
    (s.events||[]).forEach(ev => allEvents.push({...ev, storyId:s.id, storyName:s.name, storyStatus:s.status}));
  });
  (loreEvents||[]).forEach(ev => allEvents.push({...ev, storyId:"__lore__", storyName:"Lore", storyStatus:"lore"}));

  // Group by exact date key (year|month|day), newest first
  const groupMap = {};
  const groupOrder = [];
  const undated = [];

  sortEventsDesc(allEvents).forEach(ev => {
    const hasDate = ev.year || ev.month || ev.day;
    if (!hasDate) { undated.push(ev); return; }
    const key = `${ev.year||""}|${ev.month||""}|${ev.day||""}`;
    if (!groupMap[key]) {
      groupMap[key] = { key, year:ev.year||"", month:ev.month||"", day:ev.day||"", events:[] };
      groupOrder.push(key);
    }
    groupMap[key].events.push(ev);
  });

  if (allEvents.length === 0) return (
    <div style={{ textAlign:"center", padding:"80px 0", color:"#5a4a7a" }}>
      <div style={{ fontSize:40, marginBottom:12 }}>⏳</div>
      <div style={{ fontSize:16, fontFamily:"Georgia,serif" }}>No events yet</div>
      <div style={{ fontSize:13, marginTop:6 }}>Add events inside Stories or the Lore tab to see them here.</div>
    </div>
  );

  const renderEvent = ev => {
    const evChars = chars.filter(c => (ev.characterIds||[]).includes(c.id));
    return (
      <div key={ev.id} style={{ borderBottom:"1px solid #1e1630" }}>
        <div style={{ display:"flex", gap:8, padding:"10px 12px", alignItems:"flex-start" }}>
        {ev.image && <img src={ev.image} alt="" onClick={() => setLightbox(ev.image)} style={{ width:48, height:48, objectFit:"cover", borderRadius:6, flexShrink:0, border:"1px solid #2a1f3d", cursor:"zoom-in" }}/>}
        <div style={{ flex:1, minWidth:0 }}>
        {ev.title && <div style={{ fontSize:13, color:"#e8d5b7", fontWeight:700, fontFamily:"Georgia,serif", marginBottom:ev.description?3:0 }}>{ev.title}</div>}
        {ev.description && <div style={{ fontSize:12, color:"#b09080", lineHeight:1.5, whiteSpace:"pre-wrap", marginBottom:evChars.length>0?6:0 }}>{ev.description}</div>}
        {evChars.length > 0 && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
            {evChars.map(c => (
              <div key={c.id}
                onClick={onOpenChar ? e => { if(e.ctrlKey||e.metaKey){e.preventDefault();onOpenChar(c,{newTab:true});}else{onOpenChar(c);} } : undefined}
                onAuxClick={onOpenChar ? e => { if(e.button===1){e.preventDefault();onOpenChar(c,{newTab:true});} } : undefined}
                style={{ display:"flex", alignItems:"center", gap:3, background:"#1e1630", borderRadius:10, padding:"2px 7px 2px 3px", cursor:onOpenChar?"pointer":"default", transition:"background .12s" }}
                onMouseEnter={e => { if(onOpenChar) e.currentTarget.style.background="#2a1f50"; }}
                onMouseLeave={e => { if(onOpenChar) e.currentTarget.style.background="#1e1630"; }}>
                <Avatar src={c.image} name={c.name} size={14}/>
                <span style={{ fontSize:10, color:"#9a7fa0" }}>{c.name}{onOpenChar&&<span style={{ fontSize:8, opacity:.6, marginLeft:2 }}>↗</span>}</span>
              </div>
            ))}
          </div>
        )}
        </div>
        </div>
      </div>
    );
  };

  const renderGroup = (group, labelOverride, dimmed, isLast) => {
    const isOpen = !collapsed[group.key];
    const label = labelOverride || formatEventDate({year:group.year, month:group.month, day:group.day}) || "No date";

    // Group events by story for horizontal layout
    const storyMap = new Map();
    group.events.forEach(ev => {
      const s = ev.storyId === "__lore__"
        ? { id:"__lore__", name:"Lore", status:"lore", image:null }
        : stories.find(x => x.id === ev.storyId);
      if (!s) return;
      if (!storyMap.has(s.id)) storyMap.set(s.id, { story: s, events: [] });
      storyMap.get(s.id).events.push(ev);
    });
    const storyColumns = [...storyMap.values()];

    return (
      <div key={group.key} style={{ display:"flex", gap:0 }}>
        {/* Spine column */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:40, flexShrink:0 }}>
          <div style={{ width:2, flex:"0 0 22px", background:"#3a2a5a" }}/>
          <div onClick={() => toggle(group.key)} style={{ width:12, height:12, borderRadius:"50%", background:dimmed?"#3a2a5a":"#7c5cbf", border:"2px solid "+(dimmed?"#2a1f3d":"#c8a96e"), flexShrink:0, cursor:"pointer", zIndex:1, boxShadow:dimmed?"none":"0 0 8px #7c5cbf66" }}/>
          {!isLast
            ? <div style={{ width:2, flex:1, minHeight:12, background:"#3a2a5a" }}/>
            : isOpen && group.events.length > 0
              ? <div style={{ width:2, flex:1, minHeight:12, background:"#3a2a5a" }}/>
              : <div style={{ width:2, flex:"0 0 12px", background:"#3a2a5a" }}/>
          }
        </div>

        {/* Content column */}
        <div style={{ flex:1, minWidth:0, paddingBottom: isLast ? 0 : 12 }}>
          {/* Date header */}
          <div onClick={() => toggle(group.key)}
            style={{ display:"flex", alignItems:"center", gap:8, paddingTop:14, paddingBottom:10, cursor:"pointer", userSelect:"none" }}>
            <span style={{ fontFamily:"Georgia,serif", fontWeight:700, fontSize:14, color:dimmed?"#6a5a8a":"#c8a96e", flex:1 }}>{label}</span>
            <span style={{ fontSize:11, color:"#5a4a7a" }}>
              {group.events.length} event{group.events.length!==1?"s":""}
              {!dimmed && storyColumns.length > 1 && ` · ${storyColumns.length} stories`}
            </span>
            <span style={{ fontSize:10, color:"#7c5cbf", marginLeft:4 }}>{isOpen ? "▼" : "▶"}</span>
          </div>

          {/* Horizontal story cards */}
          {isOpen && (
            <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"flex-start", marginBottom:4 }}>
              {storyColumns.map(({ story: s, events: sevents }) => (
                <div key={s.id} style={{ flex:"1 1 220px", minWidth:180, border:`1px solid ${s.id==="__lore__"?"#5a3da0":STATUS_COLORS[s.status]||"#3a2a5a"}55`, borderRadius:8, overflow:"hidden", background:"#0d0b14" }}>
                  {s.id === "__lore__" ? (
                    <div style={{ borderBottom:"1px solid #1e1630", background:"#13101f", display:"flex", alignItems:"center", gap:8, padding:"8px 12px", minHeight:44 }}>
                      <span style={{ fontSize:15 }}>🏛️</span>
                      <span style={{ fontFamily:"Georgia,serif", fontWeight:700, fontSize:13, color:"#c8b89a" }}>Lore</span>
                    </div>
                  ) : (
                    <div
                      onClick={e=>{ if(e.ctrlKey||e.metaKey){e.preventDefault();onOpenStory(s,null,{newTab:true});}else{onOpenStory(s);} }}
                      onAuxClick={e=>{ if(e.button===1){e.preventDefault();onOpenStory(s,null,{newTab:true});} }}
                      style={{ position:"relative", borderBottom:"1px solid #1e1630", background:"#13101f", display:"flex", alignItems:"center", gap:10, padding:"8px 12px", cursor:"pointer", transition:"background .15s", minHeight:44 }}
                      onMouseEnter={e=>e.currentTarget.style.background="#1a1628"}
                      onMouseLeave={e=>e.currentTarget.style.background="#13101f"}>
                      {s.image && <img src={s.image} alt="" style={{ width:32, height:32, objectFit:"cover", borderRadius:5, flexShrink:0, border:`1px solid ${STATUS_COLORS[s.status]||"#3a2a5a"}88` }}/>}
                      <span style={{ fontFamily:"Georgia,serif", fontWeight:700, fontSize:13, color:"#e8d5b7", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.name}</span>
                      <span style={{ fontSize:9, color:"#7c5cbf", flexShrink:0, opacity:.7 }}>↗</span>
                    </div>
                  )}
                  {sevents.map(ev => renderEvent(ev))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const allGroups = [
    ...groupOrder.map(key => ({ group: groupMap[key], dimmed: false })),
    ...(undated.length > 0 ? [{ group: { key:"__undated__", year:"", month:"", day:"", events: undated }, labelOverride:"No date set", dimmed: true }] : [])
  ];

  return (
    <div style={{ paddingLeft:4 }}>
      {allGroups.map(({ group, labelOverride, dimmed }, i) =>
        renderGroup(group, labelOverride, dimmed, i === allGroups.length - 1)
      )}
      <Lightbox src={lightbox} onClose={()=>setLightbox(null)}/>
    </div>
  );
}
