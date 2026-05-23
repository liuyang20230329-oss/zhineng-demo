import type { FullConfig, FullResult, Suite, TestCase, TestResult, Reporter } from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface ApiLog {
  method: string;
  url: string;
  requestBody?: unknown;
  responseStatus: number;
  responseBody?: unknown;
  durationMs: number;
  timestamp: string;
}

interface ReportEntry {
  testName: string;
  status: string;
  duration: number;
  error?: string;
  errorStack?: string;
  screenshots: string[];
  apiLogs: ApiLog[];
  filePath?: string;
  tags: string[];
  startTime: number;
}

export default class MdReporter implements Reporter {
  private startTime!: number;
  private entries: ReportEntry[] = [];
  private suiteName = '';

  onBegin(_config: FullConfig, suite: Suite) {
    this.startTime = Date.now();
    this.suiteName = suite.title || '自动化回归测试报告';
  }

  onTestBegin(test: TestCase, result: TestResult) {
    (result as any).__startTime = Date.now();
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const tags = (test.title.match(/@[\w-]+/g) || []);
    const screenshots: string[] = [];
    const apiLogs: ApiLog[] = [];

    for (const att of result.attachments) {
      if (att.contentType?.startsWith('image/')) {
        screenshots.push(att.name || 'screenshot');
      }
      if (att.name?.startsWith('api-') && att.body) {
        try {
          apiLogs.push(JSON.parse(att.body.toString('utf-8')));
        } catch {}
      }
    }

    const entry: ReportEntry = {
      testName: test.title,
      status: result.status,
      duration: result.duration,
      filePath: test.location.file,
      tags,
      screenshots,
      apiLogs,
      startTime: (result as any).__startTime || 0,
    };

    if (result.error) {
      const lines = result.error.stack?.split('\n') || [];
      entry.error = result.error.message || String(result.error);
      entry.errorStack = lines.slice(0, 8).join('\n');
    }

    this.entries.push(entry);
  }

  onEnd(_result: FullResult) {
    const totalDuration = Date.now() - this.startTime;
    const passed = this.entries.filter((r) => r.status === 'passed').length;
    const failed = this.entries.filter((r) => r.status === 'failed').length;
    const skipped = this.entries.filter((r) => r.status === 'skipped').length;

    const reportsDir = path.resolve(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

    const md = this.renderMarkdown({ passed, failed, skipped, totalDuration });
    const html = this.renderHTML({ passed, failed, skipped, totalDuration });

    fs.writeFileSync(path.join(reportsDir, 'test-report.md'), md, 'utf-8');
    fs.writeFileSync(path.join(reportsDir, 'test-report.json'), JSON.stringify(this.entries, null, 2), 'utf-8');
    fs.writeFileSync(path.join(reportsDir, 'report.html'), html, 'utf-8');

    console.log(`\n══════════════════════════════════════`);
    console.log(`  📄 报告已导出:`);
    console.log(`  📝 Markdown: reports/test-report.md`);
    console.log(`  🌐 HTML:     reports/report.html`);
    console.log(`  📊 JSON:     reports/test-report.json`);
    console.log(`  🖼  Playwright: reports/html/index.html`);
    console.log(`────────────── 结果 ──────────────`);
    console.log(`  总计: ${this.entries.length}`);
    console.log(`  ✅ 通过: ${passed}`);
    console.log(`  ❌ 失败: ${failed}`);
    console.log(`  ⏭ 跳过: ${skipped}`);
    console.log(`  通过率: ${this.entries.length === 0 ? '0%' : ((passed / this.entries.length) * 100).toFixed(1) + '%'}`);
    console.log(`  耗时: ${(totalDuration / 1000).toFixed(1)}s`);
    console.log(`══════════════════════════════════════\n`);
  }

  private renderMarkdown(stats: { passed: number; failed: number; skipped: number; totalDuration: number }): string {
    const lines: string[] = [];
    lines.push('# 自动化回归测试报告');
    lines.push('');
    lines.push(`**生成时间**: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
    lines.push(`**执行耗时**: ${(stats.totalDuration / 1000).toFixed(1)}s`);
    lines.push(`**主机**: ${os.hostname()}`);
    lines.push('');

    lines.push('## 执行概览');
    lines.push('| 指标 | 数值 |');
    lines.push('|------|------|');
    lines.push(`| 总用例 | ${this.entries.length} |`);
    lines.push(`| ✅ 通过 | ${stats.passed} |`);
    lines.push(`| ❌ 失败 | ${stats.failed} |`);
    lines.push(`| ⏭ 跳过 | ${stats.skipped} |`);
    lines.push(`| 通过率 | ${this.entries.length === 0 ? '100%' : ((stats.passed / this.entries.length) * 100).toFixed(1) + '%'} |`);
    lines.push('');

    if (stats.failed > 0) {
      lines.push('## ❌ 失败详情');
      for (const r of this.entries.filter((r) => r.status === 'failed')) {
        lines.push('');
        lines.push(`### ${r.testName}`);
        lines.push(`- **耗时**: ${(r.duration / 1000).toFixed(1)}s`);
        lines.push(`- **标签**: ${r.tags.join(' ')}`);
        lines.push('');
        lines.push('```text');
        lines.push(r.error || '无错误信息');
        if (r.errorStack) lines.push(r.errorStack);
        lines.push('```');
        if (r.screenshots.length > 0) {
          lines.push(`- **截图**: \`${r.screenshots.join('`, `')}\``);
        }
        if (r.apiLogs.length > 0) {
          lines.push('- **API 请求**:');
          for (const log of r.apiLogs) {
            lines.push(`  - \`${log.method} ${log.url}\` → ${log.responseStatus} (${log.durationMs}ms)`);
          }
        }
      }
      lines.push('');
    }

    if (stats.skipped > 0) {
      lines.push('## ⏭ 跳过用例');
      for (const r of this.entries.filter((r) => r.status === 'skipped')) {
        lines.push(`- ${r.testName}`);
      }
      lines.push('');
    }

    lines.push('## ✅ 全部用例');
    lines.push('| # | 用例 | 状态 | 耗时 | 标签 |');
    lines.push('|---|------|------|------|------|');
    let idx = 0;
    for (const r of this.entries) {
      idx++;
      const icon = r.status === 'passed' ? '✅' : r.status === 'failed' ? '❌' : '⏭';
      lines.push(`| ${idx} | ${r.testName} | ${icon} ${r.status} | ${(r.duration! / 1000).toFixed(1)}s | ${r.tags.join(' ')} |`);
    }
    lines.push('');
    lines.push('---');
    lines.push(`*由 Playwright 自动化回归框架生成于 ${new Date().toISOString()}*`);
    return lines.join('\n');
  }

