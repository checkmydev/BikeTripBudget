/**
 * Generate PWA icons from public/icon-source.png (no external deps).
 * Decodes the source PNG, area-downsamples, re-encodes as RGBA PNG.
 * Produces: icon-192.png, icon-512.png, icon-512-maskable.png
 *
 * Run: node scripts/generate-icons-from-source.js
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const pub = path.join(__dirname, '..', 'public');
const src = fs.readFileSync(path.join(pub, 'icon-source.png'));

// ---- decode PNG (8-bit, color type 2 RGB or 6 RGBA) ----
function decodePNG(buf) {
  if (buf.slice(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error('not a PNG');
  let w, h, colorType, off = 8;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.slice(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4);
      colorType = data[9];
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') break;
    off += 12 + len;
  }
  const channels = colorType === 6 ? 4 : 3;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * channels;
  const out = Buffer.alloc(h * stride);
  const paeth = (a, b, c) => {
    const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };
  for (let y = 0; y < h; y++) {
    const filter = raw[y * (stride + 1)];
    const rowStart = y * (stride + 1) + 1;
    for (let i = 0; i < stride; i++) {
      const x = raw[rowStart + i];
      const a = i >= channels ? out[y * stride + i - channels] : 0;
      const b = y > 0 ? out[(y - 1) * stride + i] : 0;
      const c = i >= channels && y > 0 ? out[(y - 1) * stride + i - channels] : 0;
      let val;
      switch (filter) {
        case 0: val = x; break;
        case 1: val = x + a; break;
        case 2: val = x + b; break;
        case 3: val = x + ((a + b) >> 1); break;
        case 4: val = x + paeth(a, b, c); break;
        default: throw new Error('bad filter ' + filter);
      }
      out[y * stride + i] = val & 0xff;
    }
  }
  return { w, h, channels, data: out };
}

// ---- area (box) downsample to size x size, output RGBA ----
function resize(img, size) {
  const { w, h, channels, data } = img;
  const rgba = Buffer.alloc(size * size * 4);
  for (let ty = 0; ty < size; ty++) {
    const sy0 = Math.floor((ty * h) / size), sy1 = Math.max(sy0 + 1, Math.floor(((ty + 1) * h) / size));
    for (let tx = 0; tx < size; tx++) {
      const sx0 = Math.floor((tx * w) / size), sx1 = Math.max(sx0 + 1, Math.floor(((tx + 1) * w) / size));
      let r = 0, g = 0, b = 0, n = 0;
      for (let sy = sy0; sy < sy1; sy++) {
        for (let sx = sx0; sx < sx1; sx++) {
          const o = (sy * w + sx) * channels;
          r += data[o]; g += data[o + 1]; b += data[o + 2]; n++;
        }
      }
      const d = (ty * size + tx) * 4;
      rgba[d] = Math.round(r / n); rgba[d + 1] = Math.round(g / n); rgba[d + 2] = Math.round(b / n); rgba[d + 3] = 255;
    }
  }
  return rgba;
}

// ---- encode RGBA PNG ----
function crc32(buf) { let c = ~0; for (let i = 0; i < buf.length; i++) { c ^= buf[i]; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); } return (~c) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(size, rgba) {
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) { raw[y * (stride + 1)] = 0; rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride); }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

const img = decodePNG(src);
console.log(`source decoded: ${img.w}x${img.h}, ${img.channels} channels`);
for (const size of [192, 512]) {
  fs.writeFileSync(path.join(pub, `icon-${size}.png`), encodePNG(size, resize(img, size)));
}
// maskable = same full-bleed square (content is already centered with safe-zone margin)
fs.writeFileSync(path.join(pub, 'icon-512-maskable.png'), encodePNG(512, resize(img, 512)));
console.log('Wrote icon-192.png, icon-512.png, icon-512-maskable.png');
