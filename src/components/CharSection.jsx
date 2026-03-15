import React from "react";
import { btnPrimary } from "../constants.js";
import CharCard from "./CharCard.jsx";
import PlayerCard from "./PlayerCard.jsx";

export default function CharSection({ title, chars, races, factions, locations, onAdd, query, selectedId, onSelect, horizontal=false, charStatuses }) {
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <h2 style={{ color:"#c8a96e", fontFamily:"Georgia,serif", margin:0, fontSize:17 }}>{title} <span style={{ fontSize:12, color:"#7c5cbf", fontFamily:"sans-serif" }}>({chars.length})</span></h2>
        <button onClick={onAdd} style={btnPrimary}>+ Add</button>
      </div>
      {chars.length===0
        ? <div style={{ textAlign:"center", padding:"24px 0", color:"#5a4a7a", border:"1px dashed #3a2a5a", borderRadius:8, fontSize:13 }}>
            {query ? "No characters match your search." : <>No characters yet.<br/><span style={{ fontSize:12 }}>Click "+ Add" to get started.</span></>}
          </div>
        : horizontal
          ? <div style={{ display:"flex", flexWrap:"wrap", gap:12 }}>{chars.map(c=><PlayerCard key={c.id} char={c} isSelected={selectedId===c.id} onSelect={onSelect}/>)}</div>
          : <div style={{ display:"flex", flexDirection:"column", gap:8 }}>{chars.map(c=><CharCard key={c.id} char={c} races={races} factions={factions} locations={locations} query={query} isSelected={selectedId===c.id} onSelect={onSelect} charStatuses={charStatuses}/>)}</div>
      }
    </div>
  );
}