  private renderHTML(stats: { passed: number; failed: number; skipped: number; totalDuration: number }): string {
    const passRate = this.entries.length === 0 ? 100 : ((stats.passed / this.entries.length) * 100).toFixed(1);

    const rows = this.entries.map((r, i) => {
      const statusIcon = r.status === 'passed' ? '✅' : r.status === 'failed' ? '❌' : '⏭';
      const statusClass = r.status === 'passed' ? 'pass' : r.status === 'failed' ? 'fail' : 'skip';
      const duration = (r.duration! / 1000).toFixed(1);

      let detailHtml = '';
      if (r.status === 'failed' && r.error) {
        detailHtml = `<div class="error-detail"><pre>${this.escapeHtml(r.error)}${r.errorStack ? '\n' + this.escapeHtml(r.errorStack) : ''}</pre></div>`;
      }
      if (r.apiLogs.length > 0) {
        detailHtml += '<div class="api-logs"><details><summary>API 请求详情 (' + r.apiLogs.length + ' 条)</summary>';
        for (const log of r.apiLogs) {
          const slow = log.durationMs > 3000 ? ' class="slow-request"' : '';
          detailHtml += `<div class="api-entry"${slow}>`;
          detailHtml += `<span class="api-method ${log.method.toLowerCase()}">${log.method}</span> `;
          detailHtml += `<code>${this.escapeHtml(log.url)}</code> `;
          detailHtml += `<span class="api-status">${log.responseStatus}</span> `;
          detailHtml += `<span class="api-duration">${log.durationMs}ms</span>`;
          if (log.requestBody) {
            detailHtml += `<div class="api-body"><pre>${this.escapeHtml(JSON.stringify(log.requestBody, null, 2))}</pre></div>`;
          }
          detailHtml += `</div>`;
        }
        detailHtml += '</details></div>';
      }
      if (r.screenshots.length > 0) {
        detailHtml += '<div class="screenshots">';
        for (const s of r.screenshots) {
          detailHtml += `<div>📷 ${this.escapeHtml(s)}</div>`;
        }
        detailHtml += '</div>';
      }

      return `<tr class="${statusClass}" onclick="toggleRow(this)">
        <td>${i + 1}</td>
        <td>${this.escapeHtml(r.testName)}</td>
        <td><span class="badge ${statusClass}">${statusIcon} ${r.status}</span></td>
        <td>${duration}s</td>
        <td>${r.tags.map((t) => `<code>${this.escapeHtml(t)}</code>`).join(' ')}</td>
      </tr>
      <tr class="detail-row" style="display:none"><td colspan="5">${detailHtml}</td></tr>`;
    }).join('\n');

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>自动化回归测试报告</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f7fa; color: #333; padding: 20px; }
  .container { max-width: 1400px; margin: 0 auto; }
  h1 { font-size: 24px; margin-bottom: 20px; color: #1a1a2e; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 24px; }
  .stat-card { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); text-align: center; }
  .stat-card .number { font-size: 32px; font-weight: 700; }
  .stat-card .label { font-size: 13px; color: #888; margin-top: 4px; }
  .stat-card.total .number { color: #333; }
  .stat-card.pass .number { color: #22c55e; }
  .stat-card.fail .number { color: #ef4444; }
  .stat-card.skip .number { color: #f59e0b; }
  .stat-card.rate .number { color: #3b82f6; }
  .stat-card.duration .number { font-size: 24px; color: #8b5cf6; }
  .filters { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
  .filters button { padding: 8px 16px; border: 1px solid #ddd; border-radius: 8px; background: #fff; cursor: pointer; font-size: 13px; transition: all .2s; }
  .filters button:hover { border-color: #3b82f6; color: #3b82f6; }
  .filters button.active { background: #3b82f6; color: #fff; border-color: #3b82f6; }
  .search-box input { padding: 8px 16px; border: 1px solid #ddd; border-radius: 8px; font-size: 13px; width: 240px; outline: none; }
  .search-box input:focus { border-color: #3b82f6; }
  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
  th { background: #f8fafc; text-align: left; padding: 12px 16px; font-size: 13px; font-weight: 600; color: #64748b; border-bottom: 2px solid #e2e8f0; }
  td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
  tr:hover { background: #f8fafc; }
  tr.detail-row td { padding: 0 16px 16px; background: #fafbfc; }
  tr.fail td:first-child { border-left: 3px solid #ef4444; }
  tr.pass td:first-child { border-left: 3px solid #22c55e; }
  tr.skip td:first-child { border-left: 3px solid #f59e0b; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; }
  .badge.pass { background: #dcfce7; color: #166534; }
  .badge.fail { background: #fee2e2; color: #991b1b; }
  .badge.skip { background: #fef3c7; color: #92400e; }
  code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 12px; color: #475569; }
  .error-detail pre { background: #1e293b; color: #e2e8f0; padding: 12px 16px; border-radius: 8px; font-size: 12px; overflow-x: auto; margin-top: 8px; }
  .api-logs { margin-top: 8px; }
  .api-entry { padding: 8px 12px; margin: 4px 0; background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 12px; }
  .api-entry.slow-request { border-left: 3px solid #f59e0b; }
  .api-method { display: inline-block; padding: 1px 6px; border-radius: 4px; font-weight: 600; font-size: 11px; color: #fff; width: 50px; text-align: center; }
  .api-method.get { background: #3b82f6; }
  .api-method.post { background: #22c55e; }
  .api-method.put { background: #f59e0b; }
  .api-method.delete { background: #ef4444; }
  .api-status { font-weight: 600; margin-left: 8px; }
  .api-duration { margin-left: 8px; color: #888; }
  .api-body pre { background: #f8fafc; padding: 8px; border-radius: 4px; font-size: 11px; margin-top: 4px; max-height: 200px; overflow: auto; }
  details summary { cursor: pointer; font-weight: 500; color: #3b82f6; font-size: 13px; padding: 4px 0; }
  details summary:hover { color: #1d4ed8; }
  .screenshots { margin-top: 8px; color: #888; font-size: 12px; }
  .cursor-pointer { cursor: pointer; }
  .footer { text-align: center; padding: 24px; color: #94a3b8; font-size: 12px; }
</style>
</head>
<body>
<div class="container">
  <h1>📊 自动化回归测试报告</h1>
  <div class="stats">
    <div class="stat-card total"><div class="number">${this.entries.length}</div><div class="label">总用例</div></div>
    <div class="stat-card pass"><div class="number">${stats.passed}</div><div class="label">✅ 通过</div></div>
    <div class="stat-card fail"><div class="number">${stats.failed}</div><div class="label">❌ 失败</div></div>
    <div class="stat-card skip"><div class="number">${stats.skipped}</div><div class="label">⏭ 跳过</div></div>
    <div class="stat-card rate"><div class="number">${passRate}%</div><div class="label">通过率</div></div>
    <div class="stat-card duration"><div class="number">${(stats.totalDuration / 1000).toFixed(1)}s</div><div class="label">总耗时</div></div>
  </div>

  <div class="filters">
    <button class="active" onclick="filter('all')">全部</button>
    <button onclick="filter('passed')">✅ 通过</button>
    <button onclick="filter('failed')">❌ 失败</button>
    <button onclick="filter('skipped')">⏭ 跳过</button>
    <div class="search-box"><input type="text" placeholder="搜索用例名称..." oninput="search(this.value)"></div>
  </div>

  <table>
    <thead><tr><th>#</th><th>用例名称</th><th>状态</th><th>耗时</th><th>标签</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="footer">生成时间: ${new Date().toLocaleString('zh-CN')} | 由 Playwright 自动化回归框架生成</div>
</div>

<script>
  function toggleRow(tr) { var detail = tr.nextElementSibling; if (detail && detail.classList.contains('detail-row')) { detail.style.display = detail.style.display === 'none' ? 'table-row' : 'none'; } }
  function filter(status) { document.querySelectorAll('.filters button').forEach(function(b) { b.classList.remove('active'); }); event.target.classList.add('active'); document.querySelectorAll('tbody tr:not(.detail-row)').forEach(function(r) { if (status === 'all') { r.style.display = ''; } else { r.style.display = r.classList.contains(status) ? '' : 'none'; } }); }
  function search(val) { var q = val.toLowerCase(); document.querySelectorAll('tbody tr:not(.detail-row)').forEach(function(r) { var name = r.cells[1].textContent.toLowerCase(); r.style.display = name.includes(q) ? '' : 'none'; }); }
</script>
</body>
</html>`;
  }

  private escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}
