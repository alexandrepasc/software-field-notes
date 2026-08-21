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

  test('featured cards without a front-matter image render plain backgrounds', async ({
    page,
    request,
  }) => {
    await page.goto('/');
    const cards = page.locator('.featured-post');
    await expect(cards.first()).toBeVisible();
    await expect(cards.first()).toContainText('Quickshell System Updates Plugin');

    // No post currently sets an `image:` front matter, so no card may carry a
    // background image. When a post adds one, extend this to assert each URL
    // loads with a 200 (the old "featured background images all load" test did).
    const urls = await cards.evaluateAll((cards) =>
      cards
        .map((card) => card.getAttribute('style') || '')
        .filter((style) => style.includes('background-image'))
        .map((style) => style.match(/url\(['"]?(.*?)['"]?\)/)?.[1])
        .filter(Boolean)
    );
    expect(urls).toEqual([]);
    expect(request); // keep the request fixture available for the extension above
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
});
