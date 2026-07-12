// Regenerate assets/orb.webp — the brand orb shown as the 32px glyph, the 220px
// WebGL fallback, and README bullet/heading glyphs. Boots the real app headless
// (WebGL via SwiftShader), applies the 'My default' preset, then drives the
// app's own export pipeline to render a transparent animated WebP at brand
// resolution. Run: npm run orb
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets', 'orb.webp');
// The brand orb ships on every page load (32px glyph, 220px WebGL fallback), so
// it must stay small. Let the app's target-size tuner keep the sharpest
// resolution that fits under the cap — a thin bright ring on transparency
// compresses hard without visible loss.
const TARGET = 1048576; // 1 MB cap — tuner keeps the sharpest res that fits
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png' };

function serve() {
  const server = http.createServer((req, res) => {
    let rel = decodeURIComponent(req.url.split('?')[0]);
    if (rel === '/' || rel === '') rel = '/index.html';
    const fp = path.join(ROOT, path.normalize(rel));
    if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.statusCode = 404; return res.end('not found'); }
    res.setHeader('Content-Type', MIME[path.extname(fp)] || 'application/octet-stream');
    fs.createReadStream(fp).pipe(res);
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r({ server, port: server.address().port })));
}

const { server, port } = await serve();
const dlDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orb-brand-'));
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--use-angle=swiftshader-webgl',
    '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1480, height: 1000, deviceScaleFactor: 1 });
  const cdp = await page.createCDPSession();
  await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: dlDir, eventsEnabled: true });
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1800));

  // Brand look: 'My default' preset (matches the social card + wordmark).
  await page.evaluate(() => { const s = document.getElementById('crtPreset'); s.value = 'My default'; s.dispatchEvent(new Event('change')); });
  await new Promise(r => setTimeout(r, 400));

  // Drive the export dialog: WebP, brand resolution, auto (seamless) duration.
  await page.evaluate(() => document.getElementById('crtWebpBtn').click());
  await new Promise(r => setTimeout(r, 200));
  await page.evaluate((target) => {
    const set = (id, v, ev) => { const el = document.getElementById(id); el.value = String(v); el.dispatchEvent(new Event(ev)); };
    document.getElementById('crtAuto').checked = true; document.getElementById('crtAuto').dispatchEvent(new Event('change'));
    set('crtFormat', 'webp', 'change');
    set('crtTarget', String(target), 'change'); // tuner picks the sharpest res/fps/quality that fits
  }, TARGET);
  await new Promise(r => setTimeout(r, 200));
  await page.evaluate(() => document.getElementById('crtRenderBtn').click());

  // Wait for the .webp to land in the download dir.
  let file = null;
  for (let i = 0; i < 300 && !file; i++) {
    const f = fs.readdirSync(dlDir).find(n => n.endsWith('.webp') && !n.endsWith('.crdownload'));
    if (f) file = path.join(dlDir, f);
    else await new Promise(r => setTimeout(r, 200));
  }
  if (!file) throw new Error('export never produced a .webp');
  fs.copyFileSync(file, OUT);

  // Report dimensions + frame count from the VP8X/ANMF chunks.
  const b = fs.readFileSync(OUT);
  let w = 0, h = 0, frames = 0;
  for (let i = 12; i < b.length - 8;) {
    const tag = b.toString('ascii', i, i + 4), sz = b.readUInt32LE(i + 4);
    if (tag === 'VP8X') { w = 1 + (b[i + 12] | b[i + 13] << 8 | b[i + 14] << 16); h = 1 + (b[i + 15] | b[i + 16] << 8 | b[i + 17] << 16); }
    if (tag === 'ANMF') frames++;
    i += 8 + sz + (sz % 2);
  }
  console.log(`assets/orb.webp written: ${w}x${h}, ${frames} frames, ${Math.round(b.length / 1024)} KB`);
} finally {
  await browser.close();
  server.close();
  fs.rmSync(dlDir, { recursive: true, force: true });
}
