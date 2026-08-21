// Shared helpers for the Software Field Notes e2e suite.
'use strict';

const { expect } = require('@playwright/test');

// Every post that exists in _posts/ (used by feed/home/category assertions).
// Permalinks follow `/:title`, i.e. the slug part of the filename.
const POST_PATHS = ['/system-updates-qml-plugin'];

// Treat localhost and 127.0.0.1 as the same origin so links to either host
// (Jekyll emits both depending on how site.github.url resolves) are matched.
function normalizedOrigin(urlString) {
  const url = new URL(urlString);
  if (url.hostname === 'localhost') {
    url.hostname = '127.0.0.1';
  }
  return url.origin;
}

function isInternalHref(href, pageUrl) {
  if (!href) {
    return false;
  }
  const raw = href.trim();
  if (raw === '' || raw.startsWith('#') || raw.startsWith('mailto:') || raw.startsWith('tel:')) {
    return false;
  }
  try {
    const resolved = new URL(raw, pageUrl);
    return normalizedOrigin(resolved.href) === normalizedOrigin(pageUrl);
  } catch {
    return false;
  }
}

// All internal (same-origin) anchor URLs on the current page, deduplicated.
async function collectInternalLinks(page) {
  const hrefs = await page.locator('a[href]').evaluateAll((anchors) =>
    anchors.map((a) => a.getAttribute('href'))
  );
  const pageUrl = page.url();
  const links = hrefs
    .filter((href) => isInternalHref(href, pageUrl))
    .map((href) => new URL(href, pageUrl).href);
  return [...new Set(links)];
}

// Asserts every internal link on the page returns a non-error status.
async function expectNoBrokenInternalLinks(page, request) {
  const links = await collectInternalLinks(page);
  const failures = [];
  for (const href of links) {
    const response = await request.get(href);
    if (response.status() >= 400) {
      failures.push(`${href} -> ${response.status()}`);
    }
  }
  expect(failures, failures.length ? `Broken internal links:\n${failures.join('\n')}` : undefined).toEqual([]);
}

// Asserts a URL responds 200 and its body parses as well-formed XML.
async function expectWellFormedXml(request, page, path, rootElement) {
  const response = await request.get(path);
  expect(response.status(), `${path} should return 200`).toBe(200);
  const body = await response.text();
  expect(body.trimStart().startsWith('<?xml'), `${path} should be XML`).toBe(true);

  // Parsing needs a DOM; run it in a real browser page.
  const wellFormed = await page.evaluate(
    ({ xml, root }) => {
      const doc = new DOMParser().parseFromString(xml, 'application/xml');
      const hasError = doc.querySelector('parsererror') !== null;
      const hasRoot = doc.documentElement && doc.documentElement.tagName === root;
      return { hasError, hasRoot };
    },
    { xml: body, root: rootElement }
  );
  expect(wellFormed.hasError, `${path} should be well-formed XML`).toBe(false);
  expect(wellFormed.hasRoot, `${path} should have <${rootElement}> root`).toBe(true);
}
module.exports = {
  POST_PATHS,
  collectInternalLinks,
  expectNoBrokenInternalLinks,
  expectWellFormedXml,
};
