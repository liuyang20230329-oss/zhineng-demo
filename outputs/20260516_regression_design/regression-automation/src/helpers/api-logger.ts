import { APIRequestContext, APIResponse, TestInfo } from '@playwright/test';

export interface ApiLogEntry {
  method: string;
  url: string;
  requestBody?: unknown;
  responseStatus: number;
  responseBody?: unknown;
  durationMs: number;
  timestamp: string;
}

export class ApiLogger {
  logs: ApiLogEntry[] = [];

  constructor(private request: APIRequestContext, private testInfo?: TestInfo) {}

  async get(url: string, options?: Parameters<APIRequestContext['get']>[1]): Promise<APIResponse> {
    return this.log('GET', url, undefined, () => this.request.get(url, options));
  }

  async post(url: string, data?: unknown, options?: Parameters<APIRequestContext['post']>[1]): Promise<APIResponse> {
    return this.log('POST', url, data, () => this.request.post(url, { ...options, data }));
  }

  async put(url: string, data?: unknown): Promise<APIResponse> {
    return this.log('PUT', url, data, () => this.request.put(url, { data }));
  }

  async del(url: string): Promise<APIResponse> {
    return this.log('DELETE', url, undefined, () => this.request.delete(url));
  }

  private async log(method: string, url: string, requestBody: unknown | undefined, fn: () => Promise<APIResponse>): Promise<APIResponse> {
    const start = Date.now();
    const response = await fn();
    const durationMs = Date.now() - start;

    let responseBody: unknown;
    try {
      const text = await response.text();
      try { responseBody = JSON.parse(text); } catch { responseBody = text.slice(0, 500); }
    } catch { responseBody = '<unreadable>'; }

    const entry: ApiLogEntry = {
      method,
      url: url.length > 100 ? url.slice(0, 100) + '...' : url,
      requestBody: typeof requestBody === 'object' ? requestBody : undefined,
      responseStatus: response.status(),
      responseBody,
      durationMs,
      timestamp: new Date().toISOString(),
    };

    this.logs.push(entry);

    if (this.testInfo) {
      this.testInfo.attachments.push({
        name: `api-${method}-${url.replace(/[^a-zA-Z0-9]/g, '_').slice(-50)}`,
        contentType: 'application/json',
        body: Buffer.from(JSON.stringify(entry, null, 2)),
      });
    }

    return response;
  }

  getSlowRequests(thresholdMs = 3000): ApiLogEntry[] {
    return this.logs.filter((l) => l.durationMs > thresholdMs);
  }

  getFailedRequests(): ApiLogEntry[] {
    return this.logs.filter((l) => l.responseStatus >= 400);
  }

  summary(): string {
    if (this.logs.length === 0) return '无 API 请求';
    const avg = Math.round(this.logs.reduce((s, l) => s + l.durationMs, 0) / this.logs.length);
    const max = Math.max(...this.logs.map((l) => l.durationMs));
    const failed = this.getFailedRequests().length;
    const slow = this.getSlowRequests().length;
    return `总请求: ${this.logs.length} | 平均: ${avg}ms | 最慢: ${max}ms | 失败: ${failed} | 慢查询(>3s): ${slow}`;
  }
}
