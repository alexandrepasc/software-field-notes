// Home page: featured posts, background images, pagination, link integrity.
'use strict';

const { test, expect } = require('@playwright/test');
const { POST_PATHS, expectNoBrokenInternalLinks } = require('./helpers');

test.describe('Home page', () => {
  test('has the site title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Software Field Notes/);
  });

  test('shows every post as a featured card linking to it', async ({ page }) => {
    await page.goto('/');
    const links = page.locator('article > a[href]');
    await expect(links).toHaveCount(POST_PATHS.length);

    const hrefs = await links.evaluateAll((anchors) => anchors.map((a) => a.getAttribute('href')));
    const paths = hrefs.map((href) => new URL(href, page.url()).pathname);
    expect([...paths].sort()).toEqual([...POST_PATHS].sort());
  });

  test('featured cards carry their front-matter image as a loading background', async ({
    page,
    request,
  }) => {
    await page.goto('/');
    const cards = page.locator('.featured-post');
    await expect(cards.first()).toBeVisible();
    await expect(cards.first()).toContainText('Quickshell System Updates Plugin');

    // Every post currently sets an `image:` front matter, so every card must
    // carry a background image — and each URL has to actually resolve.
    // (If a future post ships without one, split this into per-card checks:
    // image posts carry url(...), image-less ones stay plain.)
    const urls = await cards.evaluateAll((cards) =>
      cards
        .map((card) => card.getAttribute('style') || '')
        .filter((style) => style.includes('background-image'))
        .map((style) => style.match(/url\(['"]?(.*?)['"]?\)/)?.[1])
        .filter(Boolean)
    );
    expect(urls).toHaveLength(POST_PATHS.length);
    for (const url of urls) {
      const response = await request.get(url);
      expect(response.status(), `${url} should load`).toBe(200);
    }

    // The card forces the whole image into its own box: 100% 100% shows the
    // picture completely (cover would crop ~44% of a 3:2 hero) without
    // letterboxing (contain).
    const sizes = await cards.evaluateAll((cards) =>
      cards.map((card) => getComputedStyle(card).backgroundSize)
    );
    expect(sizes).toHaveLength(POST_PATHS.length);
    for (const size of sizes) {
      expect(size).toBe('100% 100%');
    }
  });

  test('has no broken internal links', async ({ page, request }) => {
    await page.goto('/');
    await expectNoBrokenInternalLinks(page, request);
  });

  test('has no pagination links with a single post', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.pagination')).toBeVisible();
    // All posts fit on one page (paginate: 5), so the buttons are spans, not links.
    await expect(page.locator('.pagination a')).toHaveCount(0);
  });

  test('footer links to X with the Font Awesome 6 brand icon', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('footer a[href="https://x.com/alexandrepasc"]');
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute('target', '_blank');

    // footer.html renders `class="fa fa-{{ item.icon }}"`; the 'brands fa-x-twitter'
    // setting must yield both the FA 6 family class and the X glyph class.
    const iconClasses = await link.locator('i').getAttribute('class');
    expect(iconClasses).toContain('fa-brands');
    expect(iconClasses).toMatch(/(^|\s)fa-x-twitter(\s|$)/);
  });

  test('footer links Mastodon and LinkedIn with Font Awesome 6 brand icons', async ({
    page,
  }) => {
    await page.goto('/');

    const linkedin = page.locator(
      'footer a[href="https://www.linkedin.com/in/alexandre-pascoal-b7199680/"]'
    );
    await expect(linkedin).toHaveCount(1);
    await expect(linkedin).toHaveAttribute('target', '_blank');
    const linkedinClasses = await linkedin.locator('i').getAttribute('class');
    expect(linkedinClasses).toContain('fa-brands');
    expect(linkedinClasses).toMatch(/(^|\s)fa-linkedin(\s|$)/);

    const mastodon = page.locator(
      'footer a[href="https://mastodon.world/@alexandre_pascoal"]'
    );
    await expect(mastodon).toHaveCount(1);
    await expect(mastodon).toHaveAttribute('target', '_blank');
    const mastodonClasses = await mastodon.locator('i').getAttribute('class');
    expect(mastodonClasses).toContain('fa-brands');
    expect(mastodonClasses).toMatch(/(^|\s)fa-mastodon(\s|$)/);
  });

  test('footer credits Jekyll and the Millennial theme', async ({ page }) => {
    await page.goto('/');
    // A2: dedicated muted credits line under the site description.
    const credits = page.locator('.footer-credits');
    await expect(credits).toContainText('Powered by');
    await expect(credits).toContainText('Theme:');
    const jekyll = credits.locator('a[href="https://jekyllrb.com/"]');
    await expect(jekyll).toHaveCount(1);
    await expect(jekyll).toHaveAttribute('rel', 'noopener');
    const millennial = credits.locator('a[href="https://github.com/LeNPaul/Millennial"]');
    await expect(millennial).toHaveCount(1);
    await expect(millennial).toHaveAttribute('target', '_blank');
  });

  test('footer renders daily.dev as an inline SVG brand mark', async ({ page }) => {
    await page.goto('/');
    // daily.dev has no Font Awesome glyph, so settings.yml carries `svg_path`
    // and social-link.html renders it as an inline SVG instead of an <i>.
    const link = page.locator('footer a[href="https://daily.dev/alexandrepascoal"]');
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute('target', '_blank');
    const svg = link.locator('svg.social-svg.fa-dailydev');
    await expect(svg).toHaveCount(1);
    // viewBox is cropped to the path's ink bounds so CSS baseline alignment
    // seats the mark exactly like the font glyph siblings.
    expect(await svg.getAttribute('viewBox')).toBe('0 5.2945 24 13.411');
    expect(await svg.locator('path').getAttribute('d')).toMatch(/^M18\.29 /);
  });
});
