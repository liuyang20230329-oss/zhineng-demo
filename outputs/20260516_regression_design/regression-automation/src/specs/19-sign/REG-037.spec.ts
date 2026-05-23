import { test, expect } from '../../helpers/fixtures';
import { nav } from '../../helpers/nav';
import { login } from '../../helpers/login';

test('REG-037 @regression @p1 @bug-PTYR-1693 @sign-history', async ({ page, baseURL, data }) => {
  if (!await login(page, baseURL!)) return;
  if (!await data.ensureSignContract()) return;

  await nav(page, baseURL!, `/sign/history`);
  await page.locator('text=我的签署历史').click();

  const records = page.locator('.sign-history-item');
  expect(await records.count()).toBeGreaterThan(0);
  await records.first().click();
  await expect(page.locator('.file-preview, .document-viewer')).toBeVisible();

  const downloadBtn = page.locator('button:has-text("下载"), a:has-text("下载")');
  if (await downloadBtn.isVisible()) {
    const downloadPromise = page.waitForEvent('download');
    await downloadBtn.click();
    expect((await downloadPromise).suggestedFilename()).toMatch(/sign|盖章|签署/);
  }
});



