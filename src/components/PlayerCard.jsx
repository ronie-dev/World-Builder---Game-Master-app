import React from "react";
import Avatar from "./Avatar.jsx";

const PlayerCard = React.memo(function PlayerCard({ char, isSelected, onSelect }) {
  return (
    <div onClick={()=>onSelect(char)} style={{ background:isSelected?"#1e1535":"#1a1228", border:`1px solid ${isSelected?"#7c5cbf":"#3a2a5a"}`, borderRadius:10, padding:"8px 12px", display:"flex", flexDirection:"row", alignItems:"center", gap:10, cursor:"pointer", transition:"border-color .15s, background .15s", userSelect:"none", minWidth:160, maxWidth:220, flex:"1 1 160px", position:"relative" }}
      onMouseEnter={e=>{ if(!isSelected) e.currentTarget.style.borderColor="#5a3da0"; }}
      onMouseLeave={e=>{ if(!isSelected) e.currentTarget.style.borderColor="#3a2a5a"; }}>
      <Avatar src={char.image} name={char.name} size={36}/>
      <div>
        <div style={{ color:"#e8d5b7", fontWeight:700, fontSize:13, fontFamily:"Georgia,serif" }}>{char.name}</div>
        {char.class&&<div style={{ color:"#9a7fa0", fontSize:11 }}>⚔️ {char.class}</div>}
        {char.level&&<div style={{ color:"#c8a96e", fontSize:11, fontWeight:700 }}>Lvl {char.level}</div>}
      </div>
    </div>
  );
});

export default PlayerCard;
