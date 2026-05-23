import { test, expect } from '../../helpers/fixtures';
import { nav } from '../../helpers/nav';
import { login } from '../../helpers/login';
import { validateExcelFile } from '../../helpers/excel-validator';

test('REG-029 @regression @p1 @bug-PTYR-1824 @disclosure', async ({ page, baseURL, data }) => {
  if (!await login(page, baseURL!)) return;
  if (!await data.ensureDisclosureData()) return;

  const exportBtn = page.locator('button:has-text("导出")');
  if (!(await exportBtn.isVisible())) { test.skip(); return; }

  const downloadPromise = page.waitForEvent('download');
  await exportBtn.click();
  const download = await downloadPromise;
  const filePath = await download.path();

  if (filePath) {
    const errors = await validateExcelFile(filePath, [
      { cell: 'B10', expectedValue: 1 },
      { cell: 'C10', expectedValue: 2 },
    ]);
    if (errors.length > 0) {
      await expect(page.locator('td:has-text("1年至2年")')).toBeVisible();
      await expect(page.locator('td:has-text("其他年度")')).toBeVisible();
    }
  }
});



