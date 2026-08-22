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
    await expect(shares).toHaveCount(5);
    const targets = await shares.evaluateAll((anchors) =>
      anchors.map((a) => a.getAttribute('target'))
    );
    expect(targets).toEqual(['_blank', '_blank', '_blank', '_blank', '_blank']);

    // Icon order mirrors the social list in _data/settings.yml
    // (X, Mastodon, LinkedIn, daily.dev); Facebook is share-only.
    const networks = await shares.evaluateAll((anchors) =>
      anchors.map((a) => {
        const p = [
          'https://x.com/intent/tweet',
          'https://www.facebook.com/sharer',
          'https://share.joinmastodon.org/',
          'https://www.linkedin.com/sharing/share-offsite/',
          'https://app.daily.dev/suggest',
        ];
        return p.find((prefix) => a.getAttribute('href').startsWith(prefix));
      })
    );
    expect(networks).toEqual([
      'https://x.com/intent/tweet',
      'https://share.joinmastodon.org/',
      'https://www.linkedin.com/sharing/share-offsite/',
      'https://app.daily.dev/suggest',
      'https://www.facebook.com/sharer',
    ]);

    // X replaced the legacy twitter.com intent; brand glyphs come from FA 6.
    const x = page.locator(
      '.post-share .sharing-icons a[href^="https://x.com/intent/tweet?"]'
    );
    await expect(x).toHaveCount(1);
    const xClasses = await x.locator('i').getAttribute('class');
    expect(xClasses).toContain('fa-brands');
    expect(xClasses).toMatch(/(^|\s)fa-x-twitter(\s|$)/);

    await expect(
      page.locator('.post-share .sharing-icons a[href^="https://www.facebook.com/sharer/sharer.php?"]')
    ).toHaveCount(1);
    await expect(
      page.locator('.post-share .sharing-icons a[href^="https://www.linkedin.com/sharing/share-offsite/"]')
    ).toHaveCount(1);
    const mastodon = page.locator(
      '.post-share .sharing-icons a[href^="https://share.joinmastodon.org/#text="]'
    );
    await expect(mastodon).toHaveCount(1);

    // The official share widget takes a #text= fragment (never sent to any
    // server); it must decode to "<title>\n\n<canonical post URL>".
    // URLSearchParams mirrors how share.joinmastodon.org parses the hash.
    const mastoHref = await mastodon.getAttribute('href');
    const sharedText = new URLSearchParams(
      mastoHref.slice(mastoHref.indexOf('#') + 1)
    ).get('text');
    expect(sharedText).toBe(
      'Quickshell System Updates Plugin\n\n' +
        'https://alexandrepasc.github.io/software-field-notes/system-updates-qml-plugin'
    );

    // daily.dev has no share-intent API: the button opens their source
    // suggestion form and renders the inline-SVG brand mark.
    const dailydev = page.locator(
      '.post-share .sharing-icons a[href="https://app.daily.dev/suggest"]'
    );
    await expect(dailydev).toHaveCount(1);
    const svg = dailydev.locator('svg.social-svg.fa-dailydev');
    await expect(svg).toHaveCount(1);
    expect(await svg.getAttribute('viewBox')).toBe('0 5.2945 24 13.411');
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
