import { expect, test } from '@playwright/test';

test('renders the no-file workbench shell', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('.app-shell')).toBeVisible();
  await expect(page.locator('.top-bar')).toContainText('FBX Inspector Workbench');
  await expect(page.getByRole('heading', { name: 'FBX Inspector Workbench' })).toBeVisible();
  await expect(page.locator('.scene-pane')).toContainText('Scene');
  await expect(page.locator('.inspector-pane')).toContainText('Inspector');
  await expect(page.locator('.viewport-empty')).toContainText('No FBX loaded');
  await expect(page.locator('.timeline-empty')).toContainText('No animation clips in the current file.');
  await expect(page.locator('.status-strip')).toContainText('No file loaded');
});

test('allows recovery at narrow viewport widths', async ({ page }) => {
  await page.setViewportSize({ width: 760, height: 720 });
  await page.goto('/');

  const metrics = await page.evaluate(() => ({
    bodyOverflowX: getComputedStyle(document.body).overflowX,
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));

  expect(metrics.documentWidth).toBeGreaterThan(metrics.viewportWidth);
  expect(metrics.bodyOverflowX).not.toBe('hidden');
});
