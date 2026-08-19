// Tag system: /tags index, per-tag pages, and header tag buttons on posts.
'use strict';

const { test, expect } = require('@playwright/test');
const { POST_PATHS, expectNoBrokenInternalLinks } = require('./helpers');

// Posts carrying the "documentation" tag (4 of 5 posts carry "sample").
const DOCUMENTATION_POSTS = ['/getting-started', '/learning-resources', '/welcome-to-millennial'];

function pathsOf(anchors) {
  return anchors.map((href) => new URL(href, 'http://127.0.0.1:4000').pathname);
}

test.describe('Tags', () => {
  test('index lists every tag as a button with its post count', async ({ page }) => {
    await page.goto('/tags');

    const buttons = page.locator('.tag-cloud .tag-button');
    await expect(buttons).toHaveCount(2);

    await expect(page.locator('.tag-cloud .tag-button', { hasText: 'documentation' })).toContainText('3');
    await expect(page.locator('.tag-cloud .tag-button', { hasText: 'sample' })).toContainText('5');
  });

  test('clicking a tag button opens that tag page', async ({ page }) => {
    await page.goto('/tags');
    await page.locator('.tag-cloud .tag-button', { hasText: 'sample' }).click();
    await expect(page).toHaveURL(/\/tags\/sample$/);
    await expect(page.locator('.post-content > h1')).toContainText('Tag: sample');
  });

  test('tag page lists every publication carrying that tag', async ({ page }) => {
    await page.goto('/tags/sample');
    const sampleHrefs = await page
      .locator('article > a[href]')
      .evaluateAll((anchors) => anchors.map((a) => a.getAttribute('href')));
    expect(pathsOf(sampleHrefs).sort()).toEqual([...POST_PATHS].sort());

    await page.goto('/tags/documentation');
    const docHrefs = await page
      .locator('article > a[href]')
      .evaluateAll((anchors) => anchors.map((a) => a.getAttribute('href')));
    expect(pathsOf(docHrefs).sort()).toEqual([...DOCUMENTATION_POSTS].sort());
  });

  test('tag page shows the post count and a link back to all tags', async ({ page }) => {
    await page.goto('/tags/sample');
    await expect(page.locator('.post-content > p.post-date')).toContainText(
      '5 publications tagged'
    );
    const backLink = page.locator('.post-content a[href]', { hasText: 'All tags' });
    await expect(backLink).toHaveAttribute('href', /\/tags$/);
  });

  test('posts show their tags as buttons right after the publication date', async ({ page }) => {
    await page.goto('/getting-started');
    const buttons = page.locator('.post-tags .tag-button');
    await expect(buttons).toHaveCount(2);

    const hrefs = await buttons.evaluateAll((anchors) => anchors.map((a) => a.getAttribute('href')));
    expect(pathsOf(hrefs).sort()).toEqual(['/tags/documentation', '/tags/sample'].sort());

    // The tag row must appear after the date and before the featured image.
    const order = await page.evaluate(() => {
      const content = document.querySelector('.post-content');
      const date = content.querySelector('.post-date');
      const tags = content.querySelector('.post-tags');
      const image = content.querySelector('.featured-image');
      const isBefore = (a, b) =>
        !!a && !!b && a.compareDocumentPosition(b) === Node.DOCUMENT_POSITION_FOLLOWING;
      return { dateBeforeTags: isBefore(date, tags), tagsBeforeImage: isBefore(tags, image) };
    });
    expect(order.dateBeforeTags).toBe(true);
    expect(order.tagsBeforeImage).toBe(true);
  });

  test('non-post pages show no tag buttons on the page body', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.post-tags')).toHaveCount(0);
    await page.goto('/about');
    await expect(page.locator('.post-tags')).toHaveCount(0);
  });

  test('tag pages have no broken internal links', async ({ page, request }) => {
    for (const path of ['/tags', '/tags/sample', '/tags/documentation']) {
      await page.goto(path);
      await expectNoBrokenInternalLinks(page, request);
    }
  });

  test('unknown tag URLs return the custom 404 page', async ({ page }) => {
    const response = await page.goto('/tags/no-such-tag');
    expect(response.status()).toBe(404);
    await expect(page).toHaveTitle(/Page not found/);
  });
});
