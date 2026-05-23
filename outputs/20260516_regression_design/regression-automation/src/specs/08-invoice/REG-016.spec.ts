import { test, expect } from '../../helpers/fixtures';
import { nav } from '../../helpers/nav';
import { login } from '../../helpers/login';
import { mockOCRResponse } from '../../helpers/mock-server';

test('REG-016 @regression @p1 @bug-PTYR-2543 @ocr-mock', async ({ page, baseURL }) => {
  if (!await login(page, baseURL!)) return;

  for (const scenario of ['timeout', 'fail', 'no_result'] as const) {
    await mockOCRResponse(page, scenario);
    const res = await page.request.post(`${baseURL}/api/invoice/upload`, {
      multipart: { file: 'test-data/sample-invoice.png' },
    });
    const body = await res.json();
    expect(body.code).toBeDefined();
    if (scenario !== 'timeout') expect(body).toHaveProperty('data');
  }
});



