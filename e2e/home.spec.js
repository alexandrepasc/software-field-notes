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

  test('featured background images all load', async ({ page, request }) => {
    await page.goto('/');
    const urls = await page.locator('.featured-post').evaluateAll((cards) =>
      cards
        .map((card) => card.getAttribute('style') || '')
        .filter((style) => style.includes('background-image'))
        .map((style) => style.match(/url\(['"]?(.*?)['"]?\)/)?.[1])
        .filter(Boolean)
    );
    expect(urls.length).toBe(POST_PATHS.length);

    for (const url of urls) {
      const response = await request.get(url);
      expect(response.status(), `${url} should load`).toBe(200);
    }
  });

  test('has no broken internal links', async ({ page, request }) => {
    await page.goto('/');
    await expectNoBrokenInternalLinks(page, request);
  });

  test('has no pagination links with only five posts', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.pagination')).toBeVisible();
    // All posts fit on one page (paginate: 5), so the buttons are spans, not links.
    await expect(page.locator('.pagination a')).toHaveCount(0);
  });
});
