// Orb Forge end-to-end test.
// Central product promise: render a configurable WebGL orb and export it as a
// valid *animated* WebP (or GIF). This test exercises that promise in a real
// browser (headless Chrome + SwiftShader), plus the load-time invariants the
// UI relies on. It is intentionally outcome-based — it fails when the product
// breaks, not when the code is refactored.

import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.txt': 'text/plain; charset=utf-8' };

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

// Walk a GIF89a byte buffer; assert it is a well-formed looping animated GIF.
function validateAnimatedGIF(buf) {
  if (buf.toString('ascii', 0, 6) !== 'GIF89a') throw new Error('missing GIF89a header');
  const width = buf.readUInt16LE(6), height = buf.readUInt16LE(8);
  const packed = buf[10];
  let p = 13;
  if (packed & 0x80) p += (2 << (packed & 7)) * 3; // global color table
  let images = 0, netscape = false, sawTrailer = false;
  while (p < buf.length) {
    const b = buf[p];
    if (b === 0x3B) { sawTrailer = true; break; }
    if (b === 0x21) { // extension block
      const label = buf[p + 1];
      p += 2;
      if (label === 0xFF && buf.toString('ascii', p + 1, p + 9) === 'NETSCAPE') netscape = true;
      while (p < buf.length) { const sz = buf[p]; p += 1 + sz; if (sz === 0) break; }
    } else if (b === 0x2C) { // image descriptor
      images++;
      const localPacked = buf[p + 9];
      p += 10;
      if (localPacked & 0x80) p += (2 << (localPacked & 7)) * 3;
      p += 1; // LZW min code size
      while (p < buf.length) { const sz = buf[p]; p += 1 + sz; if (sz === 0) break; }
    } else {
      throw new Error(`unknown GIF block 0x${b.toString(16)} at offset ${p}`);
    }
  }
  if (!sawTrailer) throw new Error('missing GIF trailer');
  if (!netscape) throw new Error('missing NETSCAPE loop extension');
  if (images < 2) throw new Error(`expected >= 2 GIF frames, found ${images}`);
  return { images, width, height, bytes: buf.length };
}

const checks = [];
function check(name, ok, detail = '') { checks.push({ name, ok: !!ok, detail }); if (!ok) console.error(`  ✗ ${name}${detail ? ' — ' + detail : ''}`); else console.log(`  ✓ ${name}${detail ? ' — ' + detail : ''}`); }

