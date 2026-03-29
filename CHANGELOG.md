# Changelog

## v0.5.0 — Notes Overhaul, Visual Polish & Navigation

### Notes — Unified Pinned Reminders
- All pinned items (story hooks, character hooks, and manual notes) are now in a **single merged list** — freely interleave hooks and reminders in any order
- **Drag-and-drop reordering** across all pin types — grab the ⠿ handle to move any item anywhere in the list
- Removed the old ▲/▼ up/down arrows in favour of drag

### Notes — Hook Navigation
- Clicking a **pinned story hook** title or story name now navigates directly to that story with the **Hooks tab** pre-selected
- Clicking a **pinned character hook** title or character name navigates to that character with the **Hooks tab** pre-selected

### Notes — Session Log Improvements
- Session event cards redesigned: each event is now a **card** with a colored left border (purple when linked to a story, dark when not)
- Events are spaced with a gap instead of being dense borderless rows
- The "🔗 Story" link is now a pill badge; "+ Add to Timeline" is a subtle rounded button
- Session headers have a consistent dark background with date in gold and event count dimmed
- Event and pin text inputs now use the **ghost input** style — transparent, minimal

### Notes — Add to Timeline Story Picker
- Story picker modal now shows each story's **status badge** (colored by your status settings) next to the story name

### Notes — Scratch Pad
- Scratch Pad now **auto-expands** to always show full content — no more scrolling inside the text box
- Typing is now instant — scratch pad uses local state and only saves to the campaign when you stop editing (same pattern as description fields), eliminating the input lag caused by re-rendering the whole tab on every keystroke

### Timeline — Image Management
- Timeline event cards with an image now show **Gallery** and **Remove** buttons directly under the image in view mode — no need to open the edit form to swap or clear an image

### Factions — Visual
- Faction gradient header direction flipped — color bleeds in from the right
- Faction now supports a **photo/logo** (same PortraitZone as characters and stories)
- Faction portrait visible in the **faction list cards**
- Faction portrait supports lightbox zoom

### Factions — Location Search
- Location field replaced with an **inline search box** linked to the Locations list — type to filter, click to assign

### Factions — Description Tabs
- Faction description now uses the same **multi-tab editor** as characters — add, rename, and delete custom description tabs

### Factions — Color Picker
- Color picker is now always accessible via a small color swatch icon
- Color saves automatically after you stop picking (debounced) — no more Apply button

### Shared — PortraitZone
- Characters, Stories, and Factions all use a new shared **PortraitZone** component
- Image stays fully visible — **four corner icon buttons** appear on hover: 🔍 zoom, 📷 upload file, 🖼️ gallery, ✕ remove
- Drag-and-drop an image file from outside the app directly onto the portrait zone

### Global Timeline
- Visual redesign matching the Story/Character Timeline style: vertical rail with dots, colored left border per story, image + title row, description below, character chips with avatar and short description

---

## v0.4.3 — Character Details, Gallery & QoL Improvements

### Characters — Header Redesign
- **Race** and **Location** now displayed in the character detail header (next to each other), removed from the Details grid
- **Short Description** shown below Race/Location in the header in italic — visible in view mode without opening the edit form

### Characters — Files Tab for All Types
- The **📁 Files** tab is now available for all character types (Main, Side, and Player) — previously only Player characters had it

### Characters — Faction Role Sync
- Faction roles on the character sheet are now a **dropdown** showing tiers defined in the faction itself — no more free-text mismatch
- Creating a new tier from the character sheet immediately adds it to the faction's Members tab (synced both ways)
- Faction dropdown in character edit form now has an **inline search field** for quick filtering

### Characters — Items Tab Artifact Link
- Artifact cards in the character's Items tab are now **clickable** — clicking jumps directly to the artifact in the Items & Artifacts tab (↗ Items label shown)

### Stories — Sort by Status Order
- Stories list is now automatically sorted by the **status order defined in Settings** — drag/reorder statuses in Settings to control the sort order

### Settings — Status Reorder
- Status lists in Settings (Story Statuses, Hook Statuses, etc.) now have **▲/▼ arrows** on each row to reorder them; the new order is used for story sorting

