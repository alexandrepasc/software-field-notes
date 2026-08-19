// Theme toggle: the only interactive JS on the site.
'use strict';

const { test, expect } = require('@playwright/test');

test.describe('Theme toggle', () => {
  test('defaults to dark theme with the sun icon', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('#theme-toggle .fa')).toHaveClass(/fa-sun-o/);
  });

  test('switches to light, persists across reloads, and switches back', async ({ page }) => {
    await page.goto('/');

    // Dark -> light.
    await page.locator('#theme-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('#theme-toggle .fa')).toHaveClass(/fa-moon-o/);
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('light');

    // Reload keeps light (persisted in localStorage).
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('#theme-toggle .fa')).toHaveClass(/fa-moon-o/);

    // Light -> dark.
    await page.locator('#theme-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('#theme-toggle .fa')).toHaveClass(/fa-sun-o/);
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');
  });
});
