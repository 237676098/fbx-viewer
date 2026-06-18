import { expect, test } from '@playwright/test';

test('renders the scaffold app shell', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('.app-shell')).toBeVisible();
  await expect(page.locator('.top-bar')).toContainText('FBX Inspector Workbench');
  await expect(page.getByRole('heading', { name: 'FBX Inspector Workbench' })).toBeVisible();
  await expect(page.getByText('Local model rendering, animation playback, and field-level diagnostics.')).toBeVisible();
});
