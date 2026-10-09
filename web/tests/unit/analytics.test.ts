import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const load = () => import('../../src/lib/analytics');

beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllEnvs());

describe('analytics switch', () => {
  it('is off with no IDs set', async () => {
    vi.stubEnv('CONTEXT', 'production');
    const { analyticsEnabled } = await load();
    expect(analyticsEnabled).toBe(false);
  });

  it('turns on a tracker on production deploys when its ID is set', async () => {
    vi.stubEnv('CONTEXT', 'production');
    vi.stubEnv('PUBLIC_META_PIXEL_ID', '123');
    const { analytics, analyticsEnabled } = await load();
    expect(analyticsEnabled).toBe(true);
    expect(analytics.metaPixelId).toBe('123');
    expect(analytics.posthogKey).toBeUndefined();
  });

  it('stays off on deploy previews and local builds even with IDs set', async () => {
    for (const context of ['deploy-preview', 'branch-deploy', '']) {
      vi.resetModules();
      vi.stubEnv('CONTEXT', context);
      vi.stubEnv('PUBLIC_POSTHOG_KEY', 'phc_test');
      const { analytics, analyticsEnabled } = await load();
      expect(analyticsEnabled, context || 'local').toBe(false);
      expect(analytics.posthogKey).toBeUndefined();
    }
  });

  it('treats a blank or whitespace ID as not set', async () => {
    vi.stubEnv('CONTEXT', 'production');
    vi.stubEnv('PUBLIC_NEXTDOOR_PIXEL_ID', '   ');
    const { analyticsEnabled } = await load();
    expect(analyticsEnabled).toBe(false);
  });

  it('does not count the PostHog host default as a configured tracker', async () => {
    vi.stubEnv('CONTEXT', 'production');
    const { analytics, analyticsEnabled } = await load();
    expect(analytics.posthogHost).toBe('https://us.i.posthog.com');
    expect(analyticsEnabled).toBe(false);
  });
});