### Gallery Tab
- New **🖼️ Gallery** tab in the sidebar — browse all images from characters, stories, artifacts, and lore events in one masonry grid
- Filter by type: Characters, Stories, Artifacts, Lore, or All
- **Direct upload**: add custom images to the gallery, assign a name and category; custom entries persist in the campaign save
- Click any image to open a full lightbox; custom gallery entries can be deleted (with confirmation)

### Items & Artifacts — Story Search
- Added a **search field** above the linked stories list in the artifact edit panel — quickly filter stories by name when linking

---

## v0.4.2 — Inline Factions, Timeline Quick-Jump & Crash Fix

### Factions — Inline Creation & Editing
- New factions are created **directly in the detail panel** — clicking **+ New Faction** opens a draft entry immediately without a popup modal, matching the pattern used by Characters, Stories, and Locations
- Cancelling a new faction discards it cleanly without saving

### Timeline — Horizontal Quick-Jump Bar
- A **sticky scrubber bar** now sits at the top of the Global Timeline — it shows every dated group as a clickable dot with the year label above and event count below
- Clicking any dot **smoothly scrolls** the timeline to that date group, centered on screen
- The bar is **horizontally scrollable** when there are many entries
- The active (last-jumped-to) dot and its corresponding spine node highlight in gold

### Bug Fixes
- Added a global **Error Boundary** — if a render error occurs anywhere in the app, a "Something went wrong" screen is shown with the error message instead of a blank white screen; the app can be recovered with "Try again"
- Fixed crash when opening the "+ New Faction" panel (caused by an object being rendered directly as a React child)

---

## v0.4.1 — Characters Overhaul, Hooks & QoL

### Characters — Inline Creation
- New characters are created **directly in the detail panel** — clicking **+ Main** or **+ Side** opens a draft character immediately without a popup modal
- Cancelling a new character discards it cleanly without saving

### Characters — Biography Tabs
- The Biography field is now a **tabbed text editor** — add as many custom tabs as you need alongside the permanent Biography tab
- Rename any custom tab via the ✏️ button; delete with ✕ (inline confirmation required)

### Characters — Hooks
- New **🔮 Hooks** sub-tab on every character — add plot threads, reminders, and GM notes tied to a specific character
- Same pattern as Story hooks: status per hook (customisable), reorder, delete with confirmation
- Pin any character hook to **Pinned Reminders** with one click

### Notes — Character Hook Pins
- Pinned character hooks appear in Pinned Reminders with the character's **avatar**, character name as a clickable link, and an inline status dropdown
- Character links are displayed as compact **horizontal pills** — avatar + name in a row

### Notes — Story Hook Pins
- Story plot hooks can be **pinned directly to Pinned Reminders** — click 📌 on any hook in the Stories → Hooks tab
- Pinned hooks appear with the story name as a clickable link and inline status dropdown
- Pinning and deleting pins are **undoable** (Ctrl+Z)

### Notes — Reminders
- Completed reminders now show a **green highlight** instead of strikethrough text
- Notes state (pins, hook pins) is fully included in the undo history

### Characters Tab
- Player cards are now **horizontal** — smaller and more compact, showing avatar, name, class, and level in a row

### Bug Fixes
- Editing a story, character, faction, or location no longer removes hooks or other data that was added after the edit form was first opened (form now merges on save instead of overwriting)
- Switching tabs preserves in-progress form text — pinned reminders, story hooks, and other forms retain their content when navigating away and back

### Global Search
- Added ✕ close button to the search bar so it can be closed with the mouse

### Help & Shortcuts
- New **? Help & Shortcuts** button above Undo in the sidebar
- Lists all keyboard shortcuts and mouse gestures available in the app

---

## v0.4.0 — Multi-Tab Navigation & Performance

### Multi-Tab Navigation
- **Browser-style tabs** — open multiple views side by side using the `+` button in the tab bar
- **Middle-click** or **Ctrl+click** any linked character, story, faction, or location to open it in a new tab
- Works across all link surfaces: detail panels (characters, stories, factions, locations, artifacts), event char chips in Story Timeline and Global Timeline, story header rows in Global Timeline, and item holder/story links in the Items tab
- Tabs are independent — each has its own selected entity, sub-tab, and scroll state

