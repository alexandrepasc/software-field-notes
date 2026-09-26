# Running the Site Locally

Practical guide to developing and testing **Software Field Notes** on your machine.

## Prerequisites

| Tool | Used for |
|---|---|
| Ruby + Bundler | Jekyll build (`bundle exec ...`) |
| Node.js + npm | Playwright e2e tests, static server |
| Chromium | Headless browser for tests (downloaded once by Playwright) |

On Fedora or Void Linux, `scripts/setup.sh` automates the whole toolchain (Ruby,
Node.js, bundler, Playwright + chromium) and finishes by running the build and
the tests. It detects the package manager, so the same command works on both.

## One-time setup

```bash
bundle install                   # Ruby dependencies (uses millennial.gemspec)
npm install                      # Node/Playwright dependencies
npx playwright install chromium  # download the test browser
```

**If `bundle install` fails with `Bundler::PermissionError`** (it tries to write
to a root-owned `/usr/lib/ruby/gems`, which is what Void Linux gives you), give
Bundler a writable path of your own:

```bash
bundle config set --local path .bundle   # gems land in .bundle/ (gitignored)
bundle install
```

`scripts/setup.sh` does this for you when it detects a non-writable gem
directory, so you only need it if you skipped the script. Note that
`npx playwright install --with-deps` is Fedora-only: on other distributions
install the Chromium runtime libraries with your own package manager and run
plain `npx playwright install chromium`.

## Preview the site

```bash
npm run serve
```

Then open <http://localhost:4000>. The script is equivalent to:

```bash
bundle exec jekyll serve --baseurl ''
```

**Why the `--baseurl ''` flag matters:** `_config.yml` sets
`baseurl: /software-field-notes` because that is the production subpath on
GitHub Pages. A plain `bundle exec jekyll serve` therefore mounts the site at
`localhost:4000/software-field-notes/`, while template asset links stay
root-relative (`site.github.url` is empty outside GitHub Pages builds). CSS,
JS and images then 404 with errors like:

```
ERROR '/assets/css/main.css' not found.
```

Stripping the baseurl only for previews restores root mounting. Committed
builds are unaffected either way — production URLs come out fully qualified.

## Build

```bash
bundle exec jekyll build    # writes _site/ (run this to validate changes)
```

Note that scheduled posts (dated in the future) still build because
`_config.yml` sets `future: true`; they become publicly visible when the
`gh-pages` branch is pushed after their date passes.

## Run the tests

```bash
npm test
```

This builds the site into a dedicated `_site-test/` directory and serves it on
port **4173** through `scripts/serve.js` (a zero-dependency static server that
mirrors GitHub Pages URL resolution), then runs the Playwright e2e suite from
`e2e/`. Both the separate destination and the separate port mean tests run
safely alongside a local preview on port 4000 — no need to stop
`npm run serve` first.

Gotchas:

- The test server must be Playwright's own `serve.js` instance, never a live
  `jekyll serve`: Jekyll injects `http://localhost:<port>` into every generated
  absolute URL (feeds, share intents), which would corrupt URL assertions.
- Tests are offline-friendly: CDN assets (MathJax, fonts, Font Awesome) are
  deliberately not asserted.
