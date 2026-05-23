import { test, expect } from '../../helpers/fixtures';
import { nav } from '../../helpers/nav';
import { login } from '../../helpers/login';
import * as fs from 'fs';
import * as crypto from 'crypto';

test('REG-038 @regression @p1 @bug-PTYR-1421 @upload @performance', async ({ page, baseURL }) => {
  if (!await login(page, baseURL!)) return;

  const testFiles = [
    { name: '1mb-file.pdf', size: 1 * 1024 * 1024 },
    { name: '10mb-file.pdf', size: 10 * 1024 * 1024 },
  ];

  for (const file of testFiles) {
    const filePath = `${__dirname}/../../../test-data/${file.name}`;
    const buffer = Buffer.alloc(file.size, 'A');
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, buffer);

    const originalHash = crypto.createHash('md5').update(buffer).digest('hex');

    const start = Date.now();
    const res = await page.request.post(`${baseURL}/api/confirmation/upload`, {
      multipart: { file: filePath },
    });
    const duration = Date.now() - start;
    console.log(`[PERF] ${file.name}: ${duration}ms`);
    expect(duration).toBeLessThanOrEqual(5000);

    const body = await res.json();
    expect(body.code).toBe(0);

    if (body.data?.fileUrl) {
      const downloadRes = await page.request.get(body.data.fileUrl);
      const downloaded = await downloadRes.body();
      expect(crypto.createHash('md5').update(downloaded).digest('hex')).toBe(originalHash);
    }

    try { fs.unlinkSync(filePath); } catch {}
  }
});



