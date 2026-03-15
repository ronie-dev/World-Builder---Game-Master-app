import React from "react";
import Avatar from "./Avatar.jsx";

const PlayerCard = React.memo(function PlayerCard({ char, isSelected, onSelect }) {
  return (
    <div onClick={()=>onSelect(char)} style={{ background:isSelected?"#1e1535":"#1a1228", border:`1px solid ${isSelected?"#7c5cbf":"#3a2a5a"}`, borderRadius:12, padding:"18px 14px", display:"flex", flexDirection:"column", alignItems:"center", gap:10, cursor:"pointer", transition:"border-color .15s, background .15s", userSelect:"none", minWidth:120, maxWidth:160, flex:"1 1 130px", position:"relative" }}
      onMouseEnter={e=>{ if(!isSelected) e.currentTarget.style.borderColor="#5a3da0"; }}
      onMouseLeave={e=>{ if(!isSelected) e.currentTarget.style.borderColor="#3a2a5a"; }}>
      <Avatar src={char.image} name={char.name} size={64}/>
      <div style={{ textAlign:"center" }}>
        <div style={{ color:"#e8d5b7", fontWeight:700, fontSize:14, fontFamily:"Georgia,serif", marginBottom:4 }}>{char.name}</div>
        {char.class&&<div style={{ color:"#9a7fa0", fontSize:12, marginBottom:2 }}>⚔️ {char.class}</div>}
        {char.level&&<div style={{ color:"#c8a96e", fontSize:12, fontWeight:700 }}>Lvl {char.level}</div>}
      </div>
    </div>
  );
});

export default PlayerCard;
