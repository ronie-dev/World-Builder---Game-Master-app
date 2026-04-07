import { btnSecondary, DEFAULT_RACES } from "../constants.js";

function buildJson(data) {
  return JSON.stringify(data, null, 2);
}

function parseImport(raw) {
  const d = JSON.parse(raw);
  if (!d.chars || !d.stories) throw new Error("Invalid save file.");
  return d;
}

export default function SaveLoadBar({ chars, stories, races, factions, locations, artifacts, loreEvents, relations, notes, mapData, onImport, showToast, compact }) {
  const handleExport = async () => {
    const json = buildJson({ chars, stories, races, factions, locations, artifacts, loreEvents, relations, notes, mapData });
    const result = await window.electronAPI.saveWorldDialog(json);
    if (result?.success) showToast?.("World exported");
  };

  const handleImport = async () => {
    const result = await window.electronAPI.loadWorldDialog();
    if (!result.success) return;
    try {
      const d = parseImport(result.content);
      onImport(
        d.chars, d.stories, d.races || DEFAULT_RACES, d.factions || [],
        d.locations || [], d.artifacts || [], d.loreEvents || [],
        d.relations || { nodes:[], edges:[] }, d.notes || null,
        d.mapData || { maps:[] }
      );
    } catch { showToast?.("Could not read file.", "error"); }
  };

  if (compact) return (
    <>
      <button onClick={handleExport} title="Export world" style={{ width:44, height:36, display:"flex", alignItems:"center", justifyContent:"center", background:"transparent", border:"1px solid #3a2a5a", borderRadius:6, cursor:"pointer", fontSize:18, transition:"border-color .15s" }}
        onMouseEnter={e=>e.currentTarget.style.borderColor="#7c5cbf"} onMouseLeave={e=>e.currentTarget.style.borderColor="#3a2a5a"}>💾</button>
      <button onClick={handleImport} title="Import world" style={{ width:44, height:36, display:"flex", alignItems:"center", justifyContent:"center", background:"transparent", border:"1px solid #3a2a5a", borderRadius:6, cursor:"pointer", fontSize:18, transition:"border-color .15s" }}
        onMouseEnter={e=>e.currentTarget.style.borderColor="#7c5cbf"} onMouseLeave={e=>e.currentTarget.style.borderColor="#3a2a5a"}>📂</button>
    </>
  );
  return (
    <div style={{ display:"flex", gap:8, padding:"10px 16px", borderTop:"1px solid #2a1f3d" }}>
      <button onClick={handleExport} style={{...btnSecondary, flex:1, fontSize:12, padding:"6px 0", textAlign:"center"}}>💾 Export</button>
      <button onClick={handleImport} style={{...btnSecondary, flex:1, fontSize:12, padding:"6px 0", textAlign:"center"}}>📂 Import</button>
    </div>
  );
}
