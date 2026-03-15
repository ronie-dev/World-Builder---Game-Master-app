import { useState } from "react";
import { inputStyle, btnPrimary, btnSecondary, defaultEvent } from "../constants.js";
import CharLinker from "./CharLinker.jsx";
import ImageUploadZone from "./ImageUploadZone.jsx";

export default function EventModal({ event, chars, onClose, onSave, currentTimelineDate }) {
  const [form, setForm] = useState({ ...defaultEvent, ...event });
  const set = (k, v) => setForm(f => ({...f, [k]:v}));
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.82)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#1a1228", border:"1px solid #7c5cbf", borderRadius:12, padding:28, width:500, maxHeight:"88vh", overflowY:"auto", boxShadow:"0 0 40px #7c5cbf44" }}>
        <h2 style={{ color:"#e8d5b7", margin:"0 0 20px", fontFamily:"Georgia,serif" }}>{form.id?"Edit":"New"} Event</h2>
        {currentTimelineDate && (
          <div style={{ marginBottom:14, padding:"7px 12px", background:"#0d0b14", border:"1px solid #2a1f3d", borderRadius:6, fontSize:12, color:"#7c5cbf", display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ opacity:.7 }}>📅 Current date:</span>
            <span style={{ color:"#c8a96e", fontWeight:600, flex:1 }}>{currentTimelineDate}</span>
            <button onClick={()=>{ const [y,m,d]=currentTimelineDate.split(" / "); set("year",y||""); set("month",m||""); set("day",d||""); }}
              style={{ background:"#2a1f3d", border:"1px solid #3a2a5a", borderRadius:4, color:"#c8a96e", cursor:"pointer", fontSize:11, padding:"3px 10px", fontWeight:600, whiteSpace:"nowrap" }}>
              Insert
            </button>
          </div>
        )}
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Date</label>
          <div style={{ display:"flex", gap:8 }}>
            <input placeholder="Year" value={form.year||""} onChange={e=>set("year",e.target.value)} style={{...inputStyle,flex:2}}/>
            <input placeholder="Month" value={form.month||""} onChange={e=>set("month",e.target.value)} style={{...inputStyle,flex:1}}/>
            <input placeholder="Day" value={form.day||""} onChange={e=>set("day",e.target.value)} style={{...inputStyle,flex:1}}/>
          </div>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Event Title</label>
          <input placeholder="Short name for this event" value={form.title} onChange={e=>set("title",e.target.value)} style={inputStyle}/>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Description</label>
          <textarea placeholder="What happened?" value={form.description} onChange={e=>set("description",e.target.value)} rows={4} style={{...inputStyle,resize:"vertical"}}/>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Image</label>
          <ImageUploadZone value={form.image} onChange={src=>set("image",src)}/>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:8, letterSpacing:1, textTransform:"uppercase" }}>Involved Characters</label>
          <CharLinker linkedIds={form.characterIds} chars={chars} onChange={v=>set("characterIds",v)}/>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:20 }}>
          <button onClick={()=>onSave(form)} disabled={!form.title.trim()&&!form.year&&!form.month&&!form.day} style={{...btnPrimary,flex:1}}>Save Event</button>
          <button onClick={onClose} style={{...btnSecondary,flex:1}}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
