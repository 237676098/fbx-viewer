import { expect, test } from '@playwright/test';

test('renders the no-file workbench shell', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('.app-shell')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'FBX Inspector Workbench' })).toBeVisible();

  await expect(page.getByLabel('FBX inspector workbench')).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Scene' })).toBeVisible();
  await expect(page.getByLabel('Viewport and animation')).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Inspector' })).toBeVisible();
  await expect(page.getByLabel('Choose FBX file')).toBeAttached();

  await expect(page.locator('.viewport-empty')).toContainText(/No FBX loaded/i);
  await expect(page.locator('.viewport-empty')).toContainText(/choose or drop/i);
  await expect(page.locator('.timeline-empty')).toContainText('No animation clips in the current file.');
  await expect(page.locator('.inspector-panel')).toBeVisible();
  await expect(page.locator('.inspector-empty')).toContainText('No inspector data');
  await expect(page.locator('.status-strip')).toContainText('No file loaded');
});

test('shows validation feedback for non-FBX file input', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('Choose FBX file').setInputFiles({
    name: 'not-a-model.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('plain text is not an fbx asset'),
  });

  await expect(page.locator('.status-strip')).toContainText(/Please choose a \.fbx file\./i);
  await expect(page.locator('.viewport-empty')).toContainText(/No FBX loaded/i);
  await expect(page.locator('.inspector-empty')).toContainText('No inspector data');
});

test('allows recovery at narrow viewport widths', async ({ page }) => {
  await page.setViewportSize({ width: 760, height: 720 });
  await page.goto('/');

  const metrics = await page.evaluate(() => ({
    bodyOverflowX: getComputedStyle(document.body).overflowX,
    shellWidth: document.querySelector('.app-shell')?.scrollWidth ?? 0,
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));

  expect(metrics.documentWidth).toBeGreaterThan(metrics.viewportWidth);
  expect(metrics.shellWidth).toBeGreaterThan(metrics.viewportWidth);
  expect(metrics.bodyOverflowX).not.toBe('hidden');
});
