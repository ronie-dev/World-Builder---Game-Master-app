import { useState, useRef } from "react";
import { uid } from "../utils.jsx";
import { btnPrimary, btnSecondary, inputStyle } from "../constants.js";

const REL_TYPES = [
  { value: "ally",     label: "Ally",          color: "#4a9a6a" },
  { value: "enemy",    label: "Enemy",         color: "#c06060" },
  { value: "rival",    label: "Rival",         color: "#c8834a" },
  { value: "family",   label: "Family",        color: "#5a8abf" },
  { value: "romantic", label: "Romantic",      color: "#bf5a8a" },
  { value: "mentor",   label: "Mentor",        color: "#c8a96e" },
  { value: "neutral",  label: "Neutral",       color: "#7a7a9a" },
  { value: "unknown",  label: "Unknown",       color: "#4a3a5a" },
];

const NODE_R = 32;

export default function RelationshipMap({ chars, factions, relations, onUpdateRelations }) {
  const nodes = relations.nodes || [];
  const edges = relations.edges || [];

  const svgRef = useRef();
  const [dragging, setDragging] = useState(null);
  const [connectMode, setConnectMode] = useState(false);
  const [connectFrom, setConnectFrom] = useState(null);
  const [edgeModal, setEdgeModal] = useState(null);
  const [edgeForm, setEdgeForm] = useState({ label: "", type: "neutral" });
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState("chars");
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);

  const getSVGPoint = e => {
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svgRef.current.getScreenCTM().inverse());
  };

  const getEntity = node => {
    if (!node) return null;
    return node.entityType === "char"
      ? chars.find(c => c.id === node.entityId)
      : factions.find(f => f.id === node.entityId);
  };

  const addToMap = (entityId, entityType) => {
    if (nodes.find(n => n.entityId === entityId)) return;
    onUpdateRelations({
      ...relations,
      nodes: [...nodes, { id: uid(), entityId, entityType, x: 150 + Math.random() * 600, y: 80 + Math.random() * 380 }],
    });
  };

  const removeNode = nodeId => {
    if (connectFrom === nodeId) setConnectFrom(null);
    onUpdateRelations({
      ...relations,
      nodes: nodes.filter(n => n.id !== nodeId),
      edges: edges.filter(e => e.fromNodeId !== nodeId && e.toNodeId !== nodeId),
    });
  };

  const handleNodeMouseDown = (e, nodeId) => {
    e.stopPropagation();
    if (connectMode) {
      if (!connectFrom) { setConnectFrom(nodeId); return; }
      if (connectFrom === nodeId) { setConnectFrom(null); return; }
      const exists = edges.find(ex =>
        (ex.fromNodeId === connectFrom && ex.toNodeId === nodeId) ||
        (ex.fromNodeId === nodeId && ex.toNodeId === connectFrom)
      );
      if (!exists) {
        setEdgeModal({ fromNodeId: connectFrom, toNodeId: nodeId });
        setEdgeForm({ label: "", type: "neutral" });
      }
      setConnectFrom(null);
      return;
    }
    const p = getSVGPoint(e);
    const node = nodes.find(n => n.id === nodeId);
    setDragging({ nodeId, ox: p.x - node.x, oy: p.y - node.y });
  };

  const handleMouseMove = e => {
    if (!dragging) return;
    const p = getSVGPoint(e);
    onUpdateRelations({
      ...relations,
      nodes: nodes.map(n => n.id === dragging.nodeId ? { ...n, x: p.x - dragging.ox, y: p.y - dragging.oy } : n),
    });
  };

  const handleMouseUp = () => setDragging(null);

  const saveEdge = () => {
    if (!edgeModal) return;
    onUpdateRelations({
      ...relations,
      edges: [...edges, { id: uid(), fromNodeId: edgeModal.fromNodeId, toNodeId: edgeModal.toNodeId, label: edgeForm.label, type: edgeForm.type }],
    });
    setEdgeModal(null);
    setConnectMode(false);
  };

  const onMapEntityIds = new Set(nodes.map(n => n.entityId));
  const offMapChars = chars.filter(c => !onMapEntityIds.has(c.id));
  const offMapFactions = factions.filter(f => !onMapEntityIds.has(f.id));

  return (
    <div>
      <h1 style={{ fontFamily:"Georgia,serif", color:"#e8d5b7", margin:"0 0 6px", fontSize:26 }}>Relationships</h1>
      <p style={{ color:"#5a4a7a", fontSize:13, margin:"0 0 16px" }}>Map connections between characters and factions. Drag to reposition nodes.</p>

      {/* Toolbar */}
      <div style={{ display:"flex", gap:10, marginBottom:14, alignItems:"center", flexWrap:"wrap" }}>
        <button onClick={() => setShowPicker(v => !v)} style={{...btnPrimary, fontSize:12, padding:"6px 14px"}}>
          + Add to Map
        </button>
        <button
          onClick={() => { setConnectMode(v => !v); setConnectFrom(null); }}
          style={{ ...connectMode ? btnPrimary : btnSecondary, fontSize:12, padding:"6px 14px",
            ...(connectMode ? { background:"#5a3da0", borderColor:"#7c5cbf" } : {}) }}>
          🔗 {connectMode ? "Cancel Connect" : "Connect"}
        </button>
        {connectMode && !connectFrom && (
          <span style={{ fontSize:12, color:"#9a7fa0" }}>Click a node to start a connection…</span>
        )}
        {connectMode && connectFrom && (() => {
          const n = nodes.find(x => x.id === connectFrom);
          const ent = getEntity(n);
          return <span style={{ fontSize:12, color:"#c8a96e" }}>From <b>{ent?.name}</b> — click the target node</span>;
        })()}
        {selectedEdgeId && (
          <button
            onClick={() => { onUpdateRelations({ ...relations, edges: edges.filter(e => e.id !== selectedEdgeId) }); setSelectedEdgeId(null); }}
            style={{...btnSecondary, fontSize:12, padding:"6px 14px", color:"#c06060", borderColor:"#6b1a1a", marginLeft:"auto"}}>
            🗑️ Remove Link
          </button>
        )}
      </div>

      {/* Entity Picker */}
      {showPicker && (
        <div style={{ background:"#13101f", border:"1px solid #3a2a5a", borderRadius:10, padding:16, marginBottom:16 }}>
          <div style={{ display:"flex", gap:8, marginBottom:12, alignItems:"center" }}>
            {[["chars","👥 Characters"],["factions","⚑ Factions"]].map(([id, label]) => (
              <button key={id} onClick={() => setPickerTab(id)}
                style={{ background:pickerTab===id?"#7c5cbf":"transparent", border:`1px solid ${pickerTab===id?"#7c5cbf":"#3a2a5a"}`, borderRadius:6, color:pickerTab===id?"#fff":"#9a7fa0", fontSize:12, padding:"4px 14px", cursor:"pointer" }}>
                {label}
              </button>
            ))}
            <button onClick={() => setShowPicker(false)} style={{...btnSecondary, fontSize:12, padding:"4px 10px", marginLeft:"auto"}}>Close</button>
          </div>
          {pickerTab === "chars" && (
            offMapChars.length === 0
              ? <div style={{ color:"#5a4a7a", fontSize:13 }}>All characters are on the map already.</div>
              : <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {offMapChars.map(c => (
                    <div key={c.id} onClick={() => addToMap(c.id, "char")}
                      style={{ display:"flex", alignItems:"center", gap:8, background:"#1e1630", border:"1px solid #3a2a5a", borderRadius:8, padding:"6px 12px", cursor:"pointer", transition:"border-color .12s" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor="#7c5cbf"}
                      onMouseLeave={e => e.currentTarget.style.borderColor="#3a2a5a"}>
                      {c.image
                        ? <img src={c.image} alt="" style={{ width:24, height:24, borderRadius:"50%", objectFit:"cover" }}/>
                        : <div style={{ width:24, height:24, borderRadius:"50%", background:"#2a1f3d", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:"#7c5cbf", fontWeight:700 }}>{c.name.charAt(0).toUpperCase()}</div>}
                      <span style={{ fontSize:13, color:"#e8d5b7" }}>{c.name}</span>
                      <span style={{ fontSize:11, color:"#7c5cbf" }}>{c.type}</span>
                    </div>
                  ))}
                </div>
          )}
          {pickerTab === "factions" && (
            offMapFactions.length === 0
              ? <div style={{ color:"#5a4a7a", fontSize:13 }}>All factions are on the map already.</div>
              : <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {offMapFactions.map(f => (
                    <div key={f.id} onClick={() => addToMap(f.id, "faction")}
                      style={{ display:"flex", alignItems:"center", gap:8, background:"#1e1630", border:"1px solid #3a2a5a", borderRadius:8, padding:"6px 12px", cursor:"pointer", transition:"border-color .12s" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor="#5a3da0"}
                      onMouseLeave={e => e.currentTarget.style.borderColor="#3a2a5a"}>
                      <span style={{ fontSize:15 }}>⚑</span>
                      <span style={{ fontSize:13, color:"#e8d5b7" }}>{f.name}</span>
                    </div>
                  ))}
                </div>
          )}
        </div>
      )}

      {/* SVG Canvas */}
      <div style={{ background:"#0d0b14", border:"1px solid #2a1f3d", borderRadius:12, overflow:"hidden", position:"relative" }}>
        {nodes.length === 0 && (
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:"#5a4a7a", gap:10, pointerEvents:"none" }}>
            <div style={{ fontSize:40 }}>🕸️</div>
            <div style={{ fontFamily:"Georgia,serif", fontSize:16 }}>No entities on the map yet</div>
            <div style={{ fontSize:13 }}>Click "+ Add to Map" to get started</div>
          </div>
        )}
        <svg
          ref={svgRef}
          width="100%"
          height="560"
          style={{ display:"block", userSelect:"none" }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={() => { if (!connectMode) setSelectedEdgeId(null); }}
        >
          <defs>
            {nodes.map(node => (
              <clipPath key={`clip-${node.id}`} id={`clip-${node.id}`}>
                <circle cx={0} cy={0} r={NODE_R - 3}/>
              </clipPath>
            ))}
          </defs>

          {/* Edges */}
          {edges.map(edge => {
            const fromNode = nodes.find(n => n.id === edge.fromNodeId);
            const toNode = nodes.find(n => n.id === edge.toNodeId);
            if (!fromNode || !toNode) return null;
            const color = REL_TYPES.find(r => r.value === edge.type)?.color || "#7a7a9a";
            const mx = (fromNode.x + toNode.x) / 2;
            const my = (fromNode.y + toNode.y) / 2;
            const isSelected = selectedEdgeId === edge.id;
            const typeLabel = REL_TYPES.find(r => r.value === edge.type)?.label || "";
            return (
              <g key={edge.id} onClick={e => { e.stopPropagation(); setSelectedEdgeId(isSelected ? null : edge.id); }} style={{ cursor:"pointer" }}>
                <line x1={fromNode.x} y1={fromNode.y} x2={toNode.x} y2={toNode.y} stroke="transparent" strokeWidth={16}/>
                <line x1={fromNode.x} y1={fromNode.y} x2={toNode.x} y2={toNode.y}
                  stroke={isSelected ? "#e8d5b7" : color}
                  strokeWidth={isSelected ? 3 : 2}
                  strokeDasharray={isSelected ? "7,3" : "none"}
                  opacity={0.85}/>
                <text x={mx} y={my - (edge.label ? 8 : 4)} textAnchor="middle" fill={color} fontSize={10}
                  stroke="#0d0b14" strokeWidth={3} paintOrder="stroke"
                  style={{ pointerEvents:"none", userSelect:"none", fontWeight:600 }}>
                  {edge.label || typeLabel}
                </text>
                {edge.label && (
                  <text x={mx} y={my + 8} textAnchor="middle" fill={color} fontSize={9} opacity={0.7}
                    stroke="#0d0b14" strokeWidth={3} paintOrder="stroke"
                    style={{ pointerEvents:"none", userSelect:"none" }}>
                    {typeLabel}
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map(node => {
            const entity = getEntity(node);
            if (!entity) return null;
            const isSource = connectFrom === node.id;
            const nodeColor = node.entityType === "faction" ? "#5a3da0"
              : entity.type === "player" ? "#c8a96e"
              : entity.type === "main" ? "#7c5cbf"
              : "#4a3a6a";
            return (
              <g key={node.id}
                transform={`translate(${node.x},${node.y})`}
                onMouseDown={e => handleNodeMouseDown(e, node.id)}
                style={{ cursor: connectMode ? "crosshair" : dragging?.nodeId === node.id ? "grabbing" : "grab" }}>
                {/* Drop shadow */}
                <circle r={NODE_R + 2} fill="rgba(0,0,0,0.5)" cy={3}/>
                {/* Outer glow ring for connect source */}
                {isSource && <circle r={NODE_R + 6} fill="none" stroke="#fff" strokeWidth={2} opacity={0.4}/>}
                {/* Main circle */}
                <circle r={NODE_R} fill="#1a1228"
                  stroke={isSource ? "#fff" : nodeColor}
                  strokeWidth={isSource ? 3 : 2}/>
                {/* Image or initials */}
                {entity.image ? (
                  <image href={entity.image}
                    x={-(NODE_R - 3)} y={-(NODE_R - 3)}
                    width={(NODE_R - 3) * 2} height={(NODE_R - 3) * 2}
                    clipPath={`url(#clip-${node.id})`}
                    preserveAspectRatio="xMidYMid slice"/>
                ) : (
                  <text textAnchor="middle" dominantBaseline="middle"
                    fill={nodeColor} fontSize={Math.round(NODE_R * 0.65)} fontWeight={700}
                    style={{ pointerEvents:"none" }}>
                    {(entity.name || "?").charAt(0).toUpperCase()}
                  </text>
                )}
                {/* Faction badge */}
                {node.entityType === "faction" && (
                  <text textAnchor="middle" y={NODE_R - 8} fontSize={11} style={{ pointerEvents:"none" }}>⚑</text>
                )}
                {/* Name label */}
                <text y={NODE_R + 15} textAnchor="middle" fill="#e8d5b7" fontSize={11} fontWeight={600}
                  stroke="#0d0b14" strokeWidth={3} paintOrder="stroke"
                  style={{ pointerEvents:"none", userSelect:"none" }}>
                  {entity.name}
                </text>
                {/* Remove button */}
                <g transform={`translate(${NODE_R - 4},${-(NODE_R - 4)})`}
                  onClick={e => { e.stopPropagation(); removeNode(node.id); }}
                  style={{ cursor:"pointer" }}>
                  <circle r={9} fill="#1a1228" stroke="#5a3030" strokeWidth={1.5}/>
                  <text textAnchor="middle" dominantBaseline="middle" fill="#c06060" fontSize={11} fontWeight={700} style={{ pointerEvents:"none" }}>×</text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:16, marginTop:12, padding:"8px 4px" }}>
        {REL_TYPES.map(r => (
          <div key={r.value} style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:22, height:2, background:r.color, borderRadius:1 }}/>
            <span style={{ fontSize:11, color:r.color }}>{r.label}</span>
          </div>
        ))}
      </div>

      {/* Edge Modal */}
      {edgeModal && (() => {
        const fromNode = nodes.find(n => n.id === edgeModal.fromNodeId);
        const toNode = nodes.find(n => n.id === edgeModal.toNodeId);
        const fromEntity = getEntity(fromNode);
        const toEntity = getEntity(toNode);
        return (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.82)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <div style={{ background:"#1a1228", border:"1px solid #7c5cbf", borderRadius:12, padding:28, width:440, boxShadow:"0 0 40px #7c5cbf44" }}>
              <h2 style={{ color:"#e8d5b7", margin:"0 0 4px", fontFamily:"Georgia,serif", fontSize:19 }}>Add Relationship</h2>
              <p style={{ color:"#7c5cbf", fontSize:13, margin:"0 0 20px" }}>{fromEntity?.name} ↔ {toEntity?.name}</p>
              <div style={{ marginBottom:16 }}>
                <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:8, letterSpacing:1, textTransform:"uppercase" }}>Type</label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {REL_TYPES.map(r => (
                    <div key={r.value} onClick={() => setEdgeForm(f => ({...f, type: r.value}))}
                      style={{ padding:"5px 12px", borderRadius:16, cursor:"pointer", transition:"all .12s",
                        border:`1px solid ${edgeForm.type === r.value ? r.color : "#3a2a5a"}`,
                        background: edgeForm.type === r.value ? r.color + "33" : "transparent",
                        color: edgeForm.type === r.value ? r.color : "#7a7a9a", fontSize:12 }}>
                      {r.label}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom:22 }}>
                <label style={{ display:"block", fontSize:12, color:"#b09060", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>Label (optional)</label>
                <input value={edgeForm.label} onChange={e => setEdgeForm(f => ({...f, label: e.target.value}))}
                  onKeyDown={e => e.key === "Enter" && saveEdge()}
                  placeholder="e.g. 'Old friends', 'Blood feud'…"
                  style={inputStyle}/>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={saveEdge} style={{...btnPrimary, flex:1}}>Add Link</button>
                <button onClick={() => setEdgeModal(null)} style={{...btnSecondary, flex:1}}>Cancel</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
