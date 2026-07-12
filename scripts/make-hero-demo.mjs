// Regenerate assets/hero-demo.webp — an animated demo of the real app for the
// README hero: a synthetic cursor rolls new orbs and sweeps parameters while the
// live WebGL preview reacts. Boots the real app headless, choreographs a scripted
// sequence, captures frames, and muxes them into an animated WebP via ffmpeg
// (libwebp_anim). Run: npm run hero   (requires ffmpeg on PATH)
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets', 'hero-demo.webp');
const FPS = 12;
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

const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

const { server, port } = await serve();
const framesDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hero-frames-'));
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--use-angle=swiftshader-webgl',
    '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--hide-scrollbars'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 720, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1800));

  // Inject a synthetic cursor + a press-pulse ring.
  await page.evaluate(() => {
    const c = document.createElement('div');
    c.id = '__cursor';
    c.style.cssText = 'position:fixed;left:0;top:0;width:22px;height:22px;z-index:99999;pointer-events:none;transition:transform .05s;filter:drop-shadow(0 2px 4px rgba(0,0,0,.6))';
    c.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M4 2l6 16 2.4-6.8L19 8.8z" fill="#fff" stroke="#111" stroke-width="1.2" stroke-linejoin="round"/></svg>';
    document.body.appendChild(c);
    const ring = document.createElement('div');
    ring.id = '__ring';
    ring.style.cssText = 'position:fixed;left:0;top:0;width:34px;height:34px;margin:-17px 0 0 -17px;z-index:99998;pointer-events:none;border:2px solid #ff7f00;border-radius:50%;opacity:0;transform:scale(.4)';
    document.body.appendChild(ring);
    window.__setCursor = (x, y) => { const el = document.getElementById('__cursor'); el.style.left = x + 'px'; el.style.top = y + 'px'; };
    window.__press = (x, y) => {
      const el = document.getElementById('__cursor'); el.style.transform = 'scale(.8)'; setTimeout(() => { el.style.transform = 'scale(1)'; }, 120);
      const r = document.getElementById('__ring'); r.style.left = x + 'px'; r.style.top = y + 'px'; r.style.transition = 'none'; r.style.opacity = '.9'; r.style.transform = 'scale(.4)';
      requestAnimationFrame(() => { r.style.transition = 'all .5s ease-out'; r.style.opacity = '0'; r.style.transform = 'scale(1.6)'; });
    };
    // Center of an element by id.
    window.__center = (id) => { const b = document.getElementById(id).getBoundingClientRect(); return { x: Math.round(b.x + b.width / 2), y: Math.round(b.y + b.height / 2) }; };
  });
  // Start on the base orb, a strong first frame.
  await page.evaluate(() => { const s = document.getElementById('crtPreset'); s.value = 'My default'; s.dispatchEvent(new Event('change')); });
  await new Promise(r => setTimeout(r, 500));

  let n = 0;
  const shot = async () => { await page.screenshot({ path: path.join(framesDir, `f${String(n++).padStart(4, '0')}.png`), type: 'png' }); };
  // Glide the cursor from its current spot to a target over `frames`, shooting each.
  let cur = { x: 600, y: 380 };
  const glide = async (id, frames) => {
    const to = await page.evaluate((i) => window.__center(i), id);
    const from = { ...cur };
    for (let i = 1; i <= frames; i++) {
      const t = ease(i / frames);
      const x = Math.round(from.x + (to.x - from.x) * t), y = Math.round(from.y + (to.y - from.y) * t);
      await page.evaluate((x, y) => window.__setCursor(x, y), x, y);
      await shot();
    }
    cur = to;
  };
  const hold = async (frames) => { for (let i = 0; i < frames; i++) await shot(); };
  const press = async () => { await page.evaluate((x, y) => window.__press(x, y), cur.x, cur.y); };
  // Sweep a slider's value between two fractions while the cursor rests on it.
  const sweep = async (id, from, to, frames) => {
    const el = await page.evaluate((i) => window.__center(i), id);
    await page.evaluate((x, y) => window.__setCursor(x, y), el.x, el.y); cur = el;
    for (let i = 1; i <= frames; i++) {
      const t = ease(i / frames), v = from + (to - from) * t;
      await page.evaluate((cid, frac) => {
        const s = document.getElementById(cid);
        const min = parseFloat(s.min), max = parseFloat(s.max);
        s.value = String(min + (max - min) * frac); s.dispatchEvent(new Event('input'));
      }, id, v);
      await shot();
    }
  };

  // ---- Choreography (~13s @ 12fps) ----
  await hold(8);                                   // settle on first orb
  await glide('crtRandomBtn', 14); await press();  // → Roll
  await page.evaluate(() => document.getElementById('crtRandomBtn').click());
  await hold(14);
  await press();                                   // Roll again
  await page.evaluate(() => document.getElementById('crtRandomBtn').click());
  await hold(14);
  await sweep('crt-radius', 0.62, 0.34, 16);       // shrink the ring
  await sweep('crt-radius', 0.34, 0.5, 10);
  await sweep('crt-glow', 0.2, 0.7, 14);           // bloom
  await sweep('crt-hue', 0.08, 0.62, 18);          // sweep the color wheel
  await press();                                   // one more roll to land
  await page.evaluate(() => document.getElementById('crtRandomBtn').click());
  await hold(18);

  console.log(`captured ${n} frames @ ${FPS}fps (${(n / FPS).toFixed(1)}s)`);
  // Mux to animated WebP. quality 72 keeps the console crisp under ~a few MB.
  execFileSync('ffmpeg', ['-y', '-framerate', String(FPS), '-i', path.join(framesDir, 'f%04d.png'),
    '-loop', '0', '-c:v', 'libwebp_anim', '-lossless', '0', '-q:v', '70', '-compression_level', '6',
    '-vf', 'scale=1000:-1:flags=lanczos', OUT], { stdio: 'ignore' });
  console.log(`assets/hero-demo.webp written: ${Math.round(fs.statSync(OUT).size / 1024)} KB`);
} finally {
  await browser.close();
  server.close();
  fs.rmSync(framesDir, { recursive: true, force: true });
}
