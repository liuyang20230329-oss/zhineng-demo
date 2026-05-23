import { test, expect } from '../../helpers/fixtures';
import { nav } from '../../helpers/nav';
import { login } from '../../helpers/login';

test('REG-028 @regression @p1 @bug-PTYR-1921 @data-check-negative', async ({ page, baseURL, data }) => {
  if (!await login(page, baseURL!)) return;
  if (!await data.ensureDataCheckReady()) return;

  await page.locator('button:has-text("执行校验")').click();
  await page.waitForSelector('.check-result', { timeout: 60000 });

  const statusText = await page.locator('.check-result .status-badge').textContent();
  const errorItems = page.locator('.check-result .error-item');

  if (statusText?.includes('不一致') || statusText?.includes('失败')) {
    expect(await errorItems.count()).toBeGreaterThan(0);
    await expect(errorItems.first()).toContainText(/金额|科目|差异/);
  }
});



