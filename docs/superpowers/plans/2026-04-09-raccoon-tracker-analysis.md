# Raccoon Tracker Analysis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a vanilla HTML/JS single-page app that fetches time logs from the RaccoonSoft time tracker API, groups them by task/project/person, and displays a summary table with subtotals.

**Architecture:** Single `index.html` with all logic inline, opened directly in browser (no build step, no server). A separate `config.js` (gitignored) provides the API key and workspace ID via `window.CONFIG`. All user/project filtering and grouping is done client-side after fetching from the API.

**Tech Stack:** Vanilla HTML5, CSS3, JavaScript (ES2020 inline script), REST API with `X-Api-Key` header auth.

---

## API Reference (discovered)

Base URL: `https://time.raccoonsoft.ru/api/v1`
Auth: `X-Api-Key: <key>` on every request.
Workspace ID: `3067f7d0-d181-40c6-a9d4-ae3784e1e5b5` (only one workspace).

| Endpoint | Response shape |
|---|---|
| `GET /workspaces/{wsId}/users` | `[{ id, name, email, status }]` |
| `GET /workspaces/{wsId}/projects` | `[{ id, name, clientId, clientName }]` |
| `GET /workspaces/{wsId}/time-entries?start=&end=&projectId=` | `[{ id, description, userId, projectId, timeInterval: { start, end, duration } }]` |

**Duration format:** ISO 8601 — e.g. `"PT45M"`, `"PT1H30M"`, `"PT2H"`.
**User filter:** NOT supported server-side — must be applied client-side after fetch.
**Project filter:** Supported server-side via `projectId` query param.
**Date filter:** `start` and `end` as ISO 8601 datetime strings (e.g. `2026-04-01T00:00:00Z`).
**Task name:** `entry.description` field.

---

## File Map

| File | Role |
|---|---|
| `index.html` | Entire app: HTML skeleton, CSS styles, JS logic |
| `config.js` | `window.CONFIG` with `apiKey` and `workspaceId` — gitignored |
| `config.example.js` | Same shape, placeholder values — committed to git |
| `.gitignore` | Ignores `config.js` and OS files |
| `CLAUDE.md` | Stack, run instructions, API notes |

---

## Task 1: Scaffold project

**Files:**
- Create: `.gitignore`
- Create: `config.example.js`
- Create: `CLAUDE.md`

- [ ] **Step 1: Create project folder and init git**

```bash
cd C:/work/sandbox/claude
mkdir raccoon-tracker-analysis
cd raccoon-tracker-analysis
git init
```

- [ ] **Step 2: Create `.gitignore`**

```
config.js
.DS_Store
Thumbs.db
```

- [ ] **Step 3: Create `config.example.js`**

```js
window.CONFIG = {
  apiKey: 'YOUR_API_KEY_HERE',
  workspaceId: '3067f7d0-d181-40c6-a9d4-ae3784e1e5b5',
  baseUrl: 'https://time.raccoonsoft.ru/api/v1',
};
```

- [ ] **Step 4: Create `config.js`** (your real credentials — gitignored)

```js
window.CONFIG = {
  apiKey: 'rk_e81885d76fe2df8cfb480f2016124411caedd5849635c1d0',
  workspaceId: '3067f7d0-d181-40c6-a9d4-ae3784e1e5b5',
  baseUrl: 'https://time.raccoonsoft.ru/api/v1',
};
```

- [ ] **Step 5: Create `CLAUDE.md`**

```markdown
# raccoon-tracker-analysis

## Stack
Vanilla HTML + JS, no build step. Open `index.html` directly in browser.

## Setup
1. Copy `config.example.js` → `config.js`
2. Fill in your `apiKey` in `config.js`
3. Open `index.html` in a browser

## API
- Base URL: `https://time.raccoonsoft.ru/api/v1`
- Auth: `X-Api-Key: <key>` header on every request
- Workspace ID: `3067f7d0-d181-40c6-a9d4-ae3784e1e5b5`
- Users: `GET /workspaces/{wsId}/users` → `[{ id, name, email }]`
- Projects: `GET /workspaces/{wsId}/projects` → `[{ id, name }]`
- Time entries: `GET /workspaces/{wsId}/time-entries?start=&end=&projectId=`
  → `[{ id, description, userId, projectId, timeInterval: { start, end, duration } }]`
  Duration is ISO 8601: "PT45M", "PT1H30M", "PT2H"
  userId filter NOT supported server-side (use client-side filtering)

