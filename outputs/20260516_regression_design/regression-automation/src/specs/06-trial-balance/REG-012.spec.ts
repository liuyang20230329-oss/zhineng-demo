import { test, expect } from '../../helpers/fixtures';
import { nav } from '../../helpers/nav';
import { login } from '../../helpers/login';

test('REG-012 @regression @p0 @bug-PTYR-2561 @trial-balance', async ({ page, baseURL, data }) => {
  if (!await login(page, baseURL!)) return;
  if (!await data.ensureTrialBalanceData()) return;

  const finExp = page.locator('tr:has-text("财务费用") td');
  await expect(finExp.first()).toBeVisible();

  const amount = parseFloat((await finExp.nth(2).textContent() || '0').replace(/[^0-9.\-]/g, ''));
  expect(amount).not.toBe(0);

  await expect(page.locator('tr:has-text("本年损益转出")')).not.toBeVisible();

  const direction = (await finExp.nth(3).textContent() || '').trim();
  expect(direction).toMatch(/借|贷/);
});



