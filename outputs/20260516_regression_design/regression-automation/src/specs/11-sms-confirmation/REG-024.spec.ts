import { test, expect } from '../../helpers/fixtures';
import { nav } from '../../helpers/nav';
import { login } from '../../helpers/login';

test('REG-024 @regression @p2 @bug-PTYR-2450 @sms-retry', async ({ page, baseURL }) => {
  test.skip(true, '短信服务未接入mock，需配置测试白名单后执行');
  if (!await login(page, baseURL!)) return;
  await nav(page, baseURL!, `/confirmation/blockchain`);

  let callCount = 0;
  await page.route('**/api/sms/send**', async (route) => {
    callCount++;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 2001, data: null, message: '短信发送失败' }) });
  });

  await page.locator('button:has-text("重试")').click();
  await page.waitForTimeout(1000);
  expect(callCount).toBe(1);
});



