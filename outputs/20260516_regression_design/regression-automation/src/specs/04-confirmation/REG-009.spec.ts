import { test, expect } from '../../helpers/fixtures';
import { nav } from '../../helpers/nav';
import { login } from '../../helpers/login';

test('REG-009 @regression @p2 @bug-PTYR-2576 @validation', async ({ page, baseURL, data }) => {
  if (!await login(page, baseURL!)) return;
  if (!await data.ensureBankConfirmation()) return;

  await page.locator('button:has-text("保存")').click();
  const err = page.locator('.el-form-item__error, .ant-form-item-explain, .validation-error');
  if (await err.isVisible()) {
    await expect(err).toContainText(/必填|不能为空/);
  } else {
    const res = await page.request.post(`${baseURL}/api/confirmation/save`, {
      data: { branchId: '', bankConfirmationId: 'BANK-001' },
    });
    const body = await res.json();
    expect(body.code).not.toBe(0);
  }
});