## Structure
- `index.html` — entire app (HTML + CSS + JS inline)
- `config.js` — API key config (gitignored)
- `config.example.js` — template (committed)
```

- [ ] **Step 6: Commit scaffold**

```bash
git add .gitignore config.example.js CLAUDE.md
git commit -m "chore: scaffold raccoon-tracker-analysis project"
```

---

## Task 2: HTML skeleton + date defaults

**Files:**
- Create: `index.html`

- [ ] **Step 1: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Raccoon Tracker Analysis</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      color: #1a1a1a;
      background: #f7f7f7;
      margin: 0;
      padding: 24px;
    }
    h1 { font-size: 18px; margin: 0 0 20px; }
    #filters {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: flex-end;
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      padding: 16px;
      margin-bottom: 20px;
    }
    .field { display: flex; flex-direction: column; gap: 4px; }
    label { font-size: 12px; color: #666; font-weight: 500; }
    input[type="date"], select {
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 6px 8px;
      font-size: 14px;
      background: #fff;
    }
    button#loadBtn {
      padding: 7px 20px;
      background: #2563eb;
      color: #fff;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
      align-self: flex-end;
    }
    button#loadBtn:disabled { background: #93c5fd; cursor: not-allowed; }
    #summary { font-weight: 600; margin-bottom: 12px; min-height: 20px; }
    #error { color: #dc2626; margin-bottom: 12px; min-height: 20px; }
    #results {
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      overflow: hidden;
    }
    table { width: 100%; border-collapse: collapse; }
    th {
      background: #f3f4f6;
      text-align: left;
      padding: 10px 12px;
      font-size: 12px;
      color: #555;
      border-bottom: 1px solid #e0e0e0;
    }
    th.right, td.right { text-align: right; }
    td { padding: 8px 12px; border-bottom: 1px solid #f0f0f0; }
    tr:last-child td { border-bottom: none; }
    tr.subtotal td { background: #f9fafb; font-weight: 600; }
    tr.grand-total td {
      background: #eff6ff;
      font-weight: 700;
      border-top: 2px solid #bfdbfe;
    }
  </style>
</head>
<body>
  <h1>Raccoon Tracker Analysis</h1>

  <div id="filters">
    <div class="field">
      <label for="dateFrom">From</label>
      <input type="date" id="dateFrom">
    </div>
    <div class="field">
      <label for="dateTo">To</label>
      <input type="date" id="dateTo">
    </div>
    <div class="field">
      <label for="personFilter">Person</label>
      <select id="personFilter">
        <option value="">All</option>
      </select>
    </div>
    <div class="field">
      <label for="projectFilter">Project</label>
      <select id="projectFilter">
        <option value="">All</option>
      </select>
    </div>
    <div class="field">
      <label for="groupBy">Group by</label>
      <select id="groupBy">
        <option value="task">Task</option>
        <option value="project-task">Project → Task</option>
        <option value="person-project-task">Person → Project → Task</option>
      </select>
    </div>
    <button id="loadBtn">Load</button>
  </div>

  <div id="error"></div>
  <div id="summary"></div>
  <div id="results"></div>

  <script src="config.js"></script>
  <script>
    // ── Date defaults ──────────────────────────────────────────────
    (function initDates() {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
      document.getElementById('dateFrom').value = `${y}-${m}-01`;
      document.getElementById('dateTo').value   = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
    })();
  </script>
</body>
</html>
```

- [ ] **Step 2: Open in browser and verify**

