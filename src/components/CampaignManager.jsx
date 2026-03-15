import { useState } from "react";
import { btnPrimary, btnSecondary, inputStyle } from "../constants.js";

export default function CampaignManager({ campaigns, activeCampaignId, onSelect, onCreate, onRename, onDelete, onClose, fullscreen }) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, name }

  const handleCreate = () => {
    const n = newName.trim();
    if (!n) return;
    onCreate(n);
    setNewName("");
  };

  const startEdit = c => { setEditingId(c.id); setEditName(c.name); };
  const saveEdit = () => { if (editName.trim()) onRename(editingId, editName.trim()); setEditingId(null); };

  const content = (
    <div style={{ background:"#1a1228", border:"1px solid #7c5cbf", borderRadius:12, padding:28, width:520, maxHeight:"80vh", overflowY:"auto", boxShadow:"0 0 40px #7c5cbf44" }}>
      <div style={{ display:"flex", alignItems:"center", marginBottom:24 }}>
        <div>
          <div style={{ fontSize:22, fontFamily:"Georgia,serif", color:"#c8a96e" }}>⚗️ World Builder</div>
          <div style={{ fontSize:13, color:"#5a4a7a", marginTop:2 }}>Select a campaign to continue</div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ marginLeft:"auto", background:"none", border:"none", color:"#5a4a7a", cursor:"pointer", fontSize:22, lineHeight:1, padding:"4px 8px" }}>×</button>
        )}
      </div>

      <div style={{ marginBottom:20 }}>
        {campaigns.length === 0 && (
          <div style={{ textAlign:"center", padding:"32px 0", color:"#5a4a7a", fontSize:13, border:"1px dashed #2a1f3d", borderRadius:8 }}>
            No campaigns yet.<br/>Create your first world below.
          </div>
        )}
        {campaigns.map(c => (
          <div key={c.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", borderRadius:8, marginBottom:6, background:activeCampaignId===c.id?"#7c5cbf22":"#13101f", border:`1px solid ${activeCampaignId===c.id?"#7c5cbf":"#2a1f3d"}` }}>
            {editingId === c.id ? (
              <>
                <input value={editName} onChange={e=>setEditName(e.target.value)}
                  onKeyDown={e=>{ if(e.key==="Enter") saveEdit(); if(e.key==="Escape") setEditingId(null); }}
                  style={{...inputStyle, flex:1, fontSize:14}} autoFocus/>
                <button onClick={saveEdit} style={{...btnPrimary, fontSize:12, padding:"4px 10px"}}>Save</button>
                <button onClick={()=>setEditingId(null)} style={{...btnSecondary, fontSize:12, padding:"4px 8px"}}>✕</button>
              </>
            ) : (
              <>
                <div style={{ flex:1, cursor:"pointer" }} onClick={()=>onSelect(c)}>
                  <div style={{ color:"#e8d5b7", fontWeight:600, fontSize:14 }}>
                    {activeCampaignId===c.id&&<span style={{ color:"#7c5cbf", marginRight:6 }}>●</span>}
                    {c.name}
                  </div>
                  <div style={{ fontSize:11, color:"#5a4a7a", marginTop:2 }}>
                    Created {new Date(c.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <button onClick={()=>startEdit(c)} style={{ background:"none", border:"1px solid #3a2a5a", borderRadius:5, color:"#7c5cbf", cursor:"pointer", padding:"3px 8px", fontSize:12 }}>✏️</button>
                <button onClick={()=>setConfirmDelete({id:c.id, name:c.name})} style={{ background:"none", border:"1px solid #3a2a5a", borderRadius:5, color:"#c06060", cursor:"pointer", padding:"3px 8px", fontSize:12 }}>🗑️</button>
              </>
            )}
          </div>
        ))}
      </div>

      <div style={{ borderTop:"1px solid #2a1f3d", paddingTop:16 }}>
        <div style={{ fontSize:12, color:"#b09060", letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>New Campaign</div>
        <div style={{ display:"flex", gap:8 }}>
          <input value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleCreate()}
            placeholder="Campaign name…" style={{...inputStyle, flex:1}}/>
          <button onClick={handleCreate} disabled={!newName.trim()} style={{...btnPrimary, flexShrink:0}}>Create</button>
        </div>
      </div>
    </div>
  );

  const confirmDialog = confirmDelete && (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:400, display:"flex", alignItems:"center", justifyContent:"center" }}
      onMouseDown={e=>e.stopPropagation()}>
      <div style={{ background:"#1a1228", border:"1px solid #7c5cbf", borderRadius:12, padding:28, width:360, boxShadow:"0 0 40px #7c5cbf44", textAlign:"center" }}>
        <div style={{ fontSize:32, marginBottom:12 }}>⚠️</div>
        <div style={{ color:"#e8d5b7", fontSize:15, marginBottom:6, lineHeight:1.6 }}>
          Delete campaign <strong style={{ color:"#c8a96e" }}>{confirmDelete.name}</strong>?
        </div>
        <div style={{ color:"#5a4a7a", fontSize:12, marginBottom:20 }}>This cannot be undone.</div>
        <div style={{ display:"flex", gap:10 }}>
          <button
            onClick={() => { onDelete(confirmDelete.id); setConfirmDelete(null); }}
            style={{...btnPrimary, flex:1, background:"linear-gradient(135deg,#6b1a1a,#a03030)"}}>
            Delete
          </button>
          <button onClick={() => setConfirmDelete(null)} style={{...btnSecondary, flex:1}}>Cancel</button>
        </div>
      </div>
    </div>
  );

  if (fullscreen) {
    return (
      <div style={{ position:"fixed", inset:0, background:"#0d0b14", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center" }}>
        {content}
        {confirmDialog}
      </div>
    );
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center" }}
      onMouseDown={onClose}>
      <div onMouseDown={e=>e.stopPropagation()}>{content}</div>
      {confirmDialog}
    </div>
  );
}
