import { memo } from "react";
import { ALIGNMENT_COLORS, FACTION_STATUS_COLORS, btnPrimary } from "../../constants.js";
import Badge from "../Badge.jsx";
import Avatar from "../Avatar.jsx";
import FactionDetailPanel from "../FactionDetailPanel.jsx";

function FactionCard({ faction, chars, isSelected, onSelect }) {
  const members = chars.filter(c => (c.factions||[]).some(e => e.factionId===faction.id) && c.type !== "side");
  return (
    <div onClick={()=>onSelect(faction)} style={{ background:isSelected?"#1e1535":"#1a1228", border:`1px solid ${isSelected?"#7c5cbf":"#3a2a5a"}`, borderRadius:10, padding:16, cursor:"pointer", transition:"border-color .15s, background .15s", userSelect:"none" }}
      onMouseEnter={e=>{ if(!isSelected) e.currentTarget.style.borderColor="#5a3da0"; }}
      onMouseLeave={e=>{ if(!isSelected) e.currentTarget.style.borderColor="#3a2a5a"; }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
            <span style={{ color:"#e8d5b7", fontWeight:700, fontSize:15, fontFamily:"Georgia,serif" }}>⚑ {faction.name}</span>
            {faction.alignment&&<Badge label={faction.alignment} color={ALIGNMENT_COLORS[faction.alignment]}/>}
            {faction.status&&<Badge label={faction.status} color={FACTION_STATUS_COLORS[faction.status]||"#3a3a3a"}/>}
            {faction.location&&<span style={{ fontSize:11, color:"#9a7fa0" }}>📍 {faction.location}</span>}
          </div>
          {faction.description&&<p style={{ margin:"0 0 8px", fontSize:13, color:"#9a7fa0", lineHeight:1.5 }}>{faction.description.slice(0,120)}{faction.description.length>120?"…":""}</p>}
          {members.length>0&&(
            <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
              {members.map(c=>(
                <div key={c.id} style={{ display:"flex", alignItems:"center", gap:4, background:"#1e1630", borderRadius:12, padding:"2px 8px 2px 4px" }}>
                  <Avatar src={c.image} name={c.name} size={18}/><span style={{ fontSize:11, color:"#9a7fa0" }}>{c.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FactionsTabContent({
  factions, chars,
  selectedFaction, selectedFactionId,
  updPg,
  onNewFaction, onCancelNew, onSaveFaction, onDeleteFaction, onOpenChar,
  isEditing, onSetEditing,
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
            ? <div style={{ textAlign:"center", padding:"60px 0", color:"#5a4a7a", border:"1px dashed #3a2a5a", borderRadius:12, fontSize:14 }}>No factions yet.<br/><span style={{ fontSize:13 }}>Click "+ New Faction" to create your first faction.</span></div>
            : <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {factions.map(f=>(
                  <FactionCard key={f.id} faction={f} chars={chars} isSelected={selectedFaction?.id===f.id}
                    onSelect={f=>updPg({ selectedFactionId: selectedFactionId===f.id?null:f.id, factionEditing: false })}/>

                ))}
              </div>}
        </div>
        <div style={{ flex:1, minWidth:0, overflowY:"auto" }}>
          {selectedFaction
            ? <FactionDetailPanel faction={selectedFaction} factions={factions} chars={chars}
                onClose={()=>updPg({ selectedFactionId: null })} onSave={onSaveFaction}
                onDelete={onDeleteFaction} onOpenChar={onOpenChar}
                onCancelNew={onCancelNew}
                isEditing={isEditing} onSetEditing={onSetEditing}/>
            : <div style={{ background:"#13101f", border:"1px dashed #2a1f3d", borderRadius:12, padding:"48px 24px", textAlign:"center", color:"#3a2a5a" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>⚑</div>
                <div style={{ fontSize:14, fontFamily:"Georgia,serif" }}>Select a faction to view details</div>
              </div>
          }
        </div>
      </div>
    </div>
  );
}

export default memo(FactionsTabContent);
