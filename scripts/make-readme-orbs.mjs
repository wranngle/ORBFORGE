// Generate assets/orbs/<slug>.webp — small transparent animated orbs, one per
// README section header, each a distinct built-in preset rendered live. Captures
// canvas frames and muxes a tiny looping webp via ffmpeg. Run: npm run readme-orbs
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTDIR = path.join(ROOT, 'assets', 'orbs');
const SIZE = 72;   // rendered size; displayed ~26px in the README
const FRAMES = 24; // ~2s loop at 12fps
const FPS = 12;
// section slug → distinct preset (spans the archetypes so each header reads unique)
const MAP = [
  ['features', 'Ember comet'],
  ['presets', 'Plasma ring'],
  ['grab', 'Glass moon'],
  ['start', 'Solar flare'],
  ['shortcuts', 'Dot matrix'],
  ['where', 'Ghost trail'],
  ['stars', 'Supernova'],
];
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

fs.mkdirSync(OUTDIR, { recursive: true });
const { server, port } = await serve();
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--use-angle=swiftshader-webgl',
    '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 900, height: 900, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1600));
  // Shrink the stage so the canvas backing store is small (tiny frames, fast).
  await page.evaluate(() => { const s = document.querySelector('.stage-col'); if (s) { s.style.position = 'fixed'; s.style.left = '0'; s.style.top = '0'; s.style.width = '180px'; s.style.zIndex = '99999'; } });

  for (const [slug, preset] of MAP) {
    await page.evaluate((p) => { const s = document.getElementById('crtPreset'); s.value = p; s.dispatchEvent(new Event('change')); }, preset);
    await new Promise(r => setTimeout(r, 500));
    const fdir = fs.mkdtempSync(path.join(os.tmpdir(), `orb-${slug}-`));
    for (let i = 0; i < FRAMES; i++) {
      // Scrub across a full loop so the tiny webp loops seamlessly.
      await page.evaluate((frac) => { const s = document.getElementById('crtScrub'); s.value = String(frac); s.dispatchEvent(new Event('input')); }, i / FRAMES);
      await new Promise(r => setTimeout(r, 40));
      const dataUrl = await page.evaluate((sz) => {
        const cv = document.getElementById('crtCanvas');
        const o = document.createElement('canvas'); o.width = o.height = sz;
        o.getContext('2d').drawImage(cv, 0, 0, sz, sz);
        return o.toDataURL('image/png');
      }, SIZE);
      fs.writeFileSync(path.join(fdir, `f${String(i).padStart(3, '0')}.png`), Buffer.from(dataUrl.split(',')[1], 'base64'));
    }
    const out = path.join(OUTDIR, `${slug}.webp`);
    execFileSync('ffmpeg', ['-y', '-framerate', String(FPS), '-i', path.join(fdir, 'f%03d.png'),
      '-loop', '0', '-c:v', 'libwebp_anim', '-lossless', '0', '-q:v', '60', '-compression_level', '6', out], { stdio: 'ignore' });
    fs.rmSync(fdir, { recursive: true, force: true });
    console.log(`${slug}.webp (${preset}): ${Math.round(fs.statSync(out).size / 1024)} KB`);
  }
} finally {
  await browser.close();
  server.close();
}
