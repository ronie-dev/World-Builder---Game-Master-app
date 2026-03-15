import { useState, useEffect, useRef, useMemo } from "react";
import Avatar from "./Avatar.jsx";

const TYPE_LABEL = { char:"Character", story:"Story", faction:"Faction", location:"Location", artifact:"Artifact" };
const TYPE_ICON  = { char:"👤", story:"📜", faction:"⚑", location:"📍", artifact:"⚗️" };

function buildResults(query, chars, stories, factions, locations, artifacts) {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const out = [];

  for (const c of chars) {
    if (
      c.name?.toLowerCase().includes(q) ||
      c.shortDescription?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.origin?.toLowerCase().includes(q) ||
      c.class?.toLowerCase().includes(q)
    ) out.push({ type:"char", label:c.name, sub:c.type, image:c.image, item:c });
  }
  for (const s of stories) {
    if (s.name?.toLowerCase().includes(q) || s.summary?.toLowerCase().includes(q))
      out.push({ type:"story", label:s.name, sub:s.status, item:s });
  }
  for (const f of factions) {
    if (f.name?.toLowerCase().includes(q) || f.description?.toLowerCase().includes(q))
      out.push({ type:"faction", label:f.name, sub:f.alignment, item:f });
  }
  for (const l of locations) {
    if (l.name?.toLowerCase().includes(q) || l.region?.toLowerCase().includes(q) || l.description?.toLowerCase().includes(q))
      out.push({ type:"location", label:l.name, sub:l.region || l.type, item:l });
  }
  for (const a of artifacts) {
    if (a.name?.toLowerCase().includes(q) || a.description?.toLowerCase().includes(q))
      out.push({ type:"artifact", label:a.name, sub:a.rarity, item:a });
  }

  return out.slice(0, 24);
}

export default function GlobalSearch({ open, onClose, chars, stories, factions, locations, artifacts, onSelectChar, onSelectStory, onSelectFaction, onSelectLocation, onSelectArtifact }) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef();
  const listRef = useRef();

  useEffect(() => {
    if (open) { setQuery(""); setCursor(0); setTimeout(() => inputRef.current?.focus(), 30); }
  }, [open]);

  const results = useMemo(() => buildResults(query, chars, stories, factions, locations, artifacts), [query, chars, stories, factions, locations, artifacts]);

  useEffect(() => { setCursor(0); }, [results]);

  const select = r => {
    switch (r.type) {
      case "char":     onSelectChar(r.item);     break;
      case "story":    onSelectStory(r.item);    break;
      case "faction":  onSelectFaction(r.item);  break;
      case "location": onSelectLocation(r.item); break;
      case "artifact": onSelectArtifact(r.item); break;
    }
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    const handler = e => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, results.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
      if (e.key === "Enter" && results[cursor]) select(results[cursor]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, results, cursor]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector("[data-active='true']");
    el?.scrollIntoView({ block:"nearest" });
  }, [cursor]);

  if (!open) return null;

  return (
    <div
      style={{ position:"fixed", inset:0, background:"#00000099", zIndex:2000, display:"flex", alignItems:"flex-start", justifyContent:"center", paddingTop:"14vh" }}
      onMouseDown={onClose}>
      <div
        style={{ width:580, maxWidth:"92vw", background:"#0f0c1a", border:"1px solid #3a2a5a", borderRadius:12, overflow:"hidden", boxShadow:"0 12px 48px #000000cc" }}
        onMouseDown={e => e.stopPropagation()}>

        {/* Input row */}
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 16px", borderBottom:"1px solid #2a1f3d" }}>
          <span style={{ color:"#5a4a7a", fontSize:15, flexShrink:0 }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search everything…"
            style={{ flex:1, background:"none", border:"none", outline:"none", color:"#e8d5b7", fontSize:15 }}
          />
          <kbd style={{ fontSize:11, color:"#3a2a5a", background:"#1a1228", border:"1px solid #2a1f3d", borderRadius:4, padding:"2px 6px" }}>ESC</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} style={{ maxHeight:400, overflowY:"auto" }}>
          {!query && (
            <div style={{ padding:"28px 16px", color:"#3a2a5a", fontSize:13, textAlign:"center" }}>
              Start typing to search across all content…
            </div>
          )}
          {query && results.length === 0 && (
            <div style={{ padding:"28px 16px", color:"#5a4a7a", fontSize:13, textAlign:"center" }}>No results for "{query}"</div>
          )}
          {results.map((r, i) => (
            <div
              key={`${r.type}-${r.item.id}`}
              data-active={i === cursor ? "true" : undefined}
              onMouseEnter={() => setCursor(i)}
              onClick={() => select(r)}
              style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 16px", cursor:"pointer", background:i === cursor ? "#1e1535" : "transparent", borderBottom:"1px solid #15111f" }}>
              {r.type === "char"
                ? <Avatar src={r.image} name={r.label} size={28}/>
                : <span style={{ fontSize:16, width:28, textAlign:"center", flexShrink:0 }}>{TYPE_ICON[r.type]}</span>
              }
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, color:"#e8d5b7", fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.label}</div>
                {r.sub && <div style={{ fontSize:11, color:"#6a5a8a", textTransform:"capitalize" }}>{r.sub}</div>}
              </div>
              <span style={{ fontSize:11, color:"#3a2a5a", flexShrink:0 }}>{TYPE_LABEL[r.type]}</span>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        {results.length > 0 && (
          <div style={{ display:"flex", gap:16, padding:"8px 16px", borderTop:"1px solid #1a1228", fontSize:11, color:"#3a2a5a" }}>
            <span>↑↓ navigate</span><span>↵ open</span><span>ESC close</span>
          </div>
        )}
      </div>
    </div>
  );
}
