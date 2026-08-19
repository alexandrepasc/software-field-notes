# Tags

Tags are granular labels applied to posts. They appear as clickable buttons on each post and have their own browsing index at `/tags`.

## How tags work

1. A post declares tags in its front matter:
   ```yaml
   tags: [python, flask, tutorial]
   ```

2. Tags are rendered as buttons on the post page, right below the publication date (`_includes/post-tags.html`). Each button links to `/tags/<tag-slug>`.

3. The tag index at `/tags` (`pages/tags.md`) lists every tag used on the site with a count of posts per tag.

4. Each tag needs a source page in `pages/tag-<slug>.md`. For example, `pages/tag-python.md`:
   ```yaml
   ---
   layout: tag
   title: 'Tag: python'
   tag: python
   permalink: /tags/python
   ---
   ```

5. The tag layout (`_layouts/tag.html`) shows the tag name, a post count, and lists all posts that include that tag.

## Why manual tag pages are needed

GitHub Pages runs Jekyll in safe mode, which disables custom generator plugins. This means there is no plugin to automatically create tag pages. Each tag must have a source page committed to the repo.

## Generating tag pages

Instead of creating tag pages by hand, use the generation script:

```bash
bundle exec ruby scripts/generate_tag_pages.rb          # create missing tag pages
bundle exec ruby scripts/generate_tag_pages.rb --prune  # also remove pages for unused tags
```

The script:
- Scans all posts in `_posts/` and collects every tag
- Creates `pages/tag-<slug>.md` for any tag that doesn't already have one
- With `--prune`, deletes pages for tags no longer used by any post
- Is idempotent — safe to re-run at any time

Tag names are normalized with Jekyll's `slugify` filter (lowercase, spaces and symbols become hyphens), so the generated filenames match the links in templates.

## Tag slug examples

| Tag name | Slug | Page path | Permalink |
|----------|------|-----------|-----------|
| `python` | `python` | `pages/tag-python.md` | `/tags/python` |
| `Machine Learning` | `machine-learning` | `pages/tag-machine-learning.md` | `/tags/machine-learning` |
| `C++` | `c` | `pages/tag-c.md` | `/tags/c` |
| `web dev` | `web-dev` | `pages/tag-web-dev.md` | `/tags/web-dev` |

## Adding tags to a post

Add them in the post's front matter:

```yaml
---
layout: post
title: "My Post"
author: "Alexandre Pascoal"
categories: [documentation]
tags: [python, flask, tutorial]
---
```

Then run the tag generation script to create any new tag pages.

## Categories vs. tags

- **Categories** are broad groupings with dedicated listing pages. A post belongs to one or a few categories.
- **Tags** are granular labels. A post can have many tags. Tags appear as buttons on each post and have their own index at `/tags`.

Both are set in the post's front matter.
