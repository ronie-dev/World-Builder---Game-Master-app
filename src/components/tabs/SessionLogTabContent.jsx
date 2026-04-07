import { useState, memo } from "react";
import { btnPrimary, btnSecondary, ghostInput, inputStyle } from "../../constants.js";
import { uid } from "../../utils.jsx";
import Avatar from "../Avatar.jsx";
import EventModal from "../EventModal.jsx";

// ── Multi-character picker ────────────────────────────────────────────────────
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

// ── Story picker modal ────────────────────────────────────────────────────────
function StoryPickerModal({ stories, storyStatuses, onClose, onSelect }) {
  const [search, setSearch] = useState("");
  const statusColors = Object.fromEntries((storyStatuses||[]).map(s=>[s.name,s.color]));
  const filtered = stories.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#13101f", border:"1px solid #3a2a5a", borderRadius:14, padding:"24px", width:420, maxHeight:"70vh", display:"flex", flexDirection:"column", boxShadow:"0 8px 40px #00000099" }}>
        <h3 style={{ fontFamily:"Georgia,serif", color:"#c8a96e", margin:"0 0 16px", fontSize:18 }}>Link to Story</h3>
        <div style={{ position:"relative", marginBottom:12 }}>
          <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#5a4a7a", fontSize:13 }}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search stories…"
            style={{ ...inputStyle, paddingLeft:30 }} autoFocus/>
        </div>
        <div style={{ overflowY:"auto", flex:1, display:"flex", flexDirection:"column", gap:6 }}>
          {filtered.map(s => (
            <div key={s.id} onClick={()=>onSelect(s.id)}
              style={{ padding:"10px 14px", borderRadius:8, cursor:"pointer", border:"1px solid #2a1f3d", display:"flex", alignItems:"center", gap:10, transition:"border-color .12s" }}
              onMouseEnter={e=>e.currentTarget.style.borderColor="#7c5cbf"}
              onMouseLeave={e=>e.currentTarget.style.borderColor="#2a1f3d"}>
              <span style={{ flex:1, fontSize:13, color:"#e8d5b7" }}>{s.name}</span>
              {s.status && <span style={{ fontSize:11, color:statusColors[s.status]||"#9a7fa0", background:(statusColors[s.status]||"#3a3a3a")+"22", borderRadius:6, padding:"2px 8px" }}>{s.status}</span>}
            </div>
          ))}
          {filtered.length===0 && <div style={{ color:"#5a4a7a", fontSize:13, textAlign:"center", padding:"20px 0" }}>No stories found.</div>}
        </div>
        <button onClick={onClose} style={{ ...btnSecondary, marginTop:14 }}>Cancel</button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
function SessionLogTabContent({ notes, setNotes, chars, stories, setStories, storyStatuses, onOpenStory }) {
  const [addingSession, setAddingSession] = useState(false);
  const [sessionForm, setSessionForm] = useState({ title:"", year:"", month:"", day:"" });
  const [collapsed, setCollapsed] = useState({});
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editSessionForm, setEditSessionForm] = useState({ title:"", year:"", month:"", day:"" });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [newEventText, setNewEventText] = useState({});
  const [editingEventId, setEditingEventId] = useState(null);
  const [editEventText, setEditEventText] = useState("");
  const [timelineModal, setTimelineModal] = useState(null);
  const [timelineEventModal, setTimelineEventModal] = useState(null);
  const [confirmUnlink, setConfirmUnlink] = useState(null);
  const [confirmDeleteEvt, setConfirmDeleteEvt] = useState(null);

  const saveSession = () => {
    if (!sessionForm.title.trim()) return;
    setNotes(n => ({...n, sessions:[{id:uid(), year:sessionForm.year, month:sessionForm.month, day:sessionForm.day, title:sessionForm.title, events:[]}, ...n.sessions]}));
    setAddingSession(false);
    setSessionForm({ title:"", year:"", month:"", day:"" });
  };

  const deleteSession = id => {
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

  const addSessionEvent = sessionId => {
    const t = (newEventText[sessionId]||"").trim();
    if (!t) return;
    setNotes(n => ({...n, sessions: n.sessions.map(s => s.id===sessionId ? {...s, events:[{id:uid(), text:t}, ...(s.events||[])]} : s)}));
    setNewEventText(p => ({...p, [sessionId]: ""}));
  };

  const deleteSessionEvent = (sessionId, eventId) => {
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

  const addToTimeline = (sessionId, sessionEventId) => setTimelineModal({ sessionId, sessionEventId });

  const onStorySelected = storyId => {
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

  const saveToTimeline = eventForm => {
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

  const latestTimelineDate = (() => {
    const all = (stories||[]).flatMap(s=>s.events||[]).filter(e=>e.year);
    if (!all.length) return null;
    const latest = [...all].sort((a,b)=>{ const dy=(parseInt(b.year)||0)-(parseInt(a.year)||0); if(dy) return dy; const dm=(parseInt(b.month)||0)-(parseInt(a.month)||0); if(dm) return dm; return (parseInt(b.day)||0)-(parseInt(a.day)||0); })[0];
    return [latest.year,latest.month,latest.day].filter(Boolean).join(" / ");
  })();

  const sessions = notes.sessions || [];
  const totalEvents = sessions.reduce((n,s)=>n+(s.events||[]).length, 0);

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"28px 32px" }}>
      <h1 style={{ fontFamily:"Georgia,serif", color:"#e8d5b7", margin:"0 0 6px", fontSize:26 }}>Session Log</h1>
      <p style={{ color:"#5a4a7a", fontSize:13, margin:"0 0 20px" }}>{sessions.length} session{sessions.length!==1?"s":""} · {totalEvents} event{totalEvents!==1?"s":""}</p>

      <div style={{ background:"#13101f", border:"1px solid #2a1f3d", borderRadius:12, overflow:"hidden" }}>
        <div style={{ padding:"12px 18px", borderBottom:"1px solid #2a1f3d", display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ color:"#c8a96e", fontFamily:"Georgia,serif", fontSize:15, fontWeight:700 }}>📖 Sessions</span>
          <button onClick={() => { setAddingSession(true); setSessionForm({ title:"", year:"", month:"", day:"" }); }}
            style={{ ...btnPrimary, fontSize:12, padding:"5px 14px", marginLeft:"auto" }}>
            + New Session
          </button>
        </div>

        {addingSession && (
          <div style={{ padding:"14px 18px", borderBottom:"1px solid #2a1f3d", background:"#0d0b14" }}>
            <div style={{ marginBottom:10 }}>
              <input value={sessionForm.title} onChange={e=>setSessionForm(f=>({...f,title:e.target.value}))} placeholder="Session title…"
                autoFocus style={{ ...inputStyle, marginBottom:8 }}/>
              <div style={{ display:"flex", gap:8 }}>
                <input value={sessionForm.year} onChange={e=>setSessionForm(f=>({...f,year:e.target.value}))} placeholder="Year" style={{ ...inputStyle, flex:2 }}/>
                <input value={sessionForm.month} onChange={e=>setSessionForm(f=>({...f,month:e.target.value}))} placeholder="Month" style={{ ...inputStyle, flex:1 }}/>
                <input value={sessionForm.day} onChange={e=>setSessionForm(f=>({...f,day:e.target.value}))} placeholder="Day" style={{ ...inputStyle, flex:1 }}/>
              </div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={saveSession} disabled={!sessionForm.title.trim()} style={{ ...btnPrimary, flex:1 }}>Create Session</button>
              <button onClick={() => setAddingSession(false)} style={{ ...btnSecondary, flex:1 }}>Cancel</button>
            </div>
          </div>
        )}

        {sessions.length === 0 && !addingSession
          ? <div style={{ color:"#3a2a5a", fontSize:13, textAlign:"center", padding:"40px 24px" }}>No sessions logged yet.<br/><span style={{ fontSize:12 }}>Click "+ New Session" to start.</span></div>
          : sessions.map(s => (
              <div key={s.id} style={{ borderBottom:"1px solid #1e1630" }}>
                {editingSessionId === s.id ? (
                  <div style={{ padding:"14px 18px", background:"#0d0b14" }}>
                    <div style={{ marginBottom:10 }}>
                      <input value={editSessionForm.title} onChange={e=>setEditSessionForm(f=>({...f,title:e.target.value}))} placeholder="Session title…"
                        style={{ ...inputStyle, marginBottom:8 }}/>
                      <div style={{ display:"flex", gap:8 }}>
                        <input value={editSessionForm.year} onChange={e=>setEditSessionForm(f=>({...f,year:e.target.value}))} placeholder="Year" style={{ ...inputStyle, flex:2 }}/>
                        <input value={editSessionForm.month} onChange={e=>setEditSessionForm(f=>({...f,month:e.target.value}))} placeholder="Month" style={{ ...inputStyle, flex:1 }}/>
                        <input value={editSessionForm.day} onChange={e=>setEditSessionForm(f=>({...f,day:e.target.value}))} placeholder="Day" style={{ ...inputStyle, flex:1 }}/>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={saveEditSession} style={{ ...btnPrimary, flex:1 }}>💾 Save</button>
                      <button onClick={()=>setEditingSessionId(null)} style={{ ...btnSecondary, flex:1 }}>Cancel</button>
                    </div>
                  </div>
                ) : confirmDeleteId === s.id ? (
                  <div style={{ padding:"14px 18px", background:"#1a0d0d", display:"flex", alignItems:"center", gap:12 }}>
                    <span style={{ flex:1, fontSize:13, color:"#c8b89a" }}>Delete <strong>"{s.title}"</strong> and all its events?</span>
                    <button onClick={()=>deleteSession(s.id)} style={{ background:"#6b1a1a", color:"#e8d5b7", border:"none", borderRadius:6, padding:"6px 16px", cursor:"pointer", fontWeight:700, fontSize:12 }}>Delete</button>
                    <button onClick={()=>setConfirmDeleteId(null)} style={{ ...btnSecondary, padding:"6px 16px", fontSize:12 }}>Cancel</button>
                  </div>
                ) : (
                  <>
                    <div onClick={() => toggleSession(s.id)} style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 16px", cursor:"pointer", userSelect:"none", background:"#1a1228", transition:"background .12s" }}
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
                      <button onClick={e=>{e.stopPropagation(); setEditingSessionId(s.id); setEditSessionForm({title:s.title, year:s.year||"", month:s.month||"", day:s.day||""});}}
                        style={{ background:"none", border:"none", color:"#4a3a6a", cursor:"pointer", fontSize:13, padding:"2px 6px", flexShrink:0, transition:"color .12s" }}
                        onMouseEnter={e=>e.currentTarget.style.color="#9a7fe0"} onMouseLeave={e=>e.currentTarget.style.color="#4a3a6a"}>✏️</button>
                      <button onClick={e=>{e.stopPropagation(); setConfirmDeleteId(s.id);}}
                        style={{ background:"none", border:"none", color:"#3a2020", cursor:"pointer", fontSize:14, padding:"2px 4px", flexShrink:0, transition:"color .12s" }}
                        onMouseEnter={e=>e.currentTarget.style.color="#c06060"} onMouseLeave={e=>e.currentTarget.style.color="#3a2020"}>🗑️</button>
                    </div>

                    {!collapsed[s.id] && (
                      <div style={{ borderTop:"1px solid #1e1630" }}>
                        <div style={{ padding:"10px 12px 6px", display:"flex", gap:8 }}>
                          <textarea
                            value={newEventText[s.id]||""}
                            onChange={e=>setNewEventText(p=>({...p,[s.id]:e.target.value}))}
                            onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); addSessionEvent(s.id); } }}
                            placeholder="Add event… (Enter to add, Shift+Enter for new line)"
                            rows={2}
                            style={{ ...ghostInput, flex:1, resize:"vertical", lineHeight:1.5, boxSizing:"border-box", fontSize:12 }}
                          />
                          <button onClick={()=>addSessionEvent(s.id)} style={{ ...btnSecondary, fontSize:12, padding:"6px 12px", flexShrink:0, alignSelf:"flex-end" }}>Add</button>
                        </div>
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
                                        <button onClick={saveEditSessionEvent} style={{ ...btnPrimary, flex:1, fontSize:12, padding:"4px 10px" }}>Save</button>
                                        <button onClick={()=>setEditingEventId(null)} style={{ ...btnSecondary, flex:1, fontSize:12, padding:"4px 10px" }}>Cancel</button>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div style={{ fontSize:13, color:"#c8b89a", lineHeight:1.6, overflowWrap:"break-word", wordBreak:"break-word", whiteSpace:"pre-wrap" }}>{ev.text}</div>
                                      <div style={{ marginTop:6, display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                                        {linkedStory ? (
                                          <>
                                            <span
                                              onClick={e=>{ if(!onOpenStory) return; if(e.ctrlKey||e.metaKey){e.preventDefault();onOpenStory(linkedStory,ev.linkedEventId,{newTab:true});}else{onOpenStory(linkedStory,ev.linkedEventId);} }}
                                              onAuxClick={e=>{ if(e.button===1&&onOpenStory){e.preventDefault();onOpenStory(linkedStory,ev.linkedEventId,{newTab:true});} }}
                                              style={{ fontSize:11, color:"#9a7fe0", background:"#5a3da022", border:"1px solid #5a3da066", borderRadius:20, padding:"2px 10px", cursor:"pointer", fontWeight:600 }}
                                              onMouseEnter={e=>e.currentTarget.style.background="#5a3da044"}
                                              onMouseLeave={e=>e.currentTarget.style.background="#5a3da022"}>
                                              🔗 {linkedStory.name}
                                            </span>
                                            {confirmUnlink?.sessionId===s.id && confirmUnlink?.sessionEventId===ev.id ? (
                                              <>
                                                <button onMouseDown={()=>unlinkFromTimeline(s.id, ev.id)} style={{ background:"#6b1a1a", color:"#e8d5b7", border:"none", borderRadius:4, padding:"2px 8px", cursor:"pointer", fontSize:11 }}>Unlink</button>
                                                <button onMouseDown={()=>setConfirmUnlink(null)} style={{ ...btnSecondary, padding:"2px 8px", fontSize:11 }}>Cancel</button>
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
                                {!isEditing && (
                                  <button onClick={()=>{ setEditingEventId({sessionId:s.id, eventId:ev.id}); setEditEventText(ev.text); }}
                                    style={{ background:"none", border:"none", color:"#4a3a6a", cursor:"pointer", fontSize:12, padding:"2px 4px", flexShrink:0, transition:"color .12s" }}
                                    onMouseEnter={e=>e.currentTarget.style.color="#9a7fe0"} onMouseLeave={e=>e.currentTarget.style.color="#4a3a6a"}>✏️</button>
                                )}
                                {confirmDeleteEvt?.sessionId===s.id && confirmDeleteEvt?.eventId===ev.id ? (
                                  <>
                                    <button onClick={()=>{ deleteSessionEvent(s.id, ev.id); setConfirmDeleteEvt(null); }} style={{ background:"#6b1a1a", color:"#e8d5b7", border:"none", borderRadius:4, padding:"2px 8px", cursor:"pointer", fontSize:11, flexShrink:0 }}>Delete</button>
                                    <button onClick={()=>setConfirmDeleteEvt(null)} style={{ ...btnSecondary, padding:"2px 8px", fontSize:11, flexShrink:0 }}>✕</button>
                                  </>
                                ) : (
                                  <button onClick={()=>setConfirmDeleteEvt({sessionId:s.id, eventId:ev.id})}
                                    style={{ background:"none", border:"none", color:"#2a1f3a", cursor:"pointer", fontSize:12, padding:"2px 4px", flexShrink:0, transition:"color .12s" }}
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

      {timelineModal && <StoryPickerModal stories={stories||[]} storyStatuses={storyStatuses} onClose={()=>setTimelineModal(null)} onSelect={onStorySelected}/>}
      {timelineEventModal && <EventModal event={timelineEventModal.prefill} chars={(chars||[]).filter(c=>c.type==="main"||c.type==="side"||c.type==="player")} onClose={()=>setTimelineEventModal(null)} onSave={saveToTimeline} currentTimelineDate={latestTimelineDate}/>}
    </div>
  );
}

export default memo(SessionLogTabContent);
