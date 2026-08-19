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
    baseURL: 'http://127.0.0.1:4000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'bundle exec jekyll build && node scripts/serve.js',
    url: 'http://127.0.0.1:4000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
