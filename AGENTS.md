# AGENTS.md

## Project

Jekyll static site ("software field notes" blog) built on the **Millennial** theme. Deployed on the `gh-pages` branch to GitHub Pages at `alexandrepasc.github.io/software-field-notes`.

## Stack

- Jekyll ~4.2, kramdown (markdown), rouge (syntax highlighting)
- Plugins: `jekyll-paginate`, `jekyll-sitemap`, `jekyll-feed`, `jekyll-seo-tag`
- Ruby gem `millennial` (see `millennial.gemspec`), managed via `Gemfile`
- Sass/SCSS partials in `_sass/`, entry point `assets/css/main.scss`
- Fonts via Google Fonts, icons via Font Awesome 6.7.2 (`all.min.css` plus
  `v4-shims.min.css`, which keep legacy FA 4 names like `fa-sun-o` working), MathJax 2.7.5

## Commands

```bash
bundle install            # install dependencies (uses gemspec)
npm run serve             # preview at http://localhost:4000 (same as:
                          #   bundle exec jekyll serve --baseurl '')
bundle exec jekyll build  # build _site/ (run this to validate changes)
```

The `--baseurl ''` flag matters: `_config.yml` sets `baseurl` to the production
subpath (`/software-field-notes`), so a plain `bundle exec jekyll serve` mounts
the site under that prefix while template asset links stay root-relative
(`site.github.url` is empty locally) — CSS/JS/images then 404 exactly as the
static server's log shows. Stripping baseurl for previews restores root mounting.

## Tests

E2E tests run the built site in a real headless Chromium browser (Playwright). They
cover the home page, navigation/category pages/404, post pages, the tag index and
tag pages, the theme toggle, and the RSS/Atom/sitemap feeds. There are no other
tests; `bundle exec jekyll build` is also part of the e2e run (the test webServer
builds the site first).

```bash
npm install                # one-time: install Playwright (package.json)
npx playwright install chromium  # one-time: download the test browser
npm test                   # builds the site, serves _site/ on :4000, runs e2e
```

On Fedora, `scripts/setup.sh` automates the whole setup (toolchain, Ruby, Node.js,
bundler, Playwright + chromium) and finishes by running the build and `npm test`.

Notes:

- `scripts/serve.js` is a zero-dependency static server that mirrors GitHub Pages
  (resolves `/about` → `/about.html`, serves `_site/404.html` with a real 404 status).
- Tests are offline-friendly: MathJax/CDN is deliberately not asserted.
- All e2e test files live in `e2e/`; config is `playwright.config.js`.
- The test webServer builds into a dedicated `_site-test/` destination and runs
  on port **4173**, so `npm test` can run while a local preview (`npm run
  serve`, port 4000) stays up — no shared output, no port clash. Never point
  tests at a live `jekyll serve`: it injects `http://localhost:<port>` into
  every generated `absolute_url` (feeds, share links), which corrupts URL
  assertions.

## Structure

- `_posts/` — blog posts, named `YYYY-MM-DD-title.md`
- `pages/` — static pages and category pages (front matter sets `permalink`)
- `_data/settings.yml` — site settings: menu, social links, Disqus, pagination labels
- `_config.yml` — build settings, site title/description/author
- `_layouts/` — `default`, `home`, `post`, `page`, `category`
- `_includes/` — `head`, `header`, `footer`, `featured-post`, `post-date`, `post-share`, `social-link`, `related-posts`, `disqus`, `google-analytics`
- `_sass/` — SCSS partials (partial names start with `_`)
- `assets/img/` — post featured images; `assets/css/` — `main.scss`, `syntax.css`

## Post conventions

Front matter:

```yaml
---
layout: post
title: "Post Title"
author: "Author Name"
categories: [documentation, facts, resources, sample]  # pick existing category
tags: [tag1, tag2]
image: image-file.jpg  # optional, must exist in assets/img/
---
```

- Filename date drives the published date and permalink (`/:title`).
- `image` is optional; if set, it is displayed and used as the home/featured background.
- Categories render posts on the matching category page (see `pages/` and `_layouts/category.html`).
- Tags render as buttons on each post, right after the publication date, and
  drive the tag pages (`/tags` index + `/tags/<slug>`), see `_layouts/tag.html`,
  `pages/tags.md`, `_includes/post-tags.html`, and
  `scripts/generate_tag_pages.rb`.

## Tag workflow

GitHub Pages runs Jekyll in safe mode, so there is no tag plugin: each tag needs a
source page in `pages/tag-<slug>.md` (front matter `layout: tag`, `tag: <name>`,
`permalink: /tags/<slug>`). After adding a post that introduces a new tag, run:

```bash
bundle exec ruby scripts/generate_tag_pages.rb          # create missing tag pages
bundle exec ruby scripts/generate_tag_pages.rb --prune  # also remove pages for unused tags
```

The script is idempotent and commits the generated `pages/tag-*.md` files as normal
source. Tag names are normalized with Jekyll's `slugify` (lowercase, spaces/symbols
→ hyphens), matching the `{{ tag | slugify }}` links in the templates.

## Page conventions

- Static pages: `layout: page`, set `permalink` in front matter (e.g. `/about`).
- Category pages: `layout: category`, set a `category:` value that matches a post category.

## Configuration notes

- `_config.yml` sets the canonical GitHub Pages address: `url` =
  `https://alexandrepasc.github.io`, `baseurl` = `/software-field-notes`. This makes
  feeds, sitemap, seo-tag and every `absolute_url` deterministic and production-correct
  even in local builds — do not remove it, and keep it in sync with the real deployment path.
- Nav/footer link prefixes use `{{ site.github.url }}` (Jekyll GitHub metadata); locally it
  is empty so those links stay root-relative, which `scripts/serve.js` expects. Share
  intents and feed URLs use `absolute_url` instead and come out fully qualified.
- Social icon conventions are documented at the top of `_data/settings.yml`: values render
  as `class="fa fa-<icon>"`; use `'brands <name>'` for Font Awesome 6 brand glyphs, or
  `svg_path` (+ optional ink-cropping `view_box`) for brands missing from Font Awesome —
  rendered as inline SVG by `_includes/social-link.html`. The post share bar
  (`_includes/post-share.html`) mirrors the social list order.
- `google-ID` in `_data/settings.yml` is intentionally commented out (no analytics).
- Disqus is disabled (`disqus.comments: false`).
