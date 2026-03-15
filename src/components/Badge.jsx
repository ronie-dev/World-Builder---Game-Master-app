import React from "react";

const Badge = React.memo(function Badge({ label, color }) {
  return <span style={{ background:color||"#333", color:"#e8d5b7", borderRadius:4, padding:"2px 8px", fontSize:11, fontWeight:700, letterSpacing:1 }}>{label}</span>;
});

export default Badge;
