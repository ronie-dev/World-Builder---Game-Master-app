import { useState } from "react";
import { uid } from "../utils.jsx";
import { inputStyle, ghostTextarea, ghostInput, btnPrimary, btnSecondary, iconBtn, defaultDeity, DEFAULT_DEITY_ALIGNMENTS } from "../constants.js";
import PortraitZone from "./PortraitZone.jsx";
import Avatar from "./Avatar.jsx";

// ── Deity Card (list) ──────────────────────────────────────────────────────────
function DeityCard({ deity, isSelected, onSelect, alignmentColors }) {
  const ac = alignmentColors[deity.alignment] || "#4a4a6a";
  return (
    <div onClick={() => onSelect(deity.id)}
      style={{ background: isSelected ? "#1e1535" : "#1a1228", border: `1px solid ${isSelected ? "#7c5cbf" : "#3a2a5a"}`, borderLeft: `3px solid ${ac}`, borderRadius: 10, padding: "12px 14px", cursor: "pointer", transition: "border-color .15s, background .15s", userSelect: "none", display: "flex", gap: 12, alignItems: "center" }}
      onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = "#5a3da0"; e.currentTarget.style.borderLeftColor = ac; }}}
      onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = "#3a2a5a"; e.currentTarget.style.borderLeftColor = ac; }}}>
      <Avatar src={deity.image} name={deity.name || "?"} size={44}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span style={{ color: "#e8d5b7", fontWeight: 700, fontSize: 14, fontFamily: "Georgia,serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {deity.name || <span style={{ color: "#4a3a6a", fontStyle: "italic" }}>Unnamed</span>}
          </span>
          <span style={{ fontSize: 10, color: ac, background: ac + "22", border: `1px solid ${ac}44`, borderRadius: 8, padding: "1px 6px", whiteSpace: "nowrap", flexShrink: 0 }}>{deity.alignment || "Unknown"}</span>
        </div>
        {deity.title && <div style={{ fontSize: 12, color: "#9a7fa0", fontStyle: "italic", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{deity.title}</div>}
        {deity.domains?.length > 0 && (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {deity.domains.slice(0, 4).map(d => (
              <span key={d} style={{ fontSize: 10, background: "#2a1f3d", border: "1px solid #3a2a5a", borderRadius: 6, padding: "1px 6px", color: "#9a7fa0" }}>{d}</span>
            ))}
            {deity.domains.length > 4 && <span style={{ fontSize: 10, color: "#5a4a7a" }}>+{deity.domains.length - 4}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Domain Tag Input ───────────────────────────────────────────────────────────
function DomainEditor({ domains, onChange }) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim();
    if (!v || domains.includes(v)) return;
    onChange([...domains, v]);
    setInput("");
  };
  return (
    <div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
        {domains.map(d => (
          <span key={d} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, background: "#2a1f3d", border: "1px solid #3a2a5a", borderRadius: 8, padding: "2px 8px", color: "#c8b8e8" }}>
            {d}
            <span onClick={() => onChange(domains.filter(x => x !== d))} style={{ cursor: "pointer", color: "#5a4a7a", fontSize: 13, lineHeight: 1 }}>×</span>
          </span>
        ))}
        {domains.length === 0 && <span style={{ fontSize: 12, color: "#4a3a6a", fontStyle: "italic" }}>No domains yet</span>}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); }}}
          placeholder="Add domain (e.g. War, Death, Love)…"
          style={{ ...ghostInput, flex: 1, padding: "5px 8px", fontSize: 13 }}/>
        <button onClick={add} style={{ ...btnSecondary, fontSize: 12, padding: "4px 10px", whiteSpace: "nowrap" }}>+ Add</button>
      </div>
    </div>
  );
}

// ── Deity Detail Panel ─────────────────────────────────────────────────────────
const ghostBorder   = { border: "1px solid transparent" };
const activeBorder  = { border: "1px solid #3a2a5a" };

