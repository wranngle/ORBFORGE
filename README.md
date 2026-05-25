# Orb Forge

A WebGL agent-avatar synthesizer. Tune a burning comet-ring orb across 25 live
parameters, then export it as a transparent **animated WebP** for use as an
avatar or loader. Console-aesthetic Wranngle UI with a live preview, preset
chips, JSON import/export, and a pinned ECS/JSONL event terminal.

**Live:** https://orb-forge.wranngle.com

## What it does

- **Live WebGL preview** — a fragment-shader orb with a noise-driven burning
  ring, configurable comets/tracers, glow, chromatic aberration, and color post.
- **25 parameters** in four groups (Ring & motion, Burning texture,
  Comet / tracer, Color & post), each with a slider, ±steppers (click-and-hold
  repeat), and a value chip.
- **Presets** — seven built-ins plus user presets saved to `localStorage`.
- **Animated WebP export** — browser-native WebP encoding muxed into an animated
  file, with seamless-loop duration solving and a target-file-size auto-tuner.
- **JSON I/O** — copy, download, or paste a full parameter config.
- **Undo / redo** — `⌘/Ctrl+Z`, `⌘/Ctrl+Shift+Z` (or `Y`); `Space` toggles play.
- **Event terminal** — every action emits an ECS-shaped JSONL record you can
  copy or download as `.jsonl`.

## Structure

| File         | Purpose                                              |
|--------------|------------------------------------------------------|
| `index.html` | Markup + design-system styles (inline `<style>`).    |
| `app.js`     | The engine: controls, WebGL render loop, WebP muxer. |
| `_headers`   | Cloudflare Pages security headers (CSP, etc.).       |

It is a static site with no build step. The engine is a single external script
so the page ships a strict CSP (`script-src 'self'`, no inline script).

## Run locally

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

WebP export needs browser-native WebP encoding (Chrome, Edge, or a recent
Firefox). WebGL is required for the preview.

## Deploy

Static host. Deployed to Cloudflare Pages; `_headers` is applied automatically.

## License

MIT © Wranngle LLC — see [LICENSE](LICENSE).
