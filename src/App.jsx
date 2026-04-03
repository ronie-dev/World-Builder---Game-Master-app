/* eslint-disable react-hooks/preserve-manual-memoization */
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import useStateWithRef from "./useStateWithRef.js";
import {
  DEFAULT_RACES, CHAR_STATUS_COLORS, RELATIONSHIP_COLORS,
  DEFAULT_CHAR_STATUSES, DEFAULT_RELATIONSHIP_TYPES, DEFAULT_STORY_STATUSES, DEFAULT_HOOK_STATUSES,
  DEFAULT_LOCATION_TYPES, DEFAULT_RARITIES, DEFAULT_DEITY_ALIGNMENTS,
  btnPrimary, btnSecondary, iconBtn, inputStyle,
  defaultChar, defaultStory, defaultFaction, defaultLocation, defaultFilters,
  defaultEra,
} from "./constants.js";
import { uid, getRaceLabel } from "./utils.jsx";

import { useToastContext } from "./components/ToastContext.js";
import GlobalSearch from "./components/GlobalSearch.jsx";
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
import CommandPalette from "./components/CommandPalette.jsx";
import RelationshipWeb from "./components/RelationshipWeb.jsx";
import NotesTabContent from "./components/tabs/NotesTabContent.jsx";
import GalleryTabContent from "./components/tabs/GalleryTabContent.jsx";

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
function SimpleListEditor({ items, onChange, placeholder, onRename, noColor }) {
  const [newItem, setNewItem] = useState("");
  const [newColor, setNewColor] = useState("#7c5cbf");
  const [editingIdx, setEditingIdx] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [editColor, setEditColor] = useState("#7c5cbf");
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const dragIdxRef = useRef(null);

  const getName = item => noColor ? item : item.name;

  const add = () => {
    const n=newItem.trim();
    if(!n||items.some(i=>getName(i)===n)) return;
    onChange([...items, noColor ? n : {name:n, color:newColor}]);
    setNewItem("");
  };
  const remove = idx => onChange(items.filter((_,i)=>i!==idx));
  const startEdit = idx => { setEditingIdx(idx); setEditVal(getName(items[idx])); if(!noColor) setEditColor(items[idx].color); };
  const saveEdit = () => {
    const n=editVal.trim(); if(!n) return;
    const oldName=getName(items[editingIdx]);
    onChange(items.map((v,i)=>i===editingIdx ? (noColor ? n : {name:n,color:editColor}) : v));
    if(onRename&&oldName!==n) onRename(oldName,n);
    setEditingIdx(null);
  };

  const handleDragStart = idx => { dragIdxRef.current = idx; };
  const handleDragOver  = (e, idx) => { e.preventDefault(); setDragOverIdx(idx); };
  const handleDrop      = (e, toIdx) => {
    e.preventDefault();
    const fromIdx = dragIdxRef.current;
    if(fromIdx===null||fromIdx===toIdx) { setDragOverIdx(null); return; }
    const a=[...items];
    const [moved]=a.splice(fromIdx,1);
    a.splice(toIdx,0,moved);
    onChange(a);
    dragIdxRef.current=null; setDragOverIdx(null);
  };
  const handleDragEnd   = () => { dragIdxRef.current=null; setDragOverIdx(null); };

  return (
    <div>
      <div style={{ padding:"12px 24px", borderBottom:"1px solid #1e1630", display:"flex", gap:8, alignItems:"center" }}>
        {!noColor && <ColorSwatch color={newColor} onChange={setNewColor}/>}
        <input placeholder={placeholder||"New entry…"} value={newItem} onChange={e=>setNewItem(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} style={{...inputStyle,flex:1,fontSize:13}}/>
        <button onClick={add} style={{...btnPrimary,fontSize:12,padding:"6px 14px"}}>+ Add</button>
      </div>
      {items.length===0&&<div style={{ padding:"12px 24px", color:"#5a4a7a", fontSize:13 }}>No entries yet.</div>}
      {items.map((item,idx)=>(
        <div key={idx}
          draggable={editingIdx!==idx}
          onDragStart={()=>handleDragStart(idx)}
          onDragOver={e=>handleDragOver(e,idx)}
          onDrop={e=>handleDrop(e,idx)}
          onDragEnd={handleDragEnd}
          style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 24px", borderBottom:"1px solid #1e1630", background:dragOverIdx===idx?"#1e1a30":"transparent", transition:"background .1s" }}>
          {editingIdx===idx ? (
            <>
              {!noColor && <ColorSwatch color={editColor} onChange={setEditColor}/>}
              <input value={editVal} onChange={e=>setEditVal(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter") saveEdit(); if(e.key==="Escape") setEditingIdx(null); }} style={{...inputStyle,flex:1,fontSize:13}} autoFocus/>
              <button onClick={saveEdit} style={{...btnPrimary,fontSize:12,padding:"4px 10px"}}>Save</button>
              <button onClick={()=>setEditingIdx(null)} style={{...btnSecondary,fontSize:12,padding:"4px 8px"}}>✕</button>
            </>
          ) : (
            <>
              <span style={{ color:"#3a2a5a", fontSize:14, cursor:"grab", userSelect:"none", flexShrink:0 }} title="Drag to reorder">⠿</span>
              {!noColor && <div style={{ width:14, height:14, borderRadius:3, background:item.color, flexShrink:0, border:"1px solid #3a2a5a" }}/>}
              <span style={{ flex:1, color:"#e8d5b7", fontSize:13 }}>{getName(item)}</span>
              <button onClick={()=>startEdit(idx)} style={iconBtn}>✏️</button>
              <button onClick={()=>remove(idx)} style={{...iconBtn,color:"#c06060"}}>🗑️</button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Era List Editor ───────────────────────────────────────────────────────────
function EraListEditor({ eras, onChange }) {
  const [newName, setNewName] = useState("");
  const update = (id, field, val) => onChange(eras.map(e => e.id === id ? { ...e, [field]: val } : e));
  const addEra = () => {
    const n = newName.trim();
    if (!n) return;
    onChange([...eras, { ...defaultEra, id: uid(), name: n, color: "#7c5cbf" }]);
    setNewName("");
  };
  const deleteEra = id => onChange(eras.filter(e => e.id !== id));
  const inp = { background:"transparent", border:"1px solid #2a1f3d", borderRadius:4, padding:"4px 8px", color:"#c8b8e8", fontSize:13, outline:"none" };
  return (
    <div style={{ background:"#13101f", border:"1px solid #2a1f3d", borderRadius:12, overflow:"hidden" }}>
      <div style={{ padding:"14px 24px", borderBottom:"1px solid #2a1f3d" }}>
        <div style={{ color:"#c8a96e", fontFamily:"Georgia,serif", fontSize:15, fontWeight:700 }}>⏳ Eras</div>
        <div style={{ color:"#5a4a7a", fontSize:12, marginTop:2 }}>{eras.length} era{eras.length!==1?"s":""} defined</div>
      </div>
      <div style={{ padding:"14px 24px", display:"flex", flexDirection:"column", gap:8 }}>
        {eras.map(era => (
          <div key={era.id} style={{ display:"flex", alignItems:"center", gap:8 }}>
            <input type="color" value={era.color} onChange={e => update(era.id,"color",e.target.value)}
              style={{ width:28, height:28, border:"none", background:"none", cursor:"pointer", padding:0, flexShrink:0 }}/>
            <input value={era.name} onChange={e => update(era.id,"name",e.target.value)}
              placeholder="Era name…" style={{ ...inp, flex:2 }}/>
            <input value={era.startYear} onChange={e => update(era.id,"startYear",e.target.value)}
              placeholder="Start yr" style={{ ...inp, flex:1, minWidth:60 }}/>
            <span style={{ color:"#5a4a7a", fontSize:13 }}>→</span>
            <input value={era.endYear} onChange={e => update(era.id,"endYear",e.target.value)}
              placeholder="End yr" style={{ ...inp, flex:1, minWidth:60 }}/>
            <button onClick={() => deleteEra(era.id)}
              style={{ background:"none", border:"none", color:"#5a4a7a", cursor:"pointer", fontSize:16, padding:"2px 4px", lineHeight:1, flexShrink:0 }}
              onMouseEnter={e=>e.currentTarget.style.color="#c06060"} onMouseLeave={e=>e.currentTarget.style.color="#5a4a7a"}>🗑️</button>
          </div>
        ))}
        <div style={{ display:"flex", gap:8, marginTop:4 }}>
          <input value={newName} onChange={e=>setNewName(e.target.value)}
            onKeyDown={e=>{ if(e.key==="Enter") addEra(); }}
            placeholder="New era name (e.g. Age of Dragons)…"
            style={{ ...inp, flex:1 }}/>
          <button onClick={addEra}
            style={{ background:"#2a1f3d", border:"1px solid #3a2a5a", borderRadius:6, color:"#c8a96e", cursor:"pointer", fontSize:13, padding:"4px 14px", fontWeight:600 }}>+ Add</button>
        </div>
      </div>
    </div>
  );
}

// ── Settings Tab ──────────────────────────────────────────────────────────────
function SettingsTab({ races, setRaces, charStatuses, setCharStatuses, relationshipTypes, setRelationshipTypes, storyStatuses, setStoryStatuses, hookStatuses, setHookStatuses, locationTypes, setLocationTypes, rarities, setRarities, deityAlignments, setDeityAlignments, setChars, eras, setEras }) {
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
  const deleteRace = id => {
    setRaces(prev=>prev.filter(r=>r.id!==id));
    setChars(prev=>prev.map(c=>c.raceId===id ? {...c, raceId:"", subraceId:""} : c));
    if(expandedRace===id) setExpandedRace(null);
  };
  const saveRaceName = () => { if(!editingRace) return; setRaces(prev=>prev.map(r=>r.id===editingRace.id?{...r,name:editingRace.name}:r)); setEditingRace(null); };
  const addSubrace = raceId => { const n=newSubName.trim(); if(!n) return; setRaces(prev=>prev.map(r=>r.id===raceId?{...r,subraces:[...r.subraces,{id:uid(),name:n}]}:r)); setNewSubName(""); };
  const deleteSubrace = (raceId, subId) => {
    setRaces(prev=>prev.map(r=>r.id===raceId?{...r,subraces:r.subraces.filter(s=>s.id!==subId)}:r));
    setChars(prev=>prev.map(c=>c.subraceId===subId ? {...c, subraceId:""} : c));
  };
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

      <div style={{ display:"flex", gap:20, marginBottom:28 }}>
        <div style={{ flex:1, background:"#13101f", border:"1px solid #2a1f3d", borderRadius:12, overflow:"hidden" }}>
          <div style={{ padding:"14px 24px", borderBottom:"1px solid #2a1f3d" }}>
            <div style={{ color:"#c8a96e", fontFamily:"Georgia,serif", fontSize:15, fontWeight:700 }}>📍 Location Types</div>
            <div style={{ color:"#5a4a7a", fontSize:12, marginTop:2 }}>{locationTypes.length} types</div>
          </div>
          <SimpleListEditor items={locationTypes} onChange={setLocationTypes} placeholder="New type (e.g. Swamp)…" noColor/>
        </div>
        <div style={{ flex:1, background:"#13101f", border:"1px solid #2a1f3d", borderRadius:12, overflow:"hidden" }}>
          <div style={{ padding:"14px 24px", borderBottom:"1px solid #2a1f3d" }}>
            <div style={{ color:"#c8a96e", fontFamily:"Georgia,serif", fontSize:15, fontWeight:700 }}>⚗️ Item Rarities</div>
            <div style={{ color:"#5a4a7a", fontSize:12, marginTop:2 }}>{rarities.length} rarities</div>
          </div>
          <SimpleListEditor items={rarities} onChange={setRarities} placeholder="New rarity (e.g. Mythic)…"/>
        </div>
      </div>

      <div style={{ display:"flex", gap:20, marginBottom:28 }}>
        <div style={{ flex:1, background:"#13101f", border:"1px solid #2a1f3d", borderRadius:12, overflow:"hidden" }}>
          <div style={{ padding:"14px 24px", borderBottom:"1px solid #2a1f3d" }}>
            <div style={{ color:"#c8a96e", fontFamily:"Georgia,serif", fontSize:15, fontWeight:700 }}>⛪ Deity Alignments</div>
            <div style={{ color:"#5a4a7a", fontSize:12, marginTop:2 }}>{deityAlignments.length} alignments</div>
          </div>
          <SimpleListEditor items={deityAlignments} onChange={setDeityAlignments} placeholder="New alignment (e.g. Chaotic)…"/>
        </div>
        <div style={{ flex:1 }}/>
      </div>

      <h2 style={{ fontFamily:"Georgia,serif", color:"#c8a96e", fontSize:18, margin:"28px 0 14px" }}>⏳ Timeline Eras</h2>
      <p style={{ color:"#5a4a7a", fontSize:13, margin:"0 0 16px" }}>Define named time periods to group events on the visual timeline.</p>
      <EraListEditor eras={eras} onChange={setEras}/>

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
  {id:"characters",label:"👥 Characters",icon:"👥"},{id:"stories",label:"📜 Stories",icon:"📜"},
  {id:"factions",label:"🚩 Factions",icon:"🚩"},{id:"items",label:"⚗️ Items",icon:"⚗️"},
  {id:"timeline",label:"⏳ Timeline",icon:"⏳"},{id:"locations",label:"📍 Locations",icon:"📍"},
  {id:"map",label:"🗺️ Map",icon:"🗺️"},{id:"lore",label:"🏛️ Lore",icon:"🏛️"},
  {id:"relations",label:"🕸️ Relations",icon:"🕸️"},
  {id:"notes",label:"📝 Notes",icon:"📝"},{id:"gallery",label:"🖼️ Gallery",icon:"🖼️"},
];
const ALL_TABS = [...TABS, {id:"settings",label:"⚙️ Settings",icon:"⚙️"}];

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
  const [locationTypes,     setLocationTypes,     locationTypesRef]  = useStateWithRef(DEFAULT_LOCATION_TYPES);
  const [rarities,          setRarities,          raritiesRef]       = useStateWithRef(DEFAULT_RARITIES);
  const [deityAlignments,   setDeityAlignments,   deityAlignmentsRef]= useStateWithRef(DEFAULT_DEITY_ALIGNMENTS);
  const [eras,              setEras,              erasRef]           = useStateWithRef([]);
  const [factions,          setFactions,          factionsRef]       = useStateWithRef([]);
  const [locations,         setLocations,         locationsRef]      = useStateWithRef([]);
  const [notes,             setNotes,             notesRef]          = useStateWithRef({ scratch:"", sessions:[], pins:[], playerPins:{} });
  const [loreEvents,        setLoreEvents,        loreEventsRef]     = useStateWithRef([]);
  const [deities,           setDeities,           deitiesRef]        = useStateWithRef([]);
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
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [activeCampaignId, setActiveCampaignId] = useState(null);
  const [campaignManagerOpen, setCampaignManagerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem("wb_sidebar") === "1");
  useEffect(() => { localStorage.setItem("wb_sidebar", sidebarCollapsed ? "1" : "0"); }, [sidebarCollapsed]);

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
      artifacts: artifactsRef.current, loreEvents: loreEventsRef.current, deities: deitiesRef.current,
      relations: relationsRef.current, races: racesRef.current,
      charStatuses: charStatusesRef.current, relationshipTypes: relTypesRef.current,
      storyStatuses: storyStatusesRef.current, hookStatuses: hookStatusesRef.current,
      locationTypes: locationTypesRef.current, rarities: raritiesRef.current, deityAlignments: deityAlignmentsRef.current,
      eras: erasRef.current,
      mapData: mapDataRef.current, notes: notesRef.current,
    };
    historyRef.current = [...historyRef.current.slice(-MAX_HISTORY + 1), snap];
    setHistoryLen(historyRef.current.length);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const undo = useCallback(() => {
    if (historyRef.current.length === 0) return;
    const snap = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    setHistoryLen(historyRef.current.length);
    setChars(snap.chars); setStories(snap.stories); setFactions(snap.factions);
    setLocations(snap.locations); setArtifacts(snap.artifacts); setLoreEvents(snap.loreEvents);
    if (snap.deities !== undefined) setDeities(snap.deities);
    setRelations(snap.relations); setRaces(snap.races);
    setCharStatuses(snap.charStatuses); setRelationshipTypes(snap.relationshipTypes);
    if (snap.storyStatuses !== undefined) setStoryStatuses(snap.storyStatuses);
    if (snap.hookStatuses !== undefined) setHookStatuses(snap.hookStatuses);
    if (snap.locationTypes !== undefined) setLocationTypes(snap.locationTypes);
    if (snap.rarities !== undefined) setRarities(snap.rarities);
    if (snap.deityAlignments !== undefined) setDeityAlignments(snap.deityAlignments);
    if (snap.eras !== undefined) setEras(snap.eras);
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
        setCmdPaletteOpen(o => !o);
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
        if (cmdPaletteOpen){ setCmdPaletteOpen(false); return; }
        if (searchOpen)    { setSearchOpen(false); return; }
        if (locationModal) { setLocationModal(null); return; }
        if (confirm)       { closeConfirm(); return; }
        updPg({ selectedCharId: null, selectedStoryId: null, selectedFactionId: null, selectedLocationId: null });
        return;
      }

      // N — new item on current tab (skip if typing or a modal is open)
      if (e.key === 'n' && !inInput && !locationModal && !searchOpen) {
        e.preventDefault();
        if (tab === 'characters') {
          const newId = uid();
          pushHistory();
          setChars(prev => [...prev, { ...defaultChar, type: "main", id: newId, _isNew: true }]);
          updPg({ tab: "characters", selectedCharId: newId, charEditing: true });
        } else if (tab === 'stories') {
          const newId = uid();
          pushHistory();
          setStories(prev => [...prev, { ...defaultStory, id: newId, _isNew: true }]);
          updPg({ tab: "stories", selectedStoryId: newId, storyEditing: true });
        } else if (tab === 'factions') {
          const newId = uid();
          pushHistory();
          setFactions(prev => [...prev, { ...defaultFaction, id: newId, _isNew: true }]);
          updPg({ tab: "factions", selectedFactionId: newId, factionEditing: true });
        } else if (tab === 'locations') setLocationModal({...defaultLocation});
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
    const llt  = blob.locationTypes || DEFAULT_LOCATION_TYPES;
    const lrar = blob.rarities || DEFAULT_RARITIES;
    setChars(lc); setStories(ls); setRaces(lr); setFactions(lf); setLocations(lloc);
    setNotes(blob.notes||{scratch:"",sessions:[],pins:[],playerPins:{}});
    setLoreEvents(blob.loreEvents||[]); setDeities(blob.deities||[]); setRelations(blob.relations||{nodes:[],edges:[]}); setArtifacts(blob.artifacts||[]);
    setGalleryEntries(blob.galleryEntries||[]);
    setCharStatuses(lcs); setRelationshipTypes(lrt); setStoryStatuses(lss); setHookStatuses(lhs);
    setLocationTypes(llt); setRarities(lrar);
    setDeityAlignments(blob.deityAlignments || DEFAULT_DEITY_ALIGNMENTS);
    setEras(blob.eras||[]);
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
      try { const v = await store.get("fwb_campaigns"); if(v) cList = JSON.parse(v); } catch { /* ignore invalid stored campaign registry */ }
      let activeId = null;
      try { const v = await store.get("fwb_active_campaign"); if(v) activeId = v; } catch { /* ignore invalid stored active campaign */ }
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
           try{ lc=JSON.parse(legacyChars).map(c=>{ let r={...c}; if(r.factionIds&&!r.factions) r={...r,factions:r.factionIds.map(fid=>({id:uid(),factionId:fid,role:""}))}; if(r.linkedCharacterIds&&!r.relationships) r={...r,relationships:r.linkedCharacterIds.map(cid=>({id:uid(),charId:cid,type:"Neutral"}))}; return r; }); }catch{ /* ignore invalid legacy characters */ }
           try{ const v=await store.get("fwb_stories"); if(v) ls=JSON.parse(v); }catch{ /* ignore invalid legacy stories */ }
           try{ const v=await store.get("fwb_races"); if(v) lr=JSON.parse(v); }catch{ /* ignore invalid legacy races */ }
           try{ const v=await store.get("fwb_factions"); if(v) lf=JSON.parse(v); }catch{ /* ignore invalid legacy factions */ }
           try{ const v=await store.get("fwb_locations"); if(v) lloc=JSON.parse(v); }catch{ /* ignore invalid legacy locations */ }
           try{ const v=await store.get("fwb_notes"); if(v) lnotes=JSON.parse(v); }catch{ /* ignore invalid legacy notes */ }
           try{ const v=await store.get("fwb_lore"); if(v) llore=JSON.parse(v); }catch{ /* ignore invalid legacy lore */ }
           try{ const v=await store.get("fwb_relations"); if(v) lrels=JSON.parse(v); }catch{ /* ignore invalid legacy relations */ }
           try{ const v=await store.get("fwb_artifacts"); if(v) lart=JSON.parse(v); }catch{ /* ignore invalid legacy artifacts */ }
           try{ const v=await store.get("fwb_char_statuses"); if(v){ const p=JSON.parse(v); lcs=p.map(x=>typeof x==="string"?{name:x,color:CHAR_STATUS_COLORS[x]||"#4a4a6a"}:x); } }catch{ /* ignore invalid legacy character statuses */ }
           try{ const v=await store.get("fwb_rel_types"); if(v){ const p=JSON.parse(v); lrt=p.map(x=>typeof x==="string"?{name:x,color:RELATIONSHIP_COLORS[x]||"#3a4a6a"}:x); } }catch{ /* ignore invalid legacy relationship types */ }
           try{ const v=await store.get("fwb_nav"); if(v) lnav=JSON.parse(v); }catch{ /* ignore invalid legacy navigation state */ }
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
        } catch { /* ignore invalid campaign payload */ }
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
        chars, stories, races, factions, locations, notes, loreEvents, deities, relations, artifacts, charStatuses, relationshipTypes, storyStatuses, hookStatuses, locationTypes, rarities, deityAlignments, eras, mapData, galleryEntries,
        nav: { tab: pg.tab, prevTab: pg.prevTab, selectedCharId: pg.selectedCharId||null, selectedStoryId: pg.selectedStoryId||null, selectedFactionId: pg.selectedFactionId||null, selectedLocationId: pg.selectedLocationId||null },
      };
      try { await store.set(`fwb_campaign_${activeCampaignId}`, JSON.stringify(blob)); } catch { /* ignore save failures */ }
    }, 500);
    return () => clearTimeout(saveTimerRef.current);
  }, [chars, stories, races, factions, locations, notes, loreEvents, deities, relations, artifacts, charStatuses, relationshipTypes, storyStatuses, hookStatuses, locationTypes, rarities, deityAlignments, eras, mapData, galleryEntries, pg, loaded, activeCampaignId]);

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
    showToast(isNew || !form.id ? "Character added" : "Character updated");
  }, [pushHistory, showToast]);

  const deleteChar = useCallback(id => {
    const c = chars.find(x=>x.id===id);
    askConfirm(`Delete "${c?.name}"?`, () => {
      pushHistory();
      setChars(prev=>prev.filter(x=>x.id!==id).map(c=>({...c,relationships:(c.relationships||[]).filter(r=>r.charId!==id)})));
      updPgFn(p => p.selectedCharId===id ? { selectedCharId: null } : {});
      setStories(prev=>prev.map(s=>({
        ...s,
        characterIds:(s.characterIds||[]).filter(x=>x!==id),
        playerId: s.playerId===id ? "" : s.playerId,
        events:(s.events||[]).map(e=>({...e,characterIds:(e.characterIds||[]).filter(x=>x!==id)})),
      })));
      setArtifacts(prev=>prev.map(a=>a.holderId===id ? {...a, holderId:null} : a));
      setNotes(prev=>({...prev, pins:(prev.pins||[]).filter(p=>!(p.charHookPin && p.charId===id))}));
      closeConfirm();
      showToast("Character deleted", "error");
    });
  }, [chars, updPgFn, askConfirm, closeConfirm, pushHistory, showToast]); // eslint-disable-line react-hooks/exhaustive-deps


  const deleteStory = useCallback(id => {
    const s = stories.find(x=>x.id===id);
    askConfirm(`Delete story "${s?.name}"?`, () => {
      pushHistory();
      setStories(prev=>prev.filter(x=>x.id!==id));
      updPgFn(p => p.selectedStoryId===id ? { selectedStoryId: null } : {});
      setArtifacts(prev=>prev.map(a=>({...a, storyIds:(a.storyIds||[]).filter(sid=>sid!==id)})));
      setNotes(prev=>({
        ...prev,
        pins:(prev.pins||[]).filter(p=>!(p.hookPin && p.storyId===id)),
        sessions:(prev.sessions||[]).map(sess=>({
          ...sess,
          events:(sess.events||[]).map(e=>e.linkedStoryId===id ? {...e, linkedStoryId:null, linkedEventId:null} : e),
        })),
      }));
      closeConfirm();
      showToast("Story deleted", "error");
    });
  }, [stories, updPgFn, askConfirm, closeConfirm, pushHistory, showToast]); // eslint-disable-line react-hooks/exhaustive-deps

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
      setStories(prev=>prev.map(s=>({...s,factionIds:(s.factionIds||[]).filter(fid=>fid!==id)})));
      setDeities(prev=>prev.map(d=>({...d,factionIds:(d.factionIds||[]).filter(fid=>fid!==id)})));
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
      setStories(prev=>prev.map(s=>({...s,locationIds:(s.locationIds||[]).filter(lid=>lid!==id)})));
      setFactions(prev=>prev.map(f=>f.locationId===id?{...f,locationId:""}:f));
      setDeities(prev=>prev.map(d=>({...d,locationIds:(d.locationIds||[]).filter(lid=>lid!==id)})));
      setMapData(prev => ({
        ...prev,
        maps: (prev.maps || []).map(map => ({
          ...map,
          pins: (map.pins || []).filter(pin => pin.locationId !== id),
        })),
      }));
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

  const handleOpenLoreEvent = useCallback(() => {
    updPgFn(p => ({ tab: "lore", prevTab: p.tab, mapNavTarget: null }));
  }, [updPgFn]);

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
  function openCharModal(type) {
    const newId = uid();
    const newChar = {...defaultChar, type, id: newId, _isNew: true};
    pushHistory();
    setChars(prev => [...prev, newChar]);
    updPgFn(p => ({...p, tab: "characters", selectedCharId: newId, charEditing: true}));
  }

  function cancelNewChar(id) {
    setChars(prev => prev.filter(c => c.id !== id));
    updPgFn(p => ({...p, selectedCharId: null, charEditing: false}));
  }
  function openStoryModal() {
    const newId = uid();
    const newStory = {...defaultStory, id: newId, _isNew: true};
    pushHistory();
    setStories(prev => [...prev, newStory]);
    updPgFn(p => ({...p, tab: "stories", selectedStoryId: newId, storyEditing: true}));
  }

  function cancelNewStory(id) {
    setStories(prev => prev.filter(s => s.id !== id));
    updPgFn(p => ({...p, selectedStoryId: null, storyEditing: false}));
  }
  function openFactionModal() {
    const newId = uid();
    const newFaction = {...defaultFaction, id: newId, _isNew: true};
    pushHistory();
    setFactions(prev => [...prev, newFaction]);
    updPgFn(p => ({...p, tab: "factions", selectedFactionId: newId, factionEditing: true}));
  }

  function cancelNewFaction(id) {
    setFactions(prev => prev.filter(f => f.id !== id));
    updPgFn(p => ({...p, selectedFactionId: null, factionEditing: false}));
  }
  const openLocationModal = useCallback(() => setLocationModal({...defaultLocation}), []);

  // Navigate to items tab from story detail (uses updPgFn to avoid stale tab closure)
  const handleOpenArtifactInStory = useCallback(a => {
    updPgFn(p => ({ itemNavId: a.id, tab: "items", prevTab: p.tab, mapNavTarget: null }));
  }, [updPgFn]);

  // Wrapped setters — push history before any child-initiated mutation
  const updateArtifacts = useCallback(u => { pushHistory(); setArtifacts(u); }, [pushHistory]);
  const updateLoreEvents = useCallback(u => { pushHistory(); setLoreEvents(u); }, [pushHistory]);
  const updateDeities = useCallback(u => { pushHistory(); setDeities(u); }, [pushHistory]);
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
    setNotes({scratch:"",sessions:[],pins:[],playerPins:{}}); setLoreEvents([]); setDeities([]); setRelations({nodes:[],edges:[]}); setArtifacts([]);
    setCharStatuses(DEFAULT_CHAR_STATUSES); setRelationshipTypes(DEFAULT_RELATIONSHIP_TYPES);
    setLocationTypes(DEFAULT_LOCATION_TYPES); setRarities(DEFAULT_RARITIES); setDeityAlignments(DEFAULT_DEITY_ALIGNMENTS);
    setEras([]);
    setMapData({maps:[]});
    setPages([{ id: "tab-1", ...DEFAULT_PAGE }]); setActivePageId("tab-1");
    historyRef.current = []; setHistoryLen(0);
  }, []);

  async function saveCampaignNow(campaignId) {
    const blob = {
      chars: charsRef.current, stories: storiesRef.current, races: racesRef.current,
      factions: factionsRef.current, locations: locationsRef.current, notes: notesRef.current,
      loreEvents: loreEventsRef.current, deities: deitiesRef.current, relations: relationsRef.current, artifacts: artifactsRef.current,
      charStatuses: charStatusesRef.current, relationshipTypes: relTypesRef.current,
      storyStatuses: storyStatusesRef.current, hookStatuses: hookStatusesRef.current,
      locationTypes: locationTypesRef.current, rarities: raritiesRef.current, deityAlignments: deityAlignmentsRef.current,
      eras: erasRef.current,
      mapData: mapDataRef.current, galleryEntries: galleryEntriesRef.current,
      nav: { tab: pg.tab, prevTab: pg.prevTab, selectedCharId: pg.selectedCharId||null, selectedStoryId: pg.selectedStoryId||null, selectedFactionId: pg.selectedFactionId||null, selectedLocationId: pg.selectedLocationId||null },
    };
    try { await store.set(`fwb_campaign_${campaignId}`, JSON.stringify(blob)); } catch { /* ignore save failures */ }
  }

  const switchCampaign = useCallback(async campaign => {
    clearTimeout(saveTimerRef.current);
    if (activeCampaignId) await saveCampaignNow(activeCampaignId);
    resetWorldState();
    setActiveCampaignId(campaign.id);
    await store.set("fwb_active_campaign", campaign.id);
    try {
      const v = await store.get(`fwb_campaign_${campaign.id}`);
      if (v) applyBlob(JSON.parse(v));
    } catch { /* ignore invalid campaign payload */ }
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
        } catch { /* ignore invalid campaign payload */ }
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
      <div style={{ width:sidebarCollapsed?52:200, background:"#110e1c", borderRight:"1px solid #2a1f3d", display:"flex", flexDirection:"column", flexShrink:0, transition:"width .18s ease", overflow:"hidden" }}>
        {sidebarCollapsed ? (
          /* ── Collapsed sidebar ── */
          <>
            <div style={{ padding:"14px 0 10px", borderBottom:"1px solid #2a1f3d", display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
              <div style={{ fontSize:18, color:"#c8a96e" }} title="World Builder">⚗️</div>
              <button onClick={()=>setSidebarCollapsed(false)} title="Expand sidebar"
                style={{ width:34, height:28, display:"flex", alignItems:"center", justifyContent:"center", background:"#1a1228", border:"1px solid #7c5cbf", borderRadius:6, color:"#c8a96e", cursor:"pointer", fontSize:15, fontWeight:700, transition:"background .15s, border-color .15s" }}
                onMouseEnter={e=>{ e.currentTarget.style.background="#2a1a4a"; e.currentTarget.style.borderColor="#a07fe8"; }}
                onMouseLeave={e=>{ e.currentTarget.style.background="#1a1228"; e.currentTarget.style.borderColor="#7c5cbf"; }}>›</button>
              <button onClick={()=>setCampaignManagerOpen(true)} title={activeCampaign?.name||"Campaign"}
                style={{ background:"#1a1228", border:"1px solid #3a2a5a", borderRadius:6, padding:"5px", cursor:"pointer", fontSize:14, lineHeight:1, width:34, textAlign:"center", transition:"border-color .15s" }}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#7c5cbf"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="#3a2a5a"}>🗂️</button>
            </div>
            <nav style={{ flex:1, overflowY:"auto", padding:"8px 0", display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
              <button onClick={()=>setCmdPaletteOpen(true)} title="Command palette (Ctrl+K)"
                style={{ width:34, height:30, display:"flex", alignItems:"center", justifyContent:"center", background:"#0d0b14", border:"1px solid #2a1f3d", borderRadius:6, cursor:"pointer", fontSize:14, marginBottom:6, flexShrink:0 }}>🔍</button>
              {TABS.map(t=>(
                <button key={t.id} title={t.label.replace(/^\S+\s/,"")} onClick={e=>{ if(e.ctrlKey){ addPage(t.id); } else { navigateTo(t.id); } }}
                  style={{ width:34, height:32, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:7, border:"none", background:tab===t.id?"#7c5cbf33":"transparent", cursor:"pointer", fontSize:16, flexShrink:0, borderLeft:tab===t.id?"3px solid #7c5cbf":"3px solid transparent", transition:"background .12s" }}>
                  {t.icon}
                </button>
              ))}
              <div style={{ borderTop:"1px solid #2a1f3d", marginTop:6, paddingTop:6, width:34 }}>
                <button title="Settings" onClick={e=>{ if(e.ctrlKey){ addPage("settings"); } else { navigateTo("settings"); } }}
                  style={{ width:34, height:32, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:7, border:"none", background:tab==="settings"?"#7c5cbf33":"transparent", cursor:"pointer", fontSize:16, borderLeft:tab==="settings"?"3px solid #7c5cbf":"3px solid transparent" }}>
                  ⚙️
                </button>
              </div>
            </nav>
            <div style={{ padding:"8px 0", borderTop:"1px solid #2a1f3d", display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
              <button onClick={()=>setHelpOpen(true)} title="Help & Shortcuts"
                style={{ width:34, height:30, display:"flex", alignItems:"center", justifyContent:"center", background:"transparent", border:"1px solid #3a2a5a", borderRadius:6, color:"#9a7fa0", cursor:"pointer", fontSize:13, transition:"color .15s, border-color .15s" }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor="#7c5cbf"; e.currentTarget.style.color="#e8d5b7"; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor="#3a2a5a"; e.currentTarget.style.color="#9a7fa0"; }}>?</button>
              <button onClick={undo} disabled={historyLen===0} title={`Undo (Ctrl+Z)${historyLen>0?` — ${historyLen} step${historyLen!==1?"s":""} available`:""}`}
                style={{ width:34, height:30, display:"flex", alignItems:"center", justifyContent:"center", background:"transparent", border:"1px solid #3a2a5a", borderRadius:6, color:historyLen===0?"#3a2a5a":"#9a7fa0", cursor:historyLen===0?"default":"pointer", fontSize:13, transition:"color .15s, border-color .15s" }}
                onMouseEnter={e=>{ if(historyLen>0){ e.currentTarget.style.borderColor="#7c5cbf"; e.currentTarget.style.color="#e8d5b7"; }}}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor="#3a2a5a"; e.currentTarget.style.color=historyLen===0?"#3a2a5a":"#9a7fa0"; }}>↩</button>
            </div>
          </>
        ) : (
          /* ── Expanded sidebar ── */
          <>
            <div style={{ padding:"16px 16px 12px", borderBottom:"1px solid #2a1f3d" }}>
              <div style={{ fontSize:20, fontFamily:"Georgia,serif", color:"#c8a96e", lineHeight:1.2 }}>⚗️ World<br/>Builder</div>
              <div style={{ fontSize:11, color:"#4a3a6a", marginTop:3, marginBottom:8 }}>v0.5.0</div>
              <button onClick={()=>setSidebarCollapsed(true)}
                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:5, width:"100%", background:"#1a1228", border:"1px solid #7c5cbf", borderRadius:6, padding:"6px 10px", color:"#c8a96e", cursor:"pointer", fontSize:13, fontWeight:600, marginBottom:8, transition:"background .15s, border-color .15s" }}
                onMouseEnter={e=>{ e.currentTarget.style.background="#2a1a4a"; e.currentTarget.style.borderColor="#a07fe8"; }}
                onMouseLeave={e=>{ e.currentTarget.style.background="#1a1228"; e.currentTarget.style.borderColor="#7c5cbf"; }}>
                <span style={{ fontSize:15, lineHeight:1 }}>‹</span> Fold
              </button>
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
              <button onClick={() => setCmdPaletteOpen(true)} style={{ display:"flex", alignItems:"center", gap:8, width:"100%", textAlign:"left", padding:"8px 12px", borderRadius:8, border:"1px solid #2a1f3d", background:"#0d0b14", color:"#4a3a6a", cursor:"pointer", marginBottom:10, fontSize:13 }}>
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
          </>
        )}
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
          const pageUpdPg = updates =>
            setPages(ps => ps.map(page => page.id === p.id ? { ...page, ...updates } : page));

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
                  onPinCharHook={handlePinCharHook} pinnedCharHookIds={pinnedCharHookIds} rarities={rarities}/>
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
                  onPinHook={handlePinHook} pinnedHookIds={pinnedHookIds} rarities={rarities}/>
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
                    <GlobalTimeline stories={stories} chars={chars} loreEvents={loreEvents} eras={eras} onOpenStory={handleOpenStory} onOpenChar={handleOpenChar}/>
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
                  isEditing={p.locationEditing} onSetEditing={v=>pageUpdPg({ locationEditing: v })} locationTypes={locationTypes}/>
              </div>
              <div style={{ display: p.tab==="items" ? "contents" : "none" }}><ArtifactsTab artifacts={artifacts} onUpdateArtifacts={updateArtifacts} chars={chars} stories={stories} onOpenChar={handleOpenChar} onOpenStory={handleOpenStory} onAskConfirm={askConfirm} onCloseConfirm={closeConfirm} navArtifactId={p.itemNavId} rarities={rarities}/></div>
              <div style={{ display: p.tab==="map" ? "contents" : "none" }}><MapTab mapData={mapData} onUpdateMapData={updateMapData} locations={locations} onOpenLocation={handleOpenLocation} onAskConfirm={askConfirm} onCloseConfirm={closeConfirm} navTarget={p.mapNavTarget} locationTypes={locationTypes}/></div>
              <div style={{ display: p.tab==="lore" ? "contents" : "none" }}><div style={{ flex:1, overflowY:"auto", padding:"28px 32px" }}><LoreTab events={loreEvents} chars={chars} onUpdateEvents={updateLoreEvents} onOpenChar={handleOpenChar} onAskConfirm={askConfirm} onCloseConfirm={closeConfirm} deities={deities} onUpdateDeities={updateDeities} factions={factions} locations={locations} deityAlignments={deityAlignments} eras={eras}/></div></div>
              <div style={{ display: p.tab==="relations" ? "contents" : "none" }}><div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minHeight:0 }}><RelationshipWeb chars={chars} stories={stories} relationshipTypes={relationshipTypes} onOpenChar={handleOpenChar} onOpenStory={handleOpenStory}/></div></div>
              <div style={{ display: p.tab==="gallery" ? "contents" : "none" }}><div style={{ flex:1, overflowY:"auto", padding:"28px 32px" }}><GalleryTabContent images={galleryImages} galleryEntries={galleryEntries} onUpdateEntries={setGalleryEntries}/></div></div>
              <div style={{ display: p.tab==="notes" ? "contents" : "none" }}><div style={{ flex:1, overflowY:"auto", padding:"28px 32px" }}><NotesTabContent notes={notes} setNotes={setNotes} chars={chars} stories={stories} setStories={setStories} onOpenStory={handleOpenStory} onOpenChar={handleOpenChar} onPinHook={handlePinHook} onPinCharHook={handlePinCharHook} onRemovePin={handleRemovePin} hookStatuses={hookStatuses} storyStatuses={storyStatuses} onUpdateStory={updateStory} onUpdateChar={updateChar}/></div></div>
              <div style={{ display: p.tab==="settings" ? "contents" : "none" }}><div style={{ flex:1, overflowY:"auto", padding:"28px 32px" }}><SettingsTab races={races} setRaces={updateRaces} charStatuses={charStatuses} setCharStatuses={updateCharStatuses} relationshipTypes={relationshipTypes} setRelationshipTypes={updateRelationshipTypes} storyStatuses={storyStatuses} setStoryStatuses={updateStoryStatuses} hookStatuses={hookStatuses} setHookStatuses={updateHookStatuses} locationTypes={locationTypes} setLocationTypes={setLocationTypes} rarities={rarities} setRarities={setRarities} deityAlignments={deityAlignments} setDeityAlignments={setDeityAlignments} setChars={updateCharsFromSettings} eras={eras} setEras={setEras}/></div></div>
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


      {locationModal&&<LocationModal location={locationModal} onClose={()=>setLocationModal(null)} onSave={saveLocation} locationTypes={locationTypes}/>}
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
      {cmdPaletteOpen && (
        <CommandPalette
          chars={chars} stories={stories} factions={factions} locations={locations} loreEvents={loreEvents}
          onOpenChar={c => { handleOpenChar(c); }}
          onOpenStory={s => { handleOpenStory(s); }}
          onOpenFaction={f => { handleOpenFaction(f); }}
          onOpenLocation={l => { handleOpenLocation(l); }}
          onOpenLore={handleOpenLoreEvent}
          onClose={() => setCmdPaletteOpen(false)}
        />
      )}
    </div>
    </GalleryContext.Provider>
  );
}
