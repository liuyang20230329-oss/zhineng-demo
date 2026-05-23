import { Page } from '@playwright/test';
import { APIRequestContext } from 'playwright';
import { pageURL } from './nav';

export class DataManager {
  constructor(
    private page: Page,
    private api: APIRequestContext,
    private baseURL: string,
    private skip: () => void,
  ) {}

  private async hasVisible(selector: string): Promise<boolean> {
    const el = this.page.locator(selector);
    return (await el.count()) > 0 && (await el.first().isVisible());
  }

  private async apiPost(path: string, data?: unknown) {
    return this.api.post(`${this.baseURL}${path}`, { data });
  }

  private async goPage(path: string) {
    const url = pageURL(this.baseURL, path);
    await this.page.goto(url, { waitUntil: 'load', timeout: 120000 });
  }

  async ensureWorkpaperFiles(): Promise<string | null> {
    for (const method of ['api', 'ui'] as const) {
      if (method === 'api') {
        const res = await this.apiPost('/api/workpaper/list', { projectId: 'hz-decheng' });
        if (res.ok()) {
          const body = await res.json();
          if (body.data?.length > 0) return body.data[0].id;
        }
        const createRes = await this.apiPost('/api/workpaper/generate', { projectId: 'hz-decheng' });
        if (createRes.ok()) {
          const listRes = await this.apiPost('/api/workpaper/list', { projectId: 'hz-decheng' });
          if (listRes.ok()) {
            const list = await listRes.json();
            if (list.data?.length > 0) return list.data[0].id;
          }
        }
      }

      if (method === 'ui') {
        await this.goPage('/projects/hz-decheng/workpaper');
        await this.page.waitForLoadState('load');
        if (await this.hasVisible('.workpaper-file-item')) {
          return await this.page.locator('.workpaper-file-item').first().getAttribute('data-id');
        }
        if (await this.hasVisible('button:has-text("生成底稿")')) {
          await this.page.locator('button:has-text("生成底稿")').first().click();
          await this.page.waitForSelector('.task-status--completed', { timeout: 120000 });
          await this.page.reload();
          await this.page.waitForSelector('.workpaper-file-item', { timeout: 10000 });
          return await this.page.locator('.workpaper-file-item').first().getAttribute('data-id');
        }
      }
    }
    return null;
  }

  async ensureRecycleBinHasData(): Promise<boolean> {
    await this.goPage('/recycle-bin');
    if (await this.hasVisible('.recycle-item')) return true;

    const fileId = await this.ensureWorkpaperFiles();
    if (!fileId) return false;

    await this.goPage('/projects/hz-decheng/workpaper');

    const res = await this.apiPost('/api/workpaper/delete', { fileId });
    if (res.ok()) {
      await this.goPage('/recycle-bin');
      return await this.hasVisible('.recycle-item');
    }

    if (await this.hasVisible('button:has-text("删除")')) {
      await this.page.locator('button:has-text("删除")').first().click();
      const confirm = this.page.locator('.el-message-box button:has-text("确认"), .confirm-btn:has-text("确认")');
      if (await confirm.isVisible()) {
        await confirm.click();
        await this.goPage('/recycle-bin');
        return await this.hasVisible('.recycle-item');
      }
    }
    return false;
  }

  async ensureTrialBalanceData(): Promise<boolean> {
    await this.goPage('/projects/hz-decheng/trial-balance');
    if (await this.hasVisible('.trial-balance-table tr')) return true;

    const res = await this.apiPost('/api/trial-balance/generate', { projectId: 'hz-decheng' });
    if (res.ok()) {
      await this.page.reload();
      return await this.hasVisible('.trial-balance-table tr');
    }
    return false;
  }

  async ensureAdjustmentEntry(subjectName: string, amount: number): Promise<boolean> {
    await this.goPage('/projects/hz-decheng/adjournment');
    const res = await this.apiPost('/api/adjournment/submit', { projectId: 'hz-decheng', subjectName, amount });
    if (res.ok()) return true;

    if (await this.hasVisible('button:has-text("新增调整分录")')) {
      await this.page.locator('button:has-text("新增调整分录")').click();
      await this.page.fill('input[name="subjectName"]', subjectName);
      await this.page.fill('input[name="amount"]', String(amount));
      await this.page.locator('button:has-text("提交")').click();
      return true;
    }
    return false;
  }

