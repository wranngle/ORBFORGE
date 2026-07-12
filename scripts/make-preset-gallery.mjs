// Regenerate assets/brand/preset-gallery.png — a 4x3 grid of the 12 built-in
// presets rendered LIVE by the current engine (so the grid reflects the shader
// as it stands today, not a stale export). Boots the real app headless, applies
// each preset, screenshots the orb, and composes a design-system card.
// Run: npm run gallery
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets', 'brand', 'preset-gallery.png');
const PRESETS = ['My default', 'Ember comet', 'Solar flare', 'Plasma ring', 'Ghost trail', 'Whisper thread',
  'Supernova', 'Glass moon', 'Plasma core', 'Dot matrix', 'Woven aura', 'Obsidian sculpt'];
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
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--use-angle=swiftshader-webgl',
    '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1480, height: 1000, deviceScaleFactor: 2 });
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1600));

  const tiles = {};
  for (const name of PRESETS) {
    await page.evaluate((n) => { const s = document.getElementById('crtPreset'); s.value = n; s.dispatchEvent(new Event('change')); }, name);
    // Freeze at a representative phase so the tile is deterministic and framed
    // where the motion reads best (past the seam, comet mid-arc).
    await page.evaluate(() => { const s = document.getElementById('crtScrub'); if (s) { s.value = '0.35'; s.dispatchEvent(new Event('input')); } });
    await new Promise(r => setTimeout(r, 700));
    tiles[name] = await page.evaluate(() => document.getElementById('crtCanvas').toDataURL('image/png'));
  }

  const cells = PRESETS.map(n => `
    <figure class="tile">
      <div class="stage"><img src="${tiles[n]}"><span class="ct"></span><span class="cb"></span></div>
      <figcaption>${n}</figcaption>
    </figure>`).join('');

  const compose = await browser.newPage();
  await compose.setViewport({ width: 1240, height: 1000, deviceScaleFactor: 2 });
  await compose.setContent(`<!doctype html><html><head>
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:1240px;padding:34px 34px 40px;font-family:'Outfit',sans-serif;color:#ece9f3;
      background:radial-gradient(1000px 700px at 15% -10%, rgba(255,95,0,.08), transparent 60%),
                 radial-gradient(900px 800px at 100% 110%, rgba(207,60,105,.07), transparent 60%), #0a0910;}
    .head{display:flex;align-items:center;gap:12px;margin-bottom:26px}
    .glyph{width:34px;height:34px;border-radius:50%;background:#1a0808 center/cover no-repeat;
      box-shadow:0 0 0 1px rgba(255,158,51,.5), 0 0 18px rgba(255,95,0,.45)}
    .title{font-weight:800;font-size:26px;letter-spacing:-.01em}
    .title .a{color:#ff5f00}
    .tag{margin-left:auto;font-family:'JetBrains Mono',monospace;font-size:13px;letter-spacing:.06em;color:#9690ab;text-transform:uppercase}
    .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
    .tile{border:1px solid #272534;border-radius:12px;background:#12111a;padding:8px;overflow:hidden}
    .stage{position:relative;aspect-ratio:1/1;border-radius:8px;overflow:hidden;
      background:radial-gradient(circle at 50% 50%, #0e0a16 0%, #06050a 70%)}
    .stage img{position:absolute;inset:0;width:100%;height:100%}
    .ct,.cb{position:absolute;width:12px;height:12px;border:1px solid rgba(255,158,51,.35)}
    .ct{top:7px;left:7px;border-right:0;border-bottom:0;border-top-left-radius:4px}
    .cb{bottom:7px;right:7px;border-left:0;border-top:0;border-bottom-right-radius:4px}
    figcaption{font-family:'JetBrains Mono',monospace;font-size:12px;color:#ece9f3;padding:9px 3px 3px;letter-spacing:.02em}
  </style></head><body>
    <div class="head">
      <div class="glyph" style="background-image:url('/assets/orb.webp')"></div>
      <div class="title">ORB<span class="a">FORGE</span></div>
      <div class="tag">12 built-in presets · rendered live</div>
    </div>
    <div class="grid">${cells}</div>
  </body></html>`, { waitUntil: 'networkidle0' });
  await compose.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 300));
  const body = await compose.$('body');
  await body.screenshot({ path: OUT, type: 'png' });

  const { execFileSync } = await import('node:child_process');
  try {
    execFileSync('python3', ['-c', `
from PIL import Image
im = Image.open(${JSON.stringify(OUT)}).convert('RGB')
im.quantize(colors=256, method=Image.MEDIANCUT, dither=Image.FLOYDSTEINBERG).save(${JSON.stringify(OUT)}, optimize=True)
`]);
  } catch { console.warn('PIL unavailable — keeping unquantized PNG'); }
  const dim = await compose.evaluate(() => ({ w: document.body.scrollWidth, h: document.body.scrollHeight }));
  console.log(`assets/brand/preset-gallery.png written: ${dim.w}x${dim.h}, ${Math.round(fs.statSync(OUT).size / 1024)} KB`);
} finally {
  await browser.close();
  server.close();
}
