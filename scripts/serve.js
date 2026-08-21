#!/usr/bin/env node
/* Zero-dependency static server for e2e tests.
 *
 * Serves the Jekyll _site/ output the way GitHub Pages does, so tests
 * exercise real deployment semantics:
 *   - /about           -> _site/about.html
 *   - /post-slug       -> _site/post-slug.html
 *   - /                 -> _site/index.html
 *   - unknown route    -> _site/404.html with HTTP 404 status
 *
 * Usage: node scripts/serve.js [port] [site-dir]   (defaults: 4000, _site)
 */
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', process.argv[3] || DEFAULT_SITE_DIR);
const DEFAULT_PORT = 4000;
const DEFAULT_SITE_DIR = '_site';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.pdf': 'application/pdf',
  '.gz': 'application/gzip',
  '.webmanifest': 'application/manifest+json',
};

function resolveFile(urlPath) {
  // Strip query string / hash, decode, and guard against traversal.
  const clean = decodeURIComponent(urlPath.split(/[?#]/)[0]);
  const rel = path.normalize(clean).replace(/^([/\\])+/, '');
  const base = path.resolve(ROOT, rel);
  if (!base.startsWith(ROOT + path.sep) && base !== ROOT) {
    return null;
  }

  const candidates = [];
  if (path.extname(base) === '') {
    // No extension: try as directory index or as an .html page (Pages-style).
    candidates.push(path.join(base, 'index.html'));
    candidates.push(`${base}.html`);
    candidates.push(`${base}/index.html`);
  }
  candidates.push(base);

  for (const candidate of candidates) {
    try {
      if (fs.statSync(candidate).isFile()) {
        return candidate;
      }
    } catch {
      // Keep trying the remaining candidates.
    }
  }
  return null;
}

function contentType(filePath) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function send(res, status, filePath) {
  const body = fs.readFileSync(filePath);
  res.writeHead(status, {
    'Content-Type': contentType(filePath),
    'Content-Length': body.length,
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
    return;
  }

  const file = resolveFile(req.url || '/');
  if (file) {
    send(res, 200, file);
    return;
  }

  // GitHub Pages behavior: unknown routes render the site's 404.html with 404.
  const notFound = path.join(ROOT, '404.html');
  if (fs.existsSync(notFound)) {
    send(res, 404, notFound);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

const port = Number(process.argv[2] || process.env.PORT || DEFAULT_PORT);
server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`Serving ${ROOT} at http://127.0.0.1:${port}\n`);
});
