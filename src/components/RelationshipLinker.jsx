import { useState } from "react";
import { inputStyle, selStyle, btnSecondary, RELATIONSHIP_TYPES, RELATIONSHIP_COLORS } from "../constants.js";
import { uid } from "../utils.jsx";
import Avatar from "./Avatar.jsx";

export default function RelationshipLinker({ relationships, chars, relationshipTypes: relTypes, onChange }) {
  const [search, setSearch] = useState("");

  const linkedCharIds = (relationships||[]).map(r => r.charId);
  const filtered = chars.filter(c => {
    if (linkedCharIds.includes(c.id)) return false;
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q);
  });

  const add = c => {
    onChange([...(relationships||[]), { id: uid(), charId: c.id, type: "Neutral" }]);
    setSearch("");
  };

  const remove = id => onChange((relationships||[]).filter(r => r.charId !== id));

  const setType = (charId, type) =>
    onChange((relationships||[]).map(r => r.charId === charId ? { ...r, type } : r));

  return (
    <div>
      {/* Selected characters with type picker */}
      {(relationships||[]).filter(r => r.charId).length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:10 }}>
          {(relationships||[]).filter(r => r.charId).map(rel => {
            const c = chars.find(x => x.id === rel.charId);
            if (!c) return null;
            const color = (relTypes||[]).find(t=>t.name===rel.type)?.color||RELATIONSHIP_COLORS[rel.type]||"#3a4a6a";
            return (
              <div key={rel.id} style={{ display:"flex", alignItems:"center", gap:8, background:"#0f0c1a", border:`1px solid ${color}55`, borderRadius:8, padding:"6px 8px 6px 6px" }}>
                <Avatar src={c.image} name={c.name} size={28}/>
                <div style={{ flex:1, fontSize:13, color:"#e8d5b7", fontWeight:600 }}>{c.name}</div>
                <select value={rel.type} onChange={e => setType(rel.charId, e.target.value)}
                  style={{ ...selStyle, width:110, fontSize:12, padding:"4px 8px", color, borderColor:`${color}88` }}>
                  {(relTypes||RELATIONSHIP_TYPES).map(t=><option key={t.name||t} value={t.name||t}>{t.name||t}</option>)}
                </select>
                <button onClick={() => remove(rel.charId)} style={{ background:"none", border:"none", color:"#c06060", cursor:"pointer", fontSize:15, padding:"0 2px", flexShrink:0 }}>×</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Search + list */}
      <div style={{ position:"relative", marginBottom:8 }}>
        <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#5a4a7a", fontSize:13 }}>🔍</span>
        <input placeholder="Search characters to add…" value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, paddingLeft:30, fontSize:13 }}/>
      </div>
      {(search || filtered.length < chars.length) && (
        <div style={{ maxHeight:150, overflowY:"auto", border:"1px solid #2a1f3d", borderRadius:8 }}>
          {filtered.length === 0
            ? <div style={{ padding:"12px 16px", color:"#5a4a7a", fontSize:13 }}>No characters found.</div>
            : filtered.map(c => (
                <div key={c.id} onClick={() => add(c)} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", cursor:"pointer", borderBottom:"1px solid #1e1630", transition:"background .12s" }}
                  onMouseEnter={e => e.currentTarget.style.background="#1e1630"}
                  onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                  <Avatar src={c.image} name={c.name} size={26}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, color:"#e8d5b7" }}>{c.name}</div>
                    <div style={{ fontSize:11, color:"#9a7fa0" }}>{c.type==="player"?"🎲":c.type==="main"?"⭐":"👤"} {c.type}</div>
                  </div>
                  <span style={{ fontSize:13, color:"#7c5cbf" }}>+ Add</span>
                </div>
              ))
          }
        </div>
      )}
    </div>
  );
}
