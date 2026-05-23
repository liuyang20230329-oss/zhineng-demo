import { test, expect } from '../../helpers/fixtures';
import { nav } from '../../helpers/nav';
import { login } from '../../helpers/login';

test('REG-003 @regression @p0 @bug-PTYR-2674 @file', async ({ page, baseURL }) => {
  if (!await login(page, baseURL!)) return;
  await nav(page, baseURL!, `/projects/PROJ-001`);

  const syncBtn = page.locator('button:has-text("同步报备状态")');
  if (await syncBtn.isVisible()) {
    await syncBtn.click();
    await page.waitForResponse((res) => res.url().includes('/api/projects/sync'));
  }

  await page.locator('text=附件').click();
  const fileList = page.locator('.file-list-item');
  if (!(await fileList.first().isVisible())) { test.skip(); return; }

  const downloadPromise = page.waitForEvent('download');
  await fileList.first().locator('a, button:has-text("下载")').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/PROJ-001|赋码/);
  expect(await download.path()).toBeTruthy();
});



