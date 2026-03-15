import { useState } from "react";
import { inputStyle, selStyle, btnPrimary, btnSecondary, LOCATION_TYPES, defaultLocation } from "../constants.js";

export default function LocationModal({ location, onClose, onSave }) {
  const [form, setForm] = useState({ ...defaultLocation, ...location });
  const set = (k, v) => setForm(f => ({...f, [k]:v}));
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#1a1228", border:"1px solid #7c5cbf", borderRadius:12, padding:28, width:520, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 0 40px #7c5cbf44" }}>
        <h2 style={{ color:"#e8d5b7", margin:"0 0 20px", fontFamily:"Georgia,serif" }}>{form.id?"Edit":"New"} Location</h2>
        {[["Name","name"],["Region","region"]].map(([label,key])=>(
          <div key={key} style={{ marginBottom:14 }}>
            <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>{label}</label>
            <input value={form[key]} onChange={e=>set(key,e.target.value)} style={inputStyle}/>
          </div>
        ))}
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Type</label>
          <select value={form.type} onChange={e=>set("type",e.target.value)} style={selStyle}>
            <option value="">— Select —</option>
            {LOCATION_TYPES.map(t=><option key={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Description</label>
          <textarea value={form.description} onChange={e=>set("description",e.target.value)} rows={3} style={{...inputStyle,resize:"vertical"}}/>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:20 }}>
          <button onClick={()=>onSave(form)} disabled={!form.name.trim()} style={{...btnPrimary,flex:1}}>Save Location</button>
          <button onClick={onClose} style={{...btnSecondary,flex:1}}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
