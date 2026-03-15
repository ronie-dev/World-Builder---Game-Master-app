import { memo } from "react";
import { LOCATION_TYPES, btnPrimary, btnSecondary, iconBtn, inputStyle, selStyle } from "../../constants.js";
import Avatar from "../Avatar.jsx";
import LocationDetailPanel from "../LocationDetailPanel.jsx";

function LocationCard({ location, chars, factions, stories, onEdit, onDelete, isSelected, onSelect }) {
  const residents = chars.filter(c => c.locationId===location.id && c.type!=="side");
  const linkedFactions = (factions||[]).filter(f => f.location && f.location.toLowerCase()===location.name.toLowerCase());
  const linkedStories = (stories||[]).filter(s => (s.locationIds||[]).includes(location.id));
  return (
    <div onClick={()=>onSelect(location)} style={{ background:isSelected?"#1e1535":"#1a1228", border:`1px solid ${isSelected?"#7c5cbf":"#3a2a5a"}`, borderRadius:10, padding:16, cursor:"pointer", transition:"border-color .15s, background .15s", userSelect:"none" }}
      onMouseEnter={e=>{ if(!isSelected) e.currentTarget.style.borderColor="#5a3da0"; }}
      onMouseLeave={e=>{ if(!isSelected) e.currentTarget.style.borderColor="#3a2a5a"; }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
            <span style={{ color:"#e8d5b7", fontWeight:700, fontSize:15, fontFamily:"Georgia,serif" }}>📍 {location.name}</span>
            {location.type&&<span style={{ background:"#1a3a6b", color:"#e8d5b7", borderRadius:4, padding:"2px 8px", fontSize:11, fontWeight:700, letterSpacing:1 }}>{location.type}</span>}
            {location.region&&<span style={{ fontSize:11, color:"#9a7fa0" }}>🗺️ {location.region}</span>}
          </div>
          {location.description&&<p style={{ margin:"0 0 8px", fontSize:13, color:"#9a7fa0", lineHeight:1.5 }}>{location.description.slice(0,120)}{location.description.length>120?"…":""}</p>}
          {(residents.length>0||linkedFactions.length>0||linkedStories.length>0)&&(
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
              {residents.map(c=>(
                <div key={c.id} style={{ display:"flex", alignItems:"center", gap:4, background:"#1e1630", borderRadius:12, padding:"2px 8px 2px 4px" }}>
                  <Avatar src={c.image} name={c.name} size={18}/><span style={{ fontSize:11, color:"#9a7fa0" }}>{c.name}</span>
                </div>
              ))}
              {linkedFactions.map(f=>(
                <div key={f.id} style={{ display:"flex", alignItems:"center", gap:4, background: f.color ? `${f.color}33` : "#2a1f3d", border:`1px solid ${f.color||"#5a3da0"}`, borderRadius:12, padding:"2px 8px", fontSize:11, color: f.color||"#b09080" }}>
                  ⚑ {f.name}
                </div>
              ))}
              {linkedStories.map(s=>(
                <div key={s.id} style={{ display:"flex", alignItems:"center", gap:4, background:"#1a2a3a", border:"1px solid #2a4a6a", borderRadius:12, padding:"2px 8px", fontSize:11, color:"#7aafd4" }}>
                  📜 {s.name}
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display:"flex", gap:5, flexShrink:0 }} onClick={e=>e.stopPropagation()}>
          <button onClick={()=>onEdit(location)} style={iconBtn}>✏️</button>
          <button onClick={()=>onDelete(location.id)} style={{...iconBtn,color:"#c06060"}}>🗑️</button>
        </div>
      </div>
    </div>
  );
}

function LocationsTabContent({
  locations, chars, factions, stories, mapData,
  locationQuery, locationTypeFilter, collapsedLocTypes,
  selectedLocation, selectedLocationId,
  updPg,
  onNewLocation, onSaveLocation, onDeleteLocation,
  onOpenChar, onOpenStory, onOpenFaction, onShowOnMap,
}) {
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minHeight:0, padding:"28px 32px 0" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18, flexShrink:0 }}>
        <h1 style={{ fontFamily:"Georgia,serif", color:"#e8d5b7", margin:0, fontSize:26 }}>Locations</h1>
        <button onClick={onNewLocation} style={btnPrimary}>+ New Location</button>
      </div>
      <div style={{ flex:1, display:"flex", gap:24, overflow:"hidden", minHeight:0, paddingBottom:28 }}>
        <div style={{ flex:1, minWidth:0, overflowY:"auto", paddingRight:12 }}>
          <div style={{ display:"flex", gap:10, marginBottom:16, alignItems:"center" }}>
            <div style={{ position:"relative", flex:1 }}>
              <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#5a4a7a", fontSize:13 }}>🔍</span>
              <input placeholder="Search locations…" value={locationQuery} onChange={e=>updPg({locationQuery:e.target.value})} style={{...inputStyle,paddingLeft:30,fontSize:13}}/>
            </div>
            <select value={locationTypeFilter} onChange={e=>updPg({locationTypeFilter:e.target.value})} style={{...selStyle,width:"auto",minWidth:130,fontSize:13}}>
              <option value="">All Types</option>
              {LOCATION_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
            {(locationQuery||locationTypeFilter)&&<button onClick={()=>updPg({locationQuery:"",locationTypeFilter:""})} style={{...btnSecondary,fontSize:12,padding:"7px 10px",whiteSpace:"nowrap"}}>✕ Clear</button>}
          </div>
          {locations.length===0
            ? <div style={{ textAlign:"center", padding:"60px 0", color:"#5a4a7a", border:"1px dashed #3a2a5a", borderRadius:12, fontSize:14 }}>No locations yet.<br/><span style={{ fontSize:13 }}>Click "+ New Location" to create your first location.</span></div>
            : (()=>{
                const q=locationQuery.toLowerCase();
                const filtered=locations.filter(l=>(!q||l.name?.toLowerCase().includes(q)||l.region?.toLowerCase().includes(q)||l.description?.toLowerCase().includes(q))&&(!locationTypeFilter||l.type===locationTypeFilter));
                const grouped=LOCATION_TYPES.reduce((acc,t)=>{ const items=filtered.filter(l=>l.type===t); if(items.length) acc.push({type:t,items}); return acc; },[]);
                const ungrouped=filtered.filter(l=>!l.type||!LOCATION_TYPES.includes(l.type));
                if(ungrouped.length) grouped.push({type:"Other",items:ungrouped});
                if(!grouped.length) return <div style={{ textAlign:"center", padding:"40px 0", color:"#5a4a7a", fontSize:13 }}>No locations match.</div>;
                return grouped.map(({type,items})=>{
                  const collapsed=collapsedLocTypes[type];
                  return (
                    <div key={type} style={{ marginBottom:18 }}>
                      <div onClick={()=>updPg({ collapsedLocTypes: {...collapsedLocTypes, [type]: !collapsedLocTypes[type]} })} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, cursor:"pointer", userSelect:"none" }}>
                        <span style={{ fontSize:13, color:"#9a7fa0" }}>{collapsed?"▶":"▼"}</span>
                        <h2 style={{ color:"#c8a96e", fontFamily:"Georgia,serif", margin:0, fontSize:15 }}>{type}</h2>
                        <span style={{ fontSize:11, color:"#5a4a7a" }}>({items.length})</span>
                      </div>
                      {!collapsed&&(
                        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                          {items.map(l=>(
                            <LocationCard key={l.id} location={l} chars={chars} factions={factions} stories={stories}
                              onEdit={l=>updPg({ selectedLocationId: l.id })}
                              onDelete={onDeleteLocation}
                              isSelected={selectedLocation?.id===l.id}
                              onSelect={l=>updPg({ selectedLocationId: selectedLocationId===l.id?null:l.id })}/>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                });
              })()
          }
        </div>
        <div style={{ flex:1, minWidth:0, overflowY:"auto" }}>
          {selectedLocation
            ? <LocationDetailPanel location={selectedLocation} chars={chars} factions={factions} stories={stories}
                onClose={()=>updPg({ selectedLocationId: null })}
                onSave={onSaveLocation}
                onDelete={id=>{ onDeleteLocation(id); updPg({ selectedLocationId: null }); }}
                onOpenChar={onOpenChar} onOpenStory={onOpenStory} onOpenFaction={onOpenFaction}
                onShowOnMap={(mapData?.maps||[]).some(m=>(m.pins||[]).some(p=>p.locationId===selectedLocation.id)) ? ()=>onShowOnMap(selectedLocation) : undefined}/>
            : <div style={{ background:"#13101f", border:"1px dashed #2a1f3d", borderRadius:12, padding:"48px 24px", textAlign:"center", color:"#3a2a5a" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>📍</div>
                <div style={{ fontSize:14, fontFamily:"Georgia,serif" }}>Select a location to view details</div>
              </div>
          }
        </div>
      </div>
    </div>
  );
}

export default memo(LocationsTabContent);
