/* ============================================================
   TRAVERA — Static inquiry API server  (standalone CJS)
   Accepts POST /api/inquiry, saves to inquiries.json,
   opens mail client with prefilled message.
   Run: node server.cjs   (from this folder)
   ============================================================ */

'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, 'inquiries.json');

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

function load() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return []; }
}
function save(list) { fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2)); }

function sendEmail(data) {
  const vars = [
    'name=' + encodeURIComponent(data.name),
    'email=' + encodeURIComponent(data.email),
    'country=' + encodeURIComponent(data.country || ''),
    'destination=' + encodeURIComponent(data.destination || ''),
    'travelDates=' + encodeURIComponent(data.travelDates || ''),
    'travellers=' + encodeURIComponent(data.travellers || ''),
    'journeyType=' + encodeURIComponent(data.journeyType || ''),
    'budget=' + encodeURIComponent(data.budget || ''),
    'message=' + encodeURIComponent(data.message || ''),
  ].join('&');
  const subject = encodeURIComponent('New Travera Journey Inquiry — ' + data.name);
  const body = encodeURIComponent(
    'Name: ' + data.name + '\n' +
    'Email: ' + data.email + '\n' +
    'Country: ' + (data.country || '—') + '\n' +
    'Destination: ' + (data.destination || '—') + '\n' +
    'Travel Dates: ' + (data.travelDates || '—') + '\n' +
    'Travellers: ' + (data.travellers || '—') + '\n' +
    'Journey Type: ' + (data.journeyType || '—') + '\n' +
    'Budget: ' + (data.budget || '—') + '\n' +
    'Message:\n' + (data.message || '—')
  );
  try {
    spawn('cmd', ['/c', 'start', '', 'mailto:ranuka.kariyawasam@gmail.com?' + vars + '&subject=' + subject + '&body=' + body], { detached: true }).unref();
  } catch {}
}

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.method === 'POST' && req.url === '/api/inquiry') {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (data.company && data.company.trim()) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: true, stored: false, emailed: false }));
        }
        if (!data.name || !data.email) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: false, error: 'Name and email required' }));
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: false, error: 'Invalid email' }));
        }
        const list = load();
        list.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2,6), ...data, submittedAt: new Date().toISOString() });
        save(list);
        sendEmail(data);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, stored: true, emailed: true }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  if (req.method === 'GET') {
    let file = path.join(ROOT, req.url === '/' ? '/index.html' : req.url);
    const ext = path.extname(file).toLowerCase();
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); res.end('Not found'); return; }
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(data);
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('Travera server → http://127.0.0.1:' + PORT);
  console.log('Inquiries → ' + DATA_FILE);
});
