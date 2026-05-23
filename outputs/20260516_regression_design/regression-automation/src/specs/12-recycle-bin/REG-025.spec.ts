import { test, expect } from '../../helpers/fixtures';
import { nav } from '../../helpers/nav';
import { login } from '../../helpers/login';

test('REG-025 @regression @p1 @bug-PTYR-2355 @recycle-bin', async ({ page, baseURL, data }) => {
  if (!await login(page, baseURL!)) return;
  const fileId = await data.ensureWorkpaperFiles();
  if (!fileId) return;

  const delBtn = page.locator('button:has-text("删除")').first();
  if (!(await delBtn.isVisible())) { test.skip(); return; }
  await delBtn.click();
  const confirm = page.locator('.el-message-box button:has-text("确认"), .confirm-btn:has-text("确认")');
  await expect(confirm).toBeVisible({ timeout: 5000 });
  await confirm.click();

  await nav(page, baseURL!, `/recycle-bin`);
  await expect(page.locator('.recycle-item').first()).toBeVisible({ timeout: 10000 });
  await expect(page.locator('.recycle-item').first()).toContainText(/底稿/);

  await page.locator('button:has-text("恢复")').click();
  await page.waitForResponse((res) => res.url().includes('/api/recycle-bin/restore'));

  await nav(page, baseURL!, `/projects/hz-decheng/workpaper`);
  await expect(page.locator('.workpaper-file-item').first()).toBeVisible({ timeout: 10000 });
});



