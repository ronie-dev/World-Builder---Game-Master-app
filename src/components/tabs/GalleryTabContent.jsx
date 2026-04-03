import { useState } from "react";
import { btnPrimary, inputStyle } from "../../constants.js";
import { uid } from "../../utils.jsx";
import ImageUploadZone from "../ImageUploadZone.jsx";

const GALLERY_TYPES = ["All","Character","Story","Artifact","Item","Event","Lore","Other"];
const UPLOAD_CATEGORIES = ["Character","Story","Artifact","Item","Event","Lore","Other"];
const TYPE_COLORS = { Character:"#7c5cbf", Story:"#4a9a6a", Artifact:"#c8a96e", Item:"#5a8abf", Event:"#9a5a5a", Lore:"#7a5a9a", Other:"#6a6a7a" };

function GalleryTabContent({ images, galleryEntries, onUpdateEntries }) {
  const [lightbox, setLightbox] = useState(null);
  const [filter, setFilter] = useState("All");
  const [uploading, setUploading] = useState(false);
  const [uploadSrc, setUploadSrc] = useState("");
  const [uploadLabel, setUploadLabel] = useState("");
  const [uploadType, setUploadType] = useState("Other");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Merge: custom entries first (with _custom flag), then auto-collected
  const allImages = [
    ...(galleryEntries||[]).map(e => ({...e, _custom:true})),
    ...images,
  ];
  const filtered = filter === "All" ? allImages : allImages.filter(i => i.type === filter);

  const handleUpload = () => {
    if (!uploadSrc) return;
    const entry = { id: uid(), src: uploadSrc, label: uploadLabel.trim() || "Untitled", type: uploadType };
    onUpdateEntries([entry, ...(galleryEntries||[])]);
    setUploadSrc(""); setUploadLabel(""); setUploadType("Other"); setUploading(false);
  };

  const handleDelete = id => {
    onUpdateEntries((galleryEntries||[]).filter(e => e.id !== id));
    setConfirmDeleteId(null);
    if (lightbox?._custom && lightbox?.id === id) setLightbox(null);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <div>
          <h1 style={{ fontFamily:"Georgia,serif", color:"#e8d5b7", margin:"0 0 4px", fontSize:26 }}>Gallery</h1>
          <p style={{ color:"#5a4a7a", fontSize:13, margin:0 }}>{filtered.length} image{filtered.length!==1?"s":""}{filter!=="All"?` · ${filter}`:""}</p>
        </div>
        <button onClick={()=>{ setUploading(v=>!v); setUploadSrc(""); setUploadLabel(""); setUploadType("Other"); }}
          style={{...btnPrimary, fontSize:12}}>
          {uploading ? "✕ Cancel" : "＋ Upload Image"}
        </button>
      </div>

      {/* Upload form */}
      {uploading && (
        <div style={{ background:"#13101f", border:"1px solid #3a2a5a", borderRadius:10, padding:"18px 20px", marginBottom:20 }}>
          <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
            <div style={{ flexShrink:0, width:120 }}>
              <ImageUploadZone value={uploadSrc} onChange={setUploadSrc} size="sm"/>
            </div>
            <div style={{ flex:1, display:"flex", flexDirection:"column", gap:10 }}>
              <div>
                <label style={{ display:"block", fontSize:11, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Name</label>
                <input value={uploadLabel} onChange={e=>setUploadLabel(e.target.value)} placeholder="Image name…"
                  style={{...inputStyle, fontSize:13, width:"100%"}}/>
              </div>
              <div>
                <label style={{ display:"block", fontSize:11, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Category</label>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {UPLOAD_CATEGORIES.map(t => (
                    <div key={t} onClick={()=>setUploadType(t)}
                      style={{ padding:"4px 12px", borderRadius:14, cursor:"pointer", fontSize:12, border:`1px solid ${uploadType===t?(TYPE_COLORS[t]||"#7c5cbf"):"#3a2a5a"}`, background:uploadType===t?(TYPE_COLORS[t]||"#7c5cbf")+"33":"transparent", color:uploadType===t?(TYPE_COLORS[t]||"#c8a96e"):"#7a7a9a", transition:"all .12s" }}>
                      {t}
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={handleUpload} disabled={!uploadSrc}
                style={{...btnPrimary, alignSelf:"flex-start", opacity:uploadSrc?1:0.4}}>
                💾 Add to Gallery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Type filters */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:18 }}>
        {GALLERY_TYPES.map(t => (
          <button key={t} onClick={()=>setFilter(t)}
            style={{ fontSize:12, padding:"5px 12px", borderRadius:20, border:`1px solid ${filter===t?(TYPE_COLORS[t]||"#7c5cbf"):"#3a2a5a"}`, background:filter===t?(TYPE_COLORS[t]||"#7c5cbf")+"33":"transparent", color:filter===t?(TYPE_COLORS[t]||"#c8a96e"):"#5a4a7a", cursor:"pointer", transition:"all .15s" }}>
            {t}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:"80px 0", color:"#5a4a7a" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🖼️</div>
          <div style={{ fontSize:16, fontFamily:"Georgia,serif" }}>{filter==="All" ? "No images yet" : `No ${filter} images`}</div>
          <div style={{ fontSize:13, marginTop:6 }}>Upload images directly or add them to characters, stories, artifacts, and events.</div>
        </div>
      ) : (
        <div style={{ columns:"160px", columnGap:12 }}>
          {filtered.map((img, i) => (
            <div key={img.id||i}
              style={{ breakInside:"avoid", marginBottom:12, borderRadius:10, overflow:"hidden", border:"1px solid #2a1f3d", position:"relative", display:"block", transition:"border-color .15s, transform .15s" }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor="#7c5cbf"; e.currentTarget.style.transform="scale(1.02)"; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor="#2a1f3d"; e.currentTarget.style.transform="scale(1)"; }}>
              <img src={img.src} alt={img.label} onClick={()=>setLightbox(img)} style={{ width:"100%", display:"block", objectFit:"cover", cursor:"zoom-in" }}/>
              {/* Type badge */}
              <div style={{ position:"absolute", top:6, left:6 }}>
                <span style={{ fontSize:9, background:(TYPE_COLORS[img.type]||"#7c5cbf")+"cc", color:"#fff", borderRadius:10, padding:"2px 6px", fontWeight:700 }}>{img.type}</span>
              </div>
              {/* Delete button (custom only) */}
              {img._custom && (
                confirmDeleteId === img.id ? (
                  <div onClick={e=>e.stopPropagation()} style={{ position:"absolute", top:6, right:6, display:"flex", gap:4 }}>
                    <button onClick={()=>handleDelete(img.id)} style={{ background:"#6b1a1a", border:"none", borderRadius:6, color:"#e8d5b7", fontSize:11, padding:"3px 8px", cursor:"pointer", fontWeight:700 }}>Delete</button>
                    <button onClick={()=>setConfirmDeleteId(null)} style={{ background:"#2a1f3d", border:"none", borderRadius:6, color:"#9a7fa0", fontSize:11, padding:"3px 6px", cursor:"pointer" }}>✕</button>
                  </div>
                ) : (
                  <button onClick={e=>{ e.stopPropagation(); setConfirmDeleteId(img.id); }}
                    style={{ position:"absolute", top:6, right:6, background:"#0d0b14aa", border:"none", borderRadius:6, color:"#c06060", fontSize:13, padding:"2px 6px", cursor:"pointer", lineHeight:1 }}>
                    🗑️
                  </button>
                )
              )}
              {/* Label on hover */}
              <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"linear-gradient(transparent,#0d0b14dd)", padding:"20px 8px 6px", opacity:0, transition:"opacity .15s", pointerEvents:"none" }}
                onMouseEnter={e=>{ e.currentTarget.style.opacity=1; e.currentTarget.style.pointerEvents="auto"; }}
                onMouseLeave={e=>{ e.currentTarget.style.opacity=0; }}>
                <div style={{ fontSize:11, color:"#e8d5b7", fontWeight:700, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{img.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div onClick={()=>setLightbox(null)}
          style={{ position:"fixed", inset:0, background:"#000000cc", zIndex:9999, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:32 }}>
          <div onClick={e=>e.stopPropagation()} style={{ maxWidth:"80vw", maxHeight:"80vh", position:"relative" }}>
            <img src={lightbox.src} alt={lightbox.label} style={{ maxWidth:"100%", maxHeight:"80vh", borderRadius:10, objectFit:"contain", boxShadow:"0 8px 64px #000" }}/>
            <div style={{ marginTop:12, textAlign:"center" }}>
              <div style={{ fontSize:15, color:"#e8d5b7", fontFamily:"Georgia,serif", fontWeight:700 }}>{lightbox.label}</div>
              <div style={{ fontSize:12, color:TYPE_COLORS[lightbox.type]||"#7c5cbf", marginTop:3 }}>{lightbox.type}</div>
            </div>
          </div>
          <button onClick={()=>setLightbox(null)} style={{ position:"fixed", top:24, right:32, background:"none", border:"none", color:"#9a7fa0", fontSize:32, cursor:"pointer", lineHeight:1 }}>×</button>
        </div>
      )}
    </div>
  );
}

export default GalleryTabContent;
