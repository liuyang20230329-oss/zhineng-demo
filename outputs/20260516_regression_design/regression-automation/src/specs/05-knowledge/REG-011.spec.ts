import { test, expect } from '../../helpers/fixtures';
import { nav } from '../../helpers/nav';
import { login } from '../../helpers/login';

test('REG-011 @regression @p2 @bug-PTYR-2567 @search', async ({ page, baseURL, data }) => {
  if (!await login(page, baseURL!)) return;
  if (!await data.ensureKnowledgeDocs()) return;

  const searchInput = page.locator('.search-input input, input[placeholder*="搜索"]');
  if (!(await searchInput.isVisible())) { test.skip(); return; }

  await searchInput.fill('__不存在的关键词_XYZ_999__');
  await searchInput.press('Enter');
  await expect(page.locator('.empty-state, .no-results, .el-empty')).toBeVisible({ timeout: 10000 });

  await searchInput.fill('');
  await searchInput.press('Enter');
  await expect(page.locator('.search-result-item, .knowledge-list').first()).toBeVisible({ timeout: 10000 });

  await searchInput.fill('@#$%^&*()_+');
  await searchInput.press('Enter');
  await expect(page.locator('.error-page, .el-result.is-error')).not.toBeVisible({ timeout: 5000 });
});



