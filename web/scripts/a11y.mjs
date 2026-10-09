// Accessibility check: runs axe-core (WCAG 2.1 A and AA rules) on every page of the
// built site, at desktop and phone widths, in the installed Google Chrome.
//
//   npm run build && npm run test:a11y
//
// Uses system Chrome rather than Playwright's bundled Chromium, which can't run on
// older macOS. Set CHROME_PATH to point somewhere else. Exits 1 on any violation.
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { preview } from 'astro';
import { chromium } from 'playwright-core';

const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const chromePath = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const viewports = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'phone', width: 390, height: 844 },
];

// Every page in the sitemap, plus the two pages deliberately left out of it.
const sitemaps = readdirSync('dist').filter((f) => /^sitemap-\d+\.xml$/.test(f));
if (!sitemaps.length) {
  console.error('No sitemap in dist/. Run `npm run build` first.');
  process.exit(1);
}
const paths = new Set(['/contact/thanks/', '/404.html']);
for (const file of sitemaps) {
  for (const [, loc] of readFileSync(`dist/${file}`, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)) {
    paths.add(new URL(loc).pathname);
  }
}

const server = await preview({ root: '.', logLevel: 'error', server: { port: 4330 } });
const origin = `http://localhost:${server.port}`;
const browser = await chromium.launch({ executablePath: chromePath });

let failures = 0;
try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    for (const path of paths) {
      await page.goto(origin + path, { waitUntil: 'networkidle' });
      await page.addScriptTag({ content: axeSource });
      const { violations } = await page.evaluate(() =>
        // @ts-ignore injected above
        window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }),
      );
      if (!violations.length) continue;
      failures += violations.length;
      console.log(`\n✗ ${path} (${viewport.name})`);
      for (const v of violations) {
        console.log(`  [${v.impact}] ${v.id}: ${v.help}`);
        for (const node of v.nodes.slice(0, 5)) {
          console.log(`    ${node.target.join(' ')}`);
          if (node.failureSummary) console.log(`      ${node.failureSummary.split('\n').slice(1).join('; ').trim()}`);
        }
        if (v.nodes.length > 5) console.log(`    …and ${v.nodes.length - 5} more`);
      }
    }
    await page.close();
  }
} finally {
  await browser.close();
  await server.stop();
}

const checked = paths.size * viewports.length;
if (failures) {
  console.log(`\n${failures} accessibility violation(s) across ${checked} page checks.`);
  process.exit(1);
}
console.log(`No WCAG 2.1 A/AA violations found on ${paths.size} pages at ${viewports.length} widths.`);
