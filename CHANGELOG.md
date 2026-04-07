# Changelog

## v0.7.0 — Dual-Panel Navigation, Section Split & UX Polish

### Dual-Panel System — Navigation History
- **Back button (←)** in the panel header — navigate backwards through your in-panel history (open a character → jump to their item → press ← to return)
- `charSubTab` and `storySubTab` are now included in navigation snapshots so the exact sub-tab is restored on back
- Map picker dialog now pushes to panel history — back button works after selecting a map from the multi-map picker

### Sidebar — Redesign & Double-Click
- Sidebar icons are now **33% larger** (22 px icons, 50×44 px hit area, 44×36 px tool buttons) for easier clicking
- **Double-click any sidebar icon** to open that section instantly in the right panel
- Dragging a section icon onto a panel that already shows that section is now a no-op (no accidental resets)

### Notes — Split into Three Sections
- **📝 Notes** — scratch pad only (no more clutter)
- **📖 Sessions** — session log with events and story timeline links
- **📌 Hooks** — GM hooks + all pinned story/character hooks in one drag-reorderable list

### Floating Search Bar — All Tabs
- All five major sections (Characters, Stories, Factions, Locations, Items) now have a **floating search bar** that overlays the detail panel — the detail fills the full height and the search sits on top
- Filter drawer opens on click or as you type; closes automatically on outside click
- Locations drawer groups results by location type; Items drawer has rarity filter pills

### Cross-Panel Links — Ctrl+Click & Middle-Click
- **Every navigation link** in the app now supports **Ctrl+click** and **middle-click (MMB)** to open the target in the other panel
- Covers: faction names in character detail, artifact rows in character and story detail, character name chips in story groups, faction/location tags in story detail, character chips in Timeline events, session log story links, hook card linked-story badge, map pin clicks and location label text
- `onOpenArtifact` now supports `{ newTab: true }` throughout

### Image Lightbox — Scoped to Panel
- Zoomed portrait/image lightbox is now **contained within its panel** instead of covering the full screen — the other panel remains fully visible and interactive

### File Drag — No False Overlay
- Dragging an image file from outside the app onto an image drop zone no longer triggers the "Drop to replace this screen" panel overlay — only internal section/entity drags show that overlay

## v0.6.1 — Seamless Editing, Hook Overhaul & Location Factions

### Seamless Inline Editing
- **Items & Artifacts** — removed the Edit button; name, value, description, and lore are now always-editable ghost fields; border appears only on focus, subtle background highlight on hover
- **Locations** — removed the Edit button; name, region, description, and type are now always-editable inline; same focus-only border behavior
- **Factions description** — hover highlight added to the description area (background + outline); textarea border is now hidden by default and appears only when focused

### Hooks — Full Row-Based Rewrite
- Hook data model redesigned: each hook is now a list of **rows** (`[{text, entities[]}]`) instead of a flat block array — one row = one text field + a column of entity cards beside it
- Two add buttons: **＋ row** at the bottom adds a new text row; **＋ entity** button on the right of each row adds an entity card to that row
- Entity cards stack vertically beside their row's text, giving the text field maximum width
- Entity cards show the actual portrait/image of the linked entity (not just an icon)
- Text blocks **auto-expand** while typing — no more scrolling inside a tiny textarea
- Drag-and-drop reordering of rows via ⠿ handle; entities within a row are also draggable
- Migration from all old formats (`blocks[]`, `description + linkedEntities`) handled automatically

### Notes — Unified Hook List
- **GM hooks and pinned story/character hooks now live in a single unified list** — no more separate "Pinned from Stories & Characters" section
- All hooks (GM-created and pinned) are drag-reorderable together via ⠿ handles
- Hooks linked to a story now **sync bidirectionally** — edits made in the Notes panel are reflected in the story's Hooks tab and vice versa
- `hookListOrder` is self-healing: preserves stored order and appends any newly created hooks at the end

### Locations — Faction Linking
- Factions section in the Location detail panel is now **always visible** with a "＋ Link faction" button
- Link any faction to the current location directly from the panel (sets the faction's home location)
- Unlink with the × button beside each faction badge
- Inline search picker with live filtering

## v0.6.0 — Codebase Cleanup & Structural Refactor

### Architecture
- All major tab components extracted from `App.jsx` into dedicated files under `src/components/tabs/` — `GalleryTabContent`, `NotesTabContent`, `CharactersTabContent`, `StoriesTabContent`, `FactionsTabContent`, `LocationsTabContent` are now standalone modules
- `App.jsx` reduced by ~700 lines across the two cleanup passes

### UX Polish (from PLAN.md refactor)
- **2-step delete confirmations** added throughout — Characters, Stories, Factions, Locations, Map pins, and all linked entity removals now require an inline ✓/✕ confirm before any data is deleted
- **Summary strips** in detail panel headers — Locations, Factions, and Stories show at-a-glance counts (residents, members, factions, stories, hooks) as clickable pills
- **Empty states** added to Characters, Stories, Factions, and Locations list and detail panel sections with helpful copy
- **Button transitions** (`opacity`, `box-shadow`, `border-color`) added to `btnPrimary`, `btnSecondary`, and `iconBtn` tokens for consistent hover feedback
- **CardRow hover** now also shifts background color for better click affordance

### Command Palette
- Added **type filter tabs** (All, Characters, Stories, Factions, Locations, Items, Lore) — filter results by entity type without typing a prefix
- Result limit raised to 60; footer always visible with keyboard hint and result count
- Faction icon updated to ⚑ (consistent with the rest of the app)

### Gallery Picker
- Fixed a hover bug where overlapping mouse event handlers competed — overlay now has `pointerEvents:"none"`
- **Escape key** closes the picker
- Footer shows `Esc to close` hint

### Faction Header Fix
- Fixed transparent faction detail panel header — sticky wrapper now has a solid background and `overflow:hidden` to prevent scrolled content bleeding through the gradient

## v0.5.1 — Era Timeline, Filter Polish & Bug Fixes

### Timeline — Era Separators
- Era separators now appear in **Lore → Events** tab, not just the Global Timeline
- Lore Events tab has a **horizontal jump bar** (same as Global Timeline) with clickable year dots and era markers
- Era separators are placed **after the last event of the era's start year** (bottom of the year group, not the top)
- Eras whose `startYear` is below all existing events now show as **tail separators** at the bottom of the timeline and right end of the jump bar
- Era markers in the jump bar are clickable and scroll to the separator

### Characters — Filter Dropdowns
- Race, Location, Status, and Faction filters are now **searchable comboboxes** — click to open, type to filter, pick an option
- Active filters highlight in purple
- Fixed a bug where filter dropdowns had **no effect** (function updater was passed instead of a value)

### Scratch Pad
- Fixed Scratch Pad not **auto-expanding** on load — textarea now resizes whenever content changes, including after campaign switch or import

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
