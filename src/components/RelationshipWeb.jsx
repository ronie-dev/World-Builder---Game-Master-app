import { useState, useEffect, useRef } from "react";
import { STATUS_COLORS, CHAR_STATUS_COLORS } from "../constants.js";

// ── Force simulation ───────────────────────────────────────────────────────────
function runSimulation(nodes, edges) {
  if (nodes.length === 0) return {};

  const ITERATIONS = 280;
  const DAMPING    = 0.45;
  const SPRING_K   = 0.035;

  // Smart initial layout: story nodes inner ring, char nodes outer ring
  const storyNodes = nodes.filter(n => n._kind === "story");
  const charNodes  = nodes.filter(n => n._kind !== "story");
  const innerR = Math.max(160, storyNodes.length * 50);
  const outerR = Math.max(innerR + 220, charNodes.length * 38);

  const pos = nodes.map(n => {
    if (n._kind === "story") {
      const i = storyNodes.indexOf(n);
      const angle = (i / Math.max(storyNodes.length, 1)) * 2 * Math.PI;
      return { id: n.id, kind: n._kind, x: Math.cos(angle) * innerR, y: Math.sin(angle) * innerR, vx: 0, vy: 0 };
    } else {
      const i = charNodes.indexOf(n);
      const angle = (i / Math.max(charNodes.length, 1)) * 2 * Math.PI;
      return { id: n.id, kind: n._kind, x: Math.cos(angle) * outerR, y: Math.sin(angle) * outerR, vx: 0, vy: 0 };
    }
  });
  const map = Object.fromEntries(pos.map(p => [p.id, p]));

  for (let iter = 0; iter < ITERATIONS; iter++) {
    const cool = 1 - iter / ITERATIONS;

    // Repulsion — stronger between same-kind nodes
    for (let i = 0; i < pos.length; i++) {
      for (let j = i + 1; j < pos.length; j++) {
        const dx = pos[j].x - pos[i].x || 0.1;
        const dy = pos[j].y - pos[i].y || 0.1;
        const d2 = dx * dx + dy * dy || 1;
        const d  = Math.sqrt(d2);
        const sameKind = pos[i].kind === pos[j].kind;
        const rep = sameKind ? 18000 : 10000;
        const f  = rep / d2;
        pos[i].vx -= (dx / d) * f; pos[i].vy -= (dy / d) * f;
        pos[j].vx += (dx / d) * f; pos[j].vy += (dy / d) * f;
      }
    }

    // Spring attraction — longer ideal distance for story→char edges
    edges.forEach(({ a, b, kind }) => {
      const s = map[a], t = map[b];
      if (!s || !t) return;
      const dx = t.x - s.x || 0.1, dy = t.y - s.y || 0.1;
      const d  = Math.sqrt(dx * dx + dy * dy) || 1;
      const ideal = kind === "story" ? 300 : 220;
      const f  = (d - ideal) * SPRING_K;
      s.vx += (dx / d) * f; s.vy += (dy / d) * f;
      t.vx -= (dx / d) * f; t.vy -= (dy / d) * f;
    });

    // Center gravity
    pos.forEach(p => { p.vx -= p.x * 0.006; p.vy -= p.y * 0.006; });

    pos.forEach(p => {
      p.x += p.vx * cool; p.y += p.vy * cool;
      p.vx *= DAMPING;    p.vy *= DAMPING;
    });
  }
  return Object.fromEntries(pos.map(p => [p.id, { x: p.x, y: p.y }]));
}

const CHAR_R      = 30;
const CHAR_R_SIDE = 20;
const STORY_W = 100;
const STORY_H = 62;

