import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL;
  console.log('');
  console.log('══════════════════════════════════════════');
  console.log(`  知能系统自动化回归测试`);
  console.log(`  目标地址: ${baseURL || '未设置'}`);
  console.log(`  测试总数: 40 条用例`);
  console.log(`  Playwright: ${require('@playwright/test/package.json').version}`);
  console.log('══════════════════════════════════════════');
  console.log('');
}

export default globalSetup;
