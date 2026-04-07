import { useEffect, useRef, memo } from "react";

function NotesTabContent({ notes, setNotes }) {
  const scratchRef = useRef(null);

  useEffect(() => {
    const el = scratchRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [notes.scratch]);

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"28px 32px" }}>
      <h1 style={{ fontFamily:"Georgia,serif", color:"#e8d5b7", margin:"0 0 6px", fontSize:26 }}>Notes</h1>
      <p style={{ color:"#5a4a7a", fontSize:13, margin:"0 0 20px" }}>Scratch pad — auto-saved.</p>
      <div style={{ background:"#13101f", border:"1px solid #2a1f3d", borderRadius:12, overflow:"hidden" }}>
        <div style={{ padding:"10px 18px", borderBottom:"1px solid #2a1f3d", display:"flex", alignItems:"center" }}>
          <span style={{ color:"#c8a96e", fontFamily:"Georgia,serif", fontSize:14, fontWeight:700 }}>✏️ Scratch Pad</span>
          <span style={{ fontSize:11, color:"#5a4a7a", marginLeft:"auto" }}>auto-saved</span>
        </div>
        <textarea
          ref={scratchRef}
          value={notes.scratch || ""}
          onChange={e => {
            setNotes(n => ({ ...n, scratch: e.target.value }));
            e.target.style.height = "auto";
            e.target.style.height = e.target.scrollHeight + "px";
          }}
          placeholder={"Quick notes, reminders, mid-session thoughts…\n\nAnything you type here is saved automatically."}
          style={{ width:"100%", minHeight:200, background:"#0d0b14", border:"none", color:"#e8d5b7", fontSize:14, lineHeight:1.7, padding:"14px 18px", resize:"none", overflow:"hidden", outline:"none", fontFamily:"system-ui,sans-serif", boxSizing:"border-box" }}
        />
      </div>
    </div>
  );
}

export default memo(NotesTabContent);
