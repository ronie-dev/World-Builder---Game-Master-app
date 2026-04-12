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
import SessionLogTabContent from "./components/tabs/SessionLogTabContent.jsx";
import HooksTabContent from "./components/tabs/HooksTabContent.jsx";
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
  {id:"notes",label:"📝 Notes",icon:"📝"},{id:"sessions",label:"📖 Sessions",icon:"📖"},{id:"hooks",label:"📌 Hooks",icon:"📌"},{id:"gallery",label:"🖼️ Gallery",icon:"🖼️"},
];
const ALL_TABS = [...TABS, {id:"settings",label:"⚙️ Settings",icon:"⚙️"}];

// ── Panel default state (outside component — uses imported defaultFilters) ────
const NAV_KEYS = ["section","selectedCharId","selectedStoryId","selectedFactionId","selectedLocationId","itemNavId","mapNavTarget","storyHighlightEventId","charSubTab","storySubTab"];
const PANEL_DEFAULT = {
  selectedCharId: null, selectedStoryId: null, selectedFactionId: null, selectedLocationId: null,
  charSubTab: "details", storySubTab: "details",
  charEditing: false, storyEditing: false, factionEditing: false,
  itemNavId: null, storyHighlightEventId: null, mapNavTarget: null,
  query: "", storyQuery: "", storyStatusFilter: "", locationQuery: "", locationTypeFilter: "", factionQuery: "",
  collapsedLocTypes: {}, filters: defaultFilters, mainCollapsed: false, sideCollapsed: false,
  history: [],
};

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
  // ── Panel state (2-slot drag-and-drop system) ────────────────────────────────
  const [panels, setPanels, panelsRef] = useStateWithRef([{ ...PANEL_DEFAULT, section: "characters" }, null]);

  const updatePanel = useCallback((idx, updates) => {
    setPanels(prev => prev.map((p, i) => i === idx && p ? { ...p, ...updates } : p));
  }, []);
  const updatePanelFn = useCallback((idx, fn) => {
    setPanels(prev => prev.map((p, i) => i === idx && p ? { ...p, ...fn(p) } : p));
  }, []);
  const openInPanel = useCallback((idx, section) => {
    setPanels(prev => { const np = [...prev]; np[idx] = { ...PANEL_DEFAULT, section }; return np; });
  }, []);
  const closePanel = useCallback(idx => {
    setPanels(prev => prev.map((p, i) => i === idx ? null : p));
  }, []);
  // Navigate within a panel — pushes current nav state to history
  const navPanel = useCallback((idx, updates) => {
    setPanels(prev => prev.map((p, i) => {
      if (i !== idx || !p) return p;
      const snap = Object.fromEntries(NAV_KEYS.map(k => [k, p[k]]));
      return { ...p, ...updates, history: [...(p.history||[]), snap] };
    }));
  }, []);
  const goBack = useCallback(idx => {
    setPanels(prev => prev.map((p, i) => {
      if (i !== idx || !p || !(p.history||[]).length) return p;
      const history = [...(p.history||[])];
      const prev2 = history.pop();
      return { ...p, ...prev2, history };
    }));
  }, []);
  // Navigate to a section: reuse existing panel showing it, else first empty slot, else panel 0
  const navToSection = useCallback((section, update = {}) => {
    setPanels(prev => {
      const np = [...prev];
      let idx = np.findIndex(p => p?.section === section);
      if (idx < 0) idx = np.findIndex(p => !p);
      if (idx < 0) idx = 0;
      np[idx] = np[idx] ? { ...np[idx], section, ...update } : { ...PANEL_DEFAULT, section, ...update };
      return np;
    });
  }, []);

  const [loaded, setLoaded] = useState(false);
  const [isDev, setIsDev] = useState(false);
  const [mapPicker, setMapPicker] = useState(null); // { location, maps: [{map, pin}] }
  const [confirm, setConfirm] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const [dragOverPanel, setDragOverPanel] = useState(null); // { idx, section, isEntity? }
  const [draggingSection, setDraggingSection] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [activeCampaignId, setActiveCampaignId] = useState(null);
  const [campaignManagerOpen, setCampaignManagerOpen] = useState(false);

  const askConfirm = useCallback((message, onConfirm) => setConfirm({message, onConfirm}), []);
  const closeConfirm = useCallback(() => setConfirm(null), []);

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
      // Escape — close modals in priority order
      if (e.key === 'Escape') {
        if (cmdPaletteOpen){ setCmdPaletteOpen(false); return; }
        if (searchOpen)    { setSearchOpen(false); return; }
        if (locationModal) { setLocationModal(null); return; }
        if (confirm)       { closeConfirm(); return; }
        return;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [searchOpen, locationModal, confirm, closeConfirm, cmdPaletteOpen]);

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
    if (nav.panels) {
      setPanels(nav.panels.map(p => p ? { ...PANEL_DEFAULT, ...p } : null));
    } else {
      // Legacy: migrate old tab-based nav to single panel
      setPanels([{
        ...PANEL_DEFAULT,
        section: nav.tab||"characters",
        selectedCharId: nav.selectedCharId||null,
        selectedStoryId: nav.selectedStoryId||null,
        selectedFactionId: nav.selectedFactionId||null,
        selectedLocationId: nav.selectedLocationId||null,
      }, null]);
    }
  }, []); // eslint-disable-line

  // ── Initial load ─────────────────────────────────────────────────────────────
  useEffect(() => {
    window.electronAPI?.isDev?.().then(v => setIsDev(!!v)).catch(() => {});
  }, []);

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
        nav: { panels: panels.map(p => p ? { section: p.section, selectedCharId: p.selectedCharId||null, selectedStoryId: p.selectedStoryId||null, selectedFactionId: p.selectedFactionId||null, selectedLocationId: p.selectedLocationId||null } : null) },
      };
      try { await store.set(`fwb_campaign_${activeCampaignId}`, JSON.stringify(blob)); } catch { /* ignore save failures */ }
    }, 500);
    return () => clearTimeout(saveTimerRef.current);
  }, [chars, stories, races, factions, locations, notes, loreEvents, deities, relations, artifacts, charStatuses, relationshipTypes, storyStatuses, hookStatuses, locationTypes, rarities, deityAlignments, eras, mapData, galleryEntries, panels, loaded, activeCampaignId]);

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
      setPanels(prev=>prev.map(p=>p?.selectedCharId===id ? {...p,selectedCharId:null} : p));
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
  }, [chars, askConfirm, closeConfirm, pushHistory, showToast]); // eslint-disable-line react-hooks/exhaustive-deps


  const deleteStory = useCallback(id => {
    const s = stories.find(x=>x.id===id);
    askConfirm(`Delete story "${s?.name}"?`, () => {
      pushHistory();
      setStories(prev=>prev.filter(x=>x.id!==id));
      setPanels(prev=>prev.map(p=>p?.selectedStoryId===id ? {...p,selectedStoryId:null} : p));
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
  }, [stories, askConfirm, closeConfirm, pushHistory, showToast]); // eslint-disable-line react-hooks/exhaustive-deps

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
      setPanels(prev=>prev.map(p=>p?.selectedFactionId===id ? {...p,selectedFactionId:null} : p));
      setChars(prev=>prev.map(c=>({...c,factions:(c.factions||[]).filter(e=>e.factionId!==id)})));
      setStories(prev=>prev.map(s=>({...s,factionIds:(s.factionIds||[]).filter(fid=>fid!==id)})));
      setDeities(prev=>prev.map(d=>({...d,factionIds:(d.factionIds||[]).filter(fid=>fid!==id)})));
      closeConfirm();
      showToast("Faction deleted", "error");
    });
  }, [factions, askConfirm, closeConfirm, pushHistory, showToast]);

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
      setPanels(prev=>prev.map(p=>p?.selectedLocationId===id ? {...p,selectedLocationId:null} : p));
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
  }, [locations, askConfirm, closeConfirm, pushHistory, showToast]);

  // ── Global navigation (used by search/command palette — target best panel) ────
  const handleOpenStory = useCallback((story, highlightEventId = null, opts = {}) => {
    navToSection("stories", { selectedStoryId: story.id, storyHighlightEventId: highlightEventId||null, ...(opts.storySubTab ? { storySubTab: opts.storySubTab } : {}) });
  }, [navToSection]);

  const handleOpenChar = useCallback((char, opts = {}) => {
    navToSection("characters", { selectedCharId: char.id, ...(opts.charSubTab ? { charSubTab: opts.charSubTab } : {}) });
  }, [navToSection]);

  const handleShowOnMap = useCallback((location, panelIdx = 0) => {
    const allMaps = mapData?.maps || [];
    const matches = allMaps.flatMap(m => (m.pins||[]).filter(pin => pin.locationId === location.id).map(pin => ({ map: m, pin })));
    if (matches.length === 0) return;
    if (matches.length === 1) {
      navToSection("map", { mapNavTarget: { mapId: matches[0].map.id, pin: matches[0].pin } });
    } else {
      setMapPicker({ location, maps: matches, panelIdx });
    }
  }, [mapData, navToSection]);

  const handleOpenFaction = useCallback((faction) => {
    navToSection("factions", { selectedFactionId: faction.id });
  }, [navToSection]);

  const handleOpenLocation = useCallback((location) => {
    navToSection("locations", { selectedLocationId: location.id });
  }, [navToSection]);

  const handleOpenLoreEvent = useCallback(() => {
    navToSection("lore");
  }, [navToSection]);

  const handleSearchSelectArtifact = useCallback(() => {
    navToSection("items");
  }, [navToSection]);

  const handleImport = useCallback((c, s, r, f, loc, art, lore, rels, nts, md) => {
    setChars(c||[]); setStories(s||[]); setRaces(r||DEFAULT_RACES); setFactions(f||[]); setLocations(loc||[]);
    setArtifacts(art||[]); setLoreEvents(lore||[]); setRelations(rels||{nodes:[],edges:[]}); setNotes(nts||{scratch:"",sessions:[],pins:[],playerPins:{}});
    setMapData(md && md.maps ? md : {maps:[]});
    setPanels([{ ...PANEL_DEFAULT, section: "characters" }, null]);
    showToast("World imported", "info");
  }, [showToast]);

  // Stable modal openers — open in the panel showing the right section, else panel 0
  function openCharModal(type, panelIdx) {
    const newId = uid();
    pushHistory();
    setChars(prev => [...prev, {...defaultChar, type, id: newId, _isNew: true}]);
    if (panelIdx !== undefined) {
      setPanels(prev => { const np=[...prev]; np[panelIdx]={...(np[panelIdx]||PANEL_DEFAULT), section:"characters", selectedCharId:newId, charEditing:true}; return np; });
    } else {
      navToSection("characters", { selectedCharId: newId, charEditing: true });
    }
  }
  function cancelNewChar(id) {
    setChars(prev => prev.filter(c => c.id !== id));
    setPanels(prev => prev.map(p => p?.section === "characters" ? { ...p, selectedCharId: null, charEditing: false } : p));
  }
  function openStoryModal(panelIdx) {
    const newId = uid();
    pushHistory();
    setStories(prev => [...prev, {...defaultStory, id: newId, _isNew: true}]);
    if (panelIdx !== undefined) {
      setPanels(prev => { const np=[...prev]; np[panelIdx]={...(np[panelIdx]||PANEL_DEFAULT), section:"stories", selectedStoryId:newId, storyEditing:true}; return np; });
    } else {
      navToSection("stories", { selectedStoryId: newId, storyEditing: true });
    }
  }
  function cancelNewStory(id) {
    setStories(prev => prev.filter(s => s.id !== id));
    setPanels(prev => prev.map(p => p?.section === "stories" ? { ...p, selectedStoryId: null, storyEditing: false } : p));
  }
  function openFactionModal(panelIdx) {
    const newId = uid();
    pushHistory();
    setFactions(prev => [...prev, {...defaultFaction, id: newId, _isNew: true}]);
    if (panelIdx !== undefined) {
      setPanels(prev => { const np=[...prev]; np[panelIdx]={...(np[panelIdx]||PANEL_DEFAULT), section:"factions", selectedFactionId:newId, factionEditing:true}; return np; });
    } else {
      navToSection("factions", { selectedFactionId: newId, factionEditing: true });
    }
  }
  function cancelNewFaction(id) {
    setFactions(prev => prev.filter(f => f.id !== id));
    setPanels(prev => prev.map(p => p?.section === "factions" ? { ...p, selectedFactionId: null, factionEditing: false } : p));
  }
  const openLocationModal = useCallback(() => setLocationModal({...defaultLocation}), []);

  const handleOpenArtifactInStory = useCallback(a => {
    navToSection("items", { itemNavId: a.id });
  }, [navToSection]);

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
    setPanels([{ ...PANEL_DEFAULT, section: "characters" }, null]);
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
      nav: { panels: panelsRef.current.map(p => p ? { section: p.section, selectedCharId: p.selectedCharId||null, selectedStoryId: p.selectedStoryId||null, selectedFactionId: p.selectedFactionId||null, selectedLocationId: p.selectedLocationId||null } : null) },
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

  // ── Per-panel section renderer ────────────────────────────────────────────────
  function renderPanelSection(panel, panelIdx) {
    const upd = updates => updatePanel(panelIdx, updates);
    const storyStatusOrder = Object.fromEntries(storyStatuses.map((s,i)=>[s.name,i]));

    // Per-panel navigation — links within a panel stay in that panel;
    // Ctrl+click / middle-click (opts.newTab) opens in the OTHER panel
    const openInOther = (section, update) => {
      const otherIdx = panelIdx === 0 ? 1 : 0;
      setPanels(prev => { const np=[...prev]; np[otherIdx]={...(np[otherIdx]||PANEL_DEFAULT),section,...update}; return np; });
    };
    const nav = updates => navPanel(panelIdx, updates);
    const onOpenChar    = (c,opts={}) => opts.newTab ? openInOther("characters",{selectedCharId:c.id}) : nav({section:"characters",selectedCharId:c.id,...(opts.charSubTab?{charSubTab:opts.charSubTab}:{})});
    const onOpenStory   = (s,hlId=null,opts={}) => opts.newTab ? openInOther("stories",{selectedStoryId:s.id,storyHighlightEventId:hlId||null}) : nav({section:"stories",selectedStoryId:s.id,storyHighlightEventId:hlId||null,...(opts.storySubTab?{storySubTab:opts.storySubTab}:{})});
    const onOpenFaction = (f,opts={}) => opts.newTab ? openInOther("factions",{selectedFactionId:f.id}) : nav({section:"factions",selectedFactionId:f.id});
    const onOpenLocation= (l,opts={}) => opts.newTab ? openInOther("locations",{selectedLocationId:l.id}) : nav({section:"locations",selectedLocationId:l.id});
    const onOpenArtifact= (a,opts={}) => opts.newTab ? openInOther("items",{itemNavId:a.id}) : nav({section:"items",itemNavId:a.id});
    const onShowOnMap   = (location) => {
      const allMaps = mapData?.maps||[];
      const matches = allMaps.flatMap(m=>(m.pins||[]).filter(pin=>pin.locationId===location.id).map(pin=>({map:m,pin})));
      if (!matches.length) return;
      if (matches.length===1) nav({section:"map",mapNavTarget:{mapId:matches[0].map.id,pin:matches[0].pin}});
      else setMapPicker({location,maps:matches,panelIdx});
    };

    // Per-panel char filtering
    const pq = panel.query.toLowerCase();
    const filterChars = list => list.filter(c => {
      const raceLabel = getRaceLabel(races,c.raceId,c.subraceId).toLowerCase();
      const locationLabel = locations.find(l=>l.id===c.locationId)?.name?.toLowerCase()||"";
      const factionLabels = factions.filter(f=>(c.factions||[]).some(e=>e.factionId===f.id)).map(f=>f.name.toLowerCase()).join(" ");
      const matchQ = !pq||["name","shortDescription","description","secret","origin","class"].some(k=>c[k]?.toLowerCase().includes(pq))||raceLabel.includes(pq)||locationLabel.includes(pq)||factionLabels.includes(pq);
      const pf = panel.filters;
      const matchF = (!pf.raceId||c.raceId===pf.raceId)&&(!pf.locationId||c.locationId===pf.locationId)&&(!pf.status||c.status===pf.status)&&(!pf.factionId||(c.factions||[]).some(e=>e.factionId===pf.factionId));
      return matchQ && matchF;
    });
    const pAllPlayers = chars.filter(c=>c.type==="player");
    const pMain = filterChars(chars.filter(c=>c.type==="main")).sort((a,b)=>a.name.localeCompare(b.name));
    const pSide = filterChars(chars.filter(c=>c.type==="side")).sort((a,b)=>a.name.localeCompare(b.name));

    // Per-panel story filtering
    const sq = panel.storyQuery.toLowerCase();
    const pMainStory = stories.find(s=>s.isMain)||null;
    const pPlayerStories = stories.filter(s=>s.playerId&&!s.isMain);
    const pOtherStories = stories.filter(s=>!s.isMain&&!s.playerId).filter(s=>{
      const matchText=!sq||s.name.toLowerCase().includes(sq)||(s.summary||"").toLowerCase().includes(sq);
      return matchText&&(!panel.storyStatusFilter||s.status===panel.storyStatusFilter);
    }).sort((a,b)=>(storyStatusOrder[a.status]??9999)-(storyStatusOrder[b.status]??9999));

    const pSelectedChar     = chars.find(c=>c.id===panel.selectedCharId)||null;
    const pSelectedStory    = stories.find(s=>s.id===panel.selectedStoryId)||null;
    const pSelectedFaction  = factions.find(f=>f.id===panel.selectedFactionId)||null;
    const pSelectedLocation = locations.find(l=>l.id===panel.selectedLocationId)||null;

    const section = panel.section;
    if (section==="characters") return <CharactersTabContent
      chars={chars} races={races} factions={factions} locations={locations}
      stories={stories} loreEvents={loreEvents} artifacts={artifacts}
      charStatuses={charStatuses} storyStatuses={storyStatuses}
      hookStatuses={hookStatuses} relationshipTypes={relationshipTypes}
      allPlayers={pAllPlayers} main={pMain} side={pSide}
      query={panel.query} filters={panel.filters}
      selectedChar={pSelectedChar} selectedCharId={panel.selectedCharId}
      charSubTab={panel.charSubTab} mainCollapsed={panel.mainCollapsed} sideCollapsed={panel.sideCollapsed}
      updPg={upd}
      onNewChar={(type) => openCharModal(type, panelIdx)} onDeleteChar={deleteChar} onCancelNew={cancelNewChar}
      onOpenStory={onOpenStory} onOpenFaction={onOpenFaction} onOpenChar={onOpenChar} onOpenArtifact={onOpenArtifact}
      onSaveChar={saveChar} onSaveFaction={saveFaction} onUpdateArtifacts={updateArtifacts}
      onPinCharHook={handlePinCharHook} pinnedCharHookIds={pinnedCharHookIds} rarities={rarities}/>;
    if (section==="stories") return <StoriesTabContent
      stories={stories} chars={chars} factions={factions} locations={locations} artifacts={artifacts}
      storyStatuses={storyStatuses} hookStatuses={hookStatuses}
      storyQuery={panel.storyQuery} storyStatusFilter={panel.storyStatusFilter}
      selectedStory={pSelectedStory} selectedStoryId={panel.selectedStoryId}
      storySubTab={panel.storySubTab} storyHighlightEventId={panel.storyHighlightEventId}
      mainStory={pMainStory} playerStories={pPlayerStories} otherStories={pOtherStories}
      currentTimelineDate={currentTimelineDate}
      updPg={upd}
      onNewStory={() => openStoryModal(panelIdx)} onDeleteStory={deleteStory} onCancelNew={cancelNewStory}
      onSetMain={setMainStory} onSetPlayerStory={setPlayerStory} onUpdateStory={updateStory}
      onOpenChar={onOpenChar} onOpenFaction={onOpenFaction} onOpenLocation={onOpenLocation}
      onOpenArtifact={onOpenArtifact} onUpdateArtifacts={updateArtifacts}
      onAskConfirm={askConfirm} onCloseConfirm={closeConfirm}
      onPinHook={handlePinHook} pinnedHookIds={pinnedHookIds} rarities={rarities}/>;
    const fq = (panel.factionQuery||"").toLowerCase();
    const pFilteredFactions = factions.filter(f => !fq || f.name.toLowerCase().includes(fq) || (f.description||"").toLowerCase().includes(fq));
    if (section==="factions") return <FactionsTabContent
      factions={factions} filteredFactions={pFilteredFactions} chars={chars} locations={locations}
      factionQuery={panel.factionQuery||""}
      selectedFaction={pSelectedFaction} selectedFactionId={panel.selectedFactionId}
      updPg={upd}
      onNewFaction={() => openFactionModal(panelIdx)} onCancelNew={cancelNewFaction}
      onSaveFaction={saveFaction} onDeleteFaction={deleteFaction} onOpenChar={onOpenChar} onSaveChar={saveChar}/>;
    if (section==="timeline") return <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minHeight:0 }}>
      <div style={{ padding:"28px 32px 12px", flexShrink:0 }}>
        <h1 style={{ fontFamily:"Georgia,serif", color:"#e8d5b7", margin:"0 0 6px", fontSize:26 }}>Timeline</h1>
        <p style={{ color:"#5a4a7a", fontSize:13, margin:0 }}>All events across every story, grouped by date.</p>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"0 32px 28px", minHeight:0 }}>
        <GlobalTimeline stories={stories} chars={chars} loreEvents={loreEvents} eras={eras} onOpenStory={onOpenStory} onOpenChar={onOpenChar}/>
      </div>
    </div>;
    if (section==="locations") return <LocationsTabContent
      locations={locations} chars={chars} factions={factions} stories={stories} mapData={mapData}
      locationQuery={panel.locationQuery} locationTypeFilter={panel.locationTypeFilter} collapsedLocTypes={panel.collapsedLocTypes}
      selectedLocation={pSelectedLocation} selectedLocationId={panel.selectedLocationId}
      updPg={upd}
      onNewLocation={openLocationModal}
      onSaveLocation={saveLocation} onDeleteLocation={deleteLocation}
      onOpenChar={onOpenChar} onOpenStory={onOpenStory} onOpenFaction={onOpenFaction}
      onSaveFaction={saveFaction}
      onShowOnMap={onShowOnMap}
      locationTypes={locationTypes}/>;
    if (section==="items") return <ArtifactsTab artifacts={artifacts} onUpdateArtifacts={updateArtifacts} chars={chars} stories={stories} onOpenChar={onOpenChar} onOpenStory={onOpenStory} onAskConfirm={askConfirm} onCloseConfirm={closeConfirm} navArtifactId={panel.itemNavId} rarities={rarities}/>;
    if (section==="map") return <MapTab mapData={mapData} onUpdateMapData={updateMapData} locations={locations} onOpenLocation={onOpenLocation} onAskConfirm={askConfirm} onCloseConfirm={closeConfirm} navTarget={panel.mapNavTarget} locationTypes={locationTypes}/>;
    if (section==="lore") return <div style={{ flex:1, overflowY:"auto", padding:"28px 32px" }}><LoreTab events={loreEvents} chars={chars} onUpdateEvents={updateLoreEvents} onOpenChar={onOpenChar} onAskConfirm={askConfirm} onCloseConfirm={closeConfirm} deities={deities} onUpdateDeities={updateDeities} factions={factions} locations={locations} deityAlignments={deityAlignments} eras={eras}/></div>;
    if (section==="relations") return <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minHeight:0 }}><RelationshipWeb chars={chars} stories={stories} relationshipTypes={relationshipTypes} onOpenChar={onOpenChar} onOpenStory={onOpenStory}/></div>;
    if (section==="gallery") return <div style={{ flex:1, overflowY:"auto", padding:"28px 32px" }}><GalleryTabContent images={galleryImages} galleryEntries={galleryEntries} onUpdateEntries={setGalleryEntries}/></div>;
    if (section==="notes") return <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minHeight:0 }}><NotesTabContent notes={notes} setNotes={setNotes}/></div>;
    if (section==="sessions") return <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minHeight:0 }}><SessionLogTabContent notes={notes} setNotes={setNotes} chars={chars} stories={stories} setStories={setStories} storyStatuses={storyStatuses} onOpenStory={onOpenStory}/></div>;
    if (section==="hooks") return <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minHeight:0 }}><HooksTabContent notes={notes} setNotes={setNotes} chars={chars} factions={factions} locations={locations} stories={stories} setStories={setStories} artifacts={artifacts} hookStatuses={hookStatuses} onOpenStory={onOpenStory} onOpenChar={onOpenChar} onPinHook={handlePinHook} onPinCharHook={handlePinCharHook} onUpdateStory={updateStory} onUpdateChar={updateChar}/></div>;
    if (section==="settings") return <div style={{ flex:1, overflowY:"auto", padding:"28px 32px" }}><SettingsTab races={races} setRaces={updateRaces} charStatuses={charStatuses} setCharStatuses={updateCharStatuses} relationshipTypes={relationshipTypes} setRelationshipTypes={updateRelationshipTypes} storyStatuses={storyStatuses} setStoryStatuses={updateStoryStatuses} hookStatuses={hookStatuses} setHookStatuses={updateHookStatuses} locationTypes={locationTypes} setLocationTypes={setLocationTypes} rarities={rarities} setRarities={setRarities} deityAlignments={deityAlignments} setDeityAlignments={setDeityAlignments} setChars={updateCharsFromSettings} eras={eras} setEras={setEras}/></div>;
    return null;
  }

  return (
    <GalleryContext.Provider value={{ openGallery }}>
    <div style={{ display:"flex", height:"100vh", width:"100vw", background:"#0d0b14", color:"#e8d5b7", fontFamily:"system-ui,sans-serif" }}>

      {/* ── Sidebar: draggable section icons ───────────────────────────────── */}
      <div style={{ width:74, background:"#110e1c", borderRight:"1px solid #2a1f3d", display:"flex", flexDirection:"column", flexShrink:0, alignItems:"center", paddingTop:8, paddingBottom:4 }}>
        {/* Top tools */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, paddingBottom:8, borderBottom:"1px solid #2a1f3d", width:"100%", paddingLeft:0, paddingRight:0 }}>
          <div title="World Builder" style={{ fontSize:24, color:"#c8a96e", lineHeight:1, padding:"4px 0" }}>⚗️</div>
          <button onClick={()=>setCampaignManagerOpen(true)} title={activeCampaign?.name||"Campaign"}
            style={{ width:44, height:36, display:"flex", alignItems:"center", justifyContent:"center", background:"#1a1228", border:"1px solid #3a2a5a", borderRadius:6, cursor:"pointer", fontSize:18, lineHeight:1, transition:"border-color .15s" }}
            onMouseEnter={e=>e.currentTarget.style.borderColor="#7c5cbf"}
            onMouseLeave={e=>e.currentTarget.style.borderColor="#3a2a5a"}>🗂️</button>
          <button onClick={()=>setCmdPaletteOpen(true)} title="Search (Ctrl+K)"
            style={{ width:44, height:36, display:"flex", alignItems:"center", justifyContent:"center", background:"#0d0b14", border:"1px solid #2a1f3d", borderRadius:6, cursor:"pointer", fontSize:18 }}>🔍</button>
        </div>

        {/* Draggable section icons — drag to open in a panel */}
        <nav style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", alignItems:"center", gap:1, paddingTop:6, paddingBottom:4, width:"100%" }}>
          {ALL_TABS.map(t => (
            <div key={t.id}
              draggable
              onDragStart={e => { e.dataTransfer.setData("text/plain", t.id); e.dataTransfer.effectAllowed="copy"; setDraggingSection(t.id); }}
              onDragEnd={() => setDraggingSection(null)}
              onDoubleClick={() => openInPanel(1, t.id)}
              title={`${t.label.replace(/^\S+\s/,"")} — drag to open · double-click for right screen`}
              style={{ width:50, height:44, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:7, cursor:"grab", fontSize:22, userSelect:"none", flexShrink:0, transition:"background .12s" }}
              onMouseEnter={e=>e.currentTarget.style.background="#1e1630"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              {t.icon}
            </div>
          ))}
        </nav>

        {/* DEV badge */}
        {isDev && (
          <div style={{ width:"100%", padding:"4px 0", marginBottom:4, background:"#5a0a0a", border:"1px solid #a01a1a", borderRadius:0, textAlign:"center" }}>
            <span style={{ fontSize:9, fontWeight:700, color:"#ff8080", letterSpacing:1, textTransform:"uppercase" }}>DEV</span>
          </div>
        )}

        {/* Bottom tools */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, paddingTop:6, borderTop:"1px solid #2a1f3d", width:"100%" }}>
          <button onClick={()=>setHelpOpen(true)} title="Help & Shortcuts"
            style={{ width:44, height:36, display:"flex", alignItems:"center", justifyContent:"center", background:"transparent", border:"1px solid #3a2a5a", borderRadius:6, color:"#9a7fa0", cursor:"pointer", fontSize:16, transition:"color .15s, border-color .15s" }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor="#7c5cbf"; e.currentTarget.style.color="#e8d5b7"; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor="#3a2a5a"; e.currentTarget.style.color="#9a7fa0"; }}>?</button>
          <button onClick={undo} disabled={historyLen===0} title={`Undo (Ctrl+Z)${historyLen>0?` — ${historyLen}`:""}`}
            style={{ width:44, height:36, display:"flex", alignItems:"center", justifyContent:"center", background:"transparent", border:"1px solid #3a2a5a", borderRadius:6, color:historyLen===0?"#3a2a5a":"#9a7fa0", cursor:historyLen===0?"default":"pointer", fontSize:16, transition:"color .15s, border-color .15s" }}
            onMouseEnter={e=>{ if(historyLen>0){ e.currentTarget.style.borderColor="#7c5cbf"; e.currentTarget.style.color="#e8d5b7"; }}}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor="#3a2a5a"; e.currentTarget.style.color=historyLen===0?"#3a2a5a":"#9a7fa0"; }}>↩</button>
          <SaveLoadBar chars={chars} stories={stories} races={races} factions={factions} locations={locations} artifacts={artifacts} loreEvents={loreEvents} relations={relations} notes={notes} mapData={mapData} onImport={handleImport} showToast={showToast} compact/>
        </div>
      </div>

      {/* ── Panel slots ─────────────────────────────────────────────────────── */}
      <div style={{ flex:1, display:"flex", overflow:"hidden", minWidth:0, gap:6, padding:"6px", background:"#080610" }}>
        {panels.map((panel, panelIdx) => {
          const hasSibling = panels[panelIdx === 0 ? 1 : 0] !== null;
          const isOver = dragOverPanel?.idx === panelIdx;
          const overLabel = (() => {
            if (!dragOverPanel) return "";
            if (dragOverPanel.isEntity) return dragOverPanel.entityLabel || "Character";
            return dragOverPanel.section ? (ALL_TABS.find(t=>t.id===dragOverPanel.section)?.label || dragOverPanel.section) : "";
          })();

          const onDrop = e => {
            const entityRaw = e.dataTransfer.getData("application/x-wbentity");
            if (entityRaw) {
              e.preventDefault();
              try {
                const { entityType, id } = JSON.parse(entityRaw);
                if (entityType === "character") {
                  setPanels(prev => {
                    const np = [...prev];
                    const existing = np[panelIdx];
                    np[panelIdx] = { ...(existing || PANEL_DEFAULT), section: "characters", selectedCharId: id };
                    return np;
                  });
                }
              } catch {}
              setDragOverPanel(null);
              return;
            }
            // Only intercept section drops from the sidebar (tracked by draggingSection)
            if (draggingSection) {
              e.preventDefault();
              if (draggingSection !== panel?.section) openInPanel(panelIdx, draggingSection);
              setDragOverPanel(null);
              return;
            }
            // File drops and other external drags — don't intercept, let native handlers take over
            setDragOverPanel(null);
          };
          const onDragOver = e => {
            const isEntity = e.dataTransfer.types.includes("application/x-wbentity");
            const isSection = !!draggingSection;
            // Only intercept internal drags (sidebar sections or entity chips); let file drags pass through
            if (!isEntity && !isSection) return;
            e.preventDefault();
            if (isEntity) {
              if (!dragOverPanel || dragOverPanel.idx !== panelIdx) setDragOverPanel({ idx: panelIdx, isEntity: true, entityLabel: "Character" });
              return;
            }
            if (draggingSection && draggingSection === panel?.section) { setDragOverPanel(null); return; }
            if (!dragOverPanel || dragOverPanel.idx !== panelIdx) setDragOverPanel({ idx: panelIdx, section: draggingSection });
          };
          const onDragLeave = e => {
            if (!e.currentTarget.contains(e.relatedTarget)) setDragOverPanel(null);
          };

          if (!panel) {
            return (
              <div key={panelIdx}
                onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
                style={{ flex: hasSibling ? "0 0 80px" : 1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background: isOver ? "#1a1040" : "#0d0b14", border: isOver ? "2px dashed #7c5cbf" : "1px solid #1e1630", transition:"background .15s", cursor:"default", position:"relative" }}>
                {isOver
                  ? <div style={{ textAlign:"center", pointerEvents:"none" }}>
                      <div style={{ fontSize:28, marginBottom:8 }}>{dragOverPanel?.isEntity ? "👤" : "+"}</div>
                      <div style={{ fontSize:13, color:"#c8a96e", fontFamily:"Georgia,serif" }}>{dragOverPanel?.isEntity ? `Open ${overLabel}` : `Add ${overLabel}`}</div>
                    </div>
                  : hasSibling
                    ? <span style={{ color:"#2a1f3d", fontSize:22, userSelect:"none" }}>+</span>
                    : <div style={{ textAlign:"center", pointerEvents:"none" }}>
                        <div style={{ fontSize:44, opacity:.18, marginBottom:14 }}>⚗️</div>
                        <div style={{ color:"#3a2a5a", fontSize:14, fontFamily:"Georgia,serif", lineHeight:1.6 }}>Drag a section<br/>from the sidebar</div>
                      </div>
                }
              </div>
            );
          }

          const sectionLabel = ALL_TABS.find(t=>t.id===panel.section)?.label || panel.section;
          return (
            <div key={panelIdx}
              style={{ flex: 1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0, border:"1px solid #1e1630", borderRadius:6, position:"relative", transform:"translateZ(0)" }}
              onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
              {/* Panel header */}
              <div style={{ display:"flex", alignItems:"center", padding:"0 12px 0 8px", background:"#110e1c", borderBottom:"1px solid #2a1f3d", flexShrink:0, height:36, gap:4 }}>
                {(panel.history||[]).length > 0 && (
                  <button onClick={()=>goBack(panelIdx)} title="Go back"
                    style={{ background:"none", border:"none", color:"#7c5cbf", cursor:"pointer", fontSize:15, lineHeight:1, padding:"2px 6px", borderRadius:4, flexShrink:0, transition:"color .12s" }}
                    onMouseEnter={e=>e.currentTarget.style.color="#c8a96e"}
                    onMouseLeave={e=>e.currentTarget.style.color="#7c5cbf"}>←</button>
                )}
                <span style={{ fontSize:13, color:"#c8a96e", fontWeight:600, flex:1 }}>{sectionLabel}</span>
                <button onClick={()=>closePanel(panelIdx)}
                  style={{ background:"none", border:"none", color:"#4a3a6a", cursor:"pointer", fontSize:18, lineHeight:1, padding:"2px 4px", borderRadius:4, transition:"color .12s" }}
                  onMouseEnter={e=>e.currentTarget.style.color="#c06060"}
                  onMouseLeave={e=>e.currentTarget.style.color="#4a3a6a"}>×</button>
              </div>
              {/* Section content */}
              <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minHeight:0 }}>
                {renderPanelSection(panel, panelIdx)}
              </div>
              {/* Drop overlay */}
              {isOver && (
                <div style={{ position:"absolute", inset:0, zIndex:50, background:"#0d0b14cc", border:"2px dashed #7c5cbf", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10, pointerEvents:"none", backdropFilter:"blur(2px)" }}>
                  <div style={{ fontSize:36 }}>{dragOverPanel?.isEntity ? "👤" : "+"}</div>
                  <div style={{ fontSize:16, color:"#c8a96e", fontFamily:"Georgia,serif", fontWeight:700 }}>Open {overLabel}</div>
                  <div style={{ fontSize:12, color:"#7c5cbf" }}>
                    {dragOverPanel?.isEntity ? "Drop to view in this screen" : "Drop to replace this screen"}
                  </div>
                </div>
              )}
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
                <button key={map.id} onClick={() => { navPanel(mapPicker.panelIdx ?? 0, { section:"map", mapNavTarget: { mapId: map.id, pin } }); setMapPicker(null); }}
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
