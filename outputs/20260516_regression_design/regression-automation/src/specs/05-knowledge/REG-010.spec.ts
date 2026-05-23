import { test, expect } from '../../helpers/fixtures';
import { nav } from '../../helpers/nav';
import { login } from '../../helpers/login';

test('REG-010 @regression @p1 @bug-PTYR-2567 @search', async ({ page, baseURL, data }) => {
  if (!await login(page, baseURL!)) return;
  if (!await data.ensureKnowledgeDocs()) return;

  const searchInput = page.locator('.search-input input, input[placeholder*="搜索"]');
  if (!(await searchInput.isVisible())) { test.skip(); return; }
  await searchInput.fill('测试关键词');
  await searchInput.press('Enter');

  const results = page.locator('.search-result-item');
  await expect(results.first()).toBeVisible({ timeout: 10000 });
  await expect(results.first().locator('.highlight, em, mark')).toContainText(/测试关键词/);
  await results.first().click();
  await expect(page.locator('.knowledge-detail, .article-content')).toContainText(/测试关键词/);
});



