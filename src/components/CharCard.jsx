import React from "react";
import { CHAR_STATUS_COLORS } from "../constants.js";
import { getRaceLabel, getFactionColor, highlight } from "../utils.jsx";
import Avatar from "./Avatar.jsx";
import Badge from "./Badge.jsx";

const MAIN_ACCENT = "#c8a96e";
const SIDE_ACCENT = "#5a3da0";

const CharCard = React.memo(function CharCard({ char, races, factions, locations, query, isSelected, onSelect, charStatuses }) {
  const isMain = char.type === "main";
  const accent = isMain ? MAIN_ACCENT : SIDE_ACCENT;
  const raceLabel = getRaceLabel(races, char.raceId, char.subraceId);
  const raceIcon = (races||[]).find(r=>r.id===char.raceId)?.icon||null;
  const linkedFactions = factions.filter(f => (char.factions||[]).some(e=>e.factionId===f.id));
  const locationObj = (locations||[]).find(l=>l.id===char.locationId);
  const locationName = locationObj ? (locationObj.region ? `${locationObj.name} (${locationObj.region})` : locationObj.name) : "";
  const activeHooks = (char.hooks||[]).filter(h=>h.status==="Active");

  return (
    <div onClick={()=>onSelect(char)}
      style={{ background:isSelected?"#1e1535":"#1a1228", border:`1px solid ${isSelected?"#7c5cbf":"#2a1f3d"}`, borderLeft:`3px solid ${accent}`, borderRadius:10, padding:12, display:"flex", gap:12, cursor:"pointer", transition:"border-color .15s, background .15s", userSelect:"none" }}
      onMouseEnter={e=>{ if(!isSelected){ e.currentTarget.style.borderColor="#5a3da0"; e.currentTarget.style.borderLeftColor=accent; }}}
      onMouseLeave={e=>{ if(!isSelected){ e.currentTarget.style.borderColor="#2a1f3d"; e.currentTarget.style.borderLeftColor=accent; }}}>
      <Avatar src={char.image} name={char.name} size={46}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:3 }}>
          <span style={{ color:"#e8d5b7", fontWeight:700, fontSize:14, fontFamily:"Georgia,serif" }}>{highlight(char.name, query)}</span>
          <span style={{ fontSize:10, color:accent, opacity:.8 }}>{isMain ? "⭐" : "👤"}</span>
          {char.status && <Badge label={char.status} color={(charStatuses||[]).find(s=>s.name===char.status)?.color||CHAR_STATUS_COLORS[char.status]||"#333"}/>}
          {linkedFactions.map(f=><Badge key={f.id} label={f.name} color={getFactionColor(factions,f.id)}/>)}
          {activeHooks.length > 0 && (
            <span title={`${activeHooks.length} active hook${activeHooks.length!==1?"s":""}`}
              style={{ display:"inline-flex", alignItems:"center", gap:3, fontSize:10, color:"#c8a96e", background:"#c8a96e18", borderRadius:8, padding:"1px 6px", border:"1px solid #c8a96e44" }}>
              🔮 {activeHooks.length}
            </span>
          )}
        </div>
        <div style={{ display:"flex", gap:10, fontSize:11, color:"#9a7fa0" }}>
          {raceLabel && <span style={{ display:"flex", alignItems:"center", gap:3 }}>{raceIcon ? <img src={raceIcon} alt="" style={{ width:12, height:12, objectFit:"cover", borderRadius:2 }}/> : "🧬"} {raceLabel}</span>}
          {locationName && <span>📍 {locationName}</span>}
        </div>
        {char.shortDescription && (
          <div style={{ fontSize:12, color:"#8a7090", marginTop:4, fontStyle:"italic", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{char.shortDescription}</div>
        )}
      </div>
    </div>
  );
});

export default CharCard;
