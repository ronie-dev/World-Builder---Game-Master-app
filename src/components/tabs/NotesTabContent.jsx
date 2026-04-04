import { useState, useEffect, useRef, memo } from "react";
import { btnPrimary, btnSecondary, ghostInput, inputStyle } from "../../constants.js";
import { uid } from "../../utils.jsx";
import Avatar from "../Avatar.jsx";
import EventModal from "../EventModal.jsx";
import HookCard from "../HookCard.jsx";
// ── Hook preview (rows model, with legacy fallback) ───────────────────────────
const _EI = { character:"👤", faction:"⚑", location:"📍", story:"📜", artifact:"⚗️" };
function HookBlocksPreview({ hook }) {
  const rows = hook.rows
    || (hook.blocks ? hook.blocks.filter(b=>b.type==="text").map(b=>({ text:b.content, entities:[] })) : null)
    || (hook.description ? [{ text:hook.description, entities:[] }] : []);
  if (!rows.length) return null;
  return (
    <div style={{ marginBottom:8 }}>
      {rows.slice(0,3).map((r,i) => (
        <div key={i}>
          {r.text && <div style={{ fontSize:12, color:"#9a8272", lineHeight:1.55, whiteSpace:"pre-wrap" }}>{r.text}</div>}
          {(r.entities||[]).slice(0,3).map((e,j) =>
            <span key={j} style={{ display:"inline-flex", alignItems:"center", gap:3, background:"#1a1230", border:"1px solid #3a2a5a", borderRadius:10, padding:"1px 7px 1px 5px", fontSize:11, color:"#c8b89a", marginRight:4, marginBottom:2 }}>{_EI[e.entityType]} {e.name}</span>
          )}
        </div>
      ))}
    </div>
  );
}

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

// ── Story picker modal (first step of "Add to Timeline") ──────────────────────
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
            style={{ ...inputStyle, paddingLeft:30 }}/>
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
        <button onClick={onClose} style={{ ...btnSecondary, marginTop:14, width:"100%" }}>Cancel</button>
      </div>
    </div>
  );
}

