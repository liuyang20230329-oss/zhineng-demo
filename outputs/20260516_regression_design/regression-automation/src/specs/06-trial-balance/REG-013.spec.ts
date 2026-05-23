import { test, expect } from '../../helpers/fixtures';
import { nav } from '../../helpers/nav';
import { login } from '../../helpers/login';
import { validateExcelFile } from '../../helpers/excel-validator';

test('REG-013 @regression @p0 @bug-PTYR-2560 @excel-formula', async ({ page, baseURL, data }) => {
  if (!await login(page, baseURL!)) return;
  if (!await data.ensureTrialBalanceData()) return;

  const exportBtn = page.locator('button:has-text("导出")');
  if (!(await exportBtn.isVisible())) { test.skip(); return; }

  const downloadPromise = page.waitForEvent('download');
  await exportBtn.click();
  const download = await downloadPromise;
  const filePath = await download.path();
  expect(filePath).toBeTruthy();

  const errors = await validateExcelFile(filePath!, [
    { cell: 'A1', expectedValue: '试算平衡表' },
    { cell: 'H10', expectedFormula: /SUM/ },
  ]);
  expect(errors).toEqual([]);
});



