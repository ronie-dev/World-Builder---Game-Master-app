import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { inputStyle } from "../constants.js";
import { getFactionColor } from "../utils.jsx";

export default function FactionDropdown({ factions, selectedIds, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [rect, setRect] = useState(null);
  const triggerRef = useRef();
  const dropRef = useRef();
  const searchRef = useRef();
  const toggle = id => onChange(selectedIds.includes(id) ? selectedIds.filter(x=>x!==id) : [...selectedIds, id]);
  const selected = factions.filter(f => selectedIds.includes(f.id));

  const openDropdown = () => {
    if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect());
    setOpen(o => !o);
    setSearch("");
  };

  useEffect(() => {
    if (open && searchRef.current) setTimeout(() => searchRef.current?.focus(), 30);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = e => {
      if (triggerRef.current?.contains(e.target)) return;
      if (dropRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const update = () => { if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect()); };
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => { window.removeEventListener("scroll", update, true); window.removeEventListener("resize", update); };
  }, [open]);

  const filtered = factions.filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={triggerRef} style={{ position:"relative" }}>
      <div onClick={openDropdown} style={{ ...inputStyle, cursor:"pointer", display:"flex", alignItems:"center", flexWrap:"wrap", gap:6, minHeight:38, padding:"6px 10px", userSelect:"none" }}>
        {selected.length === 0
          ? <span style={{ color:"#5a4a7a", fontSize:13 }}>— Select factions —</span>
          : selected.map(f => (
              <span key={f.id} style={{ display:"inline-flex", alignItems:"center", gap:4, background:getFactionColor(factions,f.id)+"55", border:`1px solid ${getFactionColor(factions,f.id)}88`, borderRadius:12, padding:"2px 8px", fontSize:12, color:"#e8d5b7", fontWeight:600 }}>
                {f.name}
                <span onMouseDown={e=>{e.stopPropagation();toggle(f.id);}} style={{ cursor:"pointer", color:"#c06060", fontSize:13, lineHeight:1 }}>×</span>
              </span>
            ))
        }
        <span style={{ marginLeft:"auto", color:"#5a4a7a", fontSize:11, flexShrink:0 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && rect && createPortal(
        <div ref={dropRef} style={{ position:"fixed", ...(rect.bottom + 260 > window.innerHeight ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }), left: rect.left, width: rect.width, background:"#1a1228", border:"1px solid #7c5cbf", borderRadius:8, zIndex:9999, boxShadow:"0 8px 32px #00000088" }}>
          <div style={{ padding:"8px 10px", borderBottom:"1px solid #2a1f3d" }}>
            <input ref={searchRef} placeholder="Search factions…" value={search} onChange={e=>setSearch(e.target.value)}
              onMouseDown={e=>e.stopPropagation()}
              style={{...inputStyle, fontSize:12, padding:"6px 10px"}}/>
          </div>
          <div style={{ maxHeight:200, overflowY:"auto" }}>
            {filtered.length === 0
              ? <div style={{ padding:"12px 14px", color:"#5a4a7a", fontSize:13 }}>No matches.</div>
              : filtered.map(f => {
                  const checked = selectedIds.includes(f.id);
                  const color = getFactionColor(factions, f.id);
                  return (
                    <div key={f.id} onClick={()=>toggle(f.id)} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 14px", cursor:"pointer", background:checked?`${color}22`:"transparent", borderBottom:"1px solid #1e1630", transition:"background .12s" }}
                      onMouseEnter={e=>{ if(!checked) e.currentTarget.style.background="#1e1630"; }}
                      onMouseLeave={e=>{ if(!checked) e.currentTarget.style.background="transparent"; }}>
                      <div style={{ width:16, height:16, borderRadius:4, border:`2px solid ${checked?color:"#3a2a5a"}`, background:checked?color:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all .12s" }}>
                        {checked && <span style={{ color:"#fff", fontSize:10, fontWeight:900, lineHeight:1 }}>✓</span>}
                      </div>
                      <span style={{ color: checked?"#e8d5b7":"#9a7fa0", fontSize:13, fontWeight:checked?600:400 }}>{f.name}</span>
                    </div>
                  );
                })
            }
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
