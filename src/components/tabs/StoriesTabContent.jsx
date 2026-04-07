import { memo, useState, useRef, useEffect } from "react";
import { btnPrimary, btnSecondary, inputStyle } from "../../constants.js";
import Avatar from "../Avatar.jsx";
import Badge from "../Badge.jsx";
import StoryDetailPanel from "../StoryDetailPanel.jsx";
import { EmptyState } from "../ui.jsx";
import { highlight } from "../../utils.jsx";

// ── Compact story row ─────────────────────────────────────────────────────────
function StoryRow({ story, chars, isSelected, onSelect }) {
  const player = story.playerId ? chars.find(c => c.id === story.playerId) : null;
  const typeIcon = story.isMain ? "⭐" : player ? "🎲" : "📜";
  const evCount = (story.events||[]).length;
  return (
    <div onClick={() => onSelect(story)}
      style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 10px", borderRadius:6, cursor:"pointer", background:isSelected?"#1e1535":"transparent", borderLeft:`2px solid ${isSelected?"#7c5cbf":"transparent"}`, transition:"background .1s" }}
      onMouseEnter={e=>{ if(!isSelected) e.currentTarget.style.background="#13101e"; }}
      onMouseLeave={e=>{ if(!isSelected) e.currentTarget.style.background="transparent"; }}>
      {story.image
        ? <img src={story.image} alt="" style={{ width:22, height:22, borderRadius:4, objectFit:"cover", flexShrink:0 }}/>
        : <span style={{ fontSize:14, flexShrink:0 }}>{typeIcon}</span>}
      <span style={{ fontSize:13, color:"#e8d5b7", flex:1, minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
        {story.name}
      </span>
      {player && <Avatar src={player.image} name={player.name} size={16}/>}
      {story.status && <Badge label={story.status} color="#4a9a6a" small/>}
      {evCount > 0 && <span style={{ fontSize:10, color:"#5a4a7a", flexShrink:0 }}>⏳{evCount}</span>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
function StoriesTabContent({
  stories, chars, factions, locations, artifacts,
  storyStatuses, hookStatuses,
  storyQuery, storyStatusFilter,
  selectedStory, selectedStoryId,
  storySubTab, storyHighlightEventId,
  mainStory, playerStories, otherStories,
  currentTimelineDate,
  updPg,
  onNewStory, onDeleteStory, onCancelNew, onSetMain, onSetPlayerStory, onUpdateStory,
  onOpenChar, onOpenFaction, onOpenLocation, onOpenArtifact, onUpdateArtifacts,
  onAskConfirm, onCloseConfirm,
  onPinHook, pinnedHookIds, rarities,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!drawerOpen) return;
    const handler = e => { if (overlayRef.current && !overlayRef.current.contains(e.target)) setDrawerOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [drawerOpen]);

  const hasFilter = !!(storyQuery || storyStatusFilter);
  const allFiltered = [
    ...(mainStory ? [mainStory] : []),
    ...playerStories,
    ...otherStories,
  ];

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minHeight:0, position:"relative" }}>

      {/* ── Detail: fills full height ── */}
      <div style={{ position:"absolute", inset:0, overflowY:"auto", paddingTop:44 }}>
        {selectedStory
          ? <StoryDetailPanel
              key={selectedStory.id}
              story={selectedStory} chars={chars} factions={factions} locations={locations}
              onClose={() => updPg({ selectedStoryId: null })}
              onDelete={onDeleteStory} onSetMain={onSetMain} onSetPlayerStory={onSetPlayerStory}
              onOpenChar={onOpenChar} onOpenFaction={onOpenFaction} onOpenLocation={onOpenLocation}
              onUpdateStory={onUpdateStory} onAskConfirm={onAskConfirm} onCloseConfirm={onCloseConfirm}
              artifacts={artifacts} onUpdateArtifacts={onUpdateArtifacts} onOpenArtifact={onOpenArtifact}
              highlightEventId={storyHighlightEventId}
              onHighlightClear={() => updPg({ storyHighlightEventId: null })}
              subTab={storySubTab} onSubTabChange={v => updPg({ storySubTab: v })}
              storyStatuses={storyStatuses} hookStatuses={hookStatuses}
              currentTimelineDate={currentTimelineDate}
              onPinHook={onPinHook} pinnedHookIds={pinnedHookIds}
              onCancelNew={onCancelNew} rarities={rarities}/>
          : <EmptyState icon="📜" title="Select a story" subtitle="Search above or open the filter drawer"/>
        }
      </div>

      {/* ── Search overlay ── */}
      <div ref={overlayRef} style={{ position:"absolute", top:0, left:0, right:0, zIndex:10, background:"#0f0c1a", borderBottom: drawerOpen ? "1px solid #2a1f3d" : "none", boxShadow: drawerOpen ? "0 8px 32px #00000099" : "0 2px 12px #00000066" }}>
        {/* Top bar */}
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
            Filters{hasFilter ? " · 1" : ""} <span style={{ fontSize:9 }}>{drawerOpen?"▲":"▼"}</span>
          </button>
          {hasFilter && (
            <button onClick={() => updPg({ storyQuery:"", storyStatusFilter:"" })}
              style={{ padding:"4px 8px", borderRadius:6, border:"1px solid #6b1a1a", background:"transparent", color:"#c06060", fontSize:12, cursor:"pointer", flexShrink:0 }}>✕</button>
          )}
          <button onClick={onNewStory} style={{ ...btnPrimary, fontSize:12, padding:"4px 10px", flexShrink:0 }}>+ New</button>
        </div>

        {/* Drawer */}
        {drawerOpen && (
          <div style={{ borderTop:"1px solid #1e1630", maxHeight:320, display:"flex", flexDirection:"column" }}>
            {/* Status filter pills */}
            <div style={{ padding:"8px 12px", display:"flex", flexWrap:"wrap", gap:6, flexShrink:0, borderBottom:"1px solid #1e1630" }}>
              <button onClick={() => updPg({ storyStatusFilter:"" })}
                style={{ padding:"3px 10px", borderRadius:20, border:`1px solid ${!storyStatusFilter?"#7c5cbf":"#3a2a5a"}`, background:!storyStatusFilter?"#2a1a4a":"transparent", color:!storyStatusFilter?"#e8d5b7":"#6a5a8a", fontSize:12, cursor:"pointer" }}>
                All
              </button>
              {storyStatuses.map(s => (
                <button key={s.name} onClick={() => updPg({ storyStatusFilter: storyStatusFilter===s.name ? "" : s.name })}
                  style={{ padding:"3px 10px", borderRadius:20, border:`1px solid ${storyStatusFilter===s.name?"#7c5cbf":"#3a2a5a"}`, background:storyStatusFilter===s.name?"#2a1a4a":"transparent", color:storyStatusFilter===s.name?"#e8d5b7":"#6a5a8a", fontSize:12, cursor:"pointer" }}>
                  {s.name}
                </button>
              ))}
            </div>
            {/* Compact list */}
            <div style={{ overflowY:"auto", flex:1 }}>
              {allFiltered.length === 0
                ? <div style={{ padding:"12px 16px", fontSize:12, color:"#5a4a7a" }}>No stories match.</div>
                : allFiltered.map(s => (
                    <StoryRow key={s.id} story={s} chars={chars}
                      isSelected={selectedStoryId===s.id}
                      onSelect={s => { updPg({ selectedStoryId: s.id, storyEditing: false }); setDrawerOpen(false); }}/>
                  ))
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(StoriesTabContent);
