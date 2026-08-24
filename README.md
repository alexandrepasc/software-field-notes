# Software Field Notes

Practical notes from exploring software, hardware, and technology — a personal
blog built with [Jekyll](https://jekyllrb.com/) on the
[Millennial](https://github.com/LeNPaul/Millennial) theme and deployed to
[GitHub Pages](https://pages.github.com/) from the `gh-pages` branch.

**Live site:** <https://alexandrepasc.github.io/software-field-notes>

## Tech stack

| Layer | Tool |
|---|---|
| Static site generator | Jekyll ~4.2 (Ruby) |
| Markdown / code highlighting | kramdown / rouge |
| Plugins | jekyll-paginate, jekyll-feed, jekyll-sitemap, jekyll-seo-tag |
| Theme | Millennial 2.0 (`millennial.gemspec`, managed via `Gemfile`) |
| Styling | SCSS partials in `_sass/`, compiled into `assets/css/main.scss` |
| Comments | [giscus](https://giscus.app) on GitHub Discussions (Disqus support exists but is disabled) |
| Client assets | Google Fonts, Font Awesome 6.7.2 (+ v4 shims), MathJax 2.7.5 |

Dark mode is the default; the light palette is applied via a
`data-theme="light"` attribute toggled by `assets/js/theme.js`.

## Getting started

Fedora one-shot setup:

```bash
scripts/setup.sh   # installs toolchain, Ruby, Node.js, bundler,
                   # Playwright + chromium; finishes with build + tests
```

Manual setup:

```bash
bundle install                    # Ruby dependencies (uses millennial.gemspec)
npm install                       # Playwright for the e2e suite
npx playwright install chromium   # one-time test browser download
```

## Commands

```bash
npm run serve             # preview at http://localhost:4000 (same as:
                          #   bundle exec jekyll serve --baseurl '')
bundle exec jekyll build  # build _site/

# After adding a post that introduces a new tag:
bundle exec ruby scripts/generate_tag_pages.rb          # create missing tag pages
bundle exec ruby scripts/generate_tag_pages.rb --prune  # also remove pages for unused tags
```

The `--baseurl ''` flag matters: `_config.yml` sets `baseurl` to the production
subpath (`/software-field-notes`), so a plain `jekyll serve` mounts the site under
that prefix while template asset links stay root-relative — CSS/JS/images then
404 exactly as the static server's log shows. Stripping baseurl for previews
restores root mounting.

## Testing

E2E tests run the built site in headless Chromium ([Playwright](https://playwright.dev)):

```bash
npm test    # builds into _site-test/, serves it on :4173, runs specs in e2e/
```

Coverage: home page, navigation/category pages/404, post pages, tag index and
tag pages, theme toggle, and RSS/Atom/sitemap feeds.

- The test webServer builds into a dedicated `_site-test/` destination and runs
  on port **4173**, so `npm test` can run while a local preview (`npm run
  serve`) stays up — no shared output, no port clash.
- Never point tests at a live `jekyll serve`: it injects `http://localhost:<port>`
  into every generated `absolute_url` (feeds, share links), which corrupts URL
  assertions.
- `scripts/serve.js` is a zero-dependency static server that mirrors GitHub Pages
  semantics (extensionless URL resolution, real HTTP 404 status).

## Project structure

```text
├── _posts/              # blog posts, named YYYY-MM-DD-title.md
├── pages/               # static pages, category pages, generated tag pages
├── _layouts/            # default, home, post, page, category, tag
├── _includes/           # header, footer, featured-post, post-share, giscus, ...
├── _sass/               # SCSS partials (compiled into assets/css/main.scss)
├── assets/
│   ├── css/             # main.scss entry point + syntax.css
│   ├── img/             # post featured images
│   └── js/              # theme toggle
├── _data/settings.yml   # menu, social links, comments, UI text
├── docs/                # contributor guides (see below)
├── e2e/                 # Playwright specs
├── scripts/
│   ├── serve.js               # zero-dependency static server for tests
│   ├── generate_tag_pages.rb  # tag pages for GitHub Pages safe mode
│   └── setup.sh               # Fedora bootstrap
├── _config.yml          # build settings + canonical url/baseurl
└── rss-feed.xml         # RSS 2.0 feed (Atom comes from jekyll-feed)
```

## Writing content

Step-by-step guides live in `docs/`:

- **[Creating posts](docs/creating-posts.md)** — file naming, front matter
  conventions, featured images (~2.7:1 export so home cards don't over-crop).
- **[Tags](docs/tags.md)** — how tag buttons and `/tags/<slug>` pages work.
  GitHub Pages runs Jekyll in safe mode, so each tag needs a committed source
  page in `pages/tag-<slug>.md`; generate them with
  `scripts/generate_tag_pages.rb` after adding a post with a new tag.
- **[Categories](docs/categories.md)** — grouping posts onto category pages.
- **[Comments](docs/comments.md)** — giscus/GitHub Discussions configuration,
  prerequisites and gotchas.
- **[Running locally](docs/running-locally.md)** — prerequisites and day-to-day
  development workflow.

## Configuration notes

- `_config.yml` pins the canonical GitHub Pages address: `url` =
  `https://alexandrepasc.github.io`, `baseurl` = `/software-field-notes`. This
  makes feeds, sitemap, seo-tag and every `absolute_url` deterministic and
  production-correct even in local builds — do not remove it, and keep it in
  sync with the real deployment path.
- Social icon values render as `class="fa fa-<icon>"`: use plain legacy FA 4
  names, `'brands <name>'` for Font Awesome 6 brand glyphs, or `svg_path`
  (+ optional ink-cropping `view_box`) for brands missing from Font Awesome,
  rendered as inline SVG by `_includes/social-link.html`. See the conventions
  documented at the top of `_data/settings.yml`.
- Google Analytics is intentionally disabled (`google-ID` commented out in
  `_data/settings.yml`).

## Credits & license

Built on the [Millennial](https://github.com/LeNPaul/Millennial) Jekyll theme
by Paul Le. Open sourced under the MIT license — see [LICENSE.md](LICENSE.md).
