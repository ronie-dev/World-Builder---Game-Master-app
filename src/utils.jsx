import { FACTION_COLORS } from "./constants.js";

export function uid() { return Date.now().toString(36)+Math.random().toString(36).slice(2); }

export function getRaceLabel(races, raceId, subraceId) {
  const race = races.find(r => r.id === raceId); if (!race) return "";
  const sub = race.subraces.find(s => s.id === subraceId);
  return sub ? `${race.name} (${sub.name})` : race.name;
}

export function getFactionColor(factions, factionId) {
  const idx = factions.findIndex(f => f.id === factionId);
  const faction = factions[idx];
  return faction?.color || FACTION_COLORS[idx % FACTION_COLORS.length] || "#3a2a5a";
}

export function formatEventDate(ev) {
  if (!ev.year && !ev.month && !ev.day) return null;
  const parts = [];
  if (ev.year)  parts.push(ev.year);
  if (ev.month) parts.push(ev.month);
  if (ev.day)   parts.push(ev.day);
  return parts.join(' · ');
}

export function sortEventsDesc(events) {
  return [...events].sort((a, b) => {
    const ya = parseInt(a.year)||0,  yb = parseInt(b.year)||0;
    const ma = parseInt(a.month)||0, mb = parseInt(b.month)||0;
    const da = parseInt(a.day)||0,   db = parseInt(b.day)||0;
    if (ya !== yb) return yb - ya;
    if (ma !== mb) return mb - ma;
    return db - da;
  });
}

export function highlight(text, query) {
  if (!query || !text) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase()); if (idx === -1) return text;
  return <>{text.slice(0, idx)}<mark style={{ background:"#7c5cbf55", color:"#e8d5b7", borderRadius:2 }}>{text.slice(idx, idx+query.length)}</mark>{text.slice(idx+query.length)}</>;
}
