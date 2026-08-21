// Post pages: title, date/author, images, share buttons, related posts.
'use strict';

const { test, expect } = require('@playwright/test');
const { POST_PATHS, expectNoBrokenInternalLinks } = require('./helpers');

const POST_PATH = POST_PATHS[0];

test.describe('Post pages', () => {
  test('renders title, date and author', async ({ page }) => {
    await page.goto(POST_PATH);
    await expect(page.locator('.post-content > h1')).toContainText(
      'Quickshell System Updates Plugin'
    );
    await expect(page.locator('.post-content > .post-date')).toContainText(
      'Written on August 22nd, 2026 by Alexandre Pascoal'
    );
  });

  test('renders inline content images and no featured-image block', async ({ page, request }) => {
    await page.goto(POST_PATH);

    // The post sets no `image:` front matter, so there must be no featured block…
    await expect(page.locator('.featured-image')).toHaveCount(0);

    // …but images embedded in the markdown body still have to resolve.
    const img = page.locator('.post-content article img').first();
    await expect(img).toBeVisible();
    const src = await img.getAttribute('src');
    const response = await request.get(src);
    expect(response.status(), `${src} should load`).toBe(200);
  });

  test('renders share buttons that open external targets', async ({ page }) => {
    await page.goto(POST_PATH);
    const shares = page.locator('.post-share .sharing-icons a');
    await expect(shares).toHaveCount(2);
    const targets = await shares.evaluateAll((anchors) =>
      anchors.map((a) => a.getAttribute('target'))
    );
    expect(targets).toEqual(['_blank', '_blank']);
  });

  test('related-posts section stays empty while only one post exists', async ({ page }) => {
    await page.goto(POST_PATH);
    await expect(page.locator('.related h2')).toContainText('You may also enjoy');
    // Related posts are other posts sharing tags; there is nothing else yet.
    await expect(page.locator('.related-posts li')).toHaveCount(0);
  });

  test('has no broken internal links', async ({ page, request }) => {
    await page.goto(POST_PATH);
    await expectNoBrokenInternalLinks(page, request);
  });
});
