import { useState, memo } from "react";
import { inputStyle, btnPrimary, btnSecondary, defaultEvent } from "../constants.js";
import { uid } from "../utils.jsx";
import Timeline from "./Timeline.jsx";
import CharLinker from "./CharLinker.jsx";
import ImageUploadZone from "./ImageUploadZone.jsx";

function EventModal({ event, chars, onClose, onSave }) {
  const [form, setForm] = useState({ ...defaultEvent, ...event });
  const set = (k, v) => setForm(f => ({...f, [k]:v}));
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.82)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#1a1228", border:"1px solid #7c5cbf", borderRadius:12, padding:28, width:500, maxHeight:"88vh", overflowY:"auto", boxShadow:"0 0 40px #7c5cbf44" }}>
        <h2 style={{ color:"#e8d5b7", margin:"0 0 20px", fontFamily:"Georgia,serif" }}>{form.id?"Edit":"New"} Lore Event</h2>
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

function LoreTab({ events, chars, onUpdateEvents, onOpenChar, onAskConfirm, onCloseConfirm }) {
  const [eventModal, setEventModal] = useState(null);

  const saveEvent = form => {
    const updated = form.id ? events.map(e=>e.id===form.id?form:e) : [{...form, id:uid()}, ...events];
    onUpdateEvents(updated);
    setEventModal(null);
  };

  const deleteEvent = id => {
    const ev = events.find(e=>e.id===id);
    onAskConfirm(`Delete lore event "${ev?.title||"this event"}"?`, () => {
      onUpdateEvents(events.filter(e=>e.id!==id));
      onCloseConfirm();
    });
  };

  const moveEvent = (id, dir) => {
    const ev = events.find(e => e.id === id);
    if (!ev) return;
    const key = `${ev.year||""}|${ev.month||""}|${ev.day||""}`;
    const groupIndices = events.map((e,i)=>({e,i})).filter(({e})=>`${e.year||""}|${e.month||""}|${e.day||""}`===key).map(({i})=>i);
    const pos = groupIndices.findIndex(i => events[i].id === id);
    const targetPos = dir==="up" ? pos-1 : pos+1;
    if (targetPos < 0 || targetPos >= groupIndices.length) return;
    const newEvents = [...events];
    [newEvents[groupIndices[pos]], newEvents[groupIndices[targetPos]]] = [newEvents[groupIndices[targetPos]], newEvents[groupIndices[pos]]];
    onUpdateEvents(newEvents);
  };

  return (
    <div>
      <h1 style={{ fontFamily:"Georgia,serif", color:"#e8d5b7", margin:"0 0 6px", fontSize:26 }}>Lore</h1>
      <p style={{ color:"#5a4a7a", fontSize:13, margin:"0 0 24px" }}>World events not tied to any story — shown on the Global Timeline.</p>
      <Timeline
        events={events}
        chars={chars}
        onAdd={prefill => setEventModal({...defaultEvent, ...(prefill||{})})}
        onEdit={ev => setEventModal({...ev})}
        onDelete={deleteEvent}
        onOpenChar={onOpenChar}
        onMove={moveEvent}
      />
      {eventModal && <EventModal event={eventModal} chars={chars} onClose={() => setEventModal(null)} onSave={saveEvent}/>}
    </div>
  );
}

export default memo(LoreTab);
