import { test, expect } from '../../helpers/fixtures';
import { nav } from '../../helpers/nav';
import { login } from '../../helpers/login';
import * as fs from 'fs';

test('REG-031 @regression @p2 @bug-PTYR-1781 @bug-PTYR-1760 @copy', async ({ page, baseURL }) => {
  if (!await login(page, baseURL!)) return;
  await nav(page, baseURL!, `/review/opinions`);
  await page.waitForSelector('.opinion-content');

  const pageContent = await page.locator('.opinion-content, .main-content').textContent() || '';
  expect(pageContent).not.toContain('证据池意见');
  expect(pageContent).toContain('审计证据意见');

  const res = await page.request.get(`${baseURL}/api/review/opinions`);
  const body = await res.json();
  expect(JSON.stringify(body)).not.toContain('证据池意见');

  const downloadPromise = page.waitForEvent('download');
  await page.locator('button:has-text("导出")').click();
  const download = await downloadPromise;
  const filePath = await download.path();
  if (filePath) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    expect(fileContent).not.toContain('证据池意见');
  }
});



