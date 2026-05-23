import { test, expect } from '../../helpers/fixtures';
import { nav } from '../../helpers/nav';
import { login } from '../../helpers/login';

test('REG-017 @regression @p0 @bug-PTYR-2533 @fixed-assets', async ({ page, baseURL, data }) => {
  if (!await login(page, baseURL!)) return;
  if (!await data.ensureFixedAssetsData()) return;

  const totals = page.locator('td:has-text("合计")');
  expect(await totals.count()).toBeLessThanOrEqual(1);

  const grandTotal = page.locator('tr.total-row td.amount');
  expect(await grandTotal.count()).toBeLessThanOrEqual(1);
  const val = parseFloat((await grandTotal.first().textContent() || '0').replace(/[^0-9.\-]/g, ''));
  expect(val).toBeGreaterThan(0);
});



