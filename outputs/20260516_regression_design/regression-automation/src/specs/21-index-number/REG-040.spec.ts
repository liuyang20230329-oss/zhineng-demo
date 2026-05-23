import { test, expect } from '../../helpers/fixtures';
import { nav } from '../../helpers/nav';
import { login } from '../../helpers/login';

test('REG-040 @regression @p2 @bug-PTYR-1296 @idempotent', async ({ page, baseURL, data }) => {
  if (!await login(page, baseURL!)) return;
  if (!await data.ensureIndexTable()) return;

  const cellsBefore = await page.locator('.index-cell').allTextContents();
  const emptyBefore = cellsBefore.filter((c) => !c.trim()).length;

  await page.locator('button:has-text("更新索引号")').click();
  await page.waitForResponse((res) => res.url().includes('/api/index/update'));
  const afterFirst = await page.locator('.index-cell').allTextContents();
  expect(afterFirst.filter((c) => !c.trim()).length).toBeLessThanOrEqual(emptyBefore);

  await page.locator('button:has-text("更新索引号")').click();
  await page.waitForResponse((res) => res.url().includes('/api/index/update'));
  expect(await page.locator('.index-cell').allTextContents()).toEqual(afterFirst);

  await page.reload();
  expect(await page.locator('.index-cell').allTextContents()).toEqual(afterFirst);
});



