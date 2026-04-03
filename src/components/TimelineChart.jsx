import { useState } from "react";
import { btnSecondary } from "../constants.js";
import Avatar from "./Avatar.jsx";

const parseYear = y => { const n = parseInt(y, 10); return isNaN(n) ? null : n; };

const fmtDate = ev => {
  const parts = [ev.year, ev.month, ev.day].filter(Boolean);
  return parts.join(" / ") || "Undated";
};

function EventNode({ ev, isFirst, isLast, railColor, chars, onEdit }) {
  const [open, setOpen] = useState(false);
  const evChars = chars.filter(c => (ev.characterIds || []).includes(c.id));

  return (
    <div style={{ display:"flex", gap:0, position:"relative" }}>
      {/* Rail + dot */}
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:32, flexShrink:0 }}>
        <div style={{ width:2, flex:"0 0 10px", background: isFirst ? "transparent" : railColor+"55" }}/>
        <div style={{ width:10, height:10, borderRadius:"50%", background: open ? railColor : "#1a1228", border:`2px solid ${railColor}`, flexShrink:0, transition:"background .15s" }}/>
        <div style={{ width:2, flex:1, background: isLast ? "transparent" : railColor+"55" }}/>
      </div>

      {/* Card */}
      <div onClick={() => setOpen(o => !o)}
        style={{ flex:1, minWidth:0, margin:"4px 0 4px 4px",
          background: open ? "#1a1228" : "transparent",
          border:`1px solid ${open ? railColor+"44" : "transparent"}`,
          borderRadius:8, padding:"7px 12px", cursor:"pointer", transition:"all .15s" }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = "#13101f"; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = "transparent"; }}>

        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:11, color:railColor, background:railColor+"22", border:`1px solid ${railColor}44`,
            borderRadius:6, padding:"1px 8px", whiteSpace:"nowrap", flexShrink:0 }}>
            {fmtDate(ev)}
          </span>
          <span style={{ fontSize:14, color:"#e8d5b7", fontWeight:700, fontFamily:"Georgia,serif",
            flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace: open ? "normal" : "nowrap" }}>
            {ev.title || <span style={{ color:"#3a2a5a", fontStyle:"italic" }}>Untitled</span>}
          </span>
          <span style={{ fontSize:10, color:"#5a4a7a", flexShrink:0 }}>{open ? "▲" : "▼"}</span>
        </div>

        {open && (
          <div style={{ marginTop:10, display:"flex", flexDirection:"column", gap:8 }}>
            {ev.image && <img src={ev.image} alt="" style={{ maxHeight:120, maxWidth:"100%", objectFit:"cover", borderRadius:6, border:"1px solid #2a1f3d" }}/>}
            {ev.description && <p style={{ fontSize:13, color:"#9a7fa0", lineHeight:1.7, margin:0, whiteSpace:"pre-wrap" }}>{ev.description}</p>}
            {evChars.length > 0 && (
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {evChars.map(c => (
                  <div key={c.id} style={{ display:"flex", alignItems:"center", gap:6, background:"#13101f", border:"1px solid #2a1f3d", borderRadius:6, padding:"4px 8px" }}>
                    <Avatar src={c.image} name={c.name} size={20}/>
                    <span style={{ fontSize:12, color:"#c8b89a" }}>{c.name}</span>
                  </div>
                ))}
              </div>
            )}
            <div>
              <button onClick={e => { e.stopPropagation(); onEdit(ev); }}
                style={{ ...btnSecondary, fontSize:12, padding:"4px 12px" }}>✏️ Edit</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ label, color, events, chars, onEdit }) {
  if (events.length === 0) return null;
  return (
    <div style={{ marginBottom:16 }}>
      {/* Era band */}
      <div style={{ background:`${color}18`, border:`1px solid ${color}40`, borderLeft:`4px solid ${color}`,
        borderRadius:8, padding:"10px 18px", marginBottom:2,
        display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontFamily:"Georgia,serif", fontWeight:700, fontSize:15, color }}>{label}</span>
        <span style={{ fontSize:11, color:"#5a4a7a", marginLeft:"auto" }}>{events.length} event{events.length!==1?"s":""}</span>
      </div>
      {/* Events */}
      <div style={{ paddingLeft:16 }}>
        {events.map((ev, i) => (
          <EventNode key={ev.id} ev={ev} isFirst={i===0} isLast={i===events.length-1}
            railColor={color} chars={chars} onEdit={onEdit}/>
        ))}
      </div>
    </div>
  );
}

