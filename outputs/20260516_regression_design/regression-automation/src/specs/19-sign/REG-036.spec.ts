import { test, expect } from '../../helpers/fixtures';
import { nav } from '../../helpers/nav';
import { login } from '../../helpers/login';

test('REG-036 @regression @p1 @bug-PTYR-1694 @permission', async ({ page, baseURL, data }) => {
  if (!await login(page, baseURL!)) return;
  if (!await data.ensureSignContract()) return;

  await nav(page, baseURL!, `/sign/completed`);
  const myFile = page.locator('.sign-file-item:has-text("本人")');
  if (await myFile.isVisible()) {
    const editBtn = myFile.locator('button:has-text("编辑"), button:has-text("修改")');
    if (await editBtn.isVisible()) {
      expect(await editBtn.isDisabled()).toBeTruthy();
    }
  }

  const res = await page.request.post(`${baseURL}/api/sign/file/update`, {
    data: { fileId: 'completed-file-001', content: '尝试修改' },
  });
  const body = await res.json();
  expect(body.code).not.toBe(0);
});



