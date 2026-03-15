import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import useStateWithRef from "./useStateWithRef.js";
import {
  DEFAULT_RACES, CHAR_STATUS_COLORS, RELATIONSHIP_COLORS,
  DEFAULT_CHAR_STATUSES, DEFAULT_RELATIONSHIP_TYPES, DEFAULT_STORY_STATUSES, DEFAULT_HOOK_STATUSES,
  btnPrimary, btnSecondary, iconBtn, inputStyle,
  defaultChar, defaultStory, defaultFaction, defaultLocation, defaultFilters,
} from "./constants.js";
import { uid, getRaceLabel } from "./utils.jsx";

import { useToastContext } from "./components/Toast.jsx";
import GlobalSearch from "./components/GlobalSearch.jsx";
import Avatar from "./components/Avatar.jsx";
import CharModal from "./components/CharModal.jsx";
import StoryModal from "./components/StoryModal.jsx";
import FactionModal from "./components/FactionModal.jsx";
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

// ── Notes Tab ─────────────────────────────────────────────────────────────────
// ── Add to Timeline Modal ─────────────────────────────────────────────────────
// Story picker modal — first step of "Add to Timeline"
function StoryPickerModal({ stories, onClose, onSelect }) {
  const [search, setSearch] = useState("");
  const filtered = stories.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()));
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
            : filtered.map(s => (
                <div key={s.id} onClick={()=>onSelect(s.id)}
                  style={{ padding:"10px 14px", cursor:"pointer", borderBottom:"1px solid #1e1630", color:"#e8d5b7", fontSize:13 }}
                  onMouseEnter={e=>e.currentTarget.style.background="#1e1630"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  📜 {s.name}
                </div>
              ))
          }
        </div>
        <button onClick={onClose} style={{ marginTop:14, width:"100%", background:"transparent", color:"#9a7fa0", border:"1px solid #3a2a5a", borderRadius:6, padding:"8px", cursor:"pointer", fontSize:13 }}>Cancel</button>
      </div>
    </div>
  );
}

