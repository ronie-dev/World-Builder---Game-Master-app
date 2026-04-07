# World Builder - Game Master App

**Made with Claude Code.**

A desktop app for tabletop RPG Game Masters, Writers, and Video Game Creators to manage their stories, characters, factions, locations, and world maps — all in one place.

Built with **Electron + React + Vite**. All data is stored locally on your machine.

<img width="529" height="442" alt="Image" src="https://github.com/user-attachments/assets/9d47f62a-4db9-4f00-b116-932317ea4971" />

---

## What's New in v0.7.0

### Back Button — Panel Navigation History
- Every panel now tracks navigation history — press **←** in the panel header to go back to your previous view
- Works across all section changes: character → item → ← back to character, story → faction → ← back to story, etc.

### Notes Split into Three Sections
- **📝 Notes** — scratch pad only
- **📖 Sessions** — session log with timeline linking
- **📌 Hooks** — all GM hooks and pinned story/character hooks in a unified drag-reorderable list

### Floating Search Bar — All Tabs
- Characters, Stories, Factions, Locations, and Items all use a **floating search bar** that hovers above the detail panel — the detail fills the full height and the search closes automatically when you click away

### Open in Other Panel — Everywhere
- **Ctrl+click** or **middle-click** any link (character name, story badge, faction tag, location, artifact, map pin…) to open it in the other panel — works consistently across every part of the app

### Sidebar Improvements
- Icons are **33% larger** for easier clicking
- **Double-click** any sidebar section icon to open it directly in the right panel
- Dragging a section onto a panel that already shows it does nothing (no accidental resets)

### Lightbox Scoped to Panel
- Zoomed portrait/image is now contained within its panel — the other panel stays fully visible

### File Drop Fix
- Dragging an image from outside the app no longer triggers the "Drop to replace this screen" overlay

---

## Features

### Campaigns
- Manage multiple campaigns — each is a fully independent world
- Switch between campaigns at any time; progress is auto-saved
- Create, rename, and delete campaigns with confirmation

### Characters
- Main, Side, and Player character types
- Inline creation — new characters open directly in the detail panel, no popup
- Character portrait upload with lightbox zoom
- Details: race/subrace, class, level, alignment, origin, location, status
- Biography with custom **tabbed text editor** — add, rename, and delete tabs
- **🔮 Hooks** sub-tab — plot threads and GM notes per character, pinnable to Reminders
- Relationships with other characters (typed, colored)
- Faction memberships with roles synced to faction tiers
- Items inventory with images and descriptions
- Character timeline (events from linked stories)
- Files panel for player characters
- External links

### Stories
- Main story, Player stories, and regular stories
- Story events with character tagging and dates; automatically sorted by date on save
- Status tracking with custom statuses and colors
- **🔮 Hooks** sub-tab — plot threads and potential future scenarios, pinnable to Reminders
- Linked characters, factions, locations, and artifacts
- Search and status filter

### Factions
- Alignment, status, color coding, and logo/portrait
- **Members** tab — drag-and-drop tier builder to organize members into named rank levels
- Multi-tab description editor
- Location search linked to the Locations list

### Locations
- Grouped by type with fold/unfold
- Search and type filter
- Detail panel showing linked characters, factions, and stories — link/unlink factions directly from the panel
- "Show on Map" button — navigate directly to a pinned location on the World Map

### World Map
- Upload a map image (PNG, JPG, WebP) per map
- Place location pins linked to entries from the Locations tab
- Sidebar pin list — all pinned locations with search and type filter; click to center camera
- Zoom (mouse wheel, +/− buttons) and pan (drag)
- Multiple maps per campaign with named tabs

### Items & Artifacts
- Rarity system: Common → Artifact
- Image lightbox, lore/history field, holder assignment, and linked stories

### Lore & Timeline
- **Global Timeline** across all stories and lore events with era separators and a quick-jump scrubber bar
- **Lore Events** tab with its own era separators and jump bar
- Eras / Ages defined in Settings with start years and colors

### Gallery
- Browse all images from characters, stories, artifacts, and lore events in one masonry grid
- Filter by type; direct upload with name and category; delete custom entries with confirmation
- Click any image to open a full lightbox

### Command Palette
- **Ctrl+K** — instant search across all entities
- Type filter tabs (All / Characters / Stories / Factions / Locations / Items / Lore)
- Keyboard navigation with Enter to open

### Notes, Sessions & Hooks
- **📝 Notes** — scratch pad with auto-expanding textarea
- **📖 Sessions** — add sessions with dates and events; link events directly to story timeline entries
- **📌 Hooks** — GM hooks and all pinned story/character hooks in one drag-reorderable list; hooks linked to a story sync bidirectionally

### Relationships
- Visual relationship web between characters and stories

### Settings
- Custom character statuses, story statuses, hook statuses, relationship types — all with color pickers
- Custom races with icons and subraces
- Location types, item rarities, deity alignments, and eras

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
git clone https://github.com/ronie-dev/World-Builder---Game-Master-app.git
cd World-Builder---Game-Master-app
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
