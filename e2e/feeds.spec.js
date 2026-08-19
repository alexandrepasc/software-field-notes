// Feeds and sitemap: generated correctly and list every post.
'use strict';

const { test, expect } = require('@playwright/test');
const { POST_PATHS, expectWellFormedXml } = require('./helpers');

test.describe('Feeds and sitemap', () => {
  test('feed.xml is well-formed Atom and lists every post', async ({ page, request }) => {
    await expectWellFormedXml(request, page, '/feed.xml', 'feed');

    const body = await (await request.get('/feed.xml')).text();
    for (const postPath of POST_PATHS) {
      expect(body, `feed.xml should link ${postPath}`).toContain(postPath);
    }
  });

  test('rss-feed.xml is well-formed RSS and lists every post', async ({ page, request }) => {
    await expectWellFormedXml(request, page, '/rss-feed.xml', 'rss');

    const body = await (await request.get('/rss-feed.xml')).text();
    for (const postPath of POST_PATHS) {
      expect(body, `rss-feed.xml should link ${postPath}`).toContain(postPath);
    }
  });

  test('sitemap.xml lists every post', async ({ page, request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.status()).toBe(200);
    const body = await response.text();

    const wellFormed = await page.evaluate((xml) => {
      const doc = new DOMParser().parseFromString(xml, 'application/xml');
      return doc.querySelector('parsererror') === null && doc.documentElement.tagName === 'urlset';
    }, body);
    expect(wellFormed).toBe(true);

    for (const postPath of POST_PATHS) {
      expect(body, `sitemap.xml should contain ${postPath}`).toContain(postPath);
    }
  });

  test('robots.txt points at the sitemap', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('Sitemap:');
    expect(body).toContain('/sitemap.xml');
  });
});