// ── Component ─────────────────────────────────────────────────────────────────
export default function RelationshipWeb({ chars, stories, relationshipTypes, onOpenChar, onOpenStory }) {
  const svgRef     = useRef(null);
  const panRef     = useRef({ x: 0, y: 0 });
  const zoomRef    = useRef(1);
  const dragRef    = useRef(null);
  const didDragRef = useRef(false);
  const [transform,  setTransform]  = useState({ x: 0, y: 0, z: 1 });
  const [dragState,  setDragState]  = useState({ key: "", positions: {} });
  const [hoveredId,  setHoveredId]  = useState(null);
  const [mode,       setMode]       = useState("chars"); // "chars" | "stories"
  const [showAll,    setShowAll]    = useState(false);
  const [hiddenStoryIds, setHiddenStoryIds] = useState(new Set());
  const [viewport, setViewport] = useState({ width: 800, height: 600 });

  // ── Build graph depending on mode ────────────────────────────────────────────
  const { nodes, edges } = (() => {
    if (mode === "chars") {
      const edges = [];
      chars.forEach(c => {
        (c.relationships || []).forEach(rel => {
          if (rel.charId && chars.find(x => x.id === rel.charId))
            edges.push({ a: c.id, b: rel.charId, type: rel.type, id: rel.id, kind:"rel" });
        });
      });
      const connectedIds = new Set(edges.flatMap(e => [e.a, e.b]));
      const nodes = (showAll ? chars : chars.filter(c => connectedIds.has(c.id)))
        .map(c => ({ ...c, _kind:"char" }));
      return { nodes, edges };
    } else {
      // Story mode: story nodes + character nodes, edges from story.characterIds
      const edges = [];
      (stories || []).filter(s => !hiddenStoryIds.has(s.id)).forEach(s => {
        (s.characterIds || []).forEach(cid => {
          if (chars.find(c => c.id === cid))
            edges.push({ a: s.id, b: cid, type: s.status || "", id: `${s.id}-${cid}`, kind:"story", color: STATUS_COLORS[s.status] || "#5a3da0" });
        });
      });
      const connectedCharIds = new Set(edges.map(e => e.b));
      const connectedStoryIds = new Set(edges.map(e => e.a));
      const visibleStories = (stories||[]).filter(s => !hiddenStoryIds.has(s.id));
      const storyNodes = (showAll ? visibleStories : visibleStories.filter(s => connectedStoryIds.has(s.id)))
        .map(s => ({ ...s, _kind:"story" }));
      const charNodes = (showAll ? chars : chars.filter(c => connectedCharIds.has(c.id)))
        .map(c => ({ ...c, _kind:"char" }));
      return { nodes: [...storyNodes, ...charNodes], edges };
    }
  })();

  // ── Simulate on graph change ─────────────────────────────────────────────────
  const simKey = `${mode}-${nodes.length}-${edges.length}-${showAll}-${[...hiddenStoryIds].sort().join(",")}`;
  const basePositions = nodes.length === 0 ? {} : runSimulation(nodes, edges);
  const positions = dragState.key === simKey ? dragState.positions : basePositions;

  // ── Type color lookup ────────────────────────────────────────────────────────
  const typeColor = type => {
    const rt = (relationshipTypes || []).find(r => r.name === type);
    return rt?.color || "#3a4a6a";
  };

  // ── Pan / zoom / drag ────────────────────────────────────────────────────────
  const onMouseDown = (e, nodeId) => {
    e.preventDefault();
    if (nodeId) {
      dragRef.current = { type:"node", nodeId, startX: e.clientX, startY: e.clientY, origX: positions[nodeId]?.x || 0, origY: positions[nodeId]?.y || 0 };
    } else {
      dragRef.current = { type:"pan", startX: e.clientX, startY: e.clientY, origX: panRef.current.x, origY: panRef.current.y };
    }
  };

  const onMouseMove = e => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX, dy = e.clientY - d.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) didDragRef.current = true;
    if (d.type === "pan") {
      panRef.current = { x: d.origX + dx, y: d.origY + dy };
      setTransform(t => ({ ...t, x: panRef.current.x, y: panRef.current.y }));
    } else {
      const z = zoomRef.current;
      setDragState(prev => {
        const nextPositions = prev.key === simKey ? prev.positions : basePositions;
        return {
          key: simKey,
          positions: { ...nextPositions, [d.nodeId]: { x: d.origX + dx / z, y: d.origY + dy / z } },
        };
      });
    }
  };

  const onMouseUp = () => { dragRef.current = null; };

  const onNodeClick = (e, node) => {
    if (didDragRef.current) { didDragRef.current = false; return; }
    if (node._kind === "story") onOpenStory(node);
    else onOpenChar(node);
  };

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = e => {
      e.preventDefault();
      zoomRef.current = Math.max(0.2, Math.min(3, zoomRef.current * (e.deltaY < 0 ? 1.1 : 0.91)));
      setTransform(t => ({ ...t, z: zoomRef.current }));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;

    const updateViewport = () => {
      setViewport({
        width: el.clientWidth || 800,
        height: el.clientHeight || 600,
      });
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  // ── Hover highlight ──────────────────────────────────────────────────────────
  const hoveredEdgeIds     = hoveredId ? new Set(edges.filter(e => e.a === hoveredId || e.b === hoveredId).map(e => e.id)) : null;
  const hoveredNeighborIds = hoveredId ? new Set(edges.filter(e => e.a === hoveredId || e.b === hoveredId).flatMap(e => [e.a, e.b])) : null;

  // ── Empty states ─────────────────────────────────────────────────────────────
  const isEmpty = nodes.length === 0;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minHeight:0 }}>

      {/* Toolbar */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 20px", borderBottom:"1px solid #1e1630", flexShrink:0, background:"#0d0b14", flexWrap:"wrap" }}>
        <span style={{ fontFamily:"Georgia,serif", color:"#c8a96e", fontWeight:700, fontSize:15 }}>🕸️ Relationship Web</span>

        {/* Mode toggle */}
        <div style={{ display:"flex", border:"1px solid #3a2a5a", borderRadius:6, overflow:"hidden" }}>
          {[["chars","👥 Characters"],["stories","📖 Stories"]].map(([m, label]) => (
            <button key={m} onClick={() => { setMode(m); setShowAll(false); }}
              style={{ background: mode===m ? "#7c5cbf" : "transparent", border:"none", color: mode===m ? "#fff" : "#7c5cbf", cursor:"pointer", fontSize:12, padding:"5px 14px", fontWeight: mode===m ? 700 : 400, transition:"all .15s" }}>
              {label}
            </button>
          ))}
        </div>

        <span style={{ fontSize:12, color:"#5a4a7a" }}>{nodes.length} nodes · {edges.length} connections</span>
        <div style={{ flex:1 }}/>

        {/* Legend */}
        <div style={{ display:"flex", gap:16, alignItems:"center", flexWrap:"wrap" }}>
          {/* Relationship type legend (chars mode) */}
          {mode === "chars" && (relationshipTypes || []).map(rt => (
            <div key={rt.name} style={{ display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ width:18, height:3, background:rt.color, borderRadius:2 }}/>
              <span style={{ fontSize:11, color:"#9a7fa0" }}>{rt.name}</span>
            </div>
          ))}
          {/* Story status legend (stories mode) */}
          {mode === "stories" && Object.entries(STATUS_COLORS).map(([s, c]) => (
            <div key={s} style={{ display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ width:18, height:3, background:c, borderRadius:2 }}/>
              <span style={{ fontSize:11, color:"#9a7fa0" }}>{s}</span>
            </div>
          ))}
          {/* Character status legend — always visible */}
          {Object.keys(CHAR_STATUS_COLORS).length > 0 && (
            <div style={{ display:"flex", gap:8, alignItems:"center", paddingLeft: mode==="chars" && (relationshipTypes||[]).length > 0 ? 8 : 0, borderLeft: mode==="chars" && (relationshipTypes||[]).length > 0 ? "1px solid #2a1f3d" : "none" }}>
              {Object.entries(CHAR_STATUS_COLORS).map(([s, c]) => (
                <div key={s} style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <div style={{ width:10, height:10, borderRadius:"50%", background:c, flexShrink:0 }}/>
                  <span style={{ fontSize:11, color:"#9a7fa0" }}>{s}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={() => setShowAll(v => !v)}
          style={{ background: showAll?"#7c5cbf":"transparent", border:"1px solid #3a2a5a", borderRadius:6, color: showAll?"#fff":"#7c5cbf", cursor:"pointer", fontSize:12, padding:"5px 12px", transition:"all .15s" }}>
          {showAll ? "Connected only" : "Show all"}
        </button>
        <button onClick={() => { panRef.current={x:0,y:0}; zoomRef.current=1; setTransform({x:0,y:0,z:1}); }}
          style={{ background:"transparent", border:"1px solid #2a1f3d", borderRadius:6, color:"#5a4a7a", cursor:"pointer", fontSize:12, padding:"5px 12px" }}>
          Reset view
        </button>
      </div>

      {/* Story filter bar */}
      {mode === "stories" && (stories||[]).length > 0 && (
        <div style={{ display:"flex", alignItems:"center", gap:0, borderBottom:"1px solid #1e1630", flexShrink:0, background:"#0d0b14", overflowX:"auto", scrollbarWidth:"thin", scrollbarColor:"#3a2a5a transparent" }}>
          <div style={{ display:"flex", alignItems:"center", gap:2, padding:"6px 12px", minWidth:"max-content" }}>
            <button
              onClick={() => setHiddenStoryIds(hiddenStoryIds.size === 0 ? new Set((stories||[]).map(s=>s.id)) : new Set())}
              style={{ background:"transparent", border:"none", color:"#5a4a7a", cursor:"pointer", fontSize:11, padding:"3px 8px", borderRadius:4, flexShrink:0, whiteSpace:"nowrap" }}>
              {hiddenStoryIds.size === 0 ? "Hide all" : "Show all"}
            </button>
            <div style={{ width:1, height:18, background:"#2a1f3d", margin:"0 4px", flexShrink:0 }}/>
            {(stories||[]).map(s => {
              const sc      = STATUS_COLORS[s.status] || "#5a3da0";
              const visible = !hiddenStoryIds.has(s.id);
              const toggle  = () => setHiddenStoryIds(prev => {
                const next = new Set(prev);
                visible ? next.add(s.id) : next.delete(s.id);
                return next;
              });
              return (
                <button key={s.id} onClick={toggle}
                  style={{ display:"flex", alignItems:"center", gap:6, background: visible ? sc+"22" : "transparent", border:`1px solid ${visible ? sc+"66" : "#2a1f3d"}`, borderRadius:5, padding:"3px 10px", cursor:"pointer", transition:"all .15s", flexShrink:0, opacity: visible ? 1 : 0.4 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background: visible ? sc : "#3a2a5a", flexShrink:0 }}/>
                  <span style={{ fontSize:11, color: visible ? "#e8d5b7" : "#5a4a7a", whiteSpace:"nowrap", maxWidth:120, overflow:"hidden", textOverflow:"ellipsis" }}>{s.name || "Unnamed"}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ padding:"4px 20px", fontSize:11, color:"#3a2a5a", flexShrink:0, background:"#0d0b14" }}>
        Scroll to zoom · Drag background to pan · Drag nodes to rearrange · Click to open
      </div>

      {/* Canvas */}
      {isEmpty ? (
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:14, color:"#5a4a7a" }}>
          <div style={{ fontSize:48 }}>🕸️</div>
          <div style={{ fontSize:16, fontFamily:"Georgia,serif" }}>
            {mode === "chars" ? "No character relationships defined" : "No story–character links found"}
          </div>
          <div style={{ fontSize:13, color:"#3a2a5a" }}>
            {mode === "chars" ? "Add relationships in a character's detail panel" : "Link characters to stories in a story's Details tab"}
          </div>
          <button onClick={() => setShowAll(true)}
            style={{ marginTop:4, background:"transparent", border:"1px solid #3a2a5a", borderRadius:8, color:"#7c5cbf", cursor:"pointer", fontSize:13, padding:"8px 18px" }}>
            Show all anyway
          </button>
        </div>
      ) : (
        <svg ref={svgRef} style={{ flex:1, cursor:"grab", background:"#080610" }}
          onMouseDown={e => onMouseDown(e, null)}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}>

          <defs>
            {nodes.filter(n => n._kind === "char").map(c => {
              const r = c.type === "side" ? CHAR_R_SIDE : CHAR_R;
              return (
                <clipPath key={`clip-${c.id}`} id={`clip-${c.id}`}>
                  <circle cx={0} cy={0} r={r - 2}/>
                </clipPath>
              );
            })}
            {nodes.filter(n => n._kind === "story").map(s => (
              <clipPath key={`clip-${s.id}`} id={`clip-s-${s.id}`}>
                <rect x={-(STORY_W/2-2)} y={-(STORY_H/2-2)} width={STORY_W-4} height={STORY_H-4} rx={8}/>
              </clipPath>
            ))}
          </defs>

          <g transform={`translate(${transform.x + viewport.width / 2},${transform.y + viewport.height / 2}) scale(${transform.z})`}>

            {/* Edges */}
            {edges.map(edge => {
              const ap = positions[edge.a], bp = positions[edge.b];
              if (!ap || !bp) return null;
              const color = edge.color || typeColor(edge.type);
              const dim   = hoveredEdgeIds && !hoveredEdgeIds.has(edge.id);
              const mx    = (ap.x + bp.x) / 2, my = (ap.y + bp.y) / 2;
              return (
                <g key={edge.id} style={{ opacity: dim ? 0.12 : 1, transition:"opacity .2s" }}>
                  <line x1={ap.x} y1={ap.y} x2={bp.x} y2={bp.y}
                    stroke={color} strokeWidth={2} strokeOpacity={0.75}/>
                  {/* Character relation labels only (not story mode) */}
                  {edge.kind === "rel" && edge.type && (
                    <g transform={`translate(${mx},${my})`}>
                      <rect x={-24} y={-9} width={48} height={16} rx={4} fill="#0a0814" opacity={0.9}/>
                      <text x={0} y={4} textAnchor="middle" fontSize={10} fill={color} fontFamily="system-ui">{edge.type}</text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Character nodes */}
            {nodes.filter(n => n._kind === "char").map(c => {
              const pos = positions[c.id];
              if (!pos) return null;
              const isSide     = c.type === "side";
              const r          = isSide ? CHAR_R_SIDE : CHAR_R;
              const isHovered  = hoveredId === c.id;
              const isNeighbor = hoveredNeighborIds?.has(c.id);
              const dim        = hoveredId && !isHovered && !isNeighbor;
              const border     = isHovered ? "#c8a96e" : isNeighbor ? "#7c5cbf" : "#3a2a5a";
              return (
                <g key={c.id} transform={`translate(${pos.x},${pos.y})`}
                  style={{ cursor:"pointer", opacity: dim ? 0.2 : 1, transition:"opacity .2s" }}
                  onMouseDown={e => { e.stopPropagation(); didDragRef.current = false; onMouseDown(e, c.id); }}
                  onMouseEnter={() => setHoveredId(c.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={e => onNodeClick(e, c)}>
                  <circle r={r + 4} fill={isHovered ? "#c8a96e18" : isNeighbor ? "#7c5cbf18" : "transparent"}/>
                  <circle r={r} fill="#1a1228" stroke={border} strokeWidth={isHovered ? 2.5 : 1.5}/>
                  {c.image
                    ? <image href={c.image} x={-(r-2)} y={-(r-2)} width={(r-2)*2} height={(r-2)*2} clipPath={`url(#clip-${c.id})`}/>
                    : <text x={0} y={isSide ? 5 : 7} textAnchor="middle" fontSize={isSide ? 15 : 22} style={{ userSelect:"none" }}>{c.name?.[0]?.toUpperCase()||"?"}</text>
                  }
                  <text y={r+14} textAnchor="middle" fontSize={isSide ? 10 : 12} fill={isHovered?"#c8a96e":"#c8b89a"}
                    fontFamily="Georgia,serif" fontWeight={isHovered?"700":"400"} style={{ pointerEvents:"none" }}>
                    {c.name || "Unnamed"}
                  </text>
                  {mode === "chars" && (c.relationships||[]).length > 0 && (
                    <g transform={`translate(${r-5},${-(r-5)})`}>
                      <circle r={8} fill="#7c5cbf"/>
                      <text x={0} y={3} textAnchor="middle" fontSize={9} fill="#fff" fontFamily="system-ui">{(c.relationships||[]).length}</text>
                    </g>
                  )}
                  {/* Status dot */}
                  {c.status && CHAR_STATUS_COLORS[c.status] && (
                    <g transform={`translate(0,${r-2})`}>
                      <circle r={6} fill="#0d0b14"/>
                      <circle r={4} fill={CHAR_STATUS_COLORS[c.status]}/>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Story nodes */}
            {nodes.filter(n => n._kind === "story").map(s => {
              const pos = positions[s.id];
              if (!pos) return null;
              const isHovered  = hoveredId === s.id;
              const isNeighbor = hoveredNeighborIds?.has(s.id);
              const dim        = hoveredId && !isHovered && !isNeighbor;
              const sc         = STATUS_COLORS[s.status] || "#5a3da0";
              const border     = isHovered ? "#c8a96e" : isNeighbor ? sc : sc + "88";
              const charCount  = (s.characterIds||[]).length;
              return (
                <g key={s.id} transform={`translate(${pos.x},${pos.y})`}
                  style={{ cursor:"pointer", opacity: dim ? 0.2 : 1, transition:"opacity .2s" }}
                  onMouseDown={e => { e.stopPropagation(); didDragRef.current = false; onMouseDown(e, s.id); }}
                  onMouseEnter={() => setHoveredId(s.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={e => onNodeClick(e, s)}>
                  {/* Glow */}
                  <rect x={-(STORY_W/2+5)} y={-(STORY_H/2+5)} width={STORY_W+10} height={STORY_H+10} rx={12}
                    fill={isHovered ? "#c8a96e12" : isNeighbor ? sc+"18" : "transparent"}/>
                  {/* Card */}
                  <rect x={-STORY_W/2} y={-STORY_H/2} width={STORY_W} height={STORY_H} rx={8}
                    fill="#1a1228" stroke={border} strokeWidth={isHovered ? 2.5 : 1.5}/>
                  {/* Top color strip */}
                  <rect x={-STORY_W/2} y={-STORY_H/2} width={STORY_W} height={5} rx={4} fill={sc}/>
                  {/* Story image */}
                  {s.image
                    ? <image href={s.image} x={-STORY_W/2+2} y={-STORY_H/2+7} width={STORY_W-4} height={STORY_H-9} clipPath={`url(#clip-s-${s.id})`}/>
                    : <text x={0} y={10} textAnchor="middle" fontSize={26} style={{ userSelect:"none" }}>📖</text>
                  }
                  {/* Status pill at top of card */}
                  {s.status && (
                    <g transform={`translate(0,${-STORY_H/2+14})`}>
                      <rect x={-26} y={-8} width={52} height={14} rx={4} fill={sc}/>
                      <text x={0} y={4} textAnchor="middle" fontSize={9} fill="#fff" fontFamily="system-ui" fontWeight="700" style={{ pointerEvents:"none" }}>
                        {s.status.toUpperCase()}
                      </text>
                    </g>
                  )}
                  {/* Name */}
                  <text y={STORY_H/2+16} textAnchor="middle" fontSize={11} fill={isHovered?"#c8a96e":"#c8b89a"}
                    fontFamily="Georgia,serif" fontWeight={isHovered?"700":"400"} style={{ pointerEvents:"none" }}>
                    {(s.name||"Unnamed").length > 16 ? (s.name||"").slice(0,14)+"…" : (s.name||"Unnamed")}
                  </text>
                  {/* Char count badge */}
                  {charCount > 0 && (
                    <g transform={`translate(${STORY_W/2-6},${-(STORY_H/2-6)})`}>
                      <circle r={9} fill={sc}/>
                      <text x={0} y={4} textAnchor="middle" fontSize={10} fill="#fff" fontFamily="system-ui">{charCount}</text>
                    </g>
                  )}
                </g>
              );
            })}

          </g>
        </svg>
      )}
    </div>
  );
}
