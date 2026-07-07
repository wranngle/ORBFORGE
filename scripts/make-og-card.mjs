// Regenerate og.png (1200x630 social card): boot the real app in headless
// Chrome (WebGL via SwiftShader), apply the brand preset, screenshot the orb,
// and compose it onto a design-system card. Run: npm run og
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'og.png');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.webp': 'image/webp' };

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
  await new Promise(r => setTimeout(r, 400));
  // Brand look: the 'My default' preset matches the orb.webp brand asset.
  await page.evaluate(() => {
    const sel = document.getElementById('crtPreset');
    sel.value = 'My default';
    sel.dispatchEvent(new Event('change'));
  });
  await new Promise(r => setTimeout(r, 2600)); // let the comet travel into a good spot

  const orbDataUrl = await page.evaluate(() => document.getElementById('crtCanvas').toDataURL('image/png'));

  const compose = await browser.newPage();
  await compose.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  await compose.setContent(`<!doctype html><html><head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:1200px;height:630px;overflow:hidden;position:relative;
      font-family:'Outfit',sans-serif;color:#ece9f3;
      background:
        radial-gradient(900px 600px at 12% -12%, rgba(255,95,0,.10), transparent 60%),
        radial-gradient(800px 700px at 98% 8%, rgba(207,60,105,.09), transparent 60%),
        radial-gradient(1200px 800px at 50% 115%, rgba(45,9,20,.7), transparent 60%),
        #0a0910;}
    .noise{position:absolute;inset:0;opacity:.04;mix-blend-mode:overlay;
      background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");}
    .corner{position:absolute;width:26px;height:26px;border:2px solid rgba(255,158,51,.45)}
    .tl{top:26px;left:26px;border-right:0;border-bottom:0;border-top-left-radius:8px}
    .br{bottom:26px;right:26px;border-left:0;border-top:0;border-bottom-right-radius:8px}
    .left{position:absolute;left:84px;top:0;height:100%;width:560px;display:flex;flex-direction:column;justify-content:center;gap:22px}
    .title{font-weight:800;font-size:88px;letter-spacing:-.03em;line-height:1}
    .title .accent{color:#ff5f00}
    .sub{font-family:'JetBrains Mono',monospace;font-size:19px;letter-spacing:.24em;color:#ff9e33;text-transform:uppercase;font-weight:700}
    .desc{font-family:'JetBrains Mono',monospace;font-size:17px;line-height:1.75;color:#9690ab;max-width:520px}
    .desc b{color:#ece9f3;font-weight:500}
    .domain{position:absolute;left:84px;bottom:52px;font-family:'JetBrains Mono',monospace;font-size:16px;letter-spacing:.08em;color:#5a5670}
    .domain span{color:#ff9e33}
    .orbwrap{position:absolute;right:60px;top:50%;transform:translateY(-50%);width:512px;height:512px;
      padding:1px;border-radius:18px 4px 18px 4px;
      background:linear-gradient(135deg, rgba(255,95,0,.6) 0%, rgba(207,60,105,.5) 50%, rgba(74,30,90,.5) 100%);
      box-shadow:0 18px 48px rgba(0,0,0,.5), 0 0 60px rgba(255,95,0,.12);}
    .orbstage{position:relative;width:100%;height:100%;border-radius:17px 4px 17px 4px;overflow:hidden;
      background:radial-gradient(circle at 50% 50%, #0e0a16 0%, #06050a 70%);}
    .orbstage img{position:absolute;inset:0;width:100%;height:100%}
    .orbstage .ct,.orbstage .cb{position:absolute;width:14px;height:14px;border:1px solid rgba(255,158,51,.4)}
    .orbstage .ct{top:9px;left:9px;border-right:0;border-bottom:0;border-top-left-radius:4px}
    .orbstage .cb{bottom:9px;right:9px;border-left:0;border-top:0;border-bottom-right-radius:4px}
  </style></head><body>
    <div class="noise"></div>
    <div class="corner tl"></div><div class="corner br"></div>
    <div class="orbwrap"><div class="orbstage"><img src="${orbDataUrl}"><span class="ct"></span><span class="cb"></span></div></div>
    <div class="left">
      <div>
        <div class="title">ORB<span class="accent">.</span>FORGE</div>
        <div style="height:14px"></div>
        <div class="sub">Agent Avatar Synthesizer</div>
      </div>
      <div class="desc">Forge a burning comet-ring orb in WebGL — <b>25 live parameters</b>, seamless-loop solving, and transparent <b>animated WebP</b> export.</div>
    </div>
    <div class="domain"><span>&gt;_</span>&nbsp; orb-forge.wranngle.com</div>
  </body></html>`, { waitUntil: 'networkidle0' });
  await compose.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 300));
  await compose.screenshot({ path: OUT, type: 'png' });

  // Quantize to a dithered 256-color palette: visually identical on this
  // near-black card, less than half the bytes. Best effort — PIL optional.
  const { execFileSync } = await import('node:child_process');
  try {
    execFileSync('python3', ['-c', `
from PIL import Image
im = Image.open(${JSON.stringify(OUT)}).convert('RGB')
im.quantize(colors=256, method=Image.MEDIANCUT, dither=Image.FLOYDSTEINBERG).save(${JSON.stringify(OUT)}, optimize=True)
`]);
  } catch { console.warn('PIL unavailable — keeping unquantized PNG'); }
  console.log(`og.png written: 1200x630, ${Math.round(fs.statSync(OUT).size / 1024)} KB`);
} finally {
  await browser.close();
  server.close();
}
