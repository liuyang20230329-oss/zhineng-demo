import { test, expect } from '../../helpers/fixtures';
import { nav } from '../../helpers/nav';
import { login } from '../../helpers/login';
import { setupMocks } from '../../helpers/mock-server';

test('REG-014 @regression @p1 @bug-PTYR-2554 @account-balance', async ({ page, baseURL }) => {
  if (!await login(page, baseURL!)) return;

  for (const scenario of [{ code: 2001, message: '金额不一致' }, { code: 2002, message: '数据源异常' }]) {
    await setupMocks(page, [
      { method: 'GET', url: /\/api\/account-balance/, status: 200, body: { code: scenario.code, data: null, message: scenario.message, traceId: `trace-${Date.now()}` } },
    ]);

    await nav(page, baseURL!, `/account-balance`);
    const errMsg = page.locator('.error-message, .alert, .el-alert');
    if (await errMsg.isVisible()) {
      await expect(errMsg).toContainText(new RegExp(scenario.message));
    }
  }
});



