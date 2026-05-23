import { test, expect } from '../../helpers/fixtures';
import { nav } from '../../helpers/nav';
import { login } from '../../helpers/login';

test('REG-019 @regression @p0 @bug-PTYR-2492 @workpaper-config', async ({ page, baseURL, data }) => {
  if (!await login(page, baseURL!)) return;
  if (!await data.ensureAdjustmentEntry('预收款项', 50000)) return;

  await nav(page, baseURL!, `/projects/hz-decheng/workpaper-config`);

  const checkbox = page.locator('tr:has-text("预收款项") input[type="checkbox"]');
  await expect(checkbox).toBeChecked();
  await expect(page.locator('tr:has-text("预收款项") .source-tag')).toContainText(/system_default|系统默认/);
  await expect(page.locator('.el-message, .ant-message, .toast')).toContainText(/预收款项|自动勾选/);
});



