import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '.env') });

import { getBaseURL } from './src/helpers/config';
const rawBaseURL = getBaseURL();

export default defineConfig({
  testDir: './src/specs',
  globalSetup: require.resolve('./src/helpers/global-setup'),
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['json', { outputFile: 'reports/test-results.json' }],
    ['./src/reporter/md-reporter.ts'],
    ['list'],
  ],
  timeout: 180000,
  expect: { timeout: 60000 },
  use: {
    baseURL: rawBaseURL,
    headless: process.env.HEADLESS === 'true',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 60000,
    navigationTimeout: 120000,
    ignoreHTTPSErrors: true,
    channel: 'chrome',
  },
  projects: [
    {
      name: 'smoke',
      testMatch: '**/smoke/**/*.spec.ts',
    },
    {
      name: 'p0',
      testMatch: '**/*.spec.ts',
      grep: /@p0/,
    },
    {
      name: 'p1',
      testMatch: '**/*.spec.ts',
      grep: /@p1/,
    },
    {
      name: 'p2',
      testMatch: '**/*.spec.ts',
      grep: /@p2/,
    },
    {
      name: 'regression',
      testMatch: '**/*.spec.ts',
      grep: /@regression/,
    },
    {
      name: 'performance',
      testMatch: '**/*.spec.ts',
      grep: /@performance/,
    },
  ],
});
