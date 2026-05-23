import { test, expect } from '../../helpers/fixtures';
import { nav } from '../../helpers/nav';
import { login } from '../../helpers/login';

test('REG-022 @regression @p1 @bug-PTYR-2492 @generated-content', async ({ page, baseURL, data }) => {
  if (!await login(page, baseURL!)) return;
  if (!await data.ensureAdjustmentEntry('某科目', 0)) return;

  const dialog = page.locator('.confirm-dialog, .modal, .el-dialog');
  if (await dialog.isVisible()) {
    await expect(dialog).toContainText(/保留|删除|查看/);
    await expect(dialog.locator('button:has-text("保留")')).toBeVisible();
  }
});



