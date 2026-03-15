import { useState } from "react";
import { inputStyle, selStyle, btnPrimary, btnSecondary, STORY_STATUSES, defaultStory } from "../constants.js";
import CharLinker from "./CharLinker.jsx";
import FactionDropdown from "./FactionDropdown.jsx";
import LocationDropdown from "./LocationDropdown.jsx";
import ImageUploadZone from "./ImageUploadZone.jsx";

export default function StoryModal({ story, chars, factions, locations, onClose, onSave }) {
  const [form, setForm] = useState({ ...defaultStory, ...story });
  const set = (k, v) => setForm(f => ({...f, [k]:v}));
  const inp = (label, key, opts, textarea=false) => (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>{label}</label>
      {opts
        ? <select value={form[key]} onChange={e=>set(key,e.target.value)} style={selStyle}><option value="">— Select —</option>{opts.map(o=><option key={o}>{o}</option>)}</select>
        : textarea
          ? <textarea value={form[key]} onChange={e=>set(key,e.target.value)} rows={4} style={{...inputStyle,resize:"vertical"}}/>
          : <input value={form[key]} onChange={e=>set(key,e.target.value)} style={inputStyle}/>}
    </div>
  );
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#1a1228", border:"1px solid #7c5cbf", borderRadius:12, padding:28, width:560, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 0 40px #7c5cbf44" }}>
        <h2 style={{ color:"#e8d5b7", margin:"0 0 20px", fontFamily:"Georgia,serif" }}>{form.id?"Edit":"New"} Story</h2>
        <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:18 }}>
          <div style={{ width:80, height:80, borderRadius:8, border:"1px solid #3a2a5a", overflow:"hidden", flexShrink:0, background:"#0d0b14", display:"flex", alignItems:"center", justifyContent:"center" }}>
            {form.image?<img src={form.image} alt="story" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>:<span style={{ fontSize:28, opacity:.3 }}>🖼️</span>}
          </div>
          <div style={{ flex:1 }}>
            <ImageUploadZone value={form.image} onChange={src=>set("image",src)} size="full"/>
          </div>
        </div>
        {inp("Story Name","name")}
        <div style={{ display:"flex", gap:12 }}>
          <div style={{ flex:1 }}>{inp("Status","status",STORY_STATUSES)}</div>
        </div>
        {inp("Summary","summary")}
        {inp("Full Description / Notes","description",null,true)}
        {inp("Rewards / Stakes","rewards",null,true)}
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:8, letterSpacing:1, textTransform:"uppercase" }}>Linked Characters</label>
          <CharLinker linkedIds={form.characterIds} chars={chars} onChange={v=>set("characterIds",v)}/>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:8, letterSpacing:1, textTransform:"uppercase" }}>Factions Involved</label>
          <FactionDropdown factions={factions||[]} selectedIds={form.factionIds||[]} onChange={v=>set("factionIds",v)}/>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:8, letterSpacing:1, textTransform:"uppercase" }}>Locations</label>
          <LocationDropdown locations={locations||[]} selectedIds={form.locationIds||[]} onChange={v=>set("locationIds",v)}/>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:20 }}>
          <button onClick={()=>onSave(form)} disabled={!form.name.trim()} style={{...btnPrimary,flex:1}}>Save Story</button>
          <button onClick={onClose} style={{...btnSecondary,flex:1}}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
