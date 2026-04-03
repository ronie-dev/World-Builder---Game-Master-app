import { useState, useEffect, useRef } from "react";

const TYPES = [
  { key:"char",     label:"Character",  icon:"👤", color:"#7c5cbf" },
  { key:"story",    label:"Story",      icon:"📖", color:"#c8a96e" },
  { key:"faction",  label:"Faction",    icon:"⚑",  color:"#5a9cbf" },
  { key:"location", label:"Location",   icon:"📍", color:"#6abf7c" },
  { key:"lore",     label:"Lore Event", icon:"🏛️", color:"#bf7c5a" },
];

export default function CommandPalette({ chars, stories, factions, locations, loreEvents, onOpenChar, onOpenStory, onOpenFaction, onOpenLocation, onOpenLore, onClose }) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const all = [
    ...chars.map(c => ({ type:"char", id:c.id, label:c.name||"Unnamed", sub:c.shortDescription||c.type||"", item:c })),
    ...(stories||[]).map(s => ({ type:"story", id:s.id, label:s.name||"Unnamed", sub:s.summary||s.status||"", item:s })),
    ...(factions||[]).map(f => ({ type:"faction", id:f.id, label:f.name||"Unnamed", sub:f.type||"", item:f })),
    ...(locations||[]).map(l => ({ type:"location", id:l.id, label:l.name||"Unnamed", sub:l.region||l.type||"", item:l })),
    ...(loreEvents||[]).map(e => ({ type:"lore", id:e.id, label:e.title||"Untitled event", sub:e.year?`Year ${e.year}`:"", item:e })),
  ];

  const q = query.toLowerCase().trim();
  const results = all.filter(r => {
    if (typeFilter && r.type !== typeFilter) return false;
    if (!q) return true;
    return r.label.toLowerCase().includes(q) || r.sub.toLowerCase().includes(q);
  }).slice(0, 60);

  const grouped = TYPES.map(t => ({ ...t, items: results.filter(r => r.type === t.key) })).filter(g => g.items.length > 0);
  const flat = grouped.flatMap(g => g.items);

  useEffect(() => {
    const idx = flat[activeIdx] ? activeIdx : 0;
    const el = listRef.current?.querySelector(`[data-idx="${idx}"]`);
    if (el) el.scrollIntoView({ block:"nearest" });
  }, [activeIdx, flat]);

  const open = r => {
    onClose();
    if (r.type === "char")     onOpenChar(r.item);
    else if (r.type === "story")    onOpenStory(r.item);
    else if (r.type === "faction")  onOpenFaction(r.item);
    else if (r.type === "location") onOpenLocation(r.item);
    else if (r.type === "lore")     onOpenLore(r.item);
  };

  const handleKey = e => {
    if (e.key === "ArrowDown")  { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, flat.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter")   { const item = flat[activeIdx] ?? flat[0]; if (item) open(item); }
    else if (e.key === "Escape")  { onClose(); }
  };

  return (
    <div
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position:"fixed", inset:0, zIndex:9999, display:"flex", alignItems:"flex-start", justifyContent:"center", paddingTop:110, background:"#00000077", backdropFilter:"blur(4px)" }}>
      <div style={{ width:"100%", maxWidth:640, background:"#1a1228", border:"1px solid #3a2a5a", borderRadius:14, boxShadow:"0 28px 72px #000000cc", overflow:"hidden" }}>

        {/* Input row */}
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 18px", borderBottom:"1px solid #2a1f3d" }}>
          <span style={{ fontSize:16, color:"#5a4a7a", flexShrink:0 }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIdx(0); }}
            onKeyDown={handleKey}
            placeholder="Search characters, stories, factions, locations, events…"
            style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"#e8d5b7", fontSize:15, fontFamily:"system-ui,sans-serif" }}/>
          <kbd style={{ fontSize:11, color:"#4a3a6a", border:"1px solid #3a2a5a", borderRadius:4, padding:"2px 7px", fontFamily:"monospace", flexShrink:0 }}>Esc</kbd>
        </div>

        {/* Type filter tabs */}
        <div style={{ display:"flex", gap:4, padding:"8px 18px", borderBottom:"1px solid #1e1630", flexWrap:"wrap" }}>
          <button onClick={()=>{ setTypeFilter(""); setActiveIdx(0); }}
            style={{ padding:"3px 10px", borderRadius:10, border:`1px solid ${!typeFilter?"#7c5cbf":"#2a1f3d"}`, background:!typeFilter?"#7c5cbf22":"transparent", color:!typeFilter?"#c8b89a":"#4a3a6a", cursor:"pointer", fontSize:11, transition:"all .12s" }}>
            All
          </button>
          {TYPES.map(t => (
            <button key={t.key} onClick={()=>{ setTypeFilter(f => f===t.key?"":t.key); setActiveIdx(0); }}
              style={{ padding:"3px 10px", borderRadius:10, border:`1px solid ${typeFilter===t.key?t.color+"88":"#2a1f3d"}`, background:typeFilter===t.key?t.color+"22":"transparent", color:typeFilter===t.key?t.color:"#4a3a6a", cursor:"pointer", fontSize:11, transition:"all .12s" }}>
              {t.icon} {t.label}s
            </button>
          ))}
        </div>

        {/* Results */}
        <div ref={listRef} style={{ maxHeight:380, overflowY:"auto", scrollbarWidth:"thin", scrollbarColor:"#3a2a5a transparent" }}>
          {flat.length === 0 && (
            <div style={{ padding:"40px 0", textAlign:"center", color:"#4a3a6a", fontSize:13 }}>
              {q || typeFilter ? "No results found" : "Start typing to search…"}
            </div>
          )}
          {grouped.map(g => (
            <div key={g.key}>
              {/* Section header */}
              <div style={{ padding:"10px 18px 4px", fontSize:10, color:"#5a4a7a", letterSpacing:1.2, textTransform:"uppercase", fontWeight:700 }}>
                {g.icon} {g.label}s
              </div>
              {g.items.map(r => {
                const idx = flat.indexOf(r);
                const isActive = idx === activeIdx;
                return (
                  <div
                    key={r.id}
                    data-idx={idx}
                    onMouseDown={() => open(r)}
                    onMouseEnter={() => setActiveIdx(idx)}
                    style={{
                      display:"flex", alignItems:"center", gap:12, padding:"9px 18px",
                      cursor:"pointer", transition:"background .08s",
                      background: isActive ? "#251b38" : "transparent",
                      borderLeft: `3px solid ${isActive ? g.color : "transparent"}`,
                    }}>
                    <span style={{ fontSize:18, flexShrink:0, opacity: isActive ? 1 : 0.7 }}>{g.icon}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, color: isActive ? "#e8d5b7" : "#c8b89a", fontWeight:600, fontFamily:"Georgia,serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {r.label}
                      </div>
                      {r.sub && (
                        <div style={{ fontSize:11, color:"#5a4a7a", marginTop:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {r.sub}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize:10, color:g.color, flexShrink:0, border:`1px solid ${g.color}44`, borderRadius:4, padding:"2px 7px", opacity: isActive ? 1 : 0.5 }}>
                      {g.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer hints */}
        <div style={{ padding:"8px 18px", borderTop:"1px solid #1e1630", display:"flex", gap:12, fontSize:11, color:"#3a2a5a", alignItems:"center" }}>
          <span><kbd style={{ fontFamily:"monospace", background:"#1e1630", border:"1px solid #3a2a5a", borderRadius:3, padding:"1px 5px" }}>↑↓</kbd> navigate</span>
          <span><kbd style={{ fontFamily:"monospace", background:"#1e1630", border:"1px solid #3a2a5a", borderRadius:3, padding:"1px 5px" }}>↵</kbd> open</span>
          <span><kbd style={{ fontFamily:"monospace", background:"#1e1630", border:"1px solid #3a2a5a", borderRadius:3, padding:"1px 5px" }}>Esc</kbd> close</span>
          {flat.length > 0 && <span style={{ marginLeft:"auto" }}>{flat.length} result{flat.length!==1?"s":""}</span>}
        </div>
      </div>
    </div>
  );
}
