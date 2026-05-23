import { test, expect } from '../../helpers/fixtures';
import { nav } from '../../helpers/nav';
import { login } from '../../helpers/login';

test('REG-032 @regression @p1 @bug-PTYR-1779 @performance', async ({ page, baseURL, data }) => {
  if (!await login(page, baseURL!)) return;
  if (!await data.ensureArchiveData()) return;

  const timings: number[] = [];
  for (let i = 0; i < 20; i++) {
    const start = Date.now();
    const res = await page.request.post(`${baseURL}/api/archive/reject`, {
      data: { archiveId: `ARCHIVE-${i}`, reason: '测试拒绝' },
    });
    timings.push(Date.now() - start);
    const body = await res.json();
    expect(body.data?.status).toBe('rejected');
  }

  timings.sort((a, b) => a - b);
  const p95 = timings[Math.floor(timings.length * 0.95)];
  console.log(`[PERF] max=${Math.max(...timings)}ms, P95=${p95}ms`);
  expect(Math.max(...timings)).toBeLessThanOrEqual(3000);
  expect(p95).toBeLessThanOrEqual(5000);
});



