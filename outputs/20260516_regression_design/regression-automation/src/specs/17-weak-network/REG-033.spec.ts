import { test, expect } from '../../helpers/fixtures';
import { nav } from '../../helpers/nav';
import { login } from '../../helpers/login';

test('REG-033 @regression @p1 @bug-PTYR-1747 @weak-network', async ({ page, baseURL, data }) => {
  if (!await login(page, baseURL!)) return;
  if (!await data.ensureReviewTasks()) return;

  const start = Date.now();
  await page.locator('button:has-text("复核通过")').first().click();

  const loadingBtn = page.locator('button:has-text("复核通过")');
  if (await loadingBtn.isDisabled()) {
    await expect(loadingBtn.locator('.loading, .el-loading')).toBeVisible();
  }

  await page.waitForResponse((res) => res.url().includes('/api/review/approve'));
  const duration = Date.now() - start;
  console.log(`[PERF] ${duration}ms`);
  expect(duration).toBeLessThanOrEqual(8000);

  await nav(page, baseURL!, `/review/history`);
  expect(await page.locator('.review-record').count()).toBeGreaterThanOrEqual(1);
});



