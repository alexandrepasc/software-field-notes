// Navigation: menu links, category pages, and the custom 404 page.
'use strict';

const { test, expect } = require('@playwright/test');
const { expectNoBrokenInternalLinks } = require('./helpers');

test.describe('Navigation', () => {
  test('menu links in the header navigate to their pages', async ({ page }) => {
    await page.goto('/');

    const about = page.locator('header .menu-list a', { hasText: 'About' });
    await expect(about).toBeVisible();
    await about.click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.locator('.page-content h1')).toContainText('About');

    const contact = page.locator('header .menu-list a', { hasText: 'Contact' });
    await contact.click();
    await expect(page).toHaveURL(/\/contact$/);
    await expect(page.locator('.page-content h1')).toContainText('Contact');
  });

  test('category pages render the posts in their category', async ({ page }) => {
    const cases = [
      { path: '/development', title: 'Development', expectedPost: '/system-updates-qml-plugin' },
    ];

    for (const { path, title, expectedPost } of cases) {
      await page.goto(path);
      await expect(page).toHaveTitle(new RegExp(title));

      const links = page.locator('article > a[href]');
      await expect(links.first()).toBeVisible();
      const hrefs = await links.evaluateAll((anchors) =>
        anchors.map((a) => a.getAttribute('href'))
      );
      expect(hrefs.map((href) => new URL(href, page.url()).pathname)).toContain(expectedPost);
    }
  });

  test('unknown URLs serve the custom 404 page with a 404 status', async ({ page }) => {
    const response = await page.goto('/no-such-page-here');
    expect(response.status()).toBe(404);
    await expect(page).toHaveTitle(/Page not found/);
    await expect(page.locator('body')).toContainText("we've misplaced that URL");
  });

  test('category pages have no broken internal links', async ({ page, request }) => {
    for (const path of ['/development']) {
      await page.goto(path);
      await expectNoBrokenInternalLinks(page, request);
    }
  });
});
