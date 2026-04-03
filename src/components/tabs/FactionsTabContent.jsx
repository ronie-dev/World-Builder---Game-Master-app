import { memo } from "react";
import { ALIGNMENT_COLORS, FACTION_STATUS_COLORS, btnPrimary } from "../../constants.js";
import Badge from "../Badge.jsx";
import Avatar from "../Avatar.jsx";
import FactionDetailPanel from "../FactionDetailPanel.jsx";
import { EmptyState, CardRow, MiniChip } from "../ui.jsx";

function FactionCard({ faction, chars, locations, isSelected, onSelect }) {
  const members = chars.filter(c => (c.factions||[]).some(e => e.factionId===faction.id) && c.type !== "side");
  const locationObj = (locations||[]).find(l => l.id === faction.locationId);
  const locationName = locationObj ? (locationObj.region ? `${locationObj.name} (${locationObj.region})` : locationObj.name) : null;
  return (
    <CardRow isSelected={isSelected} onClick={()=>onSelect(faction)}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
        {faction.image && <img src={faction.image} alt="" style={{ width:48, height:48, borderRadius:8, objectFit:"cover", border:"1px solid #3a2a5a", flexShrink:0 }}/>}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
            <span style={{ color:"#e8d5b7", fontWeight:700, fontSize:15, fontFamily:"Georgia,serif" }}>⚑ {faction.name}</span>
            {faction.alignment&&<Badge label={faction.alignment} color={ALIGNMENT_COLORS[faction.alignment]}/>}
            {faction.status&&<Badge label={faction.status} color={FACTION_STATUS_COLORS[faction.status]||"#3a3a3a"}/>}
            {locationName&&<span style={{ fontSize:11, color:"#9a7fa0" }}>📍 {locationName}</span>}
          </div>
          {faction.description&&<p style={{ margin:"0 0 8px", fontSize:13, color:"#9a7fa0", lineHeight:1.5 }}>{faction.description.slice(0,120)}{faction.description.length>120?"…":""}</p>}
          {members.length>0&&(
            <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
              {members.map(c=>(
                <MiniChip key={c.id}>
                  <Avatar src={c.image} name={c.name} size={18}/><span style={{ fontSize:11, color:"#9a7fa0" }}>{c.name}</span>
                </MiniChip>
              ))}
            </div>
          )}
        </div>
      </div>
    </CardRow>
  );
}

function FactionsTabContent({
  factions, chars, locations,
  selectedFaction, selectedFactionId,
  updPg,
  onNewFaction, onCancelNew, onSaveFaction, onDeleteFaction, onOpenChar, onSaveChar,
}) {
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minHeight:0, padding:"28px 32px 0" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18, flexShrink:0 }}>
        <h1 style={{ fontFamily:"Georgia,serif", color:"#e8d5b7", margin:0, fontSize:26 }}>Factions</h1>
        <button onClick={onNewFaction} style={btnPrimary}>+ New Faction</button>
      </div>
      <div style={{ flex:1, display:"flex", gap:24, overflow:"hidden", minHeight:0, paddingBottom:28 }}>
        <div style={{ flex:1, minWidth:0, overflowY:"auto", paddingRight:12 }}>
          {factions.length===0
            ? <div style={{ textAlign:"center", padding:"40px 0", color:"#5a4a7a", border:"1px dashed #3a2a5a", borderRadius:12, fontSize:14 }}>No factions yet.<br/><span style={{ fontSize:13 }}>Factions are organizations, guilds, and powers in your world.</span></div>
            : <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {factions.map(f=>(
                  <FactionCard key={f.id} faction={f} chars={chars} locations={locations} isSelected={selectedFaction?.id===f.id}
                    onSelect={f=>updPg({ selectedFactionId: selectedFactionId===f.id?null:f.id, factionEditing: false })}/>

                ))}
              </div>}
        </div>
        <div style={{ flex:1, minWidth:0, overflowY:"auto" }}>
          {selectedFaction
            ? <FactionDetailPanel key={selectedFaction.id} faction={selectedFaction} factions={factions} chars={chars} locations={locations}
                onClose={()=>updPg({ selectedFactionId: null })} onSave={onSaveFaction}
                onDelete={onDeleteFaction} onOpenChar={onOpenChar} onSaveChar={onSaveChar}
                onCancelNew={onCancelNew}/>
            : <EmptyState icon="⚑" title="Select a faction to view details"/>
          }
        </div>
      </div>
    </div>
  );
}

export default memo(FactionsTabContent);
