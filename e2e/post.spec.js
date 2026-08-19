// Post pages: title, date/author, featured image, share buttons, related posts.
'use strict';

const { test, expect } = require('@playwright/test');
const { expectNoBrokenInternalLinks } = require('./helpers');

test.describe('Post pages', () => {
  test('renders title, date and author', async ({ page }) => {
    await page.goto('/getting-started');
    await expect(page.locator('.post-content > h1')).toContainText('Getting Started');
    await expect(page.locator('.post-content > .post-date')).toContainText(
      'Written on October 10th, 2016 by Paul Le'
    );
  });

  test('renders the featured image', async ({ page, request }) => {
    await page.goto('/getting-started');
    const img = page.locator('.featured-image img');
    await expect(img).toBeVisible();
    const src = await img.getAttribute('src');
    const response = await request.get(src);
    expect(response.status(), `${src} should load`).toBe(200);
  });

  test('renders share buttons that open external targets', async ({ page }) => {
    await page.goto('/getting-started');
    const shares = page.locator('.post-share .sharing-icons a');
    await expect(shares).toHaveCount(2);
    const targets = await shares.evaluateAll((anchors) =>
      anchors.map((a) => a.getAttribute('target'))
    );
    expect(targets).toEqual(['_blank', '_blank']);
  });

  test('renders related posts for posts that share tags', async ({ page }) => {
    await page.goto('/getting-started');
    await expect(page.locator('.related h2')).toContainText('You may also enjoy');
    await expect(page.locator('.related-posts li').first()).toBeVisible();
  });

  test('has no broken internal links', async ({ page, request }) => {
    await page.goto('/getting-started');
    await expectNoBrokenInternalLinks(page, request);
  });
});