### Performance
- Characters, Stories, Factions, and Locations tabs extracted into dedicated `React.memo` components — only the relevant tab re-renders on state changes
- `useMemo` for filtered character lists, story groupings, and current timeline date computation
- Stable `useCallback` handlers throughout to minimise child re-renders

---

## v0.3.2 — Faction Structure, Customizable Statuses & Race Icons

### Factions
- New **🏗️ Structure** (now **👥 Members**) tab in faction detail — drag-and-drop tier builder to organize members into named rank/role levels
- Tiers can be reordered with ▲/▼ arrows, renamed, given a description, and deleted (with confirmation)
- Description moved to a dedicated **📖 Description** tab — cleaner layout
- Dragging a member card between tiers updates their assignment instantly

### Settings — Customizable Statuses
- **Story Statuses** are now fully editable in Settings — add, rename, delete, and pick a color per status
- **Hook Statuses** (🔮 Hooks tab in Stories) are also fully editable with color picker
- Changes take effect immediately across all stories and hooks

### Settings — Race Icons
- Each race entry in Settings now supports a **custom icon image** (upload any PNG/JPG)
- The custom icon replaces the default 🧬 emoji in character list cards and detail panels
- Icon can be removed to revert to the default 🧬

### Relations Tab
- Removed the Relations tab (data is preserved in campaign saves)

### Session Log
- Individual log **events** now require delete confirmation before removal (inline, same style as session-level deletion)

---

## v0.3.1 — Polish, Navigation & QoL Improvements

### Navigation & Memory
- Each tab now remembers the last selected item — navigating away and back restores the previous selection
- Story and Character detail panels remember the last active sub-tab (Details, Items, Timeline, etc.) across tab switches
- Clicking a linked faction, character, story, or location no longer clears the selection in other tabs

### Stories
- New **🔮 Hooks** sub-tab — add potential future scenarios, plot branches, and quest hooks with status (Potential / Active / Resolved / Abandoned)
- Delete confirmation popup on hooks

### Factions
- Description field now preserves line breaks (Shift+Enter)
- Faction list card hides side characters from member preview
- Faction detail panel separates main/player members from side characters (collapsible section)

### Locations
- Location list cards now show linked **faction chips** (colored by faction color) and hide side characters
- Location detail panel redesigned: inline editing (no more popup window), matching the pattern of other tabs
- Location detail panel shows linked factions as clickable chips — click to jump to that faction
- Description field preserves line breaks (Shift+Enter)

### Stories > Items & Items Tab
- Linked artifacts in Stories are now clickable — click jumps to Items tab and selects the artifact
- Linked artifacts show character avatar + owner name as a clickable link to Characters tab
- Linked stories in Items tab detail panel are now clickable links to Stories
- Item descriptions preserve line breaks (Shift+Enter)

### Pinned Reminders
- Linked character now shows avatar, name, and short description as a clickable link to Characters tab
- Character linking converted to **multi-select** — pin multiple characters to one reminder
- Legacy single-character pins automatically migrated

### Timeline & Lore
- Event descriptions now preserve line breaks (Shift+Enter) in Story Timeline, Global Timeline, and Character Timeline

### Image Lightbox
- All zoomable images now show **Copy to Clipboard** and **Download** buttons
- Copy uses native Electron clipboard API (reliable, works with all image formats)
- Toast notification confirms successful copy

### External Links
- External links in Character detail (and everywhere else) now open in the system browser instead of a new Electron window

---

## v0.3.0 — Map Improvements, Session Log & Navigation

### World Map
- Pin labels shown by default; toggle "Labels On/Off" button with persistent setting (saved to localStorage)
- Hover tooltip shows pin name + remove button even when labels are off (map stays clean by default)
- Sidebar pin list — see all pinned locations at a glance, searchable and grouped by location type
- Click a sidebar entry to center the camera on that pin
- "🗺️ Show on Map" button in Location detail panel banner — navigates to Map tab and centers the view on the pin
- If a location is pinned on multiple maps, a picker modal lets you choose which map to open
- Labels toggle state persists across sessions via localStorage

### Session Log
- New session events now appear at the top (newest first)
- Input box moved above the event list for faster entry
- Session log header shows total event count across all sessions
- Clicking a linked story in a session event now navigates to that story AND scrolls to / highlights the specific timeline event