// ── Notes Tab ─────────────────────────────────────────────────────────────────
function NotesTabContent({ notes, setNotes, chars, factions, locations, stories, artifacts, setStories, onOpenStory, onOpenChar, onPinHook, onPinCharHook, hookStatuses, storyStatuses, onUpdateStory, onUpdateChar }) {
  const [addingSession, setAddingSession] = useState(false);
  const [sessionForm, setSessionForm] = useState({ title:"", year:"", month:"", day:"" });
  const [collapsed, setCollapsed] = useState({});
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editSessionForm, setEditSessionForm] = useState({ title:"", year:"", month:"", day:"" });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const dragItemRef = useRef(null);
  const [dragOverItemKey, setDragOverItemKey] = useState(null);
  const scratchRef = useRef(null);
  const [newEventText, setNewEventText] = useState({});
  const [editingEventId, setEditingEventId] = useState(null);
  const [editEventText, setEditEventText] = useState("");
  const [timelineModal, setTimelineModal] = useState(null);
  const [timelineEventModal, setTimelineEventModal] = useState(null);
  const [confirmUnlink, setConfirmUnlink] = useState(null);
  const [confirmDeleteEvt, setConfirmDeleteEvt] = useState(null);

  useEffect(() => {
    const el = scratchRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [notes.scratch]);

  const allChars = (chars||[]).filter(c => c.type === "main" || c.type === "side" || c.type === "player");

  // ── GM Hooks (notes-tab hooks) ────────────────────────────────────────────
  const gmHooks      = notes.hooks || [];
  const gmHookStatuses = hookStatuses || [];
  const gmColorMap   = Object.fromEntries(gmHookStatuses.map(s => [s.name, s.color]));
  const defaultStatus = gmHookStatuses[0]?.name || "Potential";

  const addGmHook = () => setNotes(n => ({
    ...n,
    hooks: [...(n.hooks||[]), { id:uid(), title:"New hook", status:defaultStatus, blocks:[] }]
  }));
  const updateGmHook = updated => {
    setNotes(n => ({ ...n, hooks: (n.hooks||[]).map(h => h.id === updated.id ? updated : h) }));
    // Keep story copy in sync
    if (updated.linkedStoryId) {
      setStories(prev => prev.map(st => st.id === updated.linkedStoryId
        ? { ...st, hooks: (st.hooks||[]).map(h => h.id === updated.id ? updated : h) }
        : st
      ));
    }
  };
  const removeGmHook = id => {
    const hook = (notes.hooks||[]).find(h => h.id === id);
    if (hook?.linkedStoryId) {
      setStories(prev => prev.map(st => st.id === hook.linkedStoryId
        ? { ...st, hooks: (st.hooks||[]).filter(h => h.id !== id) }
        : st
      ));
    }
    setNotes(n => ({ ...n, hooks: (n.hooks||[]).filter(h => h.id !== id) }));
  };
  const linkGmHookStory = (hookId, storyId) => {
    const hook = (notes.hooks||[]).find(h => h.id === hookId);
    setNotes(n => ({ ...n, hooks: (n.hooks||[]).map(h => h.id===hookId ? {...h, linkedStoryId:storyId} : h) }));
    // Add to story's hooks so it shows up in the story panel
    if (hook) {
      setStories(prev => prev.map(st => st.id === storyId
        ? { ...st, hooks: [...(st.hooks||[]).filter(h => h.id !== hookId), {...hook, linkedStoryId:storyId}] }
        : st
      ));
    }
  };
  const unlinkGmHookStory = (hookId) => {
    const hook = (notes.hooks||[]).find(h => h.id === hookId);
    if (hook?.linkedStoryId) {
      setStories(prev => prev.map(st => st.id === hook.linkedStoryId
        ? { ...st, hooks: (st.hooks||[]).filter(h => h.id !== hookId) }
        : st
      ));
    }
    setNotes(n => ({ ...n, hooks: (n.hooks||[]).map(h => h.id===hookId ? {...h, linkedStoryId:null} : h) }));
  };

  // ── Unified hook list order (GM hooks + pinned, all reorderable together) ──
  const getHookListOrder = (n) => {
    const stored = (n||notes).hookListOrder || [];
    const gmIds  = new Set(((n||notes).hooks||[]).map(h=>h.id));
    const pinIds = new Set(((n||notes).pins||[]).filter(p=>p.hookPin||p.charHookPin).map(p=>p.id));
    const valid  = stored.filter(x => (x.kind==="gm"&&gmIds.has(x.id)) || (x.kind==="pin"&&pinIds.has(x.id)));
    const orderedGm  = new Set(valid.filter(x=>x.kind==="gm").map(x=>x.id));
    const orderedPin = new Set(valid.filter(x=>x.kind==="pin").map(x=>x.id));
    const newItems = [
      ...((n||notes).hooks||[]).filter(h=>!orderedGm.has(h.id)).map(h=>({kind:"gm",id:h.id})),
      ...((n||notes).pins||[]).filter(p=>(p.hookPin||p.charHookPin)&&!orderedPin.has(p.id)).map(p=>({kind:"pin",id:p.id})),
    ];
    return [...valid, ...newItems];
  };
  const hookListOrder = getHookListOrder();

  const reorderHookList = (fromKey, toKey) => {
    if (!fromKey || fromKey === toKey) return;
    setNotes(n => {
      const order = getHookListOrder(n);
      const from = order.findIndex(x=>`${x.kind}:${x.id}`===fromKey);
      const to   = order.findIndex(x=>`${x.kind}:${x.id}`===toKey);
      if (from===-1||to===-1||from===to) return n;
      const next = [...order];
      const [item] = next.splice(from,1);
      next.splice(to,0,item);
      return {...n, hookListOrder:next};
    });
  };

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

  const addSessionEvent = (sessionId) => {
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

  const addToTimeline = (sessionId, sessionEventId) => { setTimelineModal({ sessionId, sessionEventId }); };

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

  const latestTimelineDate = (() => {
    const all = (stories||[]).flatMap(s=>s.events||[]).filter(e=>e.year);
    if (!all.length) return null;
    const latest = [...all].sort((a,b)=>{ const dy=(parseInt(b.year)||0)-(parseInt(a.year)||0); if(dy) return dy; const dm=(parseInt(b.month)||0)-(parseInt(a.month)||0); if(dm) return dm; return (parseInt(b.day)||0)-(parseInt(a.day)||0); })[0];
    return [latest.year,latest.month,latest.day].filter(Boolean).join(" / ");
  })();

  return (
    <div>
      <h1 style={{ fontFamily:"Georgia,serif", color:"#e8d5b7", margin:"0 0 6px", fontSize:26 }}>Notes</h1>
      <p style={{ color:"#5a4a7a", fontSize:13, margin:"0 0 28px" }}>Scratch pad, reminders, and session log — all auto-saved.</p>

      <div style={{ display:"flex", gap:24, alignItems:"flex-start" }}>
        {/* Left column: Pins + Scratch Pad */}
        <div style={{ flex:"1 1 320px", minWidth:260 }}>
          {/* GM Hooks */}
          <div style={{ background:"#13101f", border:"1px solid #2a1f3d", borderRadius:12, overflow:"hidden", marginBottom:20 }}>
            <div style={{ padding:"12px 18px", borderBottom:"1px solid #2a1f3d", display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ color:"#c8a96e", fontFamily:"Georgia,serif", fontSize:15, fontWeight:700 }}>📌 GM Hooks</span>
              <button onClick={addGmHook} style={{ marginLeft:"auto", fontSize:11, color:"#9a7fa0", background:"#1a1230", border:"1px solid #3a2a5a", borderRadius:6, padding:"3px 10px", cursor:"pointer" }}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#7c5cbf"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="#3a2a5a"}>+ New Hook</button>
            </div>
            {/* All hooks: GM + pinned, unified drag-to-reorder */}
            {hookListOrder.length === 0
              ? <div style={{ color:"#3a2a5a", fontSize:13, textAlign:"center", padding:"16px 18px" }}>No hooks yet. Add one to track plans, ideas, or upcoming scenes.</div>
              : (() => {
                  const statuses = hookStatuses || [];
                  const colorMap = Object.fromEntries(statuses.map(s=>[s.name, s.color]));
                  const handleStyle = { fontSize:18, color:"#c8a96e66", cursor:"grab", padding:"0 4px", flexShrink:0, lineHeight:1, userSelect:"none" };
                  return (
                    <div style={{ display:"flex", flexDirection:"column", gap:10, padding:10 }}>
                      {hookListOrder.map(entry => {
                        const itemKey = `${entry.kind}:${entry.id}`;
                        const isOver = dragOverItemKey === itemKey;
                        const wrapStyle = { display:"flex", alignItems:"center", gap:4, background:isOver?"#1a1535":"transparent", borderRadius:8, outline:isOver?"1px solid #3a2a5a":"none", transition:"background .1s" };
                        const wrapHandlers = {
                          onDragOver: e=>{ e.preventDefault(); setDragOverItemKey(itemKey); },
                          onDragLeave: ()=>setDragOverItemKey(null),
                          onDrop: e=>{ e.preventDefault(); reorderHookList(dragItemRef.current, itemKey); setDragOverItemKey(null); },
                        };
                        const handle = (
                          <span draggable
                            onDragStart={()=>{ dragItemRef.current=itemKey; }}
                            onDragEnd={()=>{ dragItemRef.current=null; setDragOverItemKey(null); }}
                            style={handleStyle}
                            onMouseEnter={e=>e.currentTarget.style.color="#c8a96e"}
                            onMouseLeave={e=>e.currentTarget.style.color="#c8a96e66"}>⠿</span>
                        );

                        if (entry.kind === "gm") {
                          const h = gmHooks.find(x=>x.id===entry.id);
                          if (!h) return null;
                          return (
                            <div key={itemKey} style={wrapStyle} {...wrapHandlers}>
                              {handle}
                              <div style={{ flex:1, minWidth:0 }}>
                                <HookCard hook={h}
                                  onUpdate={updateGmHook}
                                  onRemove={() => removeGmHook(h.id)}
                                  statuses={gmHookStatuses} colorMap={gmColorMap}
                                  chars={chars} factions={factions} locations={locations} stories={stories} artifacts={artifacts||[]}
                                  onLinkStory={storyId => linkGmHookStory(h.id, storyId)}
                                  onUnlinkStory={() => unlinkGmHookStory(h.id)}
                                />
                              </div>
                            </div>
                          );
                        }

                        if (entry.kind === "pin") {
                          const p = (notes.pins||[]).find(x=>x.id===entry.id);
                          if (!p) return null;
                          if (p.hookPin) {
                            const story = (stories||[]).find(s=>s.id===p.storyId);
                            const hook = story && (story.hooks||[]).find(h=>h.id===p.hookId);
                            if (!story || !hook) return null;
                            return (
                              <div key={itemKey} style={wrapStyle} {...wrapHandlers}>
                                {handle}
                                <div style={{ flex:1, minWidth:0 }}>
                                  <HookCard hook={hook}
                                    onUpdate={updated => onUpdateStory?.({...story, hooks:(story.hooks||[]).map(h=>h.id===updated.id?updated:h)})}
                                    onPin={() => onPinHook(story.id, hook.id)}
                                    isPinned={true}
                                    statuses={statuses} colorMap={colorMap}
                                    chars={chars} factions={factions} locations={locations} stories={stories} artifacts={artifacts||[]}
                                    sourceName={story.name}
                                    onOpenSource={() => onOpenStory(story, null, { storySubTab:"hooks" })}
                                  />
                                </div>
                              </div>
                            );
                          }
                          if (p.charHookPin) {
                            const ch = (chars||[]).find(c=>c.id===p.charId);
                            const hook = ch && (ch.hooks||[]).find(h=>h.id===p.hookId);
                            if (!ch || !hook) return null;
                            return (
                              <div key={itemKey} style={wrapStyle} {...wrapHandlers}>
                                {handle}
                                <div style={{ flex:1, minWidth:0 }}>
                                  <HookCard hook={hook}
                                    onUpdate={updated => onUpdateChar?.({...ch, hooks:(ch.hooks||[]).map(h=>h.id===updated.id?updated:h)})}
                                    onPin={() => onPinCharHook(ch.id, hook.id)}
                                    isPinned={true}
                                    statuses={statuses} colorMap={colorMap}
                                    chars={chars} factions={factions} locations={locations} stories={stories} artifacts={artifacts||[]}
                                    sourceName={ch.name}
                                    onOpenSource={() => onOpenChar(ch, { charSubTab:"hooks" })}
                                  />
                                </div>
                              </div>
                            );
                          }
                        }
                        return null;
                      })}
                    </div>
                  );
                })()
            }
          </div>


          {/* Scratch Pad */}
          <div style={{ background:"#13101f", border:"1px solid #2a1f3d", borderRadius:12, overflow:"hidden" }}>
            <div style={{ padding:"12px 18px", borderBottom:"1px solid #2a1f3d", display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ color:"#c8a96e", fontFamily:"Georgia,serif", fontSize:15, fontWeight:700 }}>✏️ Scratch Pad</span>
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
                style={{ ...btnPrimary, fontSize:12, padding:"5px 14px" }}>
                + New Session
              </button>
            </div>

            {addingSession && (
              <div style={{ padding:"14px 18px", borderBottom:"1px solid #2a1f3d", background:"#0d0b14" }}>
                <div style={{ marginBottom:10 }}>
                  <input value={sessionForm.title} onChange={e=>setSessionForm(f=>({...f,title:e.target.value}))} placeholder="Session title…"
                    style={{ ...inputStyle, marginBottom:8 }}/>
                  <div style={{ display:"flex", gap:8 }}>
                    <input value={sessionForm.year} onChange={e=>setSessionForm(f=>({...f,year:e.target.value}))} placeholder="Year"
                      style={{ ...inputStyle, flex:2 }}/>
                    <input value={sessionForm.month} onChange={e=>setSessionForm(f=>({...f,month:e.target.value}))} placeholder="Month"
                      style={{ ...inputStyle, flex:1 }}/>
                    <input value={sessionForm.day} onChange={e=>setSessionForm(f=>({...f,day:e.target.value}))} placeholder="Day"
                      style={{ ...inputStyle, flex:1 }}/>
                  </div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={saveSession} disabled={!sessionForm.title.trim()} style={{ ...btnPrimary, flex:1 }}>Create Session</button>
                  <button onClick={() => setAddingSession(false)} style={{ ...btnSecondary, flex:1 }}>Cancel</button>
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
                            style={{ ...inputStyle, marginBottom:8 }}/>
                          <div style={{ display:"flex", gap:8 }}>
                            <input value={editSessionForm.year} onChange={e=>setEditSessionForm(f=>({...f,year:e.target.value}))} placeholder="Year"
                              style={{ ...inputStyle, flex:2 }}/>
                            <input value={editSessionForm.month} onChange={e=>setEditSessionForm(f=>({...f,month:e.target.value}))} placeholder="Month"
                              style={{ ...inputStyle, flex:1 }}/>
                            <input value={editSessionForm.day} onChange={e=>setEditSessionForm(f=>({...f,day:e.target.value}))} placeholder="Day"
                              style={{ ...inputStyle, flex:1 }}/>
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
                          <button onClick={e=>{e.stopPropagation(); setEditingSessionId(s.id); setEditSessionForm({title:s.title, year:s.year||"", month:s.month||"", day:s.day||""}); }} style={{ background:"none", border:"none", color:"#4a3a6a", cursor:"pointer", fontSize:13, padding:"2px 6px", flexShrink:0, transition:"color .12s" }}
                            onMouseEnter={e=>e.currentTarget.style.color="#9a7fe0"} onMouseLeave={e=>e.currentTarget.style.color="#4a3a6a"}>✏️</button>
                          <button onClick={e=>{e.stopPropagation(); setConfirmDeleteId(s.id); }} style={{ background:"none", border:"none", color:"#3a2020", cursor:"pointer", fontSize:14, padding:"2px 4px", flexShrink:0, transition:"color .12s" }}
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
                                              <span onClick={()=>onOpenStory&&onOpenStory(linkedStory, ev.linkedEventId)}
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
                                  {!isEditing && <button onClick={()=>{ setEditingEventId({sessionId:s.id, eventId:ev.id}); setEditEventText(ev.text); }} style={{ background:"none", border:"none", color:"#4a3a6a", cursor:"pointer", fontSize:12, padding:"2px 4px", flexShrink:0, transition:"color .12s" }}
                                    onMouseEnter={e=>e.currentTarget.style.color="#9a7fe0"} onMouseLeave={e=>e.currentTarget.style.color="#4a3a6a"}>✏️</button>}
                                  {confirmDeleteEvt?.sessionId===s.id && confirmDeleteEvt?.eventId===ev.id ? (
                                    <>
                                      <button onClick={()=>{ deleteSessionEvent(s.id, ev.id); setConfirmDeleteEvt(null); }} style={{ background:"#6b1a1a", color:"#e8d5b7", border:"none", borderRadius:4, padding:"2px 8px", cursor:"pointer", fontSize:11, flexShrink:0 }}>Delete</button>
                                      <button onClick={()=>setConfirmDeleteEvt(null)} style={{ ...btnSecondary, padding:"2px 8px", fontSize:11, flexShrink:0 }}>✕</button>
                                    </>
                                  ) : (
                                    <button onClick={()=>setConfirmDeleteEvt({sessionId:s.id, eventId:ev.id})} style={{ background:"none", border:"none", color:"#2a1f3a", cursor:"pointer", fontSize:12, padding:"2px 4px", flexShrink:0, transition:"color .12s" }}
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
      {timelineEventModal && <EventModal event={timelineEventModal.prefill} chars={allChars} onClose={()=>setTimelineEventModal(null)} onSave={saveToTimeline} currentTimelineDate={latestTimelineDate}/>}
    </div>
  );
}

export default memo(NotesTabContent);
