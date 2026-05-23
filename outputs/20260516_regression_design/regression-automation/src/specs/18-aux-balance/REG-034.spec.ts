import { test, expect } from '../../helpers/fixtures';
import { nav } from '../../helpers/nav';
import { login } from '../../helpers/login';

test('REG-034 @regression @p1 @bug-PTYR-1713 @aux-balance', async ({ page, baseURL, data }) => {
  if (!await login(page, baseURL!)) return;
  if (!await data.ensureAuxBalanceData()) return;

  const tabs = page.locator('.category-tab, .el-tabs__item, .ant-tabs-tab');
  const texts = (await tabs.allTextContents()).map((t) => t.trim()).filter(Boolean);
  expect(texts.length).toBeGreaterThanOrEqual(3);
  expect(texts[0]).toMatch(/客户|customer/i);
  expect(texts[1]).toMatch(/供应商|supplier/i);
  expect(texts[2]).toMatch(/个人|personal/i);

  const downloadPromise = page.waitForEvent('download');
  await page.locator('button:has-text("导出")').click();
  expect(await (await downloadPromise).path()).toBeTruthy();

  await page.reload();
  const refreshed = (await page.locator('.category-tab, .el-tabs__item, .ant-tabs-tab').allTextContents()).map((t) => t.trim()).filter(Boolean);
  expect(refreshed).toEqual(texts);
});



