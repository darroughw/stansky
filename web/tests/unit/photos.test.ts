import { describe, expect, it } from 'vitest';
import { BUDGET_BYTES, MAX_PHOTOS, fitWithin, formatBytes, pickPhotos } from '../../src/lib/photos';

const file = (name: string, type: string) => new File(['x'], name, { type });

describe('fitWithin', () => {
  it('shrinks the long side of a phone photo to 1600px, keeping its shape', () => {
    expect(fitWithin(4032, 3024)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin(3024, 4032)).toEqual({ width: 1200, height: 1600 });
  });

  it('never enlarges a small photo', () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });
});

describe('pickPhotos', () => {
  it('keeps at most three images and counts the rest as skipped', () => {
    const files = ['a', 'b', 'c', 'd'].map((n) => file(`${n}.jpg`, 'image/jpeg'));
    const { photos, skipped } = pickPhotos(files);
    expect(photos.map((f) => f.name)).toEqual(['a.jpg', 'b.jpg', 'c.jpg']);
    expect(skipped).toBe(1);
  });

  it('drops files that are not images', () => {
    const { photos, skipped } = pickPhotos([file('plan.pdf', 'application/pdf'), file('deck.heic', 'image/heic')]);
    expect(photos.map((f) => f.name)).toEqual(['deck.heic']);
    expect(skipped).toBe(1);
  });
});

describe('limits', () => {
  it('leaves room under Netlify’s 8 MB request limit', () => {
    expect(MAX_PHOTOS).toBe(3);
    expect(BUDGET_BYTES).toBeLessThan(8 * 1024 * 1024);
  });

  it('formats sizes the way the form shows them', () => {
    expect(formatBytes(300)).toBe('1 KB');
    expect(formatBytes(512 * 1024)).toBe('512 KB');
    expect(formatBytes(2.5 * 1024 * 1024)).toBe('2.5 MB');
  });
});