function NotesTab({ notes, setNotes, chars, stories, setStories, onOpenStory }) {
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

  const removePin = id => { setNotes(n => ({...n, pins: n.pins.filter(p=>p.id!==id)})); setConfirmDeletePinId(null); };
  const movePin = (id, dir) => setNotes(n => {
    const pins = [...(n.pins||[])];
    const i = pins.findIndex(p=>p.id===id);
    const j = dir==="up" ? i-1 : i+1;
    if (j < 0 || j >= pins.length) return n;
    [pins[i], pins[j]] = [pins[j], pins[i]];
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
                ? <div style={{ color:"#3a2a5a", fontSize:13, textAlign:"center", padding:"12px 18px" }}>No reminders pinned.</div>
                : <div style={{ display:"flex", flexDirection:"column" }}>
                    {(notes.pins||[]).map((p, pi, arr) => {
                      const pinChars = (p.charIds?.length ? p.charIds : p.charId ? [p.charId] : []).map(id => allChars.find(c=>c.id===id)).filter(Boolean);
                      return (
                        <div key={p.id} style={{ borderBottom:"1px solid #1e1630" }}>
                          {editingPinId === p.id ? (
                            <div style={{ display:"flex", flexDirection:"column", gap:6, padding:"8px 14px" }}>
                              <textarea value={editPinText} onChange={e=>setEditPinText(e.target.value)} onKeyDown={e=>{ if(e.key==="Escape") setEditingPinId(null); }}
                                autoFocus rows={3} style={{ width:"100%", background:"#0d0b14", border:"1px solid #7c5cbf", borderRadius:6, padding:"6px 8px", color:"#e8d5b7", fontSize:13, outline:"none", resize:"vertical", lineHeight:1.5, boxSizing:"border-box" }}/>
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
                            <div style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"8px 14px" }}>
                              <div style={{ display:"flex", flexDirection:"column", gap:1, flexShrink:0 }}>
                                <button onClick={()=>movePin(p.id,"up")} disabled={pi===0} style={{ background:"none", border:"none", color:pi===0?"#2a1f3d":"#5a4a7a", cursor:pi===0?"default":"pointer", fontSize:10, lineHeight:1, padding:"1px 3px" }}>▲</button>
                                <button onClick={()=>movePin(p.id,"down")} disabled={pi===arr.length-1} style={{ background:"none", border:"none", color:pi===arr.length-1?"#2a1f3d":"#5a4a7a", cursor:pi===arr.length-1?"default":"pointer", fontSize:10, lineHeight:1, padding:"1px 3px" }}>▼</button>
                              </div>
                              <input type="checkbox" checked={!!p.done} onChange={()=>togglePinDone(p.id)}
                                style={{ width:15, height:15, accentColor:"#7c5cbf", cursor:"pointer", flexShrink:0, marginTop:2 }}/>
                              <div style={{ flex:1, minWidth:0 }}>
                                <span style={{ fontSize:13, color: p.done ? "#5a4a7a" : "#e8d5b7", textDecoration: p.done ? "line-through" : "none", lineHeight:1.5, overflowWrap:"break-word", wordBreak:"break-word" }}>{p.text}</span>
                                {pinChars.length > 0 && (
                                  <div style={{ display:"flex", flexDirection:"column", gap:4, marginTop:5 }}>
                                    {pinChars.map(pc => (
                                      <div key={pc.id} onClick={() => handleOpenChar(pc)} style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", width:"fit-content" }}
                                        onMouseEnter={e => e.currentTarget.querySelector(".pin-char-name").style.color="#a07ee8"}
                                        onMouseLeave={e => e.currentTarget.querySelector(".pin-char-name").style.color="#7c5cbf"}>
                                        <Avatar src={pc.image} name={pc.name} size={20}/>
                                        <div>
                                          <span className="pin-char-name" style={{ fontSize:11, color:"#7c5cbf", fontWeight:600, transition:"color .12s" }}>{pc.name} ↗</span>
                                          {pc.shortDescription && <div style={{ fontSize:11, color:"#5a4a7a", lineHeight:1.3 }}>{pc.shortDescription}</div>}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <button onClick={()=>{ setEditingPinId(p.id); setEditPinText(p.text); setEditPinCharIds(p.charIds || (p.charId ? [p.charId] : [])); }} style={{ background:"none", border:"none", color:"#7c5cbf", cursor:"pointer", fontSize:13, padding:"2px 4px", flexShrink:0 }}>✏️</button>
                              <button onClick={()=>setConfirmDeletePinId(p.id)} style={{ background:"none", border:"none", color:"#5a3030", cursor:"pointer", fontSize:13, padding:"2px 4px", flexShrink:0 }}>🗑️</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
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
              value={notes.scratch||""}
              onChange={e => setNotes(n => ({...n, scratch: e.target.value}))}
              placeholder={"Quick notes, reminders, mid-session thoughts…\n\nAnything you type here is saved automatically."}
              style={{ width:"100%", minHeight:260, background:"#0d0b14", border:"none", color:"#e8d5b7", fontSize:14, lineHeight:1.7, padding:"14px 18px", resize:"vertical", outline:"none", fontFamily:"system-ui,sans-serif", boxSizing:"border-box" }}
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
                        <div onClick={() => toggleSession(s.id)} style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 18px", cursor:"pointer", userSelect:"none" }}
                          onMouseEnter={e=>e.currentTarget.style.background="#1a1228"}
                          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          <span style={{ fontSize:10, color:"#7c5cbf" }}>{collapsed[s.id] ? "▶" : "▼"}</span>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:14, color:"#e8d5b7", fontWeight:700, fontFamily:"Georgia,serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.title}</div>
                            {(s.year||s.month||s.day) && <div style={{ fontSize:11, color:"#7c5cbf", marginTop:1 }}>{[s.year,s.month,s.day].filter(Boolean).join(" / ")}</div>}
                            <div style={{ fontSize:11, color:"#5a4a7a", marginTop:1 }}>{(s.events||[]).length} event{(s.events||[]).length!==1?"s":""}</div>
                          </div>
                          <button onClick={e=>{e.stopPropagation(); setEditingSessionId(s.id); setEditSessionForm({title:s.title, year:s.year||"", month:s.month||"", day:s.day||""}); }} style={{ background:"none", border:"none", color:"#7c5cbf", cursor:"pointer", fontSize:13, padding:"2px 6px", flexShrink:0 }}>✏️</button>
                          <button onClick={e=>{e.stopPropagation(); setConfirmDeleteId(s.id); }} style={{ background:"none", border:"none", color:"#5a3030", cursor:"pointer", fontSize:14, padding:"2px 4px", flexShrink:0 }}>🗑️</button>
                        </div>

                        {/* Session body */}
                        {!collapsed[s.id] && (
                          <div style={{ borderTop:"1px solid #1e1630" }}>
                            {/* Add event input */}
                            <div style={{ padding:"10px 18px", display:"flex", gap:8 }}>
                              <textarea
                                value={newEventText[s.id]||""}
                                onChange={e=>setNewEventText(p=>({...p,[s.id]:e.target.value}))}
                                onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); addSessionEvent(s.id); } }}
                                placeholder="Add event… (Enter to add, Shift+Enter for new line)"
                                rows={2}
                                style={{ flex:1, background:"#0d0b14", border:"1px solid #2a1f3d", borderRadius:6, padding:"6px 10px", color:"#e8d5b7", fontSize:12, outline:"none", resize:"vertical", lineHeight:1.5, boxSizing:"border-box" }}
                              />
                              <button onClick={()=>addSessionEvent(s.id)} style={{ background:"#2a1f3d", border:"1px solid #3a2a5a", borderRadius:6, color:"#9a7fa0", cursor:"pointer", fontSize:12, padding:"6px 12px", flexShrink:0, alignSelf:"flex-end" }}>Add</button>
                            </div>
                            {/* Events list */}
                            {(s.events||[]).map(ev => {
                              const linkedStory = ev.linkedStoryId ? (stories||[]).find(st=>st.id===ev.linkedStoryId) : null;
                              const isEditing = editingEventId?.sessionId===s.id && editingEventId?.eventId===ev.id;
                              return (
                                <div key={ev.id} style={{ padding:"10px 18px 10px 34px", borderBottom:"1px solid #13101f", display:"flex", alignItems:"flex-start", gap:8 }}>
                                  <div style={{ width:6, height:6, borderRadius:"50%", background:"#5a3da0", flexShrink:0, marginTop:5 }}/>
                                  <div style={{ flex:1, minWidth:0 }}>
                                    {isEditing ? (
                                      <>
                                        <textarea value={editEventText} onChange={e=>setEditEventText(e.target.value)}
                                          onKeyDown={e=>{ if(e.key==="Escape") setEditingEventId(null); }}
                                          autoFocus rows={3}
                                          style={{ width:"100%", background:"#0d0b14", border:"1px solid #7c5cbf", borderRadius:6, padding:"6px 8px", color:"#e8d5b7", fontSize:13, outline:"none", resize:"vertical", lineHeight:1.5, boxSizing:"border-box" }}/>
                                        <div style={{ display:"flex", gap:6, marginTop:6 }}>
                                          <button onClick={saveEditSessionEvent} style={{ flex:1, background:"#5a3da0", border:"none", borderRadius:6, color:"#e8d5b7", cursor:"pointer", fontSize:12, padding:"4px 10px" }}>Save</button>
                                          <button onClick={()=>setEditingEventId(null)} style={{ flex:1, background:"none", border:"1px solid #3a2a5a", borderRadius:6, color:"#9a7fa0", cursor:"pointer", fontSize:12, padding:"4px 10px" }}>Cancel</button>
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <div style={{ fontSize:13, color:"#c8b89a", lineHeight:1.5, overflowWrap:"break-word", wordBreak:"break-word", whiteSpace:"pre-wrap" }}>{ev.text}</div>
                                        {linkedStory ? (
                                          <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:5 }}>
                                            <span onClick={()=>onOpenStory&&onOpenStory(linkedStory, ev.linkedEventId)}
                                              style={{ fontSize:11, color:"#7c5cbf", background:"#7c5cbf18", border:"1px solid #3a2a5a", borderRadius:4, padding:"2px 8px", cursor:"pointer", textDecoration:"underline" }}
                                              onMouseEnter={e=>e.currentTarget.style.background="#7c5cbf33"}
                                              onMouseLeave={e=>e.currentTarget.style.background="#7c5cbf18"}>
                                              🔗 {linkedStory.name}
                                            </span>
                                            {confirmUnlink?.sessionId===s.id && confirmUnlink?.sessionEventId===ev.id ? (
                                              <>
                                                <button onMouseDown={()=>unlinkFromTimeline(s.id, ev.id)} style={{ background:"#6b1a1a", color:"#e8d5b7", border:"none", borderRadius:4, padding:"2px 8px", cursor:"pointer", fontSize:11 }}>Unlink</button>
                                                <button onMouseDown={()=>setConfirmUnlink(null)} style={{ background:"transparent", color:"#9a7fa0", border:"1px solid #3a2a5a", borderRadius:4, padding:"2px 8px", cursor:"pointer", fontSize:11 }}>Cancel</button>
                                              </>
                                            ) : (
                                              <button onClick={()=>setConfirmUnlink({sessionId:s.id, sessionEventId:ev.id})} style={{ background:"none", border:"none", color:"#5a3030", cursor:"pointer", fontSize:11, padding:"2px 4px" }}>✕ unlink</button>
                                            )}
                                          </div>
                                        ) : (
                                          <button onClick={()=>addToTimeline(s.id, ev.id)} style={{ marginTop:5, background:"none", border:"1px solid #3a2a5a", borderRadius:4, color:"#7c5cbf", cursor:"pointer", fontSize:11, padding:"2px 8px" }}>+ Add to Timeline</button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                  {!isEditing && <button onClick={()=>{ setEditingEventId({sessionId:s.id, eventId:ev.id}); setEditEventText(ev.text); }} style={{ background:"none", border:"none", color:"#7c5cbf", cursor:"pointer", fontSize:13, padding:"2px 4px", flexShrink:0 }}>✏️</button>}
                                  {confirmDeleteEvt?.sessionId===s.id && confirmDeleteEvt?.eventId===ev.id ? (
                                    <>
                                      <button onClick={()=>{ deleteSessionEvent(s.id, ev.id); setConfirmDeleteEvt(null); }} style={{ background:"#6b1a1a", color:"#e8d5b7", border:"none", borderRadius:4, padding:"2px 8px", cursor:"pointer", fontSize:11, flexShrink:0 }}>Delete</button>
                                      <button onClick={()=>setConfirmDeleteEvt(null)} style={{ background:"transparent", color:"#9a7fa0", border:"1px solid #3a2a5a", borderRadius:4, padding:"2px 8px", cursor:"pointer", fontSize:11, flexShrink:0 }}>✕</button>
                                    </>
                                  ) : (
                                    <button onClick={()=>setConfirmDeleteEvt({sessionId:s.id, eventId:ev.id})} style={{ background:"none", border:"none", color:"#3a2a4a", cursor:"pointer", fontSize:13, padding:"2px 4px", flexShrink:0 }}>🗑️</button>
                                  )}
                                </div>
                              );
                            })}

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

      {timelineModal && <StoryPickerModal stories={stories||[]} onClose={()=>setTimelineModal(null)} onSelect={onStorySelected}/>}
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
  {id:"map",label:"🗺️ Map"},{id:"lore",label:"🏛️ Lore"},{id:"notes",label:"📝 Notes"},
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
  const [charModal, setCharModal] = useState(null);
  const [storyModal, setStoryModal] = useState(null);
  const [factionModal, setFactionModal] = useState(null);
  const [locationModal, setLocationModal] = useState(null);
  const DEFAULT_PAGE = {
    tab: "characters",
    selectedCharId: null, selectedStoryId: null, selectedFactionId: null, selectedLocationId: null,
    charSubTab: "details", storySubTab: "details",
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
  const tab = pg.tab;
  const prevTab = pg.prevTab;
  const query = pg.query;
  const storyQuery = pg.storyQuery;
  const storyStatusFilter = pg.storyStatusFilter;
  const locationQuery = pg.locationQuery;
  const locationTypeFilter = pg.locationTypeFilter;
  const collapsedLocTypes = pg.collapsedLocTypes;
  const filters = pg.filters;
  const mainCollapsed = pg.mainCollapsed;
  const sideCollapsed = pg.sideCollapsed;
  const charSubTab = pg.charSubTab;
  const storySubTab = pg.storySubTab;
  const itemNavId = pg.itemNavId;
  const storyHighlightEventId = pg.storyHighlightEventId;
  const mapNavTarget = pg.mapNavTarget;
  const selectedChar = chars.find(c => c.id === pg.selectedCharId) || null;
  const selectedStory = stories.find(s => s.id === pg.selectedStoryId) || null;
  const selectedFaction = factions.find(f => f.id === pg.selectedFactionId) || null;
  const selectedLocation = locations.find(l => l.id === pg.selectedLocationId) || null;

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
      mapData: mapDataRef.current,
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
        if (charModal)     { setCharModal(null); return; }
        if (storyModal)    { setStoryModal(null); return; }
        if (factionModal)  { setFactionModal(null); return; }
        if (locationModal) { setLocationModal(null); return; }
        if (confirm)       { closeConfirm(); return; }
        updPg({ selectedCharId: null, selectedStoryId: null, selectedFactionId: null, selectedLocationId: null });
        return;
      }

      // N — new item on current tab (skip if typing or a modal is open)
      if (e.key === 'n' && !inInput && !charModal && !storyModal && !factionModal && !locationModal && !searchOpen) {
        e.preventDefault();
        if (tab === 'characters') setCharModal({...defaultChar, type:'main'});
        else if (tab === 'stories')   setStoryModal({...defaultStory});
        else if (tab === 'factions')  setFactionModal({...defaultFaction});
        else if (tab === 'locations') setLocationModal({...defaultLocation});
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [tab, searchOpen, charModal, storyModal, factionModal, locationModal, confirm, closeConfirm]);

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
        chars, stories, races, factions, locations, notes, loreEvents, relations, artifacts, charStatuses, relationshipTypes, storyStatuses, hookStatuses, mapData,
        nav: { tab, prevTab, selectedCharId:selectedChar?.id||null, selectedStoryId:selectedStory?.id||null, selectedFactionId:selectedFaction?.id||null, selectedLocationId:selectedLocation?.id||null },
      };
      try { await store.set(`fwb_campaign_${activeCampaignId}`, JSON.stringify(blob)); } catch {}
    }, 500);
    return () => clearTimeout(saveTimerRef.current);
  }, [chars, stories, races, factions, locations, notes, loreEvents, relations, artifacts, charStatuses, relationshipTypes, mapData, tab, prevTab, selectedChar, selectedStory, selectedFaction, selectedLocation, loaded, activeCampaignId]); // eslint-disable-line

  const saveChar = useCallback(form => {
    pushHistory();
    const savedId = form.id || uid();
    const savedForm = { ...form, id: savedId };
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
    showToast(form.id ? "Character updated" : "Character added");
  }, [pushHistory, showToast]);

  const deleteChar = useCallback(id => {
    const c = chars.find(x=>x.id===id);
    askConfirm(`Delete "${c?.name}"?`, () => {
      pushHistory();
      setChars(prev=>prev.filter(x=>x.id!==id).map(c=>({...c,relationships:(c.relationships||[]).filter(r=>r.charId!==id)})));
      updPgFn(p => p.selectedCharId===id ? { selectedCharId: null } : {});
      setStories(prev=>prev.map(s=>({...s,characterIds:s.characterIds.filter(x=>x!==id),events:(s.events||[]).map(e=>({...e,characterIds:(e.characterIds||[]).filter(x=>x!==id)}))})));
      closeConfirm();
      showToast("Character deleted", "error");
    });
  }, [chars, updPgFn, askConfirm, closeConfirm, pushHistory, showToast]);

  const saveStory = useCallback(form => {
    pushHistory();
    const w = {...form, events:form.events||[]};
    setStories(prev => form.id ? prev.map(s=>s.id===form.id?w:s) : [...prev,{...w,id:uid()}]);
    setStoryModal(null);
    showToast(form.id ? "Story updated" : "Story added");
  }, [pushHistory, showToast]);

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
    const saved = form.id ? form : {...form, id:uid()};
    setFactions(prev => form.id ? prev.map(f=>f.id===form.id?saved:f) : [...prev,saved]);
    if (!form.id) setFactionModal(null);
    showToast(form.id ? "Faction updated" : "Faction added");
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
    if (opts.newTab) { addPage({ tab: "stories", selectedStoryId: story.id, storyHighlightEventId: highlightEventId||null }); return; }
    updPgFn(p => ({ tab: "stories", prevTab: p.tab, mapNavTarget: null, selectedStoryId: story.id, storyHighlightEventId: highlightEventId||null }));
  }, [updPgFn, addPage]);

  const handleOpenChar = useCallback((char, opts = {}) => {
    if (opts.newTab) { addPage({ tab: "characters", selectedCharId: char.id }); return; }
    updPgFn(p => ({ tab: "characters", prevTab: p.tab, mapNavTarget: null, selectedCharId: char.id }));
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
  const openCharModal = useCallback(type => setCharModal({...defaultChar, type}), []);
  const openStoryModal = useCallback(() => setStoryModal({...defaultStory}), []);
  const openFactionModal = useCallback(() => setFactionModal({...defaultFaction}), []);
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
      nav: { tab, prevTab, selectedCharId:selectedChar?.id||null, selectedStoryId:selectedStory?.id||null, selectedFactionId:selectedFaction?.id||null, selectedLocationId:selectedLocation?.id||null },
    };
    try { await store.set(`fwb_campaign_${campaignId}`, JSON.stringify(blob)); } catch {}
  }, [tab, prevTab, selectedChar, selectedStory, selectedFaction, selectedLocation]);

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

  const { players, main, side } = useMemo(() => {
    const q = query.toLowerCase();
    const filterChars = list => list.filter(c => {
      const raceLabel = getRaceLabel(races,c.raceId,c.subraceId).toLowerCase();
      const locationLabel = locations.find(l=>l.id===c.locationId)?.name?.toLowerCase()||"";
      const factionLabels = factions.filter(f=>(c.factions||[]).some(e=>e.factionId===f.id)).map(f=>f.name.toLowerCase()).join(" ");
      const matchQ = !q||["name","shortDescription","description","secret","origin","class"].some(k=>c[k]?.toLowerCase().includes(q))||raceLabel.includes(q)||locationLabel.includes(q)||factionLabels.includes(q);
      const matchF = (!filters.raceId||c.raceId===filters.raceId)&&(!filters.locationId||c.locationId===filters.locationId)&&(!filters.status||c.status===filters.status)&&(!filters.factionId||(c.factions||[]).some(e=>e.factionId===filters.factionId));
      return matchQ&&matchF;
    });
    return {
      players: filterChars(chars.filter(c=>c.type==="player")),
      main:    filterChars(chars.filter(c=>c.type==="main")).sort((a,b)=>a.name.localeCompare(b.name)),
      side:    filterChars(chars.filter(c=>c.type==="side")).sort((a,b)=>a.name.localeCompare(b.name)),
    };
  }, [chars, query, filters, races, locations, factions]);

  const { mainStory, playerStories, otherStories } = useMemo(() => {
    const q = storyQuery.toLowerCase();
    return {
      mainStory:    stories.find(s=>s.isMain)||null,
      playerStories: stories.filter(s=>s.playerId&&!s.isMain),
      otherStories: stories.filter(s=>!s.isMain&&!s.playerId).filter(s=>{
        const matchText=!q||s.name.toLowerCase().includes(q)||(s.summary||"").toLowerCase().includes(q);
        return matchText&&(!storyStatusFilter||s.status===storyStatusFilter);
      }),
    };
  }, [stories, storyQuery, storyStatusFilter]);

  const activeCampaign = useMemo(() => campaigns.find(c => c.id === activeCampaignId), [campaigns, activeCampaignId]);

  // All players unfiltered — for the players row in CharactersTabContent
  const allPlayers = useMemo(() => chars.filter(c => c.type==="player"), [chars]);

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
          <div style={{ fontSize:11, color:"#4a3a6a", marginTop:3, marginBottom:8 }}>v0.4.0</div>
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
        <div style={{ padding:"8px 12px", borderTop:"1px solid #2a1f3d" }}>
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
          <button onClick={()=>addPage()} title="New tab (Ctrl+Click a section in the sidebar)"
            style={{ background:"none", border:"none", color:"#5a4a7a", cursor:"pointer", fontSize:18, padding:"0 6px", lineHeight:1, transition:"color .12s" }}
            onMouseEnter={e=>e.currentTarget.style.color="#c8a96e"} onMouseLeave={e=>e.currentTarget.style.color="#5a4a7a"}>+</button>
        </div>
        {prevTab&&prevTab!==tab&&(
          <div style={{ padding:"18px 32px 0", flexShrink:0 }}>
            <button onClick={()=>updPg({ tab: prevTab, prevTab: null })} style={{ display:"inline-flex", alignItems:"center", gap:6, background:"transparent", border:"1px solid #3a2a5a", borderRadius:8, padding:"6px 14px", color:"#7c5cbf", cursor:"pointer", fontSize:13, fontWeight:600, transition:"border-color .15s, color .15s" }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor="#7c5cbf"; e.currentTarget.style.color="#c8a96e"; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor="#3a2a5a"; e.currentTarget.style.color="#7c5cbf"; }}>
              ← Back to {ALL_TABS.find(t=>t.id===prevTab)?.label||prevTab}
            </button>
          </div>
        )}
        {tab==="characters"&&(
          <CharactersTabContent
            chars={chars} races={races} factions={factions} locations={locations}
            stories={stories} loreEvents={loreEvents} artifacts={artifacts}
            charStatuses={charStatuses} storyStatuses={storyStatuses}
            hookStatuses={hookStatuses} relationshipTypes={relationshipTypes}
            allPlayers={allPlayers} main={main} side={side}
            query={query} filters={filters}
            selectedChar={selectedChar} selectedCharId={pg.selectedCharId}
            charSubTab={charSubTab} mainCollapsed={mainCollapsed} sideCollapsed={sideCollapsed}
            updPg={updPg}
            onNewChar={openCharModal} onDeleteChar={deleteChar}
            onOpenStory={handleOpenStory} onOpenFaction={handleOpenFaction} onOpenChar={handleOpenChar}
            onSaveChar={saveChar} onUpdateArtifacts={updateArtifacts}/>
        )}
        {tab==="stories"&&(
          <StoriesTabContent
            stories={stories} chars={chars} factions={factions} locations={locations} artifacts={artifacts}
            storyStatuses={storyStatuses} hookStatuses={hookStatuses}
            storyQuery={storyQuery} storyStatusFilter={storyStatusFilter}
            selectedStory={selectedStory} selectedStoryId={pg.selectedStoryId}
            storySubTab={storySubTab} storyHighlightEventId={storyHighlightEventId}
            mainStory={mainStory} playerStories={playerStories} otherStories={otherStories}
            currentTimelineDate={currentTimelineDate}
            updPg={updPg}
            onNewStory={openStoryModal} onDeleteStory={deleteStory}
            onSetMain={setMainStory} onSetPlayerStory={setPlayerStory} onUpdateStory={updateStory}
            onOpenChar={handleOpenChar} onOpenFaction={handleOpenFaction} onOpenLocation={handleOpenLocation}
            onOpenArtifact={handleOpenArtifactInStory} onUpdateArtifacts={updateArtifacts}
            onAskConfirm={askConfirm} onCloseConfirm={closeConfirm}/>
        )}
        {tab==="factions"&&(
          <FactionsTabContent
            factions={factions} chars={chars}
            selectedFaction={selectedFaction} selectedFactionId={pg.selectedFactionId}
            updPg={updPg}
            onNewFaction={openFactionModal}
            onSaveFaction={saveFaction} onDeleteFaction={deleteFaction} onOpenChar={handleOpenChar}/>
        )}
        {tab==="timeline"&&(
          <div style={{ flex:1, overflowY:"auto", padding:"28px 32px" }}>
            <h1 style={{ fontFamily:"Georgia,serif", color:"#e8d5b7", margin:"0 0 6px", fontSize:26 }}>Timeline</h1>
            <p style={{ color:"#5a4a7a", fontSize:13, margin:"0 0 24px" }}>All events across every story, grouped by date.</p>
            <GlobalTimeline stories={stories} chars={chars} loreEvents={loreEvents} onOpenStory={handleOpenStory} onOpenChar={handleOpenChar}/>
          </div>
        )}
        {tab==="locations"&&(
          <LocationsTabContent
            locations={locations} chars={chars} factions={factions} stories={stories} mapData={mapData}
            locationQuery={locationQuery} locationTypeFilter={locationTypeFilter} collapsedLocTypes={collapsedLocTypes}
            selectedLocation={selectedLocation} selectedLocationId={pg.selectedLocationId}
            updPg={updPg}
            onNewLocation={openLocationModal}
            onSaveLocation={saveLocation} onDeleteLocation={deleteLocation}
            onOpenChar={handleOpenChar} onOpenStory={handleOpenStory} onOpenFaction={handleOpenFaction}
            onShowOnMap={handleShowOnMap}/>
        )}
{tab==="items"&&<ArtifactsTab artifacts={artifacts} onUpdateArtifacts={updateArtifacts} chars={chars} stories={stories} onOpenChar={handleOpenChar} onOpenStory={handleOpenStory} onAskConfirm={askConfirm} onCloseConfirm={closeConfirm} navArtifactId={itemNavId}/>}
        {tab==="map"&&<MapTab mapData={mapData} onUpdateMapData={updateMapData} locations={locations} onOpenLocation={handleOpenLocation} onAskConfirm={askConfirm} onCloseConfirm={closeConfirm} navTarget={mapNavTarget}/>}
        {tab==="lore"&&<div style={{ flex:1, overflowY:"auto", padding:"28px 32px" }}><LoreTab events={loreEvents} chars={chars} onUpdateEvents={updateLoreEvents} onOpenChar={handleOpenChar} onAskConfirm={askConfirm} onCloseConfirm={closeConfirm}/></div>}
        {tab==="notes"&&<div style={{ flex:1, overflowY:"auto", padding:"28px 32px" }}><NotesTab notes={notes} setNotes={setNotes} chars={chars} stories={stories} setStories={setStories} onOpenStory={handleOpenStory}/></div>}
        {tab==="settings"&&<div style={{ flex:1, overflowY:"auto", padding:"28px 32px" }}><SettingsTab races={races} setRaces={updateRaces} charStatuses={charStatuses} setCharStatuses={updateCharStatuses} relationshipTypes={relationshipTypes} setRelationshipTypes={updateRelationshipTypes} storyStatuses={storyStatuses} setStoryStatuses={updateStoryStatuses} hookStatuses={hookStatuses} setHookStatuses={updateHookStatuses} setChars={updateCharsFromSettings}/></div>}
      </div>

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
      {charModal&&<CharModal char={charModal} chars={chars} races={races} factions={factions} locations={locations} charStatuses={charStatuses} onClose={()=>setCharModal(null)} onSave={saveChar}/>}
      {storyModal&&<StoryModal story={storyModal} chars={chars} factions={factions} locations={locations} onClose={()=>setStoryModal(null)} onSave={saveStory}/>}
      {factionModal&&<FactionModal faction={factionModal} onClose={()=>setFactionModal(null)} onSave={saveFaction}/>}
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
