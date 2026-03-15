import { useState, useRef } from "react";
import { iconBtn } from "../constants.js";
import { uid } from "../utils.jsx";

export default function FilesPanel({ char, onUpdateChar }) {
  const fileRef = useRef();
  const [dragOver, setDragOver] = useState(false);
  const files = char.files || [];

  const loadFiles = list => {
    const promises = Array.from(list).map(file => new Promise(resolve => {
      const r = new FileReader();
      r.onload = ev => resolve({ id:uid(), name:file.name, type:file.type, data:ev.target.result });
      r.readAsDataURL(file);
    }));
    Promise.all(promises).then(loaded => onUpdateChar({ ...char, files:[...files,...loaded] }));
  };

  const handleUpload = e => { loadFiles(e.target.files); e.target.value=""; };
  const handleDrop = e => { e.preventDefault(); setDragOver(false); loadFiles(e.dataTransfer.files); };
  const deleteFile = id => onUpdateChar({ ...char, files:files.filter(f=>f.id!==id) });

  const images = files.filter(f=>f.type?.startsWith("image/"));
  const others = files.filter(f=>!f.type?.startsWith("image/"));

  return (
    <div style={{ padding:"16px 24px" }}>
      <div
        onDragOver={e=>{e.preventDefault();setDragOver(true);}}
        onDragLeave={()=>setDragOver(false)}
        onDrop={handleDrop}
        onClick={()=>fileRef.current.click()}
        style={{ border:`2px dashed ${dragOver?"#7c5cbf":"#3a2a5a"}`, borderRadius:10, padding:"28px", textAlign:"center", cursor:"pointer", marginBottom:20, background:dragOver?"#7c5cbf11":"transparent", transition:"border-color .15s, background .15s" }}>
        <div style={{ fontSize:32, marginBottom:8 }}>📎</div>
        <div style={{ color:"#9a7fa0", fontSize:13 }}>Drop files here or <span style={{ color:"#7c5cbf", fontWeight:700 }}>click to upload</span></div>
        <div style={{ color:"#5a4a7a", fontSize:11, marginTop:4 }}>Images, PDFs, documents and more</div>
        <input ref={fileRef} type="file" multiple onChange={handleUpload} style={{ display:"none" }}/>
      </div>
      {images.length>0&&(
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, color:"#7c5cbf", letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>🖼️ Images ({images.length})</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
            {images.map(f=>(
              <div key={f.id} style={{ position:"relative", width:150, height:150, borderRadius:8, overflow:"hidden", border:"1px solid #3a2a5a", flexShrink:0 }}>
                <img src={f.data} alt={f.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0)", display:"flex", flexDirection:"column", justifyContent:"flex-end", transition:"background .15s" }}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(0,0,0,0.6)"}
                  onMouseLeave={e=>e.currentTarget.style.background="rgba(0,0,0,0)"}>
                  <div style={{ padding:"6px 8px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:10, color:"#e8d5b7", fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1, marginRight:4 }}>{f.name}</span>
                    <button onClick={e=>{e.stopPropagation();deleteFile(f.id);}} style={{ background:"#6b1a1a", border:"none", borderRadius:4, color:"#e8d5b7", cursor:"pointer", fontSize:11, padding:"2px 6px", flexShrink:0 }}>✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {others.length>0&&(
        <div>
          <div style={{ fontSize:11, color:"#7c5cbf", letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>📄 Files ({others.length})</div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {others.map(f=>(
              <div key={f.id} style={{ display:"flex", alignItems:"center", gap:10, background:"#0f0c1a", border:"1px solid #2a1f3d", borderRadius:8, padding:"10px 14px" }}>
                <span style={{ fontSize:20 }}>{f.type?.includes("pdf")?"📕":f.type?.includes("text")?"📝":"📄"}</span>
                <a href={f.data} download={f.name} onClick={e=>e.stopPropagation()} style={{ flex:1, color:"#c8a96e", fontSize:13, textDecoration:"none" }}>{f.name}</a>
                <button onClick={()=>deleteFile(f.id)} style={{...iconBtn,color:"#c06060"}}>🗑️</button>
              </div>
            ))}
          </div>
        </div>
      )}
      {files.length===0&&<div style={{ textAlign:"center", padding:"20px 0", color:"#5a4a7a", fontSize:13 }}>No files uploaded yet.</div>}
    </div>
  );
}