  async ensureFixedAssetsData(): Promise<boolean> {
    await this.goPage('/projects/hz-decheng/fixed-assets');
    if (await this.hasVisible('.fixed-assets-table tr')) return true;

    const res = await this.apiPost('/api/fixed-assets/generate', { projectId: 'hz-decheng' });
    if (res.ok()) {
      await this.page.reload();
      return await this.hasVisible('.fixed-assets-table tr');
    }
    return false;
  }

  async ensureKnowledgeDocs(): Promise<boolean> {
    await this.goPage('/knowledge');
    if (await this.hasVisible('.knowledge-list-item, .search-result-item')) return true;

    const res = await this.apiPost('/api/knowledge/create', {
      title: '测试文档-标题命中关键词',
      content: '这是一篇包含测试关键词的正文内容',
    });
    return res.ok();
  }

  async ensureExpenseReport(): Promise<boolean> {
    await this.goPage('/expense-reports');
    if (await this.hasVisible('.expense-report-item')) return true;

    const res = await this.apiPost('/api/expense-reports/create', { title: '测试报销单', amount: 1000 });
    if (res.ok()) return true;

    if (await this.hasVisible('button:has-text("新建报销单")')) {
      await this.page.locator('button:has-text("新建报销单")').click();
      return true;
    }
    return false;
  }

  async ensureBankConfirmation(): Promise<boolean> {
    await this.goPage('/confirmation/bank');
    if (await this.hasVisible('select, .el-select, .ant-select')) return true;

    const res = await this.apiPost('/api/confirmation/create', { type: 'bank', projectId: 'hz-decheng' });
    if (res.ok()) {
      await this.page.reload();
      return true;
    }
    return false;
  }

  async ensureSignContract(): Promise<boolean> {
    for (const state of ['pending', 'completed'] as const) {
      const res = await this.apiPost('/api/sign/list', { status: state });
      if (res.ok()) {
        const body = await res.json();
        if (body.data?.length > 0) return true;
      }
    }
    const createRes = await this.apiPost('/api/sign/create', { title: '测试签署合同', projectId: 'hz-decheng' });
    return createRes.ok();
  }

  async ensureArchiveData(): Promise<boolean> {
    const res = await this.apiPost('/api/archive/list', { projectId: 'hz-decheng' });
    if (res.ok()) {
      const body = await res.json();
      if (body.data?.length > 0) return true;
    }
    const createRes = await this.apiPost('/api/archive/create', { projectId: 'hz-decheng', title: '测试档案' });
    return createRes.ok();
  }

  async ensureDisclosureData(): Promise<boolean> {
    await this.goPage('/projects/hz-decheng/disclosure');
    if (await this.hasVisible('.disclosure-table tr')) return true;

    const res = await this.apiPost('/api/disclosure/generate', { projectId: 'hz-decheng' });
    if (res.ok()) {
      await this.page.reload();
      return await this.hasVisible('.disclosure-table tr');
    }
    return false;
  }

  async ensureAuxBalanceData(): Promise<boolean> {
    await this.goPage('/auxiliary-balance');
    if (await this.hasVisible('.category-tab, .el-tabs__item')) return true;

    const res = await this.apiPost('/api/auxiliary-balance/generate', { projectId: 'hz-decheng' });
    return res.ok();
  }

  async ensureIndexTable(): Promise<boolean> {
    await this.goPage('/workpaper/table-index');
    if (await this.hasVisible('.index-table .index-cell')) return true;

    const res = await this.apiPost('/api/index/init', { projectId: 'hz-decheng' });
    if (res.ok()) {
      await this.page.reload();
      return await this.hasVisible('.index-table .index-cell');
    }
    return false;
  }

  async ensureReviewTasks(): Promise<boolean> {
    await this.goPage('/review/pending');
    if (await this.hasVisible('button:has-text("复核通过")')) return true;

    const res = await this.apiPost('/api/review/create-task', { projectId: 'hz-decheng', taskType: 'review' });
    if (res.ok()) {
      await this.page.reload();
      return await this.hasVisible('button:has-text("复核通过")');
    }
    return false;
  }

  async ensureDataCheckReady(): Promise<boolean> {
    await this.goPage('/projects/hz-decheng/data-check');
    if (await this.hasVisible('button:has-text("执行校验")')) return true;
    return false;
  }
}
