![A burning comet-ring orb rendering live in WebGL beside the 25-parameter control rig](docs/hero.webp)

# Orb Forge

> agent-avatar synthesizer: burning comet-ring orb, 25 parameters in, animated WebP out

[![CI](https://github.com/wranngle/orb_forge/actions/workflows/ci.yml/badge.svg)](https://github.com/wranngle/orb_forge/actions/workflows/ci.yml) [![License](https://img.shields.io/github/license/wranngle/orb_forge?color=A371F7)](./LICENSE) ![Status](https://img.shields.io/badge/status-active-brightgreen.svg)

> [!NOTE]
> Active personal project. Used in my own workflow. Issues triaged on a personal-time cadence.

**Live:** https://orb-forge.wranngle.com

## Quick start

```bash
git clone https://github.com/wranngle/orb_forge && cd orb_forge
python3 -m http.server 8080
# open http://localhost:8080
```

WebP export needs browser-native WebP encoding (Chrome, Edge, or a recent
Firefox). WebGL is required for the preview.

## What it does

- **Live WebGL preview**: a fragment-shader orb with a noise-driven burning
  ring, configurable comets/tracers, glow, chromatic aberration, and color post.
- **25 parameters** in four groups (Ring & motion, Burning texture,
  Comet / tracer, Color & post), each with a slider, ±steppers (click-and-hold
  repeat), and a value chip, all in a console-aesthetic Wranngle UI.
- **Presets**: seven built-ins plus user presets saved to `localStorage`.
- **Animated WebP export**: browser-native WebP encoding muxed into a
  transparent animated file for use as an avatar or loader, with loop-duration
  solving and a target-file-size auto-tuner.
- **JSON I/O**: copy, download, or paste a full parameter config.
- **Undo / redo**: `⌘/Ctrl+Z`, `⌘/Ctrl+Shift+Z` (or `Y`); `Space` toggles play.
- **Pinned event terminal**: every action emits an ECS-shaped JSONL record you
  can copy or download as `.jsonl`.

## Structure

| File         | Purpose                                              |
|--------------|------------------------------------------------------|
| `index.html` | Markup + design-system styles (inline `<style>`).    |
| `app.js`     | The engine: controls, WebGL render loop, WebP muxer. |
| `_headers`   | Cloudflare Pages security headers (CSP, caching).    |
| `og.png`     | Social-unfurl card. Regenerate with `npm run og`.    |
| `tests/`     | Outcome-based e2e: renders in headless Chrome and validates the exported WebP bytes. |

It is a static site with no build step. The engine is a single external script
so the page ships a strict CSP (`script-src 'self'`, no inline script).

## Deploy

Cloudflare Pages (direct upload). Pushes to `main` that touch the site files
auto-deploy via `.github/workflows/deploy.yml`, which stages them into `dist/`
and runs `wrangler pages deploy`; `_headers` is applied automatically.

## License

MIT © Wranngle Systems LLC. See [LICENSE](LICENSE).
