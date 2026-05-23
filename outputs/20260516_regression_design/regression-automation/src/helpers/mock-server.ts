import { Page } from '@playwright/test';

export interface MockRoute {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string | RegExp;
  status: number;
  body: unknown;
}

export async function setupMocks(page: Page, mocks: MockRoute[]): Promise<void> {
  for (const mock of mocks) {
    await page.route(mock.url, async (route) => {
      if (route.request().method() !== mock.method) {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: mock.status,
        contentType: 'application/json',
        body: JSON.stringify(mock.body),
      });
    });
  }
}

export async function clearMocks(page: Page): Promise<void> {
  await page.unrouteAll({ behavior: 'wait' });
}

export async function mockOCRResponse(page: Page, scenario: 'success' | 'fail' | 'timeout' | 'no_result'): Promise<void> {
  const responses: Record<string, unknown> = {
    success: { code: 0, data: { recognized: true, text: '发票号:12345678', amount: 1000.00 }, message: 'success' },
    fail: { code: 1001, data: null, message: '图片识别失败，请重试' },
    timeout: { code: 1002, data: null, message: '识别服务超时' },
    no_result: { code: 0, data: { recognized: false, text: '' }, message: '未识别到发票信息' },
  };

  await page.route('**/api/ocr/recognize**', async (route) => {
    await route.fulfill({
      status: scenario === 'timeout' ? 504 : 200,
      contentType: 'application/json',
      body: JSON.stringify(responses[scenario]),
    });
  });
}

export async function mockPlatformCallback(page: Page, scenario: 'approved' | 'empty' | 'completed'): Promise<void> {
  const responses: Record<string, unknown> = {
    approved: { code: 0, data: { status: 'approved', projectId: 'PROJ-001' }, message: 'success' },
    empty: { code: 0, data: null, message: '无报备数据' },
    completed: { code: 0, data: { status: 'completed', projectId: 'PROJ-001' }, message: 'success' },
  };

  await page.route('**/api/platform/callback**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(responses[scenario]),
    });
  });
}

export async function mockSMSService(page: Page, scenario: 'success' | 'fail' | 'rate_limit'): Promise<void> {
  const responses: Record<string, unknown> = {
    success: { code: 0, data: { smsId: 'SMS-001', status: 'sent' }, message: 'success' },
    fail: { code: 2001, data: null, message: '短信发送失败' },
    rate_limit: { code: 2002, data: null, message: '短信发送太频繁，请稍后重试' },
  };

  await page.route('**/api/sms/send**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(responses[scenario]),
    });
  });
}