Double-click `index.html`. Expected: filters bar renders, date pickers default to first and last day of the current month, all dropdowns show only "All", button is blue. No console errors (ignore "config.js not found" if `config.js` doesn't exist yet — create it first per Task 1).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add HTML skeleton with filters bar and date defaults"
```

---

## Task 3: API client + duration parser

**Files:**
- Modify: `index.html` — add helpers inside `<script>` after `initDates`

- [ ] **Step 1: Add `apiFetch` and `parseDuration` helpers**

Add inside `<script>`, after the `initDates` IIFE:

```js
// ── API client ────────────────────────────────────────────────────
async function apiFetch(path, params = {}) {
  const url = new URL(CONFIG.baseUrl + path);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString(), {
    headers: { 'X-Api-Key': CONFIG.apiKey }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

// ── Duration parser ───────────────────────────────────────────────
// Parses ISO 8601 duration string → decimal hours.
// Handles: "PT45M", "PT1H30M", "PT2H", "PT1H", "PT90M"
function parseDuration(iso) {
  if (!iso) return 0;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const h = parseInt(match[1] || '0', 10);
  const m = parseInt(match[2] || '0', 10);
  const s = parseInt(match[3] || '0', 10);
  return h + m / 60 + s / 3600;
}

function formatHours(hours) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
```

- [ ] **Step 2: Verify in browser console**

Open DevTools → Console:

```js
console.log(parseDuration('PT45M'));    // expected: 0.75
console.log(parseDuration('PT1H30M')); // expected: 1.5
console.log(parseDuration('PT2H'));    // expected: 2
console.log(formatHours(1.5));         // expected: "1h 30m"
console.log(formatHours(2));           // expected: "2h"

apiFetch(`/workspaces/${CONFIG.workspaceId}/users`)
  .then(d => console.log('users sample:', d[0]))
  .catch(console.error);
```

Expected: correct numeric results from `parseDuration`, and a user object `{ id, name, email, status }` logged.

---

## Task 4: Populate dropdowns

**Files:**
- Modify: `index.html` — add `loadDropdowns` function

- [ ] **Step 1: Add `loadDropdowns`**

Add inside `<script>`, after `formatHours`:

```js
// ── Dropdowns ─────────────────────────────────────────────────────
async function loadDropdowns() {
  try {
    const wsId = CONFIG.workspaceId;
    const [users, projects] = await Promise.all([
      apiFetch(`/workspaces/${wsId}/users`),
      apiFetch(`/workspaces/${wsId}/projects`),
    ]);

    const personSel = document.getElementById('personFilter');
    users
      .filter(u => u.status === 'ACTIVE')
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id;
        opt.textContent = u.name;
        personSel.appendChild(opt);
      });

    const projectSel = document.getElementById('projectFilter');
    projects
      .filter(p => !p.archived)
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        projectSel.appendChild(opt);
      });

    // Store lookup maps globally for use in grouping
    window._users = Object.fromEntries(users.map(u => [u.id, u.name]));
    window._projects = Object.fromEntries(projects.map(p => [p.id, p.name]));
  } catch (err) {
    document.getElementById('error').textContent = 'Failed to load filters: ' + err.message;
  }
}

loadDropdowns();
```

- [ ] **Step 2: Open in browser and verify**

Reload `index.html`. Expected: Person dropdown lists active users alphabetically, Project dropdown lists non-archived projects alphabetically. "All" remains at top of each. Open DevTools console and run `console.log(window._users)` — expected: an object mapping user IDs to names.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: populate person and project dropdowns from API"
```

---

## Task 5: Fetch time entries

**Files:**
- Modify: `index.html` — add `fetchEntries` function

- [ ] **Step 1: Add `fetchEntries`**

Add inside `<script>`, after `loadDropdowns`:

```js
// ── Fetch entries ─────────────────────────────────────────────────
async function fetchEntries() {
  const from      = document.getElementById('dateFrom').value;
  const to        = document.getElementById('dateTo').value;
  const personId  = document.getElementById('personFilter').value;
  const projectId = document.getElementById('projectFilter').value;

  // start/end must be ISO 8601 datetimes
  const params = {
    start: from + 'T00:00:00Z',
    end:   to   + 'T23:59:59Z',
  };
  // projectId filter works server-side
  if (projectId) params.projectId = projectId;

  const wsId = CONFIG.workspaceId;
  let entries = await apiFetch(`/workspaces/${wsId}/time-entries`, params);

  // userId filter NOT supported server-side — apply client-side
  if (personId) {
    entries = entries.filter(e => e.userId === personId);
  }

  return entries;
}
```

- [ ] **Step 2: Verify in browser console**

```js
fetchEntries()
  .then(entries => {
    console.log('Total entries:', entries.length);
    console.log('Sample entry:', entries[0]);
  })
  .catch(console.error);
```

Expected: array of entries logged. `entries[0]` should have shape `{ id, description, userId, projectId, timeInterval: { start, end, duration } }`.

---

## Task 6: Grouping logic

**Files:**
- Modify: `index.html` — add `groupEntries` function

- [ ] **Step 1: Add `groupEntries`**

Add inside `<script>`, after `fetchEntries`:

```js
// ── Grouping ──────────────────────────────────────────────────────
// entry accessors — centralised so field names are changed in one place
function entryTask(e)    { return e.description || '(no description)'; }
function entryPerson(e)  { return window._users[e.userId]    || e.userId    || 'Unknown'; }
function entryProject(e) { return window._projects[e.projectId] || e.projectId || '(no project)'; }
function entryHours(e)   { return parseDuration(e.timeInterval && e.timeInterval.duration); }

function makeGroups(entries, labelFn, childGroupFn) {
  const map = new Map();
  for (const entry of entries) {
    const key = labelFn(entry);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(entry);
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, items]) => ({
      label,
      hours: items.reduce((sum, e) => sum + entryHours(e), 0),
      children: childGroupFn ? childGroupFn(items) : null,
    }));
}

function groupEntries(entries, mode) {
  if (mode === 'task') {
    return makeGroups(entries, entryTask, null);
  }
  if (mode === 'project-task') {
    return makeGroups(entries, entryProject,
      items => makeGroups(items, entryTask, null));
  }
  if (mode === 'person-project-task') {
    return makeGroups(entries, entryPerson,
      items => makeGroups(items, entryProject,
        subItems => makeGroups(subItems, entryTask, null)));
  }
  return [];
}
```

