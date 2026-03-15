export const DEFAULT_RACES = [
  { id:"r1", name:"Human", subraces:[] },
  { id:"r2", name:"Elf", subraces:[{id:"sr1",name:"Wood Elf"},{id:"sr2",name:"High Elf"},{id:"sr3",name:"Dark Elf"}] },
  { id:"r3", name:"Dwarf", subraces:[{id:"sr4",name:"Mountain Dwarf"},{id:"sr5",name:"Hill Dwarf"}] },
  { id:"r4", name:"Orc", subraces:[] }, { id:"r5", name:"Halfling", subraces:[] },
  { id:"r6", name:"Gnome", subraces:[] }, { id:"r7", name:"Tiefling", subraces:[] },
  { id:"r8", name:"Dragonborn", subraces:[] }, { id:"r9", name:"Undead", subraces:[] }, { id:"r10", name:"Fae", subraces:[] },
];
export const ALIGNMENTS = ["Good","Evil","Neutral","Chaotic","Lawful","Unknown"];
export const STORY_STATUSES = ["Draft","Active","Completed","Abandoned"];
export const DEFAULT_STORY_STATUSES = [
  {name:"Draft", color:"#4a4a6a"},
  {name:"Active", color:"#2d6a4f"},
  {name:"Completed", color:"#1a3a6b"},
  {name:"Abandoned", color:"#6b1a1a"},
];
export const DEFAULT_HOOK_STATUSES = [
  {name:"Potential", color:"#7c5cbf"},
  {name:"Active", color:"#4a9a6e"},
  {name:"Resolved", color:"#c8a96e"},
  {name:"Abandoned", color:"#6a6a6a"},
];
export const STORY_TONES = ["Epic","Dark","Comedic","Mystery","Romance","Horror","Political","Adventure"];
export const CHAR_STATUSES = ["Alive","Dead","Unknown"];
export const DEFAULT_CHAR_STATUSES = [
  {name:"Alive", color:"#2d6a4f"},
  {name:"Dead", color:"#6b1a1a"},
  {name:"Unknown", color:"#4a4a6a"},
];
export const CHAR_STATUS_COLORS = { Alive:"#2d6a4f", Dead:"#6b1a1a", Unknown:"#4a4a6a" };
export const STATUS_COLORS = { Draft:"#4a4a6a", Active:"#2d6a4f", Completed:"#1a3a6b", Abandoned:"#6b1a1a" };
export const LOCATION_TYPES = ["City","Town","Village","Fortress","Dungeon","Ruins","Forest","Mountain","Cave","Temple","Port","Wasteland","Other"];
export const ALIGNMENT_COLORS = { Good:"#2d6a4f", Evil:"#6b1a1a", Neutral:"#4a4a6a", Chaotic:"#7a3b00", Lawful:"#1a3a6b", Unknown:"#3a3a3a" };
export const TONE_COLORS = { Epic:"#5a3da0", Dark:"#3a2a5a", Comedic:"#7a5000", Mystery:"#1a4a4a", Romance:"#6b1a3a", Horror:"#5a1a1a", Political:"#2a4a2a", Adventure:"#3a5a1a" };
export const FACTION_COLORS = ["#5a3da0","#2d6a4f","#6b1a1a","#7a3b00","#1a3a6b","#1a4a4a","#6b1a3a","#3a5a1a"];
export const FACTION_STATUSES = ["Operating","Destroyed","Disbanded","Unknown"];
export const FACTION_STATUS_COLORS = { Operating:"#2d6a4f", Destroyed:"#6b1a1a", Disbanded:"#4a4a6a", Unknown:"#3a3a3a" };

export const RELATIONSHIP_TYPES = ["Neutral","Ally","Hostile","Unknown"];
export const DEFAULT_RELATIONSHIP_TYPES = [
  {name:"Neutral", color:"#3a4a6a"},
  {name:"Ally", color:"#2d6a4f"},
  {name:"Hostile", color:"#7a2020"},
  {name:"Unknown", color:"#4a4a5a"},
];
export const RELATIONSHIP_COLORS = { Ally:"#2d6a4f", Hostile:"#7a2020", Neutral:"#3a4a6a", Unknown:"#4a4a5a" };
export const defaultChar = { id:null, name:"", raceId:"", subraceId:"", origin:"", locationId:"", status:"", factions:[], shortDescription:"", description:"", secret:"", image:null, type:"main", class:"", level:"", relationships:[], files:[], links:[], items:[] };
export const defaultStory = { id:null, name:"", status:"Draft", summary:"", description:"", rewards:"", characterIds:[], factionIds:[], locationIds:[], events:[], items:[], image:null, isMain:false, playerId:"" };
export const defaultFaction = { id:null, name:"", description:"", location:"", alignment:"", status:"", color:"" };
export const defaultEvent = { id:null, year:"", month:"", day:"", title:"", description:"", characterIds:[], image:null };
export const defaultLocation = { id:null, name:"", region:"", type:"", description:"" };
export const defaultFilters = { raceId:"", locationId:"", status:"", factionId:"" };

export const RARITIES = ["Common","Uncommon","Rare","Very Rare","Legendary","Artifact"];
export const RARITY_COLORS = { Common:"#9a9a9a", Uncommon:"#4a9a6a", Rare:"#5a8abf", "Very Rare":"#9a5abf", Legendary:"#c8a96e", Artifact:"#c06060" };
export const defaultArtifact = { id:null, name:"", description:"", lore:"", value:"", rarity:"Common", image:null, holderId:null, storyIds:[] };

export const inputStyle = { width:"100%", background:"#0d0b14", border:"1px solid #3a2a5a", borderRadius:6, padding:"8px 10px", color:"#e8d5b7", fontSize:14, boxSizing:"border-box", outline:"none" };
export const selStyle = { ...inputStyle };
export const btnPrimary = { background:"linear-gradient(135deg,#5a3da0,#7c5cbf)", color:"#e8d5b7", border:"none", borderRadius:6, padding:"8px 18px", cursor:"pointer", fontWeight:700, fontSize:13 };
export const btnSecondary = { background:"transparent", color:"#9a7fa0", border:"1px solid #3a2a5a", borderRadius:6, padding:"7px 14px", cursor:"pointer", fontSize:13 };
export const iconBtn = { background:"transparent", border:"none", cursor:"pointer", fontSize:15, padding:4, borderRadius:4 };
