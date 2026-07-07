/**
 * Dependency-free PNG icon generator for the PWA.
 * Draws a white bicycle on the brand-green background (#2E7D32).
 * Full-bleed square so the same icons work as "any" AND "maskable"
 * (bike stays within the central safe zone).
 *
 * Run: node scripts/generate-icons.js
 * Produces: public/icon-192.png, public/icon-512.png, public/icon-512-maskable.png
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ---- brand colors ----
const BG = [0x2e, 0x7d, 0x32]; // #2E7D32
const FG = [0xff, 0xff, 0xff]; // white

// distance from point P to segment AB (all normalized 0..1)
function distToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy || 1e-9;
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx, cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

// bike geometry in normalized coords (0..1)
const L = [0.29, 0.64];  // rear hub
const R = [0.71, 0.64];  // front hub
const B = [0.50, 0.64];  // bottom bracket
const S = [0.43, 0.35];  // seat
const H = [0.67, 0.35];  // handlebar/head
const WHEEL_R = 0.165;
const RING = 0.028;      // wheel ring half-thickness
const BAR = 0.020;       // frame half-thickness

const SEGS = [
  [L, B], [L, S], [B, S], [B, H], [S, H], [H, R], // frame + fork
  [S[0] - 0.05, S[1], S[0] + 0.03, S[1]],         // seat (drawn below as points)
];

// returns FG coverage (0..1) for a normalized point, with 1px anti-aliasing
function bikeCoverage(nx, ny, aa) {
  let d = Infinity;
  // wheels (rings)
  d = Math.min(d, Math.abs(Math.hypot(nx - L[0], ny - L[1]) - WHEEL_R) - RING);
  d = Math.min(d, Math.abs(Math.hypot(nx - R[0], ny - R[1]) - WHEEL_R) - RING);
  // frame segments
  const segs = [[L, B], [L, S], [B, S], [B, H], [S, H], [H, R]];
  for (const [a, b] of segs) {
    d = Math.min(d, distToSeg(nx, ny, a[0], a[1], b[0], b[1]) - BAR);
  }
  // seat bar + handlebar (short horizontal strokes)
  d = Math.min(d, distToSeg(nx, ny, S[0] - 0.055, S[1] - 0.005, S[0] + 0.03, S[1] - 0.005) - BAR);
  d = Math.min(d, distToSeg(nx, ny, H[0] - 0.02, H[1] - 0.005, H[0] + 0.05, H[1] - 0.005) - BAR);
  // hubs (small dots)
  d = Math.min(d, Math.hypot(nx - L[0], ny - L[1]) - 0.02);
  d = Math.min(d, Math.hypot(nx - R[0], ny - R[1]) - 0.02);
  // d<0 => inside shape. Smooth 0..1 over aa band.
  return Math.max(0, Math.min(1, 0.5 - d / aa));
}

function makePNG(size) {
  const aa = 1.2 / size; // ~1px anti-alias band in normalized units
  // RGBA raw with filter byte per row
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter type 0
    for (let x = 0; x < size; x++) {
      const nx = (x + 0.5) / size, ny = (y + 0.5) / size;
      const c = bikeCoverage(nx, ny, aa);
      const r = Math.round(BG[0] + (FG[0] - BG[0]) * c);
      const g = Math.round(BG[1] + (FG[1] - BG[1]) * c);
      const b = Math.round(BG[2] + (FG[2] - BG[2]) * c);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = 255;
    }
  }
  return encodePNG(size, size, raw);
}

// ---- minimal PNG encoder ----
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (~c) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(w, h, raw) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

fs.writeFileSync(path.join(publicDir, 'icon-192.png'), makePNG(192));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), makePNG(512));
fs.writeFileSync(path.join(publicDir, 'icon-512-maskable.png'), makePNG(512));
console.log('Icons generated: icon-192.png, icon-512.png, icon-512-maskable.png');