- [ ] **Step 2: Verify in browser console**

```js
fetchEntries().then(entries => {
  const g = groupEntries(entries, 'project-task');
  console.log('Groups:', g.length);
  console.log('First group:', g[0].label, formatHours(g[0].hours));
  console.log('Children:', g[0].children);
}).catch(console.error);
```

Expected: array of project groups, each with `label` (project name), `hours` (decimal), `children` (array of task groups). Hours should be sensible (not 0 or 10000).

---

## Task 7: Table renderer + Load button

**Files:**
- Modify: `index.html` — add `renderResults` function and Load button handler

- [ ] **Step 1: Add `renderResults`**

Add inside `<script>`, after `groupEntries`:

```js
// ── Renderer ──────────────────────────────────────────────────────
function renderRows(groups, tbody, depth) {
  for (const group of groups) {
    const tr = document.createElement('tr');
    if (group.children) tr.classList.add('subtotal');

    const labelTd = document.createElement('td');
    labelTd.textContent = group.label;
    labelTd.style.paddingLeft = (12 + depth * 24) + 'px';
    tr.appendChild(labelTd);

    const hoursTd = document.createElement('td');
    hoursTd.className = 'right';
    hoursTd.textContent = formatHours(group.hours);
    tr.appendChild(hoursTd);

    tbody.appendChild(tr);

    if (group.children) {
      renderRows(group.children, tbody, depth + 1);
    }
  }
}

function renderResults(entries, mode) {
  const container = document.getElementById('results');
  const summaryEl = document.getElementById('summary');
  container.innerHTML = '';

  if (entries.length === 0) {
    summaryEl.textContent = '';
    container.textContent = 'No entries found for the selected filters.';
    return;
  }

  const totalHours = entries.reduce((sum, e) => sum + entryHours(e), 0);
  summaryEl.textContent = `Total: ${formatHours(totalHours)} · ${entries.length} entries`;

  const groups = groupEntries(entries, mode);

  const table = document.createElement('table');

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  [['Label', ''], ['Duration', 'right']].forEach(([text, cls]) => {
    const th = document.createElement('th');
    th.textContent = text;
    if (cls) th.className = cls;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  renderRows(groups, tbody, 0);

  // Grand total row
  const totalTr = document.createElement('tr');
  totalTr.classList.add('grand-total');
  const lbl = document.createElement('td');
  lbl.textContent = 'Grand Total';
  totalTr.appendChild(lbl);
  const val = document.createElement('td');
  val.className = 'right';
  val.textContent = formatHours(totalHours);
  totalTr.appendChild(val);
  tbody.appendChild(totalTr);

  table.appendChild(tbody);
  container.appendChild(table);
}
```

- [ ] **Step 2: Add Load button handler**

Add inside `<script>`, after `renderResults`:

```js
// ── Load button ───────────────────────────────────────────────────
document.getElementById('loadBtn').addEventListener('click', async () => {
  const btn     = document.getElementById('loadBtn');
  const errorEl = document.getElementById('error');
  const mode    = document.getElementById('groupBy').value;

  btn.disabled = true;
  btn.textContent = 'Loading…';
  errorEl.textContent = '';

  try {
    const entries = await fetchEntries();
    renderResults(entries, mode);
  } catch (err) {
    document.getElementById('summary').textContent = '';
    document.getElementById('results').innerHTML = '';
    errorEl.textContent = 'Error: ' + err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Load';
  }
});
```

- [ ] **Step 3: End-to-end manual test**

Reload `index.html`. Run through all scenarios:

1. Click `Load` → table appears with current month data, summary shows total hours + entry count
2. Change `Group by` to `Project → Task`, click `Load` → project rows in bold with task rows indented under them
3. Change `Group by` to `Person → Project → Task`, click `Load` → three levels of nesting
4. Pick a specific person, click `Load` → only that person's entries appear in the table
5. Pick a specific project, click `Load` → only that project's entries
6. Set `From`/`To` to a future date range with no data → "No entries found" message
7. Set an invalid API key in `config.js`, click `Load` → "Error: API 401: ..." message appears

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add grouping, table renderer, and Load button"
```

---

## Task 8: Push to GitHub

- [ ] **Step 1: Create GitHub repo and push**

```bash
cd C:/work/sandbox/claude/raccoon-tracker-analysis
gh repo create slonix-raccoon/raccoon-tracker-analysis --public --source=. --remote=origin --push
```

Expected: repo created and all commits pushed. Confirm at `https://github.com/slonix-raccoon/raccoon-tracker-analysis`.
