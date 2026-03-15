import { useState, useRef } from "react";
import { inputStyle, selStyle, btnPrimary, btnSecondary, ALIGNMENTS, FACTION_STATUSES, FACTION_COLORS, defaultFaction } from "../constants.js";

export default function FactionModal({ faction, onClose, onSave }) {
  const [form, setForm] = useState({ ...defaultFaction, ...faction });
  const set = (k, v) => setForm(f => ({...f, [k]:v}));
  const colorRef = useRef();
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#1a1228", border:"1px solid #7c5cbf", borderRadius:12, padding:28, width:520, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 0 40px #7c5cbf44" }}>
        <h2 style={{ color:"#e8d5b7", margin:"0 0 20px", fontFamily:"Georgia,serif" }}>{form.id?"Edit":"New"} Faction</h2>
        {[["Name","name"],["Location","location"]].map(([label,key])=>(
          <div key={key} style={{ marginBottom:14 }}>
            <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>{label}</label>
            <input value={form[key]} onChange={e=>set(key,e.target.value)} style={inputStyle}/>
          </div>
        ))}
        <div style={{ display:"flex", gap:12, marginBottom:14 }}>
          <div style={{ flex:1 }}>
            <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Alignment</label>
            <select value={form.alignment} onChange={e=>set("alignment",e.target.value)} style={selStyle}>
              <option value="">— Select —</option>
              {ALIGNMENTS.map(a=><option key={a}>{a}</option>)}
            </select>
          </div>
          <div style={{ flex:1 }}>
            <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Status</label>
            <select value={form.status||""} onChange={e=>set("status",e.target.value)} style={selStyle}>
              <option value="">— Select —</option>
              {FACTION_STATUSES.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Faction Color</label>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div onClick={() => colorRef.current.click()} style={{ width:32, height:32, borderRadius:6, background:form.color||"#3a2a5a", border:"2px solid #3a2a5a", cursor:"pointer", flexShrink:0 }}/>
            <input ref={colorRef} type="color" value={form.color||FACTION_COLORS[0]} onChange={e=>set("color",e.target.value)} style={{ position:"absolute", opacity:0, pointerEvents:"none", width:0, height:0 }}/>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {FACTION_COLORS.map(c=>(
                <div key={c} onClick={()=>set("color",c)} style={{ width:22, height:22, borderRadius:4, background:c, cursor:"pointer", border: form.color===c?"2px solid #e8d5b7":"2px solid transparent", transition:"border .1s" }}/>
              ))}
              <div onClick={()=>set("color","")} style={{ width:22, height:22, borderRadius:4, background:"#1a1228", cursor:"pointer", border: !form.color?"2px solid #7c5cbf":"2px solid #3a2a5a", fontSize:10, color:"#5a4a7a", display:"flex", alignItems:"center", justifyContent:"center", transition:"border .1s" }} title="Auto (use default)">↺</div>
            </div>
          </div>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Description</label>
          <textarea value={form.description} onChange={e=>set("description",e.target.value)} rows={3} style={{...inputStyle,resize:"vertical"}}/>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:20 }}>
          <button onClick={()=>onSave(form)} disabled={!form.name.trim()} style={{...btnPrimary,flex:1}}>Save Faction</button>
          <button onClick={onClose} style={{...btnSecondary,flex:1}}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
