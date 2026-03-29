import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import useStateWithRef from "./useStateWithRef.js";
import {
  DEFAULT_RACES, CHAR_STATUS_COLORS, RELATIONSHIP_COLORS,
  DEFAULT_CHAR_STATUSES, DEFAULT_RELATIONSHIP_TYPES, DEFAULT_STORY_STATUSES, DEFAULT_HOOK_STATUSES,
  btnPrimary, btnSecondary, iconBtn, inputStyle, ghostInput,
  defaultChar, defaultStory, defaultFaction, defaultLocation, defaultFilters,
} from "./constants.js";
import { uid, getRaceLabel } from "./utils.jsx";

import { useToastContext } from "./components/Toast.jsx";
import GlobalSearch from "./components/GlobalSearch.jsx";
import Avatar from "./components/Avatar.jsx";
import CharModal from "./components/CharModal.jsx";
import LocationModal from "./components/LocationModal.jsx";
import GlobalTimeline from "./components/GlobalTimeline.jsx";
import LoreTab from "./components/LoreTab.jsx";
import EventModal from "./components/EventModal.jsx";
import ArtifactsTab from "./components/ArtifactsTab.jsx";
import SaveLoadBar from "./components/SaveLoadBar.jsx";
import ConfirmDialog from "./components/ConfirmDialog.jsx";
import CampaignManager from "./components/CampaignManager.jsx";
import MapTab from "./components/MapTab.jsx";
import GalleryPicker from "./components/GalleryPicker.jsx";
import { GalleryContext } from "./GalleryContext.js";
import ImageUploadZone from "./components/ImageUploadZone.jsx";
import CharactersTabContent from "./components/tabs/CharactersTabContent.jsx";
import StoriesTabContent from "./components/tabs/StoriesTabContent.jsx";
import FactionsTabContent from "./components/tabs/FactionsTabContent.jsx";
import LocationsTabContent from "./components/tabs/LocationsTabContent.jsx";

// ── Storage (IndexedDB) ───────────────────────────────────────────────────────
const store = (() => {
  let _db = null;
  const open = () => {
    if (_db) return Promise.resolve(_db);
    return new Promise((res, rej) => {
      const req = indexedDB.open("world_builder_v1", 1);
      req.onupgradeneeded = e => e.target.result.createObjectStore("kv");
      req.onsuccess = e => { _db = e.target.result; res(_db); };
      req.onerror = () => rej(req.error);
    });
  };
  return {
    async get(key) {
      const db = await open();
      return new Promise((res, rej) => {
        const req = db.transaction("kv","readonly").objectStore("kv").get(key);
        req.onsuccess = () => res(req.result ?? null);
        req.onerror = () => rej(req.error);
      });
    },
    async set(key, val) {
      const db = await open();
      return new Promise((res, rej) => {
        const tx = db.transaction("kv","readwrite");
        tx.objectStore("kv").put(val, key);
        tx.oncomplete = res;
        tx.onerror = () => rej(tx.error);
      });
    },
    async delete(key) {
      const db = await open();
      return new Promise((res, rej) => {
        const tx = db.transaction("kv","readwrite");
        tx.objectStore("kv").delete(key);
        tx.oncomplete = res;
        tx.onerror = () => rej(tx.error);
      });
    }
  };
})();


