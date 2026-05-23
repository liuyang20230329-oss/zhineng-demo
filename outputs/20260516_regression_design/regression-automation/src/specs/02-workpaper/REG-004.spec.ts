import { test, expect } from '../../helpers/fixtures';
import { nav } from '../../helpers/nav';
import { login } from '../../helpers/login';
import { validateFileNonEmpty } from '../../helpers/excel-validator';

test('REG-004 @regression @p0 @bug-PTYR-2595 @workpaper', async ({ page, baseURL, data }) => {
  if (!await login(page, baseURL!)) return;
  if (!await data.ensureWorkpaperFiles()) return;

  const downloadLinks = page.locator('.workpaper-file-item a');
  const count = await downloadLinks.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    const downloadPromise = page.waitForEvent('download');
    await downloadLinks.nth(i).click();
    const download = await downloadPromise;
    const filePath = await download.path();
    expect(filePath).toBeTruthy();
    const isValid = await validateFileNonEmpty(filePath!);
    expect(isValid).toBeTruthy();
  }
});



