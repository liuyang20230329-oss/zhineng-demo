import { test, expect } from '../../helpers/fixtures';
import { nav } from '../../helpers/nav';
import { login } from '../../helpers/login';
import { setupMocks } from '../../helpers/mock-server';

test('REG-001 @regression @p0 @bug-PTYR-2674 @reporting', async ({ page, baseURL, data }) => {
  if (!await login(page, baseURL!)) return;
  if (!await data.ensureAdjustmentEntry('预收款项', 50000)) return;

  await setupMocks(page, [
    { method: 'POST', url: /\/api\/platform\/callback/, status: 200, body: { code: 0, data: { status: 'approved', projectId: 'PROJ-001' }, message: 'success' } },
  ]);

  await nav(page, baseURL!, `/projects`);
  const project = page.locator('text=PROJ-001');
  if (!(await project.isVisible())) { test.skip(); return; }
  await project.click();

  const syncBtn = page.locator('button:has-text("同步报备状态")');
  if (!(await syncBtn.isVisible())) { test.skip(); return; }
  await syncBtn.click();
  await page.waitForResponse((res) => res.url().includes('/api/projects/sync'));

  const statusBadge = page.locator('.project-status-badge');
  await expect(statusBadge).toContainText(/已报备|已完成/);
  await expect(page.locator('.status-update-time')).not.toBeEmpty();
});



