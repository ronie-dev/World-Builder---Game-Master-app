import { useState } from "react";
import { inputStyle, RELATIONSHIP_TYPES, RELATIONSHIP_COLORS } from "../constants.js";
import { uid } from "../utils.jsx";
import Avatar from "./Avatar.jsx";

export default function RelationshipLinker({ relationships, chars, relationshipTypes: relTypes, onChange, onOpenChar }) {
  const [dragId, setDragId] = useState(null);
  const [dragOverType, setDragOverType] = useState(null);
  const [addingToType, setAddingToType] = useState(null);
  const [addSearch, setAddSearch] = useState("");

  const types = relTypes || RELATIONSHIP_TYPES;
  const linkedCharIds = (relationships||[]).map(r => r.charId);

  const add = (c, typeName) => {
    if (linkedCharIds.includes(c.id)) return;
    onChange([...(relationships||[]), { id: uid(), charId: c.id, type: typeName }]);
    setAddingToType(null); setAddSearch("");
  };

  const remove = charId => onChange((relationships||[]).filter(r => r.charId !== charId));

  const setType = (charId, type) =>
    onChange((relationships||[]).map(r => r.charId === charId ? { ...r, type } : r));

  const byType = {};
  types.forEach(t => { byType[t.name||t] = []; });
  (relationships||[]).forEach(rel => {
    const c = chars.find(x => x.id === rel.charId);
    if (!c) return;
    const key = rel.type;
    if (!byType[key]) byType[key] = [];
    byType[key].push({ rel, c });
  });

  return (
    <div style={{ display:"flex", gap:8, flexWrap:"wrap", paddingBottom:6 }}>
      {types.map(t => {
        const tn = t.name||t;
        const color = t.color||RELATIONSHIP_COLORS[tn]||"#3a4a6a";
        const items = byType[tn]||[];
        const isOver = dragOverType === tn;
        const isAdding = addingToType === tn;
        const q = addSearch.toLowerCase();
        const suggestions = isAdding
          ? chars.filter(c => !linkedCharIds.includes(c.id) && (!q || c.name.toLowerCase().includes(q)))
          : [];

        return (
          <div key={tn}
            onDragOver={e=>{ e.preventDefault(); setDragOverType(tn); }}
            onDragLeave={e=>{ if(!e.currentTarget.contains(e.relatedTarget)) setDragOverType(null); }}
            onDrop={()=>{ if(dragId){ setType(dragId, tn); setDragId(null); setDragOverType(null); } }}
            style={{ flex:"1 1 120px", minWidth:100, background:isOver?`${color}14`:"#0d0b14", border:`1px solid ${isOver?color:"#1e1630"}`, borderRadius:8, padding:"8px 6px", transition:"border-color .15s, background .15s" }}>

            {/* Column header */}
            <div style={{ fontSize:11, color, fontWeight:700, letterSpacing:.5, textTransform:"uppercase", marginBottom:8, paddingBottom:6, borderBottom:`1px solid ${color}33`, display:"flex", alignItems:"center", gap:4 }}>
              <span style={{ flex:1 }}>{tn}</span>
              {items.length > 0 && (
                <span style={{ background:`${color}33`, borderRadius:8, padding:"0 5px", fontSize:10, fontWeight:400 }}>{items.length}</span>
              )}
            </div>

            {/* Character chips */}
            <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
              {items.map(({ rel, c }) => (
                <div key={rel.id}
                  draggable
                  onDragStart={e=>{ e.dataTransfer.effectAllowed="move"; setDragId(c.id); }}
                  onDragEnd={()=>{ setDragId(null); setDragOverType(null); }}
                  style={{ display:"flex", alignItems:"center", gap:6, background:"#13101f", border:"1px solid #2a1f3d", borderRadius:6, padding:"6px 8px", cursor:"grab", opacity: dragId === c.id ? 0.4 : 1, transition:"opacity .1s" }}>
                  <Avatar src={c.image} name={c.name} size={26}/>
                  <span
                    onClick={e=>{ e.stopPropagation(); if(!onOpenChar) return; if(e.ctrlKey||e.metaKey){e.preventDefault();onOpenChar(c,{newTab:true});}else{onOpenChar(c);} }}
                    onAuxClick={e=>{ if(e.button===1&&onOpenChar){e.preventDefault();e.stopPropagation();onOpenChar(c,{newTab:true});} }}
                    style={{ fontSize:12, color:onOpenChar?"#c8a96e":"#e8d5b7", flex:1, minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", cursor:onOpenChar?"pointer":"default" }}
                    onMouseEnter={e=>{ if(onOpenChar) e.currentTarget.style.textDecoration="underline"; }}
                    onMouseLeave={e=>{ e.currentTarget.style.textDecoration="none"; }}>
                    {c.name}
                  </span>
                  <button onClick={()=>remove(c.id)}
                    style={{ background:"none", border:"none", color:"#5a4a7a", cursor:"pointer", fontSize:14, padding:0, lineHeight:1, flexShrink:0 }}
                    onMouseEnter={e=>e.currentTarget.style.color="#c06060"}
                    onMouseLeave={e=>e.currentTarget.style.color="#5a4a7a"}>×</button>
                </div>
              ))}

              {/* + Add box */}
              {isAdding ? (
                <div style={{ position:"relative" }}>
                  <input autoFocus value={addSearch} onChange={e=>setAddSearch(e.target.value)}
                    onKeyDown={e=>{ if(e.key==="Escape"){ setAddingToType(null); setAddSearch(""); } }}
                    placeholder="Search…"
                    style={{...inputStyle, fontSize:12, padding:"5px 8px", width:"100%", boxSizing:"border-box"}}/>
                  {suggestions.length > 0 && (
                    <div style={{ position:"absolute", top:"100%", left:0, right:0, zIndex:20, background:"#1a1228", border:"1px solid #3a2a5a", borderRadius:8, maxHeight:160, overflowY:"auto", marginTop:4, boxShadow:"0 4px 16px #00000066" }}>
                      {suggestions.map(c => (
                        <div key={c.id} onMouseDown={e=>{ e.preventDefault(); add(c, tn); }}
                          style={{ display:"flex", alignItems:"center", gap:7, padding:"7px 8px", cursor:"pointer", borderBottom:"1px solid #1e1630" }}
                          onMouseEnter={e=>e.currentTarget.style.background="#1e1630"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          <Avatar src={c.image} name={c.name} size={22}/>
                          <span style={{ fontSize:12, color:"#e8d5b7", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div onClick={()=>{ setAddingToType(tn); setAddSearch(""); }}
                  style={{ display:"flex", alignItems:"center", justifyContent:"center", height:32, border:`2px dashed ${color}44`, borderRadius:6, cursor:"pointer", color:`${color}66`, fontSize:18, transition:"border-color .15s, color .15s", marginTop: items.length > 0 ? 2 : 0 }}
                  onMouseEnter={e=>{ e.currentTarget.style.borderColor=color; e.currentTarget.style.color=color; }}
                  onMouseLeave={e=>{ e.currentTarget.style.borderColor=`${color}44`; e.currentTarget.style.color=`${color}66`; }}>
                  +
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
