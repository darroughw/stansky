import { describe, expect, it } from 'vitest';
import { capsHtml } from '../../src/lib/caps';

describe('capsHtml', () => {
  it('keeps the plural s in ADUs lowercase under uppercase CSS', () => {
    expect(capsHtml('Decks & ADUs')).toBe('Decks &amp; ADU<span class="keep-case">s</span>');
  });

  it('escapes HTML from Sanity content', () => {
    expect(capsHtml('<b>Kitchens</b>')).toBe('&lt;b&gt;Kitchens&lt;/b&gt;');
  });

  it('leaves words that only contain ADUs alone', () => {
    expect(capsHtml('ADUsXYZ')).toBe('ADUsXYZ');
  });
});
