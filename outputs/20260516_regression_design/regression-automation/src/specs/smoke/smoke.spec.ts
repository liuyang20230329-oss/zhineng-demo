import { test, expect } from '@playwright/test';
import { nav } from '../../helpers/nav';

test.describe('Smoke Test @smoke', () => {
  test('登录页面可访问', async ({ page, baseURL }) => {
    const url = `${baseURL}/login`;
    console.log(`[SMOKE] Accessing: ${url}`);
    const response = await page.goto(url, { waitUntil: 'load', timeout: 120000 });
    expect(response?.ok()).toBeTruthy();
    await page.waitForTimeout(3000);
    const input = page.locator('input[name="username"], input[placeholder*="账号"], input[placeholder*="用户"]');
    await expect(input).toBeVisible({ timeout: 30000 });
  });

  test('核心接口健康检查', async ({ request, baseURL }) => {
    const apiBase = baseURL!.replace('/#', '');
    const response = await request.get(`${apiBase}/api/health`, { timeout: 30000 });
    console.log(`[SMOKE] Health check: ${response.status()}`);
    expect(response.ok()).toBeTruthy();
  });
});
