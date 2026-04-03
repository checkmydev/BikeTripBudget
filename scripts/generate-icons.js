/**
 * Simple icon generator - creates PNG icons using Canvas API (Node.js)
 * Run: node scripts/generate-icons.js
 * Requires: npm install canvas (optional - icons can also be created manually)
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#2E7D32';
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.2);
  ctx.fill();

  // Bike emoji approximation - draw a simple bicycle
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${size * 0.55}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🚲', size / 2, size / 2);

  return canvas.toBuffer('image/png');
}

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

try {
  fs.writeFileSync(path.join(publicDir, 'icon-192.png'), generateIcon(192));
  fs.writeFileSync(path.join(publicDir, 'icon-512.png'), generateIcon(512));
  console.log('Icons generated successfully!');
} catch (e) {
  console.error('Failed to generate icons (canvas module required):', e.message);
  console.log('Please provide icon-192.png and icon-512.png manually in the public/ folder.');
}
