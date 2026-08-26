---
layout: post
title: "How This Site Works: Jekyll Under the Hood"
author: "Alexandre Pascoal"
categories: [development]
tags: [jekyll, github-pages]
---

If you are reading this, it worked. This blog is a static site built with [Jekyll](https://jekyllrb.com/) on top of the [Millennial](https://github.com/LeNPaul/Millennial) theme, hosted on [GitHub Pages](https://pages.github.com/). Full disclosure: a good part of it was implemented by an AI coding agent ([opencode](https://opencode.ai)) following instructions I wrote — but the machinery deserves an explanation on its own terms, because once you understand how it works, publishing here is just dropping a file in a folder.

## The build step is the app

A dynamic CMS renders pages on every request: PHP, a database, a cache layer, and all the maintenance that comes with them. Jekyll inverts that model. There is no runtime — there is a **build step**:

```
Markdown content + Liquid templates + config  →  jekyll build  →  _site/
```

Everything gets compiled ahead of time into plain HTML, CSS and a few JS files. GitHub Pages runs Jekyll natively, so deploying is literally `git push`: their servers run the same build and publish the output. No server code to patch, no database to back up, nothing to break at 3 AM.

## Content is filenames

Every post lives in `_posts/` with a mandatory naming convention:

```
_posts/2026-08-23-system-updates-qml-plugin.md
```

The date in the filename becomes the published date, and the slug becomes the URL — my `_config.yml` sets `permalink: /:title`, so that post lives at `/system-updates-qml-plugin`. No database IDs, no routing table; the filesystem *is* the CMS.

At the top of each file sits YAML front matter:

```yaml
---
layout: post
title: "Post Title"
author: "Alexandre Pascoal"
categories: [development]
tags: [linux, qml]
image: image-file.jpg   # optional hero image
---
```

Each field has a job: `layout` picks which template wraps the content, `categories` route the post onto category listing pages, `tags` render as buttons on the post and drive tag pages, and `image` sets the hero shown on the post header and home page card.

## Templates all the way down

Layouts compose like Russian dolls. `_layouts/default.html` is the skeleton — `<head>`, header, footer — and every other layout (`home`, `post`, `page`, `category`, `tag`) fills its {% raw %}`{{ content }}`{% endraw %} slot. Smaller reusable pieces live in `_includes/`: the publication date, the share bar, the comments embed, related posts. Wherever markup repeats, it is an include.

Gluing content to templates happens through [Liquid](https://shopify.github.io/liquid/), Jekyll's templating language. Liquid was originally built at [Shopify](https://shopify.github.io/liquid/) to power their storefront themes, and Jekyll borrowed it as its template engine. The whole language fits in two kinds of markup: {% raw %}`{{ expression }}`{% endraw %} is an *output tag* — it prints a value into the page — and {% raw %}`{% statement %}`{% endraw %} is a *logic tag*, doing control flow like loops, conditionals and includes. For example:

```liquid
{% raw %}{% for post in site.posts limit: 5 %}
  <a href="{{ post.url }}">{{ post.title }}</a>
{% endfor %}{% endraw %}
```

That loop is essentially the whole home page. Pagination (`jekyll-paginate`) slices `site.posts` into pages of five, and category/tag layouts run filtered versions of the same idea.

A `|` pipe applies a **filter** — a function that transforms a value before it is printed. Filters show up all over this site:

```liquid
{% raw %}{{ site.title | xml_escape }}        ← safe to embed inside XML (rss-feed.xml)
{{ post.date | date_to_rfc822 }}   ← "2026-08-23T00:00:00+01:00" → RFC-822 date
{{ tag | slugify }}                ← "GitHub Pages" becomes github-pages,
                                     matching the generated /tags/<slug> URLs{% endraw %}
```

Everything runs once, during the build: the visitor's browser never sees a single Liquid tag, only the finished HTML it produced. (And since Jekyll interprets Liquid *even inside code fences* like the ones above, each snippet had to be wrapped in a {% raw %}`{% raw %}`{% endraw %} tag — a logic tag whose entire job is turning Liquid off.)

## Styling: Sass with a front-matter trick

The CSS entry point is `assets/css/main.scss`, and its first line is the interesting part:

```scss
---
---
$base-font-family: 'Roboto', sans-serif;
@import "base", "code", "header", ...;
```

Those two dashes tell Jekyll "process this file" — without any front matter, Jekyll would copy it verbatim instead of compiling it. The partials it imports live in `_sass/`, roughly one per layout or include. The palette itself is defined as CSS custom properties (dark by default), so the light mode toggle is just a few lines of JS swapping a `data-theme="light"` attribute — the browser does the rest.

## Config vs data

Jekyll splits settings into two files, and knowing which one to edit saves time:

- **`_config.yml`** — build settings: enabled plugins, permalink shape, pagination count, and the canonical site address. Changing this requires a rebuild.
- **`_data/settings.yml`** — everything content-ish: menu entries, social links, comment system configuration, UI strings. Templates reach it through the `site.data.settings` namespace, which means you can add a social icon or reorder the menu without ever touching markup.

## Plugins and two feeds

Four plugins do quiet but essential work: `jekyll-paginate` for the home page, `jekyll-sitemap` for `sitemap.xml`, `jekyll-seo-tag` for meta/Open Graph tags, and `jekyll-feed`, which generates an Atom feed at `/feed.xml`.

There is a second feed too. The root file `rss-feed.xml` is a hand-written RSS 2.0 template whose only content is YAML front matter plus a Liquid loop over `site.posts` — Jekyll renders it into a real feed at build time. Both feeds are advertised in every page's `<head>` for autodiscovery, so pick whichever your reader prefers.

## The GitHub Pages constraint

Here is the one real gotcha of hosting on Pages: it runs Jekyll in **safe mode**, meaning custom plugins are ignored. Generators are the classic victim — normally a plugin would scan your tags and create `/tags/<slug>` pages on the fly. Here, that cannot happen.

The workaround is almost embarrassingly simple: a small Ruby script (`scripts/generate_tag_pages.rb`) reads the front matter of every post and writes out one tiny source file per tag — `pages/tag-jekyll.md`, `pages/tag-github-pages.md` — which get committed like any other content. Pre-generation instead of runtime generation.

Related discipline: `_config.yml` pins the production address (`url` + `baseurl`). Every absolute URL — feeds, sitemap, share links — derives from those two values, so they must stay in sync with the deployment path even for local builds.

## The local loop

Two commands cover day-to-day work:

```bash
npm run serve    # preview at localhost:4000
npm test         # builds into _site-test/, runs Playwright e2e specs
```

The preview strips the baseurl (`jekyll serve --baseurl ''`) because production asset links are root-relative — skip that flag and every stylesheet 404s. The test suite builds the site separately and serves it through a small static server that mimics GitHub Pages semantics (extensionless URLs, real 404 status), then runs end-to-end checks against real Chromium — pages, navigation, tags, theme toggle, and both feeds.

## Wrapping up

That is the whole trick: Markdown in, static HTML out, with conventions doing the heavy lifting. The full source is [on GitHub](https://github.com/alexandrepasc/software-field-notes), along with `docs/` guides covering posts, tags, categories and comments if you want to borrow any of it for your own corner of the internet.
