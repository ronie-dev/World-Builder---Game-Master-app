import { memo } from "react";
import { btnPrimary, btnSecondary, inputStyle, selStyle, STATUS_COLORS } from "../../constants.js";
import Avatar from "../Avatar.jsx";
import Badge from "../Badge.jsx";
import StoryDetailPanel from "../StoryDetailPanel.jsx";
import { EmptyState, CardRow, MiniChip } from "../ui.jsx";

function StoryCard({ story, chars, factions, locations, isSelected, onSelect }) {
  const linkedChars = chars.filter(c => story.characterIds.includes(c.id) && (c.type==="main"||c.type==="player"));
  const evCount = (story.events||[]).length;
  const facCount = (story.factionIds||[]).filter(id => (factions||[]).some(f=>f.id===id)).length;
  const locCount = (story.locationIds||[]).filter(id => (locations||[]).some(l=>l.id===id)).length;
  return (
    <CardRow isSelected={isSelected} onClick={()=>onSelect(story)}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
        {story.image&&<div style={{ width:56, height:56, borderRadius:6, overflow:"hidden", flexShrink:0, border:"1px solid #3a2a5a" }}><img src={story.image} alt={story.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/></div>}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
            <span style={{ color:"#e8d5b7", fontWeight:700, fontSize:15, fontFamily:"Georgia,serif" }}>{story.name}</span>
            {story.status&&<Badge label={story.status} color={STATUS_COLORS[story.status]}/>}
            {evCount>0&&<span style={{ fontSize:11, color:"#7c5cbf", background:"#7c5cbf18", borderRadius:4, padding:"2px 7px" }}>⏳ {evCount} event{evCount!==1?"s":""}</span>}
            {facCount>0&&<span style={{ fontSize:11, color:"#9a7fa0", background:"#9a7fa018", borderRadius:4, padding:"2px 7px" }}>⚑ {facCount}</span>}
            {locCount>0&&<span style={{ fontSize:11, color:"#9a7fa0", background:"#9a7fa018", borderRadius:4, padding:"2px 7px" }}>📍 {locCount}</span>}
          </div>
          {story.summary&&<p style={{ margin:"0 0 8px", fontSize:13, color:"#9a7fa0", lineHeight:1.5 }}>{story.summary}</p>}
          {linkedChars.length>0&&(
            <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
              {linkedChars.map(c=>(
                <MiniChip key={c.id}>
                  <Avatar src={c.image} name={c.name} size={18}/><span style={{ fontSize:11, color:"#9a7fa0" }}>{c.name}</span>
                </MiniChip>
              ))}
            </div>
          )}
        </div>
        {story.isMain&&<span style={{ fontSize:16, flexShrink:0 }}>⭐</span>}
      </div>
    </CardRow>
  );
}

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
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minHeight:0, padding:"28px 32px 0" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18, flexShrink:0 }}>
        <h1 style={{ fontFamily:"Georgia,serif", color:"#e8d5b7", margin:0, fontSize:26 }}>Stories</h1>
        <button onClick={onNewStory} style={btnPrimary}>+ New Story</button>
      </div>
      <div style={{ flex:1, display:"flex", gap:24, overflow:"hidden", minHeight:0, paddingBottom:28 }}>
        <div style={{ flex:1, minWidth:0, overflowY:"auto", paddingRight:12 }}>
          <div style={{ display:"flex", gap:10, marginBottom:18, alignItems:"center" }}>
            <div style={{ position:"relative", flex:1 }}>
              <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#5a4a7a", fontSize:13 }}>🔍</span>
              <input placeholder="Search stories…" value={storyQuery} onChange={e=>updPg({storyQuery:e.target.value})} style={{...inputStyle,paddingLeft:30,fontSize:13}}/>
            </div>
            <select value={storyStatusFilter} onChange={e=>updPg({storyStatusFilter:e.target.value})} style={{...selStyle,width:"auto",minWidth:130,fontSize:13}}>
              <option value="">All Statuses</option>
              {storyStatuses.map(s=><option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
            {(storyQuery||storyStatusFilter)&&<button onClick={()=>updPg({storyQuery:"",storyStatusFilter:""})} style={{...btnSecondary,fontSize:12,padding:"7px 10px",whiteSpace:"nowrap"}}>✕ Clear</button>}
          </div>
          <div style={{ marginBottom:24 }}>
            <h2 style={{ color:"#c8a96e", fontFamily:"Georgia,serif", margin:"0 0 12px", fontSize:17 }}>⭐ Main Story</h2>
            {mainStory
              ? <StoryCard story={mainStory} chars={chars} factions={factions} locations={locations} isSelected={selectedStory?.id===mainStory.id} onSelect={s=>updPg({ selectedStoryId: selectedStoryId===s.id?null:s.id, storyEditing: false })}/>
              : <div style={{ textAlign:"center", padding:"28px 0", color:"#5a4a7a", border:"1px dashed #3a2a5a", borderRadius:8, fontSize:13 }}>No main story set.<br/><span style={{ fontSize:12 }}>Open a story and click "☆" in its header to set it as main.</span></div>}
          </div>
          {playerStories.length>0&&(
            <>
              <div style={{ height:1, background:"#2a1f3d", marginBottom:24 }}/>
              <div style={{ marginBottom:24 }}>
                <h2 style={{ color:"#c8a96e", fontFamily:"Georgia,serif", margin:"0 0 12px", fontSize:17 }}>🎲 Player Stories</h2>
                <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
                  {chars.filter(c=>c.type==="player"&&playerStories.some(s=>s.playerId===c.id)).flatMap(player=>
                    playerStories.filter(s=>s.playerId===player.id).map(s=>{
                      const sel=selectedStory?.id===s.id;
                      return (
                        <CardRow key={s.id} isSelected={sel} onClick={()=>updPg({ selectedStoryId: selectedStoryId===s.id?null:s.id, storyEditing: false })} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"10px 14px", flex:"1 1 220px", minWidth:0 }}>
                          {s.image&&<div style={{ width:44, height:44, borderRadius:6, overflow:"hidden", flexShrink:0, border:"1px solid #3a2a5a" }}><img src={s.image} alt={s.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/></div>}
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:3 }}>
                              <Avatar src={player.image} name={player.name} size={14}/>
                              <span style={{ fontSize:11, color:"#c8b89a", fontWeight:700 }}>{player.name}</span>
                            </div>
                            <div style={{ color:"#e8d5b7", fontWeight:700, fontSize:13, fontFamily:"Georgia,serif", marginBottom:3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{s.name}</div>
                            {s.summary&&<p style={{ margin:0, fontSize:11, color:"#9a7fa0", lineHeight:1.4, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{s.summary}</p>}
                          </div>
                        </CardRow>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
          <div style={{ height:1, background:"#2a1f3d", marginBottom:24 }}/>
          <div>
            <h2 style={{ color:"#c8a96e", fontFamily:"Georgia,serif", margin:"0 0 12px", fontSize:17 }}>📜 Stories <span style={{ fontSize:12, color:"#7c5cbf" }}>({otherStories.length})</span></h2>
            {stories.length===0
              ? <div style={{ textAlign:"center", padding:"40px 0", color:"#5a4a7a", border:"1px dashed #3a2a5a", borderRadius:8, fontSize:13 }}>No stories yet.<br/><span style={{ fontSize:12 }}>Click "+ New Story" to create your first story.</span></div>
              : otherStories.length===0
                ? <div style={{ textAlign:"center", padding:"28px 0", color:"#5a4a7a", fontSize:13 }}>All stories are linked to players or set as main.</div>
                : <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {otherStories.map(s=>(
                      <StoryCard key={s.id} story={s} chars={chars} factions={factions} locations={locations} isSelected={selectedStory?.id===s.id}
                        onSelect={s=>updPg({ selectedStoryId: selectedStoryId===s.id?null:s.id, storyEditing: false })}/>
                    ))}
                  </div>}
          </div>
        </div>
        <div style={{ flex:1, minWidth:0, overflowY:"auto" }}>
          {selectedStory
            ? <StoryDetailPanel
                key={selectedStory.id}
                story={selectedStory} chars={chars} factions={factions} locations={locations}
                onClose={()=>updPg({ selectedStoryId: null })}
                onDelete={onDeleteStory} onSetMain={onSetMain} onSetPlayerStory={onSetPlayerStory}
                onOpenChar={onOpenChar} onOpenFaction={onOpenFaction} onOpenLocation={onOpenLocation}
                onUpdateStory={onUpdateStory} onAskConfirm={onAskConfirm} onCloseConfirm={onCloseConfirm}
                artifacts={artifacts} onUpdateArtifacts={onUpdateArtifacts} onOpenArtifact={onOpenArtifact}
                highlightEventId={storyHighlightEventId}
                onHighlightClear={()=>updPg({ storyHighlightEventId: null })}
                subTab={storySubTab} onSubTabChange={v=>updPg({ storySubTab: v })}
                storyStatuses={storyStatuses} hookStatuses={hookStatuses}
                currentTimelineDate={currentTimelineDate}
                onPinHook={onPinHook} pinnedHookIds={pinnedHookIds}
                onCancelNew={onCancelNew} rarities={rarities}/>
            : <EmptyState icon="📜" title="Select a story to view details"/>}
        </div>
      </div>
    </div>
  );
}

export default memo(StoriesTabContent);
