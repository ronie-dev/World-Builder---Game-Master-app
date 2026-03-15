import { useState } from "react";
import { inputStyle, selStyle, btnPrimary, btnSecondary, CHAR_STATUSES, defaultChar } from "../constants.js";
import { uid } from "../utils.jsx";
import Avatar from "./Avatar.jsx";
import RelationshipLinker from "./RelationshipLinker.jsx";
import ImageUploadZone from "./ImageUploadZone.jsx";

export default function CharModal({ char, chars, races, factions, locations, charStatuses, onClose, onSave }) {
  const [form, setForm] = useState({ ...defaultChar, ...char });
  const set = (k, v) => setForm(f => ({...f, [k]:v}));
  const selectedRace = races.find(r=>r.id===form.raceId);
  const subraces = selectedRace?.subraces||[];

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#1a1228", border:"1px solid #7c5cbf", borderRadius:12, padding:28, width:480, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 0 40px #7c5cbf44" }}>
        <h2 style={{ color:"#e8d5b7", margin:"0 0 20px", fontFamily:"Georgia,serif" }}>{form.id?"Edit":"New"} Character</h2>
        <div style={{ display:"flex", gap:8, marginBottom:18 }}>
          {["player","main","side"].map(t=>(
            <button key={t} onClick={()=>set("type",t)} style={{ flex:1, padding:"8px 0", borderRadius:6, border:`1px solid ${form.type===t?"#7c5cbf":"#333"}`, background:form.type===t?"#7c5cbf33":"transparent", color:form.type===t?"#e8d5b7":"#888", cursor:"pointer", fontWeight:700 }}>
              {t==="player"?"🎲 Player":t==="main"?"⭐ Main":"👤 Side"}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:18 }}>
          <Avatar src={form.image} name={form.name} size={72}/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, color:"#9a7fa0", marginBottom:8 }}>Portrait</div>
            <ImageUploadZone value={form.image} onChange={src=>set("image",src)} size="full"/>
          </div>
        </div>
        {/* Name */}
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Name</label>
          <input value={form.name} onChange={e=>set("name",e.target.value)} style={inputStyle}/>
        </div>
        {form.type==="player"&&(
          <div style={{ display:"flex", gap:12, marginBottom:14 }}>
            <div style={{ flex:1 }}>
              <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Class</label>
              <input value={form.class||""} onChange={e=>set("class",e.target.value)} placeholder="e.g. Ranger…" style={inputStyle}/>
            </div>
            <div style={{ flex:"0 0 100px" }}>
              <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Level</label>
              <input value={form.level||""} onChange={e=>set("level",e.target.value)} placeholder="e.g. 5" style={inputStyle}/>
            </div>
          </div>
        )}
        {/* Short Description (main + side) */}
        {(form.type==="main"||form.type==="side")&&(
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Short Description</label>
            <input value={form.shortDescription||""} onChange={e=>set("shortDescription",e.target.value)} placeholder="One-line summary visible on the character card…" style={inputStyle}/>
          </div>
        )}
        {/* Race + Subrace */}
        <div style={{ display:"flex", gap:12, marginBottom:14 }}>
          <div style={{ flex:1 }}>
            <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Race</label>
            <select value={form.raceId} onChange={e=>{ set("raceId",e.target.value); set("subraceId",""); }} style={selStyle}>
              <option value="">— Select Race —</option>
              {races.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div style={{ flex:1 }}>
            <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Subrace</label>
            <select value={form.subraceId} onChange={e=>set("subraceId",e.target.value)} style={{...selStyle,opacity:subraces.length===0?0.4:1}} disabled={subraces.length===0}>
              <option value="">— None —</option>
              {subraces.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        {/* Origin (player only) / Location (main+side) */}
        {form.type==="player"&&(
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Origin</label>
            <input value={form.origin} onChange={e=>set("origin",e.target.value)} style={inputStyle}/>
          </div>
        )}
        {(form.type==="main"||form.type==="side")&&(
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Location</label>
            <select value={form.locationId||""} onChange={e=>set("locationId",e.target.value)} style={selStyle}>
              <option value="">— None —</option>
              {(locations||[]).map(l=><option key={l.id} value={l.id}>{l.name}{l.region?` (${l.region})`:""}</option>)}
            </select>
          </div>
        )}
        {/* Status */}
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Status</label>
          <select value={form.status||""} onChange={e=>set("status",e.target.value)} style={selStyle}>
            <option value="">— Select —</option>
            {(charStatuses||CHAR_STATUSES).map(s=><option key={s.name||s} value={s.name||s}>{s.name||s}</option>)}
          </select>
        </div>
        {/* Factions with roles */}
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:8, letterSpacing:1, textTransform:"uppercase" }}>Factions</label>
          {(form.factions||[]).map((entry,i)=>(
            <div key={entry.id} style={{ display:"flex", gap:8, marginBottom:8 }}>
              <select value={entry.factionId} onChange={e=>{ const f=[...(form.factions||[])]; f[i]={...f[i],factionId:e.target.value}; set("factions",f); }} style={{...selStyle,flex:1}}>
                <option value="">— Select Faction —</option>
                {factions.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              <input value={entry.role} onChange={e=>{ const f=[...(form.factions||[])]; f[i]={...f[i],role:e.target.value}; set("factions",f); }} placeholder="Role (e.g. Leader)" style={{...inputStyle,flex:"0 0 150px"}}/>
              <button onClick={()=>set("factions",(form.factions||[]).filter((_,j)=>j!==i))} style={{...btnSecondary,padding:"0 10px",color:"#c06060",flexShrink:0}}>✕</button>
            </div>
          ))}
          <button onClick={()=>set("factions",[...(form.factions||[]),{id:uid(),factionId:"",role:""}])} style={{...btnSecondary,fontSize:12,padding:"5px 14px"}}>+ Add Faction</button>
        </div>
        {/* Description / Biography */}
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>{form.type==="player"?"Biography":"Short Description"}</label>
          <textarea value={form.description} onChange={e=>set("description",e.target.value)} rows={3} style={{...inputStyle,resize:"vertical"}}/>
        </div>
        {/* Secret (main only) */}
        {form.type==="main"&&(
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>🔒 Secret</label>
            <textarea value={form.secret||""} onChange={e=>set("secret",e.target.value)} rows={3} placeholder="Hidden notes, secret agenda, true identity…" style={{...inputStyle,resize:"vertical",borderColor:"#4a2a5a"}}/>
          </div>
        )}
        {/* Relationships */}
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:8, letterSpacing:1, textTransform:"uppercase" }}>Relationships</label>
          <RelationshipLinker relationships={form.relationships||[]} chars={chars.filter(c=>c.id!==form.id)} onChange={v=>set("relationships",v)}/>
        </div>
        {/* External Links */}
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:8, letterSpacing:1, textTransform:"uppercase" }}>External Links</label>
          {(form.links||[]).map((lnk,i)=>(
            <div key={lnk.id} style={{ display:"flex", gap:8, marginBottom:8 }}>
              <input value={lnk.label} onChange={e=>{ const l=[...(form.links||[])]; l[i]={...l[i],label:e.target.value}; set("links",l); }} placeholder="Label (optional)" style={{...inputStyle,flex:"0 0 160px"}}/>
              <input value={lnk.url} onChange={e=>{ const l=[...(form.links||[])]; l[i]={...l[i],url:e.target.value}; set("links",l); }} placeholder="https://..." style={{...inputStyle,flex:1}}/>
              <button onClick={()=>set("links",(form.links||[]).filter((_,j)=>j!==i))} style={{...btnSecondary,padding:"0 10px",color:"#c06060",flexShrink:0}}>✕</button>
            </div>
          ))}
          <button onClick={()=>set("links",[...(form.links||[]),{id:uid(),label:"",url:""}])} style={{...btnSecondary,fontSize:12,padding:"5px 14px"}}>+ Add Link</button>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:20 }}>
          <button onClick={()=>onSave(form)} disabled={!form.name.trim()} style={{...btnPrimary,flex:1}}>Save Character</button>
          <button onClick={onClose} style={{...btnSecondary,flex:1}}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