// Wait for a download with the given extension to land and stabilize.
function awaitDownload(dir, ext, timeoutMs = 90000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    let lastSize = -1;
    const tick = () => {
      const f = fs.readdirSync(dir).find(n => n.endsWith(ext));
      if (f) {
        const fp = path.join(dir, f);
        const size = fs.statSync(fp).size;
        // require a stable size across two polls so a mid-write file
        // is never validated as truncated
        if (size > 0 && size === lastSize) return resolve(fp);
        lastSize = size;
      }
      if (Date.now() > deadline) return reject(new Error(`export timed out (no ${ext} produced)`));
      setTimeout(tick, 400);
    };
    tick();
  });
}

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
    // Only failures from the product itself count; external-origin noise
    // (Google Fonts / GitHub API on an egress-restricted runner) must not
    // fail the run — the app treats both as best-effort.
    const external = t => /fonts\.(googleapis|gstatic)\.com|api\.github\.com/.test(t);
    page.on('console', m => { if (m.type() === 'error' && !external(m.text())) errors.push(m.text()); });
    page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
    page.on('requestfailed', r => { if (r.url().startsWith(base)) errors.push('REQFAIL: ' + r.url()); });

    const client = await page.createCDPSession();
    await client.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloadDir, eventsEnabled: true });

    // 'domcontentloaded' (not networkidle): the deferred engine runs before
    // DOMContentLoaded and the render loop needs no network. Waiting on network
    // idle couples the test to external Google Fonts, which is flaky in CI.
    await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000)); // let the render loop spin

    // SwiftShader may take several seconds to compile the shader and produce
    // the first frame — poll for lit pixels instead of snapshotting one instant.
    const countLit = () => page.evaluate(() => {
      const cv = document.getElementById('crtCanvas');
      const gl = cv && (cv.getContext('webgl') || cv.getContext('experimental-webgl'));
      if (!gl) return -1;
      const px = new Uint8Array(cv.width * cv.height * 4);
      gl.readPixels(0, 0, cv.width, cv.height, gl.RGBA, gl.UNSIGNED_BYTE, px);
      let n = 0;
      for (let i = 0; i < px.length; i += 4) if (px[i] + px[i + 1] + px[i + 2] > 12) n++;
      return n;
    });
    let lit = await countLit();
    for (const deadline = Date.now() + 10000; lit >= 0 && lit <= 1000 && Date.now() < deadline;) {
      await new Promise(r => setTimeout(r, 400));
      lit = await countLit();
    }

    const load = await page.evaluate(() => {
      const glyphBg = getComputedStyle(document.querySelector('.brand-glyph')).backgroundImage;
      const opt = document.querySelector('#dlgExport select option');
      return {
        sliders: document.querySelectorAll('#crtControls .row input[type=range]').length,
        presetOptions: document.querySelectorAll('#crtPreset option').length,
        // F002: the visible preset control is gone; #crtPreset survives only as a
        // hidden (sr-only) source of truth feeding the layer tabs.
        presetHidden: document.querySelector('#crtPreset')?.classList.contains('sr-only') === true,
        layerBaseTab: !!document.querySelector('#layerTabs .layer-tab.base'),
        headerActionsPresent: ['crtRandomBtn','btnSavePreset','btnManager','crtResetBtn']
          .every(id => !!document.querySelector('.param-header .param-actions #' + id)),
        transparentDefault: !!document.getElementById('crtTransp')?.checked,
        termCollapsed: !!document.querySelector('#term.is-collapsed'),
        logLines: document.querySelectorAll('#logConsole .tline').length,
        glyphUsesOrb: /orb\.webp/.test(glyphBg),
        optionBg: opt ? getComputedStyle(opt).backgroundColor : null,
        footerStarCta: !!document.querySelector('.footer a[href*="github.com/wranngle/ORBFORGE"]'),
        helpDialog: !!document.getElementById('dlgHelp'),
      };
    });

    check('boot screen clears after load', await page.evaluate(() => !document.getElementById('boot') || document.getElementById('boot').classList.contains('gone')));
    check('WebGL context initializes', lit >= 0);
    check('orb renders non-empty pixels', lit > 1000, `${lit} lit px`);
    check('all 40 parameter sliders present', load.sliders === 40, `${load.sliders}`);
    check('preset dropdown lists built-ins + seed row', load.presetOptions >= 13, `${load.presetOptions} options`);
    // F002: layer tabs replace the visible preset dropdown; the select is hidden,
    // the base layer tab renders, and Roll/Save/Manager/Reset live in the header.
    check('preset select is a hidden source of truth', load.presetHidden);
    check('base layer tab renders in the param header', load.layerBaseTab);
    check('roll/save/manager/reset moved into the param header', load.headerActionsPresent);
    check('transparent background is the default', load.transparentDefault);
    // F007: the event log starts collapsed.
    check('event log is collapsed by default', load.termCollapsed);
    check('event terminal logs startup', load.logLines >= 2, `${load.logLines} lines`);
    // F002: brand glyph uses the forged orb webp; the asset must be served.
    check('brand glyph uses orb.webp', load.glyphUsesOrb);
    check('footer begs for a star', load.footerStarCta);
    check('help dialog exists', load.helpDialog);
    const orbOk = await page.evaluate(async () => (await fetch('/orb.webp')).ok);
    check('orb.webp asset is served', orbOk);
    // Social unfurl surface: og/twitter meta must declare the card and the asset must exist.
    const social = await page.evaluate(async () => ({
      ogImage: document.querySelector('meta[property="og:image"]')?.content || '',
      twCard: document.querySelector('meta[name="twitter:card"]')?.content || '',
      ogPngOk: (await fetch('/og.png')).ok,
      robotsOk: await fetch('/robots.txt').then(async r => r.ok && (await r.text()).includes('User-agent')),
    }));
    // Doctrine drift: the cache-bust sentinel must exist in index.html AND be
    // the exact string deploy.yml rewrites — a mismatch ships an unstamped
    // page, and a stale cached engine against fresh markup kills every control.
    const idxSrc = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const deploySrc = fs.readFileSync(path.join(ROOT, '.github/workflows/deploy.yml'), 'utf8');
    check('index.html script tag carries the ?v=dev cache-bust sentinel', /src="\/app\.js\?v=dev"/.test(idxSrc));
    check('deploy.yml stamps that same sentinel with the commit SHA', deploySrc.includes('s|/app.js?v=dev|/app.js?v=${GITHUB_SHA::7}|'));
    check('og:image meta points at og.png', /\/og\.png$/.test(social.ogImage), social.ogImage);
    check('twitter card is summary_large_image', social.twCard === 'summary_large_image', social.twCard);
    check('og.png social card is served', social.ogPngOk);
    check('robots.txt is served', social.robotsOk);
    // F004: option popups must not be near-white-on-white (dark background forced).
    const obg = (load.optionBg || '').match(/\d+/g)?.map(Number) || [255, 255, 255];
    check('dropdown options have a dark background', obg[0] + obg[1] + obg[2] < 200, load.optionBg || 'n/a');

    // F005: clicking the preview toggles pause/resume (state lives on the transport button).
    const playState = async () => page.evaluate(() => document.getElementById('btnPlay').dataset.playing);
    await page.click('.stage');
    const paused = await playState();
    await page.click('.stage');
    const resumed = await playState();
    check('clicking preview pauses then resumes', paused === 'false' && resumed === 'true', `${paused} -> ${resumed}`);

    // F008: typing a value into a param field applies it (clamped + synced to the slider).
    const typed = await page.evaluate(() => {
      const slider = document.getElementById('crt-radius');
      const val = slider.closest('.row').querySelector('input.val');
      val.focus(); val.value = '0.5';
      val.dispatchEvent(new Event('blur'));
      return { slider: slider.value, display: val.value };
    });
    check('typed param value applies to the slider', Math.abs(parseFloat(typed.slider) - 0.5) < 1e-9, `${typed.slider} / "${typed.display}"`);

    // F002: overlay a preset via the manager → a layer tab with eye + × appears;
    // toggling the eye hides the layer; the × removes it.
    await page.click('#btnManager');
    await page.waitForSelector('#mgrList .mgr-row input[type=checkbox]');
    await page.evaluate(() => document.querySelector('#mgrList .mgr-row input[type=checkbox]').click());
    await page.keyboard.press('Escape'); // close the modal so the header tabs are interactive
    await new Promise(r => setTimeout(r, 60));
    const tabAdded = await page.evaluate(() => {
      const t = document.querySelector('#layerTabs .layer-tab.overlay');
      return { present: !!t, hasEye: !!t?.querySelector('.lt-eye'), hasX: !!t?.querySelector('.lt-x') };
    });
    check('overlaying a preset adds a layer tab with eye + ×', tabAdded.present && tabAdded.hasEye && tabAdded.hasX);
    await page.evaluate(() => document.querySelector('#layerTabs .layer-tab.overlay .lt-eye').click());
    const hidden = await page.evaluate(() => document.querySelector('#layerTabs .layer-tab.overlay')?.classList.contains('hidden-layer'));
    check('eye toggle hides the overlay layer', hidden === true);
    await page.evaluate(() => document.querySelector('#layerTabs .layer-tab.overlay .lt-x').click());
    const removed = await page.evaluate(() => !document.querySelector('#layerTabs .layer-tab.overlay'));
    check('× removes the overlay layer', removed);

    // Drive the central promise: export a small animated WebP.
    await page.click('#crtWebpBtn'); // open export dialog
    await page.evaluate(() => {
      const set = (id, v, ev) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event(ev)); };
      const auto = document.getElementById('crtAuto'); auto.checked = false; auto.dispatchEvent(new Event('change'));
      set('crtDur', '1.5', 'input');
      set('crtFormat', 'webp', 'change');
      set('crtRes', '192', 'change');
      set('crtFps', '12', 'change');
      set('crtTarget', '0', 'change'); // manual — skip calibration for a deterministic run
    });
    await page.evaluate(() => document.getElementById('crtRenderBtn').click());

    const exportedWebp = await awaitDownload(downloadDir, '.webp');
    const webp = validateAnimatedWebP(fs.readFileSync(exportedWebp));
    check('exports a valid animated WebP', true, `${webp.anmf} frames, ${webp.bytes} bytes, alpha=${webp.hasAlpha}`);
    check('exported WebP has transparency', webp.hasAlpha);

    // F003: manual-download fallback + in-dialog preview appear after a successful export.
    const manual = await page.evaluate(() => {
      const a = document.getElementById('crtManualDl');
      const img = document.getElementById('crtResultImg');
      return { visible: a && !a.hidden, href: a ? a.getAttribute('href') : '', preview: /^blob:/.test(img?.src || '') };
    });
    check('manual-download fallback link appears', manual.visible && /^blob:/.test(manual.href), manual.href.slice(0, 12));
    check('exported animation previews in the dialog', manual.preview);

    // F009: the same pipeline exports a valid looping animated GIF.
    await page.evaluate(() => {
      const f = document.getElementById('crtFormat'); f.value = 'gif'; f.dispatchEvent(new Event('change'));
      document.getElementById('crtRenderBtn').click();
    });
    const exportedGif = await awaitDownload(downloadDir, '.gif');
    const gif = validateAnimatedGIF(fs.readFileSync(exportedGif));
    check('exports a valid animated GIF', true, `${gif.images} frames, ${gif.bytes} bytes, ${gif.width}x${gif.height}`);
    check('GIF matches requested resolution', gif.width === 192 && gif.height === 192, `${gif.width}x${gif.height}`);

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
