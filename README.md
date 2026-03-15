# World Builder - Game Master App

**Made with Claude Code.**

A desktop app for tabletop RPG Game Masters, Writers, and Video Game Creators to manage their stories, characters, factions, locations, and world maps — all in one place.

Built with **Electron + React + Vite**. All data is stored locally on your machine.
<img width="1674" height="973" alt="image" src="https://github.com/user-attachments/assets/e8d88b76-f709-448f-a85d-544e033737d6" />

---

## What's New in v0.4.0

### Multi-Tab Navigation
- Open any character, story, faction, or location in a **new tab** — **middle-click** or **Ctrl+click** any link or badge throughout the app
- Tabs remember their full navigation state independently (selected entity, sub-tab, filters)
- Works on: character relationships, story/faction/location badges in detail panels, timeline entries, artifact links, and more

### Performance
- Tab sections (Characters, Stories, Factions, Locations) are now isolated — switching tabs no longer re-renders unrelated parts of the app
- Filtered character lists and timeline date calculations are memoized

---

## Features

### Campaigns
- Manage multiple campaigns — each is a fully independent world
- Switch between campaigns at any time; progress is auto-saved
- Create, rename, and delete campaigns with confirmation

### Characters
- Main, Side, and Player character types with helpful empty-state prompts
- Character portrait upload with lightbox zoom
- Details: race/subrace, class, level, alignment, origin, location, status
- Relationships with other characters (typed, colored)
- Faction memberships with roles
- Items inventory with images and descriptions
- Character timeline (events from linked stories)
- Files panel for player characters
- External links

### Stories
- Main story, Player stories, and regular stories
- Story events with character tagging and dates; automatically sorted by date on save
- Status tracking: Draft, Active, Completed, Abandoned
- Linked characters, factions, locations, and artifacts
- Search and status filter
- Timeline events highlight and auto-scroll when navigated to from the session log

### Factions
- Faction management with alignment, status, and color coding
- Detail panel showing members and linked stories

### Locations
- Grouped by type with fold/unfold
- Search and type filter
- Detail panel showing linked characters and stories
- "Show on Map" button — navigate directly to a pinned location on the World Map

### World Map
- Upload a map image (PNG, JPG, WebP) per map
- Place location pins linked to entries from the Locations tab
- Pin labels shown by default with toggle (Labels On/Off), setting persists across sessions
- Hover over a pin to reveal its name and remove button
- Sidebar pin list — all pinned locations grouped by type with search and type filter
- Click a sidebar entry to center the camera on that pin
- If a location appears on multiple maps, a picker lets you choose which to open
- Pin search with text filter and location type dropdown
- Location type icons shown on pins and in the search list
- Zoom (mouse wheel, +/− buttons) and pan (drag)
- Multiple maps per campaign with named tabs

### Items & Artifacts
- Rarity system: Common → Artifact
- Image lightbox, lore/history field
- Holder assignment and linked stories

### Lore & Timeline
- Global timeline across all stories and lore events
- World lore event log

### Relationships
- Visual relationship map between characters and factions

### Notes
- Scratch pad
- Pinned reminders with up/down reorder buttons
- Session log with newest entries at the top
  - Total event count shown in the header
  - Click a linked story event to navigate directly to it in the timeline (with highlight + scroll)

### Settings
- Custom character statuses with color picker
- Custom relationship types with color picker

### Undo
- Global undo stack (50 steps) with **Ctrl+Z**

### Export / Import
- Full world export to `.json` file (includes all data and maps)
- Import restores complete world state
- Uses native OS file dialogs

---

## Download

Download the latest `.exe` installer from the [Releases](../../releases) page. No setup required — just install and run.

---

## Run from Source

Requires **Node.js** (v18 or later).

```bash
git clone https://github.com/ronie-dev/World-Building-Game-Master-App.git
cd World-Building-Game-Master-App
npm install
npm run electron
```

### Build installer

```bash
npm run dist
```

Output will be in the `release/` folder.

---

## Tech Stack

- [Electron](https://www.electronjs.org/)
- [React 19](https://react.dev/)
- [Vite](https://vitejs.dev/)
- Storage: IndexedDB (built into Electron's Chromium)

---

## License

MIT
