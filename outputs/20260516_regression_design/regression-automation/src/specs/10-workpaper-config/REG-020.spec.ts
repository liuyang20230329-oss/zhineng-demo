import { test, expect } from '../../helpers/fixtures';
import { nav } from '../../helpers/nav';
import { login } from '../../helpers/login';

test('REG-020 @regression @p0 @bug-PTYR-2492 @conflict', async ({ page, baseURL, data }) => {
  if (!await login(page, baseURL!)) return;

  await nav(page, baseURL!, `/projects/hz-decheng/workpaper-config`);
  const checkbox = page.locator('tr:has-text("预收款项") input[type="checkbox"]');
  if (await checkbox.isVisible()) {
    if (await checkbox.isChecked()) await checkbox.uncheck();
  }

  if (!await data.ensureAdjustmentEntry('预收款项', 30000)) return;

  const dialog = page.locator('.confirm-dialog, .modal, .el-dialog');
  await expect(dialog).toBeVisible({ timeout: 10000 });
  await expect(dialog).toContainText(/调整前|调整后|预收款项/);
  await dialog.locator('button:has-text("保持原设置")').click();
  await expect(dialog).not.toBeVisible();
});



