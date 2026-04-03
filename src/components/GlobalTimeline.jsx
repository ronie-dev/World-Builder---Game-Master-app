import { useState, useRef } from "react";
import { STATUS_COLORS } from "../constants.js";
import { formatEventDate, sortEventsDesc } from "../utils.jsx";
import Avatar from "./Avatar.jsx";
import Lightbox from "./Lightbox.jsx";

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

export default function GlobalTimeline({ stories, chars, loreEvents, eras, onOpenStory, onOpenChar }) {
  const [collapsed, setCollapsed] = useState({});
  const [lightbox, setLightbox] = useState(null);
  const [activeKey, setActiveKey] = useState(null);
  const groupRefs = useRef({});
  const eraRefs = useRef({});
  const toggle = key => setCollapsed(c => ({...c, [key]: !c[key]}));

  const allEvents = [];
  stories.forEach(s => {
    (s.events||[]).forEach(ev => allEvents.push({...ev, storyId:s.id, storyName:s.name, storyStatus:s.status}));
  });
  (loreEvents||[]).forEach(ev => allEvents.push({...ev, storyId:"__lore__", storyName:"Lore", storyStatus:"lore"}));

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

  const allGroups = [
    ...groupOrder.map(key => ({ group: groupMap[key], dimmed: false })),
    ...(undated.length > 0 ? [{ group: { key:"__undated__", year:"", month:"", day:"", events: undated }, labelOverride:"No date set", dimmed: true }] : [])
  ];

  const datedGroups = allGroups.filter(g => !g.labelOverride && g.group.year);
  const minEventYear = datedGroups.length > 0 ? parseInt(datedGroups[datedGroups.length - 1].group.year) : null;
  const tailEras = (eras || [])
    .filter(era => {
      const sy = parseInt(era.startYear);
      return !isNaN(sy) && era.startYear && minEventYear !== null && sy <= minEventYear;
    })
    .sort((a, b) => parseInt(b.startYear) - parseInt(a.startYear));

  const jumpToEra = eraId => {
    const el = eraRefs.current[eraId];
    if (el) el.scrollIntoView({ behavior:"smooth", block:"center" });
  };

  const jumpTo = key => {
    setActiveKey(key);
    const el = groupRefs.current[key];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  if (allEvents.length === 0) return (
    <div style={{ textAlign:"center", padding:"80px 0", color:"#5a4a7a" }}>
      <div style={{ fontSize:40, marginBottom:12 }}>⏳</div>
      <div style={{ fontSize:16, fontFamily:"Georgia,serif" }}>No events yet</div>
      <div style={{ fontSize:13, marginTop:6 }}>Add events inside Stories or the Lore tab to see them here.</div>
    </div>
  );

  // ── Quick-jump bar ───────────────────────────────────────────────────────────
  const renderJumpBar = () => {
    const items = [];
    allGroups.forEach(({ group, labelOverride, dimmed }, i) => {
      // Insert era markers before this group if era boundary falls here
      if (!labelOverride && group.year) {
        const prevGroup = i > 0 ? allGroups[i - 1] : null;
        const prevYear = (prevGroup && !prevGroup.labelOverride && prevGroup.group.year) ? parseInt(prevGroup.group.year) : null;
        const currYear = parseInt(group.year);
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
      // Normal group dot
      const label = labelOverride || (group.year ? group.year : formatEventDate({year:group.year,month:group.month,day:group.day}) || "?");
      const isActive = activeKey === group.key;
      const showLabel = !labelOverride && group.year
        ? (i === 0 || allGroups[i-1]?.group?.year !== group.year || allGroups[i-1]?.labelOverride)
        : true;
      items.push(
        <div key={group.key} onClick={() => jumpTo(group.key)}
          style={{ position:"relative", zIndex:1, display:"flex", flexDirection:"column", alignItems:"center", cursor:"pointer", padding:"0 6px", flexShrink:0 }}>
          <div style={{ fontSize:10, fontFamily:"Georgia,serif", fontWeight:700, color:isActive?"#c8a96e":dimmed?"#4a3a6a":"#7c5cbf", marginBottom:4, letterSpacing:.5, opacity:showLabel?1:0, pointerEvents:"none", whiteSpace:"nowrap" }}>{label}</div>
          <div style={{ width:isActive?14:9, height:isActive?14:9, borderRadius:"50%", background:isActive?"#c8a96e":dimmed?"#2a1f3d":"#7c5cbf", border:`2px solid ${isActive?"#c8a96e":dimmed?"#3a2a5a":"#5a3da0"}`, boxShadow:isActive?"0 0 10px #c8a96e88":"none", transition:"all .15s", flexShrink:0 }}/>
          <div style={{ fontSize:9, color:isActive?"#c8a96e99":"#4a3a6a", marginTop:3, whiteSpace:"nowrap" }}>{group.events.length}</div>
        </div>
      );
    });
    // Tail eras: startYear below all event years — appear at the right end of the bar
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
      <div style={{ position:"sticky", top:0, zIndex:20, background:"#0d0b14", borderBottom:"1px solid #2a1f3d", paddingBottom:10, marginBottom:16, boxShadow:"0 4px 20px #0d0b14" }}>
        <div style={{ overflowX:"auto", display:"flex", alignItems:"center", paddingBottom:4, scrollbarWidth:"thin", scrollbarColor:"#3a2a5a transparent" }}>
          <div style={{ position:"relative", display:"flex", alignItems:"center", gap:0, minWidth:"max-content" }}>
            <div style={{ position:"absolute", top:"50%", left:0, right:0, height:2, background:"linear-gradient(90deg,transparent,#3a2a5a 5%,#3a2a5a 95%,transparent)", transform:"translateY(-50%)", zIndex:0 }}/>
            {items}
          </div>
        </div>
      </div>
    );
  };

  // ── Single event card ────────────────────────────────────────────────────────
  const renderEvent = (ev, isFirst, isLast) => {
    const evChars = chars.filter(c => (ev.characterIds||[]).includes(c.id));
    const storyColor = ev.storyId === "__lore__" ? "#5a3da0" : STATUS_COLORS[ev.storyStatus] || "#3a2a5a";

    return (
      <div key={ev.id} style={{ display:"flex", gap:0, position:"relative" }}>
        {/* Rail + dot */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:28, flexShrink:0 }}>
          <div style={{ width:2, flex:1, background:isFirst?"transparent":"#2a1f3d" }}/>
          <div style={{ width:8, height:8, borderRadius:"50%", background:"#3a2a5a", border:"2px solid #5a4a7a", flexShrink:0 }}/>
          <div style={{ width:2, flex:1, background:isLast?"transparent":"#2a1f3d" }}/>
        </div>

        {/* Card */}
        <div style={{ flex:1, minWidth:0, margin:"5px 0", background:"#0f0c1a", border:"1px solid #1e1630", borderLeft:`3px solid ${storyColor}55`, borderRadius:8, padding:"8px 10px" }}>
          {/* Top row: image + title */}
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {ev.image && <img src={ev.image} alt="" onClick={() => setLightbox(ev.image)} style={{ width:44, height:44, objectFit:"cover", borderRadius:5, flexShrink:0, border:"1px solid #2a1f3d", cursor:"zoom-in" }}/>}
            <div style={{ flex:1, minWidth:0 }}>
              {ev.title && <div style={{ fontSize:13, color:"#e8d5b7", fontWeight:700, fontFamily:"Georgia,serif", lineHeight:1.4 }}>{ev.title}</div>}
            </div>
          </div>
          {/* Description */}
          {ev.description && <div style={{ fontSize:12, color:"#9a7fa0", lineHeight:1.6, marginTop:5, whiteSpace:"pre-wrap" }}>{ev.description}</div>}
          {/* Characters */}
          {evChars.length > 0 && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:6 }}>
              {evChars.map(c => (
                <div key={c.id}
                  onClick={onOpenChar ? e => { if(e.ctrlKey||e.metaKey){e.preventDefault();onOpenChar(c,{newTab:true});}else{onOpenChar(c);} } : undefined}
                  onAuxClick={onOpenChar ? e => { if(e.button===1){e.preventDefault();onOpenChar(c,{newTab:true});} } : undefined}
                  style={{ display:"flex", alignItems:"center", gap:6, background:"#13101f", border:"1px solid #2a1f3d", borderRadius:6, padding:"4px 9px 4px 5px", cursor:onOpenChar?"pointer":"default" }}
                  onMouseEnter={e=>{ if(onOpenChar) e.currentTarget.style.borderColor="#5a3da0"; }}
                  onMouseLeave={e=>{ if(onOpenChar) e.currentTarget.style.borderColor="#2a1f3d"; }}>
                  <Avatar src={c.image} name={c.name} size={24}/>
                  <div style={{ display:"flex", flexDirection:"column", gap:1 }}>
                    <span style={{ fontSize:11, color:"#c8b89a", fontWeight:700, lineHeight:1.2 }}>{c.name}</span>
                    {c.shortDescription && <span style={{ fontSize:10, color:"#7c5cbf", lineHeight:1.2 }}>{c.shortDescription}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Group renderer ───────────────────────────────────────────────────────────
  const renderGroup = ({ group, labelOverride, dimmed }) => {
    const isOpen = !collapsed[group.key];
    const label = labelOverride || formatEventDate({year:group.year, month:group.month, day:group.day}) || "No date";
    const isActive = activeKey === group.key;

    const storyMap = new Map();
    group.events.forEach(ev => {
      const s = ev.storyId === "__lore__"
        ? { id:"__lore__", name:"Lore", status:"lore", image:null }
        : stories.find(x => x.id === ev.storyId);
      if (!s) return;
      if (!storyMap.has(s.id)) storyMap.set(s.id, { story:s, events:[] });
      storyMap.get(s.id).events.push(ev);
    });
    const storyColumns = [...storyMap.values()];

    return (
      <div key={group.key} ref={el => groupRefs.current[group.key] = el} style={{ marginBottom:16, scrollMargin:"40%" }}>
        {/* Date header */}
        <div onClick={() => toggle(group.key)}
          style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 14px 8px 10px", background:"#1a1228", border:`1px solid ${isActive?"#c8a96e44":"#3a2a5a"}`, borderRadius:8, cursor:"pointer", userSelect:"none", transition:"border-color .15s" }}>
          <span style={{ fontSize:10, color:"#7c5cbf", flexShrink:0 }}>{isOpen ? "▼" : "▶"}</span>
          <span style={{ fontFamily:"Georgia,serif", fontWeight:700, fontSize:15, color:isActive?"#c8a96e":dimmed?"#6a5a8a":"#c8a96e", flex:1 }}>📅 {label}</span>
          <span style={{ fontSize:11, color:"#5a4a7a", marginRight:6 }}>{group.events.length} event{group.events.length!==1?"s":""}{!dimmed&&storyColumns.length>1?` · ${storyColumns.length} stories`:""}</span>
        </div>

        {isOpen && (
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"flex-start", paddingLeft:14, marginTop:8 }}>
            {storyColumns.map(({ story:s, events:sevents }) => (
              <div key={s.id} style={{ flex:"1 1 240px", minWidth:200, border:`1px solid ${s.id==="__lore__"?"#5a3da0":STATUS_COLORS[s.status]||"#3a2a5a"}44`, borderRadius:10, overflow:"hidden", background:"#0d0b14" }}>
                {/* Story header */}
                {s.id === "__lore__" ? (
                  <div style={{ borderBottom:"1px solid #1e1630", background:"#13101f", display:"flex", alignItems:"center", gap:8, padding:"8px 12px" }}>
                    <span style={{ fontSize:15 }}>🏛️</span>
                    <span style={{ fontFamily:"Georgia,serif", fontWeight:700, fontSize:13, color:"#c8b89a" }}>Lore</span>
                  </div>
                ) : (
                  <div
                    onClick={e=>{ if(e.ctrlKey||e.metaKey){e.preventDefault();onOpenStory(s,null,{newTab:true});}else{onOpenStory(s);} }}
                    onAuxClick={e=>{ if(e.button===1){e.preventDefault();onOpenStory(s,null,{newTab:true});} }}
                    style={{ borderBottom:"1px solid #1e1630", background:"#13101f", display:"flex", alignItems:"center", gap:8, padding:"8px 12px", cursor:"pointer", transition:"background .15s" }}
                    onMouseEnter={e=>e.currentTarget.style.background="#1a1628"}
                    onMouseLeave={e=>e.currentTarget.style.background="#13101f"}>
                    {s.image && <img src={s.image} alt="" style={{ width:28, height:28, objectFit:"cover", borderRadius:4, flexShrink:0, border:`1px solid ${STATUS_COLORS[s.status]||"#3a2a5a"}88` }}/>}
                    <span style={{ fontFamily:"Georgia,serif", fontWeight:700, fontSize:13, color:"#e8d5b7", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.name}</span>
                    <span style={{ fontSize:9, color:"#7c5cbf", opacity:.7 }}>↗</span>
                  </div>
                )}
                {/* Events as mini timeline */}
                <div style={{ padding:"6px 8px" }}>
                  {sevents.map((ev, ei) => renderEvent(ev, ei===0, ei===sevents.length-1))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ paddingLeft:4 }}>
      {renderJumpBar()}
      {allGroups.map(({ group, labelOverride, dimmed }, idx) => {
        const items = [];
        if (!labelOverride && group.year) {
          const prevGroup = allGroups[idx - 1];
          const prevYear = (prevGroup && !prevGroup.labelOverride && prevGroup.group.year)
            ? parseInt(prevGroup.group.year) : null;
          const currYear = parseInt(group.year);
          (eras || [])
            .filter(era => {
              const sy = parseInt(era.startYear);
              return !isNaN(sy) && era.startYear && sy > currYear && prevYear !== null && prevYear >= sy;
            })
            .sort((a, b) => parseInt(b.startYear) - parseInt(a.startYear))
            .forEach(era => items.push(
              <div key={`sep-${era.id}-${group.key}`} ref={el => { if (el) eraRefs.current[era.id] = el; }}>
                <EraSeparator era={era}/>
              </div>
            ));
        }
        items.push(renderGroup({ group, labelOverride, dimmed }, idx));
        return items;
      })}
      {tailEras.map(era => (
        <div key={`tail-sep-${era.id}`} ref={el => { if (el) eraRefs.current[era.id] = el; }}>
          <EraSeparator era={era}/>
        </div>
      ))}
      <Lightbox src={lightbox} onClose={()=>setLightbox(null)}/>
    </div>
  );
}
