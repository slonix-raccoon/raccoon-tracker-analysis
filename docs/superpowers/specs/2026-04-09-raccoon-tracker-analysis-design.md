# Design: Raccoon Tracker Analysis

**Date:** 2026-04-09
**Project:** raccoon-tracker-analysis

## Overview

A lightweight, single-page web app that connects to the RaccoonSoft time tracker REST API (`https://time.raccoonsoft.ru/api/v1`) and provides ad-hoc analysis of time logs — hours per person, project, and task — with flexible grouping.

No build step. Open `index.html` directly in a browser.

---

## File Structure

```
raccoon-tracker-analysis/
├── index.html          # UI + all JS logic inline
├── config.js           # window.CONFIG = { apiKey: '...', baseUrl: '...' }  ← gitignored
├── config.example.js   # same shape, placeholder key  ← committed to git
├── .gitignore
└── CLAUDE.md
```

`index.html` loads `config.js` first via `<script src="config.js">`, then its own inline `<script>` reads `window.CONFIG`.

---

## Authentication

Every API request includes:

```
X-Api-Key: <apiKey from config.js>
```

No Bearer token, no OAuth. Key is stored in `config.js` which is gitignored.

---

## UI Layout

### Filters bar (top)
| Control | Description |
|---|---|
| From / To | Date range pickers, default to current month |
| Person | Dropdown populated from API on page load |
| Project | Dropdown populated from API on page load |
| Group by | Dropdown: `Task` / `Project → Task` / `Person → Project → Task` |
| Load button | Triggers data fetch and render |

### Results (below filters)
- **Summary row:** total hours for the current filter selection
- **Grouped table:** rows with subtotals at each grouping level, indented by nesting depth
- Columns: varies by grouping, always ends with **Duration (hours)**

Style: minimal, clean sans-serif. No charts in initial version.

---

## Data Flow

1. **Page load**
   - `GET /users` → populate Person dropdown
   - `GET /projects` → populate Project dropdown
   - Exact endpoint names to be confirmed against actual API during implementation

2. **On Load click**
   - `GET /time-entries` (or equivalent) with query params: date range, person filter, project filter
   - Exact endpoint and param names to be confirmed during implementation

3. **Client-side grouping**
   - Group and aggregate returned entries by the selected "Group by" mode
   - No additional API calls needed for grouping

4. **Render**
   - Build table DOM from grouped data
   - Insert subtotal rows at each group boundary

---

## Grouping Modes

| Mode | Hierarchy | Subtotals |
|---|---|---|
| Task | flat list of tasks | one subtotal per task |
| Project → Task | tasks nested under project | subtotal per project |
| Person → Project → Task | fully nested | subtotal per person, per project |

---

## Config Files

**`config.js`** (gitignored):
```js
window.CONFIG = {
  apiKey: 'your-actual-key-here',
  baseUrl: 'https://time.raccoonsoft.ru/api/v1',
};
```

**`config.example.js`** (committed):
```js
window.CONFIG = {
  apiKey: 'YOUR_API_KEY',
  baseUrl: 'https://time.raccoonsoft.ru/api/v1',
};
```

---

## Out of Scope (initial version)

- Charts / visualizations
- Collapsible/expandable grouped rows
- Export to CSV
- Multi-user auth
- Caching / offline support
