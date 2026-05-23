import { Page } from '@playwright/test';
import { USERS } from './config';

async function debugPage(page: Page, label: string) {
  try {
    const url = page.url();
    const title = await page.title().catch(() => 'N/A');
    const inputs = await page.locator('input').evaluateAll((els) =>
      els.map((el) => ({
        type: (el as HTMLInputElement).type,
        name: (el as HTMLInputElement).name,
        placeholder: (el as HTMLInputElement).placeholder,
        id: el.id,
        readonly: (el as HTMLInputElement).readOnly,
        disabled: (el as HTMLInputElement).disabled,
        class: el.className.slice(0, 60),
        rect: el.getBoundingClientRect(),
      })).then((arr) => arr.filter((i) => i.rect.width > 0 && i.rect.height > 0))
    );
    const buttons = await page.locator('button, [role="button"], .el-button, .ant-btn').evaluateAll((els) =>
      els.map((el) => ({
        text: el.textContent?.trim().slice(0, 20),
        class: el.className.slice(0, 60),
        rect: el.getBoundingClientRect(),
      })).then((arr) => arr.filter((b) => b.rect.width > 0 && b.rect.height > 0))
    );
    console.log(`[DEBUG:${label}] URL: ${url}`);
    console.log(`[DEBUG:${label}] Title: ${title}`);
    if (inputs.length > 0) console.log(`[DEBUG:${label}] Inputs:`, JSON.stringify(inputs.slice(0, 5)));
    if (buttons.length > 0) console.log(`[DEBUG:${label}] Buttons:`, JSON.stringify(buttons.slice(0, 5)));
  } catch {}
}

export async function login(page: Page, baseURL: string, user?: { username: string; password: string }): Promise<boolean> {
  const cred = user ?? { username: USERS.admin.username, password: USERS.admin.password };
  console.log(`[LOGIN] 尝试登录: ${cred.username}`);

  await page.context().addCookies([]);
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  }).catch(() => {});

  const urlsToTry = [
    { url: baseURL, label: 'baseURL' },
    { url: `${baseURL}/`, label: 'baseURL/' },
    { url: `${baseURL}/#`, label: 'baseURL/#' },
    { url: `${baseURL}/#/`, label: 'baseURL/#/' },
    { url: `${baseURL}/#/login`, label: 'baseURL/#/login' },
    { url: `${baseURL}/login`, label: 'baseURL/login' },
  ];

  let onLoginPage = false;
  let alreadyLoggedIn = false;

  for (const { url, label } of urlsToTry) {
    console.log(`[LOGIN] 尝试: ${label} → ${url}`);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForLoadState('networkidle').catch(() => page.waitForTimeout(1000));

      const bodyText = await page.locator('body').textContent().catch(() => '');
      const hasLoginForm = bodyText.includes('登录') && (bodyText.includes('密码') || bodyText.includes('password'));
      const hasDashboard = bodyText.includes('首页') || bodyText.includes('dashboard') || bodyText.includes('收件箱');
      const hasLoginInput = await page.locator('input[placeholder*="账号"]').first().isVisible().catch(() => false);

      if (hasLoginForm || hasLoginInput) {
        console.log(`[LOGIN] ✅ 找到登录页面: ${label}`);
        onLoginPage = true;
        break;
      }

      if (hasDashboard) {
        console.log(`[LOGIN] ✅ 已登录状态(检测到首页): ${label}`);
        alreadyLoggedIn = true;
        break;
      }
    } catch (e) {
      console.log(`[LOGIN] ❌ 访问失败: ${label} - ${(e as Error).message?.slice(0, 60)}`);
    }
  }

  if (alreadyLoggedIn) {
    console.log(`[LOGIN] ✅ 已经登录，无需操作`);
    return true;
  }

  if (!onLoginPage) {
    console.log(`[LOGIN] ❌ 未找到登录页面，尝试强制导航到 /#/login`);
    try {
      await page.goto(`${baseURL}/#/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForLoadState('networkidle').catch(() => page.waitForTimeout(1000));
    } catch {}
  }

  const loginInput = page.locator('input[placeholder*="账号"]').first();
  if (!(await loginInput.isVisible().catch(() => false))) {
    console.log(`[LOGIN] ❌ 找不到登录输入框`);
    return false;
  }

  const isReadonly = await loginInput.evaluate((el: HTMLInputElement) => el.readOnly).catch(() => false);
  if (isReadonly) {
    console.log(`[LOGIN] ⚠️ 账号输入框为 readonly，用 JS 赋值`);
    await loginInput.evaluate((el: HTMLInputElement, val: string) => {
      el.removeAttribute('readonly');
      el.value = val;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, cred.username);
  } else {
    await loginInput.click();
    await loginInput.fill('');
    await loginInput.fill(cred.username);
  }
  console.log(`[LOGIN] ✅ 账号已输入`);

  const pwdInput = page.locator('input[type="password"]').first();
  if (!(await pwdInput.isVisible().catch(() => false))) {
    console.log(`[LOGIN] ❌ 找不到密码输入框`);
    return false;
  }

  const pwdReadonly = await pwdInput.evaluate((el: HTMLInputElement) => el.readOnly).catch(() => false);
  if (pwdReadonly) {
    await pwdInput.evaluate((el: HTMLInputElement, val: string) => {
      el.removeAttribute('readonly');
      el.value = val;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, cred.password);
  } else {
    await pwdInput.click();
    await pwdInput.fill('');
    await pwdInput.fill(cred.password);
  }
  console.log(`[LOGIN] ✅ 密码已输入`);

  await page.waitForTimeout(500);

  const checkbox = page.locator('.el-checkbox').first();
  if (await checkbox.isVisible().catch(() => false)) {
    await checkbox.click();
    console.log(`[LOGIN] ✅ 已勾选用户协议`);
  }

  await page.waitForTimeout(300);

  const submitBtn = page.locator('button').filter({ hasText: '登' }).first();
  if (!(await submitBtn.isVisible().catch(() => false))) {
    console.log(`[LOGIN] ❌ 找不到登录按钮`);
    return false;
  }

  await submitBtn.waitFor({ state: 'visible' }).catch(() => {});
  await submitBtn.click({ force: true });
  console.log(`[LOGIN] ✅ 已点击登录`);

  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(1500);

  const afterURL = page.url();
  const afterText = await page.locator('body').textContent().catch(() => '');
  console.log(`[LOGIN] 登录后 URL: ${afterURL}`);

  const loginError = await page.locator('.el-message--error').first().isVisible().catch(() => false);
  if (loginError) {
    const errMsg = await page.locator('.el-message--error .el-message__content').first().textContent().catch(() => '未知错误');
    console.log(`[LOGIN] ❌ 登录失败: ${errMsg}`);
    return false;
  }

  if (afterText.includes('首页') || afterText.includes('收件箱')) {
    console.log(`[LOGIN] ✅ 登录成功`);
    return true;
  }

  if (afterURL.includes('/login') || (afterText.includes('登录') && !afterText.includes('退出') && !afterText.includes('注销'))) {
    console.log(`[LOGIN] ⚠️ 登录后仍停留在登录页`);
    return false;
  }

  console.log(`[LOGIN] ✅ 登录流程完成`);
  return true;
}
