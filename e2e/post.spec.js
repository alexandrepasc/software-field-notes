// Post pages: title, date/author, images, share buttons, related posts.
'use strict';

const { test, expect } = require('@playwright/test');
const { expectNoBrokenInternalLinks } = require('./helpers');

// The older post carries the detailed share/giscus assertions; the sway-modes
// and gimp posts get their own tests below (title/date/hero, inline images,
// related posts). POST_PATHS in helpers.js keeps all three for the
// home/category/tag/feed assertions.
const POST_PATH = '/system-updates-qml-plugin';
const SWAY_POST_PATH = '/sway-modes-qml-plugin';
// Newest post, and the only one in the tools category. It carries four
// generated images (the results comparison) plus its own hero.
const GIMP_POST_PATH = '/gimp-mcp-experiment';
const GIMP_ASSETS = '/assets/img/2026-09-28-gimp-mcp-experiment/';

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

  test('related-posts link to the other posts sharing tags', async ({ page }) => {
    // _includes/related-posts.html walks the post's tags in front-matter
    // order, takes the two newest posts per tag, and skips ones it already
    // listed, so the three posts are no longer symmetric. Order per post:
    //   gimp   -> linux tag yields sway (ai/mcp/gimp only yield itself)
    //   sway   -> linux yields gimp, then qml yields system-updates
    //   system -> linux yields gimp and sway in one pass
    for (const [path, relatedPaths] of [
      [GIMP_POST_PATH, [SWAY_POST_PATH]],
      [SWAY_POST_PATH, [GIMP_POST_PATH, POST_PATH]],
      [POST_PATH, [GIMP_POST_PATH, SWAY_POST_PATH]],
    ]) {
      await page.goto(path);
      await expect(page.locator('.related h2')).toContainText('You may also enjoy');
      const items = page.locator('.related-posts li a');
      const hrefs = await items.evaluateAll((anchors) =>
        anchors.map((a) => a.getAttribute('href'))
      );
      expect(
        hrefs.map((href) => new URL(href, page.url()).pathname),
        `${path} related posts`
      ).toEqual(relatedPaths);
    }
  });

  test('sway modes post renders title, date, author and its hero image', async ({
    page,
    request,
  }) => {
    await page.goto(SWAY_POST_PATH);
    await expect(page.locator('.post-content > h1')).toContainText(
      'Quickshell Sway Modes Plugin'
    );
    await expect(page.locator('.post-content > .post-date')).toContainText(
      'Written on August 30th, 2026 by Alexandre Pascoal'
    );

    // The post sets `image:` front matter, so it renders a featured block
    // whose image resolves and whose alt falls back to the post title.
    const featured = page.locator('.featured-image img');
    await expect(featured).toHaveCount(1);
    const featuredSrc = await featured.getAttribute('src');
    const featuredResponse = await request.get(featuredSrc);
    expect(featuredResponse.status(), `${featuredSrc} should load`).toBe(200);
    await expect(featured).toHaveAttribute('alt', 'Quickshell Sway Modes Plugin');
  });

  test('sway modes post shows its bar screenshots in the Solution section', async ({
    page,
    request,
  }) => {
    await page.goto(SWAY_POST_PATH);

    // Both bar screenshots are embedded in the body and must resolve.
    const imgs = page.locator('.post-content article img');
    await expect(imgs).toHaveCount(2);
    const srcs = await imgs.evaluateAll((imgs) => imgs.map((img) => img.getAttribute('src')));
    for (const src of srcs) {
      expect(src, 'inline images use the per-post asset folder').toContain(
        '/assets/img/2026-08-30-sway-modes-qml-plugin/'
      );
      const response = await request.get(src);
      expect(response.status(), `${src} should load`).toBe(200);
    }

    // This plugin has no settings panel, so no settings screenshot may remain.
    await expect(
      page.locator('.post-content article img[src*="settings.png"]')
    ).toHaveCount(0);

    // They illustrate the Solution paragraph: both must sit before the
    // "Resolution" heading.
    const placement = await page.evaluate(() => {
      const article = document.querySelector('.post-content article');
      const imgs = article.querySelectorAll('img');
      const resolution = [...article.querySelectorAll('h2')].find(
        (h) => h.textContent === 'Resolution'
      );
      const beforeResolution = (img) =>
        !!resolution &&
        img.compareDocumentPosition(resolution) === Node.DOCUMENT_POSITION_FOLLOWING;
      return [...imgs].map(beforeResolution);
    });
    expect(placement.every(Boolean)).toBe(true);
  });

  test('gimp mcp post renders title, date, author, hero and its four result images', async ({
    page,
    request,
  }) => {
    await page.goto(GIMP_POST_PATH);
    await expect(page.locator('.post-content > h1')).toContainText('GIMP MCP Experiment');
    await expect(page.locator('.post-content > .post-date')).toContainText(
      'Written on September 28th, 2026 by Alexandre Pascoal'
    );

    // `image:` front matter renders a featured block whose image resolves
    // and whose alt falls back to the post title.
    const featured = page.locator('.featured-image img');
    await expect(featured).toHaveCount(1);
    const featuredSrc = await featured.getAttribute('src');
    expect((await request.get(featuredSrc)).status(), `${featuredSrc} should load`).toBe(200);
    await expect(featured).toHaveAttribute('alt', 'GIMP MCP Experiment');

    // The four generated result images are embedded in the body (Results
    // section) and all live in the post's own asset folder.
    const imgs = page.locator('.post-content article img');
    await expect(imgs).toHaveCount(4);
    const srcs = await imgs.evaluateAll((imgs) => imgs.map((img) => img.getAttribute('src')));
    for (const src of srcs) {
      expect(src, 'inline images use the per-post asset folder').toContain(GIMP_ASSETS);
      expect((await request.get(src)).status(), `${src} should load`).toBe(200);
    }
    // The hero is front matter, so it must not also appear in the body.
    await expect(page.locator('.post-content article img[src*="hero.jpg"]')).toHaveCount(0);

    // The Results matrix is a 4-column table (header + 4 attempts).
    const rows = page.locator('.post-content article table tr');
    await expect(rows).toHaveCount(5);
    await expect(rows.first().locator('th')).toHaveCount(4);
    for (const cell of await rows.first().locator('th').evaluateAll((t) => t.map((e) => e.textContent.trim()))) {
      expect(cell).not.toBe('');
    }
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
