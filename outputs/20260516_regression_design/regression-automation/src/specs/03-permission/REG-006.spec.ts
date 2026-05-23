import { test, expect, USERS } from '../../helpers/fixtures';
import { nav } from '../../helpers/nav';
import { login } from '../../helpers/login';

test('REG-006 @regression @p1 @bug-PTYR-2588 @permission', async ({ page, baseURL }) => {
  if (!await login(page, baseURL!, USERS.lowPerm)) return;

  for (const path of ['/customers', '/contracts', '/workpaper']) {
    await nav(page, baseURL!, `${path}`);
    const denied = page.locator('.no-permission, .permission-denied, .el-result');
    await expect(denied).toBeVisible({ timeout: 10000 });
    await expect(denied).toContainText(/暂无查看权限|无权限|请联系管理员/);
  }
});



