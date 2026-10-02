// Branded 1200x630 share cards, rendered at build time.
// Left: paper panel with the eyebrow, page title in the wordmark's extended face,
// and Jack's truck parked on the ground line. Right: the page's photo.
import fs from 'node:fs/promises';
import path from 'node:path';
import satori from 'satori';
import sharp from 'sharp';

const W = 1200;
const H = 630;
const PHOTO_W = 560;
const C = { paper: '#f5f6f1', ink: '#171a16', inkSoft: '#4a5047', cab: '#2f5a2c', sage: '#6c9a66' };

const root = path.resolve('src/assets');
const read = (p: string) => fs.readFile(path.join(root, p));

let assets: Promise<{ fonts: any[]; truck: string }> | undefined;
function loadAssets() {
  assets ??= (async () => {
    const [display, label, body, truckSvg] = await Promise.all([
      read('fonts/archivo-display.ttf'),
      read('fonts/archivo-label.ttf'),
      read('fonts/archivo-body.ttf'),
      read('brand/truck.svg'),
    ]);
    const truckPng = await sharp(truckSvg, { density: 300 }).resize({ width: 520 }).png().toBuffer();
    return {
      fonts: [
        { name: 'Display', data: display, weight: 800, style: 'normal' },
        { name: 'Label', data: label, weight: 600, style: 'normal' },
        { name: 'Body', data: body, weight: 500, style: 'normal' },
      ],
      truck: `data:image/png;base64,${truckPng.toString('base64')}`,
    };
  })();
  return assets;
}

export type CardPhoto = { src: string; position?: string } | { file: string; position?: string };

/** Crop a photo to the card's photo column, keeping the focal point in frame. */
async function cropPhoto(photo: CardPhoto) {
  const input = 'file' in photo ? await read(photo.file) : Buffer.from(await (await fetch(photo.src)).arrayBuffer());
  const img = sharp(input).rotate();
  const { width = 1, height = 1 } = await img.metadata();
  const [px, py] = (photo.position ?? '50% 50%').split(' ').map((v) => parseFloat(v) / 100);
  const scale = Math.max(PHOTO_W / width, H / height);
  const rw = Math.round(width * scale);
  const rh = Math.round(height * scale);
  const left = Math.min(Math.max(Math.round(rw * px - PHOTO_W / 2), 0), rw - PHOTO_W);
  const top = Math.min(Math.max(Math.round(rh * py - H / 2), 0), rh - H);
  const buf = await img.resize(rw, rh).extract({ left, top, width: PHOTO_W, height: H }).jpeg({ quality: 85 }).toBuffer();
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

const el = (type: string, style: Record<string, unknown>, children?: unknown, extra: Record<string, unknown> = {}) => ({
  type,
  props: { style, children, ...extra },
});

// Advance widths (em) of the display instance, measured from archivo-display.ttf.
const EM: Record<string, number> = {
  A: 0.943, B: 0.922, C: 0.941, D: 0.933, E: 0.861, F: 0.803, G: 1.012, H: 0.999, I: 0.384, J: 0.749, K: 0.97,
  L: 0.77, M: 1.163, N: 0.997, O: 1.01, P: 0.863, Q: 1.01, R: 0.938, S: 0.875, T: 0.863, U: 0.979, V: 0.921,
  W: 1.221, X: 0.95, Y: 0.942, Z: 0.867, '&': 1.033, ',': 0.365, '-': 0.416, '.': 0.365,
};
const wordEm = (w: string) => [...w.toUpperCase()].reduce((sum, c) => sum + (EM[c] ?? 0.9), 0);

/** Display size that keeps long titles to a few lines and never lets one word overflow. */
function titleSize(title: string, maxWidth: number) {
  const byLength = title.length <= 18 ? 68 : title.length <= 32 ? 56 : title.length <= 48 ? 46 : 38;
  const widest = Math.max(...title.split(/\s+/).map(wordEm));
  return Math.min(byLength, Math.floor(maxWidth / widest));
}

/** Uppercase for the display face, but keep plurals of acronyms readable ("ADUs", not "ADUS"). */
export const displayCase = (s: string) => s.toUpperCase().replace(/\b([A-Z]{2,})S\b/g, (m, a) => (/^(ADU|SUV)$/.test(a) ? `${a}s` : m));

export async function renderCard(opts: { eyebrow: string; title: string; photo?: CardPhoto; footer?: string }) {
  const { fonts, truck } = await loadAssets();
  const photo = opts.photo ? await cropPhoto(opts.photo) : undefined;
  // Without a photo the panel takes the full card and the truck gets bigger.
  const panelW = photo ? W - PHOTO_W : W;
  const truckW = photo ? 270 : 470;
  const truckH = Math.round((truckW * 232) / 473.4);

  const tree = el(
    'div',
    { width: W, height: H, display: 'flex', background: C.paper, position: 'relative' },
    [
      el(
        'div',
        {
          width: panelW,
          height: H,
          display: 'flex',
          flexDirection: 'column',
          padding: '56px 48px 0 56px',
        },
        [
          el(
            'div',
            { fontFamily: 'Label', fontSize: 22, letterSpacing: 2.5, color: C.inkSoft },
            // Non-breaking spaces: Satori drops a normal space after a comma in tracked text.
            opts.eyebrow.toUpperCase().replace(/ /g, '\u00a0'),
          ),
          el(
            'div',
            {
              marginTop: 22,
              fontFamily: 'Display',
              fontSize: photo ? titleSize(opts.title, panelW - 104) : Math.round(titleSize(opts.title, 640) * 1.4),
              lineHeight: 1.02,
              color: C.ink,
              display: 'flex',
              flexWrap: 'wrap',
              ...(photo ? {} : { maxWidth: 640 }),
            },
            displayCase(opts.title),
          ),
          el(
            'div',
            { marginTop: 18, fontFamily: 'Body', fontSize: 26, color: C.cab },
            opts.footer ?? 'stanskyconstruction.com',
          ),
        ],
      ),
      ...(photo
        ? [el('img', { position: 'absolute', right: 0, top: 0, width: PHOTO_W, height: H }, undefined, { src: photo, width: PHOTO_W, height: H })]
        : []),
      // Ground line across the panel, ending at the photo; truck parked on it.
      el('div', { position: 'absolute', left: 0, width: panelW, bottom: 34, height: 5, background: C.ink }),
      el('img', { position: 'absolute', left: panelW - truckW - 36, bottom: 33, width: truckW, height: truckH }, undefined, {
        src: truck,
        width: truckW,
        height: truckH,
      }),
    ],
  );

  const svg = await satori(tree as any, { width: W, height: H, fonts });
  return sharp(Buffer.from(svg)).jpeg({ quality: 86, progressive: true, mozjpeg: true }).toBuffer();
}

/** URL path of the card for a page path: "/" -> "/og/home.jpg", "/services/adus/" -> "/og/services/adus.jpg". */
export const ogPath = (pathname: string) => `/og/${pathname.replace(/^\/|\/$/g, '') || 'home'}.jpg`;
