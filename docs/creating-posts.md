# Creating Posts

Step-by-step guide to add a new publication to the site.

## 1. Create the post file

Create a file in `_posts/` with the naming convention:

```
YYYY-MM-DD-slug-title.md
```

For example: `_posts/2026-08-17-my-new-post.md`

The **date** in the filename determines the published date. The **slug** becomes the permalink (`/my-new-post`).

## 2. Add front matter

Every post needs YAML front matter at the top:

```yaml
---
layout: post
title: "Your Post Title"
author: "Alexandre Pascoal"
categories: [documentation]
tags: [tag1, tag2]
image: image-file.jpg   # optional, must exist in assets/img/
---
```

### Front matter fields

| Field | Required | Description |
|-------|----------|-------------|
| `layout` | Yes | Always `post` |
| `title` | Yes | Post title, shown in the header and home page |
| `author` | Yes | Author name |
| `categories` | Yes | One or more categories. Each category must have a matching page in `pages/` (e.g. `pages/documentation.md`). See [Available categories](#available-categories) below |
| `tags` | Yes | Free-form tags, shown as buttons on the post. After adding new tags, run the tag generation script (step 4) |
| `image` | No | Featured image filename. Must exist in `assets/img/`. Displayed on the home page and post header |

## 3. Write the content

Write your post body in Markdown below the front matter. Supported features:

- Standard Markdown (headings, lists, links, code blocks, tables)
- MathJax (`$$` blocks for LaTeX math)
- Syntax-highlighted code blocks (rouge)
- Embedded HTML (iframes, etc.)

### Adding images to post content

Place image files in `assets/img/` and reference them in your post body.

**Markdown:**

```markdown
![Alt text]({{ site.github.url }}/assets/img/my-image.jpg)
```

**HTML (for more control over size/alignment):**

```html
<img src="{{ site.github.url }}/assets/img/my-image.jpg" alt="Alt text" />
```

This is separate from the `image:` front matter field, which controls only the featured/hero image at the top of the post.

## 4. Generate tag pages

If you introduced **new tags**, run:

```bash
bundle exec ruby scripts/generate_tag_pages.rb
```

This creates `pages/tag-<slug>.md` files for any new tags. If you also removed tags, use `--prune` to clean up stale pages:

```bash
bundle exec ruby scripts/generate_tag_pages.rb --prune
```

## 5. Build and test

```bash
bundle exec jekyll build   # validate the site builds cleanly
npm test                   # run e2e tests
```

## Available categories

Categories must have a matching page in `pages/` with `layout: category`. Current categories:

| Category | Page | Permalink |
|----------|------|-----------|
| `documentation` | `pages/documentation.md` | `/documentation` |
| `facts` | `pages/facts.md` | `/facts` |
| `resources` | `pages/resources.md` | `/resources` |

To add a new category, create `pages/<category>.md` with:

```yaml
---
layout: category
title: Category Name
category: category-slug
permalink: /category-slug
---
```

Then reference the same slug in your post's `categories` field.

## Cleanup: removing example posts

The theme ships with example posts in `_posts/`. Remove them before publishing real content:

- `_posts/2017-01-01-welcome-to-millennial.md`
- `_posts/2016-10-10-getting-started.md`
- `_posts/2016-09-09-text-formatting.md`
- `_posts/2016-05-05-learning-resources.md`
- `_posts/2016-04-04-about-the-author.md`

After removing, run the tag script with `--prune` to clean up orphaned tag pages:

```bash
bundle exec ruby scripts/generate_tag_pages.rb --prune
```