### Stories & Timeline
- Events within a story are now sorted by date on save (year → month → day)
- Timeline events highlight and auto-scroll when navigated to from the session log

### Characters
- Empty state now shows a helpful prompt: "No characters yet. Click '+ Add' to get started."
- Search empty state shows "No characters match your search."

### Pinned Reminders
- Up/Down reorder buttons (▲/▼) on each pinned reminder

---

## v0.2.0 — Campaigns, World Map & Electron

### Multiple Campaigns
- Full multi-campaign support — each campaign is a separate world stored independently
- Campaign Manager screen (fullscreen on first launch, modal overlay when switching)
- Create, rename, delete campaigns with confirmation popup
- Active campaign auto-saves with 500ms debounce; synchronous flush before switching
- Migration from legacy single-world save format

### World Map Tab
- Upload a map image (PNG, JPG, WebP) per map
- Place location pins linked to entries from the Locations tab
- Pin search with text filter and location type dropdown filter
- Location type icons (emoji) shown on pins and in the search list
- Zoom (mouse wheel, +/− buttons) and pan (drag) with counter-scaled pins
- Multiple maps per campaign with named tabs, rename and delete (with confirmation)
- Map data included in Export/Import

### Electron
- Removed all web-browser fallbacks (localStorage, window.storage, blob URL download, file input import)
- Storage is now IndexedDB only; Export/Import uses native OS file dialogs exclusively
- App renamed to **World Builder - Game Master**
- Window title updated in electron.cjs and index.html

---

## v0.2 — Settings, Undo & Polish

### Settings — Data Management
- **Character Statuses** — add, rename, delete custom statuses with color picker; renames propagate to all characters
- **Relationship Types** — same pattern: add, rename, delete with per-type color; renames propagate to all character relationships
- Status and relationship type colors now shown in character list cards (CharCard), detail panel badges, and RelationshipLinker

### Undo
- Global undo stack (50 steps) covering: save/delete characters, stories, factions, locations, artifacts, lore events, relationship map, races, statuses, and relationship types
- **Ctrl+Z** keyboard shortcut (skips text inputs so browser native undo still works there)
- **↩ Undo (N)** button in sidebar showing available step count

### UI
- Version number displayed under the World Builder title in the sidebar

---

## v0.1 — Initial Release

### Core Features
- **Characters tab** — Main, Side, and Player character management with full detail panel
  - Sub-tabs: Details, Items, Timeline, Files
  - Character portrait upload with lightbox zoom
  - Relationships, factions with roles, external links
  - Items inventory with image lightbox and pre-wrap descriptions
  - Character timeline (events from linked stories)
  - Files panel for player characters
- **Stories tab** — Story management with detail panel
  - Main story, Player stories (compact horizontal cards), regular stories
  - Events with character tagging and dates
  - Status filtering and text search
- **Factions tab** — Faction management with detail panel
- **Locations tab** — Location management grouped by type with fold/unfold
  - Search and type filter
  - Detail panel showing linked characters and stories
- **Items & Artifacts tab** — Two-column layout with rarity filtering
  - Image lightbox, lore/history field, holder assignment, linked stories
- **Timeline tab** — Global timeline across all stories and lore events
- **Relations tab** — Visual relationship map
- **Lore tab** — World lore event log
- **Notes tab** — Scratch pad, pinned reminders, session log

### Search & Filtering
- Character search covers all fields (name, description, race, location, faction, secret, origin, class)
- Location dropdown and Faction dropdown with inline search and flip-above logic when near screen bottom
- Story status filter, location type filter

### Layout
- Viewport-locked layout — no page scroll, all columns scroll independently
- Consistent two-column pattern: left list + right detail panel across all tabs
- Back navigation between tabs (e.g. clicking a character from a story detail)

### Storage & Export
- IndexedDB as primary storage (no 5 MB browser limit)
- Full Export/Import — saves all data including artifacts, lore, relations, and notes
- Electron: native Save As / Open File dialogs for export/import

### Electron
- Desktop app via Electron with dev mode support
- GitHub Actions workflow for auto-building Windows (.exe), Mac (.dmg), Linux (.AppImage) on release tag push
