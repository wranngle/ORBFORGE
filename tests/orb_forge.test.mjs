// Orb Forge end-to-end test.
// Central product promise: render a configurable WebGL orb and export it as a
// valid *animated* WebP. This test exercises that promise in a real browser
// (headless Chrome + SwiftShader), plus the load-time invariants the UI relies
// on. It is intentionally outcome-based — it fails when the product breaks, not
// when the code is refactored.

import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json' };

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

// Walk a RIFF/WEBP byte buffer; assert it is a well-formed *animated* WebP.
function validateAnimatedWebP(buf) {
  if (buf.length < 20) throw new Error(`file too small (${buf.length} bytes)`);
  if (buf.toString('ascii', 0, 4) !== 'RIFF') throw new Error('missing RIFF header');
  if (buf.toString('ascii', 8, 12) !== 'WEBP') throw new Error('missing WEBP fourcc');
  const seen = {}; let anmf = 0; let p = 12; let vp8xFlags = -1;
  while (p + 8 <= buf.length) {
    const fourcc = buf.toString('ascii', p, p + 4);
    const size = buf.readUInt32LE(p + 4);
    seen[fourcc] = (seen[fourcc] || 0) + 1;
    if (fourcc === 'ANMF') anmf++;
    if (fourcc === 'VP8X') vp8xFlags = buf[p + 8];
    p += 8 + size + (size & 1);
  }
  if (!seen.VP8X) throw new Error('missing VP8X chunk');
  if ((vp8xFlags & 0x02) === 0) throw new Error('VP8X animation flag not set');
  if (!seen.ANIM) throw new Error('missing ANIM chunk');
  if (anmf < 2) throw new Error(`expected >= 2 animation frames, found ${anmf}`);
  return { anmf, hasAlpha: !!(vp8xFlags & 0x10), bytes: buf.length };
}

const checks = [];
function check(name, ok, detail = '') { checks.push({ name, ok: !!ok, detail }); if (!ok) console.error(`  ✗ ${name}${detail ? ' — ' + detail : ''}`); else console.log(`  ✓ ${name}${detail ? ' — ' + detail : ''}`); }

