// @ts-check
const { defineConfig } = require('@playwright/test');

/**
 * E2E config for the Software Field Notes Jekyll site.
 *
 * The webServer builds the site with Jekyll and serves the _site/ output
 * through scripts/serve.js (a tiny static server that mirrors GitHub Pages,
 * including serving 404.html with a real 404 status for unknown routes).
 */
module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  workers: 2,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    // Port 4173 keeps tests independent of any local preview server
    // (`npm run serve`) on the default port 4000. The separate `_site-test`
    // destination keeps the build independent of a running preview's file
    // watcher, which otherwise rewrites shared `_site/` output mid-test and
    // leaks `http://localhost:4000` into generated absolute URLs.
    command:
      'bundle exec jekyll build --destination _site-test && node scripts/serve.js 4173 _site-test',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
