import { test, expect } from '../../helpers/fixtures';
import { nav } from '../../helpers/nav';
import { login } from '../../helpers/login';

test('REG-039 @regression @p1 @bug-PTYR-1296 @index', async ({ page, baseURL, data }) => {
  if (!await login(page, baseURL!)) return;
  if (!await data.ensureIndexTable()) return;

  const cell = page.locator('.index-cell').first();
  await expect(cell).toBeVisible();

  await cell.click();
  await page.keyboard.press('Control+C');
  await cell.fill('');
  await page.keyboard.press('Tab');

  await page.locator('button:has-text("更新索引号")').click();
  await page.waitForResponse((res) => res.url().includes('/api/index/update'));

  const newVal = (await page.locator('.index-cell').first().textContent() || '').trim();
  expect(newVal).toBeTruthy();
});



