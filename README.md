# World Builder - Game Master App

**Made with Claude Code.**

A desktop app for tabletop RPG Game Masters, Writers, and Video Game Creators to manage their stories, characters, factions, locations, and world maps — all in one place.

Built with **Electron + React + Vite**. All data is stored locally on your machine.

<img width="529" height="442" alt="Image" src="https://github.com/user-attachments/assets/9d47f62a-4db9-4f00-b116-932317ea4971" />

---

## What's New in v0.8.0

### Table Overhaul — Characters, Stories & Items
- All three lists are now **compact filterable tables** with column-header dropdowns
- Characters: **Name | Race | Status | Faction | Location | Type** — race visible in every row and filterable
- Stories: **Name | Status | Player | Type** — main story pinned at top
- Items: **Name | Rarity | Holder**
- Filter dropdowns include a search field and only one can be open at a time
- Opening a tab with nothing selected now immediately shows the filter drawer

### No More Sub-Tabs — Collapsible Sections
- Character and Story detail panels replace the tab bar with **collapsible sections** in a single scrollable view
- Items, Hooks, Timeline, Files — all accessible without switching tabs
- Stories gain a dedicated **🔒 Secret** section between Rewards and Factions
- Stronger `2px` dividers between sections

### Ghost Textarea Editing
- Character Description & Secret, Story Description / Rewards / Secret, and Faction Description tabs all use **always-on ghost textareas** — click anywhere in the field, no layout jump, saves on blur

### GM Hooks Polish
- Row delete now requires **inline confirmation** — no accidental deletions
- Linking a hook to a story **transfers** it permanently — it becomes a pinned story hook and disappears from the GM Hooks list

### Other Fixes & Additions
- Relationships: inline **note field** per relationship entry
- **+ New** always opens in the panel where it was clicked
- Internal drag-and-drop in Faction tiers / Story groups no longer triggers cross-panel navigation
- GM Hooks entity picker no longer clipped by scroll container
- Gallery: search bar to filter images by name
- Dev mode: separate data directory + red DEV badge in sidebar

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
