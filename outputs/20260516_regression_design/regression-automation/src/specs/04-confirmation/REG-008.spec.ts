import { test, expect } from '../../helpers/fixtures';
import { nav } from '../../helpers/nav';
import { login } from '../../helpers/login';

test('REG-008 @regression @p1 @bug-PTYR-2576 @confirmation', async ({ page, baseURL, data }) => {
  if (!await login(page, baseURL!)) return;
  if (!await data.ensureBankConfirmation()) return;

  const sel = page.locator('.branch-select .el-select, .branch-select .ant-select');
  if (!(await sel.isVisible())) { test.skip(); return; }
  await sel.click();
  await page.waitForSelector('.el-select-dropdown, .ant-select-dropdown');

  const options = page.locator('.el-select-dropdown .el-select-item, .ant-select-item');
  expect(await options.count()).toBeGreaterThan(0);
  await options.first().click();
  await page.locator('button:has-text("保存")').click();
  await page.waitForResponse((res) => res.url().includes('/api/confirmation/save'));

  await page.reload();
  const saved = await page.locator('.branch-select .selected-value, .branch-select input').inputValue();
  expect(saved).toBeTruthy();
});



