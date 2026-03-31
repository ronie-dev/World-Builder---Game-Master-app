import { useState, useRef, useEffect } from "react";
import { inputStyle, btnSecondary, CHAR_STATUSES, defaultFilters } from "../constants.js";

function ComboFilter({ label, value, onChange, opts }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const filtered = opts.filter(o => !search || o.label.toLowerCase().includes(search.toLowerCase()));
  const selected = opts.find(o => o.value === value);
  const displayLabel = value ? (selected?.label || value) : "All";
  const isActive = !!value;

  const pick = val => { onChange(val); setOpen(false); setSearch(""); };

  return (
    <div ref={ref} style={{ flex:"1 1 calc(50% - 6px)", minWidth:120, position:"relative" }}>
      <label style={{ display:"block", fontSize:11, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>{label}</label>
      <div onClick={() => setOpen(o => !o)}
        style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"#0d0b14", border:`1px solid ${isActive?"#7c5cbf":"#3a2a5a"}`, borderRadius:6, padding:"7px 10px", cursor:"pointer", fontSize:13, color: isActive?"#e8d5b7":"#9a7fa0", userSelect:"none" }}>
        <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{displayLabel}</span>
        <span style={{ fontSize:10, color:"#5a4a7a", marginLeft:6, flexShrink:0 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{ position:"absolute", top:"100%", left:0, right:0, zIndex:50, marginTop:3, background:"#1a1228", border:"1px solid #3a2a5a", borderRadius:8, boxShadow:"0 6px 24px #00000088", overflow:"hidden" }}>
          <div style={{ padding:"6px 8px", borderBottom:"1px solid #2a1f3d" }}>
            <input autoFocus placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === "Escape") { setOpen(false); setSearch(""); } }}
              style={{ ...inputStyle, fontSize:12, padding:"4px 8px", width:"100%", boxSizing:"border-box" }}/>
          </div>
          <div style={{ maxHeight:180, overflowY:"auto" }}>
            <div onMouseDown={() => pick("")}
              style={{ padding:"7px 12px", fontSize:13, color: !value?"#c8a96e":"#9a7fa0", cursor:"pointer", background: !value?"#1e1630":"transparent" }}
              onMouseEnter={e => e.currentTarget.style.background="#1e1630"} onMouseLeave={e => e.currentTarget.style.background=!value?"#1e1630":"transparent"}>
              All
            </div>
            {filtered.map(o => (
              <div key={o.value} onMouseDown={() => pick(o.value)}
                style={{ padding:"7px 12px", fontSize:13, color: value===o.value?"#c8a96e":"#9a7fa0", cursor:"pointer", background: value===o.value?"#1e1630":"transparent", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}
                onMouseEnter={e => e.currentTarget.style.background="#1e1630"} onMouseLeave={e => e.currentTarget.style.background=value===o.value?"#1e1630":"transparent"}>
                {o.label}
              </div>
            ))}
            {filtered.length === 0 && <div style={{ padding:"10px 12px", fontSize:12, color:"#4a3a6a", fontStyle:"italic" }}>No matches</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchBar({ query, setQuery, filters, setFilters, chars, races, factions, locations }) {
  const activeCount = Object.values(filters).filter(Boolean).length;
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
        <ComboFilter label="Race" value={filters.raceId} onChange={v=>setFilters({...filters,raceId:v})} opts={races.map(r=>({value:r.id,label:r.name}))}/>
        <ComboFilter label="Location" value={filters.locationId} onChange={v=>setFilters({...filters,locationId:v})} opts={(locations||[]).map(l=>({value:l.id,label:l.region?`${l.name} (${l.region})`:l.name}))}/>
        <ComboFilter label="Status" value={filters.status} onChange={v=>setFilters({...filters,status:v})} opts={CHAR_STATUSES.map(s=>({value:s,label:s}))}/>
        <ComboFilter label="Faction" value={filters.factionId} onChange={v=>setFilters({...filters,factionId:v})} opts={factions.map(f=>({value:f.id,label:f.name}))}/>
      </div>
    </div>
  );
}
