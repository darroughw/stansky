import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    // Every test file gets fresh modules: track.ts and analytics.ts read env and the DOM on import.
    isolate: true,
  },
});
