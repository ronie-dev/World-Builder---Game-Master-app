import React from "react";

const Avatar = React.memo(function Avatar({ src, name, size=64 }) {
  if (src) return <img src={src} alt={name} style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover", border:"2px solid #7c5cbf", flexShrink:0 }} />;
  return <div style={{ width:size, height:size, borderRadius:"50%", background:"linear-gradient(135deg,#2d1b69,#7c5cbf)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.38, color:"#e8d5b7", border:"2px solid #7c5cbf", flexShrink:0 }}>{name?name[0].toUpperCase():"?"}</div>;
});

export default Avatar;