// ── Single char search picker (used in pin forms) ─────────────────────────────
function MultiCharPicker({ chars, selectedIds, onChange }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ids = selectedIds || [];
  const filtered = chars.filter(c => { const q=search.toLowerCase(); return !ids.includes(c.id) && (!q||c.name.toLowerCase().includes(q)); });
  const add = c => { onChange([...ids, c.id]); setSearch(""); };
  const remove = id => onChange(ids.filter(x=>x!==id));
  return (
    <div>
      {ids.length > 0 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:5 }}>
          {ids.map(id => { const c = chars.find(x=>x.id===id); return c ? (
            <div key={id} style={{ display:"flex", alignItems:"center", gap:5, background:"#2a1f3d", border:"1px solid #7c5cbf", borderRadius:20, padding:"3px 8px 3px 5px" }}>
              <Avatar src={c.image} name={c.name} size={18}/>
              <span style={{ fontSize:12, color:"#e8d5b7" }}>{c.name}</span>
              <button onClick={()=>remove(id)} style={{ background:"none", border:"none", color:"#c06060", cursor:"pointer", fontSize:13, padding:0, lineHeight:1 }}>×</button>
            </div>
          ) : null; })}
        </div>
      )}
      <div style={{ position:"relative" }}>
        <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#5a4a7a", fontSize:13, pointerEvents:"none" }}>🔍</span>
        <input
          value={search}
          onChange={e=>{ setSearch(e.target.value); setOpen(true); }}
          onFocus={()=>setOpen(true)}
          onBlur={()=>setTimeout(()=>setOpen(false), 150)}
          placeholder={ids.length ? "Add another character…" : "Link characters… (optional)"}
          style={{ width:"100%", background:"#0d0b14", border:"1px solid #3a2a5a", borderRadius:6, padding:"6px 10px 6px 30px", color:"#e8d5b7", fontSize:12, outline:"none", boxSizing:"border-box" }}
        />
        {open && filtered.length > 0 && (
          <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, background:"#13101f", border:"1px solid #3a2a5a", borderRadius:8, zIndex:100, maxHeight:160, overflowY:"auto", boxShadow:"0 4px 20px #00000088" }}>
            {filtered.map(c => (
              <div key={c.id} onMouseDown={()=>add(c)} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 12px", cursor:"pointer", borderBottom:"1px solid #1e1630" }}
                onMouseEnter={e=>e.currentTarget.style.background="#1e1630"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <Avatar src={c.image} name={c.name} size={26}/>
                <div>
                  <div style={{ fontSize:13, color:"#e8d5b7" }}>{c.name}</div>
                  <div style={{ fontSize:11, color:"#9a7fa0" }}>{c.type==="player"?"🎲":c.type==="main"?"⭐":"👤"} {c.type}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Gallery Tab ───────────────────────────────────────────────────────────────
const GALLERY_TYPES = ["All","Character","Story","Artifact","Item","Event","Lore","Other"];
const UPLOAD_CATEGORIES = ["Character","Story","Artifact","Item","Event","Lore","Other"];
const TYPE_COLORS = { Character:"#7c5cbf", Story:"#4a9a6a", Artifact:"#c8a96e", Item:"#5a8abf", Event:"#9a5a5a", Lore:"#7a5a9a", Other:"#6a6a7a" };

function GalleryTab({ images, galleryEntries, onUpdateEntries }) {
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

// ── Notes Tab ─────────────────────────────────────────────────────────────────
// ── Add to Timeline Modal ─────────────────────────────────────────────────────
// Story picker modal — first step of "Add to Timeline"
function StoryPickerModal({ stories, storyStatuses, onClose, onSelect }) {
  const [search, setSearch] = useState("");
  const filtered = stories.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()));
  const colorMap = Object.fromEntries((storyStatuses||[]).map(s=>[s.name, s.color]));
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:"#1a1228", border:"1px solid #7c5cbf", borderRadius:12, padding:28, width:380, maxHeight:"70vh", overflowY:"auto", boxShadow:"0 0 40px #7c5cbf44" }}>
        <h2 style={{ color:"#e8d5b7", margin:"0 0 16px", fontFamily:"Georgia,serif", fontSize:18 }}>Add to Timeline</h2>
        <p style={{ color:"#7c5cbf", fontSize:13, margin:"0 0 16px" }}>Choose a story to link this event to:</p>
        <div style={{ position:"relative", marginBottom:12 }}>
          <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#5a4a7a", fontSize:13, pointerEvents:"none" }}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} autoFocus placeholder="Search stories…"
            style={{ width:"100%", background:"#0d0b14", border:"1px solid #3a2a5a", borderRadius:6, padding:"8px 10px 8px 30px", color:"#e8d5b7", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
        </div>
        <div style={{ border:"1px solid #2a1f3d", borderRadius:8, overflow:"hidden" }}>
          {filtered.length === 0
            ? <div style={{ padding:"14px", color:"#5a4a7a", fontSize:13 }}>No stories found.</div>
            : filtered.map(s => {
                const sc = colorMap[s.status] || "#5a4a7a";
                return (
                  <div key={s.id} onClick={()=>onSelect(s.id)}
                    style={{ padding:"10px 14px", cursor:"pointer", borderBottom:"1px solid #1e1630", display:"flex", alignItems:"center", gap:10 }}
                    onMouseEnter={e=>e.currentTarget.style.background="#1e1630"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <span style={{ flex:1, color:"#e8d5b7", fontSize:13 }}>📜 {s.name}</span>
                    {s.status && <span style={{ fontSize:10, color:sc, background:sc+"22", border:`1px solid ${sc}55`, borderRadius:10, padding:"2px 8px", whiteSpace:"nowrap", fontWeight:600 }}>{s.status}</span>}
                  </div>
                );
              })
          }
        </div>
        <button onClick={onClose} style={{ marginTop:14, width:"100%", background:"transparent", color:"#9a7fa0", border:"1px solid #3a2a5a", borderRadius:6, padding:"8px", cursor:"pointer", fontSize:13 }}>Cancel</button>
      </div>
    </div>
  );
}

function NotesTab({ notes, setNotes, chars, stories, setStories, onOpenStory, onOpenChar, onPinHook, onPinCharHook, onRemovePin, hookStatuses, storyStatuses, onUpdateStory, onUpdateChar }) {
  const [newPin, setNewPin] = useState("");
  const [newPinCharIds, setNewPinCharIds] = useState([]);
  const [addingSession, setAddingSession] = useState(false);
  const [sessionForm, setSessionForm] = useState({ title:"", year:"", month:"", day:"" });
  const [collapsed, setCollapsed] = useState({});
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editSessionForm, setEditSessionForm] = useState({ title:"", year:"", month:"", day:"" });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [editingPinId, setEditingPinId] = useState(null);
  const [editPinText, setEditPinText] = useState("");
  const [editPinCharIds, setEditPinCharIds] = useState([]);
  const [confirmDeletePinId, setConfirmDeletePinId] = useState(null);
  const dragPinRef = useRef(null);
  const [dragOverPinId, setDragOverPinId] = useState(null);
  const scratchRef = useRef(null);
  const [scratchLocal, setScratchLocal] = useState(notes.scratch || "");
  // Sync if notes.scratch changes externally (campaign switch / import)
  useEffect(() => { setScratchLocal(notes.scratch || ""); }, [notes.scratch]);
  // Size on mount
  useEffect(() => {
    const el = scratchRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, []);
  // per-session new event input
  const [newEventText, setNewEventText] = useState({});
  // inline event editing: { sessionId, eventId }
  const [editingEventId, setEditingEventId] = useState(null);
  const [editEventText, setEditEventText] = useState("");
  // story picker modal: { sessionId, sessionEventId }
  const [timelineModal, setTimelineModal] = useState(null);
  // event form modal: { sessionId, sessionEventId, storyId, prefill }
  const [timelineEventModal, setTimelineEventModal] = useState(null);
  // confirm unlink
  const [confirmUnlink, setConfirmUnlink] = useState(null); // { sessionId, sessionEventId }
  const [confirmDeleteEvt, setConfirmDeleteEvt] = useState(null); // { sessionId, eventId }

  const allChars = (chars||[]).filter(c => c.type === "main" || c.type === "side" || c.type === "player");

  const addPin = () => {
    const t = newPin.trim();
    if (!t) return;
    setNotes(n => ({...n, pins:[{id:uid(), text:t, charIds:newPinCharIds}, ...n.pins]}));
    setNewPin("");
    setNewPinCharIds([]);
  };

  const removePin = id => { onRemovePin(id); setConfirmDeletePinId(null); };
  const movePin = (id, dir) => setNotes(n => {
    const pins = [...(n.pins||[])];
    const i = pins.findIndex(p=>p.id===id);
    const j = dir==="up" ? i-1 : i+1;
    if (j < 0 || j >= pins.length) return n;
    [pins[i], pins[j]] = [pins[j], pins[i]];
    return {...n, pins};
  });
  const reorderPin = (fromId, toId) => setNotes(n => {
    const pins = [...(n.pins||[])];
    const from = pins.findIndex(p=>p.id===fromId);
    const to   = pins.findIndex(p=>p.id===toId);
    if (from===-1||to===-1||from===to) return n;
    const [item] = pins.splice(from, 1);
    pins.splice(to, 0, item);
    return {...n, pins};
  });
  const togglePinDone = id => setNotes(n => ({...n, pins: n.pins.map(p => p.id===id ? {...p, done:!p.done} : p)}));
  const saveEditPin = () => {
    if (editPinText.trim()) setNotes(n => ({...n, pins: n.pins.map(p => p.id===editingPinId ? {...p, text:editPinText.trim(), charIds:editPinCharIds} : p)}));
    setEditingPinId(null);
  };

  const saveSession = () => {
    if (!sessionForm.title.trim()) return;
    setNotes(n => ({...n, sessions:[{id:uid(), year:sessionForm.year, month:sessionForm.month, day:sessionForm.day, title:sessionForm.title, events:[]}, ...n.sessions]}));
    setAddingSession(false);
    setSessionForm({ title:"", year:"", month:"", day:"" });
  };

  const deleteSession = id => {
    // also remove any linked timeline events
    const s = (notes.sessions||[]).find(x=>x.id===id);
    if (s) {
      (s.events||[]).forEach(ev => {
        if (ev.linkedStoryId && ev.linkedEventId) {
          setStories(prev => prev.map(st => st.id===ev.linkedStoryId ? {...st, events:(st.events||[]).filter(e=>e.id!==ev.linkedEventId)} : st));
        }
      });
    }
    setNotes(n => ({...n, sessions: n.sessions.filter(x=>x.id!==id)}));
    setConfirmDeleteId(null);
  };

  const saveEditSession = () => {
    setNotes(n => ({...n, sessions: n.sessions.map(s => s.id===editingSessionId ? {...s, title:editSessionForm.title, year:editSessionForm.year, month:editSessionForm.month, day:editSessionForm.day} : s)}));
    setEditingSessionId(null);
  };

  const toggleSession = id => setCollapsed(c => ({...c, [id]: !c[id]}));

  // session events
  const addSessionEvent = (sessionId) => {
    const t = (newEventText[sessionId]||"").trim();
    if (!t) return;
    setNotes(n => ({...n, sessions: n.sessions.map(s => s.id===sessionId ? {...s, events:[{id:uid(), text:t}, ...(s.events||[])]} : s)}));
    setNewEventText(p => ({...p, [sessionId]: ""}));
  };

  const deleteSessionEvent = (sessionId, eventId) => {
    // if linked, also remove from story
    const s = (notes.sessions||[]).find(x=>x.id===sessionId);
    const ev = (s?.events||[]).find(e=>e.id===eventId);
    if (ev?.linkedStoryId && ev?.linkedEventId) {
      setStories(prev => prev.map(st => st.id===ev.linkedStoryId ? {...st, events:(st.events||[]).filter(e=>e.id!==ev.linkedEventId)} : st));
    }
    setNotes(n => ({...n, sessions: n.sessions.map(s => s.id===sessionId ? {...s, events:(s.events||[]).filter(e=>e.id!==eventId)} : s)}));
  };

  const saveEditSessionEvent = () => {
    if (!editEventText.trim() || !editingEventId) return;
    setNotes(n => ({...n, sessions: n.sessions.map(s => s.id===editingEventId.sessionId
      ? {...s, events:(s.events||[]).map(e => e.id===editingEventId.eventId ? {...e, text:editEventText.trim()} : e)}
      : s
    )}));
    setEditingEventId(null);
  };

  const addToTimeline = (sessionId, sessionEventId) => {
    setTimelineModal({ sessionId, sessionEventId });
  };

  const onStorySelected = (storyId) => {
    const { sessionId, sessionEventId } = timelineModal;
    const sess = (notes.sessions||[]).find(s=>s.id===sessionId);
    const sessEv = (sess?.events||[]).find(e=>e.id===sessionEventId);
    setTimelineModal(null);
    setTimelineEventModal({ sessionId, sessionEventId, storyId, prefill: {
      year: sess?.year||"", month: sess?.month||"", day: sess?.day||"",
      title: sessEv?.text.split("\n")[0].slice(0,80)||"",
      description: sessEv?.text||"",
    }});
  };

  const saveToTimeline = (eventForm) => {
    const { sessionId, sessionEventId, storyId } = timelineEventModal;
    const newEventId = uid();
    setStories(prev => prev.map(st => st.id===storyId ? {...st, events:[{...eventForm, id:newEventId}, ...(st.events||[])]} : st));
    setNotes(n => ({...n, sessions: n.sessions.map(s => s.id===sessionId ? {...s, events:(s.events||[]).map(e => e.id===sessionEventId ? {...e, linkedStoryId:storyId, linkedEventId:newEventId} : e)} : s)}));
    setTimelineEventModal(null);
  };

  const unlinkFromTimeline = (sessionId, sessionEventId) => {
    const s = (notes.sessions||[]).find(x=>x.id===sessionId);
    const ev = (s?.events||[]).find(e=>e.id===sessionEventId);
    if (ev?.linkedStoryId && ev?.linkedEventId) {
      setStories(prev => prev.map(st => st.id===ev.linkedStoryId ? {...st, events:(st.events||[]).filter(e=>e.id!==ev.linkedEventId)} : st));
    }
    setNotes(n => ({...n, sessions: n.sessions.map(s => s.id===sessionId ? {...s, events:(s.events||[]).map(e => e.id===sessionEventId ? {...e, linkedStoryId:null, linkedEventId:null} : e)} : s)}));
    setConfirmUnlink(null);
  };

  return (
    <div>
      <h1 style={{ fontFamily:"Georgia,serif", color:"#e8d5b7", margin:"0 0 6px", fontSize:26 }}>Notes</h1>
      <p style={{ color:"#5a4a7a", fontSize:13, margin:"0 0 28px" }}>Scratch pad, reminders, and session log — all auto-saved.</p>

      <div style={{ display:"flex", gap:24, alignItems:"flex-start" }}>
        {/* Left column: Pins + Scratch Pad */}
        <div style={{ flex:"1 1 320px", minWidth:260 }}>
          {/* Pinned Reminders */}
          <div style={{ background:"#13101f", border:"1px solid #2a1f3d", borderRadius:12, overflow:"hidden", marginBottom:20 }}>
            <div style={{ padding:"12px 18px", borderBottom:"1px solid #2a1f3d" }}>
              <span style={{ color:"#c8a96e", fontFamily:"Georgia,serif", fontSize:15, fontWeight:700 }}>📌 Pinned Reminders</span>
            </div>
            <div style={{ padding:"12px 18px", borderBottom:"1px solid #1e1630", display:"flex", flexDirection:"column", gap:8 }}>
              <textarea
                value={newPin}
                onChange={e => setNewPin(e.target.value)}
                onKeyDown={e => { if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); addPin(); } }}
                placeholder="Add a reminder… (Enter to pin, Shift+Enter for new line)"
                rows={2}
                style={{ width:"100%", background:"#0d0b14", border:"1px solid #3a2a5a", borderRadius:6, padding:"7px 10px", color:"#e8d5b7", fontSize:13, outline:"none", resize:"vertical", lineHeight:1.5, boxSizing:"border-box" }}
              />
              <MultiCharPicker chars={allChars} selectedIds={newPinCharIds} onChange={setNewPinCharIds}/>
              <button onClick={addPin} style={{ background:"#2a1f3d", border:"1px solid #3a2a5a", borderRadius:6, color:"#9a7fa0", cursor:"pointer", fontSize:13, padding:"7px 14px" }}>Pin</button>
            </div>
            <div style={{ minHeight:40 }}>
              {(notes.pins||[]).length === 0
                ? <div style={{ color:"#3a2a5a", fontSize:13, textAlign:"center", padding:"16px 18px" }}>No reminders pinned.</div>
                : (notes.pins||[]).map(p => {
                  const isDragOver = dragOverPinId === p.id;
                  const dragHandleStyle = { fontSize:14, color:"#3a2a5a", cursor:"grab", padding:"2px 4px", flexShrink:0, lineHeight:1, userSelect:"none" };

                  // ── Story hook pin ──
                  if (p.hookPin) {
                    const story = (stories||[]).find(s=>s.id===p.storyId);
                    const hook = story && (story.hooks||[]).find(h=>h.id===p.hookId);
                    if (!story || !hook) return null;
                    const statuses = hookStatuses || [];
                    const colorMap = Object.fromEntries(statuses.map(s=>[s.name, s.color]));
                    const sc = colorMap[hook.status] || "#7c5cbf";
                    return (
                      <div key={p.id} draggable
                        onDragStart={()=>{ dragPinRef.current=p.id; }}
                        onDragOver={e=>{ e.preventDefault(); setDragOverPinId(p.id); }}
                        onDragLeave={()=>setDragOverPinId(null)}
                        onDrop={e=>{ e.preventDefault(); reorderPin(dragPinRef.current,p.id); setDragOverPinId(null); }}
                        onDragEnd={()=>{ dragPinRef.current=null; setDragOverPinId(null); }}
                        style={{ borderBottom:"1px solid #1e1630", padding:"10px 10px 10px 0", background:isDragOver?"#1e1630":"#0f0c1a", borderLeft:`3px solid ${sc}88`, transition:"background .1s" }}>
                        <div style={{ display:"flex", alignItems:"flex-start", gap:6 }}>
                          <span style={dragHandleStyle}>⠿</span>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
                              <span style={{ fontSize:10, color:"#5a4a7a", textTransform:"uppercase", letterSpacing:.8, fontWeight:600 }}>Plot Hook</span>
                              <span style={{ fontSize:10, color:"#3a2a5a" }}>·</span>
                              <span onClick={()=>onOpenStory(story, null, { storySubTab:"hooks" })} style={{ fontSize:11, color:"#c8a96e", cursor:"pointer", fontWeight:700 }}>{story.name} ↗</span>
                            </div>
                            <div onClick={()=>onOpenStory(story, null, { storySubTab:"hooks" })} style={{ fontSize:13, color:"#e8d5b7", fontWeight:700, fontFamily:"Georgia,serif", marginBottom: hook.description ? 5 : 6, cursor:"pointer" }}
                              onMouseEnter={e=>e.currentTarget.style.color="#c8a96e"} onMouseLeave={e=>e.currentTarget.style.color="#e8d5b7"}>{hook.title}</div>
                            {hook.description && <div style={{ fontSize:12, color:"#9a8272", lineHeight:1.55, whiteSpace:"pre-wrap", marginBottom:8 }}>{hook.description}</div>}
                            {statuses.length > 0 && (
                              <select value={hook.status || statuses[0]?.name || ""}
                                onChange={e => onUpdateStory?.({...story, hooks: (story.hooks||[]).map(h => h.id===hook.id ? {...h, status: e.target.value} : h)})}
                                style={{ fontSize:11, background:"#1a1228", border:`1px solid ${sc}66`, borderRadius:6, color:sc, padding:"3px 8px", cursor:"pointer", outline:"none" }}>
                                {statuses.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                              </select>
                            )}
                          </div>
                          <button onClick={()=>onPinHook(story.id, hook.id)} title="Unpin" style={{ background:"none", border:"none", color:"#4a3a5a", cursor:"pointer", fontSize:13, padding:"2px 4px", flexShrink:0 }}
                            onMouseEnter={e=>e.currentTarget.style.color="#c8a96e"} onMouseLeave={e=>e.currentTarget.style.color="#4a3a5a"}>📌</button>
                        </div>
                      </div>
                    );
                  }

                  // ── Char hook pin ──
                  if (p.charHookPin) {
                    const ch = (chars||[]).find(c=>c.id===p.charId);
                    const hook = ch && (ch.hooks||[]).find(h=>h.id===p.hookId);
                    if (!ch || !hook) return null;
                    const statuses = hookStatuses || [];
                    const colorMap = Object.fromEntries(statuses.map(s=>[s.name, s.color]));
                    const sc = colorMap[hook.status] || "#7c5cbf";
                    return (
                      <div key={p.id} draggable
                        onDragStart={()=>{ dragPinRef.current=p.id; }}
                        onDragOver={e=>{ e.preventDefault(); setDragOverPinId(p.id); }}
                        onDragLeave={()=>setDragOverPinId(null)}
                        onDrop={e=>{ e.preventDefault(); reorderPin(dragPinRef.current,p.id); setDragOverPinId(null); }}
                        onDragEnd={()=>{ dragPinRef.current=null; setDragOverPinId(null); }}
                        style={{ borderBottom:"1px solid #1e1630", padding:"10px 10px 10px 0", background:isDragOver?"#1e1630":"#0f0c1a", borderLeft:`3px solid ${sc}88`, transition:"background .1s" }}>
                        <div style={{ display:"flex", alignItems:"flex-start", gap:6 }}>
                          <span style={dragHandleStyle}>⠿</span>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                              <Avatar src={ch.image} name={ch.name} size={24}/>
                              <div>
                                <div style={{ fontSize:10, color:"#5a4a7a", textTransform:"uppercase", letterSpacing:.8, fontWeight:600 }}>Character Hook</div>
                                <span onClick={()=>onOpenChar(ch, { charSubTab:"hooks" })} style={{ fontSize:11, color:"#c8a96e", cursor:"pointer", fontWeight:700 }}>{ch.name} ↗</span>
                              </div>
                            </div>
                            <div onClick={()=>onOpenChar(ch, { charSubTab:"hooks" })} style={{ fontSize:13, color:"#e8d5b7", fontWeight:700, fontFamily:"Georgia,serif", marginBottom: hook.description ? 5 : 6, cursor:"pointer" }}
                              onMouseEnter={e=>e.currentTarget.style.color="#c8a96e"} onMouseLeave={e=>e.currentTarget.style.color="#e8d5b7"}>{hook.title}</div>
                            {hook.description && <div style={{ fontSize:12, color:"#9a8272", lineHeight:1.55, whiteSpace:"pre-wrap", marginBottom:8 }}>{hook.description}</div>}
                            {statuses.length > 0 && (
                              <select value={hook.status || statuses[0]?.name || ""}
                                onChange={e => onUpdateChar?.({...ch, hooks: (ch.hooks||[]).map(h => h.id===hook.id ? {...h, status: e.target.value} : h)})}
                                style={{ fontSize:11, background:"#1a1228", border:`1px solid ${sc}66`, borderRadius:6, color:sc, padding:"3px 8px", cursor:"pointer", outline:"none" }}>
                                {statuses.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                              </select>
                            )}
                          </div>
                          <button onClick={()=>onPinCharHook(ch.id, hook.id)} title="Unpin" style={{ background:"none", border:"none", color:"#4a3a5a", cursor:"pointer", fontSize:13, padding:"2px 4px", flexShrink:0 }}
                            onMouseEnter={e=>e.currentTarget.style.color="#c8a96e"} onMouseLeave={e=>e.currentTarget.style.color="#4a3a5a"}>📌</button>
                        </div>
                      </div>
                    );
                  }

                  // ── Regular note pin ──
                  const pinChars = (p.charIds?.length ? p.charIds : p.charId ? [p.charId] : []).map(id => allChars.find(c=>c.id===id)).filter(Boolean);
                  return (
                    <div key={p.id} draggable={editingPinId !== p.id && confirmDeletePinId !== p.id}
                      onDragStart={()=>{ dragPinRef.current=p.id; }}
                      onDragOver={e=>{ e.preventDefault(); setDragOverPinId(p.id); }}
                      onDragLeave={()=>setDragOverPinId(null)}
                      onDrop={e=>{ e.preventDefault(); reorderPin(dragPinRef.current,p.id); setDragOverPinId(null); }}
                      onDragEnd={()=>{ dragPinRef.current=null; setDragOverPinId(null); }}
                      style={{ borderBottom:"1px solid #1e1630", background:isDragOver?"#1e1630":p.done?"#111820":"transparent", borderLeft:`3px solid ${p.done?"#4a9a4a":"#2a1f3d"}`, transition:"background .1s" }}>
                      {editingPinId === p.id ? (
                        <div style={{ display:"flex", flexDirection:"column", gap:6, padding:"8px 14px" }}>
                          <textarea value={editPinText} onChange={e=>setEditPinText(e.target.value)} onKeyDown={e=>{ if(e.key==="Escape") setEditingPinId(null); }}
                            autoFocus rows={3} style={{ ...ghostInput, width:"100%", resize:"vertical", lineHeight:1.5, boxSizing:"border-box", borderColor:"#7c5cbf", color:"#e8d5b7" }}/>
                          <MultiCharPicker chars={allChars} selectedIds={editPinCharIds} onChange={setEditPinCharIds}/>
                          <div style={{ display:"flex", gap:6 }}>
                            <button onClick={saveEditPin} style={{ flex:1, background:"#5a3da0", border:"none", borderRadius:6, color:"#e8d5b7", cursor:"pointer", fontSize:12, padding:"5px 10px" }}>Save</button>
                            <button onClick={()=>setEditingPinId(null)} style={{ flex:1, background:"none", border:"1px solid #3a2a5a", borderRadius:6, color:"#9a7fa0", cursor:"pointer", fontSize:12, padding:"5px 10px" }}>Cancel</button>
                          </div>
                        </div>
                      ) : confirmDeletePinId === p.id ? (
                        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 14px", background:"#1a0d0d" }}>
                          <span style={{ flex:1, fontSize:12, color:"#c8b89a" }}>Delete <strong>"{p.text.slice(0,40)}{p.text.length>40?"…":""}"</strong>?</span>
                          <button onClick={()=>removePin(p.id)} style={{ background:"#6b1a1a", color:"#e8d5b7", border:"none", borderRadius:6, padding:"4px 12px", cursor:"pointer", fontWeight:700, fontSize:12 }}>Delete</button>
                          <button onClick={()=>setConfirmDeletePinId(null)} style={{ background:"transparent", color:"#9a7fa0", border:"1px solid #3a2a5a", borderRadius:6, padding:"4px 12px", cursor:"pointer", fontSize:12 }}>Cancel</button>
                        </div>
                      ) : (
                        <div style={{ display:"flex", alignItems:"flex-start", gap:6, padding:"8px 10px 8px 0" }}>
                          <span style={dragHandleStyle}>⠿</span>
                          <input type="checkbox" checked={!!p.done} onChange={()=>togglePinDone(p.id)}
                            style={{ width:15, height:15, accentColor:"#7c5cbf", cursor:"pointer", flexShrink:0, marginTop:3 }}/>
                          <div style={{ flex:1, minWidth:0 }}>
                            <span style={{ fontSize:13, color:p.done?"#5a6a5a":"#e8d5b7", lineHeight:1.5, overflowWrap:"break-word", wordBreak:"break-word", textDecoration:p.done?"line-through":"none", opacity:p.done?.7:1 }}>{p.text}</span>
                            {pinChars.length > 0 && (
                              <div style={{ display:"flex", flexDirection:"row", flexWrap:"wrap", gap:8, marginTop:6 }}>
                                {pinChars.map(pc => (
                                  <div key={pc.id} onClick={() => onOpenChar?.(pc)} style={{ display:"flex", alignItems:"center", gap:5, cursor:"pointer", background:"#1a1228", border:"1px solid #2a1f3d", borderRadius:20, padding:"3px 10px 3px 4px" }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor="#7c5cbf"; e.currentTarget.querySelector(".pin-char-name").style.color="#a07ee8"; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor="#2a1f3d"; e.currentTarget.querySelector(".pin-char-name").style.color="#7c5cbf"; }}>
                                    <Avatar src={pc.image} name={pc.name} size={18}/>
                                    <span className="pin-char-name" style={{ fontSize:11, color:"#7c5cbf", fontWeight:600, transition:"color .12s", whiteSpace:"nowrap" }}>{pc.name} ↗</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <button onClick={()=>{ setEditingPinId(p.id); setEditPinText(p.text); setEditPinCharIds(p.charIds || (p.charId ? [p.charId] : [])); }} style={{ background:"none", border:"none", color:"#3a2a5a", cursor:"pointer", fontSize:13, padding:"2px 4px", flexShrink:0 }}
                            onMouseEnter={e=>e.currentTarget.style.color="#9a7fe0"} onMouseLeave={e=>e.currentTarget.style.color="#3a2a5a"}>✏️</button>
                          <button onClick={()=>setConfirmDeletePinId(p.id)} style={{ background:"none", border:"none", color:"#2a1f3a", cursor:"pointer", fontSize:13, padding:"2px 4px", flexShrink:0 }}
                            onMouseEnter={e=>e.currentTarget.style.color="#c06060"} onMouseLeave={e=>e.currentTarget.style.color="#2a1f3a"}>🗑️</button>
                        </div>
                      )}
                    </div>
                  );
                })
              }
            </div>
          </div>

          {/* Scratch Pad */}

          <div style={{ background:"#13101f", border:"1px solid #2a1f3d", borderRadius:12, overflow:"hidden" }}>
            <div style={{ padding:"12px 18px", borderBottom:"1px solid #2a1f3d", display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ color:"#c8a96e", fontFamily:"Georgia,serif", fontSize:15, fontWeight:700 }}>✏️ Scratch Pad</span>
              <span style={{ fontSize:11, color:"#5a4a7a", marginLeft:"auto" }}>auto-saved</span>
            </div>
            <textarea
              ref={scratchRef}
              value={scratchLocal}
              onChange={e => {
                setScratchLocal(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = e.target.scrollHeight + "px";
              }}
              onBlur={() => setNotes(n => ({...n, scratch: scratchLocal}))}
              placeholder={"Quick notes, reminders, mid-session thoughts…\n\nAnything you type here is saved automatically."}
              style={{ width:"100%", minHeight:120, background:"#0d0b14", border:"none", color:"#e8d5b7", fontSize:14, lineHeight:1.7, padding:"14px 18px", resize:"none", overflow:"hidden", outline:"none", fontFamily:"system-ui,sans-serif", boxSizing:"border-box" }}
            />
          </div>
        </div>

        {/* Right column: Session Log */}
        <div style={{ flex:"1 1 320px", minWidth:260 }}>
          <div style={{ background:"#13101f", border:"1px solid #2a1f3d", borderRadius:12, overflow:"hidden" }}>
            <div style={{ padding:"12px 18px", borderBottom:"1px solid #2a1f3d", display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ color:"#c8a96e", fontFamily:"Georgia,serif", fontSize:15, fontWeight:700 }}>📖 Session Log</span>
              <span style={{ fontSize:11, color:"#5a4a7a", flex:1 }}>{(notes.sessions||[]).length} session{(notes.sessions||[]).length!==1?"s":""} · {(notes.sessions||[]).reduce((n,s)=>n+(s.events||[]).length,0)} event{(notes.sessions||[]).reduce((n,s)=>n+(s.events||[]).length,0)!==1?"s":""}</span>
              <button onClick={() => { setAddingSession(true); setSessionForm({ title:"", year:"", month:"", day:"" }); }}
                style={{ background:"linear-gradient(135deg,#5a3da0,#7c5cbf)", color:"#e8d5b7", border:"none", borderRadius:6, padding:"5px 14px", cursor:"pointer", fontWeight:700, fontSize:12 }}>
                + New Session
              </button>
            </div>

            {addingSession && (
              <div style={{ padding:"14px 18px", borderBottom:"1px solid #2a1f3d", background:"#0d0b14" }}>
                <div style={{ marginBottom:10 }}>
                  <input value={sessionForm.title} onChange={e=>setSessionForm(f=>({...f,title:e.target.value}))} placeholder="Session title…"
                    style={{ width:"100%", background:"#13101f", border:"1px solid #3a2a5a", borderRadius:6, padding:"7px 10px", color:"#e8d5b7", fontSize:13, outline:"none", boxSizing:"border-box", marginBottom:8 }}/>
                  <div style={{ display:"flex", gap:8 }}>
                    <input value={sessionForm.year} onChange={e=>setSessionForm(f=>({...f,year:e.target.value}))} placeholder="Year"
                      style={{ flex:2, background:"#13101f", border:"1px solid #3a2a5a", borderRadius:6, padding:"7px 10px", color:"#e8d5b7", fontSize:13, outline:"none" }}/>
                    <input value={sessionForm.month} onChange={e=>setSessionForm(f=>({...f,month:e.target.value}))} placeholder="Month"
                      style={{ flex:1, background:"#13101f", border:"1px solid #3a2a5a", borderRadius:6, padding:"7px 10px", color:"#e8d5b7", fontSize:13, outline:"none" }}/>
                    <input value={sessionForm.day} onChange={e=>setSessionForm(f=>({...f,day:e.target.value}))} placeholder="Day"
                      style={{ flex:1, background:"#13101f", border:"1px solid #3a2a5a", borderRadius:6, padding:"7px 10px", color:"#e8d5b7", fontSize:13, outline:"none" }}/>
                  </div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={saveSession} disabled={!sessionForm.title.trim()} style={{ flex:1, background:"linear-gradient(135deg,#5a3da0,#7c5cbf)", color:"#e8d5b7", border:"none", borderRadius:6, padding:"8px", cursor:"pointer", fontWeight:700, fontSize:13 }}>Create Session</button>
                  <button onClick={() => setAddingSession(false)} style={{ flex:1, background:"transparent", color:"#9a7fa0", border:"1px solid #3a2a5a", borderRadius:6, padding:"8px", cursor:"pointer", fontSize:13 }}>Cancel</button>
                </div>
              </div>
            )}

            {(notes.sessions||[]).length === 0 && !addingSession
              ? <div style={{ color:"#3a2a5a", fontSize:13, textAlign:"center", padding:"40px 24px" }}>No sessions logged yet.<br/><span style={{ fontSize:12 }}>Click "+ New Session" to start.</span></div>
              : (notes.sessions||[]).map(s => (
                  <div key={s.id} style={{ borderBottom:"1px solid #1e1630" }}>
                    {editingSessionId === s.id ? (
                      <div style={{ padding:"14px 18px", background:"#0d0b14" }}>
                        <div style={{ marginBottom:10 }}>
                          <input value={editSessionForm.title} onChange={e=>setEditSessionForm(f=>({...f,title:e.target.value}))} placeholder="Session title…"
                            style={{ width:"100%", background:"#13101f", border:"1px solid #3a2a5a", borderRadius:6, padding:"7px 10px", color:"#e8d5b7", fontSize:13, outline:"none", boxSizing:"border-box", marginBottom:8 }}/>
                          <div style={{ display:"flex", gap:8 }}>
                            <input value={editSessionForm.year} onChange={e=>setEditSessionForm(f=>({...f,year:e.target.value}))} placeholder="Year"
                              style={{ flex:2, background:"#13101f", border:"1px solid #3a2a5a", borderRadius:6, padding:"7px 10px", color:"#e8d5b7", fontSize:13, outline:"none" }}/>
                            <input value={editSessionForm.month} onChange={e=>setEditSessionForm(f=>({...f,month:e.target.value}))} placeholder="Month"
                              style={{ flex:1, background:"#13101f", border:"1px solid #3a2a5a", borderRadius:6, padding:"7px 10px", color:"#e8d5b7", fontSize:13, outline:"none" }}/>
                            <input value={editSessionForm.day} onChange={e=>setEditSessionForm(f=>({...f,day:e.target.value}))} placeholder="Day"
                              style={{ flex:1, background:"#13101f", border:"1px solid #3a2a5a", borderRadius:6, padding:"7px 10px", color:"#e8d5b7", fontSize:13, outline:"none" }}/>
                          </div>
                        </div>
                        <div style={{ display:"flex", gap:8 }}>
                          <button onClick={saveEditSession} style={{ flex:1, background:"linear-gradient(135deg,#5a3da0,#7c5cbf)", color:"#e8d5b7", border:"none", borderRadius:6, padding:"8px", cursor:"pointer", fontWeight:700, fontSize:13 }}>💾 Save</button>
                          <button onClick={()=>setEditingSessionId(null)} style={{ flex:1, background:"transparent", color:"#9a7fa0", border:"1px solid #3a2a5a", borderRadius:6, padding:"8px", cursor:"pointer", fontSize:13 }}>Cancel</button>
                        </div>
                      </div>
                    ) : confirmDeleteId === s.id ? (
                      <div style={{ padding:"14px 18px", background:"#1a0d0d", display:"flex", alignItems:"center", gap:12 }}>
                        <span style={{ flex:1, fontSize:13, color:"#c8b89a" }}>Delete <strong>"{s.title}"</strong> and all its events?</span>
                        <button onClick={()=>deleteSession(s.id)} style={{ background:"#6b1a1a", color:"#e8d5b7", border:"none", borderRadius:6, padding:"6px 16px", cursor:"pointer", fontWeight:700, fontSize:12 }}>Delete</button>
                        <button onClick={()=>setConfirmDeleteId(null)} style={{ background:"transparent", color:"#9a7fa0", border:"1px solid #3a2a5a", borderRadius:6, padding:"6px 16px", cursor:"pointer", fontSize:12 }}>Cancel</button>
                      </div>
                    ) : (
                      <>
                        {/* Session header */}
                        <div onClick={() => toggleSession(s.id)} style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 16px", cursor:"pointer", userSelect:"none", background:"#1a1228" }}
                          onMouseEnter={e=>e.currentTarget.style.background="#1e1630"}
                          onMouseLeave={e=>e.currentTarget.style.background="#1a1228"}>
                          <span style={{ fontSize:10, color:"#5a4a7a" }}>{collapsed[s.id] ? "▶" : "▼"}</span>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:14, color:"#e8d5b7", fontWeight:700, fontFamily:"Georgia,serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.title}</div>
                            <div style={{ display:"flex", gap:8, marginTop:2, alignItems:"center" }}>
                              {(s.year||s.month||s.day) && <span style={{ fontSize:11, color:"#c8a96e99" }}>📅 {[s.year,s.month,s.day].filter(Boolean).join(" / ")}</span>}
                              <span style={{ fontSize:11, color:"#4a3a6a" }}>{(s.events||[]).length} event{(s.events||[]).length!==1?"s":""}</span>
                            </div>
                          </div>
                          <button onClick={e=>{e.stopPropagation(); setEditingSessionId(s.id); setEditSessionForm({title:s.title, year:s.year||"", month:s.month||"", day:s.day||""}); }} style={{ background:"none", border:"none", color:"#4a3a6a", cursor:"pointer", fontSize:13, padding:"2px 6px", flexShrink:0 }}
                            onMouseEnter={e=>e.currentTarget.style.color="#9a7fe0"} onMouseLeave={e=>e.currentTarget.style.color="#4a3a6a"}>✏️</button>
                          <button onClick={e=>{e.stopPropagation(); setConfirmDeleteId(s.id); }} style={{ background:"none", border:"none", color:"#3a2020", cursor:"pointer", fontSize:14, padding:"2px 4px", flexShrink:0 }}
                            onMouseEnter={e=>e.currentTarget.style.color="#c06060"} onMouseLeave={e=>e.currentTarget.style.color="#3a2020"}>🗑️</button>
                        </div>

                        {/* Session body */}
                        {!collapsed[s.id] && (
                          <div style={{ borderTop:"1px solid #1e1630" }}>
                            {/* Add event input */}
                            <div style={{ padding:"10px 12px 6px", display:"flex", gap:8 }}>
                              <textarea
                                value={newEventText[s.id]||""}
                                onChange={e=>setNewEventText(p=>({...p,[s.id]:e.target.value}))}
                                onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); addSessionEvent(s.id); } }}
                                placeholder="Add event… (Enter to add, Shift+Enter for new line)"
                                rows={2}
                                style={{ ...ghostInput, flex:1, resize:"vertical", lineHeight:1.5, boxSizing:"border-box", fontSize:12 }}
                              />
                              <button onClick={()=>addSessionEvent(s.id)} style={{ background:"transparent", border:"1px solid #3a2a5a", borderRadius:6, color:"#5a4a7a", cursor:"pointer", fontSize:12, padding:"6px 12px", flexShrink:0, alignSelf:"flex-end", transition:"all .12s" }}
                                onMouseEnter={e=>{ e.currentTarget.style.borderColor="#7c5cbf"; e.currentTarget.style.color="#9a7fe0"; }}
                                onMouseLeave={e=>{ e.currentTarget.style.borderColor="#3a2a5a"; e.currentTarget.style.color="#5a4a7a"; }}>Add</button>
                            </div>
                            {/* Events list */}
                            <div style={{ display:"flex", flexDirection:"column", gap:6, padding:"8px 12px" }}>
                            {(s.events||[]).map(ev => {
                              const linkedStory = ev.linkedStoryId ? (stories||[]).find(st=>st.id===ev.linkedStoryId) : null;
                              const isEditing = editingEventId?.sessionId===s.id && editingEventId?.eventId===ev.id;
                              return (
                                <div key={ev.id} style={{ background:"#0f0c1a", border:"1px solid #1e1630", borderLeft:`3px solid ${linkedStory?"#5a3da0":"#2a1f3d"}`, borderRadius:7, padding:"9px 10px", display:"flex", alignItems:"flex-start", gap:8 }}>
                                  <div style={{ flex:1, minWidth:0 }}>
                                    {isEditing ? (
                                      <>
                                        <textarea value={editEventText} onChange={e=>setEditEventText(e.target.value)}
                                          onKeyDown={e=>{ if(e.key==="Escape") setEditingEventId(null); }}
                                          autoFocus rows={3}
                                          style={{ ...ghostInput, width:"100%", resize:"vertical", lineHeight:1.5, boxSizing:"border-box", borderColor:"#7c5cbf", color:"#e8d5b7" }}/>
                                        <div style={{ display:"flex", gap:6, marginTop:6 }}>
                                          <button onClick={saveEditSessionEvent} style={{ flex:1, background:"#5a3da0", border:"none", borderRadius:6, color:"#e8d5b7", cursor:"pointer", fontSize:12, padding:"4px 10px" }}>Save</button>
                                          <button onClick={()=>setEditingEventId(null)} style={{ flex:1, background:"none", border:"1px solid #3a2a5a", borderRadius:6, color:"#9a7fa0", cursor:"pointer", fontSize:12, padding:"4px 10px" }}>Cancel</button>
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <div style={{ fontSize:13, color:"#c8b89a", lineHeight:1.6, overflowWrap:"break-word", wordBreak:"break-word", whiteSpace:"pre-wrap" }}>{ev.text}</div>
                                        <div style={{ marginTop:6, display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                                          {linkedStory ? (
                                            <>
                                              <span onClick={()=>onOpenStory&&onOpenStory(linkedStory, ev.linkedEventId)}
                                                style={{ fontSize:11, color:"#9a7fe0", background:"#5a3da022", border:"1px solid #5a3da066", borderRadius:20, padding:"2px 10px", cursor:"pointer", fontWeight:600 }}
                                                onMouseEnter={e=>e.currentTarget.style.background="#5a3da044"}
                                                onMouseLeave={e=>e.currentTarget.style.background="#5a3da022"}>
                                                🔗 {linkedStory.name}
                                              </span>
                                              {confirmUnlink?.sessionId===s.id && confirmUnlink?.sessionEventId===ev.id ? (
                                                <>
                                                  <button onMouseDown={()=>unlinkFromTimeline(s.id, ev.id)} style={{ background:"#6b1a1a", color:"#e8d5b7", border:"none", borderRadius:4, padding:"2px 8px", cursor:"pointer", fontSize:11 }}>Unlink</button>
                                                  <button onMouseDown={()=>setConfirmUnlink(null)} style={{ background:"transparent", color:"#9a7fa0", border:"1px solid #3a2a5a", borderRadius:4, padding:"2px 8px", cursor:"pointer", fontSize:11 }}>Cancel</button>
                                                </>
                                              ) : (
                                                <button onClick={()=>setConfirmUnlink({sessionId:s.id, sessionEventId:ev.id})} style={{ background:"none", border:"none", color:"#5a3a3a", cursor:"pointer", fontSize:11, padding:"0 2px" }}>✕ unlink</button>
                                              )}
                                            </>
                                          ) : (
                                            <button onClick={()=>addToTimeline(s.id, ev.id)} style={{ background:"none", border:"1px solid #2a1f3d", borderRadius:20, color:"#5a4a7a", cursor:"pointer", fontSize:11, padding:"2px 10px", transition:"all .12s" }}
                                              onMouseEnter={e=>{ e.currentTarget.style.borderColor="#7c5cbf"; e.currentTarget.style.color="#9a7fe0"; }}
                                              onMouseLeave={e=>{ e.currentTarget.style.borderColor="#2a1f3d"; e.currentTarget.style.color="#5a4a7a"; }}>
                                              + Timeline
                                            </button>
                                          )}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                  {!isEditing && <button onClick={()=>{ setEditingEventId({sessionId:s.id, eventId:ev.id}); setEditEventText(ev.text); }} style={{ background:"none", border:"none", color:"#4a3a6a", cursor:"pointer", fontSize:12, padding:"2px 4px", flexShrink:0 }}
                                    onMouseEnter={e=>e.currentTarget.style.color="#9a7fe0"} onMouseLeave={e=>e.currentTarget.style.color="#4a3a6a"}>✏️</button>}
                                  {confirmDeleteEvt?.sessionId===s.id && confirmDeleteEvt?.eventId===ev.id ? (
                                    <>
                                      <button onClick={()=>{ deleteSessionEvent(s.id, ev.id); setConfirmDeleteEvt(null); }} style={{ background:"#6b1a1a", color:"#e8d5b7", border:"none", borderRadius:4, padding:"2px 8px", cursor:"pointer", fontSize:11, flexShrink:0 }}>Delete</button>
                                      <button onClick={()=>setConfirmDeleteEvt(null)} style={{ background:"transparent", color:"#9a7fa0", border:"1px solid #3a2a5a", borderRadius:4, padding:"2px 8px", cursor:"pointer", fontSize:11, flexShrink:0 }}>✕</button>
                                    </>
                                  ) : (
                                    <button onClick={()=>setConfirmDeleteEvt({sessionId:s.id, eventId:ev.id})} style={{ background:"none", border:"none", color:"#2a1f3a", cursor:"pointer", fontSize:12, padding:"2px 4px", flexShrink:0 }}
                                      onMouseEnter={e=>e.currentTarget.style.color="#c06060"} onMouseLeave={e=>e.currentTarget.style.color="#2a1f3a"}>🗑️</button>
                                  )}
                                </div>
                              );
                            })}
                            </div>

                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))
            }
          </div>
        </div>
      </div>

      {timelineModal && <StoryPickerModal stories={stories||[]} storyStatuses={storyStatuses} onClose={()=>setTimelineModal(null)} onSelect={onStorySelected}/>}
      {timelineEventModal && <EventModal event={timelineEventModal.prefill} chars={allChars} onClose={()=>setTimelineEventModal(null)} onSave={saveToTimeline} currentTimelineDate={(() => { const all = (stories||[]).flatMap(s=>s.events||[]).filter(e=>e.year); if(!all.length) return null; const latest = [...all].sort((a,b)=>{ const dy=(parseInt(b.year)||0)-(parseInt(a.year)||0); if(dy) return dy; const dm=(parseInt(b.month)||0)-(parseInt(a.month)||0); if(dm) return dm; return (parseInt(b.day)||0)-(parseInt(a.day)||0); })[0]; return [latest.year,latest.month,latest.day].filter(Boolean).join(" / "); })()}/>}

    </div>
  );
}

// ── Color Picker Swatch ───────────────────────────────────────────────────────
function ColorSwatch({ color, onChange }) {
  const ref = useRef();
  return (
    <div style={{ position:"relative", flexShrink:0 }}>
      <div onClick={()=>ref.current?.click()} title="Pick color"
        style={{ width:20, height:20, borderRadius:4, background:color, cursor:"pointer", border:"2px solid #3a2a5a", transition:"border-color .15s" }}
        onMouseEnter={e=>e.currentTarget.style.borderColor="#7c5cbf"}
        onMouseLeave={e=>e.currentTarget.style.borderColor="#3a2a5a"}/>
      <input ref={ref} type="color" value={color} onChange={e=>onChange(e.target.value)}
        style={{ position:"absolute", opacity:0, width:0, height:0, pointerEvents:"none", top:0, left:0 }}/>
    </div>
  );
}

// ── Simple List Editor ────────────────────────────────────────────────────────
function SimpleListEditor({ items, onChange, placeholder, onRename }) {
  const [newItem, setNewItem] = useState("");
  const [newColor, setNewColor] = useState("#7c5cbf");
  const [editingIdx, setEditingIdx] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [editColor, setEditColor] = useState("#7c5cbf");

  const add = () => {
    const n=newItem.trim();
    if(!n||items.some(i=>i.name===n)) return;
    onChange([...items,{name:n,color:newColor}]);
    setNewItem("");
  };
  const remove = idx => onChange(items.filter((_,i)=>i!==idx));
  const startEdit = idx => { setEditingIdx(idx); setEditVal(items[idx].name); setEditColor(items[idx].color); };
  const saveEdit = () => {
    const n=editVal.trim(); if(!n) return;
    const oldName=items[editingIdx].name;
    onChange(items.map((v,i)=>i===editingIdx?{name:n,color:editColor}:v));
    if(onRename&&oldName!==n) onRename(oldName,n);
    setEditingIdx(null);
  };
  const moveUp   = idx => { if(idx===0) return; const a=[...items]; [a[idx-1],a[idx]]=[a[idx],a[idx-1]]; onChange(a); };
  const moveDown = idx => { if(idx===items.length-1) return; const a=[...items]; [a[idx],a[idx+1]]=[a[idx+1],a[idx]]; onChange(a); };

  return (
    <div>
      <div style={{ padding:"12px 24px", borderBottom:"1px solid #1e1630", display:"flex", gap:8, alignItems:"center" }}>
        <ColorSwatch color={newColor} onChange={setNewColor}/>
        <input placeholder={placeholder||"New entry…"} value={newItem} onChange={e=>setNewItem(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} style={{...inputStyle,flex:1,fontSize:13}}/>
        <button onClick={add} style={{...btnPrimary,fontSize:12,padding:"6px 14px"}}>+ Add</button>
      </div>
      {items.length===0&&<div style={{ padding:"12px 24px", color:"#5a4a7a", fontSize:13 }}>No entries yet.</div>}
      {items.map((item,idx)=>(
        <div key={idx} style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 24px", borderBottom:"1px solid #1e1630" }}>
          {editingIdx===idx ? (
            <>
              <ColorSwatch color={editColor} onChange={setEditColor}/>
              <input value={editVal} onChange={e=>setEditVal(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter") saveEdit(); if(e.key==="Escape") setEditingIdx(null); }} style={{...inputStyle,flex:1,fontSize:13}} autoFocus/>
              <button onClick={saveEdit} style={{...btnPrimary,fontSize:12,padding:"4px 10px"}}>Save</button>
              <button onClick={()=>setEditingIdx(null)} style={{...btnSecondary,fontSize:12,padding:"4px 8px"}}>✕</button>
            </>
          ) : (
            <>
              <div style={{ width:14, height:14, borderRadius:3, background:item.color, flexShrink:0, border:"1px solid #3a2a5a" }}/>
              <span style={{ flex:1, color:"#e8d5b7", fontSize:13 }}>{item.name}</span>
              <button onClick={()=>moveUp(idx)} style={{...iconBtn,opacity:idx===0?0.25:1}} disabled={idx===0} title="Move up">▲</button>
              <button onClick={()=>moveDown(idx)} style={{...iconBtn,opacity:idx===items.length-1?0.25:1}} disabled={idx===items.length-1} title="Move down">▼</button>
              <button onClick={()=>startEdit(idx)} style={iconBtn}>✏️</button>
              <button onClick={()=>remove(idx)} style={{...iconBtn,color:"#c06060"}}>🗑️</button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Settings Tab ──────────────────────────────────────────────────────────────
function SettingsTab({ races, setRaces, charStatuses, setCharStatuses, relationshipTypes, setRelationshipTypes, storyStatuses, setStoryStatuses, hookStatuses, setHookStatuses, setChars }) {
  const [dataPath, setDataPath] = useState(null);
  useEffect(() => {
    window.electronAPI?.getDataPath().then(p => setDataPath(p)).catch(()=>{});
  }, []);
  const [expandedRace, setExpandedRace] = useState(null);
  const [newRaceName, setNewRaceName] = useState("");
  const [editingRace, setEditingRace] = useState(null);
  const [newSubName, setNewSubName] = useState("");
  const [editingSub, setEditingSub] = useState(null);
  const addRace = () => { const n=newRaceName.trim(); if(!n) return; setRaces(prev=>[...prev,{id:uid(),name:n,subraces:[],icon:null}]); setNewRaceName(""); };
  const deleteRace = id => { setRaces(prev=>prev.filter(r=>r.id!==id)); if(expandedRace===id) setExpandedRace(null); };
  const saveRaceName = () => { if(!editingRace) return; setRaces(prev=>prev.map(r=>r.id===editingRace.id?{...r,name:editingRace.name}:r)); setEditingRace(null); };
  const addSubrace = raceId => { const n=newSubName.trim(); if(!n) return; setRaces(prev=>prev.map(r=>r.id===raceId?{...r,subraces:[...r.subraces,{id:uid(),name:n}]}:r)); setNewSubName(""); };
  const deleteSubrace = (raceId, subId) => setRaces(prev=>prev.map(r=>r.id===raceId?{...r,subraces:r.subraces.filter(s=>s.id!==subId)}:r));
  const setRaceIcon = (raceId, icon) => setRaces(prev=>prev.map(r=>r.id===raceId?{...r,icon}:r));
  const saveSubName = () => { if(!editingSub) return; setRaces(prev=>prev.map(r=>r.id===editingSub.raceId?{...r,subraces:r.subraces.map(s=>s.id===editingSub.id?{...s,name:editingSub.name}:s)}:r)); setEditingSub(null); };
  return (
    <div>
      <h1 style={{ fontFamily:"Georgia,serif", color:"#e8d5b7", margin:"0 0 6px", fontSize:26 }}>Settings</h1>
      <p style={{ color:"#5a4a7a", fontSize:13, margin:"0 0 28px" }}>Manage world data used across the app.</p>

      <h2 style={{ fontFamily:"Georgia,serif", color:"#c8a96e", fontSize:18, margin:"0 0 14px" }}>📊 Data</h2>
      <div style={{ display:"flex", gap:20, marginBottom:28 }}>
        <div style={{ flex:1, background:"#13101f", border:"1px solid #2a1f3d", borderRadius:12, overflow:"hidden" }}>
          <div style={{ padding:"14px 24px", borderBottom:"1px solid #2a1f3d" }}>
            <div style={{ color:"#c8a96e", fontFamily:"Georgia,serif", fontSize:15, fontWeight:700 }}>💀 Character Statuses</div>
            <div style={{ color:"#5a4a7a", fontSize:12, marginTop:2 }}>{charStatuses.length} statuses</div>
          </div>
          <SimpleListEditor items={charStatuses} onChange={setCharStatuses} placeholder="New status (e.g. Exiled)…"
            onRename={(old,n)=>setChars(prev=>prev.map(c=>c.status===old?{...c,status:n}:c))}/>
        </div>
        <div style={{ flex:1, background:"#13101f", border:"1px solid #2a1f3d", borderRadius:12, overflow:"hidden" }}>
          <div style={{ padding:"14px 24px", borderBottom:"1px solid #2a1f3d" }}>
            <div style={{ color:"#c8a96e", fontFamily:"Georgia,serif", fontSize:15, fontWeight:700 }}>🔗 Relationship Types</div>
            <div style={{ color:"#5a4a7a", fontSize:12, marginTop:2 }}>{relationshipTypes.length} types</div>
          </div>
          <SimpleListEditor items={relationshipTypes} onChange={setRelationshipTypes} placeholder="New type (e.g. Mentor)…"
            onRename={(old,n)=>setChars(prev=>prev.map(c=>({...c,relationships:(c.relationships||[]).map(r=>r.type===old?{...r,type:n}:r)})))}/>
        </div>
      </div>

      <div style={{ display:"flex", gap:20, marginBottom:28 }}>
        <div style={{ flex:1, background:"#13101f", border:"1px solid #2a1f3d", borderRadius:12, overflow:"hidden" }}>
          <div style={{ padding:"14px 24px", borderBottom:"1px solid #2a1f3d" }}>
            <div style={{ color:"#c8a96e", fontFamily:"Georgia,serif", fontSize:15, fontWeight:700 }}>📜 Story Statuses</div>
            <div style={{ color:"#5a4a7a", fontSize:12, marginTop:2 }}>{storyStatuses.length} statuses</div>
          </div>
          <SimpleListEditor items={storyStatuses} onChange={setStoryStatuses} placeholder="New status…"/>
        </div>
        <div style={{ flex:1, background:"#13101f", border:"1px solid #2a1f3d", borderRadius:12, overflow:"hidden" }}>
          <div style={{ padding:"14px 24px", borderBottom:"1px solid #2a1f3d" }}>
            <div style={{ color:"#c8a96e", fontFamily:"Georgia,serif", fontSize:15, fontWeight:700 }}>🔮 Hook Statuses</div>
            <div style={{ color:"#5a4a7a", fontSize:12, marginTop:2 }}>{hookStatuses.length} statuses</div>
          </div>
          <SimpleListEditor items={hookStatuses} onChange={setHookStatuses} placeholder="New status…"/>
        </div>
      </div>

      <h2 style={{ fontFamily:"Georgia,serif", color:"#c8a96e", fontSize:18, margin:"0 0 14px" }}>🧬 Races</h2>
      <div style={{ background:"#13101f", border:"1px solid #2a1f3d", borderRadius:12, overflow:"hidden", marginBottom:28 }}>
        <div style={{ padding:"16px 24px", borderBottom:"1px solid #2a1f3d" }}>
          <div style={{ color:"#c8a96e", fontFamily:"Georgia,serif", fontSize:17, fontWeight:700 }}>🧬 Races & Subraces</div>
          <div style={{ color:"#5a4a7a", fontSize:12, marginTop:2 }}>{races.length} races configured</div>
        </div>
        <div style={{ padding:"14px 24px", borderBottom:"1px solid #1e1630", display:"flex", gap:8 }}>
          <input placeholder="New race name…" value={newRaceName} onChange={e=>setNewRaceName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addRace()} style={{...inputStyle,flex:1}}/>
          <button onClick={addRace} style={btnPrimary}>+ Add Race</button>
        </div>
        {races.map(race=>(
          <div key={race.id} style={{ borderBottom:"1px solid #1e1630" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 24px", cursor:"pointer", background:expandedRace===race.id?"#1a1228":"transparent" }} onClick={()=>setExpandedRace(prev=>prev===race.id?null:race.id)}>
              <span style={{ color:"#7c5cbf", fontSize:12 }}>{expandedRace===race.id?"▼":"▶"}</span>
              {/* Race icon */}
              <div style={{ width:26, height:26, borderRadius:4, overflow:"hidden", flexShrink:0, border:"1px solid #3a2a5a", background:"#0d0b14", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }} onClick={e=>e.stopPropagation()}>
                {race.icon ? <img src={race.icon} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : <span>🧬</span>}
              </div>
              {editingRace?.id===race.id
                ? <input value={editingRace.name} onChange={e=>setEditingRace(v=>({...v,name:e.target.value}))} onKeyDown={e=>{ if(e.key==="Enter") saveRaceName(); if(e.key==="Escape") setEditingRace(null); }} onClick={e=>e.stopPropagation()} style={{...inputStyle,flex:1,fontSize:14}} autoFocus/>
                : <span style={{ flex:1, color:"#e8d5b7", fontSize:14, fontWeight:600 }}>{race.name}</span>}
              <span style={{ fontSize:11, color:"#5a4a7a" }}>{race.subraces.length} subrace{race.subraces.length!==1?"s":""}</span>
              <div style={{ display:"flex", gap:4 }} onClick={e=>e.stopPropagation()}>
                {/* Icon upload */}
                <label title={race.icon?"Replace icon":"Upload icon"} style={{...iconBtn, cursor:"pointer", display:"flex", alignItems:"center"}}>
                  🖼️
                  <input type="file" accept="image/*" style={{ display:"none" }} onChange={e=>{ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=ev=>setRaceIcon(race.id, ev.target.result); r.readAsDataURL(f); }}/>
                </label>
                {race.icon && <button onClick={()=>setRaceIcon(race.id,null)} title="Remove icon" style={{...iconBtn,color:"#c06060",fontSize:12}}>✕</button>}
                {editingRace?.id===race.id
                  ? <button onClick={saveRaceName} style={{...btnPrimary,fontSize:12,padding:"4px 10px"}}>Save</button>
                  : <button onClick={()=>setEditingRace({id:race.id,name:race.name})} style={iconBtn}>✏️</button>}
                <button onClick={()=>deleteRace(race.id)} style={{...iconBtn,color:"#c06060"}}>🗑️</button>
              </div>
            </div>
            {expandedRace===race.id&&(
              <div style={{ background:"#0d0b14", padding:"12px 24px 16px 48px" }}>
                {race.subraces.length===0&&<div style={{ color:"#5a4a7a", fontSize:13, marginBottom:10 }}>No subraces yet.</div>}
                {race.subraces.map(sub=>(
                  <div key={sub.id} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                    <span style={{ color:"#3a2a5a", fontSize:12 }}>└</span>
                    {editingSub?.id===sub.id
                      ? <input value={editingSub.name} onChange={e=>setEditingSub(v=>({...v,name:e.target.value}))} onKeyDown={e=>{ if(e.key==="Enter") saveSubName(); if(e.key==="Escape") setEditingSub(null); }} style={{...inputStyle,flex:1,fontSize:13}} autoFocus/>
                      : <span style={{ flex:1, color:"#c8b89a", fontSize:13 }}>{sub.name}</span>}
                    <div style={{ display:"flex", gap:4 }}>
                      {editingSub?.id===sub.id
                        ? <button onClick={saveSubName} style={{...btnPrimary,fontSize:11,padding:"3px 8px"}}>Save</button>
                        : <button onClick={()=>setEditingSub({raceId:race.id,id:sub.id,name:sub.name})} style={iconBtn}>✏️</button>}
                      <button onClick={()=>deleteSubrace(race.id,sub.id)} style={{...iconBtn,color:"#c06060"}}>🗑️</button>
                    </div>
                  </div>
                ))}
                <div style={{ display:"flex", gap:8, marginTop:10 }}>
                  <input placeholder={`Add subrace for ${race.name}…`} value={newSubName} onChange={e=>setNewSubName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addSubrace(race.id)} style={{...inputStyle,flex:1,fontSize:13}}/>
                  <button onClick={()=>addSubrace(race.id)} style={{...btnPrimary,fontSize:12,padding:"6px 12px"}}>+ Add</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {window.electronAPI&&(
        <div style={{ marginTop:28, background:"#13101f", border:"1px solid #2a1f3d", borderRadius:12, padding:"18px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
          <div>
            <div style={{ color:"#c8a96e", fontFamily:"Georgia,serif", fontSize:17, fontWeight:700, marginBottom:4 }}>📁 Data Storage</div>
            {dataPath&&<div style={{ fontSize:12, color:"#5a4a7a", fontFamily:"monospace", wordBreak:"break-all" }}>{dataPath}</div>}
          </div>
          <button onClick={()=>window.electronAPI.openDataFolder()} style={{...btnSecondary, flexShrink:0, fontSize:13, padding:"8px 18px"}}>Open Folder ↗</button>
        </div>
      )}
    </div>
  );
}

// ── Constants (outside component — never re-created) ─────────────────────────
const TABS = [
  {id:"characters",label:"👥 Characters"},{id:"stories",label:"📜 Stories"},
  {id:"factions",label:"⚑ Factions"},{id:"items",label:"⚗️ Items"},
  {id:"timeline",label:"⏳ Timeline"},{id:"locations",label:"📍 Locations"},
  {id:"map",label:"🗺️ Map"},{id:"lore",label:"🏛️ Lore"},{id:"notes",label:"📝 Notes"},{id:"gallery",label:"🖼️ Gallery"},
];
const ALL_TABS = [...TABS, {id:"settings",label:"⚙️ Settings"}];

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const { showToast } = useToastContext();
  const [chars,             setChars,             charsRef]          = useStateWithRef([]);
  const [stories,           setStories,           storiesRef]        = useStateWithRef([]);
  const [races,             setRaces,             racesRef]          = useStateWithRef(DEFAULT_RACES);
  const [charStatuses,      setCharStatuses,      charStatusesRef]   = useStateWithRef(DEFAULT_CHAR_STATUSES);
  const [relationshipTypes, setRelationshipTypes, relTypesRef]       = useStateWithRef(DEFAULT_RELATIONSHIP_TYPES);
  const [storyStatuses,     setStoryStatuses,     storyStatusesRef]  = useStateWithRef(DEFAULT_STORY_STATUSES);
  const [hookStatuses,      setHookStatuses,      hookStatusesRef]   = useStateWithRef(DEFAULT_HOOK_STATUSES);
  const [factions,          setFactions,          factionsRef]       = useStateWithRef([]);
  const [locations,         setLocations,         locationsRef]      = useStateWithRef([]);
  const [notes,             setNotes,             notesRef]          = useStateWithRef({ scratch:"", sessions:[], pins:[], playerPins:{} });
  const [loreEvents,        setLoreEvents,        loreEventsRef]     = useStateWithRef([]);
  const [relations,         setRelations,         relationsRef]      = useStateWithRef({ nodes:[], edges:[] });
  const [artifacts,         setArtifacts,         artifactsRef]      = useStateWithRef([]);
  const [mapData,           setMapData,           mapDataRef]        = useStateWithRef({ maps: [] });
  const [galleryCallback, setGalleryCallback] = useState(null);
  const openGallery = useCallback(cb => setGalleryCallback(() => cb), []);
  const galleryImages = useMemo(() => {
    const imgs = [];
    chars.forEach(c => {
      if (c.image) imgs.push({ src: c.image, label: c.name, type: "Character" });
      (c.items||[]).forEach(it => { if (it.image) imgs.push({ src: it.image, label: it.name, type: "Item" }); });
    });
    artifacts.forEach(a => { if (a.image) imgs.push({ src: a.image, label: a.name, type: "Artifact" }); });
    stories.forEach(s => {
      if (s.image) imgs.push({ src: s.image, label: s.name, type: "Story" });
      (s.items||[]).forEach(it => { if (it.image) imgs.push({ src: it.image, label: it.name, type: "Item" }); });
      (s.events||[]).forEach(ev => { if (ev.image) imgs.push({ src: ev.image, label: ev.title||"Event", type: "Event" }); });
    });
    loreEvents.forEach(ev => { if (ev.image) imgs.push({ src: ev.image, label: ev.title||"Lore Event", type: "Lore" }); });
    const seen = new Set();
    return imgs.filter(i => { if (seen.has(i.src)) return false; seen.add(i.src); return true; });
  }, [chars, artifacts, stories, loreEvents]);
  const [galleryEntries, setGalleryEntries, galleryEntriesRef] = useStateWithRef([]);
  const [charModal, setCharModal] = useState(null);
  const [locationModal, setLocationModal] = useState(null);
  const DEFAULT_PAGE = {
    tab: "characters",
    selectedCharId: null, selectedStoryId: null, selectedFactionId: null, selectedLocationId: null,
    charSubTab: "details", storySubTab: "details",
    charEditing: false, storyEditing: false, factionEditing: false, locationEditing: false,
    prevTab: null, itemNavId: null, storyHighlightEventId: null, mapNavTarget: null,
    query: "", storyQuery: "", storyStatusFilter: "", locationQuery: "", locationTypeFilter: "",
    collapsedLocTypes: {}, filters: defaultFilters, mainCollapsed: false, sideCollapsed: false,
  };
  const [pages, setPages] = useState(() => [{ id: "tab-1", ...DEFAULT_PAGE }]);
  const [activePageId, setActivePageId] = useState("tab-1");
  const pg = pages.find(p => p.id === activePageId) || pages[0];
  // Stable updaters — only change when activePageId changes, not on every render
  const updPg = useCallback(
    updates => setPages(ps => ps.map(p => p.id === activePageId ? {...p, ...updates} : p)),
    [activePageId]
  );
  // Functional form — receives current page and returns partial update (no stale closure over tab)
  const updPgFn = useCallback(
    fn => setPages(ps => ps.map(p => p.id === activePageId ? {...p, ...fn(p)} : p)),
    [activePageId]
  );

  // Derived from active page — keeps existing render code working
  // tab is still needed for sidebar nav highlighting and the keydown handler
  const tab = pg.tab;

  const addPage = useCallback((initialStateOrTab = {}) => {
    const newId = uid();
    const extra = typeof initialStateOrTab === "string"
      ? { tab: initialStateOrTab }
      : initialStateOrTab;
    setPages(prev => [...prev, { id: newId, ...DEFAULT_PAGE, ...extra }]);
    setActivePageId(newId);
  }, []); // eslint-disable-line
  const closePage = useCallback(pageId => {
    setPages(prev => {
      if (prev.length === 1) return prev;
      const idx = prev.findIndex(p => p.id === pageId);
      const next = prev.filter(p => p.id !== pageId);
      setActivePageId(aid => aid === pageId ? next[Math.min(idx, next.length-1)].id : aid);
      return next;
    });
  }, []);

  const [loaded, setLoaded] = useState(false);
  const [mapPicker, setMapPicker] = useState(null); // { location, maps: [{map, pin}] }
  const [confirm, setConfirm] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [activeCampaignId, setActiveCampaignId] = useState(null);
  const [campaignManagerOpen, setCampaignManagerOpen] = useState(false);

  const askConfirm = useCallback((message, onConfirm) => setConfirm({message, onConfirm}), []);
  const closeConfirm = useCallback(() => setConfirm(null), []);

  const navigateTo = useCallback(newTab => {
    updPgFn(p => ({ tab: newTab, prevTab: p.tab, ...(newTab !== "map" ? { mapNavTarget: null } : {}) }));
  }, [updPgFn]);

  // ── Undo history ────────────────────────────────────────────────────────────
  const historyRef = useRef([]);
  const MAX_HISTORY = 50;
  const [historyLen, setHistoryLen] = useState(0);

  const pushHistory = useCallback(() => {
    const snap = {
      chars: charsRef.current, stories: storiesRef.current,
      factions: factionsRef.current, locations: locationsRef.current,
      artifacts: artifactsRef.current, loreEvents: loreEventsRef.current,
      relations: relationsRef.current, races: racesRef.current,
      charStatuses: charStatusesRef.current, relationshipTypes: relTypesRef.current,
      storyStatuses: storyStatusesRef.current, hookStatuses: hookStatusesRef.current,
      mapData: mapDataRef.current, notes: notesRef.current,
    };
    historyRef.current = [...historyRef.current.slice(-MAX_HISTORY + 1), snap];
    setHistoryLen(historyRef.current.length);
  }, []);

  const undo = useCallback(() => {
    if (historyRef.current.length === 0) return;
    const snap = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    setHistoryLen(historyRef.current.length);
    setChars(snap.chars); setStories(snap.stories); setFactions(snap.factions);
    setLocations(snap.locations); setArtifacts(snap.artifacts); setLoreEvents(snap.loreEvents);
    setRelations(snap.relations); setRaces(snap.races);
    setCharStatuses(snap.charStatuses); setRelationshipTypes(snap.relationshipTypes);
    if (snap.storyStatuses !== undefined) setStoryStatuses(snap.storyStatuses);
    if (snap.hookStatuses !== undefined) setHookStatuses(snap.hookStatuses);
    if (snap.mapData !== undefined) setMapData(snap.mapData);
    if (snap.notes !== undefined) setNotes(snap.notes);
    showToast("Undone", "undo");
  }, [showToast]);

  useEffect(() => {
    const handler = e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey && !e.target.closest('input, textarea, [contenteditable]')) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo]);

  useEffect(() => {
    const handler = e => {
      const inInput = e.target.closest('input, textarea, select, [contenteditable]');

      // Escape — close in priority order
      if (e.key === 'Escape') {
        if (searchOpen)    { setSearchOpen(false); return; }
        if (locationModal) { setLocationModal(null); return; }
        if (confirm)       { closeConfirm(); return; }
        updPg({ selectedCharId: null, selectedStoryId: null, selectedFactionId: null, selectedLocationId: null });
        return;
      }

      // N — new item on current tab (skip if typing or a modal is open)
      if (e.key === 'n' && !inInput && !locationModal && !searchOpen) {
        e.preventDefault();
        if (tab === 'characters') openCharModal('main');
        else if (tab === 'stories')   openStoryModal();
        else if (tab === 'factions')  openFactionModal();
        else if (tab === 'locations') setLocationModal({...defaultLocation});
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [tab, searchOpen, locationModal, confirm, closeConfirm]); // eslint-disable-line

  // ── Load campaign blob into state ────────────────────────────────────────────
  const applyBlob = useCallback(blob => {
    const migrateChar = c => {
      let r = {...c};
      if (r.factionIds && !r.factions) r = {...r, factions: r.factionIds.map(fid => ({id:uid(), factionId:fid, role:""}))};
      if (r.linkedCharacterIds && !r.relationships) r = {...r, relationships: r.linkedCharacterIds.map(cid => ({id:uid(), charId:cid, type:"Neutral"}))};
      return r;
    };
    const lc   = (blob.chars||[]).map(migrateChar);
    const ls   = blob.stories||[];
    const lr   = blob.races||DEFAULT_RACES;
    const lf   = blob.factions||[];
    const lloc = blob.locations||[];
    const lcs  = (blob.charStatuses||DEFAULT_CHAR_STATUSES).map(x=>typeof x==="string"?{name:x,color:CHAR_STATUS_COLORS[x]||"#4a4a6a"}:x);
    const lrt  = (blob.relationshipTypes||DEFAULT_RELATIONSHIP_TYPES).map(x=>typeof x==="string"?{name:x,color:RELATIONSHIP_COLORS[x]||"#3a4a6a"}:x);
    const lss  = blob.storyStatuses || DEFAULT_STORY_STATUSES;
    const lhs  = blob.hookStatuses || DEFAULT_HOOK_STATUSES;
    setChars(lc); setStories(ls); setRaces(lr); setFactions(lf); setLocations(lloc);
    setNotes(blob.notes||{scratch:"",sessions:[],pins:[],playerPins:{}});
    setLoreEvents(blob.loreEvents||[]); setRelations(blob.relations||{nodes:[],edges:[]}); setArtifacts(blob.artifacts||[]);
    setGalleryEntries(blob.galleryEntries||[]);
    setCharStatuses(lcs); setRelationshipTypes(lrt); setStoryStatuses(lss); setHookStatuses(lhs);
    {
      let md = blob.mapData || { maps: [] };
      // Migrate legacy format {image, pins} → {maps:[...]}
      if (md.image !== undefined && !md.maps) {
        md = { maps: md.image ? [{ id: uid(), name: "World Map", image: md.image, pins: md.pins || [] }] : [] };
      }
      setMapData(md);
    }
    const nav = blob.nav||{};
    setPages(prev => prev.map(p => p.id === activePageId ? {
      ...p,
      tab: nav.tab||"characters", prevTab: nav.prevTab||null,
      selectedCharId: nav.selectedCharId||null,
      selectedStoryId: nav.selectedStoryId||null,
      selectedFactionId: nav.selectedFactionId||null,
      selectedLocationId: nav.selectedLocationId||null,
    } : p));
  }, []); // eslint-disable-line

  // ── Initial load ─────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      // Load campaign registry
      let cList = [];
      try { const v = await store.get("fwb_campaigns"); if(v) cList = JSON.parse(v); } catch {}
      let activeId = null;
      try { const v = await store.get("fwb_active_campaign"); if(v) activeId = v; } catch {}
      if (activeId && !cList.find(c => c.id === activeId)) activeId = null;

      // Migration: if no campaigns yet, check for legacy flat keys
      if (cList.length === 0) {
        const legacyChars = await store.get("fwb_characters").catch(() => null);
        if (legacyChars) {
          const id = uid();
          const campaign = { id, name: "My World", createdAt: Date.now() };
          cList = [campaign]; activeId = id;
          let lc=[],ls=[],lr=DEFAULT_RACES,lf=[],lloc=[];
          let lnotes={scratch:"",sessions:[],pins:[],playerPins:{}}, llore=[], lrels={nodes:[],edges:[]}, lart=[];
          let lcs=DEFAULT_CHAR_STATUSES, lrt=DEFAULT_RELATIONSHIP_TYPES, lnav={};
          try{ lc=JSON.parse(legacyChars).map(c=>{ let r={...c}; if(r.factionIds&&!r.factions) r={...r,factions:r.factionIds.map(fid=>({id:uid(),factionId:fid,role:""}))}; if(r.linkedCharacterIds&&!r.relationships) r={...r,relationships:r.linkedCharacterIds.map(cid=>({id:uid(),charId:cid,type:"Neutral"}))}; return r; }); }catch{}
          try{ const v=await store.get("fwb_stories"); if(v) ls=JSON.parse(v); }catch{}
          try{ const v=await store.get("fwb_races"); if(v) lr=JSON.parse(v); }catch{}
          try{ const v=await store.get("fwb_factions"); if(v) lf=JSON.parse(v); }catch{}
          try{ const v=await store.get("fwb_locations"); if(v) lloc=JSON.parse(v); }catch{}
          try{ const v=await store.get("fwb_notes"); if(v) lnotes=JSON.parse(v); }catch{}
          try{ const v=await store.get("fwb_lore"); if(v) llore=JSON.parse(v); }catch{}
          try{ const v=await store.get("fwb_relations"); if(v) lrels=JSON.parse(v); }catch{}
          try{ const v=await store.get("fwb_artifacts"); if(v) lart=JSON.parse(v); }catch{}
          try{ const v=await store.get("fwb_char_statuses"); if(v){ const p=JSON.parse(v); lcs=p.map(x=>typeof x==="string"?{name:x,color:CHAR_STATUS_COLORS[x]||"#4a4a6a"}:x); } }catch{}
          try{ const v=await store.get("fwb_rel_types"); if(v){ const p=JSON.parse(v); lrt=p.map(x=>typeof x==="string"?{name:x,color:RELATIONSHIP_COLORS[x]||"#3a4a6a"}:x); } }catch{}
          try{ const v=await store.get("fwb_nav"); if(v) lnav=JSON.parse(v); }catch{}
          const blob = { chars:lc, stories:ls, races:lr, factions:lf, locations:lloc, notes:lnotes, loreEvents:llore, relations:lrels, artifacts:lart, charStatuses:lcs, relationshipTypes:lrt, nav:lnav };
          await store.set(`fwb_campaign_${id}`, JSON.stringify(blob));
          await store.set("fwb_campaigns", JSON.stringify(cList));
          await store.set("fwb_active_campaign", id);
        }
      }

      setCampaigns(cList);
      if (activeId) {
        setActiveCampaignId(activeId);
        try {
          const v = await store.get(`fwb_campaign_${activeId}`);
          if (v) applyBlob(JSON.parse(v));
        } catch {}
      }
      setLoaded(true);
    })();
  }, []); // eslint-disable-line

  // ── Debounced campaign save ───────────────────────────────────────────────────
  const saveTimerRef = useRef(null);
  useEffect(() => {
    if (!loaded || !activeCampaignId) return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const blob = {
        chars, stories, races, factions, locations, notes, loreEvents, relations, artifacts, charStatuses, relationshipTypes, storyStatuses, hookStatuses, mapData, galleryEntries,
        nav: { tab: pg.tab, prevTab: pg.prevTab, selectedCharId: pg.selectedCharId||null, selectedStoryId: pg.selectedStoryId||null, selectedFactionId: pg.selectedFactionId||null, selectedLocationId: pg.selectedLocationId||null },
      };
      try { await store.set(`fwb_campaign_${activeCampaignId}`, JSON.stringify(blob)); } catch {}
    }, 500);
    return () => clearTimeout(saveTimerRef.current);
  }, [chars, stories, races, factions, locations, notes, loreEvents, relations, artifacts, charStatuses, relationshipTypes, mapData, galleryEntries, pg, loaded, activeCampaignId]); // eslint-disable-line

  const updateChar = useCallback(updated => { pushHistory(); setChars(prev => prev.map(c => c.id===updated.id ? updated : c)); }, [pushHistory]);

  const saveChar = useCallback(form => {
    pushHistory();
    const isNew = form._isNew;
    const savedId = form.id || uid();
    const {_isNew, ...cleanForm} = form;
    const savedForm = { ...cleanForm, id: savedId };
    setChars(prev => {
      const old = prev.find(c => c.id === savedId);
      const oldRels = old?.relationships || [];
      const newRels = savedForm.relationships || [];
      const added = newRels.filter(r => r.charId && !oldRels.some(o => o.charId === r.charId));
      const removed = oldRels.filter(r => r.charId && !newRels.some(n => n.charId === r.charId));
      return prev
        .map(c => c.id === savedId ? savedForm : c)
        .concat(old ? [] : [savedForm])
        .map(c => {
          const addedEntry = added.find(r => r.charId === c.id);
          if (addedEntry && !(c.relationships||[]).some(r => r.charId === savedId))
            return { ...c, relationships: [...(c.relationships||[]), { id: uid(), charId: savedId, type: addedEntry.type }] };
          if (removed.some(r => r.charId === c.id))
            return { ...c, relationships: (c.relationships||[]).filter(r => r.charId !== savedId) };
          return c;
        });
    });
    setCharModal(null);
    showToast(isNew || !form.id ? "Character added" : "Character updated");
  }, [pushHistory, showToast]);

  const deleteChar = useCallback(id => {
    const c = chars.find(x=>x.id===id);
    askConfirm(`Delete "${c?.name}"?`, () => {
      pushHistory();
      setChars(prev=>prev.filter(x=>x.id!==id).map(c=>({...c,relationships:(c.relationships||[]).filter(r=>r.charId!==id)})));
      updPgFn(p => p.selectedCharId===id ? { selectedCharId: null } : {});
      setStories(prev=>prev.map(s=>({...s,characterIds:(s.characterIds||[]).filter(x=>x!==id),events:(s.events||[]).map(e=>({...e,characterIds:(e.characterIds||[]).filter(x=>x!==id)}))})));
      closeConfirm();
      showToast("Character deleted", "error");
    });
  }, [chars, updPgFn, askConfirm, closeConfirm, pushHistory, showToast]);


  const deleteStory = useCallback(id => {
    const s = stories.find(x=>x.id===id);
    askConfirm(`Delete story "${s?.name}"?`, () => {
      pushHistory();
      setStories(prev=>prev.filter(x=>x.id!==id));
      updPgFn(p => p.selectedStoryId===id ? { selectedStoryId: null } : {});
      closeConfirm();
      showToast("Story deleted", "error");
    });
  }, [stories, updPgFn, askConfirm, closeConfirm, pushHistory, showToast]);

  const updateStory = useCallback(updated => { pushHistory(); setStories(prev=>prev.map(s=>s.id===updated.id?updated:s)); }, [pushHistory]);

  const setMainStory = useCallback(id => {
    pushHistory();
    setStories(prev=>prev.map(s=>({...s,isMain:s.id===id?!s.isMain:false})));
  }, [pushHistory]);

  const setPlayerStory = useCallback((storyId, playerId) => {
    pushHistory();
    setStories(prev=>prev.map(s=>s.id===storyId?{...s,playerId:playerId||""}:s));
  }, [pushHistory]);

  const saveFaction = useCallback(form => {
    pushHistory();
    setFactions(prev => prev.map(f => f.id === form.id ? form : f));
    showToast("Faction saved");
  }, [pushHistory, showToast]);

  const deleteFaction = useCallback(id => {
    const f = factions.find(x=>x.id===id);
    askConfirm(`Delete faction "${f?.name}"?`, () => {
      pushHistory();
      setFactions(prev=>prev.filter(x=>x.id!==id));
      updPgFn(p => p.selectedFactionId===id ? { selectedFactionId: null } : {});
      setChars(prev=>prev.map(c=>({...c,factions:(c.factions||[]).filter(e=>e.factionId!==id)})));
      closeConfirm();
      showToast("Faction deleted", "error");
    });
  }, [factions, updPgFn, askConfirm, closeConfirm, pushHistory, showToast]);

  const saveLocation = useCallback(form => {
    pushHistory();
    setLocations(prev => form.id ? prev.map(l=>l.id===form.id?form:l) : [...prev,{...form,id:uid()}]);
    setLocationModal(null);
    showToast(form.id ? "Location updated" : "Location added");
  }, [pushHistory, showToast]);

  const deleteLocation = useCallback(id => {
    const l = locations.find(x=>x.id===id);
    askConfirm(`Delete location "${l?.name}"?`, () => {
      pushHistory();
      setLocations(prev=>prev.filter(x=>x.id!==id));
      updPgFn(p => p.selectedLocationId===id ? { selectedLocationId: null } : {});
      setChars(prev=>prev.map(c=>c.locationId===id?{...c,locationId:""}:c));
      closeConfirm();
      showToast("Location deleted", "error");
    });
  }, [locations, updPgFn, askConfirm, closeConfirm, pushHistory, showToast]);

  const handleOpenStory = useCallback((story, highlightEventId = null, opts = {}) => {
    if (opts.newTab) { addPage({ tab: "stories", selectedStoryId: story.id, storyHighlightEventId: highlightEventId||null, ...(opts.storySubTab ? { storySubTab: opts.storySubTab } : {}) }); return; }
    updPgFn(p => ({ tab: "stories", prevTab: p.tab, mapNavTarget: null, selectedStoryId: story.id, storyHighlightEventId: highlightEventId||null, ...(opts.storySubTab ? { storySubTab: opts.storySubTab } : {}) }));
  }, [updPgFn, addPage]);

  const handleOpenChar = useCallback((char, opts = {}) => {
    if (opts.newTab) { addPage({ tab: "characters", selectedCharId: char.id, ...(opts.charSubTab ? { charSubTab: opts.charSubTab } : {}) }); return; }
    updPgFn(p => ({ tab: "characters", prevTab: p.tab, mapNavTarget: null, selectedCharId: char.id, ...(opts.charSubTab ? { charSubTab: opts.charSubTab } : {}) }));
  }, [updPgFn, addPage]);

  const handleShowOnMap = useCallback(location => {
    const allMaps = mapData?.maps || [];
    const matches = allMaps.flatMap(m => (m.pins||[]).filter(pin => pin.locationId === location.id).map(pin => ({ map: m, pin })));
    if (matches.length === 0) return;
    if (matches.length === 1) {
      updPgFn(p => ({ tab: "map", prevTab: p.tab, mapNavTarget: { mapId: matches[0].map.id, pin: matches[0].pin } }));
    } else {
      setMapPicker({ location, maps: matches });
    }
  }, [mapData, updPgFn]);

  const handleOpenFaction = useCallback((faction, opts = {}) => {
    if (opts.newTab) { addPage({ tab: "factions", selectedFactionId: faction.id }); return; }
    updPgFn(p => ({ tab: "factions", prevTab: p.tab, mapNavTarget: null, selectedFactionId: faction.id }));
  }, [updPgFn, addPage]);

  const handleOpenLocation = useCallback((location, opts = {}) => {
    if (opts.newTab) { addPage({ tab: "locations", selectedLocationId: location.id }); return; }
    updPgFn(p => ({ tab: "locations", prevTab: p.tab, mapNavTarget: null, selectedLocationId: location.id }));
  }, [updPgFn, addPage]);

  const handleSearchSelectArtifact = useCallback(() => {
    updPgFn(p => ({ tab: "items", prevTab: p.tab, mapNavTarget: null, selectedCharId: null, selectedStoryId: null, selectedFactionId: null, selectedLocationId: null }));
  }, [updPgFn]);

  const handleImport = useCallback((c, s, r, f, loc, art, lore, rels, nts, md) => {
    setChars(c||[]); setStories(s||[]); setRaces(r||DEFAULT_RACES); setFactions(f||[]); setLocations(loc||[]);
    setArtifacts(art||[]); setLoreEvents(lore||[]); setRelations(rels||{nodes:[],edges:[]}); setNotes(nts||{scratch:"",sessions:[],pins:[],playerPins:{}});
    setMapData(md && md.maps ? md : {maps:[]});
    setPages([{ id: "tab-1", ...DEFAULT_PAGE }]); setActivePageId("tab-1");
    showToast("World imported", "info");
  }, [showToast]);

  // Stable modal openers for tab components
  const openCharModal = useCallback(type => {
    const newId = uid();
    const newChar = {...defaultChar, type, id: newId, _isNew: true};
    pushHistory();
    setChars(prev => [...prev, newChar]);
    updPgFn(p => ({...p, tab: "characters", selectedCharId: newId, charEditing: true}));
  }, [pushHistory, updPgFn]);

  const cancelNewChar = useCallback(id => {
    setChars(prev => prev.filter(c => c.id !== id));
    updPgFn(p => ({...p, selectedCharId: null, charEditing: false}));
  }, [updPgFn]);
  const openStoryModal = useCallback(() => {
    const newId = uid();
    const newStory = {...defaultStory, id: newId, _isNew: true};
    pushHistory();
    setStories(prev => [...prev, newStory]);
    updPgFn(p => ({...p, tab: "stories", selectedStoryId: newId, storyEditing: true}));
  }, [pushHistory, updPgFn]);

  const cancelNewStory = useCallback(id => {
    setStories(prev => prev.filter(s => s.id !== id));
    updPgFn(p => ({...p, selectedStoryId: null, storyEditing: false}));
  }, [updPgFn]);
  const openFactionModal = useCallback(() => {
    const newId = uid();
    const newFaction = {...defaultFaction, id: newId, _isNew: true};
    pushHistory();
    setFactions(prev => [...prev, newFaction]);
    updPgFn(p => ({...p, tab: "factions", selectedFactionId: newId, factionEditing: true}));
  }, [pushHistory, updPgFn]);

  const cancelNewFaction = useCallback(id => {
    setFactions(prev => prev.filter(f => f.id !== id));
    updPgFn(p => ({...p, selectedFactionId: null, factionEditing: false}));
  }, [updPgFn]);
  const openLocationModal = useCallback(() => setLocationModal({...defaultLocation}), []);

  // Navigate to items tab from story detail (uses updPgFn to avoid stale tab closure)
  const handleOpenArtifactInStory = useCallback(a => {
    updPgFn(p => ({ itemNavId: a.id, tab: "items", prevTab: p.tab, mapNavTarget: null }));
  }, [updPgFn]);

  // Wrapped setters — push history before any child-initiated mutation
  const updateArtifacts = useCallback(u => { pushHistory(); setArtifacts(u); }, [pushHistory]);
  const updateRelations = useCallback(u => { pushHistory(); setRelations(u); }, [pushHistory]);
  const updateLoreEvents = useCallback(u => { pushHistory(); setLoreEvents(u); }, [pushHistory]);
  const updateRaces = useCallback(u => { pushHistory(); setRaces(u); }, [pushHistory]);
  const updateCharStatuses = useCallback(u => { pushHistory(); setCharStatuses(u); }, [pushHistory]);
  const updateRelationshipTypes = useCallback(u => { pushHistory(); setRelationshipTypes(u); }, [pushHistory]);
  const updateStoryStatuses = useCallback(u => { pushHistory(); setStoryStatuses(u); }, [pushHistory]);
  const updateHookStatuses = useCallback(u => { pushHistory(); setHookStatuses(u); }, [pushHistory]);
  const updateCharsFromSettings = useCallback(u => { pushHistory(); setChars(u); }, [pushHistory]);
  const updateMapData = useCallback(u => { pushHistory(); setMapData(u); }, [pushHistory]);

  // ── Campaign management ───────────────────────────────────────────────────────
  const resetWorldState = useCallback(() => {
    setChars([]); setStories([]); setRaces(DEFAULT_RACES); setFactions([]); setLocations([]);
    setNotes({scratch:"",sessions:[],pins:[],playerPins:{}}); setLoreEvents([]); setRelations({nodes:[],edges:[]}); setArtifacts([]);
    setCharStatuses(DEFAULT_CHAR_STATUSES); setRelationshipTypes(DEFAULT_RELATIONSHIP_TYPES);
    setMapData({maps:[]});
    setPages([{ id: "tab-1", ...DEFAULT_PAGE }]); setActivePageId("tab-1");
    historyRef.current = []; setHistoryLen(0);
  }, []);

  const saveCampaignNow = useCallback(async (campaignId) => {
    const blob = {
      chars: charsRef.current, stories: storiesRef.current, races: racesRef.current,
      factions: factionsRef.current, locations: locationsRef.current, notes: notesRef.current,
      loreEvents: loreEventsRef.current, relations: relationsRef.current, artifacts: artifactsRef.current,
      charStatuses: charStatusesRef.current, relationshipTypes: relTypesRef.current, mapData: mapDataRef.current,
      galleryEntries: galleryEntriesRef.current,
      nav: { tab: pg.tab, prevTab: pg.prevTab, selectedCharId: pg.selectedCharId||null, selectedStoryId: pg.selectedStoryId||null, selectedFactionId: pg.selectedFactionId||null, selectedLocationId: pg.selectedLocationId||null },
    };
    try { await store.set(`fwb_campaign_${campaignId}`, JSON.stringify(blob)); } catch {}
  }, [pg]);

  const switchCampaign = useCallback(async campaign => {
    clearTimeout(saveTimerRef.current);
    if (activeCampaignId) await saveCampaignNow(activeCampaignId);
    resetWorldState();
    setActiveCampaignId(campaign.id);
    await store.set("fwb_active_campaign", campaign.id);
    try {
      const v = await store.get(`fwb_campaign_${campaign.id}`);
      if (v) applyBlob(JSON.parse(v));
    } catch {}
    setCampaignManagerOpen(false);
  }, [activeCampaignId, saveCampaignNow, resetWorldState, applyBlob]);

  const createCampaign = useCallback(async name => {
    clearTimeout(saveTimerRef.current);
    if (activeCampaignId) await saveCampaignNow(activeCampaignId);
    const id = uid();
    const campaign = { id, name: name.trim()||"New Campaign", createdAt: Date.now() };
    const updated = [...campaigns, campaign];
    setCampaigns(updated);
    await store.set("fwb_campaigns", JSON.stringify(updated));
    resetWorldState();
    setActiveCampaignId(id);
    await store.set("fwb_active_campaign", id);
    const emptyBlob = { chars:[], stories:[], races:DEFAULT_RACES, factions:[], locations:[], notes:{scratch:"",sessions:[],pins:[],playerPins:{}}, loreEvents:[], relations:{nodes:[],edges:[]}, artifacts:[], charStatuses:DEFAULT_CHAR_STATUSES, relationshipTypes:DEFAULT_RELATIONSHIP_TYPES, mapData:{maps:[]}, nav:{} };
    await store.set(`fwb_campaign_${id}`, JSON.stringify(emptyBlob));
    setCampaignManagerOpen(false);
  }, [campaigns, activeCampaignId, saveCampaignNow, resetWorldState]);

  const renameCampaign = useCallback(async (id, name) => {
    const updated = campaigns.map(c => c.id===id ? {...c, name} : c);
    setCampaigns(updated);
    await store.set("fwb_campaigns", JSON.stringify(updated));
  }, [campaigns]);

  const deleteCampaign = useCallback(async id => {
    clearTimeout(saveTimerRef.current);
    const updated = campaigns.filter(c => c.id !== id);
    setCampaigns(updated);
    await store.set("fwb_campaigns", JSON.stringify(updated));
    await store.delete(`fwb_campaign_${id}`);
    if (activeCampaignId === id) {
      resetWorldState();
      if (updated.length > 0) {
        // Switch without saving — the deleted campaign's data shouldn't be written back
        setActiveCampaignId(updated[0].id);
        await store.set("fwb_active_campaign", updated[0].id);
        try {
          const v = await store.get(`fwb_campaign_${updated[0].id}`);
          if (v) applyBlob(JSON.parse(v));
        } catch {}
      } else {
        setActiveCampaignId(null);
        await store.set("fwb_active_campaign", "");
      }
    }
  }, [campaigns, activeCampaignId, resetWorldState, applyBlob]);

  const activeCampaign = useMemo(() => campaigns.find(c => c.id === activeCampaignId), [campaigns, activeCampaignId]);

  // Pinned hooks — toggle a story hook in notes.pins
  const handlePinHook = useCallback((storyId, hookId) => {
    pushHistory();
    setNotes(n => {
      const already = (n.pins||[]).find(p => p.hookPin && p.storyId===storyId && p.hookId===hookId);
      if (already) return {...n, pins: n.pins.filter(p => p.id !== already.id)};
      return {...n, pins: [{id: uid(), hookPin: true, storyId, hookId}, ...(n.pins||[])]};
    });
  }, [setNotes, pushHistory]);

  const handleRemovePin = useCallback(id => {
    pushHistory();
    setNotes(n => ({...n, pins: n.pins.filter(p => p.id !== id)}));
  }, [setNotes, pushHistory]);
  const pinnedHookIds = useMemo(() =>
    new Set((notes.pins||[]).filter(p=>p.hookPin).map(p=>`${p.storyId}::${p.hookId}`))
  , [notes.pins]);

  const handlePinCharHook = useCallback((charId, hookId) => {
    pushHistory();
    setNotes(n => {
      const already = (n.pins||[]).find(p => p.charHookPin && p.charId===charId && p.hookId===hookId);
      if (already) return {...n, pins: n.pins.filter(p => p.id !== already.id)};
      return {...n, pins: [{id: uid(), charHookPin: true, charId, hookId}, ...(n.pins||[])]};
    });
  }, [setNotes, pushHistory]);
  const pinnedCharHookIds = useMemo(() =>
    new Set((notes.pins||[]).filter(p=>p.charHookPin).map(p=>`${p.charId}::${p.hookId}`))
  , [notes.pins]);

  // Latest timeline date across all stories — for EventModal "Insert" shortcut
  const currentTimelineDate = useMemo(() => {
    const all = stories.flatMap(s=>s.events||[]).filter(e=>e.year);
    if (!all.length) return null;
    const latest = [...all].sort((a,b)=>{
      const dy=(parseInt(b.year)||0)-(parseInt(a.year)||0); if(dy) return dy;
      const dm=(parseInt(b.month)||0)-(parseInt(a.month)||0); if(dm) return dm;
      return (parseInt(b.day)||0)-(parseInt(a.day)||0);
    })[0];
    return [latest.year,latest.month,latest.day].filter(Boolean).join(" / ");
  }, [stories]);

  // Stable per-page updater (cached by page id so memo'd children don't thrash)
  const pageUpdaterCacheRef = useRef({});
  const getPageUpdPg = (pageId) => {
    if (!pageUpdaterCacheRef.current[pageId]) {
      pageUpdaterCacheRef.current[pageId] = updates =>
        setPages(ps => ps.map(p => p.id === pageId ? {...p, ...updates} : p));
    }
    return pageUpdaterCacheRef.current[pageId];
  };

  if (!loaded) return (
    <div style={{ display:"flex", height:"100vh", alignItems:"center", justifyContent:"center", background:"#0d0b14", color:"#5a4a7a", fontSize:15, fontFamily:"Georgia,serif" }}>
      Loading…
    </div>
  );

  if (loaded && !activeCampaignId) return (
    <CampaignManager fullscreen campaigns={campaigns} activeCampaignId={activeCampaignId}
      onSelect={switchCampaign} onCreate={createCampaign} onRename={renameCampaign} onDelete={deleteCampaign}/>
  );

  return (
    <GalleryContext.Provider value={{ openGallery }}>
    <div style={{ display:"flex", height:"100vh", width:"100vw", background:"#0d0b14", color:"#e8d5b7", fontFamily:"system-ui,sans-serif" }}>
      <div style={{ width:200, background:"#110e1c", borderRight:"1px solid #2a1f3d", display:"flex", flexDirection:"column", flexShrink:0 }}>
        <div style={{ padding:"16px 16px 12px", borderBottom:"1px solid #2a1f3d" }}>
          <div style={{ fontSize:20, fontFamily:"Georgia,serif", color:"#c8a96e", lineHeight:1.2 }}>⚗️ World<br/>Builder</div>
          <div style={{ fontSize:11, color:"#4a3a6a", marginTop:3, marginBottom:8 }}>v0.5.0</div>
          <button onClick={()=>setCampaignManagerOpen(true)}
            style={{ display:"flex", alignItems:"center", gap:6, width:"100%", background:"#1a1228", border:"1px solid #3a2a5a", borderRadius:6, padding:"6px 9px", cursor:"pointer", textAlign:"left", transition:"border-color .15s" }}
            onMouseEnter={e=>e.currentTarget.style.borderColor="#7c5cbf"}
            onMouseLeave={e=>e.currentTarget.style.borderColor="#3a2a5a"}>
            <span style={{ fontSize:11 }}>🗂️</span>
            <span style={{ flex:1, fontSize:12, color:"#c8a96e", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{activeCampaign?.name||"Campaign"}</span>
            <span style={{ fontSize:10, color:"#5a4a7a" }}>▾</span>
          </button>
        </div>
        <nav style={{ padding:"12px 8px", flex:1, overflowY:"auto" }}>
          <button onClick={() => setSearchOpen(true)} style={{ display:"flex", alignItems:"center", gap:8, width:"100%", textAlign:"left", padding:"8px 12px", borderRadius:8, border:"1px solid #2a1f3d", background:"#0d0b14", color:"#4a3a6a", cursor:"pointer", marginBottom:10, fontSize:13 }}>
            <span>🔍</span><span style={{ flex:1 }}>Search…</span><kbd style={{ fontSize:10, background:"#1a1228", border:"1px solid #2a1f3d", borderRadius:3, padding:"1px 4px" }}>Ctrl K</kbd>
          </button>
          {TABS.map(t=>(
            <button key={t.id} onClick={e=>{ if(e.ctrlKey){ addPage(t.id); } else { navigateTo(t.id); } }} style={{ display:"block", width:"100%", textAlign:"left", padding:"10px 12px", borderRadius:8, border:"none", background:tab===t.id?"#7c5cbf33":"transparent", color:tab===t.id?"#e8d5b7":"#6a5a8a", cursor:"pointer", marginBottom:4, fontSize:14, fontWeight:tab===t.id?700:400, borderLeft:tab===t.id?"3px solid #7c5cbf":"3px solid transparent" }}>
              {t.label}
            </button>
          ))}
          <div style={{ borderTop:"1px solid #2a1f3d", marginTop:8, paddingTop:8 }}>
            <button onClick={e=>{ if(e.ctrlKey){ addPage("settings"); } else { navigateTo("settings"); } }} style={{ display:"block", width:"100%", textAlign:"left", padding:"10px 12px", borderRadius:8, border:"none", background:tab==="settings"?"#7c5cbf33":"transparent", color:tab==="settings"?"#e8d5b7":"#6a5a8a", cursor:"pointer", fontSize:14, fontWeight:tab==="settings"?700:400, borderLeft:tab==="settings"?"3px solid #7c5cbf":"3px solid transparent" }}>
              ⚙️ Settings
            </button>
          </div>
        </nav>
        <div style={{ padding:"8px 12px", borderTop:"1px solid #2a1f3d", display:"flex", flexDirection:"column", gap:6 }}>
          <button onClick={()=>setHelpOpen(true)} title="Keyboard shortcuts & help"
            style={{ display:"flex", alignItems:"center", gap:6, width:"100%", background:"transparent", border:"1px solid #3a2a5a", borderRadius:6, padding:"7px 10px", color:"#9a7fa0", cursor:"pointer", fontSize:13, transition:"color .15s, border-color .15s" }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor="#7c5cbf"; e.currentTarget.style.color="#e8d5b7"; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor="#3a2a5a"; e.currentTarget.style.color="#9a7fa0"; }}>
            ? <span>Help & Shortcuts</span>
          </button>
          <button onClick={undo} disabled={historyLen===0} title="Undo (Ctrl+Z)"
            style={{ display:"flex", alignItems:"center", gap:6, width:"100%", background:"transparent", border:"1px solid #3a2a5a", borderRadius:6, padding:"7px 10px", color:historyLen===0?"#3a2a5a":"#9a7fa0", cursor:historyLen===0?"default":"pointer", fontSize:13, transition:"color .15s, border-color .15s" }}
            onMouseEnter={e=>{ if(historyLen>0){ e.currentTarget.style.borderColor="#7c5cbf"; e.currentTarget.style.color="#e8d5b7"; }}}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor="#3a2a5a"; e.currentTarget.style.color=historyLen===0?"#3a2a5a":"#9a7fa0"; }}>
            ↩ <span>Undo{historyLen>0?` (${historyLen})`:""}</span>
          </button>
        </div>
        <SaveLoadBar chars={chars} stories={stories} races={races} factions={factions} locations={locations} artifacts={artifacts} loreEvents={loreEvents} relations={relations} notes={notes} mapData={mapData} onImport={handleImport} showToast={showToast}/>
      </div>

      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>
        {/* Browser tab bar */}
        <div style={{ display:"flex", alignItems:"center", background:"#110e1c", borderBottom:"1px solid #2a1f3d", padding:"0 8px", gap:2, flexShrink:0, minHeight:36 }}>
          {pages.map(p => {
            const isActive = p.id === activePageId;
            const title = (() => {
              if (p.tab==="characters"&&p.selectedCharId) return chars.find(c=>c.id===p.selectedCharId)?.name||"Characters";
              if (p.tab==="stories"&&p.selectedStoryId) return stories.find(s=>s.id===p.selectedStoryId)?.name||"Stories";
              if (p.tab==="factions"&&p.selectedFactionId) return factions.find(f=>f.id===p.selectedFactionId)?.name||"Factions";
              if (p.tab==="locations"&&p.selectedLocationId) return locations.find(l=>l.id===p.selectedLocationId)?.name||"Locations";
              return ALL_TABS.find(t=>t.id===p.tab)?.label || p.tab;
            })();
            return (
              <div key={p.id} onClick={()=>setActivePageId(p.id)}
                style={{ display:"flex", alignItems:"center", gap:6, padding:"0 10px", height:34, borderRadius:"6px 6px 0 0", cursor:"pointer", background:isActive?"#1a1228":"transparent", border:isActive?"1px solid #3a2a5a":"1px solid transparent", borderBottom:isActive?"1px solid #1a1228":"none", marginBottom:isActive?-1:0, color:isActive?"#e8d5b7":"#6a5a8a", fontSize:12, whiteSpace:"nowrap", maxWidth:160, transition:"background .12s, color .12s", userSelect:"none" }}>
                <span style={{ overflow:"hidden", textOverflow:"ellipsis", maxWidth:120 }}>{title}</span>
                {pages.length > 1 && (
                  <span onClick={e=>{ e.stopPropagation(); closePage(p.id); }} style={{ fontSize:14, lineHeight:1, opacity:.5, padding:"0 2px", borderRadius:3, transition:"opacity .12s" }}
                    onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=.5}>×</span>
                )}
              </div>
            );
          })}
          <button onClick={()=>addPage()} title="New tab"
            style={{ background:"none", border:"1px solid transparent", borderRadius:4, color:"#5a4a7a", cursor:"pointer", fontSize:14, fontWeight:700, padding:"1px 7px", lineHeight:"20px", transition:"color .12s, border-color .12s", marginLeft:2 }}
            onMouseEnter={e=>{ e.currentTarget.style.color="#c8a96e"; e.currentTarget.style.borderColor="#3a2a5a"; }} onMouseLeave={e=>{ e.currentTarget.style.color="#5a4a7a"; e.currentTarget.style.borderColor="transparent"; }}>+</button>
        </div>
        {/* Each browser page tab gets its own independent component tree */}
        {pages.map(p => {
          const pageUpdPg = getPageUpdPg(p.id);

          // Per-page char filtering
          const pq = p.query.toLowerCase();
          const filterPageChars = list => list.filter(c => {
            const raceLabel = getRaceLabel(races,c.raceId,c.subraceId).toLowerCase();
            const locationLabel = locations.find(l=>l.id===c.locationId)?.name?.toLowerCase()||"";
            const factionLabels = factions.filter(f=>(c.factions||[]).some(e=>e.factionId===f.id)).map(f=>f.name.toLowerCase()).join(" ");
            const matchQ = !pq||["name","shortDescription","description","secret","origin","class"].some(k=>c[k]?.toLowerCase().includes(pq))||raceLabel.includes(pq)||locationLabel.includes(pq)||factionLabels.includes(pq);
            const pf = p.filters;
            const matchF = (!pf.raceId||c.raceId===pf.raceId)&&(!pf.locationId||c.locationId===pf.locationId)&&(!pf.status||c.status===pf.status)&&(!pf.factionId||(c.factions||[]).some(e=>e.factionId===pf.factionId));
            return matchQ && matchF;
          });
          const pAllPlayers = chars.filter(c => c.type==="player");
          const pMain = filterPageChars(chars.filter(c=>c.type==="main")).sort((a,b)=>a.name.localeCompare(b.name));
          const pSide = filterPageChars(chars.filter(c=>c.type==="side")).sort((a,b)=>a.name.localeCompare(b.name));

          // Per-page story filtering
          const sq = p.storyQuery.toLowerCase();
          const pMainStory = stories.find(s=>s.isMain)||null;
          const pPlayerStories = stories.filter(s=>s.playerId&&!s.isMain);
          const storyStatusOrder = Object.fromEntries(storyStatuses.map((s,i)=>[s.name,i]));
          const pOtherStories = stories.filter(s=>!s.isMain&&!s.playerId).filter(s=>{
            const matchText=!sq||s.name.toLowerCase().includes(sq)||(s.summary||"").toLowerCase().includes(sq);
            return matchText&&(!p.storyStatusFilter||s.status===p.storyStatusFilter);
          }).sort((a,b)=>(storyStatusOrder[a.status]??9999)-(storyStatusOrder[b.status]??9999));

          // Per-page selected entities
          const pSelectedChar     = chars.find(c=>c.id===p.selectedCharId)||null;
          const pSelectedStory    = stories.find(s=>s.id===p.selectedStoryId)||null;
          const pSelectedFaction  = factions.find(f=>f.id===p.selectedFactionId)||null;
          const pSelectedLocation = locations.find(l=>l.id===p.selectedLocationId)||null;

          return (
            <div key={p.id} style={{ display: p.id===activePageId ? "contents" : "none" }}>
              {p.prevTab&&p.prevTab!==p.tab&&(
                <div style={{ padding:"18px 32px 0", flexShrink:0 }}>
                  <button onClick={()=>pageUpdPg({ tab: p.prevTab, prevTab: null })} style={{ display:"inline-flex", alignItems:"center", gap:6, background:"transparent", border:"1px solid #3a2a5a", borderRadius:8, padding:"6px 14px", color:"#7c5cbf", cursor:"pointer", fontSize:13, fontWeight:600, transition:"border-color .15s, color .15s" }}
                    onMouseEnter={e=>{ e.currentTarget.style.borderColor="#7c5cbf"; e.currentTarget.style.color="#c8a96e"; }}
                    onMouseLeave={e=>{ e.currentTarget.style.borderColor="#3a2a5a"; e.currentTarget.style.color="#7c5cbf"; }}>
                    ← Back to {ALL_TABS.find(t=>t.id===p.prevTab)?.label||p.prevTab}
                  </button>
                </div>
              )}
              <div style={{ display: p.tab==="characters" ? "contents" : "none" }}>
                <CharactersTabContent
                  chars={chars} races={races} factions={factions} locations={locations}
                  stories={stories} loreEvents={loreEvents} artifacts={artifacts}
                  charStatuses={charStatuses} storyStatuses={storyStatuses}
                  hookStatuses={hookStatuses} relationshipTypes={relationshipTypes}
                  allPlayers={pAllPlayers} main={pMain} side={pSide}
                  query={p.query} filters={p.filters}
                  selectedChar={pSelectedChar} selectedCharId={p.selectedCharId}
                  charSubTab={p.charSubTab} mainCollapsed={p.mainCollapsed} sideCollapsed={p.sideCollapsed}
                  updPg={pageUpdPg}
                  onNewChar={openCharModal} onDeleteChar={deleteChar} onCancelNew={cancelNewChar}
                  onOpenStory={handleOpenStory} onOpenFaction={handleOpenFaction} onOpenChar={handleOpenChar} onOpenArtifact={handleOpenArtifactInStory}
                  onSaveChar={saveChar} onSaveFaction={saveFaction} onUpdateArtifacts={updateArtifacts}
                  onPinCharHook={handlePinCharHook} pinnedCharHookIds={pinnedCharHookIds}/>
              </div>
              <div style={{ display: p.tab==="stories" ? "contents" : "none" }}>
                <StoriesTabContent
                  stories={stories} chars={chars} factions={factions} locations={locations} artifacts={artifacts}
                  storyStatuses={storyStatuses} hookStatuses={hookStatuses}
                  storyQuery={p.storyQuery} storyStatusFilter={p.storyStatusFilter}
                  selectedStory={pSelectedStory} selectedStoryId={p.selectedStoryId}
                  storySubTab={p.storySubTab} storyHighlightEventId={p.storyHighlightEventId}
                  mainStory={pMainStory} playerStories={pPlayerStories} otherStories={pOtherStories}
                  currentTimelineDate={currentTimelineDate}
                  updPg={pageUpdPg}
                  onNewStory={openStoryModal} onDeleteStory={deleteStory} onCancelNew={cancelNewStory}
                  onSetMain={setMainStory} onSetPlayerStory={setPlayerStory} onUpdateStory={updateStory}
                  onOpenChar={handleOpenChar} onOpenFaction={handleOpenFaction} onOpenLocation={handleOpenLocation}
                  onOpenArtifact={handleOpenArtifactInStory} onUpdateArtifacts={updateArtifacts}
                  onAskConfirm={askConfirm} onCloseConfirm={closeConfirm}
                  onPinHook={handlePinHook} pinnedHookIds={pinnedHookIds}/>
              </div>
              <div style={{ display: p.tab==="factions" ? "contents" : "none" }}>
                <FactionsTabContent
                  factions={factions} chars={chars} locations={locations}
                  selectedFaction={pSelectedFaction} selectedFactionId={p.selectedFactionId}
                  updPg={pageUpdPg}
                  onNewFaction={openFactionModal} onCancelNew={cancelNewFaction}
                  onSaveFaction={saveFaction} onDeleteFaction={deleteFaction} onOpenChar={handleOpenChar} onSaveChar={saveChar}/>
              </div>
              <div style={{ display: p.tab==="timeline" ? "contents" : "none" }}>
                <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minHeight:0 }}>
                  <div style={{ padding:"28px 32px 12px", flexShrink:0 }}>
                    <h1 style={{ fontFamily:"Georgia,serif", color:"#e8d5b7", margin:"0 0 6px", fontSize:26 }}>Timeline</h1>
                    <p style={{ color:"#5a4a7a", fontSize:13, margin:0 }}>All events across every story, grouped by date.</p>
                  </div>
                  <div style={{ flex:1, overflowY:"auto", padding:"0 32px 28px", minHeight:0 }}>
                    <GlobalTimeline stories={stories} chars={chars} loreEvents={loreEvents} onOpenStory={handleOpenStory} onOpenChar={handleOpenChar}/>
                  </div>
                </div>
              </div>
              <div style={{ display: p.tab==="locations" ? "contents" : "none" }}>
                <LocationsTabContent
                  locations={locations} chars={chars} factions={factions} stories={stories} mapData={mapData}
                  locationQuery={p.locationQuery} locationTypeFilter={p.locationTypeFilter} collapsedLocTypes={p.collapsedLocTypes}
                  selectedLocation={pSelectedLocation} selectedLocationId={p.selectedLocationId}
                  updPg={pageUpdPg}
                  onNewLocation={openLocationModal}
                  onSaveLocation={saveLocation} onDeleteLocation={deleteLocation}
                  onOpenChar={handleOpenChar} onOpenStory={handleOpenStory} onOpenFaction={handleOpenFaction}
                  onShowOnMap={handleShowOnMap}
                  isEditing={p.locationEditing} onSetEditing={v=>pageUpdPg({ locationEditing: v })}/>
              </div>
              <div style={{ display: p.tab==="items" ? "contents" : "none" }}><ArtifactsTab artifacts={artifacts} onUpdateArtifacts={updateArtifacts} chars={chars} stories={stories} onOpenChar={handleOpenChar} onOpenStory={handleOpenStory} onAskConfirm={askConfirm} onCloseConfirm={closeConfirm} navArtifactId={p.itemNavId}/></div>
              <div style={{ display: p.tab==="map" ? "contents" : "none" }}><MapTab mapData={mapData} onUpdateMapData={updateMapData} locations={locations} onOpenLocation={handleOpenLocation} onAskConfirm={askConfirm} onCloseConfirm={closeConfirm} navTarget={p.mapNavTarget}/></div>
              <div style={{ display: p.tab==="lore" ? "contents" : "none" }}><div style={{ flex:1, overflowY:"auto", padding:"28px 32px" }}><LoreTab events={loreEvents} chars={chars} onUpdateEvents={updateLoreEvents} onOpenChar={handleOpenChar} onAskConfirm={askConfirm} onCloseConfirm={closeConfirm}/></div></div>
              <div style={{ display: p.tab==="gallery" ? "contents" : "none" }}><div style={{ flex:1, overflowY:"auto", padding:"28px 32px" }}><GalleryTab images={galleryImages} galleryEntries={galleryEntries} onUpdateEntries={setGalleryEntries}/></div></div>
              <div style={{ display: p.tab==="notes" ? "contents" : "none" }}><div style={{ flex:1, overflowY:"auto", padding:"28px 32px" }}><NotesTab notes={notes} setNotes={setNotes} chars={chars} stories={stories} setStories={setStories} onOpenStory={handleOpenStory} onOpenChar={handleOpenChar} onPinHook={handlePinHook} onPinCharHook={handlePinCharHook} onRemovePin={handleRemovePin} hookStatuses={hookStatuses} storyStatuses={storyStatuses} onUpdateStory={updateStory} onUpdateChar={updateChar}/></div></div>
              <div style={{ display: p.tab==="settings" ? "contents" : "none" }}><div style={{ flex:1, overflowY:"auto", padding:"28px 32px" }}><SettingsTab races={races} setRaces={updateRaces} charStatuses={charStatuses} setCharStatuses={updateCharStatuses} relationshipTypes={relationshipTypes} setRelationshipTypes={updateRelationshipTypes} storyStatuses={storyStatuses} setStoryStatuses={updateStoryStatuses} hookStatuses={hookStatuses} setHookStatuses={updateHookStatuses} setChars={updateCharsFromSettings}/></div></div>
            </div>
          );
        })}
      </div>

      {helpOpen && (
        <div onClick={()=>setHelpOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.82)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"#1a1228", border:"1px solid #7c5cbf", borderRadius:14, padding:"28px 32px", width:520, maxHeight:"80vh", overflowY:"auto", boxShadow:"0 0 40px #7c5cbf44" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <h2 style={{ color:"#c8a96e", fontFamily:"Georgia,serif", margin:0, fontSize:20 }}>⚗️ Help & Shortcuts</h2>
              <button onClick={()=>setHelpOpen(false)} style={{ background:"none", border:"none", color:"#9a7fa0", cursor:"pointer", fontSize:20, lineHeight:1 }}>✕</button>
            </div>
            {[
              { section: "Navigation", items: [
                ["Ctrl + K", "Open global search"],
                ["Ctrl + N", "Create new entry (current tab)"],
                ["Ctrl + Z", "Undo last action"],
                ["Ctrl + Click (sidebar)", "Open tab in new window/tab"],
              ]},
              { section: "Links & Badges", items: [
                ["Middle Mouse Button", "Open linked entry in a new tab"],
                ["Ctrl + Click (link/badge)", "Open linked entry in a new tab"],
              ]},
              { section: "Tabs", items: [
                ["Click tab in sidebar", "Navigate to tab"],
                ["Ctrl + Click (sidebar tab)", "Open tab in a new browser tab"],
              ]},
              { section: "Reminders (Notes tab)", items: [
                ["Enter", "Pin a reminder"],
                ["Shift + Enter", "New line in reminder input"],
                ["Escape", "Cancel editing"],
              ]},
              { section: "Session Log (Notes tab)", items: [
                ["Enter", "Add session event"],
              ]},
              { section: "Map", items: [
                ["Scroll wheel", "Zoom in / out"],
                ["Click + Drag", "Pan the map"],
                ["Click pin", "Open linked location"],
              ]},
              { section: "Modals & Inputs", items: [
                ["Escape", "Close modal / cancel edit"],
                ["Enter (in list inputs)", "Add item to list"],
              ]},
            ].map(({ section, items }) => (
              <div key={section} style={{ marginBottom:18 }}>
                <div style={{ fontSize:11, color:"#7c5cbf", textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>{section}</div>
                {items.map(([key, desc]) => (
                  <div key={key} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
                    <span style={{ background:"#0f0c1a", border:"1px solid #3a2a5a", borderRadius:6, padding:"3px 10px", fontSize:12, color:"#e8d5b7", fontFamily:"monospace", flexShrink:0, minWidth:180, textAlign:"center" }}>{key}</span>
                    <span style={{ fontSize:13, color:"#9a7fa0" }}>{desc}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {mapPicker && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.82)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:"#1a1228", border:"1px solid #7c5cbf", borderRadius:12, padding:24, width:320, boxShadow:"0 0 40px #7c5cbf44" }}>
            <h3 style={{ color:"#e8d5b7", fontFamily:"Georgia,serif", margin:"0 0 6px" }}>📍 {mapPicker.location.name}</h3>
            <p style={{ color:"#9a7fa0", fontSize:13, margin:"0 0 16px" }}>This location is pinned on multiple maps. Choose one:</p>
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
              {mapPicker.maps.map(({ map, pin }) => (
                <button key={map.id} onClick={() => { updPg({ tab: "map", prevTab: tab, mapNavTarget: { mapId: map.id, pin } }); setMapPicker(null); }}
                  style={{ background:"#2a1f3d", border:"1px solid #3a2a5a", borderRadius:8, color:"#e8d5b7", cursor:"pointer", fontSize:13, padding:"10px 16px", textAlign:"left", transition:"border-color .15s" }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor="#7c5cbf"}
                  onMouseLeave={e=>e.currentTarget.style.borderColor="#3a2a5a"}>
                  🗺️ {map.name}
                </button>
              ))}
            </div>
            <button onClick={()=>setMapPicker(null)} style={{ width:"100%", background:"transparent", border:"1px solid #3a2a5a", borderRadius:8, color:"#9a7fa0", cursor:"pointer", fontSize:13, padding:"8px" }}>Cancel</button>
          </div>
        </div>
      )}
      {confirm&&<ConfirmDialog message={confirm.message} onConfirm={confirm.onConfirm} onCancel={closeConfirm}/>}


      {locationModal&&<LocationModal location={locationModal} onClose={()=>setLocationModal(null)} onSave={saveLocation}/>}
      <GlobalSearch
        open={searchOpen} onClose={() => setSearchOpen(false)}
        chars={chars} stories={stories} factions={factions} locations={locations} artifacts={artifacts}
        onSelectChar={handleOpenChar} onSelectStory={handleOpenStory}
        onSelectFaction={handleOpenFaction} onSelectLocation={handleOpenLocation}
        onSelectArtifact={handleSearchSelectArtifact}
      />
      {campaignManagerOpen&&(
        <CampaignManager campaigns={campaigns} activeCampaignId={activeCampaignId}
          onSelect={switchCampaign} onCreate={createCampaign} onRename={renameCampaign} onDelete={deleteCampaign}
          onClose={()=>setCampaignManagerOpen(false)}/>
      )}
      {galleryCallback && (
        <GalleryPicker
          images={galleryImages}
          onSelect={src => { galleryCallback(src); setGalleryCallback(null); }}
          onClose={() => setGalleryCallback(null)}
        />
      )}
    </div>
    </GalleryContext.Provider>
  );
}
