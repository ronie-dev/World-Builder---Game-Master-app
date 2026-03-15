import React from "react";
import { btnPrimary, btnSecondary } from "../constants.js";

export default function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#1a1228", border:"1px solid #7c5cbf", borderRadius:12, padding:28, width:360, boxShadow:"0 0 40px #7c5cbf44", textAlign:"center" }}>
        <div style={{ fontSize:32, marginBottom:12 }}>⚠️</div>
        <div style={{ color:"#e8d5b7", fontSize:15, marginBottom:20, lineHeight:1.6 }}>{message}</div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onConfirm} style={{...btnPrimary,flex:1,background:"linear-gradient(135deg,#6b1a1a,#a03030)"}}>Delete</button>
          <button onClick={onCancel} style={{...btnSecondary,flex:1}}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