export default function TimelineChart({ events, chars, eras, onEdit, onAdd }) {
  const sortEvAsc = arr => [...arr].sort((a, b) => {
    const ay = parseYear(a.year), by = parseYear(b.year);
    if (ay !== by) return (ay ?? Infinity) - (by ?? Infinity);
    return (parseInt(a.month)||0)-(parseInt(b.month)||0) || (parseInt(a.day)||0)-(parseInt(b.day)||0);
  });

  const sortedEras = [...eras].sort((a,b) => (parseYear(a.startYear)||0)-(parseYear(b.startYear)||0));

  const assignEra = ev => {
    const y = parseYear(ev.year);
    if (y === null) return null;
    for (const era of sortedEras) {
      const s = parseYear(era.startYear), e = parseYear(era.endYear);
      if ((s === null || y >= s) && (e === null || !era.endYear || y <= e)) return era.id;
    }
    return "__none__";
  };

  const eraGroups = {};
  const noneEvs = [], undatedEvs = [];
  sortEvAsc(events).forEach(ev => {
    const eId = assignEra(ev);
    if (eId === null) { undatedEvs.push(ev); return; }
    if (eId === "__none__") { noneEvs.push(ev); return; }
    if (!eraGroups[eId]) eraGroups[eId] = [];
    eraGroups[eId].push(ev);
  });

  if (events.length === 0) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12, padding:"48px 0", color:"#5a4a7a", border:"1px dashed #2a1f3d", borderRadius:12, fontSize:13, textAlign:"center" }}>
        <div style={{ fontSize:32 }}>📅</div>
        <div>No events yet.</div>
        <button onClick={onAdd} style={{ background:"#2a1f3d", border:"1px solid #3a2a5a", borderRadius:6, color:"#c8a96e", cursor:"pointer", fontSize:13, padding:"6px 16px" }}>+ Add First Event</button>
      </div>
    );
  }

  return (
    <div>
      {/* Top toolbar */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div style={{ fontSize:13, color:"#5a4a7a" }}>
          {events.length} event{events.length!==1?"s":""}{eras.length>0?`, ${eras.length} era${eras.length!==1?"s":""}`:""} — configure eras in Settings
        </div>
        <button onClick={onAdd} style={{ background:"#2a1f3d", border:"1px solid #3a2a5a", borderRadius:6, color:"#c8a96e", cursor:"pointer", fontSize:13, padding:"5px 14px", fontWeight:600 }}>+ New Event</button>
      </div>

      {sortedEras.length === 0 ? (
        /* No eras: all events in one chronological block */
        <Section
          label="📜 All Events"
          color="#7c5cbf"
          events={sortEvAsc(events.filter(e => e.year||e.month||e.day))}
          chars={chars}
          onEdit={onEdit}
        />
      ) : (
        /* Era sections */
        sortedEras.map(era => (
          <Section key={era.id}
            label={`${era.name}${era.startYear ? ` · ${era.startYear}${era.endYear ? ` — ${era.endYear}` : "+"}` : ""}`}
            color={era.color}
            events={eraGroups[era.id] || []}
            chars={chars}
            onEdit={onEdit}
          />
        ))
      )}

      {noneEvs.length > 0 && (
        <Section label="📜 Other Events" color="#5a4a7a" events={noneEvs} chars={chars} onEdit={onEdit}/>
      )}
      {undatedEvs.length > 0 && (
        <Section label="⏱️ Undated" color="#3a2a5a" events={undatedEvs} chars={chars} onEdit={onEdit}/>
      )}
    </div>
  );
}
