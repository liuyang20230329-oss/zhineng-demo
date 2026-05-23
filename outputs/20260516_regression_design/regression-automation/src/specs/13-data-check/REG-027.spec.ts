import { test, expect } from '../../helpers/fixtures';
import { nav } from '../../helpers/nav';
import { login } from '../../helpers/login';

test('REG-027 @regression @p0 @bug-PTYR-1921 @data-check', async ({ page, baseURL, data }) => {
  if (!await login(page, baseURL!)) return;
  if (!await data.ensureDataCheckReady()) return;

  await page.locator('button:has-text("执行校验")').click();
  await page.waitForSelector('.check-result', { timeout: 60000 });

  const statusText = await page.locator('.check-result .status-badge').textContent();
  const errorCount = await page.locator('.check-result .error-item').count();

  if (statusText?.includes('通过') || statusText?.includes('一致')) {
    expect(errorCount).toBe(0);
  }
  await expect(page.locator('.check-detail-log')).toBeVisible();
});