async function main() {
  const { server, port } = await serve();
  const base = `http://127.0.0.1:${port}/`;
  const downloadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orb-dl-'));

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox', '--disable-setuid-sandbox',
      '--use-gl=angle', '--use-angle=swiftshader-webgl',
      '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl',
    ],
  });

  const errors = [];
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1480, height: 1000 });
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
    page.on('requestfailed', r => errors.push('REQFAIL: ' + r.url()));

    const client = await page.createCDPSession();
    await client.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloadDir, eventsEnabled: true });

    // 'domcontentloaded' (not networkidle): the deferred engine runs before
    // DOMContentLoaded and the render loop needs no network. Waiting on network
    // idle couples the test to external Google Fonts, which is flaky in CI.
    await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000)); // let the render loop spin

    const load = await page.evaluate(() => {
      const cv = document.getElementById('crtCanvas');
      const gl = cv && (cv.getContext('webgl') || cv.getContext('experimental-webgl'));
      let lit = 0;
      if (gl) {
        const px = new Uint8Array(cv.width * cv.height * 4);
        gl.readPixels(0, 0, cv.width, cv.height, gl.RGBA, gl.UNSIGNED_BYTE, px);
        for (let i = 0; i < px.length; i += 4) if (px[i] + px[i + 1] + px[i + 2] > 12) lit++;
      }
      const grid = document.querySelector('.grid');
      const presetsEl = document.querySelector('.presets');
      // DOCUMENT_POSITION_FOLLOWING (4) => presets comes after grid in DOM order.
      const presetsAfterGrid = !!(grid && presetsEl &&
        (grid.compareDocumentPosition(presetsEl) & Node.DOCUMENT_POSITION_FOLLOWING));
      const glyphBg = getComputedStyle(document.querySelector('.brand-glyph')).backgroundImage;
      const opt = document.querySelector('#crtWebpPanel select option');
      return {
        glPresent: !!gl,
        lit,
        controls: document.querySelectorAll('#crtControls .row').length,
        presets: document.querySelectorAll('#crtPresetChips .preset-chip').length,
        logLines: document.querySelectorAll('#logConsole .tline').length,
        presetsAfterGrid,
        glyphUsesOrb: /orb\.webp/.test(glyphBg),
        optionBg: opt ? getComputedStyle(opt).backgroundColor : null,
      };
    });

    check('WebGL context initializes', load.glPresent);
    check('orb renders non-empty pixels', load.lit > 1000, `${load.lit} lit px`);
    check('all 25 parameter controls present', load.controls === 25, `${load.controls}`);
    check('built-in presets render', load.presets >= 7, `${load.presets}`);
    check('event terminal logs startup', load.logLines >= 2, `${load.logLines} lines`);
    // F001: presets bar relocated below the workspace.
    check('presets bar is at the bottom (after grid)', load.presetsAfterGrid);
    // F002: brand glyph uses the forged orb webp; the asset must be served.
    check('brand glyph uses orb.webp', load.glyphUsesOrb);
    const orbOk = await page.evaluate(async () => (await fetch('/orb.webp')).ok);
    check('orb.webp asset is served', orbOk);
    // F004: option popups must not be near-white-on-white (dark background forced).
    const obg = (load.optionBg || '').match(/\d+/g)?.map(Number) || [255, 255, 255];
    check('dropdown options have a dark background', obg[0] + obg[1] + obg[2] < 200, load.optionBg || 'n/a');

    // F005: clicking the preview toggles pause/resume.
    const liveText = async () => page.evaluate(() => document.querySelector('#hudLive .v').textContent);
    await page.click('.stage');
    const paused = await liveText();
    await page.click('.stage');
    const resumed = await liveText();
    check('clicking preview pauses then resumes', paused === 'PAUSED' && resumed === 'LIVE', `${paused} -> ${resumed}`);

    // Drive the central promise: export a small animated WebP.
    await page.click('#crtWebpBtn'); // open export panel
    await page.evaluate(() => {
      const set = (id, v, ev) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event(ev)); };
      const auto = document.getElementById('crtAuto'); auto.checked = false; auto.dispatchEvent(new Event('change'));
      set('crtDur', '1.5', 'input');
      set('crtRes', '192', 'change');
      set('crtFps', '12', 'change');
      set('crtTarget', '0', 'change'); // manual — skip calibration for a deterministic run
    });
    await page.evaluate(() => document.getElementById('crtRenderBtn').click());

    // Wait for the .webp download to land.
    const exported = await new Promise((resolve, reject) => {
      const deadline = Date.now() + 90000;
      const tick = () => {
        const f = fs.readdirSync(downloadDir).find(n => n.endsWith('.webp'));
        if (f) {
          const fp = path.join(downloadDir, f);
          if (fs.statSync(fp).size > 0) return resolve(fp);
        }
        if (Date.now() > deadline) return reject(new Error('export timed out (no .webp produced)'));
        setTimeout(tick, 400);
      };
      tick();
    });

    const webp = validateAnimatedWebP(fs.readFileSync(exported));
    check('exports a valid animated WebP', true, `${webp.anmf} frames, ${webp.bytes} bytes, alpha=${webp.hasAlpha}`);
    check('exported WebP has transparency', webp.hasAlpha);

    // F003: manual-download fallback link appears after a successful export.
    const manual = await page.evaluate(() => {
      const a = document.getElementById('crtManualDl');
      return { visible: a && !a.hidden, href: a ? a.getAttribute('href') : '' };
    });
    check('manual-download fallback link appears', manual.visible && /^blob:/.test(manual.href), manual.href.slice(0, 12));

    check('no console / page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } finally {
    await browser.close();
    server.close();
    fs.rmSync(downloadDir, { recursive: true, force: true });
  }

  const failed = checks.filter(c => !c.ok);
  console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`);
  if (failed.length) { console.error('E2E FAILED'); process.exit(1); }
  console.log('E2E PASSED');
}

main().catch(e => { console.error(e); process.exit(1); });
