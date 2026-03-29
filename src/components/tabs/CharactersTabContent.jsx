import { memo } from "react";
import { btnPrimary, btnSecondary, defaultChar } from "../../constants.js";
import CharSection from "../CharSection.jsx";
import CharCard from "../CharCard.jsx";
import SearchBar from "../SearchBar.jsx";
import CharDetailPanel from "../CharDetailPanel.jsx";

function CharactersTabContent({
  chars, races, factions, locations, stories, loreEvents, artifacts,
  charStatuses, storyStatuses, hookStatuses, relationshipTypes,
  allPlayers, main, side,
  query, filters,
  selectedChar, selectedCharId,
  charSubTab, mainCollapsed, sideCollapsed,
  updPg,
  onNewChar, onDeleteChar, onCancelNew,
  onOpenStory, onOpenFaction, onOpenChar, onOpenArtifact,
  onSaveChar, onSaveFaction, onUpdateArtifacts,
  onPinCharHook, pinnedCharHookIds,
}) {
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minHeight:0, padding:"28px 32px 0" }}>
      <h1 style={{ fontFamily:"Georgia,serif", color:"#e8d5b7", margin:"0 0 18px", fontSize:26, flexShrink:0 }}>Characters</h1>
      <div style={{ flex:1, display:"flex", gap:24, overflow:"hidden", minHeight:0, paddingBottom:28 }}>
        <div style={{ flex:1, minWidth:0, overflowY:"auto", paddingRight:12 }}>
          {/* Players row */}
          <div style={{ marginBottom:24 }}>
            <CharSection
              title="🎲 Players" chars={allPlayers} races={races} factions={factions} locations={locations}
              onAdd={()=>onNewChar("player")} query=""
              selectedId={selectedChar?.id}
              onSelect={c=>updPg({ selectedCharId: selectedCharId===c.id?null:c.id, charEditing: false })}
              horizontal charStatuses={charStatuses}/>
          </div>
          <div style={{ height:1, background:"#2a1f3d", marginBottom:20 }}/>
          {/* Unified Main + Side list */}
          <SearchBar query={query} setQuery={v=>updPg({query:v})} filters={filters} setFilters={v=>updPg({filters:v})} chars={chars} races={races} factions={factions} locations={locations}/>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:16 }}>
              <span style={{ color:"#c8a96e", fontFamily:"Georgia,serif", fontSize:17, fontWeight:700 }}>Characters <span style={{ fontSize:12, color:"#7c5cbf", fontFamily:"sans-serif" }}>({main.length + side.length})</span></span>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>onNewChar("main")} style={{ ...btnPrimary, fontSize:12, padding:"5px 12px" }}>+ Main</button>
              <button onClick={()=>onNewChar("side")} style={{ ...btnSecondary, fontSize:12, padding:"5px 12px" }}>+ Side</button>
            </div>
          </div>
          {main.length + side.length === 0
            ? <div style={{ textAlign:"center", padding:"24px 0", color:"#5a4a7a", border:"1px dashed #3a2a5a", borderRadius:8, fontSize:13 }}>No characters found.</div>
            : <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <div onClick={()=>updPg({ mainCollapsed: !mainCollapsed })} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 0", cursor:"pointer", userSelect:"none" }}>
                  <span style={{ fontSize:11, color:"#c8a96e" }}>{mainCollapsed?"▶":"▼"}</span>
                  <span style={{ fontSize:13, color:"#c8a96e", fontFamily:"Georgia,serif", fontWeight:700 }}>⭐ Main Characters</span>
                  <span style={{ fontSize:11, color:"#5a4a7a" }}>({main.length})</span>
                  <div style={{ flex:1, height:1, background:"#2a1f3d" }}/>
                </div>
                {!mainCollapsed && main.map(c=>(
                  <CharCard key={c.id} char={c} races={races} factions={factions} locations={locations}
                    query={query} isSelected={selectedChar?.id===c.id}
                    onSelect={c=>updPg({ selectedCharId: selectedCharId===c.id?null:c.id, charEditing: false })}
                    charStatuses={charStatuses}/>
                ))}
                <div onClick={()=>updPg({ sideCollapsed: !sideCollapsed })} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 0", cursor:"pointer", userSelect:"none" }}>
                  <span style={{ fontSize:11, color:"#7c5cbf" }}>{sideCollapsed?"▶":"▼"}</span>
                  <span style={{ fontSize:13, color:"#7c5cbf", fontFamily:"Georgia,serif", fontWeight:700 }}>👤 Side Characters</span>
                  <span style={{ fontSize:11, color:"#5a4a7a" }}>({side.length})</span>
                  <div style={{ flex:1, height:1, background:"#2a1f3d" }}/>
                </div>
                {!sideCollapsed && side.map(c=>(
                  <CharCard key={c.id} char={c} races={races} factions={factions} locations={locations}
                    query={query} isSelected={selectedChar?.id===c.id}
                    onSelect={c=>updPg({ selectedCharId: selectedCharId===c.id?null:c.id, charEditing: false })}
                    charStatuses={charStatuses}/>
                ))}
              </div>}
        </div>
        <div style={{ flex:1, minWidth:0, overflowY:"auto" }}>
          {selectedChar
            ? <CharDetailPanel
                char={selectedChar} chars={chars} races={races} factions={factions}
                stories={stories} locations={locations} loreEvents={loreEvents}
                charStatuses={charStatuses} storyStatuses={storyStatuses}
                hookStatuses={hookStatuses} relationshipTypes={relationshipTypes}
                onClose={()=>updPg({ selectedCharId: null })}
                onDelete={onDeleteChar} onCancelNew={onCancelNew} onOpenStory={onOpenStory}
                onOpenFaction={onOpenFaction} onOpenChar={onOpenChar}
                onUpdateChar={onSaveChar} onSaveFaction={onSaveFaction} artifacts={artifacts}
                onUpdateArtifacts={onUpdateArtifacts} onOpenArtifact={onOpenArtifact}
                onPinCharHook={onPinCharHook} pinnedCharHookIds={pinnedCharHookIds}
                subTab={charSubTab} onSubTabChange={v=>updPg({ charSubTab: v })}/>
            : <div style={{ background:"#13101f", border:"1px dashed #2a1f3d", borderRadius:12, padding:"48px 24px", textAlign:"center", color:"#3a2a5a" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>👤</div>
                <div style={{ fontSize:14, fontFamily:"Georgia,serif" }}>Select a character to view details</div>
              </div>
          }
        </div>
      </div>
    </div>
  );
}

export default memo(CharactersTabContent);
