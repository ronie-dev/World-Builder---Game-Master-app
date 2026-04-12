import { memo, useState, useRef, useEffect } from "react";
import { btnPrimary, inputStyle } from "../../constants.js";
import Avatar from "../Avatar.jsx";
import StoryDetailPanel from "../StoryDetailPanel.jsx";
import { EmptyState } from "../ui.jsx";
import { highlight } from "../../utils.jsx";

// ── Column header with searchable filter dropdown ─────────────────────────────
function ColHeader({ id, label, value, onChange, opts, style, openId, onOpen, alignRight }) {
  const [q, setQ] = useState("");
  const open = openId === id;
  const active = !!value;
  const selected = opts?.find(o => o.value === value);
  const filteredOpts = opts?.filter(o => !q || o.label.toLowerCase().includes(q.toLowerCase()));

  useEffect(() => { if (!open) setQ(""); }, [open]);

  return (
    <div style={{ position:"relative", ...style }}>
      <div onClick={() => opts && onOpen(open ? null : id)}
        style={{ display:"flex", alignItems:"center", gap:3, padding:"5px 8px", fontSize:11, fontWeight:700, letterSpacing:.5, textTransform:"uppercase", cursor:opts?"pointer":"default", userSelect:"none", color:active?"#c8a96e":"#5a4a7a", borderBottom:`2px solid ${active?"#7c5cbf":"#2a1f3d"}`, whiteSpace:"nowrap", overflow:"hidden" }}>
        <span style={{ overflow:"hidden", textOverflow:"ellipsis" }}>{active ? `${label}: ${selected?.label||value}` : label}</span>
        {opts && <span style={{ fontSize:8, opacity:.6, flexShrink:0 }}>{open?"▴":"▾"}</span>}
      </div>
      {open && opts && (
        <div onMouseDown={e=>e.stopPropagation()} style={{ position:"absolute", top:"100%", [alignRight?"right":"left"]:0, zIndex:300, background:"#1a1228", border:"1px solid #3a2a5a", borderRadius:8, boxShadow:"0 6px 24px #00000099", minWidth:160, overflow:"hidden" }}>
          <div style={{ padding:"6px 8px", borderBottom:"1px solid #2a1f3d" }}>
            <input autoFocus placeholder="Search…" value={q} onChange={e=>setQ(e.target.value)}
              onKeyDown={e=>e.key==="Escape"&&onOpen(null)}
              style={{ ...inputStyle, fontSize:11, padding:"3px 8px", width:"100%", boxSizing:"border-box" }}/>
          </div>
          <div style={{ maxHeight:200, overflowY:"auto" }}>
            <div onMouseDown={() => { onChange(""); onOpen(null); }}
              style={{ padding:"6px 12px", fontSize:12, color:!value?"#c8a96e":"#9a7fa0", cursor:"pointer" }}
              onMouseEnter={e=>e.currentTarget.style.background="#1e1630"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              All
            </div>
            {filteredOpts.map(o => (
              <div key={o.value} onMouseDown={() => { onChange(o.value); onOpen(null); }}
                style={{ padding:"6px 12px", fontSize:12, color:value===o.value?"#c8a96e":"#9a7fa0", cursor:"pointer", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}
                onMouseEnter={e=>e.currentTarget.style.background="#1e1630"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                {o.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Table row ─────────────────────────────────────────────────────────────────
function TableRow({ story, chars, storyStatuses, isSelected, onSelect, query }) {
  const player = story.playerId ? chars.find(c => c.id === story.playerId) : null;
  const typeLabel = story.isMain ? "⭐ Main" : player ? "🎲 Player" : "📜 Story";
  const statusColor = storyStatuses?.find(s => s.name === story.status)?.color;
  const evCount = (story.events||[]).length;
  return (
    <div onClick={() => onSelect(story)}
      style={{ display:"flex", alignItems:"center", borderBottom:"1px solid #13101e", cursor:"pointer", background:isSelected?"#1e1535":"transparent", borderLeft:`2px solid ${isSelected?"#7c5cbf":"transparent"}`, transition:"background .08s" }}
      onMouseEnter={e=>{ if(!isSelected) e.currentTarget.style.background="#13101e"; }}
      onMouseLeave={e=>{ if(!isSelected) e.currentTarget.style.background="transparent"; }}>
      {/* Name */}
      <div style={{ flex:1, display:"flex", alignItems:"center", gap:6, padding:"5px 8px", minWidth:0 }}>
        {story.image
          ? <img src={story.image} alt="" style={{ width:20, height:20, borderRadius:3, objectFit:"cover", flexShrink:0 }}/>
          : <span style={{ fontSize:13, flexShrink:0 }}>{story.isMain?"⭐":player?"🎲":"📜"}</span>}
        <span style={{ fontSize:13, color:"#e8d5b7", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {highlight(story.name, query)}
        </span>
        {evCount > 0 && <span style={{ fontSize:10, color:"#5a4a7a", flexShrink:0 }}>⏳{evCount}</span>}
      </div>
      {/* Status */}
      <div style={{ width:80, padding:"5px 6px", fontSize:11, color:statusColor||"#5a4a7a", flexShrink:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
        {story.status||"—"}
      </div>
      {/* Player */}
      <div style={{ width:90, padding:"5px 6px", fontSize:11, color:"#c8a96e", flexShrink:0, display:"flex", alignItems:"center", gap:4, overflow:"hidden" }}>
        {player ? <><Avatar src={player.image} name={player.name} size={16}/><span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{player.name}</span></> : <span style={{ color:"#3a2a5a" }}>—</span>}
      </div>
      {/* Type */}
      <div style={{ width:72, padding:"5px 6px", fontSize:11, color:"#9a7fa0", flexShrink:0 }}>
        {typeLabel}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
function StoriesTabContent({
  stories, chars, factions, locations, artifacts,
  storyStatuses, hookStatuses,
  storyQuery, storyStatusFilter,
  selectedStory, selectedStoryId,
  storyHighlightEventId,
  mainStory, playerStories, otherStories,
  currentTimelineDate,
  updPg,
  onNewStory, onDeleteStory, onCancelNew, onSetMain, onSetPlayerStory, onUpdateStory,
  onOpenChar, onOpenFaction, onOpenLocation, onOpenArtifact, onUpdateArtifacts,
  onAskConfirm, onCloseConfirm,
  onPinHook, pinnedHookIds, rarities,
}) {
  const [drawerOpen, setDrawerOpen] = useState(!selectedStoryId);
  const [typeFilter, setTypeFilter] = useState("");
  const [openCol, setOpenCol] = useState(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!drawerOpen) return;
    const handler = e => {
      if (overlayRef.current && !overlayRef.current.contains(e.target)) setDrawerOpen(false);
      setOpenCol(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [drawerOpen]);

  // Order: main first, then players, then others — apply type filter locally
  const allFiltered = [
    ...(mainStory ? [mainStory] : []),
    ...playerStories,
    ...otherStories,
  ].filter(s => {
    if (!typeFilter) return true;
    if (typeFilter === "main") return !!s.isMain;
    if (typeFilter === "player") return !s.isMain && !!s.playerId;
    if (typeFilter === "other") return !s.isMain && !s.playerId;
    return true;
  });

  const hasFilter = !!(storyQuery || storyStatusFilter || typeFilter);
  const filterCount = (storyQuery?1:0) + (storyStatusFilter?1:0) + (typeFilter?1:0);

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minHeight:0, position:"relative" }}>

      {/* ── Detail panel ── */}
      <div style={{ position:"absolute", inset:0, overflowY:"auto", paddingTop:44 }}>
        {selectedStory
          ? <StoryDetailPanel
              key={selectedStory.id}
              story={selectedStory} chars={chars} factions={factions} locations={locations}
              onClose={() => { updPg({ selectedStoryId: null }); setDrawerOpen(true); }}
              onDelete={onDeleteStory} onSetMain={onSetMain} onSetPlayerStory={onSetPlayerStory}
              onOpenChar={onOpenChar} onOpenFaction={onOpenFaction} onOpenLocation={onOpenLocation}
              onUpdateStory={onUpdateStory} onAskConfirm={onAskConfirm} onCloseConfirm={onCloseConfirm}
              artifacts={artifacts} onUpdateArtifacts={onUpdateArtifacts} onOpenArtifact={onOpenArtifact}
              highlightEventId={storyHighlightEventId}
              onHighlightClear={() => updPg({ storyHighlightEventId: null })}
              storyStatuses={storyStatuses} hookStatuses={hookStatuses}
              currentTimelineDate={currentTimelineDate}
              onPinHook={onPinHook} pinnedHookIds={pinnedHookIds}
              onCancelNew={onCancelNew} rarities={rarities}/>
          : <EmptyState icon="📜" title="Select a story" subtitle="Search above or open the filter drawer"/>
        }
      </div>

      {/* ── Search overlay ── */}
      <div ref={overlayRef} style={{ position:"absolute", top:0, left:0, right:0, zIndex:10, background:"#0f0c1a", borderBottom: drawerOpen ? "1px solid #2a1f3d" : "none", boxShadow: drawerOpen ? "0 8px 32px #00000099" : "0 2px 12px #00000066" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 12px" }}>
          <div style={{ flex:1, position:"relative" }}>
            <span style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", color:"#5a4a7a", fontSize:13, pointerEvents:"none" }}>🔍</span>
            <input
              placeholder="Search stories…"
              value={storyQuery}
              onChange={e => { updPg({ storyQuery: e.target.value }); if (!drawerOpen) setDrawerOpen(true); }}
              onFocus={() => setDrawerOpen(true)}
              style={{ ...inputStyle, paddingLeft:30, fontSize:13, width:"100%", boxSizing:"border-box" }}/>
          </div>
          <button onClick={() => setDrawerOpen(o => !o)}
            style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 10px", borderRadius:6, border:`1px solid ${drawerOpen||hasFilter?"#7c5cbf":"#3a2a5a"}`, background:drawerOpen||hasFilter?"#2a1a4a":"transparent", color:drawerOpen||hasFilter?"#e8d5b7":"#6a5a8a", fontSize:12, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>
            {filterCount > 0 ? `Filters · ${filterCount}` : "Filters"} <span style={{ fontSize:9 }}>{drawerOpen?"▲":"▼"}</span>
          </button>
          {hasFilter && (
            <button onClick={() => { updPg({ storyQuery:"", storyStatusFilter:"" }); setTypeFilter(""); }}
              style={{ padding:"4px 8px", borderRadius:6, border:"1px solid #6b1a1a", background:"transparent", color:"#c06060", fontSize:12, cursor:"pointer", flexShrink:0 }}>✕</button>
          )}
          <button onClick={onNewStory} style={{ ...btnPrimary, fontSize:12, padding:"4px 10px", flexShrink:0 }}>+ New</button>
        </div>

        {/* ── Drawer ── */}
        {drawerOpen && (
          <div style={{ borderTop:"1px solid #1e1630", maxHeight:360, display:"flex", flexDirection:"column" }}>

            {/* Table */}
            <div style={{ display:"flex", flexDirection:"column", flex:1, minHeight:0 }}>
              {/* Column headers */}
              <div style={{ display:"flex", alignItems:"stretch", background:"#0d0b17", flexShrink:0, borderBottom:"1px solid #1e1630" }}>
                <ColHeader id="name" label="Name" openId={openCol} onOpen={setOpenCol} style={{ flex:1, minWidth:0 }}/>
                <ColHeader id="status" label="Status" value={storyStatusFilter}
                  onChange={v => updPg({ storyStatusFilter: v })}
                  opts={storyStatuses.map(s => ({ value:s.name, label:s.name }))}
                  openId={openCol} onOpen={setOpenCol}
                  style={{ width:80, flexShrink:0 }}/>
                <ColHeader id="player" label="Player" value={""} onChange={()=>{}}
                  opts={chars.filter(c=>c.type==="player").map(c=>({ value:c.id, label:c.name }))}
                  openId={openCol} onOpen={setOpenCol} alignRight
                  style={{ width:90, flexShrink:0 }}/>
                <ColHeader id="type" label="Type" value={typeFilter}
                  onChange={setTypeFilter}
                  opts={[{ value:"main", label:"⭐ Main" }, { value:"player", label:"🎲 Player" }, { value:"other", label:"📜 Story" }]}
                  openId={openCol} onOpen={setOpenCol} alignRight
                  style={{ width:72, flexShrink:0 }}/>
              </div>

              {/* Rows */}
              <div style={{ overflowY:"auto", flex:1 }}>
                {allFiltered.length === 0
                  ? <div style={{ padding:"12px 16px", fontSize:12, color:"#5a4a7a" }}>No stories match.</div>
                  : (() => {
                      const featured = allFiltered.filter(s => s.isMain || s.playerId);
                      const others   = allFiltered.filter(s => !s.isMain && !s.playerId);
                      return <>
                        {featured.map(s => (
                          <TableRow key={s.id} story={s} chars={chars} storyStatuses={storyStatuses}
                            isSelected={selectedStoryId===s.id} query={storyQuery}
                            onSelect={s => { updPg({ selectedStoryId: s.id, storyEditing: false }); setDrawerOpen(false); }}/>
                        ))}
                        {featured.length > 0 && others.length > 0 && (
                          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"4px 8px", borderTop:"1px solid #2a1f3d", borderBottom:"1px solid #2a1f3d", background:"#0d0b17" }}>
                            <span style={{ fontSize:10, color:"#3a2a5a", letterSpacing:1, textTransform:"uppercase" }}>Stories</span>
                            <div style={{ flex:1, height:1, background:"#1e1630" }}/>
                          </div>
                        )}
                        {others.map(s => (
                          <TableRow key={s.id} story={s} chars={chars} storyStatuses={storyStatuses}
                            isSelected={selectedStoryId===s.id} query={storyQuery}
                            onSelect={s => { updPg({ selectedStoryId: s.id, storyEditing: false }); setDrawerOpen(false); }}/>
                        ))}
                      </>;
                    })()
                }
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(StoriesTabContent);
