import { test, expect } from '../../helpers/fixtures';
import { nav } from '../../helpers/nav';
import { login } from '../../helpers/login';
import { mockOCRResponse } from '../../helpers/mock-server';
import * as path from 'path';
import * as fs from 'fs';

test('REG-015 @regression @p1 @bug-PTYR-2543 @invoice', async ({ page, baseURL, data }) => {
  if (!await login(page, baseURL!)) return;
  if (!await data.ensureExpenseReport()) return;

  await mockOCRResponse(page, 'fail');

  const uploadBtn = page.locator('button:has-text("上传发票")');
  if (!(await uploadBtn.isVisible())) { test.skip(); return; }

  const sampleFile = path.resolve(__dirname, '../../../test-data/sample-invoice.png');
  if (!fs.existsSync(sampleFile)) {
    fs.writeFileSync(sampleFile, Buffer.alloc(1024, 'X'));
  }

  const fileChooserPromise = page.waitForEvent('filechooser');
  await uploadBtn.click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles([sampleFile]);

  await expect(page.locator('.file-preview, .uploaded-image')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('.ocr-failed-tag, .recognition-failed')).toContainText(/识别失败/);
  await expect(page.locator('button:has-text("保存")')).not.toBeDisabled();
  await expect(page.locator('button:has-text("重新识别")')).toBeVisible();
});



