import { test, expect } from '../../helpers/fixtures';
import { nav } from '../../helpers/nav';
import { login } from '../../helpers/login';

test('REG-023 @regression @p1 @bug-PTYR-2450 @sms', async ({ page, baseURL }) => {
  test.skip(true, '短信服务未接入mock，需配置测试白名单后执行');
  if (!await login(page, baseURL!)) return;
  await nav(page, baseURL!, `/confirmation/blockchain`);

  const smsReq = page.waitForResponse((res) => res.url().includes('/api/sms/send'));
  await page.locator('button:has-text("发起发函")').click();
  const res = await smsReq;
  const body = await res.json();
  expect(body.code).toBe(0);
  expect(body.data).toHaveProperty('smsId');
});



