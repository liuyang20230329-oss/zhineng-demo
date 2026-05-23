import { APIRequestContext, APIResponse } from '@playwright/test';

export async function apiGet(context: APIRequestContext, url: string, token?: string): Promise<APIResponse> {
  return context.get(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function apiPost(context: APIRequestContext, url: string, data: unknown, token?: string): Promise<APIResponse> {
  return context.post(url, {
    data,
    headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' },
  });
}

export async function apiUpload(context: APIRequestContext, url: string, filePath: string, token?: string): Promise<APIResponse> {
  return context.post(url, {
    multipart: {
      file: filePath,
    },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function assertResponseOK(response: APIResponse): Promise<void> {
  const status = response.status();
  if (status < 200 || status >= 300) {
    const body = await response.text();
    throw new Error(`API ${response.url()} returned ${status}: ${body}`);
  }
}
