import { test, expect } from '../../helpers/fixtures';
import { nav } from '../../helpers/nav';
import { login } from '../../helpers/login';

test('REG-026 @regression @p2 @bug-PTYR-2355 @delete', async ({ page, baseURL, data }) => {
  if (!await login(page, baseURL!)) return;
  if (!await data.ensureRecycleBinHasData()) return;

  const itemsBefore = await page.locator('.recycle-item').count();
  expect(itemsBefore).toBeGreaterThan(0);

  await page.locator('button:has-text("彻底删除")').first().click();
  const confirm = page.locator('.el-message-box button:has-text("确认"), .confirm-btn:has-text("确认")');
  await expect(confirm).toBeVisible({ timeout: 5000 });
  await confirm.click();
  await page.waitForTimeout(1000);

  expect(await page.locator('.recycle-item').count()).toBe(itemsBefore - 1);

  const res = await page.request.post(`${baseURL}/api/recycle-bin/restore`, { data: { id: 'permanently-deleted-id' } });
  const body = await res.json();
  expect(body.code).not.toBe(0);
});



