import { Page } from '@playwright/test';

export function pageURL(baseURL: string, path: string): string {
  return `${baseURL}/#${path.startsWith('/') ? path : '/' + path}`;
}

export async function nav(page: Page, baseURL: string, path: string): Promise<void> {
  const url = pageURL(baseURL, path);
  console.log(`[NAV] ${url}`);
  await page.goto(url, { waitUntil: 'load', timeout: 120000 });
}
