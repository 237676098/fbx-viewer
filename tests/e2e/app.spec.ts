import { expect, test } from '@playwright/test';

test('renders the no-file workbench shell', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('.app-shell')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'FBX Inspector Workbench' })).toBeVisible();

  await expect(page.getByLabel('FBX inspector workbench')).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Scene' })).toBeVisible();
  await expect(page.getByLabel('Viewport and animation')).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Inspector' })).toBeVisible();
  await expect(page.getByLabel('选择 FBX 文件')).toBeAttached();

  await expect(page.locator('.viewport-empty')).toContainText('尚未加载 FBX');
  await expect(page.locator('.viewport-empty')).toContainText('选择或拖入本地 .fbx 文件');
  await expect(page.locator('.timeline-empty')).toContainText('当前文件没有动画片段。');

  const inspector = page.getByRole('complementary', { name: 'Inspector' });
  await expect(inspector.locator('.pane-header').first()).toContainText('基础属性');
  await expect(inspector.locator('.inspector-panel')).toBeVisible();
  await expect(inspector.locator('.inspector-panel .inspector-empty')).toBeVisible();
  await expect(inspector.locator('.inspector-panel .inspector-empty')).toContainText('暂无属性数据');
  await expect(inspector.locator('.asset-panel')).toHaveCount(0);
  await expect(page.locator('.asset-dock .pane-header')).toContainText('资产面板');
  await expect(page.locator('.asset-dock .asset-panel .inspector-empty')).toContainText('暂无资产数据');
  await expect(inspector.getByRole('tablist')).toHaveCount(0);

  await expect(page.locator('.status-strip')).toContainText('未加载文件');
});

test('shows validation feedback for non-FBX file input', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('选择 FBX 文件').setInputFiles({
    name: 'not-a-model.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('plain text is not an fbx asset'),
  });

  await expect(page.locator('.status-strip')).toContainText('请选择 .fbx 文件。');
  await expect(page.locator('.viewport-empty')).toContainText('尚未加载 FBX');
  await expect(page.locator('.inspector-panel .inspector-empty')).toContainText('暂无属性数据');
  await expect(page.locator('.asset-panel .inspector-empty')).toContainText('暂无资产数据');
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
