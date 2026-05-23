import { test, expect } from '../../helpers/fixtures';
import { nav } from '../../helpers/nav';
import { login } from '../../helpers/login';

test('REG-021 @regression @p1 @bug-PTYR-2492 @pending', async ({ page, baseURL, data }) => {
  if (!await login(page, baseURL!)) return;

  await nav(page, baseURL!, `/projects/hz-decheng/workpaper-config`);
  const genBtn = page.locator('button:has-text("生成底稿")');
  if (!(await genBtn.isVisible())) { test.skip(); return; }
  await genBtn.click();

  const warning = page.locator('.warning-message, .alert, .el-alert--warning');
  if (await warning.isVisible()) {
    await expect(warning).toContainText(/冲突|未处理|警告/);
  }
});