function DeityDetailPanel({ deity, factions, locations, onSave, onDelete, onCancelNew, onAskConfirm, onCloseConfirm, alignmentNames, alignmentColors }) {
  const [form, setForm] = useState({ ...defaultDeity, ...deity });
  const [focusedField, setFocusedField] = useState(null);
  const [locSearch, setLocSearch] = useState("");
  const [facSearch, setFacSearch] = useState("");

  const commit = updated => onSave({ ...updated, _isNew: undefined });
  const set = (k, v) => { const next = { ...form, [k]: v }; setForm(next); return next; };
  const setAndCommit = (k, v) => { const next = set(k, v); commit(next); };

  const ac = alignmentColors[form.alignment] || "#4a4a6a";

  const handleDelete = () => {
    onAskConfirm(`Delete deity "${deity.name || "this deity"}"?`, () => {
      onDelete(deity.id);
      onCloseConfirm();
    });
  };

  const activeIds  = form.locationIds || [];
  const activeFIds = form.factionIds  || [];
  const linkedLocs = activeIds.map(id => locations.find(l => l.id === id)).filter(Boolean);
  const linkedFacs = activeFIds.map(id => factions.find(f => f.id === id)).filter(Boolean);
  const availLocs  = locations.filter(l => !activeIds.includes(l.id) && (!locSearch || l.name.toLowerCase().includes(locSearch.toLowerCase())));
  const availFacs  = factions.filter(f => !activeFIds.includes(f.id) && (!facSearch || f.name.toLowerCase().includes(facSearch.toLowerCase())));

  return (
    <div style={{ background: "#13101f", border: `1px solid ${ac}88`, borderTop: `3px solid ${ac}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 32px #7c5cbf22" }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(90deg,${ac}33,#13101f)`, padding: "18px 24px", display: "flex", alignItems: "flex-start", gap: 16, borderBottom: "1px solid #2a1f3d" }}>
        <PortraitZone value={form.image} onChange={src => setAndCommit("image", src)} size={72}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <input value={form.name} onChange={e => set("name", e.target.value)}
            onFocus={() => setFocusedField("name")}
            onBlur={() => { setFocusedField(null); commit(form); }}
            placeholder="Deity name…"
            style={{ ...ghostInput, ...(focusedField==="name" ? activeBorder : ghostBorder), fontSize: 18, fontFamily: "Georgia,serif", fontWeight: 700, marginBottom: 6, display: "block", width: "100%", padding: "4px 6px" }}/>
          <input value={form.title} onChange={e => set("title", e.target.value)}
            onFocus={() => setFocusedField("title")}
            onBlur={() => { setFocusedField(null); commit(form); }}
            placeholder="Title or epithet…"
            style={{ ...ghostInput, ...(focusedField==="title" ? activeBorder : ghostBorder), fontSize: 13, marginBottom: 8, display: "block", width: "100%", padding: "4px 6px" }}/>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ fontSize: 11, color: "#9a7fa0", textTransform: "uppercase", letterSpacing: 1 }}>Alignment</label>
            <select value={form.alignment} onChange={e => setAndCommit("alignment", e.target.value)}
              style={{ ...ghostInput, width: "auto", fontSize: 12, padding: "3px 8px" }}>
              {alignmentNames.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {deity._isNew
            ? <button onClick={onCancelNew} style={{ ...btnSecondary, fontSize: 12, padding: "6px 10px" }}>✕ Cancel</button>
            : <button onClick={handleDelete} style={{ ...iconBtn, color: "#c06060" }}>🗑️</button>
          }
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Domains */}
        <div>
          <div style={{ fontSize: 11, color: "#b09060", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Domains</div>
          <DomainEditor domains={form.domains || []} onChange={v => { const next = { ...form, domains: v }; setForm(next); commit(next); }}/>
        </div>

        {/* Symbol */}
        <div>
          <div style={{ fontSize: 11, color: "#b09060", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Symbol</div>
          {focusedField === "symbol" || form.symbol ? (
            <input autoFocus={focusedField === "symbol"} value={form.symbol} onChange={e => set("symbol", e.target.value)}
              onFocus={() => setFocusedField("symbol")}
              onBlur={() => { setFocusedField(null); commit(form); }}
              placeholder="Describe the holy symbol…"
              style={{ ...ghostInput, ...(focusedField==="symbol" ? activeBorder : ghostBorder), fontSize: 13, display: "block", width: "100%", padding: "5px 8px", boxSizing: "border-box" }}/>
          ) : (
            <div onClick={() => setFocusedField("symbol")} style={{ fontSize: 13, color: "#4a3a6a", fontStyle: "italic", cursor: "text", padding: "3px 2px" }}>+ Add symbol…</div>
          )}
        </div>

        {/* Description */}
        <div>
          <div style={{ fontSize: 11, color: "#b09060", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Description</div>
          {focusedField === "description" || form.description ? (
            <textarea autoFocus={focusedField === "description"} value={form.description} onChange={e => set("description", e.target.value)}
              onFocus={() => setFocusedField("description")}
              onBlur={() => { setFocusedField(null); commit(form); }}
              placeholder="Myths, origin, nature, worship…" rows={5}
              style={{ ...ghostTextarea, ...(focusedField==="description" ? activeBorder : ghostBorder), fontSize: 13, resize: "vertical" }}/>
          ) : (
            <div onClick={() => setFocusedField("description")} style={{ fontSize: 13, color: "#4a3a6a", fontStyle: "italic", cursor: "text", padding: "3px 2px" }}>+ Add description…</div>
          )}
        </div>

        {/* Linked Locations */}
        <div>
          <div style={{ fontSize: 11, color: "#b09060", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Holy Sites & Temples</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {linkedLocs.map(l => (
              <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 8, background: "#1a1228", border: "1px solid #2a1f3d", borderRadius: 6, padding: "6px 10px" }}>
                <span style={{ fontSize: 13, flex: 1, color: "#e8d5b7" }}>📍 {l.name}</span>
                {l.type && <span style={{ fontSize: 10, color: "#9a7fa0" }}>{l.type}</span>}
                <button onClick={() => { const next = { ...form, locationIds: activeIds.filter(id => id !== l.id) }; setForm(next); commit(next); }}
                  style={{ ...iconBtn, color: "#c06060", fontSize: 13 }}>✕</button>
              </div>
            ))}
            <div style={{ position: "relative" }}>
              <input value={locSearch} onChange={e => setLocSearch(e.target.value)} placeholder="Search locations to link…"
                style={{ ...ghostInput, fontSize: 12, display: "block", width: "100%", padding: "5px 8px", boxSizing: "border-box" }}/>
              {locSearch && availLocs.length > 0 && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#1a1228", border: "1px solid #3a2a5a", borderRadius: 6, zIndex: 10, maxHeight: 160, overflowY: "auto" }}>
                  {availLocs.slice(0, 8).map(l => (
                    <div key={l.id} onClick={() => { const next = { ...form, locationIds: [...activeIds, l.id] }; setForm(next); commit(next); setLocSearch(""); }}
                      style={{ padding: "7px 12px", cursor: "pointer", fontSize: 13, color: "#c8b8e8", borderBottom: "1px solid #2a1f3d" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#2a1f3d"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      📍 {l.name}{l.type ? <span style={{ color: "#5a4a7a", fontSize: 11 }}> ({l.type})</span> : ""}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Linked Factions */}
        <div>
          <div style={{ fontSize: 11, color: "#b09060", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Churches & Cults</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {linkedFacs.map(f => (
              <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 8, background: "#1a1228", border: `1px solid ${f.color ? f.color + "44" : "#2a1f3d"}`, borderLeft: `3px solid ${f.color || "#3a2a5a"}`, borderRadius: 6, padding: "6px 10px" }}>
                <span style={{ fontSize: 13, flex: 1, color: "#e8d5b7" }}>🚩 {f.name}</span>
                <button onClick={() => { const next = { ...form, factionIds: activeFIds.filter(id => id !== f.id) }; setForm(next); commit(next); }}
                  style={{ ...iconBtn, color: "#c06060", fontSize: 13 }}>✕</button>
              </div>
            ))}
            <div style={{ position: "relative" }}>
              <input value={facSearch} onChange={e => setFacSearch(e.target.value)} placeholder="Search factions to link…"
                style={{ ...ghostInput, fontSize: 12, display: "block", width: "100%", padding: "5px 8px", boxSizing: "border-box" }}/>
              {facSearch && availFacs.length > 0 && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#1a1228", border: "1px solid #3a2a5a", borderRadius: 6, zIndex: 10, maxHeight: 160, overflowY: "auto" }}>
                  {availFacs.slice(0, 8).map(f => (
                    <div key={f.id} onClick={() => { const next = { ...form, factionIds: [...activeFIds, f.id] }; setForm(next); commit(next); setFacSearch(""); }}
                      style={{ padding: "7px 12px", cursor: "pointer", fontSize: 13, color: "#c8b8e8", borderBottom: "1px solid #2a1f3d" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#2a1f3d"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      🚩 {f.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Pantheon Tab ───────────────────────────────────────────────────────────────
export default function PantheonTab({ deities, onUpdateDeities, factions, locations, onAskConfirm, onCloseConfirm, deityAlignments }) {
  const alignList = deityAlignments && deityAlignments.length > 0 ? deityAlignments : DEFAULT_DEITY_ALIGNMENTS;
  const alignmentNames = alignList.map(a => a.name);
  const alignmentColors = Object.fromEntries(alignList.map(a => [a.name, a.color]));
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");

  const selected = deities.find(d => d.id === selectedId) || null;

  const addDeity = () => {
    const draft = { ...defaultDeity, id: uid(), _isNew: true };
    onUpdateDeities([draft, ...deities]);
    setSelectedId(draft.id);
  };

  const saveDeity = form => {
    const clean = { ...form };
    delete clean._isNew;
    onUpdateDeities(deities.map(d => d.id === form.id ? clean : d));
  };

  const deleteDeity = id => {
    onUpdateDeities(deities.filter(d => d.id !== id));
    setSelectedId(null);
  };

  const cancelNew = () => {
    onUpdateDeities(deities.filter(d => !d._isNew));
    setSelectedId(null);
  };

  const q = search.toLowerCase();
  const filtered = deities.filter(d =>
    !q || d.name?.toLowerCase().includes(q) || d.title?.toLowerCase().includes(q) ||
    d.alignment?.toLowerCase().includes(q) || (d.domains||[]).some(dom => dom.toLowerCase().includes(q))
  );

  return (
    <div style={{ display: "flex", gap: 24, minHeight: 0, flex: 1 }}>
      {/* Left — list */}
      <div style={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#5a4a7a", fontSize: 13 }}>🔍</span>
            <input placeholder="Search deities…" value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, paddingLeft: 30, fontSize: 13 }}/>
          </div>
          <button onClick={addDeity} style={{ ...btnPrimary, fontSize: 12, padding: "6px 12px", whiteSpace: "nowrap" }}>+ New</button>
        </div>
        <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 8, paddingRight: 4 }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#5a4a7a", border: "1px dashed #3a2a5a", borderRadius: 12, fontSize: 13 }}>
              {deities.length === 0 ? <>No deities yet.<br/>Click "+ New" to add one.</> : "No matches."}
            </div>
          )}
          {filtered.map(d => (
            <DeityCard key={d.id} deity={d} isSelected={selectedId === d.id} alignmentColors={alignmentColors}
              onSelect={id => setSelectedId(prev => prev === id ? null : id)}/>
          ))}
        </div>
      </div>

      {/* Right — detail */}
      <div style={{ flex: 1, minWidth: 0, overflowY: "auto" }}>
        {selected
          ? <DeityDetailPanel
              key={selected.id}
              deity={selected}
              factions={factions}
              locations={locations}
              onSave={saveDeity}
              onDelete={deleteDeity}
              onCancelNew={cancelNew}
              onAskConfirm={onAskConfirm}
              onCloseConfirm={onCloseConfirm}
              alignmentNames={alignmentNames}
              alignmentColors={alignmentColors}
            />
          : <div style={{ background: "#13101f", border: "1px dashed #2a1f3d", borderRadius: 12, padding: "48px 24px", textAlign: "center", color: "#3a2a5a" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⛪</div>
              <div style={{ fontSize: 14, fontFamily: "Georgia,serif" }}>Select a deity to view details</div>
            </div>
        }
      </div>
    </div>
  );
}
