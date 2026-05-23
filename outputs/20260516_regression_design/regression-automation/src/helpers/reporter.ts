import { test } from '@playwright/test';

export function logStep(stepName: string): void {
  test.step(stepName, () => {});
}

export async function captureOnFailure(page: import('@playwright/test').Page, testName: string): Promise<void> {
  const screenshotPath = `reports/screenshots/${testName}-${Date.now()}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`[SCREENSHOT] Saved to ${screenshotPath}`);
}
