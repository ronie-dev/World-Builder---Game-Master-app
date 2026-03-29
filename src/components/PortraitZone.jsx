import { useState } from "react";
import { useGallery } from "../GalleryContext.js";
import Lightbox from "./Lightbox.jsx";

const cornerBtn = {
  position: "absolute",
  width: 22, height: 22,
  borderRadius: 5,
  border: "1px solid #3a2a5a",
  background: "#0d0b14cc",
  color: "#c8b89a",
  cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: 11,
  lineHeight: 1,
  padding: 0,
};

export default function PortraitZone({ value, onChange, size = 80, emptyIcon = "🖼️", emptyLabel = "Add photo" }) {
  const [hovered, setHovered] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const { openGallery } = useGallery();

  const radius = Math.round(size * 0.125);

  const loadFile = file => {
    if (!file || !file.type.startsWith("image/")) return;
    const r = new FileReader();
    r.onload = e => onChange(e.target.result);
    r.readAsDataURL(file);
  };

  return (
    <>
      <Lightbox src={lightbox ? value : null} onClose={() => setLightbox(false)}/>
      <div style={{ flexShrink:0, position:"relative", width:size, height:size }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); loadFile(e.dataTransfer.files[0]); }}>

        {value ? (
          <>
            <img src={value} alt="" onClick={() => setLightbox(true)}
              style={{ width:size, height:size, borderRadius:radius, objectFit:"cover", border:"1px solid #3a2a5a", display:"block", cursor:"zoom-in" }}/>
            {hovered && <>
              {/* top-left: zoom */}
              <button onClick={() => setLightbox(true)}
                style={{ ...cornerBtn, top:4, left:4 }}
                title="View"
                onMouseEnter={e=>{ e.currentTarget.style.borderColor="#7c5cbf"; e.currentTarget.style.background="#1a1228"; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor="#3a2a5a"; e.currentTarget.style.background="#0d0b14cc"; }}>
                🔍
              </button>
              {/* top-right: remove */}
              <button onClick={() => onChange(null)}
                style={{ ...cornerBtn, top:4, right:4, borderColor:"#6b1a1a", color:"#c06060" }}
                title="Remove"
                onMouseEnter={e=>{ e.currentTarget.style.borderColor="#c06060"; e.currentTarget.style.background="#2a0a0a"; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor="#6b1a1a"; e.currentTarget.style.background="#0d0b14cc"; }}>
                ✕
              </button>
              {/* bottom-left: file */}
              <label style={{ ...cornerBtn, bottom:4, left:4, cursor:"pointer" }}
                title="Upload file"
                onMouseEnter={e=>{ e.currentTarget.style.borderColor="#7c5cbf"; e.currentTarget.style.background="#1a1228"; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor="#3a2a5a"; e.currentTarget.style.background="#0d0b14cc"; }}>
                📷
                <input type="file" accept="image/*" style={{ display:"none" }} onChange={e => loadFile(e.target.files[0])}/>
              </label>
              {/* bottom-right: gallery */}
              <button onClick={() => openGallery(onChange)}
                style={{ ...cornerBtn, bottom:4, right:4 }}
                title="Gallery"
                onMouseEnter={e=>{ e.currentTarget.style.borderColor="#7c5cbf"; e.currentTarget.style.background="#1a1228"; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor="#3a2a5a"; e.currentTarget.style.background="#0d0b14cc"; }}>
                🖼️
              </button>
            </>}
          </>
        ) : (
          <div style={{ width:size, height:size, borderRadius:radius, border:`2px dashed ${hovered?"#7c5cbf":"#3a2a5a"}`, background:"#0d0b14", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6, transition:"border-color .15s" }}>
            <span style={{ fontSize:Math.round(size*0.3), opacity:.3 }}>{emptyIcon}</span>
            <label style={{ display:"flex", alignItems:"center", gap:3, cursor:"pointer", fontSize:10, color:"#5a4a7a", whiteSpace:"nowrap" }}
              onMouseEnter={e=>e.currentTarget.style.color="#9a7fa0"} onMouseLeave={e=>e.currentTarget.style.color="#5a4a7a"}>
              📷 {emptyLabel}
              <input type="file" accept="image/*" style={{ display:"none" }} onChange={e => loadFile(e.target.files[0])}/>
            </label>
            <button onClick={() => openGallery(onChange)}
              style={{ background:"none", border:"1px solid #2a1f3d", borderRadius:4, color:"#5a4a7a", cursor:"pointer", fontSize:10, padding:"2px 8px" }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor="#7c5cbf"; e.currentTarget.style.color="#9a7fa0"; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor="#2a1f3d"; e.currentTarget.style.color="#5a4a7a"; }}>
              🖼️ Gallery
            </button>
          </div>
        )}
      </div>
    </>
  );
}
