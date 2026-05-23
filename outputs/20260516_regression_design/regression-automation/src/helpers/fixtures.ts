import { test as base } from '@playwright/test';
import { DataManager } from './ensure-data';
import { ApiLogger } from './api-logger';
import { USERS, getBaseURL } from './config';

export const test = base.extend<{ data: DataManager; api: ApiLogger; users: typeof USERS }>({
  data: async ({ page, request, baseURL }, use, testInfo) => {
    const dm = new DataManager(page, request, baseURL!, () => testInfo.skip());
    await use(dm);
  },

  api: async ({ request }, use, testInfo) => {
    const logger = new ApiLogger(request, testInfo);
    await use(logger);
  },

  users: async ({}, use) => {
    await use(USERS);
  },
});

export { expect } from '@playwright/test';
export { USERS, getBaseURL } from './config';
