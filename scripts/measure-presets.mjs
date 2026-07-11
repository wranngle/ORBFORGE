// Measures the orb pack: hand-parses each exported preset .webp's RIFF
// container (VP8X flags for the alpha bit, ANMF chunk count for frames, file
// size on disk) and emits the "Grab an orb" README numbers as markdown +
// JSON receipts. Source of truth is the actual exported bytes, not app.js.
// Run: node scripts/measure-presets.mjs [--dir <path>] [--repo owner/name]
//      [--tag vX.Y.Z] [--out <path-without-ext>]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, i, argv) => {
    if (arg.startsWith('--')) pairs.push([arg.slice(2), argv[i + 1]]);
    return pairs;
  }, [])
);
const REPO = args.repo || 'wranngle/ORBFORGE';
const TAG = args.tag || 'v1.0.0';
const OUT = path.resolve(ROOT, args.out || '.artifacts/measure-presets/table');

function humanSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function displayName(file) {
  const words = path.basename(file, '.webp').split('-');
  return words.map((w, i) => (i === 0 ? w[0].toUpperCase() + w.slice(1) : w)).join(' ');
}

// WebP RIFF container: https://developers.google.com/speed/webp/docs/riff_container
// VP8X flags byte bit layout: Rsv Rsv ICC Alpha Exif XMP Anim Rsv (MSB->LSB).
function parseWebP(buf) {
  if (buf.toString('latin1', 0, 4) !== 'RIFF' || buf.toString('latin1', 8, 12) !== 'WEBP') {
    throw new Error('not a WebP RIFF container');
  }
  const riffEnd = 8 + buf.readUInt32LE(4);
  let offset = 12, frames = 0, alpha = false, anim = false;
  while (offset + 8 <= Math.min(riffEnd, buf.length)) {
    const fourCC = buf.toString('latin1', offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    if (fourCC === 'VP8X') {
      const flags = buf[offset + 8];
      alpha = Boolean(flags & 0x10);
      anim = Boolean(flags & 0x02);
    } else if (fourCC === 'ANMF') {
      frames++;
    }
    offset += 8 + size + (size & 1); // chunks are padded to an even byte count
  }
  return { frames: anim ? frames : frames || 1, alpha };
}

function sourceDir() {
  if (args.dir) return path.resolve(args.dir);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'orb-pack-'));
  console.log(`No --dir given; downloading ${REPO}@${TAG} release assets via gh...`);
  execFileSync('gh', ['release', 'download', TAG, '--repo', REPO, '--pattern', '*.webp', '--dir', tmp, '--clobber'], { stdio: 'inherit' });
  return tmp;
}

const dir = sourceDir();
const rows = fs.readdirSync(dir).filter(f => f.endsWith('.webp')).sort().map(file => {
  const buf = fs.readFileSync(path.join(dir, file));
  const { frames, alpha } = parseWebP(buf);
  return { name: displayName(file), file, bytes: buf.length, size: humanSize(buf.length), frames, alpha };
});

const md = [
  `| Orb | File | Size | Frames | Alpha |`,
  `| --- | --- | ---: | ---: | :---: |`,
  ...rows.map(r => `| ${r.name} | ${r.file} | ${r.size} | ${r.frames} | ${r.alpha ? '✓' : ''} |`),
].join('\n') + '\n';
const json = JSON.stringify(rows, null, 2) + '\n';

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(`${OUT}.md`, md);
fs.writeFileSync(`${OUT}.json`, json);
console.log(md);
console.log(`Measured ${rows.length} presets from ${dir}`);
console.log(`Wrote ${OUT}.md and ${OUT}.json`);
