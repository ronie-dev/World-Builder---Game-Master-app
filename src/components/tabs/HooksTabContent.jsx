import { useState, useRef, memo } from "react";
import { uid } from "../../utils.jsx";
import HookCard from "../HookCard.jsx";

// ── Main component ────────────────────────────────────────────────────────────
function HooksTabContent({ notes, setNotes, chars, factions, locations, stories, setStories, artifacts, hookStatuses, onOpenStory, onOpenChar, onPinHook, onPinCharHook, onUpdateStory, onUpdateChar }) {
  const dragItemRef = useRef(null);
  const [dragOverItemKey, setDragOverItemKey] = useState(null);

  const gmHooks = notes.hooks || [];
  const gmHookStatuses = hookStatuses || [];
  const gmColorMap = Object.fromEntries(gmHookStatuses.map(s => [s.name, s.color]));
  const defaultStatus = gmHookStatuses[0]?.name || "Potential";

  const addGmHook = () => setNotes(n => ({
    ...n,
    hooks: [{ id:uid(), title:"New hook", status:defaultStatus, blocks:[] }, ...(n.hooks||[])]
  }));

  const updateGmHook = updated => {
    setNotes(n => ({ ...n, hooks: (n.hooks||[]).map(h => h.id === updated.id ? updated : h) }));
    if (updated.linkedStoryId) {
      setStories(prev => prev.map(st => st.id === updated.linkedStoryId
        ? { ...st, hooks: (st.hooks||[]).map(h => h.id === updated.id ? updated : h) }
        : st
      ));
    }
  };

  const removeGmHook = id => {
    const hook = (notes.hooks||[]).find(h => h.id === id);
    // If linked: keep a standalone copy in the story (strip linkedStoryId), just remove from GM hooks
    if (hook?.linkedStoryId) {
      setStories(prev => prev.map(st => st.id === hook.linkedStoryId
        ? { ...st, hooks: (st.hooks||[]).map(h => h.id === id ? { ...h, linkedStoryId: null } : h) }
        : st
      ));
    }
    setNotes(n => ({ ...n, hooks: (n.hooks||[]).filter(h => h.id !== id) }));
  };

  const linkGmHookStory = (hookId, storyId) => {
    // Transfer: move hook to story.hooks (as proper story hook), remove from GM hooks
    setNotes(n => {
      const hook = (n.hooks||[]).find(h => h.id === hookId);
      if (!hook) return n;
      const storyHook = { ...hook };
      delete storyHook.linkedStoryId;
      setStories(prev => prev.map(st => st.id === storyId
        ? { ...st, hooks: [storyHook, ...(st.hooks||[]).filter(h => h.id !== hookId)] }
        : st
      ));
      const alreadyPinned = (n.pins||[]).some(p => p.hookPin && p.storyId === storyId && p.hookId === hookId);
      const pins = alreadyPinned ? (n.pins||[]) : [{ id: uid(), hookPin: true, storyId, hookId }, ...(n.pins||[])];
      return { ...n, hooks: n.hooks.filter(h => h.id !== hookId), pins };
    });
  };

  // Unified hook list order (GM hooks + pinned)
  const getHookListOrder = n => {
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
    return [...newItems, ...valid];
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

  const statuses = hookStatuses || [];
  const colorMap = Object.fromEntries(statuses.map(s=>[s.name, s.color]));
  const handleStyle = { fontSize:18, color:"#c8a96e66", cursor:"grab", padding:"0 4px", flexShrink:0, lineHeight:1, userSelect:"none" };

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"28px 32px" }}>
      <h1 style={{ fontFamily:"Georgia,serif", color:"#e8d5b7", margin:"0 0 6px", fontSize:26 }}>GM Hooks</h1>
      <p style={{ color:"#5a4a7a", fontSize:13, margin:"0 0 20px" }}>Plans, ideas, pinned hooks from stories and characters.</p>

      <div style={{ background:"#13101f", border:"1px solid #2a1f3d", borderRadius:12, overflow:"hidden" }}>
        <div style={{ padding:"12px 18px", borderBottom:"1px solid #2a1f3d", display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ color:"#c8a96e", fontFamily:"Georgia,serif", fontSize:15, fontWeight:700 }}>📌 Hooks</span>
          <button onClick={addGmHook}
            style={{ marginLeft:"auto", fontSize:11, color:"#9a7fa0", background:"#1a1230", border:"1px solid #3a2a5a", borderRadius:6, padding:"3px 10px", cursor:"pointer" }}
            onMouseEnter={e=>e.currentTarget.style.borderColor="#7c5cbf"}
            onMouseLeave={e=>e.currentTarget.style.borderColor="#3a2a5a"}>+ New Hook</button>
        </div>

        {hookListOrder.length === 0
          ? <div style={{ color:"#3a2a5a", fontSize:13, textAlign:"center", padding:"32px 18px" }}>No hooks yet. Add one to track plans, ideas, or upcoming scenes.</div>
          : (
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
                          onOpenLinkedStory={(s, opts={}) => onOpenStory(s, null, { storySubTab:"hooks", ...opts })}
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
          )
        }
      </div>
    </div>
  );
}

export default memo(HooksTabContent);
