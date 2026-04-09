#!/usr/bin/env node
// Minimal dev server: serves static files + proxies /api/v1/* to the real API.
// No npm install needed — uses only Node.js built-ins.
// Usage: node server.js
const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');

const PORT     = 3000;
const API_HOST = 'time.raccoonsoft.ru';

// Read API key from config.js
const configSrc  = fs.readFileSync(path.join(__dirname, 'config.js'), 'utf8');
const keyMatch   = configSrc.match(/apiKey:\s*['"`]([^'"`\r\n]+)['"`]/);
const API_KEY    = keyMatch ? keyMatch[1] : '';
if (!API_KEY) { console.error('ERROR: could not read apiKey from config.js'); process.exit(1); }

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
};

http.createServer((req, res) => {
  // ── API proxy ──────────────────────────────────────────────────
  if (req.url.startsWith('/api/v1')) {
    const options = {
      hostname: API_HOST,
      port:     443,
      path:     req.url,          // e.g. /api/v1/workspaces/.../users
      method:   req.method,
      headers:  { 'X-Api-Key': API_KEY, 'Accept': 'application/json' },
    };
    const proxy = https.request(options, (apiRes) => {
      res.writeHead(apiRes.statusCode, {
        'Content-Type': apiRes.headers['content-type'] || 'application/json',
      });
      apiRes.pipe(res);
    });
    proxy.on('error', (err) => { res.writeHead(502); res.end(JSON.stringify({ error: err.message })); });
    req.pipe(proxy);
    return;
  }

  // ── Static files ───────────────────────────────────────────────
  const relPath  = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const filePath = path.join(__dirname, relPath);
  const ext      = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });

}).listen(PORT, () => {
  console.log(`Raccoon Tracker Analysis → http://localhost:${PORT}`);
});
