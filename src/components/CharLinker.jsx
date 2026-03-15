import { useState } from "react";
import { inputStyle } from "../constants.js";
import Avatar from "./Avatar.jsx";

export default function CharLinker({ linkedIds, chars, onChange }) {
  const [search, setSearch] = useState("");
  const toggle = id => onChange(linkedIds.includes(id) ? linkedIds.filter(x=>x!==id) : [...linkedIds, id]);
  const filtered = chars.filter(c => { const q=search.toLowerCase(); return !q||c.name.toLowerCase().includes(q)||c.race?.toLowerCase().includes(q)||c.shortDescription?.toLowerCase().includes(q); });
  return (
    <div>
      {linkedIds.length>0&&(
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:10 }}>
          {linkedIds.map(id=>{ const c=chars.find(x=>x.id===id); if(!c) return null;
            return <div key={id} style={{ display:"flex", alignItems:"center", gap:6, background:"#2a1f3d", border:"1px solid #7c5cbf", borderRadius:20, padding:"4px 10px 4px 6px" }}>
              <Avatar src={c.image} name={c.name} size={22}/><span style={{ fontSize:13, color:"#e8d5b7" }}>{c.name}</span>
              <button onClick={()=>toggle(id)} style={{ background:"none", border:"none", color:"#c06060", cursor:"pointer", fontSize:14, padding:0 }}>×</button>
            </div>;
          })}
        </div>
      )}
      <div style={{ position:"relative", marginBottom:8 }}>
        <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#5a4a7a", fontSize:13 }}>🔍</span>
        <input placeholder="Search characters…" value={search} onChange={e=>setSearch(e.target.value)} style={{...inputStyle,paddingLeft:30,fontSize:13}}/>
      </div>
      <div style={{ maxHeight:150, overflowY:"auto", border:"1px solid #2a1f3d", borderRadius:8 }}>
        {filtered.length===0
          ? <div style={{ padding:"12px 16px", color:"#5a4a7a", fontSize:13 }}>No characters found.</div>
          : filtered.map(c=>{ const linked=linkedIds.includes(c.id);
              return <div key={c.id} onClick={()=>toggle(c.id)} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", cursor:"pointer", background:linked?"#2a1f3d":"transparent", borderBottom:"1px solid #1e1630" }}
                onMouseEnter={e=>{ if(!linked) e.currentTarget.style.background="#1e1630"; }}
                onMouseLeave={e=>{ if(!linked) e.currentTarget.style.background="transparent"; }}>
                <Avatar src={c.image} name={c.name} size={28}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, color:"#e8d5b7" }}>{c.name}</div>
                  <div style={{ fontSize:11, color:"#9a7fa0" }}>{c.type==="player"?"🎲":c.type==="main"?"⭐":"👤"} {c.type}</div>
                  {c.shortDescription && c.type!=="player" && <div style={{ fontSize:11, color:"#6a5a7a", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.shortDescription}</div>}
                </div>
                <div style={{ fontSize:15, color:linked?"#7c5cbf":"#3a2a5a" }}>{linked?"✓":"+"}</div>
              </div>;
            })}
      </div>
    </div>
  );
}
