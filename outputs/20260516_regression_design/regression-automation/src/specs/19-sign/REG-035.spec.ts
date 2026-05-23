import { test, expect } from '../../helpers/fixtures';
import { nav } from '../../helpers/nav';
import { login } from '../../helpers/login';

test('REG-035 @regression @p1 @bug-PTYR-1694 @sign', async ({ page, baseURL, data }) => {
  if (!await login(page, baseURL!)) return;
  if (!await data.ensureSignContract()) return;

  await nav(page, baseURL!, `/sign/pending`);
  const myFile = page.locator('.sign-file-item:has-text("本人")');
  if (!(await myFile.isVisible())) { test.skip(); return; }

  const editBtn = myFile.locator('button:has-text("编辑"), button:has-text("修改")');
  await expect(editBtn).toBeEnabled();
  await editBtn.click();
  await page.fill('.file-editor, .document-editor', '更新后的签署文件内容');
  await page.locator('button:has-text("保存")').click();
  await page.waitForResponse((res) => res.url().includes('/api/sign/file/update'));
});



