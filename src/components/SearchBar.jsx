import React from "react";
import { inputStyle, selStyle, btnSecondary, CHAR_STATUSES, defaultFilters } from "../constants.js";

export default function SearchBar({ query, setQuery, filters, setFilters, chars, races, factions, locations }) {
  const activeCount = Object.values(filters).filter(Boolean).length;
  const sel = (label, key, opts) => (
    <div style={{ flex:"1 1 calc(50% - 6px)", minWidth:120 }}>
      <label style={{ display:"block", fontSize:11, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>{label}</label>
      <select value={filters[key]} onChange={e=>setFilters(f=>({...f,[key]:e.target.value}))} style={{...selStyle,fontSize:13}}>
        <option value="">All</option>
        {opts.map(o=><option key={o.value??o} value={o.value??o}>{typeof o==="object"?o.label:o}</option>)}
      </select>
    </div>
  );
  return (
    <div style={{ marginBottom:20, background:"#110e1c", border:"1px solid #2a1f3d", borderRadius:10, padding:14 }}>
      <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:12 }}>
        <div style={{ flex:1, position:"relative" }}>
          <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#5a4a7a", fontSize:14 }}>🔍</span>
          <input placeholder="Search name, race, location, faction, description..." value={query} onChange={e=>setQuery(e.target.value)} style={{...inputStyle,paddingLeft:32,fontSize:13}}/>
        </div>
        {(query||activeCount>0)&&<button onClick={()=>{setQuery("");setFilters(defaultFilters);}} style={{...btnSecondary,color:"#c06060",borderColor:"#6b1a1a"}}>✕ Clear</button>}
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:12, paddingTop:12, borderTop:"1px solid #2a1f3d" }}>
        {sel("Race","raceId",races.map(r=>({value:r.id,label:r.name})))}
        {sel("Location","locationId",(locations||[]).map(l=>({value:l.id,label:l.region?`${l.name} (${l.region})`:l.name})))}
        {sel("Status","status",CHAR_STATUSES.map(s=>({value:s,label:s})))}
        {sel("Faction","factionId",factions.map(f=>({value:f.id,label:f.name})))}
      </div>
    </div>
  );
}
