// Renders text with @mentions as inline chips
const ENTITY_ICON = { character:"👤", faction:"⚑", location:"📍", story:"📜" };

export default function RichText({ text, mentions, style }) {
  if (!text) return null;
  const parts = text.split(/(@\S+)/g);
  return (
    <span style={style}>
      {parts.map((part, i) => {
        if (part.startsWith("@")) {
          const name = part.slice(1);
          const m = (mentions || []).find(x => x.name === name);
          if (m) return (
            <span key={i} style={{ display:"inline-flex", alignItems:"center", gap:3, background:"#1a1230", border:"1px solid #3a2a5a", borderRadius:10, padding:"1px 7px 1px 5px", fontSize:12, color:"#c8b89a", verticalAlign:"middle", lineHeight:1.6 }}>
              {ENTITY_ICON[m.type]} {m.name}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
