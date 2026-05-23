import { test, expect, USERS } from '../../helpers/fixtures';
import { nav } from '../../helpers/nav';
import { login } from '../../helpers/login';

test('REG-007 @regression @p1 @bug-PTYR-2588 @navigation', async ({ page, baseURL }) => {
  if (!await login(page, baseURL!, USERS.lowPerm)) return;

  const sidebarItems = page.locator('.sidebar .menu-item, .nav-menu a');
  const visibleMenus = await sidebarItems.evaluateAll((items) =>
    items.filter((el) => (el as HTMLElement).offsetParent !== null).length
  );
  expect(visibleMenus).toBeGreaterThan(0);

  await nav(page, baseURL!, `/customers`);
  await expect(page.locator('.main-content, .page-container')).not.toHaveText(/暂无数据|没有数据/);
});



