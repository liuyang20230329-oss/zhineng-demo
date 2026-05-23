import { test, expect } from '../../helpers/fixtures';
import { nav } from '../../helpers/nav';
import { login } from '../../helpers/login';

test('REG-005 @regression @p0 @bug-PTYR-2595 @retry', async ({ page, baseURL, data }) => {
  if (!await login(page, baseURL!)) return;
  if (!await data.ensureWorkpaperFiles()) return;

  const batchBtn = page.locator('button:has-text("批量生成")');
  if (!(await batchBtn.isVisible())) { test.skip(); return; }

  await page.route('**/api/workpaper/generate**', async (route) => {
    const reqData = route.request().postDataJSON();
    if (reqData?.fileId === 'FAILURE_FILE') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 1001, data: { fileId: 'FAILURE_FILE', status: 'failed', reason: '数据源异常' }, message: '生成失败' }) });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: { fileId: reqData?.fileId, status: 'completed' }, message: 'success' }) });
    }
  });

  await batchBtn.click();
  await page.waitForSelector('.task-status-panel', { timeout: 30000 });
  await expect(page.locator('.task-item.status-failed').first()).toBeVisible();
  await expect(page.locator('.task-item.status-completed').first()).toBeVisible();
  await page.locator('button:has-text("重试")').first().click();
  await page.waitForResponse((res) => res.url().includes('/api/workpaper/retry'));
});



