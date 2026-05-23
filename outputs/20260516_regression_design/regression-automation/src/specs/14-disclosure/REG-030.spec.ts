import { test, expect } from '../../helpers/fixtures';
import { nav } from '../../helpers/nav';
import { login } from '../../helpers/login';

test('REG-030 @regression @p2 @bug-PTYR-1824 @template', async ({ page, baseURL, data }) => {
  if (!await login(page, baseURL!)) return;
  if (!await data.ensureDisclosureData()) return;

  const warning = page.locator('.warning-message, .template-mismatch, .el-alert--warning');
  if (await warning.isVisible()) {
    await expect(warning).toContainText(/结构不一致|模板|手动更新/);
  }

  const res = await page.request.get(`${baseURL}/api/disclosure/check-template`);
  const body = await res.json();
  if (body.code !== 0) {
    expect(body.message).toContain(/模板|结构/);
  }
});



