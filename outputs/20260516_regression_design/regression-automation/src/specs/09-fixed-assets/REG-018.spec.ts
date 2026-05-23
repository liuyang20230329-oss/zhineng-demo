import { test, expect } from '../../helpers/fixtures';
import { nav } from '../../helpers/nav';
import { login } from '../../helpers/login';

test('REG-018 @regression @p1 @bug-PTYR-2533 @idempotent', async ({ page, baseURL, data }) => {
  if (!await login(page, baseURL!)) return;
  if (!await data.ensureFixedAssetsData()) return;

  const genBtn = page.locator('button:has-text("生成")');
  if (!(await genBtn.isVisible())) { test.skip(); return; }

  const getTotalCount = () => page.locator('tr.total-row').count();
  const firstCount = await getTotalCount();

  await genBtn.click();
  await page.waitForResponse((res) => res.url().includes('/api/fixed-assets/generate'));

  await genBtn.click();
  await page.waitForResponse((res) => res.url().includes('/api/fixed-assets/generate'));

  expect(await getTotalCount()).toBe(firstCount);
});



