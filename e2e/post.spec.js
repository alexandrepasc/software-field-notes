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
      'Written on August 23rd, 2026 by Alexandre Pascoal'
    );
  });

  test('renders the featured image and inline content images', async ({ page, request }) => {
    await page.goto(POST_PATH);

    // The post sets `image:` front matter, so the theme renders a featured
    // block above the article; its image must resolve. D1: the alt falls
    // back to the post title — it must never be empty.
    const featured = page.locator('.featured-image img');
    await expect(featured).toHaveCount(1);
    const featuredSrc = await featured.getAttribute('src');
    const featuredResponse = await request.get(featuredSrc);
    expect(featuredResponse.status(), `${featuredSrc} should load`).toBe(200);
    await expect(featured).toHaveAttribute('alt', 'Quickshell System Updates Plugin');

    // Images embedded in the markdown body must resolve too.
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
          'https://daily.dev/',
        ];
        return p.find((prefix) => a.getAttribute('href').startsWith(prefix));
      })
    );
    expect(networks).toEqual([
      'https://x.com/intent/tweet',
      'https://share.joinmastodon.org/',
      'https://www.linkedin.com/sharing/share-offsite/',
      'https://daily.dev/',
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

    // daily.dev has no share-intent API: the button uses their documented
    // "prepend daily.dev/" shortcut, which lands on their Squad composer with
    // the canonical post URL prefilled, and renders the inline-SVG brand mark.
    const dailydev = page.locator(
      '.post-share .sharing-icons a[href^="https://daily.dev/https://"]'
    );
    await expect(dailydev).toHaveCount(1);
    expect(await dailydev.getAttribute('href')).toBe(
      'https://daily.dev/https://alexandrepasc.github.io/software-field-notes/system-updates-qml-plugin'
    );
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

  test('renders the giscus comments embed with the configured repository', async ({ page }) => {
    await page.goto(POST_PATH);
    // Disqus stays off; comments come from giscus (_data/settings.yml ->
    // giscus.enabled). Offline-friendly: only the embed markup is asserted,
    // never the CDN script's execution. The attribute values pin the config
    // against accidental edits, since a category name/ID mismatch makes
    // giscus silently show no threads.
    await expect(page.locator('.disqus')).toHaveCount(0);
    const section = page.locator('section.comments.post-comments');
    await expect(section).toHaveCount(1);
    const embed = section.locator('script[src="https://giscus.app/client.js"]');
    await expect(embed).toHaveCount(1);
    await expect(embed).toHaveAttribute('data-repo', 'alexandrepasc/software-field-notes');
    await expect(embed).toHaveAttribute('data-repo-id', 'R_kgDOT9_Ltw');
    await expect(embed).toHaveAttribute('data-category', 'Blog comments');
    await expect(embed).toHaveAttribute('data-category-id', 'DIC_kwDOT9_Lt84DD9hJ');
  });

  test('has no broken internal links', async ({ page, request }) => {
    await page.goto(POST_PATH);
    await expectNoBrokenInternalLinks(page, request);
  });
});
