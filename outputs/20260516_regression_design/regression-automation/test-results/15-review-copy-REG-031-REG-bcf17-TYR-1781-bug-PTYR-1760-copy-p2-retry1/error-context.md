# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 15-review-copy\REG-031.spec.ts >> REG-031 @regression @p2 @bug-PTYR-1781 @bug-PTYR-1760 @copy
- Location: src\specs\15-review-copy\REG-031.spec.ts:6:5

# Error details

```
Error: page.waitForSelector: Target page, context or browser has been closed
Call log:
  - waiting for locator('.opinion-content') to be visible

```

# Test source

```ts
  1  | import { test, expect } from '../../helpers/fixtures';
  2  | import { nav } from '../../helpers/nav';
  3  | import { login } from '../../helpers/login';
  4  | import * as fs from 'fs';
  5  | 
  6  | test('REG-031 @regression @p2 @bug-PTYR-1781 @bug-PTYR-1760 @copy', async ({ page, baseURL }) => {
  7  |   if (!await login(page, baseURL!)) return;
  8  |   await nav(page, baseURL!, `/review/opinions`);
> 9  |   await page.waitForSelector('.opinion-content');
     |              ^ Error: page.waitForSelector: Target page, context or browser has been closed
  10 | 
  11 |   const pageContent = await page.locator('.opinion-content, .main-content').textContent() || '';
  12 |   expect(pageContent).not.toContain('证据池意见');
  13 |   expect(pageContent).toContain('审计证据意见');
  14 | 
  15 |   const res = await page.request.get(`${baseURL}/api/review/opinions`);
  16 |   const body = await res.json();
  17 |   expect(JSON.stringify(body)).not.toContain('证据池意见');
  18 | 
  19 |   const downloadPromise = page.waitForEvent('download');
  20 |   await page.locator('button:has-text("导出")').click();
  21 |   const download = await downloadPromise;
  22 |   const filePath = await download.path();
  23 |   if (filePath) {
  24 |     const fileContent = fs.readFileSync(filePath, 'utf-8');
  25 |     expect(fileContent).not.toContain('证据池意见');
  26 |   }
  27 | });
  28 | 
  29 | 
  30 | 
  31 | 
```