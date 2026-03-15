import { useState, useMemo } from "react";
import { btnPrimary, btnSecondary, inputStyle } from "../constants.js";

const TYPE_COLORS = {
  Character: "#7c5cbf",
  Artifact:  "#c8a96e",
  Story:     "#4a9a6e",
  Item:      "#6ea0c8",
  Event:     "#c86e9a",
  Lore:      "#9a6ec8",
};

export default function GalleryPicker({ images, onSelect, onClose }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const types = useMemo(() => ["All", ...new Set(images.map(i => i.type))], [images]);

  const visible = useMemo(() => {
    const q = search.toLowerCase();
    return images.filter(i =>
      (filter === "All" || i.type === filter) &&
      (!q || i.label.toLowerCase().includes(q))
    );
  }, [images, search, filter]);

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:"#1a1228", border:"1px solid #7c5cbf", borderRadius:14, width:680, maxHeight:"85vh", display:"flex", flexDirection:"column", boxShadow:"0 0 50px #7c5cbf44", overflow:"hidden" }}>
        {/* Header */}
        <div style={{ padding:"18px 22px 14px", borderBottom:"1px solid #2a1f3d" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
            <h2 style={{ margin:0, color:"#e8d5b7", fontFamily:"Georgia,serif", fontSize:18 }}>🖼️ Image Gallery</h2>
            <button onClick={onClose} style={{ background:"none", border:"none", color:"#9a7fa0", fontSize:20, cursor:"pointer", lineHeight:1 }}>×</button>
          </div>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name…"
            style={{...inputStyle, marginBottom:10, width:"100%", boxSizing:"border-box"}}
            autoFocus
          />
          {/* Type filters */}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {types.map(t => {
              const active = filter === t;
              const color = TYPE_COLORS[t] || "#7c5cbf";
              return (
                <button key={t} onClick={() => setFilter(t)}
                  style={{ padding:"3px 12px", borderRadius:12, border:`1px solid ${active ? color : "#3a2a5a"}`, background: active ? color+"33" : "transparent", color: active ? color : "#7a7a9a", cursor:"pointer", fontSize:12, transition:"all .12s" }}>
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid */}
        <div style={{ overflowY:"auto", padding:18, flex:1 }}>
          {visible.length === 0 ? (
            <div style={{ textAlign:"center", color:"#5a4a7a", padding:"40px 0", fontSize:14 }}>
              {images.length === 0 ? "No images uploaded yet in this campaign." : "No images match your search."}
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(110px, 1fr))", gap:10 }}>
              {visible.map((img, i) => {
                const color = TYPE_COLORS[img.type] || "#7c5cbf";
                return (
                  <div key={i} onClick={() => { onSelect(img.src); onClose(); }}
                    style={{ borderRadius:8, overflow:"hidden", border:"2px solid #2a1f3d", cursor:"pointer", position:"relative", aspectRatio:"1", background:"#0d0b14", transition:"border-color .15s, transform .12s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = "scale(1.04)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a1f3d"; e.currentTarget.style.transform = "scale(1)"; }}>
                    <img src={img.src} alt={img.label} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
                    <div style={{ position:"absolute", inset:0, background:"linear-gradient(transparent 50%, rgba(0,0,0,0.82) 100%)", opacity:0, transition:"opacity .15s" }}
                      onMouseEnter={e => { e.currentTarget.style.opacity=1; }}
                      onMouseLeave={e => { e.currentTarget.style.opacity=0; }}>
                      <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"4px 6px" }}>
                        <div style={{ fontSize:10, color:"#fff", fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{img.label}</div>
                        <div style={{ fontSize:9, color:color }}>{img.type}</div>
                      </div>
                    </div>
                    {/* Always-visible type dot */}
                    <div style={{ position:"absolute", top:5, right:5, width:8, height:8, borderRadius:"50%", background:color, boxShadow:`0 0 4px ${color}` }}/>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ padding:"12px 18px", borderTop:"1px solid #2a1f3d", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:12, color:"#5a4a7a" }}>{visible.length} image{visible.length!==1?"s":""}{filter!=="All"?` · ${filter}`:""}</span>
          <button onClick={onClose} style={{...btnSecondary, fontSize:12, padding:"6px 16px"}}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
