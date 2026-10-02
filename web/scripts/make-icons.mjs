// Regenerates the icon set in public/. Run from web/: node scripts/make-icons.mjs
//   favicon.svg / favicon.ico  – "S" from the wordmark's extended face on truck green
//   apple-touch-icon.png       – Jack's truck, for phone home screens and some link previews
//   logo.png                   – full logo, referenced by the LocalBusiness structured data
import fs from 'node:fs/promises';
import satori from 'satori';
import sharp from 'sharp';

const SAGE = '#6c9a66';
const INK = '#171a16';
const PAPER = '#f5f6f1';
const display = await fs.readFile('src/assets/fonts/archivo-display.ttf');

// Satori turns the glyph into a path, so the SVG doesn't depend on any installed font.
const favSvg = await satori(
  {
    type: 'div',
    props: {
      style: {
        width: 64,
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: SAGE,
        borderRadius: 12,
        fontFamily: 'Display',
        fontSize: 52,
        color: INK,
        paddingBottom: 3,
      },
      children: 'S',
    },
  },
  { width: 64, height: 64, fonts: [{ name: 'Display', data: display, weight: 800, style: 'normal' }] },
);
await fs.writeFile('public/favicon.svg', favSvg);

// ICO holding a single 32px PNG (supported by every current browser).
const png32 = await sharp(Buffer.from(favSvg)).resize(32, 32).png().toBuffer();
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(1, 4); // one image
header.writeUInt8(32, 6); // width
header.writeUInt8(32, 7); // height
header.writeUInt16LE(1, 10); // color planes
header.writeUInt16LE(32, 12); // bits per pixel
header.writeUInt32LE(png32.length, 14);
header.writeUInt32LE(22, 18); // image data offset
await fs.writeFile('public/favicon.ico', Buffer.concat([header, png32]));

// Apple touch icon: truck on paper, sitting on a ground line.
const truck = await sharp(await fs.readFile('src/assets/brand/truck.svg'), { density: 300 })
  .resize({ width: 152 })
  .png()
  .toBuffer();
const truckMeta = await sharp(truck).metadata();
const groundY = 112;
const ground = Buffer.from(`<svg width="180" height="180"><rect x="0" y="${groundY}" width="180" height="4" fill="${INK}"/></svg>`);
await sharp({ create: { width: 180, height: 180, channels: 4, background: PAPER } })
  .composite([
    { input: ground, top: 0, left: 0 },
    { input: truck, top: groundY + 2 - (truckMeta.height ?? 0), left: 14 },
  ])
  .png()
  .toFile('public/apple-touch-icon.png');

// Full logo for structured data (Google wants a raster at least 112px).
await sharp(await fs.readFile('src/assets/brand/logo-truck.svg'), { density: 300 })
  .resize({ width: 600 })
  .flatten({ background: '#ffffff' })
  .png()
  .toFile('public/logo.png');

console.log('Wrote public/favicon.svg, favicon.ico, apple-touch-icon.png, logo.png');
