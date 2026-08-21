// Tag system: /tags index, per-tag pages, and header tag buttons on posts.
'use strict';

const { test, expect } = require('@playwright/test');
const { POST_PATHS, expectNoBrokenInternalLinks } = require('./helpers');

// Every tag currently in use; the single post carries all of them.
const TAGS = ['dms', 'linux', 'qml', 'quickshell'];
const TAG_PAGE_PATHS = TAGS.map((tag) => `/tags/${tag}`);

function pathsOf(anchors) {
  return anchors.map((href) => new URL(href, 'http://127.0.0.1:4173').pathname);
}

test.describe('Tags', () => {
  test('index lists every tag as a button with its post count', async ({ page }) => {
    await page.goto('/tags');

    const buttons = page.locator('.tag-cloud .tag-button');
    await expect(buttons).toHaveCount(TAGS.length);

    for (const tag of TAGS) {
      await expect(page.locator('.tag-cloud .tag-button', { hasText: tag })).toContainText('1');
    }
  });

  test('clicking a tag button opens that tag page', async ({ page }) => {
    await page.goto('/tags');
    await page.locator('.tag-cloud .tag-button', { hasText: 'linux' }).click();
    await expect(page).toHaveURL(/\/tags\/linux$/);
    await expect(page.locator('.post-content > h1')).toContainText('Tag: linux');
  });

  test('tag page lists every publication carrying that tag', async ({ page }) => {
    for (const path of TAG_PAGE_PATHS) {
      await page.goto(path);
      const hrefs = await page
        .locator('article > a[href]')
        .evaluateAll((anchors) => anchors.map((a) => a.getAttribute('href')));
      expect(pathsOf(hrefs)).toEqual([...POST_PATHS]);
    }
  });

  test('tag page shows the post count and a link back to all tags', async ({ page }) => {
    await page.goto('/tags/linux');
    // Singular wording comes straight from _layouts/tag.html (count === 1).
    await expect(page.locator('.post-content > p.post-date')).toContainText('1 publication tagged');
    const backLink = page.locator('.post-content a[href]', { hasText: 'All tags' });
    await expect(backLink).toHaveAttribute('href', /\/tags$/);
  });

  test('posts show their tags as buttons right after the publication date', async ({ page }) => {
    await page.goto(POST_PATHS[0]);
    const buttons = page.locator('.post-tags .tag-button');
    await expect(buttons).toHaveCount(TAGS.length);

    const hrefs = await buttons.evaluateAll((anchors) => anchors.map((a) => a.getAttribute('href')));
    expect(pathsOf(hrefs).sort()).toEqual([...TAG_PAGE_PATHS].sort());

    // The tag row must appear after the date and before the post body.
    const order = await page.evaluate(() => {
      const content = document.querySelector('.post-content');
      const date = content.querySelector('.post-date');
      const tags = content.querySelector('.post-tags');
      const body = content.querySelector('article');
      const isBefore = (a, b) =>
        !!a && !!b && a.compareDocumentPosition(b) === Node.DOCUMENT_POSITION_FOLLOWING;
      return { dateBeforeTags: isBefore(date, tags), tagsBeforeBody: isBefore(tags, body) };
    });
    expect(order.dateBeforeTags).toBe(true);
    expect(order.tagsBeforeBody).toBe(true);
  });

  test('non-post pages show no tag buttons on the page body', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.post-tags')).toHaveCount(0);
    await page.goto('/about');
    await expect(page.locator('.post-tags')).toHaveCount(0);
  });

  test('tag pages have no broken internal links', async ({ page, request }) => {
    for (const path of ['/tags', ...TAG_PAGE_PATHS]) {
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
