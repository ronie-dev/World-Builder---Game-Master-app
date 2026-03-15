import { useState, useRef } from "react";
import { btnSecondary } from "../constants.js";
import { useGallery } from "../GalleryContext.js";

/**
 * Reusable image upload zone with drag-drop, file picker, and gallery browser.
 *
 * Props:
 *   value       — current image src (base64 or null)
 *   onChange    — called with new src string or null
 *   size        — "sm" (64px square) | "md" (80px square) | "full" (full-width drop zone)
 *   showGallery — show Browse Gallery button (default true)
 *   showRemove  — show Remove button when image set (default true)
 */
export default function ImageUploadZone({ value, onChange, size = "full", showGallery = true, showRemove = true }) {
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();
  const { openGallery } = useGallery();

  const loadFile = file => {
    if (!file || !file.type.startsWith("image/")) return;
    const r = new FileReader();
    r.onload = e => onChange(e.target.result);
    r.readAsDataURL(file);
  };

  const handleDrop = e => { e.preventDefault(); setDragOver(false); loadFile(e.dataTransfer.files[0]); };
  const handleDragOver = e => { e.preventDefault(); setDragOver(true); };

  const borderColor = dragOver ? "#7c5cbf" : "#3a2a5a";

  // ── Small/medium square (used inside item forms) ─────────────────────────
  if (size === "sm" || size === "md") {
    const px = size === "sm" ? 64 : 80;
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:4, flexShrink:0 }}>
        <div
          onDragOver={handleDragOver} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
          onClick={() => fileRef.current.click()}
          style={{ width:px, height:px, borderRadius:8, border:`2px dashed ${borderColor}`, background:"#0d0b14", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", overflow:"hidden", transition:"border-color .15s" }}>
          {value
            ? <img src={value} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
            : <span style={{ fontSize:20, opacity:.3 }}>🖼️</span>}
          <input ref={fileRef} type="file" accept="image/*" onChange={e => loadFile(e.target.files[0])} style={{ display:"none" }}/>
        </div>
        {showGallery && <button onClick={() => openGallery(onChange)} style={{...btnSecondary, fontSize:10, padding:"2px 4px", textAlign:"center"}}>Gallery</button>}
        {showRemove && value && <button onClick={() => onChange(null)} style={{...btnSecondary, fontSize:10, padding:"2px 4px", color:"#c06060"}}>Remove</button>}
      </div>
    );
  }

  // ── Full-width drop zone (used in modals and detail panels) ──────────────
  if (value) {
    return (
      <div style={{ position:"relative", display:"inline-block" }}>
        <img src={value} alt="" style={{ maxWidth:"100%", maxHeight:200, borderRadius:8, border:"1px solid #3a2a5a", display:"block" }}/>
        {showRemove && (
          <button onClick={() => onChange(null)}
            style={{ position:"absolute", top:6, right:6, background:"#1a1228cc", border:"1px solid #c06060", borderRadius:4, color:"#c06060", cursor:"pointer", fontSize:12, padding:"2px 8px" }}>
            Remove
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
      onClick={() => fileRef.current.click()}
      style={{ border:`2px dashed ${borderColor}`, borderRadius:8, padding:"20px", textAlign:"center", cursor:"pointer", background:dragOver ? "#7c5cbf11" : "transparent", transition:"border-color .15s, background .15s" }}>
      <div style={{ fontSize:24, marginBottom:6, opacity:.4 }}>🖼️</div>
      <div style={{ fontSize:12, color:"#5a4a7a", marginBottom: showGallery ? 8 : 0 }}>Drop image here or click to upload</div>
      {showGallery && (
        <button onClick={e => { e.stopPropagation(); openGallery(onChange); }}
          style={{...btnSecondary, fontSize:12, padding:"4px 12px"}}>
          Browse Gallery
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" onChange={e => loadFile(e.target.files[0])} style={{ display:"none" }}/>
    </div>
  );
}
