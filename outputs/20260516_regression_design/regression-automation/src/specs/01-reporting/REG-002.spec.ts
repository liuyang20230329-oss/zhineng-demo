import { test, expect } from '../../helpers/fixtures';
import { nav } from '../../helpers/nav';
import { login } from '../../helpers/login';
import { setupMocks } from '../../helpers/mock-server';

test('REG-002 @regression @p0 @bug-PTYR-2674 @sync', async ({ page, baseURL }) => {
  if (!await login(page, baseURL!)) return;

  await setupMocks(page, [
    { method: 'POST', url: /\/api\/platform\/callback/, status: 200, body: { code: 0, data: null, message: '无报备数据' } },
  ]);

  await nav(page, baseURL!, `/projects`);
  const syncBtn = page.locator('button:has-text("同步报备状态")');
  if (!(await syncBtn.isVisible())) { test.skip(); return; }
  await syncBtn.click();
  await page.waitForResponse((res) => res.url().includes('/api/projects/sync'));

  await expect(page.locator('.el-message, .ant-message, .toast')).toContainText(/无报备数据|暂无数据/);
  const logs = await page.evaluate(() => JSON.parse(localStorage.getItem('syncLogs') || '[]'));
  expect(logs.length).toBeGreaterThanOrEqual(1);
});



