# Categories

Categories are grouping labels for posts. Each category has a dedicated page that lists all posts assigned to it.

## How categories work

1. A post declares categories in its front matter:
   ```yaml
   categories: [documentation, facts]
   ```

2. Each category needs a matching page in `pages/` with `layout: category`. For example, `pages/documentation.md`:
   ```yaml
   ---
   layout: category
   title: Documentation
   category: documentation
   permalink: /documentation
   ---
   ```

3. The category layout (`_layouts/category.html`) iterates over all posts and renders only those whose `categories` contain the page's `category` value.

4. A post can belong to **multiple categories** — it will appear on all matching category pages.

## Current categories

| Category | Page | Permalink |
|----------|------|-----------|
| `documentation` | `pages/documentation.md` | `/documentation` |
| `facts` | `pages/facts.md` | `/facts` |
| `resources` | `pages/resources.md` | `/resources` |

Note: `pages/documentation.md` currently has its front matter **commented out** — it is inactive. Uncomment it to enable the category.

## Adding a new category

1. Create `pages/<category-slug>.md` with:
   ```yaml
   ---
   layout: category
   title: Category Name
   category: category-slug
   permalink: /category-slug
   ---
   ```

2. Reference that slug in your posts:
   ```yaml
   categories: [category-slug]
   ```

3. Optionally add it to the site menu in `_data/settings.yml`:
   ```yaml
   menu:
     - {name: 'Category Name', url: 'category-slug'}
   ```

## Showing categories in the navigation menu

Category pages are not in the site menu by default. To add one, uncomment or add an entry in `_data/settings.yml` under `menu`:

```yaml
menu:
  - {name: 'Documentation', url: 'documentation'}
  - {name: 'Facts',         url: 'facts'}
  - {name: 'About',         url: 'about'}
```

## Categories vs. tags

- **Categories** are broad groupings. A post belongs to one or a few categories. Categories have dedicated listing pages.
- **Tags** are granular labels. A post can have many tags. Tags appear as buttons on each post and have their own index at `/tags`.

Both are set in the post's front matter. Use categories for the main topics of your blog, and tags for cross-cutting topics.
