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
