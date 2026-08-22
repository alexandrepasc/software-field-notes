# Comments (giscus)

How reader comments work on this site and how to reconfigure them.

## How it works

Comments are powered by [giscus](https://giscus.app), which stores every
comment as a GitHub Discussion in this repository — no third-party database,
no ads, no tracking.

- Each post maps to exactly **one Discussion**, matched by URL pathname.
  The thread is created automatically on the first comment or reaction.
- Visitors sign in with GitHub to comment; reactions work without signing in
  only if already authenticated through GitHub (reactions need a session too).
- The embed follows the site's dark/light toggle (`preferred_color_scheme`),
  loads lazily, and shows GitHub-style reactions.

## Current configuration

Everything lives in `_data/settings.yml`:

```yaml
giscus:
  enabled: true
  repo: 'alexandrepasc/software-field-notes'
  repo_id: 'R_kgDOT9_Ltw'
  category: 'Blog comments'
  category_id: 'DIC_kwDOT9_Lt84DD9hJ'
```

| Field | Meaning |
|-------|---------|
| `enabled` | Master switch. `false` renders no comment markup at all |
| `repo` | `owner/name` of the repository hosting the Discussions |
| `repo_id` | Repository GraphQL `node_id` (public API: `GET /repos/{owner}/{repo}` → `node_id`) |
| `category` | Discussion category that holds the post threads |
| `category_id` | Category GraphQL `node_id`, from the generator at <https://giscus.app> |

The embed itself is `_includes/giscus.html`, included from
`_layouts/post.html` right after the Disqus hook.

## Prerequisites (for a fresh setup)

1. Enable **Discussions** on the repository (Settings → General → Features).
2. Install the [giscus app](https://github.com/apps/giscus) on the repository.
3. Create a discussion category, ideally of type **Announcements** (only
   maintainers open threads; readers reply). This site uses `Blog comments`.
4. Pick the repository and category at <https://giscus.app> and copy the
   generated `data-repo-id` / `data-category-id` values into `settings.yml`.

## Moderation

Threads live in the repository's **Discussions** tab under *Blog comments*.
Edit, delete, lock, or convert them there exactly like any other discussion.

## Disabling

Set `enabled: false`. Note that `e2e/post.spec.js` pins the embed's presence
and its four data attributes while comments are enabled — flip that test
(or expect it red) when disabling.

## Gotchas

- **Never add a literal `.giscus` class** to any element on the page.
  giscus's client script treats an existing `.giscus` element as its mount
  container and *deletes all of its children* (including our own `<script>`
  tag) before injecting its iframe. Our section therefore uses
  `class="comments post-comments"`.
- **The category name must match its id.** giscus filters thread lookups by
  `category:"<name>"`; if `category` names a different category than the one
  owning `category_id`, lookups return nothing and the widget silently shows
  no threads.
